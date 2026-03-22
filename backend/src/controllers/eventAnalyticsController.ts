import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import eventAnalyticsService from '../services/eventAnalyticsService';
import { validateDateRange } from '../utils/dateUtils';

/**
 * Event Analytics Controller
 * 
 * Admin-only endpoints để query event analytics.
 * Standardized responses: { success, data, meta }
 * Default date range: last 30 days
 * Max date range: 90 days
 */

/**
 * Get Analytics Overview
 * 
 * GET /api/v1/admin/analytics/overview
 * 
 * Query params:
 * - startDate: ISO date string (optional, default: 30 days ago)
 * - endDate: ISO date string (optional, default: now)
 * 
 * Auth: Admin only
 */
export const getOverview = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    // Validate and get date range (defaults to last 30 days)
    const dateRange = validateDateRange(
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    const result = await eventAnalyticsService.getOverview(dateRange);

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Conversion Funnel
 * 
 * GET /api/v1/admin/analytics/funnel
 * 
 * Query params:
 * - startDate: ISO date string (optional, default: 30 days ago)
 * - endDate: ISO date string (optional, default: now)
 * 
 * Auth: Admin only
 */
export const getConversionFunnel = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    const dateRange = validateDateRange(
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    const result = await eventAnalyticsService.getConversionFunnel(dateRange);

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Cart Abandonment
 * 
 * GET /api/v1/admin/analytics/cart-abandonment
 * 
 * Query params:
 * - startDate: ISO date string (optional, default: 30 days ago)
 * - endDate: ISO date string (optional, default: now)
 * 
 * Auth: Admin only
 */
export const getCartAbandonment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    const dateRange = validateDateRange(
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    const result = await eventAnalyticsService.getCartAbandonment(dateRange);

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Product Performance
 * 
 * GET /api/v1/admin/analytics/products
 * 
 * Query params:
 * - startDate: ISO date string (optional, default: 30 days ago)
 * - endDate: ISO date string (optional, default: now)
 * - limit: number (optional, default 50, max 100)
 * 
 * Auth: Admin only
 */
export const getProductPerformance = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { startDate, endDate, limit } = req.query;

    const dateRange = validateDateRange(
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    // Validate and cap limit
    let limitNum = limit ? parseInt(limit as string, 10) : 50;
    if (isNaN(limitNum) || limitNum < 1) {
      limitNum = 50;
    }
    if (limitNum > 100) {
      limitNum = 100; // Cap at 100 to prevent excessive queries
    }

    const result = await eventAnalyticsService.getProductPerformance(dateRange, limitNum);

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Payment Failure Insight
 * 
 * GET /api/v1/admin/analytics/payments
 * 
 * Query params:
 * - startDate: ISO date string (optional, default: 30 days ago)
 * - endDate: ISO date string (optional, default: now)
 * 
 * Auth: Admin only
 */
export const getPaymentFailureInsight = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    const dateRange = validateDateRange(
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    const result = await eventAnalyticsService.getPaymentFailureInsight(dateRange);

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    next(error);
  }
};
