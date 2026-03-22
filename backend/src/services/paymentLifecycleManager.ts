/**
 * Payment Lifecycle Manager
 * 
 * Centralized payment state transition logic for ALL payment methods.
 * Ensures consistent lifecycle, prevents invalid state changes, and guards against double-counting.
 * 
 * LIFECYCLE:
 * CREATED → PENDING → PAID | FAILED | CANCELLED
 * 
 * RULES:
 * - PAID is a final state (cannot transition to any other state)
 * - CANCELLED is a final state (cannot transition to any other state)
 * - FAILED can transition to PENDING (retry) or CANCELLED
 * - All transitions must be logged for audit trail
 */

import { IOrder } from '../models/Order';
import mongoose from 'mongoose';
import Product from '../models/Product';

export enum PaymentStatus {
  CREATED = 'created',
  PENDING = 'pending',
  PENDING_MANUAL_PAYMENT = 'pending_manual_payment',
  PAID = 'paid',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

export enum OrderStatus {
  CREATED = 'created',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}

export enum PaymentMethod {
  MOMO = 'momo',
  MANUAL = 'manual_payment',
  COD = 'cod',
  CARD = 'card',
  BANK_TRANSFER = 'bank_transfer'
}

/**
 * Transition result with metadata
 */
export interface IPaymentTransition {
  success: boolean;
  orderId: string;
  previousPaymentStatus: string;
  newPaymentStatus: string;
  previousOrderStatus: string;
  newOrderStatus: string;
  transitionedAt: Date;
  reason: string;
  metadata?: any;
}

/**
 * Idempotency check result
 */
interface IIdempotencyCheck {
  isIdempotent: boolean;
  reason: string;
  existingState?: {
    paymentStatus: string;
    orderStatus: string;
    paidAt?: Date;
  };
}

class PaymentLifecycleManager {
  
  /**
   * Restore product stock when order is cancelled or payment failed
   * CRITICAL: Prevents stock being locked permanently
   */
  private async restoreStock(order: IOrder): Promise<void> {
    console.log(`🔄 [PaymentLifecycle] Restoring stock for cancelled order ${order._id}`);
    
    for (const item of order.items) {
      try {
        const productId = typeof item.product === 'string' 
          ? item.product 
          : item.product._id;

        await Product.findByIdAndUpdate(
          productId,
          { $inc: { stockQuantity: item.quantity } }
        );
        
        console.log(`   ✅ Restored ${item.quantity}x of product ${productId}`);
      } catch (error) {
        console.error(`   ❌ Failed to restore stock for product ${item.product}:`, error);
        // Don't throw - continue with other items
      }
    }
  }
  
  /**
   * Check if a transition is allowed
   */
  private isTransitionAllowed(
    currentStatus: string,
    targetStatus: PaymentStatus
  ): { allowed: boolean; reason: string } {
    
    // PAID is final - cannot transition
    if (currentStatus === PaymentStatus.PAID) {
      return {
        allowed: false,
        reason: 'Payment is already PAID. This is a final state and cannot be changed.'
      };
    }

    // CANCELLED is final - cannot transition (except to REFUNDED in future)
    if (currentStatus === PaymentStatus.CANCELLED) {
      return {
        allowed: false,
        reason: 'Order is CANCELLED. Cannot change payment status.'
      };
    }

    // REFUNDED is final
    if (currentStatus === PaymentStatus.REFUNDED) {
      return {
        allowed: false,
        reason: 'Payment is REFUNDED. This is a final state.'
      };
    }

    // Valid transitions
    const validTransitions: Record<string, PaymentStatus[]> = {
      [PaymentStatus.CREATED]: [PaymentStatus.PENDING, PaymentStatus.PENDING_MANUAL_PAYMENT, PaymentStatus.CANCELLED],
      [PaymentStatus.PENDING]: [PaymentStatus.PAID, PaymentStatus.FAILED, PaymentStatus.CANCELLED],
      [PaymentStatus.PENDING_MANUAL_PAYMENT]: [PaymentStatus.PAID, PaymentStatus.CANCELLED],
      [PaymentStatus.FAILED]: [PaymentStatus.PENDING, PaymentStatus.CANCELLED]
    };

    const allowedTargets = validTransitions[currentStatus] || [];
    
    if (!allowedTargets.includes(targetStatus)) {
      return {
        allowed: false,
        reason: `Invalid transition: ${currentStatus} → ${targetStatus}. Allowed: ${allowedTargets.join(', ')}`
      };
    }

    return { allowed: true, reason: 'Valid transition' };
  }

