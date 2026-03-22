/**
 * Promotion Routes - User-facing promotion endpoints
 * 
 * Public routes for users to discover and apply promotions
 */

import express from 'express';
import { 
  validatePromotion, 
  applyPromotionToOrder,
  getActivePromotions 
} from '../controllers/promotionController';
import { protect } from '../middleware/auth';

const router = express.Router();

// Public routes (no authentication required)
router.get('/active', getActivePromotions); // GET /api/v1/promotions/active
router.post('/validate', validatePromotion); // POST /api/v1/promotions/validate - Allow guests to validate

// Protected routes (require authentication)
router.post('/apply', protect, applyPromotionToOrder); // POST /api/v1/promotions/apply

export default router;
