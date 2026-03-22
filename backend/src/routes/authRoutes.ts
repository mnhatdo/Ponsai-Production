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

const router = Router();

// Legacy register (direct registration without OTP)
router.post('/register', register);

// New OTP-based registration flow
router.post('/register/initiate', initiateRegister);
router.post('/register/verify', verifyOTPAndRegister);
router.post('/register/resend-otp', resendOTP);

// Google OAuth
router.get('/google/status', googleAuthStatus);
router.post('/google', googleAuth);

// Login/Logout
router.post('/login', login);
router.post('/logout', logout);

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

export default router;
