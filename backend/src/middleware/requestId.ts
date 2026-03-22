/**
 * Request ID Middleware
 * 
 * Attaches a unique request ID to each request for tracking and debugging.
 * Essential for correlating events and logs across the system.
 */

import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Check if request already has an ID (from client or proxy)
  const requestId = req.headers['x-request-id'] as string || randomUUID();
  
  // Attach to request headers
  req.headers['x-request-id'] = requestId;
  
  // Attach to response headers for client tracking
  res.setHeader('X-Request-ID', requestId);
  
  next();
};
