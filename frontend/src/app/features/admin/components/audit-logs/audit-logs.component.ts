import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AdminService } from '../../services/admin.service';
import { AuditLog } from '../../models/admin.models';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="audit-logs-page">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-left">
          <h1>{{ 'admin.auditLogs' | translate }}</h1>
          <p class="subtitle">{{ 'admin.auditSubtitle' | translate }}</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-outline" (click)="exportLogs()">
            <i class="gi gi-ui-chart" aria-hidden="true"></i> {{ 'admin.exportExcel' | translate }}
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-bar">
        <div class="search-box">
          <input 
            type="text" 
            [placeholder]="'admin.searchAuditLogs' | translate"
            [ngModel]="searchTerm()"
            (ngModelChange)="searchTerm.set($event)">
        </div>

        <div class="filter-group">
          <select [ngModel]="actionFilter()" (ngModelChange)="onActionFilterChange($event)">
            <option value="">{{ 'admin.allActions' | translate }}</option>
            <optgroup [label]="'admin.products' | translate">
              <option value="product_create">{{ 'admin.audit.action.product_create' | translate }}</option>
              <option value="product_update">{{ 'admin.audit.action.product_update' | translate }}</option>
              <option value="product_delete">{{ 'admin.audit.action.product_delete' | translate }}</option>
              <option value="inventory_adjustment">{{ 'admin.audit.action.inventory_adjustment' | translate }}</option>
            </optgroup>
            <optgroup [label]="'admin.orders' | translate">
              <option value="order_update_status">{{ 'admin.audit.action.order_update_status' | translate }}</option>
              <option value="order_cancel">{{ 'admin.audit.action.order_cancel' | translate }}</option>
            </optgroup>
            <optgroup [label]="'admin.users' | translate">
              <option value="user_role_change">{{ 'admin.audit.action.user_role_change' | translate }}</option>
              <option value="user_ban">{{ 'admin.audit.action.user_ban' | translate }}</option>
              <option value="user_unban">{{ 'admin.audit.action.user_unban' | translate }}</option>
            </optgroup>
            <optgroup [label]="'admin.categories' | translate">
              <option value="category_create">{{ 'admin.audit.action.category_create' | translate }}</option>
              <option value="category_update">{{ 'admin.audit.action.category_update' | translate }}</option>
              <option value="category_delete">{{ 'admin.audit.action.category_delete' | translate }}</option>
            </optgroup>
            <optgroup [label]="'admin.promotions' | translate">
              <option value="promotion_create">{{ 'admin.audit.action.promotion_create' | translate }}</option>
              <option value="promotion_update">{{ 'admin.audit.action.promotion_update' | translate }}</option>
              <option value="promotion_delete">{{ 'admin.audit.action.promotion_delete' | translate }}</option>
            </optgroup>
            <optgroup [label]="'admin.system' | translate">
              <option value="admin_login">{{ 'admin.audit.action.admin_login' | translate }}</option>
              <option value="settings_update">{{ 'admin.audit.action.settings_update' | translate }}</option>
            </optgroup>
          </select>

          <select [ngModel]="entityFilter()" (ngModelChange)="onEntityFilterChange($event)">
            <option value="">{{ 'admin.allEntities' | translate }}</option>
            <option value="product">{{ 'admin.productName' | translate }}</option>
            <option value="order">{{ 'admin.orders' | translate }}</option>
            <option value="user">{{ 'admin.users' | translate }}</option>
            <option value="category">{{ 'admin.categories' | translate }}</option>
            <option value="promotion">{{ 'admin.promotions' | translate }}</option>
            <option value="system">{{ 'admin.system' | translate }}</option>
          </select>

          <input 
            type="date" 
            [ngModel]="startDateFilter()"
            (ngModelChange)="onStartDateChange($event)"
            placeholder="Từ ngày"
            class="date-filter">
          
          <input 
            type="date" 
            [ngModel]="endDateFilter()"
            (ngModelChange)="onEndDateChange($event)"
            placeholder="Đến ngày"
            class="date-filter">
          
          <button class="btn-clear-filter" (click)="clearFilters()" title="Xóa bộ lọc">
            <i class="gi gi-ui-delete" aria-hidden="true"></i> {{ 'admin.clearFilters' | translate }}
          </button>
        </div>
      </div>

      <!-- Loading State -->
      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>{{ 'admin.loading' | translate }}</p>
        </div>
      }

      <!-- Logs Timeline -->
      @if (!loading()) {
        <div class="logs-container">
          <div class="timeline">
            @for (log of filteredLogs(); track log._id) {
              <div class="log-item" [class]="getLogClass(log)">
                <div class="log-badge">
                  {{ getLogBadge(log.action) }}
                </div>
                <div class="log-content">
                  <div class="log-header">
                    <span class="log-action">{{ getActionLabel(log.action) }}</span>
                    <span class="log-time">{{ formatDateTime(log.createdAt) }}</span>
                  </div>
                  <div class="log-details">
                    <span class="log-user">
                      {{ log.user.name || log.user.email || ('admin.system' | translate) }}
                    </span>
                    @if (log.entityType && log.entityId) {
                      <span class="log-entity">
                        {{ getEntityLabel(log.entityType) }}: {{ log.entityId }}
                      </span>
                    }
                  </div>
                  @if (log.description) {
                    <p class="log-description">{{ log.description }}</p>
                  }
                  @if (log.changes && hasChanges(log.changes)) {
                    <div class="log-changes">
                      <button class="toggle-changes" (click)="toggleChanges(log._id)">
                        <i class="gi" [class.gi-ui-chevron-down]="expandedLogs().has(log._id)" [class.gi-ui-chevron-right]="!expandedLogs().has(log._id)" aria-hidden="true"></i>
                        {{ 'admin.viewChanges' | translate }}
                      </button>
                      @if (expandedLogs().has(log._id)) {
                        <div class="changes-detail">
                          @if (log.changes['before']) {
                            <div class="change-section before">
                              <span class="label">{{ 'admin.before' | translate }}:</span>
                              <pre>{{ formatChanges(log.changes['before']) }}</pre>
                            </div>
                          }
                          @if (log.changes['after']) {
                            <div class="change-section after">
                              <span class="label">{{ 'admin.after' | translate }}:</span>
                              <pre>{{ formatChanges(log.changes['after']) }}</pre>
                            </div>
                          }
                        </div>
                      }
                    </div>
                  }
                  @if (log.ipAddress) {
                    <div class="log-meta">
                      <span>IP: {{ log.ipAddress }}</span>
                    </div>
                  }
                </div>
              </div>
            } @empty {
              <div class="empty-state">
                <p>{{ 'admin.noActivities' | translate }}</p>
              </div>
            }
          </div>
        </div>

        <!-- Pagination -->
        @if (pagination().pages > 1) {
          <div class="pagination">
            <button 
              class="page-btn" 
              [disabled]="pagination().page === 1"
              (click)="goToPage(pagination().page - 1)">
              {{ 'common.previous' | translate }}
            </button>
            
            <span class="page-info">
              {{ 'common.page' | translate }} {{ pagination().page }} / {{ pagination().pages }}
            </span>
            
            <button 
              class="page-btn" 
              [disabled]="pagination().page === pagination().pages"
              (click)="goToPage(pagination().page + 1)">
              {{ 'common.next' | translate }}
            </button>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .audit-logs-page {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .page-header h1 {
      font-size: 24px;
      font-weight: 700;
      color: #1a1a1a;
      margin: 0;
    }

    .subtitle {
      color: #666;
      margin: 4px 0 0;
    }

    .btn {
      padding: 10px 20px;
      border: 2px solid transparent;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
    }

    .btn-outline {
      background: #fff;
      border-color: #e6e6ea;
      color: #153243;
    }

    .btn-outline:hover {
      background: #e6e6ea;
      border-color: #153243;
    }

    /* Filters */
    .filters-bar {
      display: flex;
      gap: 16px;
      align-items: center;
      margin-bottom: 24px;
      flex-wrap: wrap;
      background: #fff;
      padding: 16px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }

    .search-box {
      position: relative;
      flex: 1;
      min-width: 300px;
      max-width: 400px;
    }

    .search-box img {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      width: 18px;
      height: 18px;
      opacity: 0.5;
    }

    .search-box input {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 14px;
    }

    .search-box input:focus {
      outline: none;
      border-color: #153243;
    }

    .filter-group {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .filter-group select,
    .filter-group input[type="date"] {
      padding: 10px 16px;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 14px;
      background: #fff;
      cursor: pointer;
      width: 550px;
    }

    .filter-group select:focus,
    .filter-group input:focus {
      outline: none;
      border-color: #153243;
    }

    .btn-clear-filter {
      padding: 10px 16px;
      border: 2px solid #e6e6ea;
      border-radius: 8px;
      background: #fff;
      color: #153243;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
    }

    .btn-clear-filter:hover {
      background: #153243;
      color: #fff;
      border-color: #153243;
    }

    /* Loading */
    .loading-state {
      text-align: center;
      padding: 60px 20px;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #f0f0f0;
      border-top-color: #153243;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 16px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Timeline */
    .logs-container {
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      padding: 24px;
    }

    .timeline {
      position: relative;
    }

    .timeline::before {
      content: '';
      position: absolute;
      left: 20px;
      top: 0;
      bottom: 0;
      width: 2px;
      background: #e0e0e0;
    }

    .log-item {
      display: flex;
      gap: 16px;
      padding: 16px 0;
      position: relative;
    }

    .log-item:not(:last-child) {
      border-bottom: 1px solid #f5f5f5;
    }

    .log-badge {
      width: 42px;
      height: 42px;
      border-radius: 8px;
      background: #153243;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      font-weight: 700;
      flex-shrink: 0;
      position: relative;
      z-index: 1;
      letter-spacing: 1px;
    }

    .log-item.create .log-badge {
      background: #c3d350;
      color: #153243;
    }

    .log-item.update .log-badge {
      background: #284b63;
      color: #fff;
    }

    .log-item.delete .log-badge {
      background: #e6e6ea;
      color: #153243;
    }

    .log-item.system .log-badge {
      background: #153243;
      color: #c3d350;
    }

    .log-content {
      flex: 1;
    }

    .log-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .log-action {
      font-weight: 600;
      font-size: 15px;
      color: #1a1a1a;
    }

    .log-time {
      font-size: 13px;
      color: #999;
    }

    .log-details {
      display: flex;
      gap: 16px;
      font-size: 13px;
      color: #666;
      margin-bottom: 8px;
    }

    .log-user {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .log-entity {
      font-family: monospace;
      background: #f5f5f5;
      padding: 2px 8px;
      border-radius: 4px;
    }

    .log-description {
      font-size: 14px;
      color: #555;
      margin: 8px 0;
      line-height: 1.5;
    }

    .log-changes {
      margin-top: 8px;
    }

    .toggle-changes {
      background: none;
      border: none;
      color: #669bbc;
      cursor: pointer;
      font-size: 13px;
      padding: 4px 0;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .toggle-changes:hover {
      text-decoration: underline;
    }

    .changes-detail {
      margin-top: 12px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .change-section {
      padding: 12px;
      border-radius: 8px;
      font-size: 13px;
    }

    .change-section.before {
      background: #fef5f5;
      border: 1px solid #fed7d7;
    }

    .change-section.after {
      background: #f0fff4;
      border: 1px solid #9ae6b4;
    }

    .change-section .label {
      display: block;
      font-weight: 600;
      margin-bottom: 8px;
      color: #666;
    }

    .change-section pre {
      margin: 0;
      white-space: pre-wrap;
      word-break: break-word;
      font-family: monospace;
      font-size: 12px;
      line-height: 1.5;
    }

    .log-meta {
      font-size: 12px;
      color: #999;
      margin-top: 8px;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #999;
    }

    /* Pagination */
    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 16px;
      margin-top: 24px;
    }

    .page-btn {
      padding: 8px 20px;
      border: 1px solid #ddd;
      background: #fff;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
    }

    .page-btn:hover:not(:disabled) {
      background: #f5f5f5;
    }

    .page-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .page-info {
      font-size: 14px;
      color: #666;
    }

    @media (max-width: 768px) {
      .filters-bar {
        flex-direction: column;
        align-items: stretch;
      }

      .search-box {
        max-width: none;
      }

      .filter-group {
        flex-direction: column;
      }

      .changes-detail {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class AuditLogsComponent implements OnInit {
  adminService = inject(AdminService);
  private translate = inject(TranslateService);

  logs = signal<AuditLog[]>([]);
  loading = signal(false);
  pagination = signal({ page: 1, limit: 50, total: 0, pages: 1 });
  expandedLogs = signal<Set<string>>(new Set());

  // Filters as signals
  searchTerm = signal('');
  actionFilter = signal('');
  entityFilter = signal('');
  startDateFilter = signal('');
  endDateFilter = signal('');
  private searchTimeout: any;

  // Search filters locally (client-side) by:
  // - User name (log.user.name)
  // - User email (log.user.email)
  // - Action code (log.action - e.g. "product_create")
  // - Action label (translated - e.g. "Tạo sản phẩm mới")
  // - Description (log.description)
  filteredLogs = computed(() => {
    let result = [...this.logs()];
    
    const search = this.searchTerm().trim();
    if (search) {
      const term = search.toLowerCase();
      result = result.filter(log => {
        const actionLabel = this.getActionLabel(log.action).toLowerCase();
        return (
          log.user?.name?.toLowerCase().includes(term) ||
          log.user?.email?.toLowerCase().includes(term) ||
          log.action.toLowerCase().includes(term) ||
          actionLabel.includes(term) ||
          log.description?.toLowerCase().includes(term)
        );
      });
    }
    
    return result;
  });

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    this.loading.set(true);
    
    const params: any = { 
      page: this.pagination().page, 
      limit: this.pagination().limit 
    };
    
    const actionVal = this.actionFilter();
    const entityVal = this.entityFilter();
    const startDateVal = this.startDateFilter();
    const endDateVal = this.endDateFilter();
    
    if (actionVal) params.action = actionVal;
    if (entityVal) params.entityType = entityVal;
    
    // Set startDate to beginning of day (00:00:00)
    if (startDateVal) {
      params.startDate = new Date(startDateVal + 'T00:00:00').toISOString();
    }
    
    // Set endDate to end of day (23:59:59)
    if (endDateVal) {
      params.endDate = new Date(endDateVal + 'T23:59:59').toISOString();
    }

    this.adminService.loadAuditLogs(params).subscribe({
      next: (response: any) => {
        this.logs.set(response.data || []);
        this.pagination.set({
          page: response.pagination?.page || 1,
          limit: response.pagination?.limit || 50,
          total: response.pagination?.total || 0,
          pages: response.pagination?.pages || 1
        });
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  onActionFilterChange(value: string): void {
    this.actionFilter.set(value);
    this.applyFilters();
  }

  onEntityFilterChange(value: string): void {
    this.entityFilter.set(value);
    this.applyFilters();
  }

  onStartDateChange(value: string): void {
    this.startDateFilter.set(value);
    this.applyFilters();
  }

  onEndDateChange(value: string): void {
    this.endDateFilter.set(value);
    this.applyFilters();
  }

  applyFilters(): void {
    this.pagination.update(p => ({ ...p, page: 1 }));
    this.loadLogs();
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.actionFilter.set('');
    this.entityFilter.set('');
    this.startDateFilter.set('');
    this.endDateFilter.set('');
    this.pagination.update(p => ({ ...p, page: 1 }));
    this.loadLogs();
  }

  goToPage(page: number): void {
    this.pagination.update(p => ({ ...p, page }));
    this.loadLogs();
  }

  toggleChanges(logId: string): void {
    this.expandedLogs.update(set => {
      const newSet = new Set(set);
      if (newSet.has(logId)) {
        newSet.delete(logId);
      } else {
        newSet.add(logId);
      }
      return newSet;
    });
  }

  hasChanges(changes: any): boolean {
    return changes && (changes.before || changes.after);
  }

  formatChanges(obj: any): string {
    if (!obj) return '';
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  }

  getLogClass(log: AuditLog): string {
    if (log.action.includes('create')) return 'create';
    if (log.action.includes('update')) return 'update';
    if (log.action.includes('delete') || log.action.includes('cancel') || log.action.includes('ban')) return 'delete';
    return 'system';
  }

  getLogBadge(action: string): string {
    const badges: Record<string, string> = {
      // Products
      'product_create': 'C',
      'product_update': 'U',
      'product_delete': 'D',
      'product_bulk_delete': 'D',
      'product_import': 'I',
      'product_export': 'E',
      // Categories
      'category_create': 'C',
      'category_update': 'U',
      'category_delete': 'D',
      // Orders
      'order_view': 'V',
      'order_update_status': 'U',
      'order_cancel': 'X',
      'order_refund': 'R',
      'order_add_note': 'N',
      // Users
      'user_create': 'C',
      'user_update': 'U',
      'user_delete': 'D',
      'user_role_change': 'R',
      'user_ban': 'B',
      'user_unban': 'U',
      // Promotions
      'promotion_create': 'C',
      'promotion_update': 'U',
      'promotion_delete': 'D',
      'promotion_activate': 'A',
      'promotion_deactivate': 'D',
      // Inventory
      'inventory_update': 'U',
      'inventory_adjustment': 'A',
      'stock_alert': 'W',
      // System
      'admin_login': 'L',
      'admin_logout': 'O',
      'settings_update': 'S',
      'export_data': 'E',
      'import_data': 'I'
    };
    return badges[action] || 'A';
  }

  getActionLabel(action: string): string {
    const key = `admin.audit.action.${action}`;
    const translated = this.translate.instant(key);
    return translated !== key ? translated : action;
  }

  getEntityLabel(entityType: string): string {
    const key = `admin.audit.entity.${entityType}`;
    const translated = this.translate.instant(key);
    return translated !== key ? translated : entityType;
  }

  exportLogs(): void {
    const logs = this.filteredLogs();
    const excelData = logs.map(log => ({
      [this.translate.instant('admin.audit.export.time')]: this.formatDateTime(log.createdAt),
      [this.translate.instant('admin.audit.export.action')]: this.getActionLabel(log.action),
      [this.translate.instant('admin.audit.export.actor')]: log.user?.name || log.user?.email || this.translate.instant('admin.system'),
      [this.translate.instant('admin.audit.export.entity')]: log.entityType ? `${this.getEntityLabel(log.entityType)}: ${log.entityId}` : '',
      [this.translate.instant('admin.audit.export.description')]: log.description || ''
    }));
    
    import('xlsx').then(XLSX => {
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Audit Logs');
      XLSX.writeFile(wb, `audit_logs_${new Date().toISOString().split('T')[0]}.xlsx`);
    });
  }

  formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleString('vi-VN');
  }
}
