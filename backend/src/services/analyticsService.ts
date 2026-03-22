/**
 * Analytics Service - Wave 1
 * 
 * ANALYTICS CONTRACT:
 * This service provides ONLY metrics based on trustworthy, existing data.
 * NO new tracking, NO schema changes, NO speculative calculations.
 * 
 * SUPPORTED METRICS (High/Medium Confidence):
 * 1. Revenue Metrics - Based on Order.paymentStatus='paid' ONLY
 * 2. Customer Retention - Based on Order.user linkage
 * 3. Product Performance - Based on Order.items (NOT stock deltas)
 * 4. Payment Health - Based on created orders (NOT failed attempts before order creation)
 * 5. Operational KPIs - Based on Order.status
 * 
 * EXPLICITLY EXCLUDED (Would be misleading):
 * - Promotion effectiveness (feature not integrated)
 * - Conversion funnel (no event tracking)
 * - Cart abandonment (carts wiped on checkout)
 * - Product views (no tracking)
 * - Traffic sources (no UTM capture)
 * - Active users DAU/MAU (no lastLoginAt)
 * 
 * KNOWN LIMITATIONS:
 * - Revenue: Only counts paymentStatus='paid', excludes pending/failed
 * - Product sales: Based on order items, may differ from stock delta due to race conditions
 * - Payment health: Only orders that were created, not all payment attempts
 * - Retention: Test users (testuser%) must be filtered in production
 */

import Order from '../models/Order';
import Product from '../models/Product';

// ============================================
// METRIC DEFINITIONS & INTERFACES
// ============================================

export interface IRevenueMetrics {
  totalRevenue: number;
  orderCount: number;
  averageOrderValue: number;
  period: {
    start?: Date;
    end?: Date;
  };
  filters: {
    paymentStatus: string;
    excludeTestUsers: boolean;
  };
}

export interface IRevenueByMethod {
  paymentMethod: string;
  revenue: number;
  orderCount: number;
  averageValue: number;
  successRate?: number; // Only for completed flows
}

export interface IMonthlyRevenue {
  year: number;
  month: number;
  revenue: number;
  orderCount: number;
  averageOrderValue: number;
}

export interface ICustomerRetention {
  totalCustomers: number;
  oneTimeCustomers: number;
  repeatCustomers: number;
  repeatPurchaseRate: number; // percentage
  customerDistribution: {
    orderCount: number;
    customerCount: number;
  }[];
  caveats: string[];
}

export interface IProductPerformance {
  productId: string;
  productName: string;
  totalRevenue: number;
  totalQuantitySold: number;
  orderCount: number;
  averagePrice: number;
  currentStock?: number;
}

export interface IPaymentMethodHealth {
  paymentMethod: string;
  totalOrders: number;
  paidOrders: number;
  failedOrders: number;
  cancelledOrders: number;
  pendingOrders: number;
  successRate: number; // paid / (paid + failed + cancelled)
  averageTimeToPayMinutes?: number;
  caveat: string; // "Based on created orders only, not all payment attempts"
}

export interface IOperationalMetrics {
  pendingFulfillment: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  averageOrderValue: number;
  lowStockCount: number;
}

// ============================================
// FILTER UTILITIES
// ============================================

/**
 * Build base filter for paid orders
 * CRITICAL: Always filter by paymentStatus='paid' for revenue
 */
const buildPaidOrderFilter = (
  dateStart?: Date,
  dateEnd?: Date,
  _excludeTestUsers = true
): any => {
  const filter: any = { paymentStatus: 'paid' };

  if (dateStart || dateEnd) {
    filter.createdAt = {};
    if (dateStart) filter.createdAt.$gte = dateStart;
    if (dateEnd) filter.createdAt.$lte = dateEnd;
  }

  // TODO: In production, add test user filter
  // if (excludeTestUsers) {
  //   filter['user.email'] = { $not: /^test/ };
  // }

  return filter;
};

// ============================================
// REVENUE METRICS
// ============================================

/**
 * Get total revenue and order count
 * Definition: Sum of Order.totalAmount WHERE paymentStatus='paid'
 * Data Source: Order collection
 * Known Limitations: Excludes pending/failed orders
 */
