/**
 * International Bank Transfer Payment Service (Simulated - Dev Only)
 * 
 * SIMPLIFIED FLOW for GBP-based system:
 * - Order created with 'pending' status in GBP
 * - Generate payment invoice with simulated international bank details
 * - NO currency conversion (system uses GBP natively)
 * - NO state transition (order already in correct state)
 * - Admin confirms payment manually when "received"
 * 
 * SIMULATED INTERNATIONAL BANK DETAILS:
 * - Account: Ponsai Limited (UK)
 * - IBAN: GB29NWBK60161331926819 (simulated)
 * - SWIFT/BIC: NWBKGB2L (simulated)
 * - Currency: GBP
 * 
 * Flow:
 * 1. Order created → pending (£ amount)
 * 2. Generate invoice with IBAN, SWIFT, unique reference
 * 3. User transfers via their bank app
 * 4. Admin confirms → pending → paid
 */

import Order, { IOrder } from '../models/Order';
import { PaymentMethod } from './paymentLifecycleManager';

export const BANK_TRANSFER_METHOD = PaymentMethod.BANK_TRANSFER;

export interface IBankTransferInvoice {
  orderId: string;
  reference: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  issuedAt: string;
  dueDate: string;
  bankDetails: {
    bankName: string;
    accountName: string;
    iban: string;
    swift: string;
    sortCode: string;
    accountNumber: string;
  };
  qrData: string;
}

export interface IBankTransferConfirmResult {
  success: boolean;
  orderId: string;
  previousStatus: string;
  newStatus: string;
  confirmedAt: Date;
  confirmedBy: string;
  transactionId: string; // Bank transaction ID
  message: string;
}

class BankTransferService {
  
  // SIMULATED International Bank Details (UK Account)
  private readonly MERCHANT_BANK_DETAILS = {
    accountName: 'Ponsai Limited',
    iban: 'GB29NWBK60161331926819',  // Simulated IBAN (valid format)
    swift: 'NWBKGB2L',                // Simulated SWIFT/BIC
    bankName: 'NatWest Bank',
    bankAddress: '135 Bishopsgate, London EC2M 3UR, United Kingdom'
  };

  /**
   * Generate payment invoice for bank transfer
   * 
   * SIMPLIFIED: Order already created with 'pending' status.
   * This just generates invoice details, NO state transition.
   */
  async generatePaymentInvoice(
    orderId: string,
    userId: string
  ): Promise<IBankTransferInvoice> {
    console.log('\n🏦 [BankTransfer] Generating payment invoice...');
    console.log('📦 [BankTransfer] Order ID:', orderId);
    console.log('👤 [BankTransfer] User ID:', userId);

    // Get order
    const order = await Order.findOne({ _id: orderId, user: userId }) as IOrder | null;
    
    if (!order) {
      throw new Error('Order not found or access denied');
    }

    // Verify payment method
    if (order.paymentMethod !== BANK_TRANSFER_METHOD) {
      throw new Error('Order is not a bank transfer order');
    }

    // Check if already paid
    if (order.paymentStatus === 'paid') {
      throw new Error('Order is already paid');
    }

    // Check if cancelled
    if (order.status === 'cancelled') {
      throw new Error('Cannot generate invoice for cancelled order');
    }

    // Generate unique payment reference
    const reference = this.generatePaymentReference(orderId);
    const invoiceNumber = this.generateInvoiceNumber(orderId);
    
    // Invoice due in 3 days
    const issuedAt = new Date();
    const dueDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

    // Update order with payment details (but don't change status)
    if (!order.paymentDetails) {
      order.paymentDetails = {};
    }
    order.paymentDetails.gateway = 'bank_transfer_international';
    order.paymentDetails.reference = reference;
    order.paymentDetails.invoiceNumber = invoiceNumber;
    order.paymentDetails.invoiceIssuedAt = issuedAt;
    order.paymentDetails.invoiceDueDate = dueDate;
    
    await order.save();

    console.log('✅ [BankTransfer] Invoice generated');
    console.log('🔖 [BankTransfer] Reference:', reference);
    console.log('📄 [BankTransfer] Invoice:', invoiceNumber);
    console.log('💷 [BankTransfer] Amount: £', order.totalAmount);
    
    // Return structure matching frontend BankTransferResponse interface
    return {
      orderId: order._id.toString(),
      reference,
      invoiceNumber,
      amount: order.totalAmount,
      currency: 'GBP',
      issuedAt: issuedAt.toISOString(),
      dueDate: dueDate.toISOString(),
      bankDetails: {
        bankName: this.MERCHANT_BANK_DETAILS.bankName,
        accountName: this.MERCHANT_BANK_DETAILS.accountName,
        iban: this.MERCHANT_BANK_DETAILS.iban,
        swift: this.MERCHANT_BANK_DETAILS.swift,
        sortCode: '60-16-13',
        accountNumber: '31926819'
      },
      qrData: this.generateQRData(reference, order.totalAmount)
    };
  }

