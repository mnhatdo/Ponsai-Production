/**
 * Analytics Controller - Wave 1
 * 
 * Exposes analytics endpoints using only trustworthy, existing data.
 * See analyticsService.ts for metric definitions and contracts.
 * 
 * ALL endpoints require admin authentication.
 * 
 * Business Questions Answered:
 * - Revenue: "How much did we make this period?"
 * - Retention: "What % of customers buy again?"
 * - Products: "Which products drive revenue?"
 * - Payments: "Which payment method works best?"
 * - Operations: "How many orders need fulfillment?"
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import analyticsService from '../services/analyticsService';

// ============================================
// REVENUE ANALYTICS
// ============================================

/**
 * GET /api/v1/admin/analytics/revenue
 * 
 * Business Question: "How much revenue did we make in this period?"
 * 
 * Query params:
 * - dateStart (optional): ISO date string (e.g., "2024-01-01")
 * - dateEnd (optional): ISO date string
 * 
 * Returns:
 * - totalRevenue: Sum of paid orders
 * - orderCount: Number of paid orders
 * - averageOrderValue: totalRevenue / orderCount
 * - filters: What filters were applied (for transparency)
 */
export const getRevenueMetrics = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const dateStart = req.query.dateStart ? new Date(req.query.dateStart as string) : undefined;
    const dateEnd = req.query.dateEnd ? new Date(req.query.dateEnd as string) : undefined;

    const metrics = await analyticsService.getRevenueMetrics(dateStart, dateEnd);

    res.status(200).json({
      success: true,
      data: metrics,
      meta: {
        description: 'Revenue from paid orders only',
        limitations: [
          'Excludes pending/failed orders',
          'Test users not filtered (testuser1@example.com, etc.)'
        ]
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/admin/analytics/revenue-by-method
 * 
 * Business Question: "Which payment method generates most revenue?"
 * 
 * Returns breakdown of revenue by payment method (momo, manual_payment, etc.)
 */
export const getRevenueByPaymentMethod = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const dateStart = req.query.dateStart ? new Date(req.query.dateStart as string) : undefined;
    const dateEnd = req.query.dateEnd ? new Date(req.query.dateEnd as string) : undefined;

    const data = await analyticsService.getRevenueByPaymentMethod(dateStart, dateEnd);

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/admin/analytics/revenue-monthly
 * 
 * Business Question: "How is revenue trending over time?"
 * 
 * Query params:
 * - months (optional): Number of months to include (default: 12)
 * 
 * Returns monthly revenue for last N months
 */
export const getMonthlyRevenue = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const months = req.query.months ? parseInt(req.query.months as string) : 12;
    const data = await analyticsService.getMonthlyRevenue(months);

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// CUSTOMER RETENTION ANALYTICS
// ============================================

/**
 * GET /api/v1/admin/analytics/retention
 * 
 * Business Question: "What % of customers buy more than once?"
 * 
 * Returns:
 * - repeatPurchaseRate: Percentage of customers with 2+ orders
 * - customerDistribution: Breakdown of customers by order count
 * - caveats: Known limitations (test users, all-time data, etc.)
 */
export const getCustomerRetention = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await analyticsService.getCustomerRetentionMetrics();

    res.status(200).json({
      success: true,
      data,
      meta: {
        description: 'Customer repeat purchase analysis',
        limitations: data.caveats
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/admin/analytics/new-vs-returning
 * 
 * Business Question: "How many new vs returning customers this period?"
 * 
 * Query params (REQUIRED):
 * - dateStart: ISO date string
 * - dateEnd: ISO date string
 * 
 * Returns count of new vs returning customers within period
 */
export const getNewVsReturningCustomers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const dateStart = req.query.dateStart ? new Date(req.query.dateStart as string) : undefined;
    const dateEnd = req.query.dateEnd ? new Date(req.query.dateEnd as string) : undefined;

    if (!dateStart || !dateEnd) {
      res.status(400).json({
        success: false,
        error: 'Both dateStart and dateEnd are required'
      });
      return;
    }

    const data = await analyticsService.getNewVsReturningCustomers(dateStart, dateEnd);

    res.status(200).json({
      success: true,
      data,
      meta: {
        period: { start: dateStart, end: dateEnd },
        warning: 'Computationally expensive for large datasets'
      }
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// PRODUCT PERFORMANCE ANALYTICS
// ============================================

/**
 * GET /api/v1/admin/analytics/products/top
 * 
 * Business Question: "Which products generate most revenue?"
 * 
 * Query params:
 * - limit (optional): Number of products to return (default: 20)
 * - dateStart (optional): Filter by date
 * - dateEnd (optional): Filter by date
 * 
 * Returns top products by revenue with sales metrics
 */
export const getTopProducts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const dateStart = req.query.dateStart ? new Date(req.query.dateStart as string) : undefined;
    const dateEnd = req.query.dateEnd ? new Date(req.query.dateEnd as string) : undefined;

    const data = await analyticsService.getTopProductsByRevenue(limit, dateStart, dateEnd);

    res.status(200).json({
      success: true,
      data,
      meta: {
        description: 'Top products by revenue from paid orders',
        note: 'Prices shown are from order time, not current prices'
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/admin/analytics/products/zero-sales
 * 
 * Business Question: "Which products haven't sold recently?"
 * 
 * Query params:
 * - days (optional): Number of days to check (default: 30)
 * 
 * Returns products with zero sales in the period
 */
export const getZeroSalesProducts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const days = req.query.days ? parseInt(req.query.days as string) : 30;
    const data = await analyticsService.getZeroSalesProducts(days);

    res.status(200).json({
      success: true,
      data,
      meta: {
        period: `Last ${days} days`,
        caveat: 'Zero sales does not mean unpopular - product may not be viewed or is newly added'
      }
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// PAYMENT METHOD HEALTH
// ============================================

/**
 * GET /api/v1/admin/analytics/payment-health
 * 
 * Business Question: "Which payment method has best success rate?"
 * 
 * CRITICAL CAVEAT: Only tracks orders that were created.
 * Payment failures BEFORE order creation are not visible.
 * Real gateway failure rate may be higher.
 * 
 * Query params:
 * - dateStart (optional)
 * - dateEnd (optional)
 * 
 * Returns success rates and order counts by payment method
 */
export const getPaymentMethodHealth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const dateStart = req.query.dateStart ? new Date(req.query.dateStart as string) : undefined;
    const dateEnd = req.query.dateEnd ? new Date(req.query.dateEnd as string) : undefined;

    const data = await analyticsService.getPaymentMethodHealth(dateStart, dateEnd);

    res.status(200).json({
      success: true,
      data,
      meta: {
        criticalCaveat: 'Based on created orders only, not all payment attempts',
        note: 'Users who fail payment before order creation are not counted'
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/admin/analytics/payment-timing
 * 
 * Business Question: "How long does it take users to complete payment?"
 * 
 * Query params:
 * - paymentMethod (optional): Filter by specific method
 * 
 * Returns average time from order creation to payment confirmation
 */
export const getPaymentTiming = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const paymentMethod = req.query.paymentMethod as string | undefined;
    const data = await analyticsService.getAverageTimeToPayment(paymentMethod);

    res.status(200).json({
      success: true,
      data,
      meta: {
        unit: 'minutes',
        description: 'Average time from order creation to payment confirmation'
      }
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// OPERATIONAL METRICS
// ============================================

/**
 * GET /api/v1/admin/analytics/operations
 * 
 * Business Question: "How many orders need fulfillment?"
 * 
 * Returns real-time operational metrics:
 * - Orders by status (pending, processing, shipped, delivered, cancelled)
 * - Average order value
 * - Low stock product count
 */
export const getOperationalMetrics = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await analyticsService.getOperationalMetrics();

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// COMPREHENSIVE ANALYTICS OVERVIEW
// ============================================

/**
 * GET /api/v1/admin/analytics/overview
 * 
 * Business Question: "Give me the full picture of business health"
 * 
 * Returns combined metrics for dashboard:
 * - Revenue (total, monthly trend)
 * - Customer retention
 * - Top products
 * - Payment health
 * - Operations
 */
export const getAnalyticsOverview = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const [
      revenue,
      revenueByMethod,
      monthlyRevenue,
      retention,
      topProducts,
      paymentHealth,
      operations
    ] = await Promise.all([
      analyticsService.getRevenueMetrics(),
      analyticsService.getRevenueByPaymentMethod(),
      analyticsService.getMonthlyRevenue(6), // Last 6 months
      analyticsService.getCustomerRetentionMetrics(),
      analyticsService.getTopProductsByRevenue(10),
      analyticsService.getPaymentMethodHealth(),
      analyticsService.getOperationalMetrics()
    ]);

    res.status(200).json({
      success: true,
      data: {
        revenue,
        revenueByMethod,
        monthlyRevenue,
        retention,
        topProducts,
        paymentHealth,
        operations
      },
      meta: {
        generatedAt: new Date(),
        dataSource: 'Existing orders, users, products only',
        excludedMetrics: [
          'Promotion effectiveness (feature not integrated)',
          'Conversion funnel (no event tracking)',
          'Cart abandonment (carts wiped on checkout)',
          'Product views (no tracking)',
          'Traffic sources (no UTM capture)'
        ]
      }
    });
  } catch (error) {
    next(error);
  }
};

export default {
  // Revenue
  getRevenueMetrics,
  getRevenueByPaymentMethod,
  getMonthlyRevenue,

  // Retention
  getCustomerRetention,
  getNewVsReturningCustomers,

  // Products
  getTopProducts,
  getZeroSalesProducts,

  // Payments
  getPaymentMethodHealth,
  getPaymentTiming,

  // Operations
  getOperationalMetrics,

  // Overview
  getAnalyticsOverview
};
