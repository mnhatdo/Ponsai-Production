import { Request, Response } from 'express';
import Order from '../models/Order';
import momoService from '../services/momoService';
import exchangeRateService from '../services/exchangeRateService';
import manualPaymentService, { MANUAL_PAYMENT_METHOD } from '../services/manualPaymentService';
import cardPaymentService, { CARD_PAYMENT_METHOD } from '../services/cardPaymentService';
import bankTransferService, { BANK_TRANSFER_METHOD } from '../services/bankTransferService';
import paymentLifecycle from '../services/paymentLifecycleManager';
import { AuthRequest } from '../middleware/auth';

/**
 * Initiate MOMO payment for an order
 * 
 * Luồng xử lý:
 * 1. Validate user authentication & order existence
 * 2. Validate order status (chưa thanh toán, chưa bị hủy)
 * 3. Chuyển đổi số tiền từ GBP sang VND (chỉ cho MoMo)
 * 4. Gửi request đến MoMo API
 * 5. Lưu thông tin thanh toán vào order
 */
export const initiateMomoPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { orderId } = req.body;
    const userId = req.user?.id;

    console.log('\n🚀 [Payment] Starting MoMo payment initiation...');
    console.log('👤 [Payment] User ID:', userId);
    console.log('📦 [Payment] Order ID:', orderId);

    // Validate request
    if (!orderId) {
      console.error('❌ [Payment] Missing order ID');
      res.status(400).json({
        success: false,
        error: 'Order ID is required'
      });
      return;
    }

    if (!userId) {
      console.error('❌ [Payment] User not authenticated');
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
      return;
    }

    // Get order
    console.log('🔍 [Payment] Fetching order from database...');
    const order = await Order.findOne({ _id: orderId, user: userId });

    if (!order) {
      console.error('❌ [Payment] Order not found or access denied');
      res.status(404).json({
        success: false,
        error: 'Order not found'
      });
      return;
    }

    console.log('✅ [Payment] Order found:', {
      id: order._id,
      totalAmount: `£${order.totalAmount}`,
      status: order.status,
      paymentStatus: order.paymentStatus
    });

    // Check if order is already paid
    if (order.paymentStatus === 'paid') {
      console.warn('⚠️ [Payment] Order already paid');
      res.status(400).json({
        success: false,
        error: 'Order is already paid'
      });
      return;
    }

    // Check if order is cancelled
    if (order.status === 'cancelled') {
      console.warn('⚠️ [Payment] Order is cancelled');
      res.status(400).json({
        success: false,
        error: 'Cannot pay for cancelled order'
      });
      return;
    }

    /**
     * CURRENCY CONVERSION: GBP -> VND
     * 
     * Hệ thống sử dụng GBP làm đơn vị chính.
     * MoMo chỉ chấp nhận VND.
     * Chuyển đổi CHỈ diễn ra tại đây, không ảnh hưởng các phần khác.
     */
    console.log('💱 [Payment] Converting GBP to VND for MoMo...');
    const amountGBP = order.totalAmount;
    const amountVND = await exchangeRateService.convertGBPtoVND(amountGBP);

    console.log('✅ [Payment] Currency conversion completed:', {
      original: `£${amountGBP.toFixed(2)} GBP`,
      converted: `${amountVND.toLocaleString()} VND`
    });

    // Create MOMO payment request
    console.log('📤 [Payment] Sending request to MoMo API...');
    const momoResponse = await momoService.createPaymentRequest({
      orderId: order._id.toString(),
      amount: amountVND, // Số tiền VND đã chuyển đổi
      orderInfo: `Payment for order ${order._id}`,
      extraData: JSON.stringify({
        orderId: order._id.toString(),
        amountGBP: amountGBP,
        amountVND: amountVND
      })
    });

    console.log('✅ [Payment] MoMo payment created successfully');

    // Update order with payment details
    order.paymentMethod = 'momo';
    order.paymentDetails = {
      gateway: 'momo',
      momoOrderId: momoResponse.orderId,
      momoRequestId: momoResponse.requestId,
      amountGBP: amountGBP,
      amountVND: amountVND
    };
    await order.save();

    console.log('✅ [Payment] Order updated with payment details');
    console.log('🎉 [Payment] MoMo payment initiation completed successfully\n');

    res.status(200).json({
      success: true,
      data: {
        payUrl: momoResponse.payUrl,
        deeplink: momoResponse.deeplink,
        qrCodeUrl: momoResponse.qrCodeUrl,
        orderId: order._id,
        amount: {
          gbp: amountGBP,
          vnd: amountVND
        }
      },
      message: 'MOMO payment initiated successfully'
    });
  } catch (error: any) {
    console.error('\n❌ [Payment] Failed to initiate MOMO payment:');
    console.error('  Error Type:', error.constructor.name);
    console.error('  Error Message:', error.message);
    if (error.stack) {
      console.error('  Stack:', error.stack);
    }

    // Return specific error message to frontend in development
    const isDevelopment = process.env.NODE_ENV === 'development';
    const errorMessage = isDevelopment 
      ? error.message 
      : 'Failed to initiate MOMO payment. Please try again.';
    
    const errorDetails = isDevelopment ? {
      type: error.constructor.name,
      stack: error.stack
    } : undefined;

    res.status(500).json({
      success: false,
      error: errorMessage,
      details: errorDetails
    });
  }
};

