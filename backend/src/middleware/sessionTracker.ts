/**
 * Session Tracking Middleware
 * 
 * Implements session-based visit tracking with 30-minute expiry
 * 
 * Academic Purpose:
 * - Demonstrates session management without external libraries
 * - Provides data for ML feature engineering (visits per day)
 * - Shows middleware design pattern in Express
 * 
 * How It Works:
 * 1. Check for existing session cookie
 * 2. If valid session exists and not expired, update activity
 * 3. If no session or expired, create new session
 * 4. Track page visit
 * 5. Set/update session cookie
 * 
 * Session Expiry: 30 minutes of inactivity
 */

import { Request, Response, NextFunction } from 'express';
import Session from '../models/Session';
import PageVisit from '../models/PageVisit';
import crypto from 'crypto';

// Extend Express Request to include session data
declare global {
  namespace Express {
    interface Request {
      visitorSession?: any;
    }
  }
}

/**
 * Generate unique session ID
 */
const generateSessionId = (): string => {
  return `sess_${Date.now()}_${crypto.randomBytes(16).toString('hex')}`;
};

/**
 * Get client IP address (handles proxies)
 */
const getClientIp = (req: Request): string => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
};

/**
 * Session Tracking Middleware
 * 
 * Add to routes that need tracking:
 * app.use(sessionTracker);
 */
export const sessionTracker = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Skip tracking for:
    // 1. Admin API routes (already have auth tracking)
    // 2. Health checks
    // 3. Static assets
    const skipPaths = ['/api/v1/admin', '/health', '/favicon.ico'];
    const shouldSkip = skipPaths.some(path => req.path.startsWith(path));
    
    if (shouldSkip) {
      return next();
    }

    const sessionIdFromCookie = req.cookies?.visitor_session;
    const ipAddress = getClientIp(req);
    const userAgent = req.headers['user-agent'] || 'unknown';
    
    let session;
    
    // Try to find existing active session
    if (sessionIdFromCookie) {
      session = await Session.findActiveSession(sessionIdFromCookie);
      
      // If session found and not expired, update activity
      if (session) {
        await session.updateActivity();
      }
    }
    
    // If no valid session, create new one
    if (!session) {
      const sessionId = generateSessionId();
      
      session = await Session.create({
        sessionId,
        ipAddress,
        userAgent,
        userId: (req as any).user?._id, // If user is authenticated
        startTime: new Date(),
        lastActivity: new Date(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
        pageViews: 1,
        isActive: true
      });
      
      // Set session cookie (30 minutes expiry)
      res.cookie('visitor_session', sessionId, {
        maxAge: 30 * 60 * 1000, // 30 minutes in milliseconds
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
    }
    
    // Track page visit
    await PageVisit.create({
      session: session._id,
      sessionId: session.sessionId,
      url: req.originalUrl,
      path: req.path,
      title: req.headers['referer'], // Can be enhanced with actual page title
      referrer: req.headers['referer'],
      timestamp: new Date()
    });
    
    // Attach session to request for use in controllers
    req.visitorSession = session;
    
    next();
  } catch (error) {
    // Don't block request if session tracking fails
    console.error('Session tracking error:', error);
    next();
  }
};

/**
 * Middleware to track authenticated user sessions
 * Use this AFTER auth middleware
 */
export const linkUserToSession = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = (req as any).user;
    const sessionIdFromCookie = req.cookies?.visitor_session;
    
    if (user && sessionIdFromCookie) {
      // Link current session to authenticated user
      await Session.findOneAndUpdate(
        { sessionId: sessionIdFromCookie },
        { userId: user._id }
      );
    }
    
    next();
  } catch (error) {
    console.error('User session linking error:', error);
    next();
  }
};

/**
 * Utility function: End session (e.g., on logout)
 */
export const endSession = async (req: Request): Promise<void> => {
  try {
    const sessionIdFromCookie = req.cookies?.visitor_session;
    
    if (sessionIdFromCookie) {
      const session = await Session.findOne({ sessionId: sessionIdFromCookie });
      if (session) {
        await session.endSession();
      }
    }
  } catch (error) {
    console.error('End session error:', error);
  }
};

/**
 * Cleanup expired sessions (run via cron job)
 * MongoDB TTL index handles this automatically, but this can be used for manual cleanup
 */
export const cleanupExpiredSessions = async (): Promise<number> => {
  try {
    const result = await Session.deleteMany({
      expiresAt: { $lt: new Date() }
    });
    
    return result.deletedCount || 0;
  } catch (error) {
    console.error('Session cleanup error:', error);
    return 0;
  }
};

export default {
  sessionTracker,
  linkUserToSession,
  endSession,
  cleanupExpiredSessions
};
