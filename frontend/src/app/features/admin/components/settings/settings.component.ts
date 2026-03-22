import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AdminService } from '../../services/admin.service';
import { environment } from '../../../../../environments/environment';

interface ShopSettings {
  shopName: string;
  shopDescription: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  currency: string;
  taxRate: number;
  shippingFee: number;
  freeShippingThreshold: number;
  orderPrefix: string;
  lowStockThreshold: number;
  maintenanceMode: boolean;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="settings-page">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-left">
          <h1>{{ 'admin.settings' | translate }}</h1>
          <p class="subtitle">{{ 'admin.settingsSubtitle' | translate }}</p>
        </div>
        <button class="btn btn-primary" (click)="saveSettings()" [disabled]="saving()">
          {{ saving() ? ('profile.saving' | translate) : ('admin.saveChanges' | translate) }}
        </button>
      </div>

      <!-- Settings Sections -->
      <div class="settings-grid">
        <!-- General Settings -->
        <div class="settings-card">
          <div class="card-header">
            <h3>{{ 'admin.shopInfo' | translate }}</h3>
          </div>
          <div class="card-body">
            <div class="form-group">
              <label>{{ 'admin.shopName' | translate }}</label>
              <input type="text" [(ngModel)]="settings.shopName" placeholder="Ponsai Store">
            </div>
            <div class="form-group">
              <label>{{ 'admin.description' | translate }}</label>
              <textarea [(ngModel)]="settings.shopDescription" rows="3" [placeholder]="'admin.shopDescriptionPlaceholder' | translate"></textarea>
            </div>
            <div class="form-group">
              <label>{{ 'admin.contactEmail' | translate }}</label>
              <input type="email" [(ngModel)]="settings.contactEmail" placeholder="contact@ponsai.vn">
            </div>
            <div class="form-group">
              <label>{{ 'admin.contactPhone' | translate }}</label>
              <input type="tel" [(ngModel)]="settings.contactPhone" placeholder="0123 456 789">
            </div>
            <div class="form-group">
              <label>{{ 'admin.address' | translate }}</label>
              <textarea [(ngModel)]="settings.address" rows="2" [placeholder]="'admin.addressPlaceholder' | translate"></textarea>
            </div>
          </div>
        </div>

        <!-- Order Settings -->
        <div class="settings-card">
          <div class="card-header">
            <h3>{{ 'admin.orderSettings' | translate }}</h3>
          </div>
          <div class="card-body">
            <div class="form-group">
              <label>{{ 'admin.currency' | translate }}</label>
              <select [(ngModel)]="settings.currency">
                <option value="GBP">GBP - British Pound</option>
                <option value="USD">USD - US Dollar</option>
                <option value="VND">VND - Việt Nam Đồng</option>
              </select>
            </div>
            <div class="form-group">
              <label>{{ 'admin.tax' | translate }} (%)</label>
              <div class="input-with-suffix">
                <input type="number" [(ngModel)]="settings.taxRate" min="0" max="100" step="0.5">
                <span class="suffix">%</span>
              </div>
            </div>
            <div class="form-group">
              <label>{{ 'admin.defaultShippingFee' | translate }}</label>
              <div class="input-with-suffix">
                <input type="number" [(ngModel)]="settings.shippingFee" min="0">
                <span class="suffix">{{ settings.currency }}</span>
              </div>
            </div>
            <div class="form-group">
              <label>{{ 'admin.freeShippingThreshold' | translate }}</label>
              <div class="input-with-suffix">
                <input type="number" [(ngModel)]="settings.freeShippingThreshold" min="0">
                <span class="suffix">{{ settings.currency }}</span>
              </div>
            </div>
            <div class="form-group">
              <label>{{ 'admin.orderPrefix' | translate }}</label>
              <input type="text" [(ngModel)]="settings.orderPrefix" placeholder="ORD">
              <span class="hint">{{ 'admin.orderPrefixExample' | translate }}</span>
            </div>
          </div>
        </div>

