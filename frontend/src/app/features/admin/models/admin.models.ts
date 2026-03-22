// Admin Models

export interface DashboardStats {
  overview: {
    totalProducts: number;
    totalCategories: number;
    totalOrders: number;
    totalUsers: number;
    totalRevenue: number;
    pendingOrders: number;
    lowStockProducts: number;
  };
  recentOrders: AdminOrder[];
  topProducts: TopProduct[];
  topProductsByRevenue: TopProductByRevenue[];
  heatmapData: HeatmapDataPoint[];
  ordersByStatus: Record<string, number>;
  dailyRevenue: DailyRevenue[];
  monthlyRevenue: MonthlyRevenue[];
}

export interface TopProduct {
  _id: string;
  name: string;
  totalSold: number;
  price: number;
  primaryImage?: string;
}

export interface TopProductByRevenue {
  _id: string;
  name: string;
  totalRevenue: number;
}

export interface HeatmapDataPoint {
  _id: { day: number; hourInterval: number };
  count: number;
}

export interface DailyRevenue {
  _id: { year: number; month: number; day: number };
  total: number;
  count: number;
}

export interface MonthlyRevenue {
  _id: { year: number; month: number };
  total: number;
  count: number;
}

export interface AdminProduct {
  _id: string;
  name: string;
  slug?: string;
  sku?: string;
  description: string;
  shortDescription?: string;
  price: number;
  originalPrice?: number;
  category: string | {
    _id: string;
    name: string;
    slug: string;
  };
  productType?: string;
  images: string[];
  primaryImage?: string;
  inStock: boolean;
  stock: number; // Alias for stockQuantity
  stockQuantity: number;
  featured: boolean;
  dimensions?: {
    width: number;
    height: number;
    depth: number;
    unit: string;
  };
  materials?: string[];
  colors?: string[];
  tags?: string[];
  rating?: number;
  reviews?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCategory {
  _id: string;
  name: string;
  description?: string;
  slug: string;
  icon?: string;
  parent?: {
    _id: string;
    name: string;
    slug: string;
  };
  active: boolean;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminOrder {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
  items: Array<{
    product: {
      _id: string;
      name: string;
      primaryImage?: string;
      price: number;
      sku?: string;
    };
    quantity: number;
    price: number;
    sku?: string;
  }>;
  totalAmount: number;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod?: string;
  trackingNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'user' | 'admin';
  isActive: boolean;
  isEmailVerified: boolean;
  authProvider: 'local' | 'google';
  avatar?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  orderCount: number;
  totalSpent: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminPromotion {
  _id: string;
  code: string;
  name: string;
  description?: string;
  type: 'percentage' | 'fixed' | 'free_shipping' | 'buy_x_get_y';
  value: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usagePerUser?: number;
  usedCount: number;
  usageCount: number; // Alias for usedCount
  applicableProducts?: string[];
  applicableCategories?: string[];
  excludedProducts?: string[];
  startDate: string;
  endDate: string;
  active: boolean;
  isActive: boolean; // Alias for active
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  _id: string;
  action: string;
  entityType: string;
  entityId?: string;
  entityName?: string;
  description?: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  userName?: string;
  userRole?: string;
  ipAddress?: string;
  changes?: Record<string, { from: any; to: any }>;
  status: 'success' | 'failure';
  errorMessage?: string;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Form interfaces
export interface ProductFormData {
  name: string;
  description: string;
  shortDescription?: string;
  price: number;
  originalPrice?: number;
  category: string;
  sku?: string;
  images: string[];
  primaryImage?: string;
  inStock: boolean;
  stockQuantity: number;
  featured: boolean;
  materials?: string[];
  colors?: string[];
  tags?: string[];
}

export interface CategoryFormData {
  name: string;
  description?: string;
  icon?: string;
  parent?: string;
  active: boolean;
}

export interface PromotionFormData {
  code: string;
  name: string;
  description?: string;
  type: 'percentage' | 'fixed' | 'free_shipping' | 'buy_x_get_y';
  value: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usagePerUser?: number;
  applicableProducts?: string[];
  applicableCategories?: string[];
  excludedProducts?: string[];
  startDate: string;
  endDate: string;
  active: boolean;
}

export interface OrderStatusUpdate {
  status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded';
  trackingNumber?: string;
  notes?: string;
}

export interface StockUpdate {
  productId: string;
  stockQuantity: number;
  reason?: string;
}

// ================================
// ANALYTICS INTERFACES
// ================================

export interface AnalyticsDateRange {
  startDate: string;
  endDate: string;
  days: number;
}

export interface AnalyticsMetadata {
  dateRange: AnalyticsDateRange;
  filters?: Record<string, any>;
}

export interface AnalyticsResponse<T> {
  success: boolean;
  data: T;
  meta: AnalyticsMetadata;
}

// Analytics Overview
export interface AnalyticsOverview {
  summary: {
    totalEvents: number;
    uniqueUsers: number;
    uniqueGuests: number;
    totalRevenue: number;
    conversionRate: number;
  };
  topEvents: Array<{
    eventType: string;
    count: number;
  }>;
  dailyActivity: Array<{
    date: string;
    events: number;
    uniqueUsers: number;
  }>;
}

// Conversion Funnel
export interface ConversionFunnel {
  stages: Array<{
    stage: string;
    count: number;
    percentage: number;
    dropOff: number;
  }>;
  totalStarted: number;
  totalCompleted: number;
  overallConversionRate: number;
}

// Cart Abandonment
export interface CartAbandonment {
  summary: {
    totalCartCreations: number;
    totalCheckoutsStarted: number;
    totalPurchases: number;
    abandonmentRate: number;
    checkoutAbandonmentRate: number;
  };
  abandonedCarts: Array<{
    _id: string | null;
    userId?: string;
    anonymousId?: string;
    productsViewed: number;
    itemsAdded: number;
    lastActivity: string;
    estimatedValue?: number;
  }>;
  topAbandonedProducts?: Array<{
    productId: string;
    productName?: string;
    abandonedCount: number;
  }>;
}

// Product Performance
export interface ProductPerformance {
  products: Array<{
    productId: string;
    productName?: string;
    views: number;
    addedToCart: number;
    purchased: number;
    conversionRate: number;
    revenue?: number;
  }>;
  totalProducts: number;
}

// Payment Failure Insights
export interface PaymentFailureInsight {
  summary: {
    totalAttempts: number;
    totalFailed: number;
    totalSucceeded: number;
    failureRate: number;
  };
  failuresByMethod: Array<{
    paymentMethod: string;
    attempts: number;
    failures: number;
    failureRate: number;
  }>;
  commonErrors?: Array<{
    errorCode?: string;
    errorMessage?: string;
    count: number;
  }>;
}