  /**
   * Admin confirms bank transfer payment
   * Called when admin verifies payment received in bank account
   * 
   * @param orderId - Order ID
   * @param adminUserId - Admin user ID
   * @param adminUserName - Admin name
   * @param bankReference - Bank transaction reference (from bank statement)
   */
  async confirmBankTransfer(
    orderId: string,
    adminUserId: string,
    adminUserName: string,
    bankReference?: string
  ): Promise<IBankTransferConfirmResult> {
    console.log('\n🏦 [BankTransfer] Admin confirming bank transfer...');
    console.log('📦 [BankTransfer] Order ID:', orderId);
    console.log('👤 [BankTransfer] Admin:', adminUserName);
    console.log('🔖 [BankTransfer] Bank Reference:', bankReference || 'N/A');

    // Get order
    const order = await Order.findById(orderId) as IOrder | null;
    
    if (!order) {
      throw new Error('Order not found');
    }

    // Verify payment method
    if (order.paymentMethod !== BANK_TRANSFER_METHOD) {
      throw new Error(`Cannot confirm bank transfer. Order uses: ${order.paymentMethod}`);
    }

    // Import lifecycle manager (lazy to avoid circular dependency)
    const paymentLifecycle = (await import('./paymentLifecycleManager')).default;

    // Use lifecycle manager to transition to PAID
    const transactionId = bankReference || this.generateTransactionId();
    const transition = await paymentLifecycle.transitionToPaid(order, {
      confirmedBy: adminUserId as any,
      confirmedByName: adminUserName,
      note: bankReference ? `Bank reference: ${bankReference}` : 'Bank transfer confirmed',
      transactionId: transactionId
    });

    console.log('✅ [BankTransfer] Payment confirmed');
    console.log('📋 [BankTransfer] Previous Status:', transition.previousPaymentStatus);
    console.log('📋 [BankTransfer] New Status:', transition.newPaymentStatus);

    return {
      success: true,
      orderId: transition.orderId,
      previousStatus: transition.previousPaymentStatus,
      newStatus: transition.newPaymentStatus,
      confirmedAt: transition.transitionedAt,
      confirmedBy: adminUserName,
      transactionId: transactionId,
      message: transition.reason.startsWith('IDEMPOTENT') 
        ? 'Payment already confirmed (idempotent)' 
        : 'Bank transfer payment confirmed successfully'
    };
  }

  /**
   * Generate unique payment reference
   * Format: GBPORD-XXXXXX (where X is from order ID)
   */
  private generatePaymentReference(orderId: string): string {
    const orderIdShort = orderId.substring(orderId.length - 8).toUpperCase();
    return `GBPORD-${orderIdShort}`;
  }

  /**
   * Generate invoice number
   * Format: INV-YYYYMMDD-XXXX
   */
  private generateInvoiceNumber(orderId: string): string {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    const orderIdShort = orderId.substring(orderId.length - 4).toUpperCase();
    return `INV-${dateStr}-${orderIdShort}`;
  }

  /**
   * Generate QR code data for mobile banking
   * Format: Simple text with payment details
   */
  private generateQRData(reference: string, amount: number): string {
    return JSON.stringify({
      type: 'bank_transfer',
      iban: this.MERCHANT_BANK_DETAILS.iban,
      swift: this.MERCHANT_BANK_DETAILS.swift,
      accountName: this.MERCHANT_BANK_DETAILS.accountName,
      amount,
      currency: 'GBP',
      reference
    });
  }

  /**
   * Generate transaction ID for confirmed transfer
   */
  private generateTransactionId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10);
    return `BANK_${timestamp}_${random}`.toUpperCase();
  }
}

export default new BankTransferService();