        <!-- Inventory Settings -->
        <div class="settings-card">
          <div class="card-header">
            <h3>{{ 'admin.inventory' | translate }}</h3>
          </div>
          <div class="card-body">
            <div class="form-group">
              <label>{{ 'admin.lowStockThreshold' | translate }}</label>
              <div class="input-with-suffix">
                <input type="number" [(ngModel)]="settings.lowStockThreshold" min="1">
                <span class="suffix">{{ 'admin.productsCount' | translate }}</span>
              </div>
              <span class="hint">{{ 'admin.lowStockThresholdHint' | translate }}</span>
            </div>
          </div>
        </div>

        <!-- System Settings -->
        <div class="settings-card">
          <div class="card-header">
            <h3>{{ 'admin.system' | translate }}</h3>
          </div>
          <div class="card-body">
            <div class="form-group checkbox-group">
              <label class="switch">
                <input type="checkbox" [(ngModel)]="settings.maintenanceMode">
                <span class="slider"></span>
              </label>
              <div class="switch-label">
                <span class="title">{{ 'admin.maintenanceMode' | translate }}</span>
                <span class="description">{{ 'admin.maintenanceModeDesc' | translate }}</span>
              </div>
            </div>

            <div class="warning-box" *ngIf="settings.maintenanceMode">
              <p>{{ 'admin.maintenanceModeWarning' | translate }}</p>
            </div>
          </div>
        </div>

        <!-- Backup & Export Settings -->
        <div class="settings-card full-width">
          <div class="card-header">
            <h3>{{ 'admin.backupExport' | translate }}</h3>
          </div>
          <div class="card-body">
            <div class="backup-section">
              <div class="backup-item">
                <div class="backup-info">
                  <h4>{{ 'admin.fullBackup' | translate }}</h4>
                  <p>{{ 'admin.fullBackupDesc' | translate }}</p>
                </div>
                <button class="btn btn-secondary" (click)="exportFullBackup()" [disabled]="exporting()">
                  {{ exporting() ? ('admin.exporting' | translate) : ('admin.exportJson' | translate) }}
                </button>
              </div>

              <div class="backup-item">
                <div class="backup-info">
                  <h4>{{ 'admin.exportProducts' | translate }}</h4>
                  <p>{{ 'admin.exportProductsDesc' | translate }}</p>
                </div>
                <button class="btn btn-success" (click)="exportProductsExcel()">
                  <i class="gi gi-ui-chart" aria-hidden="true"></i> {{ 'admin.exportExcel' | translate }}
                </button>
              </div>

              <div class="backup-item">
                <div class="backup-info">
                  <h4>{{ 'admin.exportOrders' | translate }}</h4>
                  <p>{{ 'admin.exportOrdersDesc' | translate }}</p>
                </div>
                <button class="btn btn-success" (click)="exportOrdersExcel()">
                  <i class="gi gi-ui-chart" aria-hidden="true"></i> {{ 'admin.exportExcel' | translate }}
                </button>
              </div>

              <div class="backup-item">
                <div class="backup-info">
                  <h4>{{ 'admin.exportCustomers' | translate }}</h4>
                  <p>{{ 'admin.exportCustomersDesc' | translate }}</p>
                </div>
                <button class="btn btn-success" (click)="exportCustomersExcel()">
                  <i class="gi gi-ui-chart" aria-hidden="true"></i> {{ 'admin.exportExcel' | translate }}
                </button>
              </div>
            </div>

