import { Router } from 'express';
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct
} from '../controllers/productController';
import {
  getProductReviews,
  createReview
} from '../controllers/reviewController';
import { protect, authorize, optionalAuth } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/', getProducts);

// Review routes - MUST BE BEFORE /:id route
router.get('/:productId/reviews', getProductReviews);
router.post('/:productId/reviews', optionalAuth, createReview);

// Product detail route - MUST BE AFTER specific routes
router.get('/:id', getProduct);

// Protected routes (admin only)
router.post('/', protect, authorize('admin'), createProduct);
router.put('/:id', protect, authorize('admin'), updateProduct);
router.delete('/:id', protect, authorize('admin'), deleteProduct);

export default router;
