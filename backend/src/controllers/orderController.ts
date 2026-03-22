import { Response, NextFunction } from 'express';
import Order from '../models/Order';
import Cart from '../models/Cart';
import Product from '../models/Product';
import paymentLifecycle from '../services/paymentLifecycleManager';
import { AuthRequest } from '../middleware/auth';

const generateOrderNumber = (): string => {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ORD-${datePart}-${randomPart}`;
};

// Get all orders for user
export const getUserOrders = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const orders = await Order.find({ user: userId })
      .populate('items.product')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments({ user: userId });

    res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get single order
export const getOrder = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const order = await Order.findOne({ _id: id, user: userId })
      .populate('items.product');

    if (!order) {
      res.status(404).json({
        success: false,
        error: 'Order not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// Create order from cart (checkout)
export const createOrder = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { shippingAddress, paymentMethod, notes } = req.body;

    // Validate shipping address
    if (!shippingAddress || !shippingAddress.street || !shippingAddress.city || 
        !shippingAddress.state || !shippingAddress.zipCode || !shippingAddress.country) {
      res.status(400).json({
        success: false,
        error: 'Complete shipping address is required'
      });
      return;
    }

    // Get user's cart
    const cart = await Cart.findOne({ user: userId }).populate('items.product');

    if (!cart || cart.items.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Cart is empty'
      });
      return;
    }

    // Verify stock availability and calculate total
    let totalAmount = 0;
    const orderItems = [];

    for (const item of cart.items) {
      const product = await Product.findById(item.product._id);
      
      if (!product) {
        res.status(404).json({
          success: false,
          error: `Product not found: ${item.product._id}`
        });
        return;
      }

      if (!product.inStock || product.stockQuantity < item.quantity) {
        res.status(400).json({
          success: false,
          error: `Insufficient stock for ${product.name}`
        });
        return;
      }

      orderItems.push({
        product: product._id,
        quantity: item.quantity,
        price: product.price
      });

      totalAmount += product.price * item.quantity;
    }

    // Determine initial status based on payment method
    const selectedPaymentMethod = paymentMethod || 'momo';
    const isManualPayment = selectedPaymentMethod === 'manual_payment';
    
    // For manual payment: set status to pending_manual_payment
    // For other methods (momo, cod): set status to pending
    const initialStatus = isManualPayment ? 'pending_manual_payment' : 'pending';
    const initialPaymentStatus = isManualPayment ? 'pending_manual_payment' : 'pending';

    // Create order with collision-safe order number generation
    let order = null;
    const maxOrderNumberAttempts = 5;

    for (let attempt = 1; attempt <= maxOrderNumberAttempts; attempt++) {
      const orderNumber = generateOrderNumber();

      try {
        order = await Order.create({
          orderNumber,
          user: userId,
          items: orderItems,
          totalAmount,
          shippingAddress,
          paymentMethod: selectedPaymentMethod,
          status: initialStatus,
          paymentStatus: initialPaymentStatus,
          paymentDetails: isManualPayment ? { gateway: 'manual_payment' } : undefined,
          notes
        });
        break;
      } catch (error: any) {
        const isOrderNumberCollision =
          error?.code === 11000 &&
          (error?.keyPattern?.orderNumber || error?.keyValue?.orderNumber);

        if (!isOrderNumberCollision || attempt === maxOrderNumberAttempts) {
          throw error;
        }
      }
    }

    if (!order) {
      throw new Error('Failed to create order. Please try again.');
    }

    // Update product stock
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stockQuantity: -item.quantity } }
      );
    }

    // Clear cart
    cart.items = [];
    await cart.save();

    // Populate order for response
    await order.populate('items.product');

    res.status(201).json({
      success: true,
      data: order,
      message: 'Order created successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Cancel order (only if pending or pending_manual_payment)
export const cancelOrder = async (req: AuthRequest, res: Response, _next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const order = await Order.findOne({ _id: id, user: userId });

    if (!order) {
      res.status(404).json({
        success: false,
        error: 'Order not found'
      });
      return;
    }

    // Allow cancellation of pending or pending_manual_payment orders
    if (order.status !== 'pending' && order.status !== 'pending_manual_payment') {
      res.status(400).json({
        success: false,
        error: 'Only pending orders can be cancelled'
      });
      return;
    }

    // Use lifecycle manager to handle cancellation
    // This includes stock restoration and proper state transitions
    await paymentLifecycle.transitionToCancelled(order, {
      cancelledBy: 'user',
      reason: 'Cancelled by user'
    });

    res.status(200).json({
      success: true,
      data: order,
      message: 'Order cancelled successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to cancel order'
    });
  }
};