export const getRevenueMetrics = async (
  dateStart?: Date,
  dateEnd?: Date
): Promise<IRevenueMetrics> => {
  const filter = buildPaidOrderFilter(dateStart, dateEnd);

  const result = await Order.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$totalAmount' },
        orderCount: { $sum: 1 }
      }
    }
  ]);

  const data = result[0] || { totalRevenue: 0, orderCount: 0 };

  return {
    totalRevenue: data.totalRevenue,
    orderCount: data.orderCount,
    averageOrderValue: data.orderCount > 0 ? data.totalRevenue / data.orderCount : 0,
    period: {
      start: dateStart,
      end: dateEnd
    },
    filters: {
      paymentStatus: 'paid',
      excludeTestUsers: false // TODO: Enable in production
    }
  };
};

/**
 * Get revenue breakdown by payment method
 * Definition: Revenue grouped by Order.paymentMethod WHERE paymentStatus='paid'
 * Known Limitations: Only shows methods that completed orders
 */
export const getRevenueByPaymentMethod = async (
  dateStart?: Date,
  dateEnd?: Date
): Promise<IRevenueByMethod[]> => {
  const filter = buildPaidOrderFilter(dateStart, dateEnd);

  const result = await Order.aggregate([
    { $match: filter },
    {
      $group: {
        _id: '$paymentMethod',
        revenue: { $sum: '$totalAmount' },
        orderCount: { $sum: 1 }
      }
    },
    { $sort: { revenue: -1 } }
  ]);

  return result.map((item) => ({
    paymentMethod: item._id || 'unknown',
    revenue: item.revenue,
    orderCount: item.orderCount,
    averageValue: item.revenue / item.orderCount
  }));
};

/**
 * Get monthly revenue trend (last N months)
 * Definition: Revenue grouped by year/month WHERE paymentStatus='paid'
 * Default: Last 12 months
 */
export const getMonthlyRevenue = async (months = 12): Promise<IMonthlyRevenue[]> => {
  const result = await Order.aggregate([
    { $match: { paymentStatus: 'paid' } },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        revenue: { $sum: '$totalAmount' },
        orderCount: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': -1, '_id.month': -1 } },
    { $limit: months }
  ]);

  return result.map((item) => ({
    year: item._id.year,
    month: item._id.month,
    revenue: item.revenue,
    orderCount: item.orderCount,
    averageOrderValue: item.revenue / item.orderCount
  }));
};

// ============================================
// CUSTOMER RETENTION METRICS
// ============================================

/**
 * Get customer retention metrics
 * Definition: 
 * - Repeat Purchase Rate = (Customers with 2+ orders) / (Total customers with orders)
 * - Customer Distribution = Count of customers grouped by order count
 * 
 * Data Source: Order collection grouped by user
 * Known Limitations: 
 * - Test users not filtered (testuser1@example.com, etc.)
 * - Only counts paid orders
 */
export const getCustomerRetentionMetrics = async (): Promise<ICustomerRetention> => {
  // Step 1: Group orders by user, count orders per user
  const customerOrderCounts = await Order.aggregate([
    { $match: { paymentStatus: 'paid' } },
    {
      $group: {
        _id: '$user',
        orderCount: { $sum: 1 }
      }
    }
  ]);

  // Step 2: Calculate distribution
  const distribution: { [key: number]: number } = {};
  let oneTimeCustomers = 0;
  let repeatCustomers = 0;

  customerOrderCounts.forEach((customer) => {
    const count = customer.orderCount;
    distribution[count] = (distribution[count] || 0) + 1;

    if (count === 1) {
      oneTimeCustomers++;
    } else {
      repeatCustomers++;
    }
  });

  const totalCustomers = customerOrderCounts.length;
  const repeatPurchaseRate = totalCustomers > 0 
    ? (repeatCustomers / totalCustomers) * 100 
    : 0;

  // Convert distribution to array
  const distributionArray = Object.entries(distribution)
    .map(([orderCount, customerCount]) => ({
      orderCount: parseInt(orderCount),
      customerCount: customerCount
    }))
    .sort((a, b) => a.orderCount - b.orderCount);

  return {
    totalCustomers,
    oneTimeCustomers,
    repeatCustomers,
    repeatPurchaseRate,
    customerDistribution: distributionArray,
    caveats: [
      'Based on paid orders only',
      'Test users not filtered (testuser1@example.com, etc.)',
      'Does not account for time period (all-time data)'
    ]
  };
};

/**
 * Get new vs returning customers for a period
 * Definition:
 * - New customer: First paid order within period
 * - Returning customer: Has paid order before period start, and another within period
 * 
 * Known Limitations: Computationally expensive for large datasets
 */