            <div class="db-stats" *ngIf="dbStats()">
              <h4>{{ 'admin.databaseStats' | translate }}</h4>
              <div class="stats-grid">
                <div class="stat-item">
                  <span class="stat-value">{{ dbStats()!.collections.products || 0 }}</span>
                  <span class="stat-label">{{ 'admin.productsCount' | translate }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value">{{ dbStats()!.collections.orders || 0 }}</span>
                  <span class="stat-label">{{ 'admin.ordersCount' | translate }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value">{{ dbStats()!.collections.users || 0 }}</span>
                  <span class="stat-label">{{ 'admin.usersCount' | translate }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value">{{ dbStats()!.database.dataSize || '0 KB' }}</span>
                  <span class="stat-label">{{ 'admin.size' | translate }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Save Notification -->
      @if (saveSuccess()) {
        <div class="notification success">
          {{ 'admin.settingsSavedSuccess' | translate }}
        </div>
      }

      @if (saveError()) {
        <div class="notification error">
          {{ 'message.error' | translate }}: {{ saveError() }}
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      --settings-page-title: #1a1a1a;
      --settings-subtitle: #666;
      --settings-card-bg: #fff;
      --settings-card-header-bg: #f8f9fa;
      --settings-card-border: #e9ecef;
      --settings-card-title: #1a1a1a;
      --settings-label: #333;
      --settings-input-bg: #fff;
      --settings-input-border: #ddd;
      --settings-input-text: #111827;
      --settings-placeholder: #9ca3af;
      --settings-hint: #999;
      --settings-suffix: #999;
      --settings-slider-bg: #ccc;
      --settings-switch-title: #1a1a1a;
      --settings-switch-description: #666;
      --settings-backup-bg: #f9fafb;
      --settings-backup-title: #1a1a1a;
      --settings-backup-text: #666;
      --settings-db-border: #e5e7eb;
      --settings-stat-bg: #e8f4f8;
      --settings-stat-value: #059669;
      --settings-stat-label: #666;
      --settings-notification-error-bg: #e6e6ea;
      --settings-notification-error-text: #153243;
    }

    :host-context(.admin-layout.dark-mode) {
      --settings-page-title: #f8fafc;
      --settings-subtitle: #cbd5e1;
      --settings-card-bg: #111827;
      --settings-card-header-bg: #f8fafc;
      --settings-card-border: #1f2937;
      --settings-card-title: #111827;
      --settings-label: #d1d5db;
      --settings-input-bg: #f8fafc;
      --settings-input-border: #334155;
      --settings-input-text: #0f172a;
      --settings-placeholder: #64748b;
      --settings-hint: #cbd5e1;
      --settings-suffix: #94a3b8;
      --settings-slider-bg: #475569;
      --settings-switch-title: #f8fafc;
      --settings-switch-description: #cbd5e1;
      --settings-backup-bg: #0f172a;
      --settings-backup-title: #f8fafc;
      --settings-backup-text: #cbd5e1;
      --settings-db-border: #334155;
      --settings-stat-bg: #0f172a;
      --settings-stat-value: #34d399;
      --settings-stat-label: #cbd5e1;
      --settings-notification-error-bg: #fecaca;
      --settings-notification-error-text: #7f1d1d;
    }

    .settings-page {
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
      color: var(--settings-page-title);
      margin: 0;
    }

    .subtitle {
      color: var(--settings-subtitle);
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

    .btn-primary {
      background: #153243;
      color: #fff;
      border-color: #153243;
    }

    .btn-primary:hover:not(:disabled) {
      background: #0d1f29;
      border-color: #0d1f29;
    }

    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Settings Grid */
    .settings-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 24px;
    }

    .settings-card {
      background: var(--settings-card-bg);
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      overflow: hidden;
    }

    .card-header {
      padding: 16px 20px;
      background: var(--settings-card-header-bg);
      border-bottom: 1px solid var(--settings-card-border);
    }

    .card-header h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--settings-card-title);
    }

    .card-body {
      padding: 20px;
    }

    .form-group {
      margin-bottom: 16px;
    }

    .form-group:last-child {
      margin-bottom: 0;
    }

    .form-group label {
      display: block;
      margin-bottom: 6px;
      font-size: 14px;
      font-weight: 500;
      color: var(--settings-label);
    }

    .form-group input,
    .form-group textarea,
    .form-group select {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid var(--settings-input-border);
      border-radius: 8px;
      font-size: 14px;
      transition: border-color 0.2s;
      background: var(--settings-input-bg);
      color: var(--settings-input-text);
      caret-color: var(--settings-input-text);
    }

    .form-group input::placeholder,
    .form-group textarea::placeholder {
      color: var(--settings-placeholder);
    }

    .form-group input:focus,
    .form-group textarea:focus,
    .form-group select:focus {
      outline: none;
      border-color: #153243;
    }

    .input-with-suffix {
      position: relative;
    }

    .input-with-suffix input {
      padding-right: 60px;
    }

    .input-with-suffix .suffix {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--settings-suffix);
      font-size: 14px;
    }

    .hint {
      display: block;
      margin-top: 4px;
      font-size: 12px;
      color: var(--settings-hint);
    }

    /* Checkbox Group */
    .checkbox-group {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }

    .switch {
      position: relative;
      display: inline-block;
      width: 48px;
      height: 26px;
      flex-shrink: 0;
    }

    .switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: var(--settings-slider-bg);
      transition: .4s;
      border-radius: 26px;
    }

