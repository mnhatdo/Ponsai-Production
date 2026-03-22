/**
 * Request Context Utility
 * 
 * Provides utilities for tracking request context across the application.
 * Essential for event tracking and analytics.
 */

import { Request } from 'express';
import { randomUUID } from 'crypto';

export interface RequestContext {
  requestId: string;
  timestamp: Date;
  ip?: string;
  userAgent?: string;
  userId?: string;
  sessionId?: string;
}

/**
 * Extract request context for logging and analytics
 */
export function extractRequestContext(req: Request): RequestContext {
  const requestId = req.headers['x-request-id'] as string || randomUUID();
  
  return {
    requestId,
    timestamp: new Date(),
    ip: (req.ip || req.headers['x-forwarded-for'] as string || 'unknown'),
    userAgent: req.headers['user-agent'],
    userId: (req as any).user?.id?.toString(),
    // sessionId can be added later when session tracking is implemented
  };
}

/**
 * Attach request ID to request for tracking
 */
export function attachRequestId(req: Request): string {
  const requestId = req.headers['x-request-id'] as string || randomUUID();
  req.headers['x-request-id'] = requestId;
  return requestId;
}