/**
 * Handle MOMO IPN (Instant Payment Notification) callback
 * This is called by MOMO server after payment is processed
 */
export const handleMomoIPN = async (req: Request, res: Response): Promise<void> => {
  try {
    const ipnData = req.body;

    console.log('Received MOMO IPN:', {
      orderId: ipnData.orderId,
      resultCode: ipnData.resultCode,
      transId: ipnData.transId
    });

    // Verify signature
    const isValidSignature = momoService.verifyIPNSignature(ipnData);

    if (!isValidSignature) {
      console.error('Invalid MOMO IPN signature for order:', ipnData.orderId);
      res.status(400).json({
        success: false,
        error: 'Invalid signature'
      });
      return;
    }

    // Get order
    const order = await Order.findById(ipnData.orderId);

    if (!order) {
      console.error('Order not found for MOMO IPN:', ipnData.orderId);
      res.status(404).json({
        success: false,
        error: 'Order not found'
      });
      return;
    }

    // Parse payment status from result code
    const paymentStatus = momoService.parseResultCode(ipnData.resultCode);
    const resultMessage = momoService.getResultMessage(ipnData.resultCode);

    console.log(`[MoMo IPN] Payment status: ${paymentStatus}, Message: ${resultMessage}`);

    // Use lifecycle manager to handle state transitions
    // This includes idempotency checks to prevent double-counting
    if (paymentStatus === 'paid') {
      // Transition to PAID - idempotency protected
      const transition = await paymentLifecycle.transitionToPaid(order, {
        transactionId: ipnData.transId
      });

      console.log(`✅ [MoMo IPN] Order ${order._id} transitioned to PAID`);
      console.log(`   Transaction ID: ${ipnData.transId}`);
      console.log(`   Idempotent: ${transition.reason.startsWith('IDEMPOTENT')}`);
      
      if (transition.reason.startsWith('IDEMPOTENT')) {
        console.warn('⚠️ [MoMo IPN] Duplicate callback detected - no changes made');
      }

    } else if (paymentStatus === 'failed') {
      // Transition to FAILED
      await paymentLifecycle.transitionToFailed(order, {
        resultCode: ipnData.resultCode,
        resultMessage,
        transactionId: ipnData.transId
      });

      console.log(`❌ [MoMo IPN] Order ${order._id} payment FAILED: ${resultMessage}`);
    }

    // Respond to MOMO
    res.status(200).json({
      success: true,
      message: 'IPN processed successfully'
    });

    console.log('MOMO IPN processed successfully:', {
      orderId: order._id,
      paymentStatus,
      resultMessage
    });
  } catch (error: any) {
    console.error('Failed to process MOMO IPN:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process IPN'
    });
  }
};

