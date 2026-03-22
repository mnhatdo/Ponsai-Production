import { Router } from 'express';
import { protect, authorize } from '../middleware/auth';
import {
  getOverview,
  getConversionFunnel,
  getCartAbandonment,
  getProductPerformance,
  getPaymentFailureInsight
} from '../controllers/eventAnalyticsController';

const router = Router();

/**
 * Event Analytics Routes (Admin Only)
 * 
 * All routes require admin authentication and authorization.
 */

// Protect all routes - Admin only
router.use(protect);
router.use(authorize('admin'));

// Analytics endpoints
router.get('/overview', getOverview);
router.get('/funnel', getConversionFunnel);
router.get('/cart-abandonment', getCartAbandonment);
router.get('/products', getProductPerformance);
router.get('/payments', getPaymentFailureInsight);

export default router;
