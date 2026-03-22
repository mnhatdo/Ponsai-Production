/**
 * Daily Metrics Aggregation Service
 * 
 * Aggregates daily business metrics for ML training
 * 
 * Academic Purpose:
 * - Demonstrates data warehousing concepts
 * - Pre-processes data for efficient ML training
 * - Shows batch processing design patterns
 * 
 * Usage:
 * - Run daily via cron job
 * - Can be triggered manually for historical data
 */

import DailyMetric from '../models/DailyMetric';
import Session from '../models/Session';
import Order from '../models/Order';
import PageVisit from '../models/PageVisit';

/**
 * Aggregate metrics for a specific date
 */
export const aggregateForDate = async (date: Date): Promise<any> => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  try {
    // 1. Aggregate Session Data
    const sessionStats = await Session.aggregate([
      {
        $match: {
          startTime: { $gte: startOfDay, $lte: endOfDay }
        }
      },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          uniqueVisitors: { $addToSet: '$ipAddress' },
          totalPageViews: { $sum: '$pageViews' },
          avgDuration: {
            $avg: {
              $subtract: ['$lastActivity', '$startTime']
            }
          }
        }
      }
    ]);
    
    // 2. Aggregate Order Data
    const orderStats = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfDay, $lte: endOfDay }
        }
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          completedOrders: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, 1, 0] }
          },
          totalRevenue: {
            $sum: {
              $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$totalAmount', 0]
            }
          }
        }
      }
    ]);
    
    // 3. Aggregate Product Sales Data
    const productStats = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfDay, $lte: endOfDay },
          paymentStatus: 'paid'
        }
      },
      {
        $unwind: '$items'
      },
      {
        $group: {
          _id: null,
          totalProductsSold: { $sum: '$items.quantity' },
          uniqueProducts: { $addToSet: '$items.product' }
        }
      }
    ]);
    
    const sessions = sessionStats[0] || {
      totalSessions: 0,
      uniqueVisitors: [],
      totalPageViews: 0,
      avgDuration: 0
    };
    
    const orders = orderStats[0] || {
      totalOrders: 0,
      completedOrders: 0,
      totalRevenue: 0
    };
    
    const products = productStats[0] || {
      totalProductsSold: 0,
      uniqueProducts: []
    };
    
    // Calculate derived metrics
    const avgOrderValue = orders.completedOrders > 0
      ? orders.totalRevenue / orders.completedOrders
      : 0;
    
    const conversionRate = sessions.totalSessions > 0
      ? (orders.completedOrders / sessions.totalSessions) * 100
      : 0;
    
    const avgSessionDuration = sessions.avgDuration
      ? Math.round(sessions.avgDuration / 1000) // Convert to seconds
      : 0;
    
    // Upsert daily metric
    const metric = await DailyMetric.findOneAndUpdate(
      { date: startOfDay },
      {
        $set: {
          totalSessions: sessions.totalSessions,
          uniqueVisitors: sessions.uniqueVisitors.length,
          totalPageViews: sessions.totalPageViews,
          avgSessionDuration,
          totalOrders: orders.totalOrders,
          completedOrders: orders.completedOrders,
          totalRevenue: orders.totalRevenue,
          avgOrderValue,
          conversionRate,
          totalProductsSold: products.totalProductsSold,
          uniqueProductsSold: products.uniqueProducts.length,
          lastUpdated: new Date()
        }
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      }
    );
    
    return metric;
  } catch (error) {
    console.error('Error aggregating metrics for date:', date, error);
    throw error;
  }
};

/**
 * Aggregate metrics for a date range
 * Useful for backfilling historical data
 */
export const aggregateForDateRange = async (
  startDate: Date,
  endDate: Date
): Promise<any[]> => {
  const results = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const metric = await aggregateForDate(currentDate);
    results.push(metric);
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return results;
};

/**
 * Aggregate metrics for last N days
 * Useful for catching up on missed aggregations
 */
export const aggregateLastNDays = async (days: number): Promise<any[]> => {
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);
  
  return aggregateForDateRange(startDate, endDate);
};

/**
 * Get aggregated data for ML training
 * Returns data in format suitable for ML service
 */
export const getMLTrainingData = async (months: number): Promise<any[]> => {
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);
  
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  startDate.setHours(0, 0, 0, 0);
  
  const metrics = await DailyMetric.find({
    date: {
      $gte: startDate,
      $lte: endDate
    }
  })
    .sort({ date: 1 })
    .lean();
  
  // Transform to ML-friendly format
  return metrics.map(m => ({
    date: m.date.toISOString().split('T')[0], // YYYY-MM-DD
    visits: m.totalSessions,
    orders: m.completedOrders,
    revenue: m.totalRevenue,
    avg_order_value: m.avgOrderValue,
    conversion_rate: m.conversionRate,
    products_sold: m.totalProductsSold
  }));
};

/**
 * Get daily metrics for forecasting
 * Returns last N days of data
 */
export const getDailyMetricsForForecast = async (days: number): Promise<any[]> => {
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);
  
  const metrics = await DailyMetric.find({
    date: {
      $gte: startDate,
      $lte: endDate
    }
  })
    .sort({ date: 1 })
    .lean();
  
  return metrics;
};

export default {
  aggregateForDate,
  aggregateForDateRange,
  aggregateLastNDays,
  getMLTrainingData,
  getDailyMetricsForForecast
};
