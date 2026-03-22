import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  DashboardStats,
  AdminProduct,
  AdminCategory,
  AdminOrder,
  AdminUser,
  AdminPromotion,
  AuditLog,
  PaginatedResponse,
  ProductFormData,
  CategoryFormData,
  PromotionFormData,
  OrderStatusUpdate,
  StockUpdate
} from '../models/admin.models';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/admin`;

  // State signals
  private _loading = signal(false);
  private _error = signal<string | null>(null);
  private _dashboardStats = signal<DashboardStats | null>(null);
  private _products = signal<AdminProduct[]>([]);
  private _categories = signal<AdminCategory[]>([]);
  private _orders = signal<AdminOrder[]>([]);
  private _users = signal<AdminUser[]>([]);
  private _promotions = signal<AdminPromotion[]>([]);
  private _auditLogs = signal<AuditLog[]>([]);
  private _lowStockThreshold = signal<number>(10); // Default value
  private _currency = signal<string>('GBP'); // Default currency
  private _exchangeRates = signal<any>(null); // Exchange rates from API

  // Pagination
  private _productPagination = signal({ page: 1, limit: 20, total: 0, pages: 0 });
  private _orderPagination = signal({ page: 1, limit: 20, total: 0, pages: 0 });
  private _userPagination = signal({ page: 1, limit: 20, total: 0, pages: 0 });
  private _auditPagination = signal({ page: 1, limit: 50, total: 0, pages: 0 });

  // Public readonly signals
  loading = this._loading.asReadonly();
  error = this._error.asReadonly();
  dashboardStats = this._dashboardStats.asReadonly();
  products = this._products.asReadonly();
  categories = this._categories.asReadonly();
  orders = this._orders.asReadonly();
  users = this._users.asReadonly();
  promotions = this._promotions.asReadonly();
  auditLogs = this._auditLogs.asReadonly();
  lowStockThreshold = this._lowStockThreshold.asReadonly();
  currency = this._currency.asReadonly();
  exchangeRates = this._exchangeRates.asReadonly();

  productPagination = this._productPagination.asReadonly();
  orderPagination = this._orderPagination.asReadonly();
  userPagination = this._userPagination.asReadonly();
  auditPagination = this._auditPagination.asReadonly();

  // Computed values
  lowStockProducts = computed(() => 
    this._products().filter(p => p.stockQuantity <= 10)
  );

  activePromotions = computed(() =>
    this._promotions().filter(p => 
      p.active && new Date(p.endDate) >= new Date()
    )
  );

  // ================================
  // DASHBOARD
  // ================================

  loadDashboardStats(dateRange?: { startDate?: string; endDate?: string }): Observable<{ success: boolean; data: DashboardStats }> {
    this._loading.set(true);
    this._error.set(null);

    let params = new HttpParams();
    if (dateRange?.startDate) {
      params = params.set('startDate', dateRange.startDate);
    }
    if (dateRange?.endDate) {
      params = params.set('endDate', dateRange.endDate);
    }

    return this.http.get<{ success: boolean; data: DashboardStats }>(`${this.apiUrl}/dashboard`, { params }).pipe(
      tap(response => {
        this._dashboardStats.set(response.data);
        this._loading.set(false);
      }),
      catchError(err => {
        this._error.set(err.error?.message || 'Failed to load dashboard stats');
        this._loading.set(false);
        return throwError(() => err);
      })
    );
  }

  // Load dashboard stats without updating the main signal (for previous period comparison)
  loadDashboardStatsWithoutSetting(dateRange?: { startDate?: string; endDate?: string }): Observable<{ success: boolean; data: DashboardStats }> {
    let params = new HttpParams();
    if (dateRange?.startDate) {
      params = params.set('startDate', dateRange.startDate);
    }
    if (dateRange?.endDate) {
      params = params.set('endDate', dateRange.endDate);
    }

    return this.http.get<{ success: boolean; data: DashboardStats }>(`${this.apiUrl}/dashboard`, { params }).pipe(
      catchError(err => {
        console.error('Failed to load previous period stats:', err);
        return throwError(() => err);
      })
    );
  }

  // ================================
  // PRODUCTS
  // ================================

  loadProducts(params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    inStock?: boolean;
    lowStock?: boolean;
  }): Observable<PaginatedResponse<AdminProduct>> {
    this._loading.set(true);
    this._error.set(null);

    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.category) httpParams = httpParams.set('category', params.category);
    if (params?.inStock !== undefined) httpParams = httpParams.set('inStock', params.inStock.toString());
    if (params?.lowStock) httpParams = httpParams.set('lowStock', 'true');

    return this.http.get<PaginatedResponse<AdminProduct>>(`${this.apiUrl}/products`, { params: httpParams }).pipe(
      tap(response => {
        this._products.set(response.data);
        this._productPagination.set(response.pagination);
        this._loading.set(false);
      }),
      catchError(err => {
        this._error.set(err.error?.message || 'Failed to load products');
        this._loading.set(false);
        return throwError(() => err);
      })
    );
  }

  createProduct(data: ProductFormData): Observable<{ success: boolean; data: AdminProduct }> {
    this._loading.set(true);
    return this.http.post<{ success: boolean; data: AdminProduct }>(`${this.apiUrl}/products`, data).pipe(
      tap(response => {
        this._products.update(products => [response.data, ...products]);
        this._loading.set(false);
      }),
      catchError(err => {
        this._error.set(err.error?.message || 'Failed to create product');
        this._loading.set(false);
        return throwError(() => err);
      })
    );
  }

  getProductById(id: string): Observable<{ success: boolean; data: AdminProduct }> {
    return this.http.get<{ success: boolean; data: AdminProduct }>(`${this.apiUrl}/products/${id}`);
  }

  updateProduct(id: string, data: Partial<ProductFormData>): Observable<{ success: boolean; data: AdminProduct }> {
    this._loading.set(true);
    return this.http.put<{ success: boolean; data: AdminProduct }>(`${this.apiUrl}/products/${id}`, data).pipe(
      tap(response => {
        this._products.update(products =>
          products.map(p => p._id === id ? response.data : p)
        );
        this._loading.set(false);
      }),
      catchError(err => {
        this._error.set(err.error?.message || 'Failed to update product');
        this._loading.set(false);
        return throwError(() => err);
      })
    );
  }

  deleteProduct(id: string): Observable<{ success: boolean; message: string }> {
    this._loading.set(true);
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/products/${id}`).pipe(
      tap(() => {
        this._products.update(products => products.filter(p => p._id !== id));
        this._loading.set(false);
      }),
      catchError(err => {
        this._error.set(err.error?.message || 'Failed to delete product');
        this._loading.set(false);
        return throwError(() => err);
      })
    );
  }

  bulkDeleteProducts(ids: string[]): Observable<{ success: boolean; message: string }> {
    this._loading.set(true);
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/products`, { body: { ids } }).pipe(
      tap(() => {
        this._products.update(products => products.filter(p => !ids.includes(p._id)));
        this._loading.set(false);
      }),
      catchError(err => {
        this._error.set(err.error?.message || 'Failed to delete products');
        this._loading.set(false);
        return throwError(() => err);
      })
    );
  }

  updateProductStock(id: string, stockQuantity: number, reason?: string): Observable<{ success: boolean; data: AdminProduct }> {
    return this.http.patch<{ success: boolean; data: AdminProduct }>(`${this.apiUrl}/products/${id}/stock`, { stockQuantity, reason }).pipe(
      tap(response => {
        this._products.update(products =>
          products.map(p => p._id === id ? response.data : p)
        );
      })
    );
  }

  // ================================
  // CATEGORIES
  // ================================

  loadCategories(): Observable<{ success: boolean; data: AdminCategory[] }> {
    this._loading.set(true);
    return this.http.get<{ success: boolean; data: AdminCategory[] }>(`${this.apiUrl}/categories`).pipe(
      tap(response => {
        this._categories.set(response.data);
        this._loading.set(false);
      }),
      catchError(err => {
        this._error.set(err.error?.message || 'Failed to load categories');
        this._loading.set(false);
        return throwError(() => err);
      })
    );
  }

  createCategory(data: CategoryFormData): Observable<{ success: boolean; data: AdminCategory }> {
    this._loading.set(true);
    return this.http.post<{ success: boolean; data: AdminCategory }>(`${this.apiUrl}/categories`, data).pipe(
      tap(response => {
        this._categories.update(categories => [...categories, { ...response.data, productCount: 0 }]);
        this._loading.set(false);
      }),
      catchError(err => {
        this._error.set(err.error?.message || 'Failed to create category');
        this._loading.set(false);
        return throwError(() => err);
      })
    );
  }

  updateCategory(id: string, data: Partial<CategoryFormData>): Observable<{ success: boolean; data: AdminCategory }> {
    this._loading.set(true);
    return this.http.put<{ success: boolean; data: AdminCategory }>(`${this.apiUrl}/categories/${id}`, data).pipe(
      tap(response => {
        this._categories.update(categories =>
          categories.map(c => c._id === id ? { ...response.data, productCount: c.productCount } : c)
        );
        this._loading.set(false);
      }),
      catchError(err => {
        this._error.set(err.error?.message || 'Failed to update category');
        this._loading.set(false);
        return throwError(() => err);
      })
    );
  }

  deleteCategory(id: string): Observable<{ success: boolean; message: string }> {
    this._loading.set(true);
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/categories/${id}`).pipe(
      tap(() => {
        this._categories.update(categories => categories.filter(c => c._id !== id));
        this._loading.set(false);
      }),
      catchError(err => {
        this._error.set(err.error?.message || 'Failed to delete category');
        this._loading.set(false);
        return throwError(() => err);
      })
    );
  }

  // ================================
  // ORDERS
  // ================================

  loadOrders(params?: {
    page?: number;
    limit?: number;
    status?: string;
    paymentStatus?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }): Observable<PaginatedResponse<AdminOrder>> {
    this._loading.set(true);
    this._error.set(null);

    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params?.status) httpParams = httpParams.set('status', params.status);
    if (params?.paymentStatus) httpParams = httpParams.set('paymentStatus', params.paymentStatus);
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.startDate) httpParams = httpParams.set('startDate', params.startDate);
    if (params?.endDate) httpParams = httpParams.set('endDate', params.endDate);

    return this.http.get<PaginatedResponse<AdminOrder>>(`${this.apiUrl}/orders`, { params: httpParams }).pipe(
      tap(response => {
        this._orders.set(response.data);
        this._orderPagination.set(response.pagination);
        this._loading.set(false);
      }),
      catchError(err => {
        this._error.set(err.error?.message || 'Failed to load orders');
        this._loading.set(false);
        return throwError(() => err);
      })
    );
  }

  getOrderById(id: string): Observable<{ success: boolean; data: AdminOrder }> {
    return this.http.get<{ success: boolean; data: AdminOrder }>(`${this.apiUrl}/orders/${id}`);
  }

  updateOrderStatus(id: string, data: OrderStatusUpdate): Observable<{ success: boolean; data: AdminOrder }> {
    return this.http.patch<{ success: boolean; data: AdminOrder }>(`${this.apiUrl}/orders/${id}/status`, data).pipe(
      tap(response => {
        this._orders.update(orders =>
          orders.map(o => o._id === id ? response.data : o)
        );
      })
    );
  }

  cancelOrder(id: string, reason?: string): Observable<{ success: boolean; data: AdminOrder; message: string }> {
    return this.http.patch<{ success: boolean; data: AdminOrder; message: string }>(`${this.apiUrl}/orders/${id}/cancel`, { reason }).pipe(
      tap(response => {
        this._orders.update(orders =>
          orders.map(o => o._id === id ? response.data : o)
        );
      })
    );
  }

  // ================================
  // USERS
  // ================================

  loadUsers(params?: {
    page?: number;
    limit?: number;
    role?: string;
    search?: string;
    active?: boolean;
  }): Observable<PaginatedResponse<AdminUser>> {
    this._loading.set(true);
    this._error.set(null);

    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params?.role) httpParams = httpParams.set('role', params.role);
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.active !== undefined) httpParams = httpParams.set('active', params.active.toString());

    return this.http.get<PaginatedResponse<AdminUser>>(`${this.apiUrl}/users`, { params: httpParams }).pipe(
      tap(response => {
        this._users.set(response.data);
        this._userPagination.set(response.pagination);
        this._loading.set(false);
      }),
      catchError(err => {
        this._error.set(err.error?.message || 'Failed to load users');
        this._loading.set(false);
        return throwError(() => err);
      })
    );
  }

  getUserById(id: string): Observable<{ success: boolean; data: AdminUser & { recentOrders: AdminOrder[] } }> {
    return this.http.get<{ success: boolean; data: AdminUser & { recentOrders: AdminOrder[] } }>(`${this.apiUrl}/users/${id}`);
  }

  updateUserRole(id: string, role: 'user' | 'admin'): Observable<{ success: boolean; data: AdminUser }> {
    return this.http.patch<{ success: boolean; data: AdminUser }>(`${this.apiUrl}/users/${id}/role`, { role }).pipe(
      tap(response => {
        this._users.update(users =>
          users.map(u => u._id === id ? { ...u, role: response.data.role } : u)
        );
      })
    );
  }

  toggleUserStatus(id: string): Observable<{ success: boolean; data: AdminUser; message: string }> {
    return this.http.patch<{ success: boolean; data: AdminUser; message: string }>(`${this.apiUrl}/users/${id}/status`, {}).pipe(
      tap(response => {
        this._users.update(users =>
          users.map(u => u._id === id ? { ...u, isActive: response.data.isActive } : u)
        );
      })
    );
  }

  // ================================
  // PROMOTIONS
  // ================================

  loadPromotions(params?: {
    active?: boolean;
    type?: string;
  }): Observable<{ success: boolean; data: AdminPromotion[] }> {
    this._loading.set(true);
    this._error.set(null);

    let httpParams = new HttpParams();
    if (params?.active !== undefined) httpParams = httpParams.set('active', params.active.toString());
    if (params?.type) httpParams = httpParams.set('type', params.type);

    return this.http.get<{ success: boolean; data: AdminPromotion[] }>(`${this.apiUrl}/promotions`, { params: httpParams }).pipe(
      tap(response => {
        this._promotions.set(response.data);
        this._loading.set(false);
      }),
      catchError(err => {
        this._error.set(err.error?.message || 'Failed to load promotions');
        this._loading.set(false);
        return throwError(() => err);
      })
    );
  }

  createPromotion(data: PromotionFormData): Observable<{ success: boolean; data: AdminPromotion }> {
    this._loading.set(true);
    return this.http.post<{ success: boolean; data: AdminPromotion }>(`${this.apiUrl}/promotions`, data).pipe(
      tap(response => {
        this._promotions.update(promotions => [response.data, ...promotions]);
        this._loading.set(false);
      }),
      catchError(err => {
        this._error.set(err.error?.message || 'Failed to create promotion');
        this._loading.set(false);
        return throwError(() => err);
      })
    );
  }

  updatePromotion(id: string, data: Partial<PromotionFormData>): Observable<{ success: boolean; data: AdminPromotion }> {
    this._loading.set(true);
    return this.http.put<{ success: boolean; data: AdminPromotion }>(`${this.apiUrl}/promotions/${id}`, data).pipe(
      tap(response => {
        this._promotions.update(promotions =>
          promotions.map(p => p._id === id ? response.data : p)
        );
        this._loading.set(false);
      }),
      catchError(err => {
        this._error.set(err.error?.message || 'Failed to update promotion');
        this._loading.set(false);
        return throwError(() => err);
      })
    );
  }

  deletePromotion(id: string): Observable<{ success: boolean; message: string }> {
    this._loading.set(true);
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/promotions/${id}`).pipe(
      tap(() => {
        this._promotions.update(promotions => promotions.filter(p => p._id !== id));
        this._loading.set(false);
      }),
      catchError(err => {
        this._error.set(err.error?.message || 'Failed to delete promotion');
        this._loading.set(false);
        return throwError(() => err);
      })
    );
  }

  togglePromotionStatus(id: string): Observable<{ success: boolean; data: AdminPromotion }> {
    return this.http.patch<{ success: boolean; data: AdminPromotion }>(`${this.apiUrl}/promotions/${id}/status`, {}).pipe(
      tap(response => {
        this._promotions.update(promotions =>
          promotions.map(p => p._id === id ? response.data : p)
        );
      })
    );
  }

  // ================================
  // INVENTORY
  // ================================

  updateStock(id: string, stock: number): Observable<{ success: boolean; data: AdminProduct }> {
    return this.http.patch<{ success: boolean; data: AdminProduct }>(`${this.apiUrl}/inventory/${id}/stock`, { stock }).pipe(
      tap(response => {
        this._products.update(products =>
          products.map(p => p._id === id ? { ...p, stock: response.data.stock } : p)
        );
      })
    );
  }

  getLowStockProducts(threshold?: number): Observable<{ success: boolean; data: AdminProduct[] }> {
    let httpParams = new HttpParams();
    if (threshold) httpParams = httpParams.set('threshold', threshold.toString());

    return this.http.get<{ success: boolean; data: AdminProduct[] }>(`${this.apiUrl}/inventory/low-stock`, { params: httpParams });
  }

  bulkUpdateStock(updates: StockUpdate[]): Observable<{ success: boolean; data: any[] }> {
    return this.http.patch<{ success: boolean; data: any[] }>(`${this.apiUrl}/inventory/bulk-update`, { updates });
  }

  // ================================
  // AUDIT LOGS
  // ================================

  loadAuditLogs(params?: {
    page?: number;
    limit?: number;
    action?: string;
    entityType?: string;
    user?: string;
    startDate?: string;
    endDate?: string;
  }): Observable<PaginatedResponse<AuditLog>> {
    this._loading.set(true);
    this._error.set(null);

    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params?.action) httpParams = httpParams.set('action', params.action);
    if (params?.entityType) httpParams = httpParams.set('entityType', params.entityType);
    if (params?.user) httpParams = httpParams.set('user', params.user);
    if (params?.startDate) httpParams = httpParams.set('startDate', params.startDate);
    if (params?.endDate) httpParams = httpParams.set('endDate', params.endDate);

    return this.http.get<PaginatedResponse<AuditLog>>(`${this.apiUrl}/audit-logs`, { params: httpParams }).pipe(
      tap(response => {
        this._auditLogs.set(response.data);
        this._auditPagination.set(response.pagination);
        this._loading.set(false);
      }),
      catchError(err => {
        this._error.set(err.error?.message || 'Failed to load audit logs');
        this._loading.set(false);
        return throwError(() => err);
      })
    );
  }

  // ================================
  // SETTINGS
  // ================================

  loadSettings(): Observable<any> {
    this._loading.set(true);
    this._error.set(null);

    return this.http.get<any>(`${this.apiUrl}/settings`).pipe(
      tap((response) => {
        this._loading.set(false);
        // Update lowStockThreshold when settings loaded
        if (response.data?.lowStockThreshold) {
          this._lowStockThreshold.set(response.data.lowStockThreshold);
        }
        // Update currency and exchange rates
        if (response.data?.currency) {
          this._currency.set(response.data.currency);
        }
        if (response.exchangeRates) {
          this._exchangeRates.set(response.exchangeRates);
        }
      }),
      catchError(err => {
        this._error.set(err.error?.message || 'Failed to load settings');
        this._loading.set(false);
        return throwError(() => err);
      })
    );
  }

  updateSettings(settings: any): Observable<any> {
    this._loading.set(true);
    this._error.set(null);

    return this.http.put<any>(`${this.apiUrl}/settings`, settings).pipe(
      tap((response) => {
        this._loading.set(false);
        // Update lowStockThreshold when settings updated
        if (settings.lowStockThreshold !== undefined) {
          this._lowStockThreshold.set(settings.lowStockThreshold);
        }        // Update currency when settings updated
        if (response.data?.currency) {
          this._currency.set(response.data.currency);
        }
        // Reload exchange rates after currency change
        this.loadSettings().subscribe();      }),
      catchError(err => {
        this._error.set(err.error?.message || 'Failed to update settings');
        this._loading.set(false);
        return throwError(() => err);
      })
    );
  }

  resetSettings(): Observable<any> {
    this._loading.set(true);
    this._error.set(null);

    return this.http.post<any>(`${this.apiUrl}/settings/reset`, {}).pipe(
      tap(() => {
        this._loading.set(false);
      }),
      catchError(err => {
        this._error.set(err.error?.message || 'Failed to reset settings');
        this._loading.set(false);
        return throwError(() => err);
      })
    );
  }

  // ================================
  // UTILITY METHODS
  // ================================

  clearError(): void {
    this._error.set(null);
  }

  clearState(): void {
    this._dashboardStats.set(null);
    this._products.set([]);
    this._categories.set([]);
    this._orders.set([]);
    this._users.set([]);
    this._promotions.set([]);
    this._auditLogs.set([]);
    this._error.set(null);
  }
}
