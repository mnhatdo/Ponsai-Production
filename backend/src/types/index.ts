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

export interface JWTPayload {
  id: string;
  role?: string;
  iat?: number;
  exp?: number;
}
