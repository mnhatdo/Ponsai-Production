import { Router } from 'express';
import { protect } from '../middleware/auth';
import { getMe, updateProfile, changePassword } from '../controllers/authController';

const router = Router();

// Current user profile routes (compatibility alias to auth profile endpoints)
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

// Backward-compatible default /users route
router.get('/', protect, getMe);

export default router;
