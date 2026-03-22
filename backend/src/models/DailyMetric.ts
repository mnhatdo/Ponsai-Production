/**
 * DailyMetric Model - Aggregated Daily Business Metrics for ML
 * 
 * Stores daily aggregations of key business metrics used for ML training
 * 
 * Academic Purpose:
 * - Pre-aggregated data reduces ML training time
 * - Demonstrates data warehouse design patterns
 * - Provides clean dataset for regression analysis
 * 
 * Dataset Fields Explained:
 * - date: Primary key for time-series analysis
 * - visits: Independent variable (predictor)
 * - orders: Dependent variable OR independent variable
 * - revenue: Dependent variable (target for regression)
 * - avgOrderValue: Derived metric for analysis
 */

import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IDailyMetric extends Document {
  date: Date; // Date (YYYY-MM-DD format, stored at midnight UTC)
  
  // Visit Metrics (from Session tracking)
  totalSessions: number; // Total sessions started on this day
  uniqueVisitors: number; // Unique IP addresses (approximate)
  totalPageViews: number; // Sum of all page views
  avgSessionDuration: number; // Average session length in seconds
  
  // Business Metrics (from Orders)
  totalOrders: number; // Orders placed
  completedOrders: number; // Orders with status 'paid'
  totalRevenue: number; // Sum of completed order amounts (GBP)
  avgOrderValue: number; // Revenue / completedOrders
  
  // Conversion Metrics
  conversionRate: number; // (completedOrders / totalSessions) * 100
  
  // Product Metrics (aggregated)
  totalProductsSold: number; // Sum of all quantities sold
  uniqueProductsSold: number; // Count of distinct products ordered
  
  // Metadata
  lastUpdated: Date; // When this record was last refreshed
  createdAt: Date;
  updatedAt: Date;
}

export interface IDailyMetricModel extends Model<IDailyMetric> {
  // Static methods
  aggregateForDate(date: Date): Promise<IDailyMetric>;
  getMetricsForDateRange(startDate: Date, endDate: Date): Promise<IDailyMetric[]>;
  getMetricsForMonths(months: number): Promise<IDailyMetric[]>;
}

const DailyMetricSchema: Schema = new Schema(
  {
    date: {
      type: Date,
      required: true,
      unique: true, // One record per day
      index: true
    },
    
    // Visit Metrics
    totalSessions: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    uniqueVisitors: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    totalPageViews: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    avgSessionDuration: {
      type: Number,
      default: 0,
      min: 0
    },
    
    // Business Metrics
    totalOrders: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    completedOrders: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    totalRevenue: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    avgOrderValue: {
      type: Number,
      default: 0,
      min: 0
    },
    
    // Conversion Metrics
    conversionRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    
    // Product Metrics
    totalProductsSold: {
      type: Number,
      default: 0,
      min: 0
    },
    uniqueProductsSold: {
      type: Number,
      default: 0,
      min: 0
    },
    
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

/**
 * Static method: Get metrics for date range (for ML training)
 */
DailyMetricSchema.statics.getMetricsForDateRange = function(startDate: Date, endDate: Date) {
  return this.find({
    date: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ date: 1 }).lean();
};

/**
 * Static method: Get metrics for last N months
 */
DailyMetricSchema.statics.getMetricsForMonths = function(months: number) {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);
  
  return (this as any).getMetricsForDateRange(startDate, endDate);
};

/**
 * Static method: Aggregate data for a specific date
 * This should be run daily via cron job
 */
DailyMetricSchema.statics.aggregateForDate = async function(date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  // Import models here to avoid circular dependencies
  const Session = mongoose.model('Session');
  const Order = mongoose.model('Order');
  
  // Aggregate session data
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
        totalPageViews: { $sum: '$pageViews' }
      }
    }
  ]);
  
  // Aggregate order data
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
  
  const sessions = sessionStats[0] || { totalSessions: 0, uniqueVisitors: [], totalPageViews: 0 };
  const orders = orderStats[0] || { totalOrders: 0, completedOrders: 0, totalRevenue: 0 };
  
  const avgOrderValue = orders.completedOrders > 0 
    ? orders.totalRevenue / orders.completedOrders 
    : 0;
    
  const conversionRate = sessions.totalSessions > 0
    ? (orders.completedOrders / sessions.totalSessions) * 100
    : 0;
  
  // Upsert (update or insert) the daily metric
  return this.findOneAndUpdate(
    { date: startOfDay },
    {
      $set: {
        totalSessions: sessions.totalSessions,
        uniqueVisitors: sessions.uniqueVisitors.length,
        totalPageViews: sessions.totalPageViews,
        totalOrders: orders.totalOrders,
        completedOrders: orders.completedOrders,
        totalRevenue: orders.totalRevenue,
        avgOrderValue,
        conversionRate,
        lastUpdated: new Date()
      }
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true
    }
  );
};

export default mongoose.model<IDailyMetric, IDailyMetricModel>('DailyMetric', DailyMetricSchema);
