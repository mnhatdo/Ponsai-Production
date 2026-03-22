import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import Event from '../models/Event';

/**
 * Track Event
 * 
 * POST /api/v1/events
 * 
 * Non-blocking event logging - does NOT throw errors to client.
 * Silently fails if event cannot be saved (prevents breaking main flow).
 * 
 * Body:
 * - eventType: string (required)
 * - anonymousId: string (optional, for guest users)
 * - metadata: object (optional, flexible structure)
 * 
 * Auth: Optional (optionalAuth middleware)
 * - If logged in: userId extracted from req.user
 * - If guest: use anonymousId from body
 */
export const trackEvent = async (
  req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  // Immediately respond success - don't make client wait
  res.status(202).json({
    success: true,
    message: 'Event tracking initiated'
  });

  // Fire-and-forget event logging (non-blocking)
  setImmediate(async () => {
    try {
      const { eventType, anonymousId, metadata } = req.body;

      // Validate eventType exists
      if (!eventType) {
        console.warn('[Event] Missing eventType in request');
        return;
      }

      // Extract user ID if authenticated
      const userId = req.user?.id;

      // Extract request ID from headers (set by requestIdMiddleware)
      const requestId = req.headers['x-request-id'] as string;

      // Server-side timestamp (don't trust client)
      const timestamp = new Date();

      // Create event
      await Event.create({
        eventType,
        userId: userId || undefined,
        anonymousId: anonymousId || undefined,
        requestId: requestId || undefined,
        metadata: metadata || undefined,
        timestamp
      });

      // Log success (for debugging)
      console.log(`[Event] Tracked: ${eventType} | User: ${userId || anonymousId || 'unknown'}`);
    } catch (error) {
      // Silent failure - don't crash the server
      console.error('[Event] Failed to save event:', error);
      // Do NOT throw - this is fire-and-forget
    }
  });
};

/**
 * Batch Track Events
 * 
 * POST /api/v1/events/batch
 * 
 * For frontend to send multiple events at once (e.g., on page unload).
 * Same non-blocking behavior as single event.
 */
export const trackEventBatch = async (
  req: AuthRequest,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  // Immediately respond
  res.status(202).json({
    success: true,
    message: 'Batch event tracking initiated'
  });

  // Fire-and-forget batch logging
  setImmediate(async () => {
    try {
      const { events } = req.body;

      if (!Array.isArray(events) || events.length === 0) {
        console.warn('[Event] Invalid batch: events must be non-empty array');
        return;
      }

      // Limit batch size to prevent abuse
      const batchLimit = 50;
      const validEvents = events.slice(0, batchLimit);

      const userId = req.user?.id;
      const requestId = req.headers['x-request-id'] as string;
      const timestamp = new Date();

      // Prepare event documents
      const eventDocs = validEvents
        .filter(e => e.eventType) // Only events with eventType
        .map(e => ({
          eventType: e.eventType,
          userId: userId || undefined,
          anonymousId: e.anonymousId || undefined,
          requestId: requestId || undefined,
          metadata: e.metadata || undefined,
          timestamp: e.timestamp ? new Date(e.timestamp) : timestamp
        }));

      if (eventDocs.length > 0) {
        await Event.insertMany(eventDocs, { ordered: false });
        console.log(`[Event] Tracked batch: ${eventDocs.length} events`);
      }
    } catch (error) {
      console.error('[Event] Failed to save batch events:', error);
      // Silent failure
    }
  });
};