    .slider:before {
      position: absolute;
      content: "";
      height: 20px;
      width: 20px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: .4s;
      border-radius: 50%;
    }

    input:checked + .slider {
      background-color: #153243;
    }

    input:checked + .slider:before {
      transform: translateX(22px);
    }

    .switch-label {
      display: flex;
      flex-direction: column;
    }

    .switch-label .title {
      font-weight: 500;
      color: var(--settings-switch-title);
    }

    .switch-label .description {
      font-size: 13px;
      color: var(--settings-switch-description);
    }

    .warning-box {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 12px;
      background: #c3d350;
      border-radius: 8px;
      margin-top: 12px;
    }

    .warning-box span {
      font-size: 18px;
    }

    .warning-box p {
      margin: 0;
      font-size: 13px;
      color: #153243;
    }

    /* Notification */
    .notification {
      position: fixed;
      bottom: 24px;
      right: 24px;
      padding: 16px 24px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
      animation: slideIn 0.3s ease;
      z-index: 1000;
    }

    .notification.success {
      background: #153243;
      color: #c3d350;
    }

    .notification.error {
      background: var(--settings-notification-error-bg);
      color: var(--settings-notification-error-text);
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @media (max-width: 768px) {
      .settings-grid {
        grid-template-columns: 1fr;
      }
    }

    /* Backup Section */
    .settings-card.full-width {
      grid-column: 1 / -1;
    }

    .backup-section {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 16px;
    }

    .backup-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      background: var(--settings-backup-bg);
      border-radius: 8px;
      gap: 16px;
    }

    .btn-success {
      background: #10b981;
      color: white;
      border: none;
      min-width: 140px;
    }

    .btn-success:hover {
      background: #059669;
    }

    .backup-info h4 {
      margin: 0 0 4px;
      font-size: 14px;
      color: var(--settings-backup-title);
    }

    .backup-info p {
      margin: 0;
      font-size: 12px;
      color: var(--settings-backup-text);
    }

    .db-stats {
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid var(--settings-db-border);
    }

    .db-stats h4 {
      margin: 0 0 16px;
      font-size: 14px;
      color: var(--settings-backup-title);
    }