  /**
   * Check idempotency for payment transitions
   * Prevents double-counting and duplicate processing
   */
  checkIdempotency(
    order: IOrder,
    targetStatus: PaymentStatus,
    transactionId?: string
  ): IIdempotencyCheck {
    
    // If already in target status, it's idempotent
    if (order.paymentStatus === targetStatus) {
      return {
        isIdempotent: true,
        reason: `Order already in ${targetStatus} status`,
        existingState: {
          paymentStatus: order.paymentStatus,
          orderStatus: order.status,
          paidAt: order.paymentDetails?.paidAt
        }
      };
    }

    // For PAID status, check if already paid
    if (targetStatus === PaymentStatus.PAID && order.paymentStatus === PaymentStatus.PAID) {
      return {
        isIdempotent: true,
        reason: 'Payment already confirmed. Preventing double-counting.',
        existingState: {
          paymentStatus: order.paymentStatus,
          orderStatus: order.status,
          paidAt: order.paymentDetails?.paidAt
        }
      };
    }

    // For MoMo callbacks: check if transactionId already processed
    if (targetStatus === PaymentStatus.PAID && transactionId) {
      if (order.paymentDetails?.transactionId === transactionId && order.paymentStatus === PaymentStatus.PAID) {
        return {
          isIdempotent: true,
          reason: `Transaction ${transactionId} already processed`,
          existingState: {
            paymentStatus: order.paymentStatus,
            orderStatus: order.status,
            paidAt: order.paymentDetails?.paidAt
          }
        };
      }
    }

    // For Manual Payment: check if already confirmed
    if (targetStatus === PaymentStatus.PAID && order.paymentMethod === PaymentMethod.MANUAL) {
      if (order.paymentDetails?.confirmedAt && order.paymentStatus === PaymentStatus.PAID) {
        return {
          isIdempotent: true,
          reason: 'Manual payment already confirmed',
          existingState: {
            paymentStatus: order.paymentStatus,
            orderStatus: order.status,
            paidAt: order.paymentDetails?.paidAt
          }
        };
      }
    }

    return {
      isIdempotent: false,
      reason: 'New transition - not idempotent'
    };
  }

  /**
   * Transition payment to PENDING status
   * Used when initiating payment (MoMo or Manual)
   */
  async transitionToPending(
    order: IOrder,
    paymentMethod: PaymentMethod,
    metadata?: any
  ): Promise<IPaymentTransition> {
    
    const previousPaymentStatus = order.paymentStatus;
    const previousOrderStatus = order.status;

    // Check if transition allowed
    const transitionCheck = this.isTransitionAllowed(previousPaymentStatus, PaymentStatus.PENDING);
    if (!transitionCheck.allowed) {
      throw new Error(transitionCheck.reason);
    }

    // Check idempotency
    const idempotencyCheck = this.checkIdempotency(order, PaymentStatus.PENDING);
    if (idempotencyCheck.isIdempotent) {
      console.log(`⚠️ [PaymentLifecycle] Idempotent: ${idempotencyCheck.reason}`);
      return {
        success: true,
        orderId: order._id.toString(),
        previousPaymentStatus,
        newPaymentStatus: order.paymentStatus,
        previousOrderStatus,
        newOrderStatus: order.status,
        transitionedAt: new Date(),
        reason: idempotencyCheck.reason,
        metadata: idempotencyCheck.existingState
      };
    }

    // Execute transition
    order.paymentStatus = PaymentStatus.PENDING as any;
    order.status = OrderStatus.CREATED as any;
    order.paymentMethod = paymentMethod as any;
    
    if (!order.paymentDetails) {
      order.paymentDetails = {};
    }
    order.paymentDetails.gateway = paymentMethod;

    if (metadata) {
      order.paymentDetails = { ...order.paymentDetails, ...metadata };
    }

    await order.save();

    console.log(`✅ [PaymentLifecycle] ${previousPaymentStatus} → ${PaymentStatus.PENDING}`);

    return {
      success: true,
      orderId: order._id.toString(),
      previousPaymentStatus,
      newPaymentStatus: PaymentStatus.PENDING,
      previousOrderStatus,
      newOrderStatus: OrderStatus.CREATED,
      transitionedAt: new Date(),
      reason: 'Payment initiated',
      metadata
    };
  }