/**
 * Handle frontend redirect callback from MOMO
 * This is where user returns after completing payment
 */
export const handleMomoCallback = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      orderId,
      resultCode,
      transId
    } = req.query;

    console.log('MOMO callback received:', {
      orderId,
      resultCode,
      transId
    });

    // Verify this is a valid callback
    if (!orderId || !resultCode) {
      res.status(400).json({
        success: false,
        error: 'Invalid callback parameters'
      });
      return;
    }

    // Get order
    const order = await Order.findById(orderId);

    if (!order) {
      res.status(404).json({
        success: false,
        error: 'Order not found'
      });
      return;
    }

    // Return order status (actual payment status is updated via IPN)
    const resultMessage = momoService.getResultMessage(Number(resultCode));

    res.status(200).json({
      success: true,
      data: {
        orderId: order._id,
        paymentStatus: order.paymentStatus,
        orderStatus: order.status,
        resultCode: Number(resultCode),
        resultMessage,
        transactionId: transId
      }
    });
  } catch (error: any) {
    console.error('Failed to handle MOMO callback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process callback'
    });
  }
};

/**
 * Check payment status of an order
 */
export const checkPaymentStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const userId = req.user?.id;

    const order = await Order.findOne({ _id: orderId, user: userId });

    if (!order) {
      res.status(404).json({
        success: false,
        error: 'Order not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        orderId: order._id,
        paymentStatus: order.paymentStatus,
        orderStatus: order.status,
        paymentMethod: order.paymentMethod,
        paymentDetails: order.paymentDetails,
        totalAmount: order.totalAmount
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to check payment status'
    });
  }
};

// ============================================
// MANUAL PAYMENT ENDPOINTS (Separate from MoMo)
// ============================================

/**
 * Initiate Manual Payment for an order
 * 
 * This is a SEPARATE payment method from MoMo.
 * Used for testing dashboard, reporting, and analytics.
 * 
 * Flow:
 * 1. User selects "Manual Payment" at checkout
 * 2. Order is created with status PENDING_MANUAL_PAYMENT
 * 3. Admin manually confirms payment receipt
 * 4. Order status changes to PAID
 */
export const initiateManualPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { orderId } = req.body;
    const userId = req.user?.id;

    console.log('\n🔧 [Payment] Starting Manual Payment initiation...');
    console.log('👤 [Payment] User ID:', userId);
    console.log('📦 [Payment] Order ID:', orderId);

    // Validate request
    if (!orderId) {
      console.error('❌ [Payment] Missing order ID');
      res.status(400).json({
        success: false,
        error: 'Order ID is required'
      });
      return;
    }

    if (!userId) {
      console.error('❌ [Payment] User not authenticated');
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
      return;
    }

    // Initiate manual payment via service
    const result = await manualPaymentService.initiateManualPayment(orderId, userId);

    console.log('✅ [Payment] Manual payment initiated successfully');

    res.status(200).json({
      success: true,
      data: {
        orderId: result.orderId,
        status: result.status,
        paymentStatus: result.paymentStatus,
        paymentMethod: MANUAL_PAYMENT_METHOD,
        message: result.message
      },
      message: 'Manual payment initiated. Please wait for admin confirmation.'
    });
  } catch (error: any) {
    console.error('\n❌ [Payment] Failed to initiate manual payment:', error.message);

    const statusCode = error.message.includes('not found') ? 404 : 
                       error.message.includes('already paid') ? 400 : 
                       error.message.includes('cancelled') ? 400 : 500;

    res.status(statusCode).json({
      success: false,
      error: error.message || 'Failed to initiate manual payment'
    });
  }
};

/**
 * Get available payment methods
 * Returns list of payment methods supported by the system
 */
