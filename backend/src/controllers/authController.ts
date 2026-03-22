import { Request, Response, NextFunction } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User';
// import AuditLog from '../models/AuditLog'; // Temporarily disabled
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { sendOTPEmail, sendWelcomeEmail } from '../services/emailService';
import { verifyGoogleToken, isGoogleOAuthConfigured } from '../services/googleAuthService';

// Generate JWT token
const generateToken = (id: string): string => {
  const secret: jwt.Secret = process.env.JWT_SECRET || 'secret';
  const options: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRE || '7d') as any
  };
  return jwt.sign({ id }, secret, options);
};

// Generate 6-digit OTP
const generateOTP = (): string => {
  return crypto.randomInt(100000, 999999).toString();
};

// In-memory store for pending registrations (in production, use Redis)
const pendingRegistrations = new Map<string, {
  name: string;
  email: string;
  password: string;
  phone?: string;
  otp: string;
  otpExpires: Date;
}>();

// @desc    Initiate registration with OTP
// @route   POST /api/v1/auth/register/initiate
// @access  Public
export const initiateRegister = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, email, password, phone } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return next(new AppError('Please provide name, email and password', 400));
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return next(new AppError('Email is already registered', 400));
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store pending registration
    pendingRegistrations.set(email.toLowerCase(), {
      name,
      email: email.toLowerCase(),
      password,
      phone,
      otp,
      otpExpires
    });

    // Send OTP via email
    const emailSent = await sendOTPEmail(email, name, otp);

    // Log for debugging
    console.log(`[AUTH] OTP generated for ${email}: ${otp} (Email sent: ${emailSent})`);

    res.status(200).json({
      success: true,
      message: emailSent 
        ? 'OTP sent to your email address' 
        : 'OTP generated (email service unavailable)',
      emailSent,
      // Only include devOTP if email wasn't sent and not in production
      ...(!emailSent && process.env.NODE_ENV !== 'production' && { devOTP: otp })
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify OTP and complete registration
// @route   POST /api/v1/auth/register/verify
// @access  Public
export const verifyOTPAndRegister = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return next(new AppError('Please provide email and OTP', 400));
    }

    const pendingReg = pendingRegistrations.get(email.toLowerCase());

    if (!pendingReg) {
      return next(new AppError('No pending registration found. Please register again.', 400));
    }

    if (new Date() > pendingReg.otpExpires) {
      pendingRegistrations.delete(email.toLowerCase());
      return next(new AppError('OTP has expired. Please register again.', 400));
    }

    if (pendingReg.otp !== otp) {
      return next(new AppError('Invalid OTP', 400));
    }

    // Create user
    const user = await User.create({
      name: pendingReg.name,
      email: pendingReg.email,
      password: pendingReg.password,
      phone: pendingReg.phone,
      isEmailVerified: true,
      authProvider: 'local'
    });

    // Clear pending registration
    pendingRegistrations.delete(email.toLowerCase());

    // Send welcome email (async, don't wait)
    sendWelcomeEmail(user.email, user.name).catch(err => {
      console.error('Failed to send welcome email:', err);
    });

    // Generate token
    const token = generateToken(user._id.toString());

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resend OTP
// @route   POST /api/v1/auth/register/resend-otp
// @access  Public
export const resendOTP = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;

    if (!email) {
      return next(new AppError('Please provide email', 400));
    }

    const pendingReg = pendingRegistrations.get(email.toLowerCase());

    if (!pendingReg) {
      return next(new AppError('No pending registration found. Please register again.', 400));
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    // Update pending registration
    pendingReg.otp = otp;
    pendingReg.otpExpires = otpExpires;
    pendingRegistrations.set(email.toLowerCase(), pendingReg);

    // Send OTP via email
    const emailSent = await sendOTPEmail(email, pendingReg.name, otp);

    console.log(`[AUTH] New OTP for ${email}: ${otp} (Email sent: ${emailSent})`);

    res.status(200).json({
      success: true,
      message: emailSent 
        ? 'New OTP sent to your email address' 
        : 'New OTP generated (email service unavailable)',
      emailSent,
      ...(!emailSent && process.env.NODE_ENV !== 'production' && { devOTP: otp })
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, email, password, phone } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return next(new AppError('User already exists', 400));
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      phone
    });

    // Generate token
    const token = generateToken(user._id.toString());

    res.status(201).json({
      success: true,
      token,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return next(new AppError('Please provide email and password', 400));
    }

    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase().trim();

    // Check for user
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      return next(new AppError('Invalid credentials', 401));
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return next(new AppError('Invalid credentials', 401));
    }

    // Generate token
    const token = generateToken(user._id.toString());

    // Log admin login to audit log - TEMPORARILY DISABLED
    // if (user.role === 'admin') {
    //   try {
    //     await AuditLog.create({
    //       action: 'admin_login',
    //       entityType: 'system',
    //       user: user._id,
    //       description: `Admin ${user.name} đăng nhập hệ thống`,
    //       ipAddress: req.ip || req.socket.remoteAddress,
    //       status: 'success'
    //     });
    //   } catch (auditError) {
    //     console.error('Failed to create admin login audit log:', auditError);
    //     // Don't fail login if audit log creation fails
    //   }
    // }

    res.status(200).json({
      success: true,
      token,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user
// @route   POST /api/v1/auth/logout
// @access  Private
export const logout = async (
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  res.status(200).json({
    success: true,
    data: {}
  });
};

// @desc    Get current logged in user
// @route   GET /api/v1/auth/me
// @access  Private
export const getMe = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Google OAuth login/register
// @route   POST /api/v1/auth/google
// @access  Public
export const googleAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return next(new AppError('Google credential is required', 400));
    }

    if (!isGoogleOAuthConfigured()) {
      return next(new AppError('Google OAuth is not configured', 500));
    }

    // Verify Google token
    const googleUser = await verifyGoogleToken(credential);

    if (!googleUser) {
      return next(new AppError('Invalid Google credential', 401));
    }

    // Check if user exists with this email
    let user = await User.findOne({ email: googleUser.email });

    if (user) {
      // User exists - update googleId if not set
      if (!user.googleId) {
        user.googleId = googleUser.googleId;
        if (googleUser.picture && !user.avatar) {
          user.avatar = googleUser.picture;
        }
        await user.save();
      }
    } else {
      // Create new user
      user = await User.create({
        name: googleUser.name,
        email: googleUser.email,
        googleId: googleUser.googleId,
        avatar: googleUser.picture,
        isEmailVerified: googleUser.emailVerified,
        authProvider: 'google'
      });

      // Send welcome email (async)
      sendWelcomeEmail(user.email, user.name).catch(err => {
        console.error('Failed to send welcome email:', err);
      });
    }

    // Generate token
    const token = generateToken(user._id.toString());

    res.status(200).json({
      success: true,
      message: user.createdAt === user.updatedAt ? 'Account created successfully' : 'Login successful',
      token,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        authProvider: user.authProvider
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/v1/auth/profile
// @access  Private
export const updateProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, phone, address, avatar } = req.body;

    const updateFields: any = {};
    if (name) updateFields.name = name;
    if (phone !== undefined) updateFields.phone = phone;
    if (address) updateFields.address = address;
    if (avatar) updateFields.avatar = avatar;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateFields,
      { new: true, runValidators: true }
    );

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/v1/auth/change-password
// @access  Private
export const changePassword = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return next(new AppError('Please provide current and new password', 400));
    }

    if (newPassword.length < 6) {
      return next(new AppError('New password must be at least 6 characters', 400));
    }

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Check if user registered with OAuth (no password)
    if (user.authProvider !== 'local' || !user.password) {
      return next(new AppError('Cannot change password for OAuth accounts', 400));
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return next(new AppError('Current password is incorrect', 401));
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check if Google OAuth is available
// @route   GET /api/v1/auth/google/status
// @access  Public
export const googleAuthStatus = async (
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  res.status(200).json({
    success: true,
    configured: isGoogleOAuthConfigured(),
    clientId: process.env.GOOGLE_CLIENT_ID || null
  });
};
