import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { AppError } from './errorHandler';

export interface AuthRequest extends Request {
  user?: any;
  body: any;
  params: any;
  query: any;
  headers: any;
  ip: string;
}

export const protect = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    let token: string | undefined;

    // Check for token in headers
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return next(new AppError('Not authorized to access this route', 401));
    }

    try {
      // Verify token
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      
      // Get user from database with role
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return next(new AppError('User no longer exists', 401));
      }

      if (!user.isActive) {
        return next(new AppError('User account is deactivated', 401));
      }
      
      req.user = user;
      next();
    } catch (error) {
      return next(new AppError('Not authorized to access this route', 401));
    }
  } catch (error) {
    next(error);
  }
};

// Grant access to specific roles
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new AppError(
          `User role ${req.user?.role} is not authorized to access this route`,
          403
        )
      );
    }
    next();
  };
};

// Optional authentication - attach user if token is valid, but don't require it
export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    let token: string | undefined;

    // Check for token in headers
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // If no token, just continue without user
    if (!token) {
      return next();
    }

    try {
      // Verify token
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      
      // Get user from database
      const user = await User.findById(decoded.id).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
      }
    } catch (error) {
      // Invalid token - just ignore and continue without user
      console.warn('Optional auth: Invalid token provided');
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

// Admin-only authentication middleware
export const adminAuth = [protect, authorize('admin')];
