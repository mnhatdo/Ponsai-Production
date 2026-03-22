import Event from '../models/Event';
import { DateRange, formatDateRangeMeta } from '../utils/dateUtils';

/**
 * Event Analytics Service
 * 
 * Chuyên xử lý query & aggregation từ Event collection.
 * Chỉ phục vụ admin analytics, không có business logic khác.
 */

// Analytics Meta - standardized for all responses
interface AnalyticsMeta {
  dateRange: {
    startDate: string; // ISO string
    endDate: string;   // ISO string
    days: number;
  };
  filters?: Record<string, any>;
}

// Standardized response wrapper
interface AnalyticsResponse<T> {
  data: T;
  meta: AnalyticsMeta;
}

interface FunnelStep {
  step: string;
  eventType: string;
  count: number;
  dropoffRate?: number;
  conversionRate?: number;
}

interface FunnelAnalytics {
  totalUsers: number;
  steps: FunnelStep[];
  overallConversionRate: number;
}

interface CartAbandonmentAnalytics {
  totalAbandoned: number;
  totalAbandonedValue: number;
  abandonmentRate: number;
  totalCarts: number;
}

interface ProductPerformance {
  productId: string;
  views: number;
  addsToCarts: number;
  purchases: number;
  viewToCartRate: number;
  cartToPurchaseRate: number;
}

interface PaymentFailureInsight {
  totalAttempted: number;
  totalCompleted: number;
  totalFailed: number;
  failureRate: number;
  byPaymentMethod: Array<{
    method: string;
    attempted: number;
    completed: number;
    failed: number;
    failureRate: number;
  }>;
}

interface OverviewAnalytics {
  totalEvents: number;
  totalUniqueUsers: number;
  totalAnonymousUsers: number;
  eventCounts: Array<{ eventType: string; count: number }>;
}

class EventAnalyticsService {
  /**
   * Conversion Funnel Analysis
   * View → Add to Cart → Checkout → Payment Completed
   * 
   * Trả về số lượng + tỷ lệ rơi ở mỗi bước.
   */
  async getConversionFunnel(
    dateRange: DateRange
  ): Promise<AnalyticsResponse<FunnelAnalytics>> {
    const dateFilter = {
      timestamp: {
        $gte: dateRange.startDate,
        $lte: dateRange.endDate
      }
    };

    // Count events for each funnel step
    const funnelEvents = await Event.aggregate([
      { $match: { 
        eventType: { 
          $in: ['product_viewed', 'added_to_cart', 'checkout_started', 'payment_completed'] 
        },
        ...dateFilter
      }},
      { $group: {
        _id: '$eventType',
        count: { $sum: 1 }
      }}
    ]);

    // Map results
    const eventMap = new Map(funnelEvents.map(e => [e._id, e.count]));
    
    const viewCount = eventMap.get('product_viewed') || 0;
    const cartCount = eventMap.get('added_to_cart') || 0;
    const checkoutCount = eventMap.get('checkout_started') || 0;
    const paymentCount = eventMap.get('payment_completed') || 0;

    const steps: FunnelStep[] = [
      {
        step: '1. Product Viewed',
        eventType: 'product_viewed',
        count: viewCount,
        conversionRate: 100
      },
      {
        step: '2. Added to Cart',
        eventType: 'added_to_cart',
        count: cartCount,
        dropoffRate: viewCount > 0 ? ((viewCount - cartCount) / viewCount) * 100 : 0,
        conversionRate: viewCount > 0 ? (cartCount / viewCount) * 100 : 0
      },
      {
        step: '3. Checkout Started',
        eventType: 'checkout_started',
        count: checkoutCount,
        dropoffRate: cartCount > 0 ? ((cartCount - checkoutCount) / cartCount) * 100 : 0,
        conversionRate: cartCount > 0 ? (checkoutCount / cartCount) * 100 : 0
      },
      {
        step: '4. Payment Completed',
        eventType: 'payment_completed',
        count: paymentCount,
        dropoffRate: checkoutCount > 0 ? ((checkoutCount - paymentCount) / checkoutCount) * 100 : 0,
        conversionRate: checkoutCount > 0 ? (paymentCount / checkoutCount) * 100 : 0
      }
    ];

    // Count unique users in funnel
    const uniqueUsers = await Event.countDocuments({
      eventType: { 
        $in: ['product_viewed', 'added_to_cart', 'checkout_started', 'payment_completed'] 
      },
      ...dateFilter,
      $or: [
        { userId: { $exists: true } },
        { anonymousId: { $exists: true } }
      ]
    });

    return {
      data: {
        totalUsers: uniqueUsers,
        steps,
        overallConversionRate: viewCount > 0 ? (paymentCount / viewCount) * 100 : 0
      },
      meta: {
        dateRange: formatDateRangeMeta(dateRange)
      }
    };
  }

