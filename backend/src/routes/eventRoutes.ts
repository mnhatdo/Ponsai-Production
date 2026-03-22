import { Router } from 'express';
import { optionalAuth } from '../middleware/auth';
import { trackEvent, trackEventBatch } from '../controllers/eventController';

const router = Router();

/**
 * Event Tracking Routes
 * 
 * All routes use optionalAuth:
 * - Logged-in users: userId extracted automatically
 * - Guest users: provide anonymousId in request body
 */

// Single event tracking
router.post('/', optionalAuth, trackEvent);

// Batch event tracking
router.post('/batch', optionalAuth, trackEventBatch);

export default router;