export const getNewVsReturningCustomers = async (
  dateStart: Date,
  dateEnd: Date
): Promise<{ newCustomers: number; returningCustomers: number }> => {
  // Get all customers who ordered in the period
  const ordersInPeriod = await Order.find({
    paymentStatus: 'paid',
    createdAt: { $gte: dateStart, $lte: dateEnd }
  }).distinct('user');

  // Check each customer's order history
  let newCustomers = 0;
  let returningCustomers = 0;

  for (const userId of ordersInPeriod) {
    // Get customer's first order ever
    const firstOrder = await Order.findOne({
      user: userId,
      paymentStatus: 'paid'
    }).sort({ createdAt: 1 });

    if (!firstOrder) continue;

    // If first order is within period, it's a new customer
    if (firstOrder.createdAt >= dateStart && firstOrder.createdAt <= dateEnd) {
      newCustomers++;
    } else {
      returningCustomers++;
    }
  }

  return { newCustomers, returningCustomers };
};

// ============================================
// PRODUCT PERFORMANCE METRICS
// ============================================

/**
 * Get top products by revenue
 * Definition: Sum of (Order.items.price * Order.items.quantity) grouped by product
 * Data Source: Order.items WHERE paymentStatus='paid'
 * 
 * Known Limitations:
 * - Based on order items, not stock deltas (more reliable)
 * - Price captured at order time, not current price
 */
export const getTopProductsByRevenue = async (
  limit = 20,
  dateStart?: Date,
  dateEnd?: Date
): Promise<IProductPerformance[]> => {
  const matchFilter = buildPaidOrderFilter(dateStart, dateEnd);

  const result = await Order.aggregate([
    { $match: matchFilter },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product',
        totalRevenue: {
          $sum: { $multiply: ['$items.quantity', '$items.price'] }
        },
        totalQuantitySold: { $sum: '$items.quantity' },
        orderCount: { $sum: 1 }
      }
    },
    { $sort: { totalRevenue: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'productDetails'
      }
    },
    { $unwind: '$productDetails' }
  ]);

  return result.map((item) => ({
    productId: item._id.toString(),
    productName: item.productDetails.name,
    totalRevenue: item.totalRevenue,
    totalQuantitySold: item.totalQuantitySold,
    orderCount: item.orderCount,
    averagePrice: item.totalRevenue / item.totalQuantitySold,
    currentStock: item.productDetails.stockQuantity
  }));
};

/**
 * Get products with zero sales in a period
 * Definition: Products NOT appearing in Order.items within date range
 * 
 * Known Limitations: Does not mean "unpopular" - could be newly added or never viewed
 */
export const getZeroSalesProducts = async (
  days = 30
): Promise<{ productId: string; productName: string; stockQuantity: number }[]> => {
  const dateStart = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // Get products with sales in period
  const productsWithSales = await Order.aggregate([
    { $match: { paymentStatus: 'paid', createdAt: { $gte: dateStart } } },
    { $unwind: '$items' },
    { $group: { _id: '$items.product' } }
  ]);

  const soldProductIds = productsWithSales.map((p) => p._id);

  // Get products without sales
  const unsoldProducts = await Product.find({
    _id: { $nin: soldProductIds }
  }).select('_id name stockQuantity');

  return unsoldProducts.map((product) => ({
    productId: product._id.toString(),
    productName: product.name,
    stockQuantity: product.stockQuantity
  }));
};

// ============================================
// PAYMENT METHOD HEALTH
// ============================================

/**
 * Get payment method health metrics
 * Definition: Order counts grouped by paymentMethod and paymentStatus
 * Success Rate = paid / (paid + failed + cancelled)
 * 
 * CRITICAL CAVEAT: Only shows orders that were created.
 * Payment failures BEFORE order creation are NOT tracked.
 * Real payment gateway failure rate may be higher.
 */