  /**
   * Cart Abandonment Analysis
   * 
   * Users có added_to_cart nhưng không có payment_completed.
   * Trả về số lượng abandon và tổng giá trị.
   */
  async getCartAbandonment(
    dateRange: DateRange
  ): Promise<AnalyticsResponse<CartAbandonmentAnalytics>> {
    const dateFilter = {
      timestamp: {
        $gte: dateRange.startDate,
        $lte: dateRange.endDate
      }
    };

    // Get all users who added to cart
    const cartUsers = await Event.aggregate([
      { $match: {
        eventType: 'added_to_cart',
        ...dateFilter
      }},
      { $group: {
        _id: {
          userId: '$userId',
          anonymousId: '$anonymousId'
        },
        cartValue: { $sum: { $multiply: [
          { $ifNull: ['$metadata.price', 0] },
          { $ifNull: ['$metadata.quantity', 1] }
        ]}}
      }}
    ]);

    // Get users who completed payment
    const completedUsers = await Event.aggregate([
      { $match: {
        eventType: 'payment_completed',
        ...dateFilter
      }},
      { $group: {
        _id: {
          userId: '$userId',
          anonymousId: '$anonymousId'
        }
      }}
    ]);

    // Create set of completed user IDs for fast lookup
    const completedSet = new Set(
      completedUsers.map(u => 
        u._id.userId ? u._id.userId.toString() : u._id.anonymousId
      )
    );

    // Filter abandoned carts
    const abandonedCarts = cartUsers.filter(u => {
      const userId = u._id.userId ? u._id.userId.toString() : u._id.anonymousId;
      return !completedSet.has(userId);
    });

    const totalAbandoned = abandonedCarts.length;
    const totalAbandonedValue = abandonedCarts.reduce((sum, cart) => sum + cart.cartValue, 0);
    const totalCarts = cartUsers.length;

    return {
      data: {
        totalAbandoned,
        totalAbandonedValue,
        abandonmentRate: totalCarts > 0 ? (totalAbandoned / totalCarts) * 100 : 0,
        totalCarts
      },
      meta: {
        dateRange: formatDateRangeMeta(dateRange)
      }
    };
  }

  /**
   * Product Performance Analysis
   * 
   * Với mỗi productId: views, adds to cart, purchases.
   */
  async getProductPerformance(
    dateRange: DateRange,
    limit: number = 50
  ): Promise<AnalyticsResponse<ProductPerformance[]>> {
    const dateFilter = {
      timestamp: {
        $gte: dateRange.startDate,
        $lte: dateRange.endDate
      }
    };

    const productStats = await Event.aggregate([
      { $match: {
        eventType: { 
          $in: ['product_viewed', 'added_to_cart', 'payment_completed'] 
        },
        'metadata.productId': { $exists: true },
        ...dateFilter
      }},
      { $group: {
        _id: {
          productId: '$metadata.productId',
          eventType: '$eventType'
        },
        count: { $sum: 1 }
      }},
      { $group: {
        _id: '$_id.productId',
        events: {
          $push: {
            eventType: '$_id.eventType',
            count: '$count'
          }
        }
      }},
      { $limit: limit }
    ]);

    const products = productStats.map(product => {
      const eventMap = new Map(product.events.map((e: any) => [e.eventType, e.count]));
      
      const views = (eventMap.get('product_viewed') as number) || 0;
      const addsToCarts = (eventMap.get('added_to_cart') as number) || 0;
      const purchases = (eventMap.get('payment_completed') as number) || 0;

      return {
        productId: product._id,
        views,
        addsToCarts,
        purchases,
        viewToCartRate: views > 0 ? (addsToCarts / views) * 100 : 0,
        cartToPurchaseRate: addsToCarts > 0 ? (purchases / addsToCarts) * 100 : 0
      };
    });

    return {
      data: products,
      meta: {
        dateRange: formatDateRangeMeta(dateRange),
        filters: { limit }
      }
    };
  }