  /**
   * Transition payment to PAID status
   * Used when payment is confirmed (MoMo callback or Admin manual confirm)
   * 
   * CRITICAL: Idempotency check to prevent double-counting
   */
  async transitionToPaid(
    order: IOrder,
    metadata: {
      transactionId?: string;
      confirmedBy?: mongoose.Types.ObjectId;
      confirmedByName?: string;
      note?: string;
      amountGBP?: number;
      amountVND?: number;
    }
  ): Promise<IPaymentTransition> {
    
    const previousPaymentStatus = order.paymentStatus;
    const previousOrderStatus = order.status;

    // Check if transition allowed
    const transitionCheck = this.isTransitionAllowed(previousPaymentStatus, PaymentStatus.PAID);
    if (!transitionCheck.allowed) {
      throw new Error(transitionCheck.reason);
    }

    // CRITICAL: Idempotency check
    const idempotencyCheck = this.checkIdempotency(order, PaymentStatus.PAID, metadata.transactionId);
    if (idempotencyCheck.isIdempotent) {
      console.warn(`⚠️ [PaymentLifecycle] IDEMPOTENT PAYMENT DETECTED - PREVENTING DOUBLE-COUNT`);
      console.warn(`   Order: ${order._id}`);
      console.warn(`   Reason: ${idempotencyCheck.reason}`);
      console.warn(`   Existing state:`, idempotencyCheck.existingState);
      
      return {
        success: true,
        orderId: order._id.toString(),
        previousPaymentStatus: idempotencyCheck.existingState!.paymentStatus,
        newPaymentStatus: idempotencyCheck.existingState!.paymentStatus,
        previousOrderStatus: idempotencyCheck.existingState!.orderStatus,
        newOrderStatus: idempotencyCheck.existingState!.orderStatus,
        transitionedAt: idempotencyCheck.existingState!.paidAt || new Date(),
        reason: `IDEMPOTENT: ${idempotencyCheck.reason}`,
        metadata: idempotencyCheck.existingState
      };
    }

    // Execute transition
    const paidAt = new Date();
    
    order.paymentStatus = PaymentStatus.PAID as any;
    order.status = OrderStatus.PROCESSING as any;
    
    if (!order.paymentDetails) {
      order.paymentDetails = {};
    }
    
    order.paymentDetails.paidAt = paidAt;

    // MoMo specific metadata
    if (metadata.transactionId) {
      order.paymentDetails.transactionId = metadata.transactionId;
    }
    if (metadata.amountGBP) {
      order.paymentDetails.amountGBP = metadata.amountGBP;
    }
    if (metadata.amountVND) {
      order.paymentDetails.amountVND = metadata.amountVND;
    }

    // Manual payment specific metadata
    if (metadata.confirmedBy) {
      order.paymentDetails.confirmedAt = paidAt;
      order.paymentDetails.confirmedBy = metadata.confirmedBy;
      order.paymentDetails.confirmedByName = metadata.confirmedByName;
      order.paymentDetails.manualPaymentNote = metadata.note;
    }

    await order.save();

    console.log(`✅ [PaymentLifecycle] ${previousPaymentStatus} → ${PaymentStatus.PAID}`);
    console.log(`   Order: ${order._id}`);
    console.log(`   Amount: £${order.totalAmount}`);
    console.log(`   Paid At: ${paidAt.toISOString()}`);
    console.log(`   Method: ${order.paymentMethod}`);

    return {
      success: true,
      orderId: order._id.toString(),
      previousPaymentStatus,
      newPaymentStatus: PaymentStatus.PAID,
      previousOrderStatus,
      newOrderStatus: OrderStatus.PROCESSING,
      transitionedAt: paidAt,
      reason: 'Payment confirmed',
      metadata
    };
  }

