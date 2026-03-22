import { Router } from 'express';
import { protect } from '../middleware/auth';
import {
  getUserOrders,
  getOrder,
  createOrder,
  cancelOrder
} from '../controllers/orderController';

const router = Router();

// All routes require authentication
router.use(protect);

// Get all orders for logged-in user
router.get('/', getUserOrders);

// Create new order from cart (checkout)
router.post('/', createOrder);

// Get single order
router.get('/:id', getOrder);

// Cancel order
router.patch('/:id/cancel', cancelOrder);

export default router;
