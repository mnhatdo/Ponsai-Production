/**
 * Shared type definitions for Ponsai application
 * These types are used across both frontend and backend
 */

// Product Types
export interface IProduct {
  _id?: string;
  name: string;
  description: string;
  price: number;
  category: string | ICategory;
  images: string[];
  inStock: boolean;
  stockQuantity: number;
  featured: boolean;
  dimensions?: IDimensions;
  weight?: number; // Weight in kilograms
  materials?: string[];
  colors?: string[];
  rating?: number;
  reviews?: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface IDimensions {
  width: number;
  height: number;
  depth: number;
  unit: 'cm' | 'in' | 'm';
}

// Category Types
export interface ICategory {
  _id?: string;
  name: string;
  description?: string;
  slug: string;
  icon?: string;
  parent?: string;
  active: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

// User Types
export interface IUser {
  _id?: string;
  name: string;
  email: string;
  password?: string; // Only on backend
  role: UserRole;
  phone?: string;
  address?: IAddress;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export type UserRole = 'user' | 'admin';

export interface IAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

// Order Types
export interface IOrder {
  _id?: string;
  user: string | IUser;
  items: IOrderItem[];
  totalAmount: number;
  shippingAddress: IAddress;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  paymentDetails?: IPaymentDetails;
  trackingNumber?: string;
  notes?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface IOrderItem {
  product: string | IProduct;
  quantity: number;
  price: number;
}

export interface IPaymentDetails {
  gateway?: string;
  transactionId?: string;
  momoOrderId?: string;
  momoRequestId?: string;
  resultCode?: number;
  paidAt?: Date | string;
  amountGBP?: number;
  amountVND?: number;
  // Manual payment specific fields
  confirmedAt?: Date | string;
  confirmedBy?: string;
  confirmedByName?: string;
  manualPaymentNote?: string;
}

export type OrderStatus = 'created' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'created' | 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled';
export type PaymentMethod = 'momo' | 'manual_payment' | 'cod';

// API Response Types
export interface IApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface IPaginatedResponse<T = any> extends IApiResponse<T> {
  count: number;
  total: number;
  page: number;
  pages: number;
}

// Auth Types
export interface IAuthResponse {
  success: boolean;
  token: string;
  data: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface ILoginCredentials {
  email: string;
  password: string;
}

export interface IRegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

// Blog Types (optional)
export interface IBlogPost {
  _id?: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  author: string | IUser;
  coverImage?: string;
  tags?: string[];
  published: boolean;
  publishedAt?: Date | string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