    .db-stats .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }

    .stat-item {
      text-align: center;
      padding: 12px;
      background: var(--settings-stat-bg);
      border-radius: 8px;
    }

    .stat-item .stat-value {
      display: block;
      font-size: 20px;
      font-weight: 700;
      color: var(--settings-stat-value);
    }

    .stat-item .stat-label {
      font-size: 12px;
      color: var(--settings-stat-label);
    }
  `]
})
export class SettingsComponent {
  private http = inject(HttpClient);
  private adminService = inject(AdminService);
  private translate = inject(TranslateService);
  private apiUrl = environment.apiUrl;

  settings: ShopSettings = {
    shopName: 'Ponsai Store',
    shopDescription: 'Cửa hàng cây cảnh bonsai cao cấp',
    contactEmail: 'contact@ponsai.vn',
    contactPhone: '0123 456 789',
    address: '123 Đường ABC, Quận 1, TP.HCM',
    currency: 'GBP',
    taxRate: 10,
    shippingFee: 5,
    freeShippingThreshold: 50,
    orderPrefix: 'ORD',
    lowStockThreshold: 10,
    maintenanceMode: false
  };

  saving = signal(false);
  saveSuccess = signal(false);
  saveError = signal<string | null>(null);
  exporting = signal(false);
  dbStats = signal<any>(null);
  loading = signal(false);

  constructor() {
    this.loadSettings();
    this.loadDbStats();
  }

  loadSettings(): void {
    this.loading.set(true);
    this.adminService.loadSettings().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Map API response to component settings
          this.settings = {
            shopName: response.data.shopName || 'Ponsai Store',
            shopDescription: response.data.shopDescription || '',
            contactEmail: response.data.contactEmail || '',
            contactPhone: response.data.contactPhone || '',
            address: response.data.address || '',
            currency: response.data.currency || 'GBP',
            taxRate: response.data.taxRate || 10,
            shippingFee: response.data.shippingFee || 5,
            freeShippingThreshold: response.data.freeShippingThreshold || 50,
            orderPrefix: response.data.orderPrefix || 'ORD',
            lowStockThreshold: response.data.lowStockThreshold || 10,
            maintenanceMode: response.data.maintenanceMode || false
          };
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading settings:', error);
        this.loading.set(false);
        // Keep default values on error
      }
    });
  }

  loadDbStats(): void {
    this.http.get<any>(`${this.apiUrl}/admin/backup/stats`).subscribe({
      next: (response) => {
        this.dbStats.set(response.data);
      },
      error: (error) => {
        console.error('Error loading DB stats:', error);
      }
    });
  }

  saveSettings(): void {
    this.saving.set(true);
    this.saveSuccess.set(false);
    this.saveError.set(null);

    this.adminService.updateSettings(this.settings).subscribe({
      next: (response) => {
        this.saving.set(false);
        if (response.success) {
          this.saveSuccess.set(true);
          
          // Auto-hide success message after 3 seconds
          setTimeout(() => {
            this.saveSuccess.set(false);
          }, 3000);
        }
      },
      error: (error) => {
        this.saving.set(false);
        this.saveError.set(error.error?.message || this.translate.instant('admin.settingsSaveFailed'));
        
        // Auto-hide error message after 5 seconds
        setTimeout(() => {
          this.saveError.set(null);
        }, 5000);
      }
    });
  }

  exportFullBackup(): void {
    this.exporting.set(true);
    this.http.get(`${this.apiUrl}/admin/backup/full`, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        this.downloadFile(blob, `ponsai-backup-${new Date().toISOString().split('T')[0]}.json`);
        this.exporting.set(false);
      },
      error: (error) => {
        console.error('Export failed:', error);
        this.exporting.set(false);
        alert(this.translate.instant('admin.exportFailed'));
      }
    });
  }

  exportProductsExcel(): void {
    this.http.get(`${this.apiUrl}/admin/backup/products/excel`, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        this.downloadFile(blob, `products-${new Date().toISOString().split('T')[0]}.xlsx`);
      },
      error: (error) => {
        console.error('Export failed:', error);
        alert(this.translate.instant('admin.exportFailed'));
      }
    });
  }

  exportOrdersExcel(): void {
    this.http.get(`${this.apiUrl}/admin/backup/orders/excel`, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        this.downloadFile(blob, `orders-${new Date().toISOString().split('T')[0]}.xlsx`);
      },
      error: (error) => {
        console.error('Export failed:', error);
        alert(this.translate.instant('admin.exportFailed'));
      }
    });
  }

  exportCustomersExcel(): void {
    this.http.get(`${this.apiUrl}/admin/backup/customers/excel`, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        this.downloadFile(blob, `customers-${new Date().toISOString().split('T')[0]}.xlsx`);
      },
      error: (error) => {
        console.error('Export failed:', error);
        alert(this.translate.instant('admin.exportFailed'));
      }
    });
  }

  private downloadFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