  /**
   * Payment Failure Insight
   * 
   * Số lần payment_attempted vs payment_completed.
   * Tỷ lệ fail theo paymentMethod.
   */
  async getPaymentFailureInsight(
    dateRange: DateRange
  ): Promise<AnalyticsResponse<PaymentFailureInsight>> {
    const dateFilter = {
      timestamp: {
        $gte: dateRange.startDate,
        $lte: dateRange.endDate
      }
    };

    // Count attempts, completions, failures
    const paymentEvents = await Event.aggregate([
      { $match: {
        eventType: { 
          $in: ['payment_attempted', 'payment_completed', 'payment_failed'] 
        },
        ...dateFilter
      }},
      { $group: {
        _id: '$eventType',
        count: { $sum: 1 }
      }}
    ]);

    const eventMap = new Map(paymentEvents.map(e => [e._id, e.count]));
    
    const totalAttempted = eventMap.get('payment_attempted') || 0;
    const totalCompleted = eventMap.get('payment_completed') || 0;
    const totalFailed = eventMap.get('payment_failed') || 0;

    // Breakdown by payment method
    const byMethod = await Event.aggregate([
      { $match: {
        eventType: { 
          $in: ['payment_attempted', 'payment_completed', 'payment_failed'] 
        },
        'metadata.paymentMethod': { $exists: true },
        ...dateFilter
      }},
      { $group: {
        _id: {
          method: '$metadata.paymentMethod',
          eventType: '$eventType'
        },
        count: { $sum: 1 }
      }},
      { $group: {
        _id: '$_id.method',
        events: {
          $push: {
            eventType: '$_id.eventType',
            count: '$count'
          }
        }
      }}
    ]);

    const byPaymentMethod = byMethod.map(method => {
      const methodEventMap = new Map(method.events.map((e: any) => [e.eventType, e.count]));
      
      const attempted = (methodEventMap.get('payment_attempted') as number) || 0;
      const completed = (methodEventMap.get('payment_completed') as number) || 0;
      const failed = (methodEventMap.get('payment_failed') as number) || 0;

      return {
        method: method._id,
        attempted,
        completed,
        failed,
        failureRate: attempted > 0 ? (failed / attempted) * 100 : 0
      };
    });

    return {
      data: {
        totalAttempted,
        totalCompleted,
        totalFailed,
        failureRate: totalAttempted > 0 ? (totalFailed / totalAttempted) * 100 : 0,
        byPaymentMethod
      },
      meta: {
        dateRange: formatDateRangeMeta(dateRange)
      }
    };
  }

  /**
   * Overview Analytics
   * 
   * Tổng quan về events: total events, unique users, event counts.
   */
  async getOverview(
    dateRange: DateRange
  ): Promise<AnalyticsResponse<OverviewAnalytics>> {
    const dateFilter = {
      timestamp: {
        $gte: dateRange.startDate,
        $lte: dateRange.endDate
      }
    };

    // Total events
    const totalEvents = await Event.countDocuments(dateFilter);

    // Unique users (userId)
    const uniqueUsers = await Event.distinct('userId', {
      userId: { $exists: true },
      ...dateFilter
    });

    // Unique anonymous users
    const uniqueAnonymous = await Event.distinct('anonymousId', {
      anonymousId: { $exists: true },
      ...dateFilter
    });

    // Event counts by type
    const eventCounts = await Event.aggregate([
      { $match: dateFilter },
      { $group: {
        _id: '$eventType',
        count: { $sum: 1 }
      }},
      { $sort: { count: -1 } }
    ]);

    return {
      data: {
        totalEvents,
        totalUniqueUsers: uniqueUsers.length,
        totalAnonymousUsers: uniqueAnonymous.length,
        eventCounts: eventCounts.map(e => ({
          eventType: e._id,
          count: e.count
        }))
      },
      meta: {
        dateRange: formatDateRangeMeta(dateRange)
      }
    };
  }
}

export default new EventAnalyticsService();