  /**
   * Transition payment to FAILED status
   * Used when payment gateway returns error
   */
  async transitionToFailed(
    order: IOrder,
    metadata: {
      resultCode?: number;
      resultMessage?: string;
      transactionId?: string;
    }
  ): Promise<IPaymentTransition> {
    
    // CRITICAL: Restore stock when payment fails
    await this.restoreStock(order);

    const previousPaymentStatus = order.paymentStatus;
    const previousOrderStatus = order.status;

    // Check if transition allowed
    const transitionCheck = this.isTransitionAllowed(previousPaymentStatus, PaymentStatus.FAILED);
    if (!transitionCheck.allowed) {
      throw new Error(transitionCheck.reason);
    }

    // Execute transition
    order.paymentStatus = PaymentStatus.FAILED as any;
    order.status = OrderStatus.CANCELLED as any;
    
    if (!order.paymentDetails) {
      order.paymentDetails = {};
    }
    
    if (metadata.resultCode !== undefined) {
      order.paymentDetails.resultCode = metadata.resultCode;
    }
    if (metadata.transactionId) {
      order.paymentDetails.transactionId = metadata.transactionId;
    }

    await order.save();

    console.log(`❌ [PaymentLifecycle] ${previousPaymentStatus} → ${PaymentStatus.FAILED}`);
    console.log(`   Order: ${order._id}`);
    console.log(`   Reason: ${metadata.resultMessage || 'Payment failed'}`);

    return {
      success: true,
      orderId: order._id.toString(),
      previousPaymentStatus,
      newPaymentStatus: PaymentStatus.FAILED,
      previousOrderStatus,
      newOrderStatus: OrderStatus.CANCELLED,
      transitionedAt: new Date(),
      reason: metadata.resultMessage || 'Payment failed',
      metadata
    };
  }

  /**
   * Transition payment to CANCELLED status
   * Used when user or admin cancels the order
   */
  async transitionToCancelled(
    order: IOrder,
    metadata: {
      cancelledBy?: 'user' | 'admin';
      reason?: string;
    }
  ): Promise<IPaymentTransition> {
    
    const previousPaymentStatus = order.paymentStatus;
    const previousOrderStatus = order.status;

    // Check if transition allowed
    const transitionCheck = this.isTransitionAllowed(previousPaymentStatus, PaymentStatus.CANCELLED);
    if (!transitionCheck.allowed) {
      throw new Error(transitionCheck.reason);
    }

    // Execute transition
    order.paymentStatus = PaymentStatus.CANCELLED as any;
    order.status = OrderStatus.CANCELLED as any;
// CRITICAL: Restore stock when order cancelled
    await this.restoreStock(order);

    
    await order.save();

    console.log(`🚫 [PaymentLifecycle] ${previousPaymentStatus} → ${PaymentStatus.CANCELLED}`);
    console.log(`   Order: ${order._id}`);
    console.log(`   Cancelled by: ${metadata.cancelledBy || 'unknown'}`);
    console.log(`   Reason: ${metadata.reason || 'No reason provided'}`);

    return {
      success: true,
      orderId: order._id.toString(),
      previousPaymentStatus,
      newPaymentStatus: PaymentStatus.CANCELLED,
      previousOrderStatus,
      newOrderStatus: OrderStatus.CANCELLED,
      transitionedAt: new Date(),
      reason: metadata.reason || 'Order cancelled',
      metadata
    };
  }
}

export default new PaymentLifecycleManager();
