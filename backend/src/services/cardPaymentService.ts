/**
 * Card Payment Service (Simulated)
 * 
 * Simulates credit/debit card payment processing for development and testing.
 * In production, this would be replaced with real payment gateway integration
 * (e.g., Stripe, PayPal, etc.)
 * 
 * LIFECYCLE: CREATED → PENDING → PAID | FAILED
 */

import Order, { IOrder } from '../models/Order';
import { PaymentMethod } from './paymentLifecycleManager';
import paymentLifecycle from './paymentLifecycleManager';

export const CARD_PAYMENT_METHOD = PaymentMethod.CARD;

export interface ICardPaymentInitResult {
  success: boolean;
  orderId: string;
  message: string;
  paymentDetails?: {
    gateway: string;
    status: string;
  };
}

export interface ICardPaymentProcessResult {
  success: boolean;
  orderId: string;
  transactionId: string;
  status: 'paid' | 'failed';
  message: string;
}

export interface ICardPaymentData {
  cardNumber: string; // Will be masked in real implementation
  cardHolder: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
}

class CardPaymentService {
  
  /**
   * Initialize card payment for an order
   * Sets the order to PENDING status
   */
  async initiateCardPayment(
    orderId: string,
    userId: string,
    cardData: ICardPaymentData
  ): Promise<ICardPaymentInitResult> {
    console.log('\n💳 [CardPayment] Initiating card payment...');
    console.log('📦 [CardPayment] Order ID:', orderId);
    console.log('👤 [CardPayment] User ID:', userId);

    // Get order
    const order = await Order.findOne({ _id: orderId, user: userId }) as IOrder | null;
    
    if (!order) {
      throw new Error('Order not found');
    }

    // Validate card data (basic validation)
    this.validateCardData(cardData);

    // Transition to PENDING using lifecycle manager
    // Store card number temporarily for processing simulation (in real app, this would be tokenized)
    await paymentLifecycle.transitionToPending(
      order,
      CARD_PAYMENT_METHOD,
      {
        gateway: 'card_simulated',
        cardLast4: cardData.cardNumber.slice(-4),
        cardNumber: cardData.cardNumber // Temporarily store for processing simulation
      }
    );

    console.log('✅ [CardPayment] Order transitioned to PENDING');
    
    return {
      success: true,
      orderId: order._id.toString(),
      message: 'Card payment initiated successfully',
      paymentDetails: {
        gateway: 'card_simulated',
        status: 'pending'
      }
    };
  }

  /**
   * Process card payment (simulate payment processing)
   * This simulates what would happen after card gateway processes the payment
   */
  async processCardPayment(
    orderId: string,
    userId: string
  ): Promise<ICardPaymentProcessResult> {
    console.log('\n💳 [CardPayment] Processing card payment...');
    
    // Get order
    const order = await Order.findOne({ _id: orderId, user: userId }) as IOrder | null;
    
    if (!order) {
      throw new Error('Order not found');
    }

    // Get card data from payment details (stored during initiation)
    const paymentDetails = order.paymentDetails as any;
    if (!paymentDetails?.cardLast4) {
      throw new Error('Card payment not initiated');
    }

    const cardNumber = paymentDetails.cardNumber || ''; // Stored temporarily during initiation

    // Simulate processing delay (real payment gateway would take time)
    await this.simulateProcessingDelay();

    // Simulate payment outcome based on card number (for testing)
    const outcome = this.simulatePaymentOutcome(cardNumber);

    const transactionId = this.generateTransactionId();

    if (outcome === 'success') {
      // Transition to PAID
      await paymentLifecycle.transitionToPaid(order, {
        transactionId
      });

      console.log('✅ [CardPayment] Payment SUCCESSFUL');
      
      return {
        success: true,
        orderId: order._id.toString(),
        transactionId,
        status: 'paid',
        message: 'Payment processed successfully'
      };
    } else {
      // Transition to FAILED
      await paymentLifecycle.transitionToFailed(order, {
        resultCode: 1001,
        resultMessage: 'Card declined - Insufficient funds'
      });

      console.log('❌ [CardPayment] Payment FAILED');
      
      return {
        success: false,
        orderId: order._id.toString(),
        transactionId,
        status: 'failed',
        message: 'Card declined - Insufficient funds'
      };
    }
  }

  /**
   * Validate card data (basic validation for simulation)
   */
  private validateCardData(cardData: ICardPaymentData): void {
    if (!cardData.cardNumber || cardData.cardNumber.length < 13) {
      throw new Error('Invalid card number');
    }
    if (!cardData.cardHolder || cardData.cardHolder.length < 3) {
      throw new Error('Invalid card holder name');
    }
    if (!cardData.expiryMonth || !cardData.expiryYear) {
      throw new Error('Invalid expiry date');
    }
    if (!cardData.cvv || cardData.cvv.length < 3) {
      throw new Error('Invalid CVV');
    }
  }

  /**
   * Simulate payment outcome based on card number
   * For testing different scenarios
   */
  private simulatePaymentOutcome(cardNumber: string): 'success' | 'failure' {
    // Card numbers ending in 0-7 = success
    // Card numbers ending in 8-9 = failure
    const lastDigit = parseInt(cardNumber.slice(-1));
    return lastDigit <= 7 ? 'success' : 'failure';
  }

  /**
   * Simulate processing delay (real gateway would have network delay)
   */
  private async simulateProcessingDelay(): Promise<void> {
    const delay = Math.random() * 2000 + 1000; // 1-3 seconds
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Generate simulated transaction ID
   */
  private generateTransactionId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10);
    return `CARD_${timestamp}_${random}`.toUpperCase();
  }
}

export default new CardPaymentService();