export const getPaymentMethods = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    res.status(200).json({
      success: true,
      data: [
        {
          id: 'momo',
          name: 'MoMo E-Wallet',
          description: 'Secure payment with MoMo e-wallet',
          icon: 'momo-icon',
          enabled: true,
          type: 'external_gateway',
          processingTime: 'instant'
        },
        {
          id: MANUAL_PAYMENT_METHOD,
          name: 'Manual Payment',
          description: 'Bank transfer or cash payment - requires admin confirmation',
          icon: 'manual-payment-icon',
          enabled: true,
          type: 'manual',
          processingTime: '1-2 business days'
        },
        {
          id: CARD_PAYMENT_METHOD,
          name: 'Credit/Debit Card',
          description: 'Pay securely with Visa, MasterCard, or other major cards',
          icon: 'card-icon',
          enabled: true,
          type: 'card',
          processingTime: 'instant'
        },
        {
          id: BANK_TRANSFER_METHOD,
          name: 'Bank Transfer',
          description: 'Direct bank transfer - complete within 24 hours',
          icon: 'bank-icon',
          enabled: true,
          type: 'bank_transfer',
          processingTime: '1-24 hours'
        }
      ]
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to get payment methods'
    });
  }
};

/**
 * Initiate Card Payment
 */
export const initiateCardPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { orderId, cardData } = req.body;
    const userId = req.user?.id;

    console.log('\n💳 [Payment] Starting card payment initiation...');

    if (!orderId || !cardData) {
      res.status(400).json({
        success: false,
        error: 'Order ID and card data are required'
      });
      return;
    }

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
      return;
    }

    const result = await cardPaymentService.initiateCardPayment(orderId, userId, cardData);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('\n❌ [Payment] Card payment initiation failed:', error.message);

    const statusCode = error.message.includes('not found') ? 404 : 
                       error.message.includes('already paid') ? 400 : 
                       error.message.includes('cancelled') ? 400 :
                       error.message.includes('Invalid') ? 400 : 500;

    res.status(statusCode).json({
      success: false,
      error: error.message || 'Failed to initiate card payment'
    });
  }
};

/**
 * Process Card Payment
 * Called after payment initiation to simulate processing
 */
export const processCardPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { orderId } = req.body;
    const userId = req.user?.id;

    if (!orderId) {
      res.status(400).json({
        success: false,
        error: 'Order ID is required'
      });
      return;
    }

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
      return;
    }

    const result = await cardPaymentService.processCardPayment(orderId, userId);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('\n❌ [Payment] Card payment processing failed:', error.message);

    const statusCode = error.message.includes('not found') ? 404 : 500;

    res.status(statusCode).json({
      success: false,
      error: error.message || 'Failed to process card payment'
    });
  }
};

/**
 * Initiate Bank Transfer Payment
 * 
 * SIMPLIFIED: Generate payment invoice with international bank details.
 * Order already created with 'pending' status - no state transition needed.
 * 
 * Returns:
 * - IBAN, SWIFT/BIC codes
 * - Unique payment reference
 * - Invoice details
 * - QR code data (optional)
 */
export const initiateBankTransfer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { orderId } = req.body;
    const userId = req.user?.id;

    console.log('\n🏦 [Payment] Generating bank transfer invoice...');

    if (!orderId) {
      res.status(400).json({
        success: false,
        error: 'Order ID is required'
      });
      return;
    }

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
      return;
    }

    // Generate payment invoice (no state transition)
    const result = await bankTransferService.generatePaymentInvoice(orderId, userId);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('\n❌ [Payment] Bank transfer invoice generation failed:', error.message);

    const statusCode = error.message.includes('not found') ? 404 : 
                       error.message.includes('access denied') ? 403 :
                       error.message.includes('already paid') ? 400 : 
                       error.message.includes('cancelled') ? 400 : 500;

    res.status(statusCode).json({
      success: false,
      error: error.message || 'Failed to generate bank transfer invoice'
    });
  }
};

