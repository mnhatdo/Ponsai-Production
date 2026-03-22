import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  AnalyticsResponse,
  AnalyticsOverview,
  ConversionFunnel,
  CartAbandonment,
  ProductPerformance,
  PaymentFailureInsight
} from '../models/admin.models';

export interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
  userId?: string;
  productId?: string;
  limit?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/admin/analytics/events`;

  // State signals
  private _loading = signal(false);
  private _error = signal<string | null>(null);

  // Public readonly signals
  loading = this._loading.asReadonly();
  error = this._error.asReadonly();

  /**
   * Get analytics overview
   * Default: Last 30 days, Max: 90 days
   */
  getOverview(filters: AnalyticsFilters = {}): Observable<AnalyticsResponse<AnalyticsOverview>> {
    this._loading.set(true);
    this._error.set(null);

    let params = new HttpParams();
    if (filters.startDate) params = params.set('startDate', filters.startDate);
    if (filters.endDate) params = params.set('endDate', filters.endDate);

    return this.http.get<AnalyticsResponse<AnalyticsOverview>>(
      `${this.apiUrl}/overview`,
      { params }
    ).pipe(
      tap(() => this._loading.set(false)),
      catchError(err => {
        this._loading.set(false);
        this._error.set(err.error?.message || 'Failed to load analytics overview');
        return throwError(() => err);
      })
    );
  }

  /**
   * Get conversion funnel analytics
   * Shows: product_viewed → added_to_cart → checkout_started → payment_completed
   */
  getConversionFunnel(filters: AnalyticsFilters = {}): Observable<AnalyticsResponse<ConversionFunnel>> {
    this._loading.set(true);
    this._error.set(null);

    let params = new HttpParams();
    if (filters.startDate) params = params.set('startDate', filters.startDate);
    if (filters.endDate) params = params.set('endDate', filters.endDate);

    return this.http.get<AnalyticsResponse<ConversionFunnel>>(
      `${this.apiUrl}/funnel`,
      { params }
    ).pipe(
      tap(() => this._loading.set(false)),
      catchError(err => {
        this._loading.set(false);
        this._error.set(err.error?.message || 'Failed to load conversion funnel');
        return throwError(() => err);
      })
    );
  }

  /**
   * Get cart abandonment insights
   * Identifies users who added items but didn't complete purchase
   */
  getCartAbandonment(filters: AnalyticsFilters = {}): Observable<AnalyticsResponse<CartAbandonment>> {
    this._loading.set(true);
    this._error.set(null);

    let params = new HttpParams();
    if (filters.startDate) params = params.set('startDate', filters.startDate);
    if (filters.endDate) params = params.set('endDate', filters.endDate);
    if (filters.limit) params = params.set('limit', filters.limit.toString());

    return this.http.get<AnalyticsResponse<CartAbandonment>>(
      `${this.apiUrl}/cart-abandonment`,
      { params }
    ).pipe(
      tap(() => this._loading.set(false)),
      catchError(err => {
        this._loading.set(false);
        this._error.set(err.error?.message || 'Failed to load cart abandonment data');
        return throwError(() => err);
      })
    );
  }

  /**
   * Get product performance metrics
   * Shows views, cart additions, purchases per product
   */
  getProductPerformance(filters: AnalyticsFilters = {}): Observable<AnalyticsResponse<ProductPerformance>> {
    this._loading.set(true);
    this._error.set(null);

    let params = new HttpParams();
    if (filters.startDate) params = params.set('startDate', filters.startDate);
    if (filters.endDate) params = params.set('endDate', filters.endDate);
    if (filters.productId) params = params.set('productId', filters.productId);
    if (filters.limit) params = params.set('limit', filters.limit.toString());

    return this.http.get<AnalyticsResponse<ProductPerformance>>(
      `${this.apiUrl}/products`,
      { params }
    ).pipe(
      tap(() => this._loading.set(false)),
      catchError(err => {
        this._loading.set(false);
        this._error.set(err.error?.message || 'Failed to load product performance');
        return throwError(() => err);
      })
    );
  }

  /**
   * Get payment failure insights
   * Analyzes failed payment attempts by method and error type
   */
  getPaymentFailures(filters: AnalyticsFilters = {}): Observable<AnalyticsResponse<PaymentFailureInsight>> {
    this._loading.set(true);
    this._error.set(null);

    let params = new HttpParams();
    if (filters.startDate) params = params.set('startDate', filters.startDate);
    if (filters.endDate) params = params.set('endDate', filters.endDate);

    return this.http.get<AnalyticsResponse<PaymentFailureInsight>>(
      `${this.apiUrl}/payments`,
      { params }
    ).pipe(
      tap(() => this._loading.set(false)),
      catchError(err => {
        this._loading.set(false);
        this._error.set(err.error?.message || 'Failed to load payment failure data');
        return throwError(() => err);
      })
    );
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this._error.set(null);
  }

  /**
   * Format date for API (ISO string)
   */
  formatDateForAPI(date: Date): string {
    return date.toISOString();
  }

  /**
   * Get default date range (last 30 days)
   */
  getDefaultDateRange(): { startDate: string; endDate: string } {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    return {
      startDate: this.formatDateForAPI(startDate),
      endDate: this.formatDateForAPI(endDate)
    };
  }
}
