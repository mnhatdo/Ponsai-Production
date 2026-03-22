// Admin Dashboard Component - Timezone fix applied
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AdminService } from '../../services/admin.service';
import { DashboardStats } from '../../models/admin.models';
import { AdminCurrencyPipe } from '../../pipes/admin-currency.pipe';

type DateRange = 'today' | 'last7days' | 'last30days' | 'custom';
type SortDirection = 'asc' | 'desc' | null;

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, AdminCurrencyPipe, FormsModule, TranslateModule],
  template: `
    <div class="admin-dashboard">
      <!-- Header with Filters -->
      <div class="dashboard-header">
        <div class="header-title">
          <h1>{{ 'admin.dashboard' | translate }}</h1>
          <p class="subtitle">{{ 'admin.analyticsOverview' | translate }}</p>
        </div>
        
        <div class="header-actions">
          <!-- Date Range Selector -->
          <div class="date-range-selector">
            <button 
              *ngFor="let range of dateRanges" 
              class="range-btn"
              [class.active]="selectedRange() === range.value"
              (click)="selectDateRange(range.value)">
              {{ range.label | translate }}
            </button>
          </div>

          <!-- Custom Date Picker (shown when Custom is selected) -->
          @if (selectedRange() === 'custom') {
            <div class="custom-date-picker">
              <input 
                type="date" 
                class="date-input"
                [value]="customStartDate()"
                (change)="setCustomStartDate($event)"
                placeholder="From">
              <span class="date-separator">to</span>
              <input 
                type="date" 
                class="date-input"
                [value]="customEndDate()"
                (change)="setCustomEndDate($event)"
                placeholder="To">
            </div>
          }
          
          <!-- Export Buttons -->
          <div class="export-buttons">
            <button class="btn-export" (click)="exportData('excel')" title="Export to Excel">
              <i class="gi gi-ui-chart" aria-hidden="true"></i>
              Excel
            </button>
          </div>
        </div>
      </div>

      @if (adminService.loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>{{ 'admin.loadingData' | translate }}</p>
        </div>
      }

      @if (adminService.error()) {
        <div class="error-state">
          <p>{{ adminService.error() }}</p>
          <button class="btn-primary" (click)="loadDashboard()">{{ 'button.retry' | translate }}</button>
        </div>
      }

      @if (stats()) {
        <!-- KPI Cards with Trends -->
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-header">
              <span class="kpi-label">{{ 'admin.totalRevenue' | translate }}</span>
              <span class="kpi-icon">
                <i class="gi gi-ui-trend-up" aria-hidden="true"></i>
              </span>
            </div>
            <div class="kpi-value">{{ filteredRevenue() | adminCurrency }}</div>
            <div class="kpi-trend" [class.positive]="revenueTrend() > 0" [class.negative]="revenueTrend() < 0">
              <i *ngIf="revenueTrend() > 0" class="gi gi-ui-trend-up" aria-hidden="true"></i>
              <i *ngIf="revenueTrend() <= 0" class="gi gi-ui-trend-down" aria-hidden="true"></i>
              <span>{{ Math.abs(revenueTrend()).toFixed(1) }}% {{ 'admin.vsPreviousPeriod' | translate }}</span>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-header">
              <span class="kpi-label">{{ 'admin.totalOrders' | translate }}</span>
              <span class="kpi-icon">
                <i class="gi gi-admin-orders" aria-hidden="true"></i>
              </span>
            </div>
            <div class="kpi-value">{{ filteredOrdersCount() | number }}</div>
            <div class="kpi-trend" [class.positive]="ordersTrend() > 0" [class.negative]="ordersTrend() < 0">
              <i *ngIf="ordersTrend() > 0" class="gi gi-ui-trend-up" aria-hidden="true"></i>
              <i *ngIf="ordersTrend() <= 0" class="gi gi-ui-trend-down" aria-hidden="true"></i>
              <span>{{ Math.abs(ordersTrend()).toFixed(1) }}% vs previous period</span>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-header">
              <span class="kpi-label">{{ 'admin.customers' | translate }}</span>
              <span class="kpi-icon">
                <i class="gi gi-admin-users" aria-hidden="true"></i>
              </span>
            </div>
            <div class="kpi-value">{{ stats()!.overview.totalUsers | number }}</div>
          </div>

          <div class="kpi-card">
            <div class="kpi-header">
              <span class="kpi-label">{{ 'admin.products' | translate }}</span>
              <span class="kpi-icon">
                <i class="gi gi-admin-products" aria-hidden="true"></i>
              </span>
            </div>
            <div class="kpi-value">{{ stats()!.overview.totalProducts | number }}</div>
            <div class="kpi-trend neutral">
              <i class="gi gi-ui-sort" aria-hidden="true"></i>
              <span>{{ stats()!.overview.lowStockProducts }} {{ 'admin.lowStock' | translate }}</span>
            </div>
          </div>
        </div>

        <!-- Quick Insights Panel -->
        <div class="insights-panel">
          <div class="insights-header">
            <h3><i class="gi gi-ui-spark" aria-hidden="true"></i> {{ 'admin.quickInsights' | translate }}</h3>
          </div>
          <div class="insights-content">
            <div class="insight-item" *ngFor="let insight of insights()">
              <div class="insight-icon" [class]="insight.type">
                <i class="gi" [class]="insight.icon" aria-hidden="true"></i>
              </div>
              <div class="insight-text">{{ insight.message }}</div>
            </div>
          </div>
        </div>

        <!-- Charts Section -->
        <div class="charts-section">
          <!-- Revenue Trend Chart (Full Width) -->
          <div class="chart-card">
            <div class="chart-header">
              <h3>{{ 'admin.revenueTrend' | translate }}</h3>
              <div class="chart-view-toggle">
                <button 
                  class="toggle-btn"
                  [class.active]="chartViewMode() === 'day'"
                  (click)="chartViewMode.set('day')">
                  {{ 'admin.day' | translate }}
                </button>
                <button 
                  class="toggle-btn"
                  [class.active]="chartViewMode() === 'week'"
                  (click)="chartViewMode.set('week')">
                  {{ 'admin.week' | translate }}
                </button>
                <button 
                  class="toggle-btn"
                  [class.active]="chartViewMode() === 'month'"
                  (click)="chartViewMode.set('month')">
                  {{ 'admin.month' | translate }}
                </button>
              </div>
            </div>
            <div class="chart-body">
              <div class="line-chart">
                <div class="chart-y-axis">
                  @for (tick of yAxisTicks(); track $index) {
                    <span>{{ tick | adminCurrency }}</span>
                  }
                </div>
                <div class="chart-plot">
                  <svg class="line-chart-svg" [attr.viewBox]="'0 0 ' + getChartWidth() + ' 300'" preserveAspectRatio="none">
                    <!-- Gradient definition -->
                    <defs>
                      <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style="stop-color:#17a2b8;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#138496;stop-opacity:1" />
                      </linearGradient>
                      <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:#17a2b8;stop-opacity:0.3" />
                        <stop offset="100%" style="stop-color:#17a2b8;stop-opacity:0.05" />
                      </linearGradient>
                    </defs>
                    
                    <!-- Y-axis line -->
                    <line x1="0" y1="0" x2="0" y2="300" stroke="#e0e0e0" stroke-width="2" />
                    
                    <!-- X-axis line -->
                    <line [attr.x1]="0" [attr.y1]="300" [attr.x2]="getChartWidth()" [attr.y2]="300" stroke="#e0e0e0" stroke-width="2" />
                    
                    <!-- Area under curve -->
                    <path [attr.d]="getRevenueAreaPath()" fill="url(#areaGradient)" />
                    
                    <!-- Revenue smooth line path -->
                    <path [attr.d]="getRevenueSmoothPath()" fill="none" stroke="url(#lineGradient)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
                    
                    <!-- Data points -->
                    @for (point of revenueData(); track $index) {
                      <circle 
                        [attr.cx]="getPointX($index)" 
                        [attr.cy]="getPointY(point.value)"
                        r="5" 
                        fill="#17a2b8"
                        stroke="#fff"
                        stroke-width="2"
                        class="chart-point"
                        (mouseenter)="showTooltip($event, point.label, point.value, 'revenue')"
                        (mouseleave)="hideTooltip()" />
                    }
                  </svg>
                  @if (tooltip()) {
                    <div class="chart-tooltip" [style.left.px]="tooltip()!.x" [style.top.px]="tooltip()!.y">
                      <div class="tooltip-label">{{ tooltip()!.label }}</div>
                      <div class="tooltip-value">
                        @if (tooltip()!.type === 'revenue') {
                          {{ tooltip()!.value | adminCurrency }}
                        } @else {
                          {{ tooltip()!.value }} orders
                        }
                      </div>
                    </div>
                  }
                </div>
                <div class="chart-x-axis">
                  <div class="x-axis-days">
                    @for (point of revenueData(); track $index) {
                      <div class="x-day-label">{{ point.day }}</div>
                    }
                  </div>
                  <div class="x-axis-months">
                    @for (monthGroup of getMonthGroups(); track monthGroup.month + monthGroup.startIndex) {
                      <div class="x-month-group" [style.grid-column]="'span ' + monthGroup.count">
                        <div class="month-bar"></div>
                        <div class="month-label">{{ monthGroup.month }}</div>
                      </div>
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Row for two charts side by side -->
          <div class="charts-row">
            <!-- Order Status Distribution -->
            <div class="chart-card">
              <div class="chart-header">
                <h3>{{ 'admin.orderStatusDistribution' | translate }}</h3>
              </div>
            <div class="chart-body">
              <div class="donut-chart">
                <svg viewBox="0 0 200 200" class="donut-svg">
                  <circle cx="100" cy="100" r="80" fill="none" stroke="#f0f0f0" stroke-width="24"/>
                  @for (segment of orderSegments(); track $index) {
                    <circle 
                      cx="100" 
                      cy="100" 
                      r="80" 
                      fill="none" 
                      [attr.stroke]="segment.color"
                      stroke-width="24"
                      [attr.stroke-dasharray]="segment.dasharray"
                      [attr.stroke-dashoffset]="segment.offset"
                      transform="rotate(-90 100 100)"
                      class="donut-segment"
                      (mouseenter)="showTooltip($event, segment.label, segment.value, 'orders')"
                      (mouseleave)="hideTooltip()" />
                  }
                  <text x="100" y="95" text-anchor="middle" class="donut-total-label">{{ 'admin.total' | translate }}</text>
                  <text x="100" y="115" text-anchor="middle" class="donut-total-value">{{ filteredOrdersCount() }}</text>
                </svg>
                <div class="donut-legend">
                  @for (segment of orderSegments(); track $index) {
                    <div class="legend-item">
                      <span class="legend-color" [style.background]="segment.color"></span>
                      <span class="legend-label">{{ segment.label }}</span>
                      <span class="legend-value">{{ segment.value }}</span>
                      <span class="legend-percent">{{ segment.percentage }}%</span>
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>

          <!-- Top Products Performance -->
          <div class="chart-card">
            <div class="chart-header">
              <h3>{{ 'admin.topProductsByRevenue' | translate }}</h3>
            </div>
            <div class="chart-body">
              <div class="bar-chart">
                @for (cat of categoryData(); track $index) {
                  <div class="bar-row">
                    <span class="bar-label" [title]="cat.name">{{ cat.name }}</span>
                    <div class="bar-container">
                      <div 
                        class="bar-fill" 
                        [style.width.%]="(cat.value / maxCategoryValue()) * 100"
                        [style.background]="cat.color">
                      </div>
                      <span class="bar-value">{{ cat.value | adminCurrency }}</span>
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
          </div>
        </div>

        <!-- Orders by Day & Hour Heatmap -->
        <div class="chart-card heatmap-card">
          <div class="chart-header">
            <h3>No. of Orders by Day & Hour (Not Cancelled)</h3>
          </div>
          <div class="chart-body heatmap-layout">
            <!-- Left: Column Chart - Daily Totals -->
            <div class="column-chart-section">
              <h4 class="section-title">{{ 'admin.dailySummary' | translate }}</h4>
              <div class="column-summary">
                @for (day of weekdayData(); track $index) {
                  <div class="column-item">
                    <div class="column-label">{{ day.total }}</div>
                    <div 
                      class="column-bar" 
                      [class.highlight]="day.isMax"
                      [style.height.px]="(day.total / maxDailyOrders()) * 180"
                      [style.background]="getColumnColor(day.total)">
                    </div>
                    <div class="column-day">{{ day.day }}</div>
                  </div>
                }
              </div>
            </div>

            <!-- Right: Heatmap Matrix -->
            <div class="heatmap-section">
              <h4 class="section-title">{{ 'admin.hourlyDistribution' | translate }}</h4>
              <div class="heatmap-matrix">
                <div class="heatmap-row">
                  <div class="hour-label"></div>
                  @for (day of weekdayLabels; track $index) {
                    <div class="day-header">{{ day }}</div>
                  }
                </div>
                @for (hour of hourIntervals; track hour; let hourIndex = $index) {
                  <div class="heatmap-row">
                    <div class="hour-label">{{ hour }}</div>
                    @for (day of weekdayLabels; track day; let dayIndex = $index) {
                      <div 
                        class="heatmap-cell" 
                        [style.background]="getHeatmapColor(getOrderCount(dayIndex, hourIndex))"
                        [title]="day + ' ' + hour + ': ' + getOrderCount(dayIndex, hourIndex) + ' orders'">
                        {{ getOrderCount(dayIndex, hourIndex) }}
                      </div>
                    }
                  </div>
                }
              </div>
            </div>
          </div>
        </div>

        <!-- Detailed Data Table -->
        <div class="data-table-section">
          <div class="table-header">
            <h3>{{ 'admin.recentOrders' | translate }}</h3>
            <div class="table-controls">
              <div class="search-box">
                <i class="gi gi-ui-forecast" aria-hidden="true"></i>
                <input 
                  type="text" 
                  [placeholder]="'admin.searchOrders' | translate"
                  [value]="orderSearchTerm()"
                  (input)="onOrderSearch($any($event.target).value)">
              </div>
              <a routerLink="/admin/orders" class="view-all-link">
                {{ 'admin.viewAll' | translate }} →
              </a>
            </div>
          </div>
          
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th (click)="sortTable('_id')" class="sortable">
                    {{ 'admin.orderId' | translate }}
                    <span class="sort-icon" [class.active]="sortColumn() === '_id'">
                      <i class="gi" [class]="getSortIcon('_id')" aria-hidden="true"></i>
                    </span>
                  </th>
                  <th (click)="sortTable('user')" class="sortable">
                    {{ 'admin.customer' | translate }}
                    <span class="sort-icon" [class.active]="sortColumn() === 'user'">
                      <i class="gi" [class]="getSortIcon('user')" aria-hidden="true"></i>
                    </span>
                  </th>
                  <th (click)="sortTable('totalAmount')" class="sortable">
                    {{ 'admin.amount' | translate }}
                    <span class="sort-icon" [class.active]="sortColumn() === 'totalAmount'">
                      <i class="gi" [class]="getSortIcon('totalAmount')" aria-hidden="true"></i>
                    </span>
                  </th>
                  <th (click)="sortTable('status')" class="sortable">
                    {{ 'admin.status' | translate }}
                    <span class="sort-icon" [class.active]="sortColumn() === 'status'">
                      <i class="gi" [class]="getSortIcon('status')" aria-hidden="true"></i>
                    </span>
                  </th>
                  <th (click)="sortTable('paymentStatus')" class="sortable">
                    {{ 'admin.payment' | translate }}
                    <span class="sort-icon" [class.active]="sortColumn() === 'paymentStatus'">
                      <i class="gi" [class]="getSortIcon('paymentStatus')" aria-hidden="true"></i>
                    </span>
                  </th>
                  <th (click)="sortTable('createdAt')" class="sortable">
                    {{ 'admin.date' | translate }}
                    <span class="sort-icon" [class.active]="sortColumn() === 'createdAt'">
                      <i class="gi" [class]="getSortIcon('createdAt')" aria-hidden="true"></i>
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                @for (order of filteredOrders(); track order._id) {
                  <tr>
                    <td class="order-id">#{{ order._id.slice(-8) }}</td>
                    <td>{{ order.user.name || order.user.email || 'N/A' }}</td>
                    <td class="amount">{{ order.totalAmount | adminCurrency }}</td>
                    <td>
                      <span class="status-badge" [class]="order.status">
                        {{ getStatusLabel(order.status) }}
                      </span>
                    </td>
                    <td>
                      <span class="payment-badge" [class]="'payment-' + order.paymentStatus">
                        {{ getPaymentStatusLabel(order.paymentStatus) }}
                      </span>
                    </td>
                    <td class="date">{{ formatDate(order.createdAt) }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    /* === BASE LAYOUT === */
    .admin-dashboard {
      padding: 24px;
      max-width: 1800px;
      margin: 0 auto;
      background: #f5f6fa;
      min-height: 100vh;
    }

    /* === HEADER === */
    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32px;
      flex-wrap: wrap;
      gap: 20px;
    }

    .header-title h1 {
      font-size: 32px;
      font-weight: 700;
      color: #153243;
      margin: 0 0 4px;
    }

    .header-title .subtitle {
      color: #6c757d;
      font-size: 14px;
      margin: 0;
    }

    .header-actions {
      display: flex;
      gap: 16px;
      align-items: center;
      flex-wrap: wrap;
    }

    /* === DATE RANGE SELECTOR === */
    .date-range-selector {
      display: flex;
      gap: 8px;
      background: #fff;
      padding: 4px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .range-btn {
      padding: 8px 16px;
      border: none;
      background: transparent;
      color: #6c757d;
      font-size: 13px;
      font-weight: 500;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
    }

    .range-btn:hover {
      background: #f8f9fa;
      color: #153243;
    }

    .range-btn.active {
      background: #153243;
      color: #c3d350;
    }

    /* === CUSTOM DATE PICKER === */
    .custom-date-picker {
      display: flex;
      align-items: center;
      gap: 6px;
      background: #fff;
      padding: 4px 8px;
      border-radius: 6px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .date-input {
      padding: 4px 8px;
      border: 1px solid #e6e6ea;
      border-radius: 4px;
      font-size: 12px;
      color: #153243;
      font-weight: 500;
      outline: none;
      transition: all 0.2s;
      width: 110px;
    }

    .date-input:focus {
      border-color: #153243;
    }

    .date-separator {
      color: #6c757d;
      font-size: 11px;
      font-weight: 500;
    }

    /* === EXPORT BUTTONS === */
    .export-buttons {
      display: flex;
      gap: 8px;
    }

    .btn-export {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      background: #fff;
      border: 2px solid #e6e6ea;
      border-radius: 6px;
      color: #153243;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-export:hover {
      background: #153243;
      color: #c3d350;
      border-color: #153243;
    }

    .btn-export svg,
    .btn-export i {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
    }

    .btn-export svg {
      stroke: currentColor;
    }

    .btn-export i {
      display: inline-flex;
      font-size: 16px;
    }

    /* === LOADING & ERROR STATES === */
    .loading-state,
    .error-state {
      text-align: center;
      padding: 60px 20px;
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e6e6ea;
      border-top-color: #153243;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 16px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .btn-primary {
      background: #153243;
      color: #fff;
      border: 2px solid #153243;
      padding: 10px 24px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      transition: all 0.2s;
    }

    .btn-primary:hover {
      background: #0d1f29;
      border-color: #0d1f29;
    }

    /* === KPI CARDS === */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 24px;
    }

    .kpi-card {
      background: #fff;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      transition: all 0.2s;
    }

    .kpi-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transform: translateY(-2px);
    }

    .kpi-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .kpi-label {
      font-size: 13px;
      color: #6c757d;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .kpi-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      background: #f8f9fa;
      border-radius: 8px;
      color: #153243;
    }

    .kpi-icon svg,
    .kpi-icon i {
      flex-shrink: 0;
      width: 20px;
      height: 20px;
    }

    .kpi-icon i {
      display: inline-flex;
      font-size: 20px;
    }

    .kpi-value {
      font-size: 32px;
      font-weight: 700;
      color: #153243;
      margin-bottom: 12px;
      line-height: 1;
    }

    .kpi-trend {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      font-weight: 500;
    }

    .kpi-trend.positive {
      color: #28a745;
    }

    .kpi-trend.negative {
      color: #dc3545;
    }

    .kpi-trend.neutral {
      color: #6c757d;
    }

    .kpi-trend svg,
    .kpi-trend i {
      flex-shrink: 0;
      width: 16px;
      height: 16px;
    }

    .kpi-trend i {
      display: inline-flex;
      font-size: 16px;
    }

    /* === INSIGHTS PANEL === */
    .insights-panel {
      background: #fff;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .insights-header h3 {
      font-size: 18px;
      font-weight: 600;
      color: #153243;
      margin: 0 0 20px;
    }

    .insights-content {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    @media (max-width: 1400px) {
      .insights-content {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    .insight-item {
      display: flex;
      gap: 12px;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 8px;
      border-left: 4px solid #e6e6ea;
    }

    .insight-icon {
      font-size: 24px;
      flex-shrink: 0;
    }

    .insight-icon.positive {
      border-left-color: #28a745;
    }

    .insight-icon.warning {
      border-left-color: #ffc107;
    }

    .insight-icon.info {
      border-left-color: #17a2b8;
    }

    .insight-text {
      font-size: 14px;
      color: #343a40;
      line-height: 1.5;
    }

    /* === CHARTS SECTION === */
    .charts-section {
      display: grid;
      grid-template-columns: 1fr;
      gap: 24px;
      margin-bottom: 24px;
    }

    .charts-row {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 24px;
    }

    .chart-card {
      background: #fff;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 2px solid #f8f9fa;
    }

    .chart-header h3 {
      font-size: 16px;
      font-weight: 600;
      color: #153243;
      margin: 0;
    }

    .chart-view-toggle {
      display: flex;
      gap: 4px;
      background: #f8f9fa;
      padding: 4px;
      border-radius: 6px;
    }

    .chart-view-toggle .toggle-btn {
      padding: 6px 16px;
      border: none;
      background: transparent;
      color: #6c757d;
      font-size: 13px;
      font-weight: 600;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .chart-view-toggle .toggle-btn:hover {
      background: #e9ecef;
      color: #153243;
    }

    .chart-view-toggle .toggle-btn.active {
      background: #153243;
      color: #c3d350;
    }

    .chart-subtitle {
      font-size: 13px;
      color: #6c757d;
    }

    .view-toggle {
      display: flex;
      gap: 4px;
      background: #f8f9fa;
      padding: 4px;
      border-radius: 6px;
    }

    .toggle-btn {
      padding: 6px 16px;
      border: none;
      background: transparent;
      color: #6c757d;
      font-size: 13px;
      font-weight: 600;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .toggle-btn:hover {
      background: #e9ecef;
      color: #153243;
    }

    .toggle-btn.active {
      background: #153243;
      color: #c3d350;
    }

    .chart-body {
      position: relative;
    }

    /* === LINE CHART === */
    .line-chart {
      display: grid;
      grid-template-columns: 50px 1fr;
      grid-template-rows: 300px auto;
      gap: 12px;
    }

    .chart-y-axis {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      font-size: 11px;
      color: #6c757d;
      padding: 10px 0;
    }

    .chart-plot {
      position: relative;
      height: 300px;
    }

    .line-chart-svg {
      width: 100%;
      height: 100%;
      position: relative;
      z-index: 1;
    }

    .chart-point {
      cursor: pointer;
      transition: r 0.2s;
    }

    .chart-point:hover {
      r: 7;
    }

    .chart-x-axis {
      grid-column: 2;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .x-axis-days {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
      gap: 0;
    }

    .x-axis-months {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
      gap: 12px;
      margin-top: 4px;
    }

    .x-day-label {
      text-align: center;
      font-size: 11px;
      color: #6c757d;
      font-weight: 500;
    }

    .x-month-group {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }

    .month-bar {
      width: 100%;
      height: 2px;
      background: linear-gradient(to right, #153243, #17a2b8, #153243);
      border-radius: 1px;
    }

    .month-label {
      font-weight: 600;
      color: #153243;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .chart-tooltip {
      position: fixed;
      background: #153243;
      color: #fff;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      pointer-events: none;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    .tooltip-label {
      font-weight: 600;
      margin-bottom: 4px;
    }

    .tooltip-value {
      color: #c3d350;
      font-size: 14px;
      font-weight: 700;
    }

    /* === DONUT CHART === */
    .donut-chart {
      display: grid;
      grid-template-columns: 200px 1fr;
      gap: 32px;
      align-items: center;
    }

    .donut-svg {
      width: 200px;
      height: 200px;
    }

    .donut-segment {
      cursor: pointer;
      transition: stroke-width 0.2s;
    }

    .donut-segment:hover {
      stroke-width: 28;
    }

    .donut-total-label {
      font-size: 12px;
      fill: #6c757d;
      font-weight: 500;
    }

    .donut-total-value {
      font-size: 24px;
      fill: #153243;
      font-weight: 700;
    }

    .donut-legend {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .legend-item {
      display: grid;
      grid-template-columns: 16px 1fr 60px 50px;
      gap: 12px;
      align-items: center;
      padding: 8px;
      border-radius: 6px;
      transition: background 0.2s;
    }

    .legend-item:hover {
      background: #f8f9fa;
    }

    .legend-color {
      width: 16px;
      height: 16px;
      border-radius: 4px;
    }

    .legend-label {
      font-size: 14px;
      color: #343a40;
      font-weight: 500;
    }

    .legend-value {
      font-size: 14px;
      font-weight: 700;
      color: #153243;
      text-align: right;
    }

    .legend-percent {
      font-size: 13px;
      color: #6c757d;
      text-align: right;
    }

    /* === BAR CHART === */
    .bar-chart {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .bar-row {
      display: grid;
      grid-template-columns: 280px 1fr;
      gap: 20px;
      align-items: center;
    }

    .bar-label {
      font-size: 14px;
      font-weight: 600;
      color: #153243;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      word-break: break-word;
    }

    .bar-container {
      position: relative;
      height: 40px;
      background: #f8f9fa;
      border-radius: 8px;
      overflow: hidden;
    }

    .bar-fill {
      height: 100%;
      border-radius: 8px;
      transition: width 0.6s ease;
      position: relative;
    }

    .bar-value {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 14px;
      font-weight: 700;
      color: #153243;
      text-shadow: 0 0 4px rgba(255, 255, 255, 0.8);
    }

    /* === HEATMAP CHART === */
    .heatmap-card {
      grid-column: 1 / -1;
      margin-bottom: 24px;
    }

    .heatmap-layout {
      display: grid;
      grid-template-columns: 320px 1fr;
      gap: 32px;
      align-items: start;
    }

    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: #153243;
      margin: 0 0 16px;
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .column-chart-section {
      display: flex;
      flex-direction: column;
    }

    .column-summary {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 8px;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 12px;
      border: 2px solid #e6e6ea;
    }

    .column-item {
      display: flex;
      flex-direction: column-reverse;
      align-items: center;
      gap: 8px;
      height: 240px;
      justify-content: flex-start;
    }

    .column-label {
      font-size: 15px;
      font-weight: 700;
      color: #153243;
      min-height: 22px;
      order: 3;
    }

    .column-bar {
      width: 100%;
      min-height: 20px;
      border-radius: 8px 8px 0 0;
      transition: all 0.3s ease;
      position: relative;
      order: 2;
    }

    .column-bar.highlight {
      box-shadow: 0 4px 12px rgba(21, 50, 67, 0.3);
    }

    .column-bar:hover {
      transform: translateY(-4px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
    }

    .column-day {
      font-size: 11px;
      font-weight: 600;
      color: #6c757d;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      order: 1;
    }

    .heatmap-section {
      display: flex;
      flex-direction: column;
    }

    .heatmap-matrix {
      display: flex;
      flex-direction: column;
      gap: 2px;
      overflow-x: auto;
    }

    .heatmap-row {
      display: grid;
      grid-template-columns: 50px repeat(7, minmax(50px, 1fr));
      gap: 2px;
    }

    .hour-label {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding-right: 8px;
      font-size: 11px;
      font-weight: 600;
      color: #6c757d;
      min-height: 18px;
    }

    .day-header {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 4px 2px;
      font-size: 11px;
      font-weight: 700;
      color: #153243;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      background: #f8f9fa;
      border-radius: 4px;
      min-height: 18px;
    }

    .heatmap-cell {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 4px 2px;
      font-size: 12px;
      font-weight: 600;
      color: #fff;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
      min-height: 18px;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    }

    .heatmap-cell:hover {
      transform: scale(1.08);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
      z-index: 10;
    }

    /* === DATA TABLE SECTION === */
    .data-table-section {
      background: #fff;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      margin-top: 24px;
    }

    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 2px solid #f8f9fa;
      flex-wrap: wrap;
      gap: 16px;
    }

    .table-header h3 {
      font-size: 18px;
      font-weight: 600;
      color: #153243;
      margin: 0;
    }

    .table-controls {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .view-all-link {
      display: inline-flex;
      align-items: center;
      padding: 8px 16px;
      background: #153243;
      color: #c3d350;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s;
      white-space: nowrap;
      height: 38px;
    }

    .view-all-link:hover {
      background: #0d1f29;
      transform: translateX(2px);
    }

    .search-box {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 0 16px;
      background: #fff;
      border: 2px solid #e6e6ea;
      border-radius: 8px;
      transition: all 0.2s;
      min-width: 300px;
      height: 38px;
    }

    .search-box:focus-within {
      background: #fff;
      border-color: #153243;
      box-shadow: 0 0 0 3px rgba(21, 50, 67, 0.1);
    }

    .search-box svg,
    .search-box i {
      color: #6c757d;
      width: 18px;
      height: 18px;
      display: block;
      flex-shrink: 0;
    }

    .search-box i {
      display: inline-flex;
      font-size: 18px;
    }

    .search-box input {
      border: none;
      background: none;
      outline: none;
      font-size: 14px;
      color: #153243;
      flex: 1;
      font-weight: 500;
      height: 100%;
      line-height: 38px;
      padding: 14px 0 0 0;
    }

    .search-box input::placeholder {
      color: #adb5bd;
      font-weight: 400;
    }

    .table-container {
      overflow-x: auto;
      max-height: 500px;
      overflow-y: auto;
      margin: 0 -24px;
      padding: 0 24px;
      border: 1px solid #f0f0f0;
      border-radius: 8px;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }

    .data-table th {
      padding: 14px 16px;
      text-align: left;
      font-size: 12px;
      font-weight: 700;
      color: #153243;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 2px solid #e6e6ea;
      background: #f8f9fa;
      position: sticky;
      top: 0;
      z-index: 10;
      white-space: nowrap;
    }

    .data-table th.sortable {
      cursor: pointer;
      user-select: none;
    }

    .data-table th.sortable:hover {
      background: #e9ecef;
    }

    .sort-icon {
      margin-left: 6px;
      color: #dee2e6;
      font-size: 10px;
    }

    .sort-icon.active {
      color: #153243;
    }

    .data-table td {
      padding: 16px;
      font-size: 14px;
      color: #343a40;
      border-bottom: 1px solid #f5f5f5;
      white-space: nowrap;
      vertical-align: middle;
    }

    .data-table tbody tr {
      transition: background 0.2s;
    }

    .data-table tbody tr:hover {
      background: #f8f9fa;
    }

    .data-table tbody tr:last-child td {
      border-bottom: none;
    }

    .order-id {
      font-family: 'Courier New', monospace;
      font-weight: 700;
      color: #153243;
      font-size: 13px;
    }

    .amount {
      font-weight: 700;
      color: #153243;
      font-size: 15px;
    }

    .date {
      color: #6c757d;
      font-size: 13px;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 6px 14px;
      border-radius: 16px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      min-width: 90px;
    }

    .status-badge.pending,
    .status-badge.pending_manual_payment {
      background: #fff3cd;
      color: #856404;
    }

    .status-badge.processing {
      background: #d1ecf1;
      color: #0c5460;
    }

    .status-badge.shipped {
      background: #ffe8d6;
      color: #c05621;
    }

    .status-badge.delivered {
      background: #d4edda;
      color: #155724;
    }

    .status-badge.cancelled {
      background: #f8d7da;
      color: #721c24;
    }

    .payment-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 6px 14px;
      border-radius: 16px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      min-width: 80px;
    }

    .payment-badge.payment-pending,
    .payment-badge.payment-pending_manual_payment {
      background: #fff3cd;
      color: #856404;
    }

    .payment-badge.payment-paid {
      background: #d4edda;
      color: #155724;
    }

    .payment-badge.payment-failed {
      background: #f8d7da;
      color: #721c24;
    }

    .payment-badge.payment-refunded {
      background: #d1ecf1;
      color: #0c5460;
    }

    .payment-badge.payment-cancelled {
      background: #f8d7da;
      color: #721c24;
    }

    .btn-view {
      padding: 6px 16px;
      background: #153243;
      color: #c3d350;
      border: none;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-view:hover {
      background: #0d1f29;
    }

    /* === PAGINATION === */
    .pagination {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 24px;
      padding-top: 16px;
      border-top: 2px solid #f8f9fa;
      flex-wrap: wrap;
      gap: 16px;
    }

    .page-numbers {
      display: flex;
      gap: 4px;
    }

    .page-btn,
    .page-number {
      padding: 8px 12px;
      background: #fff;
      border: 2px solid #e6e6ea;
      border-radius: 6px;
      color: #153243;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .page-btn:hover:not(:disabled),
    .page-number:hover {
      background: #f8f9fa;
      border-color: #153243;
    }

    .page-number.active {
      background: #153243;
      color: #c3d350;
      border-color: #153243;
    }

    .page-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .page-info {
      font-size: 13px;
      color: #6c757d;
    }

    /* === TEMPLATE STYLE OVERRIDES === */
    .admin-dashboard {
      max-width: 100%;
      padding: 0;
      background: transparent;
      min-height: auto;
    }

    .dashboard-header {
      margin-bottom: 20px;
      gap: 10px;
      align-items: flex-end;
    }

    .header-actions {
      margin-left: auto;
    }

    .header-title h1 {
      font-size: 42px;
      line-height: 1.05;
      letter-spacing: -0.03em;
      margin-bottom: 8px;
    }

    .header-title .subtitle {
      font-size: 28px;
    }

    .kpi-grid {
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
      margin-bottom: 16px;
    }

    .header-title h1,
    .kpi-value,
    .chart-header h3,
    .table-header h3,
    .section-title {
      color: #0f172a;
    }

    .header-title .subtitle,
    .kpi-label,
    .chart-y-axis,
    .x-day-label,
    .date,
    .page-info,
    .hour-label,
    .column-day,
    .legend-percent {
      color: #64748b;
    }

    .kpi-card,
    .insights-panel,
    .chart-card,
    .data-table-section,
    .loading-state,
    .error-state {
      border: 1px solid #e5e7eb;
      border-radius: 14px;
      box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
    }

    .kpi-card {
      padding: 18px;
    }

    .kpi-label {
      text-transform: none;
      letter-spacing: 0;
      font-size: 15px;
      font-weight: 600;
    }

    .kpi-value {
      font-size: 36px;
      margin-bottom: 8px;
    }

    .kpi-header {
      margin-bottom: 14px;
    }

    .kpi-icon {
      width: 32px;
      height: 32px;
      border-radius: 8px;
    }

    .kpi-trend {
      font-size: 11px;
    }

    .insights-panel {
      margin-bottom: 16px;
      padding: 18px;
    }

    .insights-content {
      gap: 10px;
    }

    .insight-item {
      border-radius: 10px;
      border-left-width: 2px;
      padding: 12px;
    }

    .charts-section,
    .charts-row {
      gap: 12px;
    }

    .chart-card {
      padding: 18px;
    }

    .chart-header {
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 12px;
      margin-bottom: 14px;
    }

    .table-container {
      margin: 0;
      padding: 0;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      max-height: unset;
    }

    .data-table th {
      background: #f8fafc;
      color: #334155;
      border-bottom-color: #e2e8f0;
      text-transform: none;
      letter-spacing: 0;
    }

    .data-table td {
      color: #1e293b;
      border-bottom-color: #f1f5f9;
    }

    .data-table tbody tr:hover,
    .legend-item:hover {
      background: #f8fafc;
    }

    .sort-icon.active,
    .amount,
    .order-id,
    .kpi-icon {
      color: #111827;
    }

    .kpi-icon,
    .chart-view-toggle,
    .view-toggle,
    .bar-container,
    .column-summary,
    .day-header {
      background: #f8fafc;
      border-color: #e2e8f0;
    }

    .range-btn.active,
    .toggle-btn.active,
    .chart-view-toggle .toggle-btn.active,
    .btn-primary,
    .view-all-link,
    .btn-view,
    .page-number.active {
      background: #111827;
      border-color: #111827;
      color: #fff;
    }

    .btn-export {
      border-color: #d1d5db;
      color: #374151;
    }

    .btn-export:hover {
      background: #111827;
      border-color: #111827;
      color: #fff;
    }

    .search-box {
      border-color: #d1d5db;
      box-shadow: none;
      min-width: 250px;
    }

    .search-box:focus-within {
      border-color: #9ca3af;
      box-shadow: 0 0 0 3px rgba(156, 163, 175, 0.15);
    }

    .chart-tooltip {
      background: #111827;
      border-radius: 10px;
    }

    @media (max-width: 1200px) {
      .kpi-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .heatmap-layout {
        grid-template-columns: 1fr;
        gap: 18px;
      }
    }

    /* === RESPONSIVE === */
    @media (max-width: 1200px) {
      .charts-row {
        grid-template-columns: 1fr;
      }

      .donut-chart {
        grid-template-columns: 1fr;
        justify-items: center;
      }
    }

    @media (max-width: 768px) {
      .admin-dashboard {
        padding: 0;
      }

      .dashboard-header {
        flex-direction: column;
        align-items: flex-start;
      }

      .header-actions {
        width: 100%;
        flex-direction: column;
      }

      .date-range-selector,
      .export-buttons {
        width: 100%;
        justify-content: space-between;
      }

      .kpi-grid {
        grid-template-columns: 1fr;
      }

      .insights-content {
        grid-template-columns: 1fr;
      }

      .chart-card {
        padding: 16px;
      }

      .bar-row {
        grid-template-columns: 1fr;
        gap: 8px;
      }

      .data-table-section {
        padding: 16px;
      }

      .table-container {
        margin: 0;
        padding: 0;
      }

      .search-box input {
        min-width: 150px;
      }
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  adminService = inject(AdminService);
  private translate = inject(TranslateService);
  stats = computed(() => this.adminService.dashboardStats());
  Math = Math;

  // Date Range
  selectedRange = signal<DateRange>('last30days');
  dateRanges = [
    { label: 'admin.today', value: 'today' as DateRange },
    { label: 'admin.last7Days', value: 'last7days' as DateRange },
    { label: 'admin.last30Days', value: 'last30days' as DateRange },
    { label: 'admin.custom', value: 'custom' as DateRange }
  ];

  // Custom date range
  customStartDate = signal<string>('');
  customEndDate = signal<string>('');

  // Chart view mode
  chartViewMode = signal<'day' | 'week' | 'month'>('day');

  // Previous period stats for comparison
  private previousStats = signal<{ totalRevenue: number; totalOrders: number } | null>(null);

  // Date Range Filter
  dateRangeBoundaries = computed(() => {
    const range = this.selectedRange();
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    switch (range) {
      case 'today':
        return { start: startOfToday, end: endOfToday };
      
      case 'last7days':
        const start7 = new Date(startOfToday);
        start7.setDate(start7.getDate() - 6);
        return { start: start7, end: endOfToday };
      
      case 'last30days':
        const start30 = new Date(startOfToday);
        start30.setDate(start30.getDate() - 29);
        return { start: start30, end: endOfToday };
      
      case 'custom':
        if (this.customStartDate() && this.customEndDate()) {
          const customStart = new Date(this.customStartDate());
          customStart.setHours(0, 0, 0, 0);
          const customEnd = new Date(this.customEndDate());
          customEnd.setHours(23, 59, 59, 999);
          return { start: customStart, end: customEnd };
        }
        // Default to last 7 days if custom dates not set
        const startCustom = new Date(startOfToday);
        startCustom.setDate(startCustom.getDate() - 6);
        return { start: startCustom, end: endOfToday };
      
      default:
        return { start: startOfToday, end: endOfToday };
    }
  });

  // Previous period boundaries for comparison (period-over-period)
  previousPeriodBoundaries = computed(() => {
    const { start, end } = this.dateRangeBoundaries();
    const periodLength = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    const prevEnd = new Date(start);
    prevEnd.setDate(prevEnd.getDate() - 1);
    prevEnd.setHours(23, 59, 59, 999);
    
    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevStart.getDate() - periodLength + 1);
    prevStart.setHours(0, 0, 0, 0);
    
    return { start: prevStart, end: prevEnd };
  });

  // Trends - calculated from backend data (period-over-period)
  revenueTrend = computed(() => {
    const stats = this.stats();
    const prevStats = this.previousStats();
    
    if (!stats || !prevStats) return 0;
    
    const currentRevenue = stats.overview.totalRevenue || 0;
    const previousRevenue = prevStats.totalRevenue || 0;
    
    if (previousRevenue === 0) return currentRevenue > 0 ? 100 : 0;
    
    return ((currentRevenue - previousRevenue) / previousRevenue) * 100;
  });

  ordersTrend = computed(() => {
    const stats = this.stats();
    const prevStats = this.previousStats();
    
    if (!stats || !prevStats) return 0;
    
    const currentOrders = stats.overview.totalOrders || 0;
    const previousOrders = prevStats.totalOrders || 0;
    
    if (previousOrders === 0) return currentOrders > 0 ? 100 : 0;
    
    return ((currentOrders - previousOrders) / previousOrders) * 100;
  });

  customersTrend = computed(() => {
    // For customers, we can estimate based on order count growth
    return this.ordersTrend() * 0.8; // Approximate correlation
  });

  // Filtered KPI values - now from backend (already filtered by date range)
  filteredRevenue = computed(() => {
    const stats = this.stats();
    if (!stats) return 0;
    // Backend returns totalRevenue filtered by date range
    return stats.overview.totalRevenue || 0;
  });

  filteredOrdersCount = computed(() => {
    const stats = this.stats();
    if (!stats) return 0;
    // Backend returns totalOrders filtered by date range
    return stats.overview.totalOrders || 0;
  });

  // Insights - affected by date range selector (except low stock)
  insights = computed(() => {
    const stats = this.stats();
    if (!stats) return [];

    const trend = this.revenueTrend();
    const rangeKey = this.dateRanges.find(r => r.value === this.selectedRange())?.label;
    const translatedRangeLabel = rangeKey ? this.translate.instant(rangeKey) : 'selected period';
    const rangeLabel = this.isVietnamese() ? translatedRangeLabel.toLowerCase() : translatedRangeLabel.toLowerCase();
    
    // Use backend aggregated data for pending orders count (already filtered by date range)
    const pendingCount = stats.overview.pendingOrders || 0;
    
    // Use backend aggregated data for top products (already filtered by date range)
    const topProduct = stats.topProducts && stats.topProducts.length > 0 
      ? stats.topProducts[0] 
      : null;

    const revenueMessage = this.isVietnamese()
      ? `Doanh thu ${trend >= 0 ? 'tăng' : 'giảm'} ${Math.abs(trend).toFixed(1)}% trong ${rangeLabel}`
      : `Revenue ${trend >= 0 ? 'increased' : 'decreased'} by ${Math.abs(trend).toFixed(1)}% in ${rangeLabel}`;

    const stockMessage = this.isVietnamese()
      ? (
          stats.overview.lowStockProducts > 0
            ? `${stats.overview.lowStockProducts} sản phẩm đang sắp hết hàng`
            : 'Tất cả sản phẩm đều còn đủ tồn kho'
        )
      : (
          stats.overview.lowStockProducts > 0
            ? `${stats.overview.lowStockProducts} products are running low on stock`
            : 'All products have sufficient stock levels'
        );

    const pendingMessage = this.isVietnamese()
      ? `${pendingCount} đơn hàng đang chờ xử lý trong ${rangeLabel}`
      : `${pendingCount} orders pending in ${rangeLabel}`;

    const topProductMessage = this.isVietnamese()
      ? (
          topProduct
            ? `"${topProduct.name}" là sản phẩm nổi bật nhất với ${topProduct.totalSold} lượt bán trong ${rangeLabel}`
            : `Không có dữ liệu bán hàng trong ${rangeLabel}`
        )
      : (
          topProduct
            ? `"${topProduct.name}" is the top product with ${topProduct.totalSold} units sold in ${rangeLabel}`
            : `No sales data available for ${rangeLabel}`
        );
    
    return [
      {
        icon: trend >= 0 ? 'gi-ui-trend-up' : 'gi-ui-trend-down',
        type: trend >= 0 ? 'positive' : 'warning',
        message: revenueMessage
      },
      {
        icon: 'gi-ui-warning',
        type: stats.overview.lowStockProducts > 0 ? 'warning' : 'positive',
        message: stockMessage
      },
      {
        icon: 'gi-ui-target',
        type: pendingCount > 5 ? 'warning' : 'info',
        message: pendingMessage
      },
      {
        icon: 'gi-ui-spark',
        type: 'info',
        message: topProductMessage
      }
    ];
  });

  // Chart Data
  revenueData = computed(() => {
    const stats = this.stats();
    if (!stats) return [];
    
    const { start, end } = this.dateRangeBoundaries();
    const viewMode = this.chartViewMode();
    
    // Create a map from backend dailyRevenue data for quick lookup
    const revenueMap = new Map<string, number>();
    if (stats.dailyRevenue) {
      stats.dailyRevenue.forEach((item: any) => {
        const dateKey = `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`;
        revenueMap.set(dateKey, item.total);
      });
    }
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    if (viewMode === 'day') {
      // Daily view - original logic
      const daysCount = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const daysArray = Array.from({ length: daysCount }, (_, i) => {
        const date = new Date(start);
        date.setDate(date.getDate() + i);
        return date;
      });
      
      return daysArray.map(date => {
        const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const total = revenueMap.get(dateKey) || 0;
        
        return {
          label: `${date.getDate()}/${date.getMonth() + 1}`,
          day: date.getDate().toString(),
          month: monthNames[date.getMonth()],
          monthNum: date.getMonth(),
          value: total
        };
      });
    } else if (viewMode === 'week') {
      // Weekly view - aggregate by week (reset week number each month)
      const weekData: { total: number, startDate: Date, endDate: Date, month: number }[] = [];
      const current = new Date(start);
      const processedWeeks = new Set<string>();
      
      while (current <= end) {
        const weekStart = new Date(current);
        const dayOfWeek = weekStart.getDay();
        weekStart.setDate(weekStart.getDate() - dayOfWeek); // Start from Sunday
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        const weekKey = weekStart.toISOString().split('T')[0];
        
        if (!processedWeeks.has(weekKey)) {
          processedWeeks.add(weekKey);
          
          // Calculate total for this week
          let weekTotal = 0;
          const weekCurrent = new Date(weekStart);
          while (weekCurrent <= weekEnd && weekCurrent <= end) {
            if (weekCurrent >= start) {
              const dateKey = `${weekCurrent.getFullYear()}-${String(weekCurrent.getMonth() + 1).padStart(2, '0')}-${String(weekCurrent.getDate()).padStart(2, '0')}`;
              weekTotal += revenueMap.get(dateKey) || 0;
            }
            weekCurrent.setDate(weekCurrent.getDate() + 1);
          }
          
          // Determine which month this week belongs to (use end date of week)
          const weekMonth = weekEnd.getMonth();
          
          weekData.push({ total: weekTotal, startDate: new Date(weekStart), endDate: new Date(weekEnd), month: weekMonth });
        }
        
        current.setDate(current.getDate() + 1);
      }
      
      // Assign week numbers that reset each month
      let currentMonth = -1;
      let weekCounter = 0;
      
      return weekData.map((week) => {
        if (week.month !== currentMonth) {
          currentMonth = week.month;
          weekCounter = 1;
        } else {
          weekCounter++;
        }
        
        return {
          label: `${week.startDate.getDate()}/${week.startDate.getMonth() + 1} - ${week.endDate.getDate()}/${week.endDate.getMonth() + 1}`,
          day: `W${weekCounter}`,
          month: monthNames[week.month],
          monthNum: week.month,
          value: week.total
        };
      });
    } else {
      // Monthly view - aggregate by month
      const monthMap = new Map<string, number>();
      const current = new Date(start);
      
      while (current <= end) {
        const monthKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthMap.has(monthKey)) {
          monthMap.set(monthKey, 0);
        }
        
        const dateKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
        const dayTotal = revenueMap.get(dateKey) || 0;
        monthMap.set(monthKey, monthMap.get(monthKey)! + dayTotal);
        
        current.setDate(current.getDate() + 1);
      }
      
      return Array.from(monthMap.entries()).map(([key, total]) => {
        const [year, month] = key.split('-').map(Number);
        return {
          label: `${monthNames[month - 1]} ${year}`,
          day: monthNames[month - 1],
          month: monthNames[month - 1],
          monthNum: month - 1,
          value: total
        };
      });
    }
  });

  maxRevenue = computed(() => {
    const data = this.revenueData();
    return Math.max(...data.map(d => d.value), 1);
  });

  yAxisTicks = computed(() => {
    const max = this.maxRevenue();
    // Round up to nice number
    const magnitude = Math.pow(10, Math.floor(Math.log10(max)));
    const normalized = max / magnitude;
    let niceMax: number;
    
    if (normalized <= 1) niceMax = magnitude;
    else if (normalized <= 2) niceMax = 2 * magnitude;
    else if (normalized <= 5) niceMax = 5 * magnitude;
    else niceMax = 10 * magnitude;
    
    const step = niceMax / 4;
    return [niceMax, niceMax - step, niceMax - 2*step, niceMax - 3*step, 0];
  });

  orderSegments = computed(() => {
    const stats = this.stats();
    if (!stats?.ordersByStatus) return [];

    // Backend already returns ordersByStatus filtered by date range
    const statusCounts: Record<string, number> = {
      pending: stats.ordersByStatus['pending'] || 0,
      processing: stats.ordersByStatus['processing'] || 0,
      shipped: stats.ordersByStatus['shipped'] || 0,
      delivered: stats.ordersByStatus['delivered'] || 0,
      cancelled: stats.ordersByStatus['cancelled'] || 0,
      created: stats.ordersByStatus['created'] || 0
    };

    // Add created to pending for display
    statusCounts['pending'] += statusCounts['created'];

    const total = Object.values(statusCounts).reduce((sum, count) => sum + count, 0) || 1;
    const statusData = [
      { label: this.translate.instant('admin.status.pending'), value: statusCounts['pending'], color: '#ffc107' },
      { label: this.translate.instant('admin.status.processing'), value: statusCounts['processing'], color: '#17a2b8' },
      { label: this.translate.instant('admin.status.shipped'), value: statusCounts['shipped'], color: '#fd7e14' },
      { label: this.translate.instant('admin.status.delivered'), value: statusCounts['delivered'], color: '#28a745' },
      { label: this.translate.instant('admin.status.cancelled'), value: statusCounts['cancelled'], color: '#dc3545' }
    ];

    const circumference = 2 * Math.PI * 80;
    let offset = 0;

    return statusData.map(item => {
      const percentage = (item.value / total) * 100;
      const dasharray = `${(percentage / 100) * circumference} ${circumference}`;
      const result = {
        ...item,
        percentage: percentage.toFixed(1),
        dasharray,
        offset: -offset
      };
      offset += (percentage / 100) * circumference;
      return result;
    });
  });

  categoryData = computed(() => {
    const stats = this.stats();
    if (!stats?.topProductsByRevenue || stats.topProductsByRevenue.length === 0) return [];
    
    // Use backend aggregated data (already filtered by date range and top 5)
    const gradientColors = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
    ];
    
    return stats.topProductsByRevenue.map((product: any, index: number) => ({
      name: product.name,
      value: product.totalRevenue,
      color: gradientColors[index % gradientColors.length]
    }));
  });

  maxCategoryValue = computed(() => {
    const data = this.categoryData();
    return Math.max(...data.map(d => d.value), 1);
  });

  // Tooltip
  tooltip = signal<{ x: number, y: number, label: string, value: number, type: 'revenue' | 'orders' } | null>(null);

  // Table
  orderSearchTerm = signal<string>('');
  private searchTimeout: any;
  sortColumn = signal<string>('createdAt');
  sortDirection = signal<SortDirection>('desc');

  // Heatmap data properties
  weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  hourIntervals = [
    '00-02', '02-04', '04-06', '06-08', '08-10', '10-12',
    '12-14', '14-16', '16-18', '18-20', '20-22', '22-24'
  ];

  // Computed: Heatmap matrix data
  heatmapData = computed(() => {
    const stats = this.stats();
    if (!stats?.heatmapData) return { matrix: [], max: 0 };

    const matrix: number[][] = Array(12).fill(0).map(() => Array(7).fill(0));
    
    // Use backend aggregated data (already filtered by date range and exclude cancelled)
    stats.heatmapData.forEach((item: any) => {
      // MongoDB dayOfWeek: 1=Sunday, 2=Monday, ..., 7=Saturday
      // Convert to: 0=Monday, 1=Tuesday, ..., 6=Sunday
      const dayOfWeek = item._id.day === 1 ? 6 : item._id.day - 2;
      const hourInterval = item._id.hourInterval;
      
      matrix[hourInterval][dayOfWeek] = item.count;
    });

    const max = Math.max(...matrix.flat(), 1);
    return { matrix, max };
  });

  // Computed: Weekday totals for column chart
  weekdayData = computed(() => {
    const { matrix } = this.heatmapData();
    if (!matrix.length) return [];

    const totals = Array(7).fill(0);
    matrix.forEach(row => {
      row.forEach((count, dayIndex) => {
        totals[dayIndex] += count;
      });
    });

    const maxTotal = Math.max(...totals, 1);
    
    return this.weekdayLabels.map((day, index) => ({
      day,
      total: totals[index],
      isMax: totals[index] === maxTotal
    }));
  });

  maxDailyOrders = computed(() => {
    const data = this.weekdayData();
    return Math.max(...data.map(d => d.total), 1);
  });

  filteredOrders = computed(() => {
    const stats = this.stats();
    if (!stats) return [];

    // Filter by date range first
    const { start, end } = this.dateRangeBoundaries();
    let orders = stats.recentOrders.filter((order: any) => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= start && orderDate <= end;
    });

    // Search filter - search for words anywhere in the string
    const searchTerm = this.orderSearchTerm();
    if (searchTerm) {
      const terms = searchTerm.toLowerCase().trim().split(/\s+/);
      orders = orders.filter(order => {
        const searchableText = [
          order._id,
          order.user.name || '',
          order.user.email || '',
          order.status,
          order.totalAmount.toString()
        ].join(' ').toLowerCase();
        
        // Check if all search terms exist somewhere in the searchable text
        return terms.every(term => searchableText.includes(term));
      });
    }

    // Sort
    const col = this.sortColumn();
    const dir = this.sortDirection();
    if (col && dir) {
      orders.sort((a: any, b: any) => {
        let aVal = col === 'user' ? (a.user.name || a.user.email) : a[col];
        let bVal = col === 'user' ? (b.user.name || b.user.email) : b[col];

        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = bVal.toLowerCase();
        }

        if (dir === 'asc') {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });
    }

    return orders;
  });

  ngOnInit() {
    this.loadDashboard();
  }

  loadDashboard() {
    const boundaries = this.dateRangeBoundaries();
    const dateRange = boundaries ? {
      // Use local date string instead of UTC ISO string
      startDate: this.formatLocalDate(boundaries.start),
      endDate: this.formatLocalDate(boundaries.end)
    } : undefined;
    
    // Load current period stats (this will set _dashboardStats signal in service)
    this.adminService.loadDashboardStats(dateRange).subscribe({
      next: () => {
        // After current period loads, fetch previous period for trend comparison
        const prevBoundaries = this.previousPeriodBoundaries();
        const prevDateRange = {
          startDate: this.formatLocalDate(prevBoundaries.start),
          endDate: this.formatLocalDate(prevBoundaries.end)
        };
        
        // Load previous period WITHOUT setting _dashboardStats (only for trend calculation)
        this.adminService.loadDashboardStatsWithoutSetting(prevDateRange).subscribe({
          next: (response) => {
            this.previousStats.set({
              totalRevenue: response.data.overview.totalRevenue || 0,
              totalOrders: response.data.overview.totalOrders || 0
            });
          },
          error: (err) => {
            console.error('Failed to load previous period stats:', err);
            this.previousStats.set({ totalRevenue: 0, totalOrders: 0 });
          }
        });
      }
    });
  }
  
  // Helper to format date as YYYY-MM-DD in local timezone
  private formatLocalDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  selectDateRange(range: DateRange) {
    this.selectedRange.set(range);
    
    // Initialize custom dates if Custom is selected
    if (range === 'custom' && !this.customStartDate()) {
      const today = new Date();
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 6);
      
      this.customStartDate.set(lastWeek.toISOString().split('T')[0]);
      this.customEndDate.set(today.toISOString().split('T')[0]);
    }
    
    // Reload dashboard with new date range
    this.loadDashboard();
  }

  setCustomStartDate(event: Event) {
    const input = event.target as HTMLInputElement;
    this.customStartDate.set(input.value);
    // Reload when custom date changes
    if (this.customEndDate()) {
      this.loadDashboard();
    }
  }

  setCustomEndDate(event: Event) {
    const input = event.target as HTMLInputElement;
    this.customEndDate.set(input.value);
    // Reload when custom date changes
    if (this.customStartDate()) {
      this.loadDashboard();
    }
  }

  exportData(format: 'excel') {
    console.log(`Exporting data as ${format}...`);
    // Implement export logic
    alert(`Export ${format.toUpperCase()} feature will be implemented`);
  }

  private isVietnamese(): boolean {
    const currentLang = this.translate.currentLang || this.translate.getDefaultLang() || 'en';
    return currentLang.toLowerCase().startsWith('vi');
  }

  // Chart helper methods
  getChartWidth(): number {
    const dataLength = this.revenueData().length;
    if (dataLength === 0) return 100;
    const padding = 50; // Padding on each side
    const spacing = Math.max(80, Math.min(150, 1000 / dataLength)); // Adaptive spacing
    return padding * 2 + (dataLength - 1) * spacing;
  }

  getPointX(index: number): number {
    const dataLength = this.revenueData().length;
    if (dataLength <= 1) return 50;
    const padding = 50;
    const spacing = Math.max(80, Math.min(150, 1000 / dataLength));
    return padding + index * spacing;
  }

  getPointY(value: number): number {
    const max = this.yAxisTicks()[0];
    return 300 - (value / max * 280);
  }

  getRevenueSmoothPath(): string {
    const data = this.revenueData();
    if (data.length === 0) return '';
    if (data.length === 1) {
      const x = this.getPointX(0);
      const y = this.getPointY(data[0].value);
      return `M ${x},${y}`;
    }
    
    let path = '';
    data.forEach((point, index) => {
      const x = this.getPointX(index);
      const y = this.getPointY(point.value);
      
      if (index === 0) {
        path = `M ${x},${y}`;
      } else {
        // Create smooth curve using Bezier
        const prevX = this.getPointX(index - 1);
        const prevY = this.getPointY(data[index - 1].value);
        const cpX1 = prevX + (x - prevX) * 0.5;
        const cpY1 = prevY;
        const cpX2 = prevX + (x - prevX) * 0.5;
        const cpY2 = y;
        path += ` C ${cpX1},${cpY1} ${cpX2},${cpY2} ${x},${y}`;
      }
    });
    
    return path;
  }

  getRevenueAreaPath(): string {
    const data = this.revenueData();
    if (data.length === 0) return '';
    
    let path = this.getRevenueSmoothPath();
    if (!path) return '';
    
    // Close the path to create area
    const lastX = this.getPointX(data.length - 1);
    const firstX = this.getPointX(0);
    path += ` L ${lastX},300 L ${firstX},300 Z`;
    
    return path;
  }

  getMonthGroups(): Array<{month: string, startIndex: number, count: number}> {
    const data = this.revenueData();
    if (data.length === 0) return [];
    
    const groups: Array<{month: string, startIndex: number, count: number}> = [];
    let currentMonth = data[0].month;
    let startIndex = 0;
    let count = 1;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i].month === currentMonth) {
        count++;
      } else {
        groups.push({ month: currentMonth, startIndex, count });
        currentMonth = data[i].month;
        startIndex = i;
        count = 1;
      }
    }
    
    // Add last group
    groups.push({ month: currentMonth, startIndex, count });
    
    return groups;
  }

  getRevenuePath(): string {
    const data = this.revenueData();
    if (data.length === 0) return '';
    
    const max = this.yAxisTicks()[0]; // Use the nice rounded max from Y-axis
    
    let path = 'M ';
    data.forEach((point, index) => {
      const x = index * 100;
      const y = 300 - (point.value / max * 280);
      if (index === 0) {
        path += `${x},${y}`;
      } else {
        path += ` L ${x},${y}`;
      }
    });
    
    return path;
  }

  showTooltip(event: MouseEvent, label: string, value: number, type: 'revenue' | 'orders' = 'revenue') {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    this.tooltip.set({
      x: rect.left,
      y: rect.top - 60,
      label,
      value,
      type
    });
  }

  hideTooltip() {
    this.tooltip.set(null);
  }

  // Heatmap helper methods
  getOrderCount(dayIndex: number, hourIndex: number): number {
    const { matrix } = this.heatmapData();
    return matrix[hourIndex]?.[dayIndex] || 0;
  }

  getHeatmapColor(count: number): string {
    const { max } = this.heatmapData();
    if (count === 0) return '#e9ecef';
    
    const intensity = count / max;
    
    // Color scale from light blue to dark blue
    if (intensity < 0.2) return '#cfe2ff';
    if (intensity < 0.4) return '#9ec5fe';
    if (intensity < 0.6) return '#6ea8fe';
    if (intensity < 0.8) return '#3d8bfd';
    return '#0d6efd';
  }

  getColumnColor(count: number): string {
    const max = this.maxDailyOrders();
    if (count === 0) return '#e9ecef';
    
    const intensity = count / max;
    
    // Same color scale as heatmap
    if (intensity < 0.2) return '#cfe2ff';
    if (intensity < 0.4) return '#9ec5fe';
    if (intensity < 0.6) return '#6ea8fe';
    if (intensity < 0.8) return '#3d8bfd';
    return '#0d6efd';
  }

  sortTable(column: string) {
    if (this.sortColumn() === column) {
      const current = this.sortDirection();
      this.sortDirection.set(current === 'asc' ? 'desc' : current === 'desc' ? null : 'asc');
      if (!this.sortDirection()) {
        this.sortColumn.set('');
      }
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
  }

  getSortIcon(column: string): string {
    if (this.sortColumn() !== column) return 'gi-ui-sort';
    return this.sortDirection() === 'asc' ? 'gi-ui-chevron-up' : 'gi-ui-chevron-down';
  }

  onOrderSearch(value: string) {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.orderSearchTerm.set(value);
    }, 300);
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'pending': 'Chờ xử lý',
      'pending_manual_payment': 'Chờ xử lý',
      'processing': 'Đang xử lý',
      'shipped': 'Đang giao',
      'delivered': 'Đã giao',
      'cancelled': 'Đã hủy'
    };
    return labels[status] || status;
  }

  getPaymentStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'pending': 'Chờ thanh toán',
      'pending_manual_payment': 'Chờ thanh toán',
      'paid': 'Đã thanh toán',
      'failed': 'Thất bại',
      'refunded': 'Hoàn tiền',
      'cancelled': 'Đã hủy'
    };
    return labels[status] || status;
  }

  formatDate(date: any): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
}
