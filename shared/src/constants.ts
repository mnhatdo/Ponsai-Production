/**
 * Shared constants across the application
 */

export const API_VERSION = 'v1';

export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin'
} as const;

export const ORDER_STATUSES = {
  PENDING: 'pending',
  PENDING_MANUAL_PAYMENT: 'pending_manual_payment',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
} as const;

export const PAYMENT_STATUSES = {
  PENDING: 'pending',
  PENDING_MANUAL_PAYMENT: 'pending_manual_payment',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded'
} as const;

export const PAYMENT_METHODS = {
  MOMO: 'momo',
  MANUAL_PAYMENT: 'manual_payment',
  COD: 'cod'
} as const;

export const DIMENSION_UNITS = {
  CM: 'cm',
  IN: 'in',
  M: 'm'
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
} as const;