/**
 * Get payment invoice details
 * Returns invoice for display in frontend
 */
export const getBankTransferInvoice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
      return;
    }

    // Get order and return invoice details
    const order = await Order.findOne({ _id: orderId, user: userId });

    if (!order) {
      res.status(404).json({
        success: false,
        error: 'Order not found'
      });
      return;
    }

    if (order.paymentMethod !== BANK_TRANSFER_METHOD) {
      res.status(400).json({
        success: false,
        error: 'Order is not a bank transfer order'
      });
      return;
    }

    const paymentDetails = order.paymentDetails || {};

    res.status(200).json({
      success: true,
      data: {
        orderId: order._id,
        status: order.paymentStatus,
        reference: paymentDetails.reference,
        invoiceNumber: paymentDetails.invoiceNumber,
        amount: order.totalAmount,
        currency: 'GBP'
      }
    });
  } catch (error: any) {
    console.error('\n❌ [Payment] Failed to get invoice:', error.message);

    const statusCode = error.message.includes('not found') ? 404 : 
                       error.message.includes('Invalid') ? 400 : 500;

    res.status(statusCode).json({
      success: false,
      error: error.message || 'Failed to get bank transfer invoice'
    });
  }
};

/**
 * Verify Bank Transfer Payment (User-side simulation)
 *
 * Flow:
 * 1. Validate order ownership and payment method
 * 2. Compare user transfer code with generated invoice reference
 * 3. If match -> transition payment to PAID (simulated)
 * 4. If not match -> return pending with guidance message
 */
export const verifyBankTransfer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { orderId, transferCode } = req.body;
    const userId = req.user?.id;

    if (!orderId || !transferCode) {
      res.status(400).json({
        success: false,
        error: 'Order ID and transfer code are required'
      });
      return;
    }

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
      return;
    }

    const order = await Order.findOne({ _id: orderId, user: userId });

    if (!order) {
      res.status(404).json({
        success: false,
        error: 'Order not found'
      });
      return;
    }

    if (order.paymentMethod !== BANK_TRANSFER_METHOD) {
      res.status(400).json({
        success: false,
        error: 'Order is not a bank transfer order'
      });
      return;
    }

    if (order.status === 'cancelled') {
      res.status(400).json({
        success: false,
        error: 'Cannot verify payment for cancelled order'
      });
      return;
    }

    if (order.paymentStatus === 'paid') {
      res.status(200).json({
        success: true,
        data: {
          orderId: order._id,
          status: 'paid',
          message: 'Payment has already been confirmed',
          transactionId: order.paymentDetails?.transactionId
        }
      });
      return;
    }

    const expectedReference = (order.paymentDetails?.reference || '').toString().trim().toUpperCase();
    const providedCode = transferCode.toString().trim().toUpperCase();

    if (!expectedReference) {
      res.status(400).json({
        success: false,
        error: 'Invoice reference not found. Please generate bank transfer invoice first.'
      });
      return;
    }

    // Simulated verification rule: transfer code must match generated reference
    if (providedCode !== expectedReference) {
      res.status(200).json({
        success: true,
        data: {
          orderId: order._id,
          status: 'pending',
          message: 'Transfer code does not match invoice reference yet. Please recheck and try again.'
        }
      });
      return;
    }

    const transition = await paymentLifecycle.transitionToPaid(order, {
      transactionId: `BANK_USER_${Date.now()}`,
      note: `User verified bank transfer with code ${providedCode}`
    });

    res.status(200).json({
      success: true,
      data: {
        orderId: order._id,
        status: 'paid',
        message: 'Bank transfer verified successfully',
        transactionId: transition.metadata?.transactionId || order.paymentDetails?.transactionId
      }
    });
  } catch (error: any) {
    console.error('\n❌ [Payment] Bank transfer verification failed:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to verify bank transfer'
    });
  }
};
