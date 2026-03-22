// Product interfaces
export interface Product {
  _id: string;
  name: string;
  slug?: string;
  sku?: string;
  description: string;
  shortDescription?: string;
  price: number;
  originalPrice?: number;
  originalCurrency?: string;
  category: Category | string;
  productType?: string;
  images: string[];
  primaryImage?: string;
  inStock: boolean;
  stockQuantity: number;
  featured: boolean;
  dimensions?: Dimensions;
  materials?: string[];
  colors?: string[];
  tags?: string[];
  externalId?: string;
  externalUrl?: string;
  brandId?: string;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
  };
  rating?: number;
  reviews?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Dimensions {
  width: number;
  height: number;
  depth: number;
  unit: 'cm' | 'in' | 'm';
}

// Category interface
export interface Category {
  _id: string;
  name: string;
  description?: string;
  slug: string;
  icon?: string;
  parent?: string;
  active: boolean;
}

// User interfaces
export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  phone?: string;
  avatar?: string;
  address?: Address;
  isEmailVerified?: boolean;
  authProvider?: 'local' | 'google';
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

// Order interfaces
export interface Order {
  _id: string;
  user: string | User;
  items: OrderItem[];
  totalAmount: number;
  shippingAddress: Address;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  trackingNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  product: string | Product;
  quantity: number;
  price: number;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

// Review interfaces
export interface Review {
  _id: string;
  product: string | Product;
  user?: string | User;
  userName: string;
  userEmail?: string;
  rating: number;
  title: string;
  comment: string;
  images?: string[];
  verified: boolean;
  helpful: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewStats {
  total: number;
  averageRating: number;
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export interface ReviewsResponse {
  reviews: Review[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  stats: ReviewStats;
}

export interface CreateReviewData {
  rating: number;
  title: string;
  comment: string;
  images?: string[];
  userName?: string;
  userEmail?: string;
}

// Cart interface
export interface CartItem {
  product: Product;
  quantity: number;
}

// API Response interfaces
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T> {
  count: number;
  total: number;
  page: number;
  pages: number;
}

// Auth interfaces
export interface AuthResponse {
  success: boolean;
  token: string;
  data: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
}
