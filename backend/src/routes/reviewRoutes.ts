import { Router } from 'express';
import {
  updateReview,
  deleteReview,
  markHelpful,
  getMyReviews
} from '../controllers/reviewController';
import { protect } from '../middleware/auth';

const router = Router();

// Note: Product review routes are in productRoutes.ts
// These are general review management routes

// Public routes
router.post('/reviews/:reviewId/helpful', markHelpful);

// Protected routes (require login)
router.get('/reviews/me', protect, getMyReviews);
router.put('/reviews/:reviewId', protect, updateReview);
router.delete('/reviews/:reviewId', protect, deleteReview);

export default router;
