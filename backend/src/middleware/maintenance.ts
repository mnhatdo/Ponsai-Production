import { Request, Response, NextFunction } from 'express';
import Settings from '../models/Settings';
import jwt from 'jsonwebtoken';

interface DecodedToken {
  id: string;
  role: string;
}

/**
 * Maintenance Mode Middleware
 * Blocks all non-admin users when maintenance mode is enabled
 * Allows admin users to access the site normally
 */
export const checkMaintenanceMode = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Skip check for admin routes
    if (req.path.startsWith('/api/v1/admin')) {
      return next();
    }

    // Skip check for auth routes (login/register)
    if (req.path.startsWith('/api/v1/auth')) {
      return next();
    }

    // Skip check for health check
    if (req.path === '/health' || req.path === '/api/v1/health') {
      return next();
    }

    // Get settings from database
    const settings = await Settings.findOne();

    // If no settings or maintenance mode is off, continue normally
    if (!settings || !settings.maintenanceMode) {
      return next();
    }

    // Maintenance mode is ON - check if user is admin
    let isAdmin = false;

    // Try to extract token and check if user is admin
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      
      try {
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || 'secret'
        ) as DecodedToken;
        
        // If user is admin, allow access
        if (decoded.role === 'admin') {
          isAdmin = true;
        }
      } catch (error) {
        // Invalid token, treat as non-admin
        isAdmin = false;
      }
    }

    // If not admin, return maintenance response
    if (!isAdmin) {
      return res.status(503).json({
        success: false,
        error: 'Service Unavailable',
        message: 'Website is currently under maintenance. Please check back later.',
        maintenanceMode: true
      });
    }

    // Admin user, allow access
    next();
  } catch (error) {
    // On error, fail open (allow access) to prevent breaking the site
    console.error('Error in maintenance middleware:', error);
    next();
  }
};
