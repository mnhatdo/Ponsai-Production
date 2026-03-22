/**
 * Manual Payment Service
 * 
 * Service for handling manual/simulated payments.
 * This is a SEPARATE service from MoMo, used for:
 * - Internal testing
 * - Dashboard testing
 * - Analytics and reporting tests
 * 
 * IMPORTANT: This service does NOT call any external payment gateway.
 * All payment confirmation is done manually by admin.
 * 
 * LIFECYCLE INTEGRATION:
 * Uses PaymentLifecycleManager for consistent state transitions
 * and idempotency protection.
 */

import Order, { IOrder } from '../models/Order';
import mongoose from 'mongoose';
import paymentLifecycle, { PaymentMethod, PaymentStatus } from './paymentLifecycleManager';

// Payment method identifier
export const MANUAL_PAYMENT_METHOD = PaymentMethod.MANUAL;

export interface IManualPaymentInitResult {
  success: boolean;
  orderId: string;
  status: string;
  paymentStatus: string;
  message: string;
}

export interface IManualPaymentConfirmResult {
  success: boolean;
  orderId: string;
  previousStatus: string;
  newStatus: string;
  confirmedAt: Date;
  confirmedBy: string;
  message: string;
}

export interface IManualPaymentConfirmParams {
  orderId: string;
  adminUserId: string;
  adminUserName: string;
  note?: string;
}

class ManualPaymentService {
  /**
   * Initialize manual payment for an order
   * 
   * SIMPLIFIED FLOW:
   * - Order is ALREADY created with pending_manual_payment status
   * - This method just validates and returns order info
   * - No state transition needed (order already in correct state)
   * 
   * @param orderId - The order ID
   * @param userId - The user ID (owner of the order)
   * @returns Result object with order details
   */
  async initiateManualPayment(
    orderId: string,
    userId: string
  ): Promise<IManualPaymentInitResult> {
    console.log('\n🔧 [ManualPayment] Validating manual payment order...');
    console.log('📦 [ManualPayment] Order ID:', orderId);
    console.log('👤 [ManualPayment] User ID:', userId);

    // Validate order ID format
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      throw new Error('Invalid order ID format');
    }

    // Find order belonging to user
    const order = await Order.findOne({ _id: orderId, user: userId });

    if (!order) {
      throw new Error('Order not found or access denied');
    }

    // Verify order is in correct state for manual payment
    if (order.paymentMethod !== PaymentMethod.MANUAL) {
      throw new Error('Order is not a manual payment order');
    }

    // Check if already in valid state
    if (order.paymentStatus === 'pending_manual_payment' || order.paymentStatus === 'pending') {
      console.log('✅ [ManualPayment] Order already in pending state');
      console.log('📋 [ManualPayment] Status:', order.status);
      console.log('💳 [ManualPayment] Payment Status:', order.paymentStatus);

      return {
        success: true,
        orderId: order._id.toString(),
        status: order.status,
        paymentStatus: order.paymentStatus,
        message: 'Manual payment order ready. Awaiting admin confirmation.'
      };
    }

    // If order is already paid or cancelled, reject
    if (order.paymentStatus === 'paid') {
      throw new Error('Order is already paid');
    }

    if (order.paymentStatus === 'cancelled') {
      throw new Error('Order is cancelled');
    }

    console.log('✅ [ManualPayment] Order validated successfully');

    return {
      success: true,
      orderId: order._id.toString(),
      status: order.status,
      paymentStatus: order.paymentStatus,
      message: 'Manual payment initiated. Awaiting admin confirmation.'
    };
  }

  /**
   * Confirm manual payment (Admin only)
   * Changes order status from PENDING_MANUAL_PAYMENT to PAID
   * 
   * @param params - Confirmation parameters
   * @returns Result object with confirmation details
   */
  async confirmManualPayment(
    params: IManualPaymentConfirmParams
  ): Promise<IManualPaymentConfirmResult> {
    const { orderId, adminUserId, adminUserName, note } = params;

    console.log('\n✅ [ManualPayment] Admin confirming manual payment...');
    console.log('📦 [ManualPayment] Order ID:', orderId);
    console.log('👤 [ManualPayment] Admin:', adminUserName, `(${adminUserId})`);

    // Validate order ID format
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      throw new Error('Invalid order ID format');
    }

    // Find order
    const order = await Order.findById(orderId);

    if (!order) {
      throw new Error('Order not found');
    }

    // Check if order is using manual payment method
    if (order.paymentMethod !== MANUAL_PAYMENT_METHOD) {
      throw new Error(`Cannot confirm manual payment. Order uses payment method: ${order.paymentMethod}`);
    }

    // Use lifecycle manager to transition to PAID
    // This includes idempotency checks to prevent double-counting
    const transition = await paymentLifecycle.transitionToPaid(order, {
      confirmedBy: new mongoose.Types.ObjectId(adminUserId),
      confirmedByName: adminUserName,
      note: note
    });

    console.log('✅ [ManualPayment] Payment confirmed successfully');
    console.log('📋 [ManualPayment] Previous Status:', transition.previousPaymentStatus);
    console.log('📋 [ManualPayment] New Status:', transition.newPaymentStatus);
    console.log('⏰ [ManualPayment] Confirmed At:', transition.transitionedAt);
    
    // If idempotent, log warning
    if (transition.reason.startsWith('IDEMPOTENT')) {
      console.warn('⚠️ [ManualPayment] This was an idempotent request - no changes made');
    }

    return {
      success: true,
      orderId: transition.orderId,
      previousStatus: transition.previousPaymentStatus,
      newStatus: transition.newPaymentStatus,
      confirmedAt: transition.transitionedAt,
      confirmedBy: adminUserName,
      message: transition.reason.startsWith('IDEMPOTENT') 
        ? 'Payment already confirmed (idempotent request)' 
        : 'Manual payment confirmed successfully'
    };
  }

  /**
   * Get all orders pending manual payment confirmation
   * For admin dashboard
   */
  async getPendingManualPayments(): Promise<IOrder[]> {
    const orders = await Order.find({
      paymentMethod: MANUAL_PAYMENT_METHOD,
      paymentStatus: { $in: ['pending', 'pending_manual_payment'] }
    })
      .populate('user', 'name email')
      .populate('items.product', 'name price images')
      .sort({ createdAt: -1 });

    return orders;
  }

  /**
   * Get count of pending manual payments
   * For dashboard statistics
   */
  async getPendingManualPaymentsCount(): Promise<number> {
    return Order.countDocuments({
      paymentMethod: MANUAL_PAYMENT_METHOD,
      paymentStatus: PaymentStatus.PENDING
    });
  }

  /**
   * Check if an order is eligible for manual payment
   */
  async isEligibleForManualPayment(orderId: string, userId: string): Promise<boolean> {
    const order = await Order.findOne({ _id: orderId, user: userId });
    
    if (!order) return false;
    if (order.paymentStatus === 'paid') return false;
    if (order.status === 'cancelled') return false;
    
    return true;
  }
}

export default new ManualPaymentService();
