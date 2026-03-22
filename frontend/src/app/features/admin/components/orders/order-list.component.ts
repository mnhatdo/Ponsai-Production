import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { AdminService } from '../../services/admin.service';
import { AdminOrder, OrderStatusUpdate } from '../../models/admin.models';
import { AdminCurrencyPipe } from '../../pipes/admin-currency.pipe';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, AdminCurrencyPipe, TranslateModule],
  template: `
    <div class="order-list-page">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-left">
          <h1>{{ 'admin.orderManagement' | translate }}</h1>
          <p class="subtitle">{{ pagination().total }} {{ 'admin.ordersCount' | translate }}</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-bar">
        <div class="search-box">
          <input 
            type="text" 
            [placeholder]="'admin.searchOrdersBy' | translate"
            [(ngModel)]="searchTerm"
            (input)="onSearch()">
        </div>

        <div class="filter-group">
          <select [(ngModel)]="statusFilter" (change)="applyFilters()">
            <option value="">{{ 'admin.allStatus' | translate }}</option>
            <option value="pending">{{ 'order.statusPending' | translate }}</option>
            <option value="processing">{{ 'order.statusProcessing' | translate }}</option>
            <option value="shipped">{{ 'order.statusShipped' | translate }}</option>
            <option value="delivered">{{ 'order.statusDelivered' | translate }}</option>
            <option value="cancelled">{{ 'order.statusCancelled' | translate }}</option>
          </select>

          <select [(ngModel)]="paymentFilter" (change)="applyFilters()">
            <option value="">{{ 'admin.allPayment' | translate }}</option>
            <option value="pending">{{ 'order.paymentPending' | translate }}</option>
            <option value="paid">{{ 'order.paymentPaid' | translate }}</option>
            <option value="failed">{{ 'order.paymentFailed' | translate }}</option>
            <option value="refunded">{{ 'order.paymentRefunded' | translate }}</option>
          </select>

          <input 
            type="date" 
            [(ngModel)]="startDate" 
            (change)="applyFilters()"
            placeholder="Từ ngày">
          <input 
            type="date" 
            [(ngModel)]="endDate" 
            (change)="applyFilters()"
            placeholder="Đến ngày">
          
          <button class="btn-clear-filter" (click)="clearFilters()" [title]="'admin.clearFilters' | translate">
            <i class="gi gi-ui-delete" aria-hidden="true"></i> {{ 'admin.clearFilters' | translate }}
          </button>
        </div>
      </div>

      <!-- Loading State -->
      @if (adminService.loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>{{ 'admin.loading' | translate }}</p>
        </div>
      }

      <!-- Orders Table -->
      @if (!adminService.loading()) {
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Khách hàng</th>
                <th>Sản phẩm</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
                <th>Thanh toán</th>
                <th>Ngày tạo</th>
                <th class="actions-col">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              @for (order of orders(); track order._id) {
                <tr>
                  <td class="order-id">#{{ order._id.slice(-8) }}</td>
                  <td>
                    <div class="customer-info">
                      <span class="name">{{ order.user.name || 'N/A' }}</span>
                      <span class="email">{{ order.user.email || 'N/A' }}</span>
                    </div>
                  </td>
                  <td>
                    <div class="products-preview">
                      @for (item of order.items.slice(0, 2); track item.product._id) {
                        <div class="product-mini">
                          @if (item.product.primaryImage) {
                            <img [src]="item.product.primaryImage" [alt]="item.product.name">
                          }
                          <span>{{ item.quantity }}x</span>
                        </div>
                      }
                      @if (order.items.length > 2) {
                        <span class="more-items">+{{ order.items.length - 2 }}</span>
                      }
                    </div>
                  </td>
                  <td class="total-amount">{{ order.totalAmount | adminCurrency }}</td>
                  <td>
                    <span class="status-badge" [class]="order.status">
                      {{ getStatusLabel(order.status) }}
                    </span>
                  </td>
                  <td>
                    <span class="payment-badge" [class]="order.paymentStatus">
                      {{ getPaymentStatusLabel(order.paymentStatus) }}
                    </span>
                  </td>
                  <td class="date">{{ formatDate(order.createdAt) }}</td>
                  <td>
                    <div class="action-buttons">
                      <button class="action-btn view" (click)="viewOrder(order)" title="Xem chi tiết">
                        View
                      </button>
                      <button 
                        class="action-btn edit" 
                        (click)="openStatusModal(order)" 
                        title="Cập nhật trạng thái"
                        [disabled]="order.status === 'cancelled'">
                        Cập nhật
                      </button>
                      @if (order.status !== 'shipped' && order.status !== 'delivered' && order.status !== 'cancelled' && 
                            order.paymentStatus !== 'paid' && order.paymentStatus !== 'refunded') {
                        <button class="action-btn delete" (click)="cancelOrderConfirm(order)" title="Hủy đơn">
                          Cancel
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="8" class="empty-row">
                    <p>Không tìm thấy đơn hàng nào</p>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        @if (pagination().pages > 1) {
          <div class="pagination">
            <button 
              class="page-btn" 
              [disabled]="pagination().page === 1"
              (click)="goToPage(pagination().page - 1)">
              Trước
            </button>
            
            @for (page of getPageNumbers(); track page) {
              <button 
                class="page-btn" 
                [class.active]="page === pagination().page"
                (click)="goToPage(page)">
                {{ page }}
              </button>
            }
            
            <button 
              class="page-btn" 
              [disabled]="pagination().page === pagination().pages"
              (click)="goToPage(pagination().page + 1)">
              Sau
            </button>
          </div>
        }
      }

      <!-- Order Detail Modal -->
      @if (showDetailModal()) {
        <div class="modal-overlay" (click)="closeDetailModal()">
          <div class="modal-content modal-large" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Chi tiết đơn hàng #{{ selectedOrder()?._id?.slice(-8) }}</h3>
              <button class="close-btn" (click)="closeDetailModal()">×</button>
            </div>
            <div class="modal-body">
              @if (selectedOrder()) {
                <div class="order-detail-grid">
                  <!-- Customer Info -->
                  <div class="detail-section">
                    <h4>Thông tin khách hàng</h4>
                    <p><strong>Họ tên:</strong> {{ selectedOrder()!.user.name || 'N/A' }}</p>
                    <p><strong>Email:</strong> {{ selectedOrder()!.user.email || 'N/A' }}</p>
                    <p><strong>Điện thoại:</strong> {{ selectedOrder()!.user.phone || 'N/A' }}</p>
                  </div>

                  <!-- Shipping Address -->
                  <div class="detail-section">
                    <h4>Địa chỉ giao hàng</h4>
                    <p>{{ selectedOrder()!.shippingAddress.street }}</p>
                    <p>{{ selectedOrder()!.shippingAddress.city }}, {{ selectedOrder()!.shippingAddress.state }}</p>
                    <p>{{ selectedOrder()!.shippingAddress.zipCode }}, {{ selectedOrder()!.shippingAddress.country }}</p>
                  </div>

                  <!-- Order Status -->
                  <div class="detail-section">
                    <h4>Trạng thái</h4>
                    <p>
                      <strong>Đơn hàng:</strong>
                      <span class="status-badge" [class]="selectedOrder()!.status">
                        {{ getStatusLabel(selectedOrder()!.status) }}
                      </span>
                    </p>
                    <p>
                      <strong>Thanh toán:</strong>
                      <span class="payment-badge" [class]="selectedOrder()!.paymentStatus">
                        {{ getPaymentStatusLabel(selectedOrder()!.paymentStatus) }}
                      </span>
                    </p>
                    @if (selectedOrder()!.trackingNumber) {
                      <p><strong>Mã vận chuyển:</strong> {{ selectedOrder()!.trackingNumber }}</p>
                    }
                    @if (selectedOrder()!.notes) {
                      <p><strong>Ghi chú:</strong> {{ selectedOrder()!.notes }}</p>
                    }
                  </div>

                  <!-- Order Info -->
                  <div class="detail-section">
                    <h4>Thông tin đơn hàng</h4>
                    <p><strong>Ngày tạo:</strong> {{ formatDateTime(selectedOrder()!.createdAt) }}</p>
                    <p><strong>Cập nhật:</strong> {{ formatDateTime(selectedOrder()!.updatedAt) }}</p>
                    <p><strong>Phương thức:</strong> {{ selectedOrder()!.paymentMethod || 'N/A' }}</p>
                  </div>
                </div>

                <!-- Order Items -->
                <div class="detail-section full-width">
                  <h4>Sản phẩm</h4>
                  <table class="items-table">
                    <thead>
                      <tr>
                        <th>Sản phẩm</th>
                        <th>SKU</th>
                        <th>Đơn giá</th>
                        <th>Số lượng</th>
                        <th>Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (item of selectedOrder()!.items; track item.product._id) {
                        <tr>
                          <td>
                            <div class="product-cell">
                              @if (item.product.primaryImage) {
                                <img [src]="item.product.primaryImage" [alt]="item.product.name">
                              }
                              <span>{{ item.product.name || 'N/A' }}</span>
                            </div>
                          </td>
                          <td>{{ item.product.sku || '-' }}</td>
                          <td>{{ item.price | adminCurrency }}</td>
                          <td>{{ item.quantity }}</td>
                          <td>{{ (item.price * item.quantity) | adminCurrency }}</td>
                        </tr>
                      }
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colspan="4" class="total-label">Tổng cộng</td>
                        <td class="total-value">{{ selectedOrder()!.totalAmount | adminCurrency }}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              }
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="closeDetailModal()">Đóng</button>
            </div>
          </div>
        </div>
      }

      <!-- Status Update Modal -->
      @if (showStatusModal()) {
        <div class="modal-overlay" (click)="closeStatusModal()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Cập nhật trạng thái đơn hàng</h3>
              <button class="close-btn" (click)="closeStatusModal()">×</button>
            </div>
            <div class="modal-body">
              <p class="order-id-modal">#{{ selectedOrder()?._id?.slice(-8) }}</p>
              
              <div class="form-group">
                <label>Trạng thái đơn hàng</label>
                <select [(ngModel)]="newStatus" class="form-control">
                  <option value="">-- Không thay đổi --</option>
                  <option value="pending">Chờ xử lý</option>
                  <option value="processing">Đang xử lý</option>
                  <option value="shipped">Đang giao</option>
                  <option value="delivered">Đã giao</option>
                </select>
              </div>

              <div class="form-group">
                <label>Trạng thái thanh toán</label>
                <select [(ngModel)]="newPaymentStatus" class="form-control">
                  <option value="">-- Không thay đổi --</option>
                  <option value="pending">Chờ thanh toán</option>
                  <option value="paid">Đã thanh toán</option>
                  <option value="failed">Thất bại</option>
                  <option value="refunded">Hoàn tiền</option>
                </select>
              </div>

              <div class="form-group">
                <label>Mã vận chuyển</label>
                <input 
                  type="text" 
                  [(ngModel)]="trackingNumber"
                  class="form-control"
                  placeholder="VD: VN123456789">
              </div>

              <div class="form-group">
                <label>Ghi chú</label>
                <textarea 
                  [(ngModel)]="orderNotes"
                  class="form-control"
                  rows="2"
                  placeholder="Ghi chú thêm..."></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="closeStatusModal()">Hủy</button>
              <button class="btn btn-primary" (click)="updateOrderStatus()">Cập nhật</button>
            </div>
          </div>
        </div>
      }

      <!-- Cancel Confirmation Modal -->
      @if (showCancelModal()) {
        <div class="modal-overlay" (click)="closeCancelModal()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Xác nhận hủy đơn hàng</h3>
              <button class="close-btn" (click)="closeCancelModal()">×</button>
            </div>
            <div class="modal-body">
              <p>Bạn có chắc chắn muốn hủy đơn hàng <strong>#{{ cancelOrderTarget()?._id?.slice(-8) }}</strong>?</p>
              
              <div class="form-group">
                <label>Lý do hủy đơn</label>
                <textarea 
                  [(ngModel)]="cancelReason"
                  class="form-control"
                  rows="2"
                  placeholder="Nhập lý do hủy đơn..."></textarea>
              </div>

              <p class="warning-text">Số lượng sản phẩm sẽ được hoàn trả vào kho.</p>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="closeCancelModal()">Không</button>
              <button class="btn btn-danger" (click)="confirmCancelOrder()">Hủy đơn</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .order-list-page {
      padding: 24px;
      max-width: 1600px;
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

    /* Filters */
    .filters-bar {
      display: flex;
      gap: 16px;
      align-items: center;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }

    .search-box {
      position: relative;
      flex: 1;
      min-width: 250px;
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
      padding: 10px 12px 10px 42px;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 14px;
      line-height: 1.2;
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

    /* Table */
    .table-container {
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      overflow: hidden;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
    }

    .data-table th,
    .data-table td {
      padding: 14px 16px;
      text-align: left;
      font-size: 14px;
      border-bottom: 1px solid #f0f0f0;
    }

    .data-table th {
      background: #f8f9fa;
      font-weight: 600;
      color: #666;
    }

    .data-table tr:hover {
      background: #fafafa;
    }

    .actions-col {
      width: 120px;
    }

    .order-id {
      font-family: monospace;
      font-weight: 600;
      color: #153243;
    }

    .customer-info {
      display: flex;
      flex-direction: column;
    }

    .customer-info .name {
      font-weight: 500;
    }

    .customer-info .email {
      font-size: 12px;
      color: #666;
    }

    .products-preview {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .product-mini {
      display: flex;
      align-items: center;
      gap: 4px;
      background: #f5f5f5;
      padding: 4px 8px;
      border-radius: 4px;
    }

    .product-mini img {
      width: 24px;
      height: 24px;
      object-fit: cover;
      border-radius: 4px;
    }

    .product-mini span {
      font-size: 12px;
      font-weight: 500;
    }

    .more-items {
      font-size: 12px;
      color: #666;
      background: #f0f0f0;
      padding: 4px 8px;
      border-radius: 4px;
    }

    .total-amount {
      font-weight: 600;
      color: #153243;
    }

    .date {
      color: #666;
    }

    .status-badge,
    .payment-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 6px 14px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      white-space: nowrap;
    }

    .status-badge.pending,
    .status-badge.pending_manual_payment { 
      background: #fff3cd; 
      color: #856404; 
      border: 1px solid #ffc107;
    }
    
    .status-badge.processing { 
      background: #d1ecf1; 
      color: #0c5460; 
      border: 1px solid #17a2b8;
    }
    
    .status-badge.shipped { 
      background: #ffe8d6;
      color: #c05621;
      border: 1px solid #fd7e14;
    }
    
    .status-badge.delivered { 
      background: #d4edda; 
      color: #155724; 
      border: 1px solid #28a745;
    }
    
    .status-badge.cancelled { 
      background: #f8d7da; 
      color: #721c24; 
      border: 1px solid #dc3545;
    }

    .payment-badge.pending,
    .payment-badge.pending_manual_payment { background: #c3d350; color: #153243; }
    .payment-badge.paid { background: #153243; color: #c3d350; }
    .payment-badge.failed { background: #e6e6ea; color: #153243; }
    .payment-badge.refunded { background: #284b63; color: #fff; }
    .payment-badge.cancelled { background: #f8d7da; color: #721c24; }

    .action-buttons {
      display: flex;
      gap: 4px;
      flex-wrap: nowrap;
      align-items: center;
    }

    .action-btn {
      padding: 4px 8px;
      min-width: 52px;
      height: 30px;
      border: 1px solid #e6e6ea;
      border-radius: 4px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: #fff;
      font-size: 12px;
      font-weight: 600;
      color: #153243;
      transition: all 0.2s;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .action-btn.view {
      background: #e3f2fd;
      color: #1976d2;
      border-color: #e3f2fd;
    }

    .action-btn.view:hover:not(:disabled) {
      background: #1976d2;
      color: #fff;
      border-color: #1976d2;
    }

    .action-btn.edit {
      background: #fff3e0;
      color: #e65100;
      border-color: #fff3e0;
    }

    .action-btn.edit:hover:not(:disabled) {
      background: #e65100;
      color: #fff;
      border-color: #e65100;
    }

    .action-btn.delete {
      background: #ffebee;
      color: #c62828;
      border-color: #ffebee;
    }

    .action-btn.delete:hover:not(:disabled) {
      background: #c62828;
      color: #fff;
      border-color: #c62828;
    }

    .action-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .empty-row {
      text-align: center;
      padding: 40px !important;
      color: #999;
    }

    /* Pagination */
    .pagination {
      display: flex;
      justify-content: center;
      gap: 8px;
      margin-top: 24px;
    }

    .page-btn {
      padding: 8px 16px;
      border: 1px solid #ddd;
      background: #fff;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
    }

    .page-btn:hover:not(:disabled) {
      background: #f5f5f5;
    }

    .page-btn.active {
      background: #153243;
      color: #fff;
      border-color: #153243;
    }

    .page-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Modal */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: #fff;
      border-radius: 12px;
      width: 100%;
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-content.modal-large {
      max-width: 900px;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid #f0f0f0;
      position: sticky;
      top: 0;
      background: #fff;
    }

    .modal-header h3 {
      margin: 0;
      font-size: 18px;
    }

    .close-btn {
      width: 32px;
      height: 32px;
      border: none;
      background: none;
      font-size: 24px;
      cursor: pointer;
      color: #153243;
      transition: all 0.2s;
    }

    .close-btn:hover {
      color: #284b63;
      transform: scale(1.1);
    }

    .modal-body {
      padding: 20px;
    }

    .order-id-modal {
      font-family: monospace;
      font-size: 18px;
      font-weight: 600;
      color: #153243;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid #f0f0f0;
    }

    .order-detail-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin-bottom: 20px;
    }

    .detail-section {
      padding: 16px;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .detail-section.full-width {
      grid-column: 1 / -1;
    }

    .detail-section h4 {
      margin: 0 0 12px;
      font-size: 14px;
      color: #153243;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 600;
    }

    .detail-section p {
      margin: 8px 0;
      font-size: 14px;
    }

    .items-table {
      width: 100%;
      border-collapse: collapse;
      background: #fff;
      border-radius: 8px;
      overflow: hidden;
    }

    .items-table th,
    .items-table td {
      padding: 12px;
      text-align: left;
      font-size: 14px;
      border-bottom: 1px solid #f0f0f0;
    }

    .items-table th {
      background: #fff;
      font-weight: 600;
      color: #666;
    }

    .product-cell {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .product-cell img {
      width: 40px;
      height: 40px;
      object-fit: cover;
      border-radius: 6px;
    }

    .items-table tfoot td {
      font-weight: 600;
      background: #f8f9fa;
    }

    .total-label {
      text-align: right;
    }

    .total-value {
      color: #153243;
      font-size: 16px;
    }

    .form-group {
      margin-bottom: 16px;
    }

    .form-group label {
      display: block;
      margin-bottom: 6px;
      font-size: 14px;
      font-weight: 500;
      color: #333;
    }

    .form-control {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 14px;
    }

    .form-control:focus {
      outline: none;
      border-color: #153243;
    }

    .warning-text {
      color: #153243;
      font-size: 13px;
      background: #c3d350;
      padding: 10px;
      border-radius: 6px;
      margin-top: 12px;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 20px;
      border-top: 1px solid #f0f0f0;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 10px 20px;
      border: 2px solid transparent;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-primary {
      background: #153243;
      color: #fff;
      border-color: #153243;
    }

    .btn-primary:hover {
      background: #0d1f29;
      border-color: #0d1f29;
    }

    .btn-secondary {
      background: #fff;
      color: #153243;
      border-color: #e6e6ea;
    }

    .btn-secondary:hover {
      background: #e6e6ea;
      border-color: #153243;
    }

    .btn-danger {
      background: #284b63;
      color: #fff;
      border-color: #284b63;
    }

    .btn-danger:hover {
      background: #1a3244;
      border-color: #1a3244;
    }

    @media (max-width: 768px) {
      .order-detail-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class OrderListComponent implements OnInit {
  adminService = inject(AdminService);

  orders = computed(() => this.adminService.orders());
  pagination = computed(() => this.adminService.orderPagination());

  // Filters
  searchTerm = '';
  statusFilter = '';
  paymentFilter = '';
  startDate = '';
  endDate = '';
  private searchTimeout: any;
  private savedScrollPosition = 0;

  // Modals
  showDetailModal = signal(false);
  showStatusModal = signal(false);
  showCancelModal = signal(false);
  selectedOrder = signal<AdminOrder | null>(null);
  cancelOrderTarget = signal<AdminOrder | null>(null);

  // Status update form
  newStatus = '';
  newPaymentStatus = '';
  trackingNumber = '';
  orderNotes = '';
  cancelReason = '';

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    const params: any = { page: 1, limit: 20 };
    
    if (this.searchTerm) params.search = this.searchTerm;
    if (this.statusFilter) params.status = this.statusFilter;
    if (this.paymentFilter) params.paymentStatus = this.paymentFilter;
    
    // Set startDate to beginning of day (00:00:00)
    if (this.startDate) {
      params.startDate = new Date(this.startDate + 'T00:00:00').toISOString();
    }
    
    // Set endDate to end of day (23:59:59)
    if (this.endDate) {
      params.endDate = new Date(this.endDate + 'T23:59:59').toISOString();
    }

    this.adminService.loadOrders(params).subscribe({
      next: () => {
        // Khôi phục vị trí scroll nếu có
        if (this.savedScrollPosition > 0) {
          setTimeout(() => {
            window.scrollTo(0, this.savedScrollPosition);
            this.savedScrollPosition = 0;
          }, 100);
        }
      }
    });
  }

  onSearch(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.loadOrders();
    }, 300);
  }

  applyFilters(): void {
    this.loadOrders();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = '';
    this.paymentFilter = '';
    this.startDate = '';
    this.endDate = '';
    this.loadOrders();
  }

  goToPage(page: number): void {
    const params: any = { page, limit: 20 };
    
    if (this.searchTerm) params.search = this.searchTerm;
    if (this.statusFilter) params.status = this.statusFilter;
    if (this.paymentFilter) params.paymentStatus = this.paymentFilter;
    
    // Set startDate to beginning of day (00:00:00)
    if (this.startDate) {
      params.startDate = new Date(this.startDate + 'T00:00:00').toISOString();
    }
    
    // Set endDate to end of day (23:59:59)
    if (this.endDate) {
      params.endDate = new Date(this.endDate + 'T23:59:59').toISOString();
    }

    this.adminService.loadOrders(params).subscribe();
  }

  getPageNumbers(): number[] {
    const { page, pages } = this.pagination();
    const result: number[] = [];
    
    let start = Math.max(1, page - 2);
    let end = Math.min(pages, page + 2);
    
    if (end - start < 4) {
      if (start === 1) end = Math.min(pages, 5);
      else start = Math.max(1, pages - 4);
    }
    
    for (let i = start; i <= end; i++) {
      result.push(i);
    }
    
    return result;
  }

  // View Detail Modal
  viewOrder(order: AdminOrder): void {
    this.selectedOrder.set(order);
    this.showDetailModal.set(true);
  }

  closeDetailModal(): void {
    this.showDetailModal.set(false);
    this.selectedOrder.set(null);
  }

  // Status Update Modal
  openStatusModal(order: AdminOrder): void {
    this.selectedOrder.set(order);
    this.newStatus = order.status;
    this.newPaymentStatus = order.paymentStatus;
    this.trackingNumber = order.trackingNumber || '';
    this.orderNotes = order.notes || '';
    this.showStatusModal.set(true);
  }

  closeStatusModal(): void {
    this.showStatusModal.set(false);
    this.selectedOrder.set(null);
  }

  updateOrderStatus(): void {
    const order = this.selectedOrder();
    if (!order) return;

    // Lưu vị trí scroll hiện tại
    this.savedScrollPosition = window.scrollY;

    const updateData: OrderStatusUpdate = {};
    
    if (this.newStatus) updateData.status = this.newStatus as any;
    if (this.newPaymentStatus) updateData.paymentStatus = this.newPaymentStatus as any;
    if (this.trackingNumber) updateData.trackingNumber = this.trackingNumber;
    if (this.orderNotes) updateData.notes = this.orderNotes;

    this.adminService.updateOrderStatus(order._id, updateData).subscribe({
      next: () => {
        this.closeStatusModal();
        this.loadOrders(); // Reload để lấy dữ liệu đầy đủ với populate
      }
    });
  }

  // Cancel Order Modal
  cancelOrderConfirm(order: AdminOrder): void {
    this.cancelOrderTarget.set(order);
    this.cancelReason = '';
    this.showCancelModal.set(true);
  }

  closeCancelModal(): void {
    this.showCancelModal.set(false);
    this.cancelOrderTarget.set(null);
  }

  confirmCancelOrder(): void {
    const order = this.cancelOrderTarget();
    if (!order) return;

    // Lưu vị trí scroll hiện tại
    this.savedScrollPosition = window.scrollY;

    this.adminService.cancelOrder(order._id, this.cancelReason).subscribe({
      next: () => {
        this.loadOrders(); // Reload để lấy dữ liệu đầy đủ với populate
        this.closeCancelModal();
      }
    });
  }

  // Helpers
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('vi-VN');
  }

  formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleString('vi-VN');
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'Chờ xử lý',
      pending_manual_payment: 'Chờ xử lý',
      processing: 'Đang xử lý',
      shipped: 'Đang giao',
      delivered: 'Đã giao',
      cancelled: 'Đã hủy'
    };
    return labels[status] || status;
  }

  getPaymentStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'Chờ thanh toán',
      pending_manual_payment: 'Chờ thanh toán',
      paid: 'Đã thanh toán',
      failed: 'Thất bại',
      refunded: 'Hoàn tiền',
      cancelled: 'Đã hủy'
    };
    return labels[status] || status;
  }
}