export const getPaymentMethodHealth = async (
  dateStart?: Date,
  dateEnd?: Date
): Promise<IPaymentMethodHealth[]> => {
  const filter: any = {};
  if (dateStart || dateEnd) {
    filter.createdAt = {};
    if (dateStart) filter.createdAt.$gte = dateStart;
    if (dateEnd) filter.createdAt.$lte = dateEnd;
  }

  const result = await Order.aggregate([
    { $match: filter },
    {
      $group: {
        _id: {
          method: '$paymentMethod',
          status: '$paymentStatus'
        },
        count: { $sum: 1 }
      }
    }
  ]);

  // Restructure data by payment method
  const methodStats: {
    [key: string]: {
      paid: number;
      failed: number;
      cancelled: number;
      pending: number;
      total: number;
    };
  } = {};

  result.forEach((item) => {
    const method = item._id.method || 'unknown';
    const status = item._id.status;

    if (!methodStats[method]) {
      methodStats[method] = { paid: 0, failed: 0, cancelled: 0, pending: 0, total: 0 };
    }

    methodStats[method].total += item.count;

    if (status === 'paid') {
      methodStats[method].paid = item.count;
    } else if (status === 'failed') {
      methodStats[method].failed = item.count;
    } else if (status === 'cancelled') {
      methodStats[method].cancelled = item.count;
    } else if (status.includes('pending')) {
      methodStats[method].pending = item.count;
    }
  });

  // Calculate success rates and format output
  return Object.entries(methodStats).map(([method, stats]) => {
    const conclusive = stats.paid + stats.failed + stats.cancelled;
    const successRate = conclusive > 0 ? (stats.paid / conclusive) * 100 : 0;

    return {
      paymentMethod: method,
      totalOrders: stats.total,
      paidOrders: stats.paid,
      failedOrders: stats.failed,
      cancelledOrders: stats.cancelled,
      pendingOrders: stats.pending,
      successRate,
      caveat: 'Based on created orders only, not all payment attempts'
    };
  });
};

/**
 * Get average time to payment confirmation
 * Definition: Average of (paymentDetails.paidAt - createdAt) WHERE paymentStatus='paid'
 * Unit: Minutes
 */
export const getAverageTimeToPayment = async (
  paymentMethod?: string
): Promise<{ paymentMethod: string; avgTimeMinutes: number }[]> => {
  const matchFilter: any = {
    paymentStatus: 'paid',
    'paymentDetails.paidAt': { $exists: true }
  };

  if (paymentMethod) {
    matchFilter.paymentMethod = paymentMethod;
  }

  const result = await Order.aggregate([
    { $match: matchFilter },
    {
      $project: {
        paymentMethod: 1,
        timeToPayMinutes: {
          $divide: [
            { $subtract: ['$paymentDetails.paidAt', '$createdAt'] },
            60000 // milliseconds to minutes
          ]
        }
      }
    },
    {
      $group: {
        _id: '$paymentMethod',
        avgTimeMinutes: { $avg: '$timeToPayMinutes' }
      }
    }
  ]);

  return result.map((item) => ({
    paymentMethod: item._id || 'unknown',
    avgTimeMinutes: Math.round(item.avgTimeMinutes * 10) / 10 // Round to 1 decimal
  }));
};

// ============================================
// OPERATIONAL METRICS
// ============================================

/**
 * Get operational overview
 * Definition: Order counts by status, average order value, low stock count
 * Data Source: Order collection + Product collection
 */
export const getOperationalMetrics = async (): Promise<IOperationalMetrics> => {
  const [statusCounts, avgOrderValue, lowStockCount] = await Promise.all([
    Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, avg: { $avg: '$totalAmount' } } }
    ]),
    Product.countDocuments({ stockQuantity: { $lte: 10 } })
  ]);

  const statusMap: { [key: string]: number } = {};
  statusCounts.forEach((item) => {
    statusMap[item._id] = item.count;
  });

  return {
    pendingFulfillment: (statusMap['pending'] || 0) + (statusMap['pending_manual_payment'] || 0),
    processing: statusMap['processing'] || 0,
    shipped: statusMap['shipped'] || 0,
    delivered: statusMap['delivered'] || 0,
    cancelled: statusMap['cancelled'] || 0,
    averageOrderValue: avgOrderValue[0]?.avg || 0,
    lowStockCount
  };
};

// ============================================
// EXPORT ALL
// ============================================

export default {
  // Revenue
  getRevenueMetrics,
  getRevenueByPaymentMethod,
  getMonthlyRevenue,

  // Retention
  getCustomerRetentionMetrics,
  getNewVsReturningCustomers,

  // Products
  getTopProductsByRevenue,
  getZeroSalesProducts,

  // Payments
  getPaymentMethodHealth,
  getAverageTimeToPayment,

  // Operations
  getOperationalMetrics
};
