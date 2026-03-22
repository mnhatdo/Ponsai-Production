import { Router } from 'express';
import { 
  register, 
  login, 
  logout, 
  getMe,
  initiateRegister,
  verifyOTPAndRegister,
  resendOTP,
  googleAuth,
  googleAuthStatus,
  updateProfile,
  changePassword
} from '../controllers/authController';
import { protect } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimit';

const router = Router();

// Legacy register (direct registration without OTP)
router.post('/register', authLimiter, register);

// New OTP-based registration flow
router.post('/register/initiate', authLimiter, initiateRegister);
router.post('/register/verify', authLimiter, verifyOTPAndRegister);
router.post('/register/resend-otp', authLimiter, resendOTP);

// Google OAuth
router.get('/google/status', googleAuthStatus);
router.post('/google', authLimiter, googleAuth);

// Login/Logout
router.post('/login', authLimiter, login);
router.post('/logout', logout);

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

export default router;
