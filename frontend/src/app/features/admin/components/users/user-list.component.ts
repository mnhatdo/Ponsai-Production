import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { AdminService } from '../../services/admin.service';
import { AdminUser } from '../../models/admin.models';
import { AdminCurrencyPipe } from '../../pipes/admin-currency.pipe';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminCurrencyPipe, TranslateModule],
  template: `
    <div class="user-list-page">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-left">
          <h1>{{ 'admin.customerManagement' | translate }}</h1>
          <p class="subtitle">{{ pagination().total }} {{ 'admin.usersCount' | translate }}</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-bar">
        <div class="search-box">
          <input 
            type="text" 
            [placeholder]="'admin.searchUsersByName' | translate"
            [(ngModel)]="searchTerm"
            (input)="onSearch()">
        </div>

        <div class="filter-group">
          <select [(ngModel)]="roleFilter" (change)="applyFilters()">
            <option value="">{{ 'admin.allRoles' | translate }}</option>
            <option value="user">{{ 'admin.customer' | translate }}</option>
            <option value="admin">{{ 'admin.administrator' | translate }}</option>
          </select>

          <select [(ngModel)]="statusFilter" (change)="applyFilters()">
            <option value="">{{ 'admin.allStatus' | translate }}</option>
            <option value="active">{{ 'admin.active' | translate }}</option>
            <option value="inactive">{{ 'admin.inactive' | translate }}</option>
          </select>
        </div>
      </div>

      <!-- Loading State -->
      @if (adminService.loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>{{ 'admin.loading' | translate }}</p>
        </div>
      }

      <!-- Users Table -->
      @if (!adminService.loading()) {
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Người dùng</th>
                <th>Email</th>
                <th>Vai trò</th>
                <th>Đơn hàng</th>
                <th>Tổng chi tiêu</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th class="actions-col">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              @for (user of users(); track user._id) {
                <tr>
                  <td>
                    <div class="user-info">
                      <div class="avatar">
                        @if (user.avatar) {
                          <img [src]="user.avatar" [alt]="user.name">
                        } @else {
                          <span>{{ getInitials(user.name || user.email) }}</span>
                        }
                      </div>
                      <span class="name">{{ user.name || 'Chưa cập nhật' }}</span>
                    </div>
                  </td>
                  <td>
                    <div class="email-info">
                      <span>{{ user.email }}</span>
                      @if (user.authProvider === 'google') {
                        <span class="auth-badge google">Google</span>
                      }
                    </div>
                  </td>
                  <td>
                    <span class="role-badge" [class]="user.role">
                      {{ user.role === 'admin' ? 'Quản trị viên' : 'Khách hàng' }}
                    </span>
                  </td>
                  <td class="orders-count">{{ user.orderCount }}</td>
                  <td class="total-spent">{{ user.totalSpent | adminCurrency }}</td>
                  <td>
                    <span class="status-badge" [class.active]="user.isActive" [class.inactive]="!user.isActive">
                      {{ user.isActive ? 'Hoạt động' : 'Bị khóa' }}
                    </span>
                  </td>
                  <td class="date">{{ formatDate(user.createdAt) }}</td>
                  <td>
                    <div class="action-buttons">
                      <button class="action-btn view" (click)="viewUser(user)" title="Xem chi tiết">
                        View
                      </button>
                      <button 
                        class="action-btn role" 
                        (click)="toggleRole(user)" 
                        [title]="user.role === 'admin' ? 'Hạ cấp' : 'Nâng cấp'"
                        [disabled]="isCurrentUser(user._id)">
                        {{ user.role === 'admin' ? 'User' : 'Admin' }}
                      </button>
                      <button 
                        class="action-btn" 
                        [class.ban]="user.isActive"
                        [class.unban]="!user.isActive"
                        (click)="toggleStatus(user)" 
                        [title]="user.isActive ? 'Khóa' : 'Mở khóa'"
                        [disabled]="isCurrentUser(user._id)">
                        {{ user.isActive ? 'Lock' : 'Unlock' }}
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="8" class="empty-row">
                    <p>Không tìm thấy người dùng nào</p>
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

      <!-- User Detail Modal -->
      @if (showDetailModal()) {
        <div class="modal-overlay" (click)="closeDetailModal()">
          <div class="modal-content modal-large" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Chi tiết người dùng</h3>
              <button class="close-btn" (click)="closeDetailModal()">×</button>
            </div>
            <div class="modal-body">
              @if (selectedUser()) {
                <div class="user-detail">
                  <div class="user-profile">
                    <div class="large-avatar">
                      @if (selectedUser()!.avatar) {
                        <img [src]="selectedUser()!.avatar" [alt]="selectedUser()!.name">
                      } @else {
                        <span>{{ getInitials(selectedUser()!.name || selectedUser()!.email) }}</span>
                      }
                    </div>
                    <h2>{{ selectedUser()!.name || 'Chưa cập nhật' }}</h2>
                    <p class="user-email">{{ selectedUser()!.email }}</p>
                    <div class="user-badges">
                      <span class="role-badge" [class]="selectedUser()!.role">
                        {{ selectedUser()!.role === 'admin' ? 'Quản trị viên' : 'Khách hàng' }}
                      </span>
                      <span class="status-badge" [class.active]="selectedUser()!.isActive">
                        {{ selectedUser()!.isActive ? 'Hoạt động' : 'Bị khóa' }}
                      </span>
                    </div>
                  </div>

                  <div class="user-stats">
                    <div class="stat-box">
                      <span class="stat-value">{{ selectedUser()!.orderCount }}</span>
                      <span class="stat-label">Đơn hàng</span>
                    </div>
                    <div class="stat-box">
                      <span class="stat-value">{{ selectedUser()!.totalSpent | adminCurrency }}</span>
                      <span class="stat-label">Tổng chi tiêu</span>
                    </div>
                    <div class="stat-box">
                      <span class="stat-value">{{ formatDate(selectedUser()!.createdAt) }}</span>
                      <span class="stat-label">Ngày tham gia</span>
                    </div>
                  </div>

                  @if (selectedUser()!.address) {
                    <div class="info-section">
                      <h4>Địa chỉ</h4>
                      <p>{{ selectedUser()!.address!.street }}</p>
                      <p>{{ selectedUser()!.address!.city }}, {{ selectedUser()!.address!.state }}</p>
                      <p>{{ selectedUser()!.address!.zipCode }}, {{ selectedUser()!.address!.country }}</p>
                    </div>
                  }

                  <div class="info-section">
                    <h4>Thông tin khác</h4>
                    <p><strong>Điện thoại:</strong> {{ selectedUser()!.phone || 'Chưa cập nhật' }}</p>
                    <p><strong>Xác thực email:</strong> {{ selectedUser()!.isEmailVerified ? 'Đã xác thực' : 'Chưa xác thực' }}</p>
                    <p><strong>Phương thức đăng nhập:</strong> {{ selectedUser()!.authProvider === 'google' ? 'Google' : 'Email/Mật khẩu' }}</p>
                  </div>
                </div>
              }
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="closeDetailModal()">Đóng</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .user-list-page {
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
      display: grid;
      grid-template-columns: minmax(280px, 2fr) auto;
      gap: 12px;
      align-items: center;
      margin-bottom: 24px;
      padding: 12px;
      border-radius: 12px;
    }

    .search-box {
      position: relative;
      min-width: 0;
      width: 100%;
    }

    .search-box input {
      width: 100%;
      min-height: 44px;
      padding: 10px 12px;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 14px;
      margin-bottom: 0;
    }

    .filter-group {
      display: grid;
      grid-template-columns: repeat(2, minmax(170px, 1fr));
      gap: 12px;
    }

    .filter-group select {
      min-height: 44px;
      padding: 10px 12px;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 14px;
      background: #fff;
      min-width: 170px;
      cursor: pointer;
      margin-bottom: 0;
    }

    @media (max-width: 900px) {
      .filters-bar {
        grid-template-columns: 1fr;
      }

      .filter-group {
        grid-template-columns: 1fr;
      }

      .filter-group select {
        min-width: 0;
      }
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
      white-space: nowrap;
    }

    .data-table th {
      background: #f8f9fa;
      font-weight: 600;
      color: #666;
    }

    .data-table tr:hover {
      background: #fafafa;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #153243;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 14px;
      overflow: hidden;
    }

    .avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .name {
      font-weight: 500;
    }

    .email-info {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .auth-badge {
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 500;
    }

    .auth-badge.google {
      background: #4285f4;
      color: #fff;
    }

    .role-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }

    .role-badge.admin {
      background: #c3d350;
      color: #153243;
    }

    .role-badge.user {
      background: #e6e6ea;
      color: #153243;
    }

    .orders-count {
      font-weight: 600;
    }

    .total-spent {
      color: #153243;
      font-weight: 600;
    }

    .status-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }

    .status-badge.active {
      background: #153243;
      color: #c3d350;
    }

    .status-badge.inactive {
      background: #e6e6ea;
      color: #153243;
    }

    .date {
      color: #666;
    }

    .action-buttons {
      display: flex;
      gap: 4px;
      flex-wrap: nowrap;
      align-items: center;
    }

    .action-btn {
      padding: 4px 6px;
      min-width: 50px;
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

    .action-btn.role {
      background: #fff3e0;
      color: #e65100;
      border-color: #fff3e0;
    }

    .action-btn.role:hover:not(:disabled) {
      background: #e65100;
      color: #fff;
      border-color: #e65100;
    }

    .action-btn.ban {
      background: #ffebee;
      color: #c62828;
      border-color: #ffebee;
    }

    .action-btn.ban:hover:not(:disabled) {
      background: #c62828;
      color: #fff;
      border-color: #c62828;
    }

    .action-btn.unban {
      background: #e8f5e9;
      color: #2e7d32;
      border-color: #e8f5e9;
    }

    .action-btn.unban:hover:not(:disabled) {
      background: #2e7d32;
      color: #fff;
      border-color: #2e7d32;
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
      max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid #f0f0f0;
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
      padding: 24px;
    }

    .user-detail {
      text-align: center;
    }

    .user-profile {
      margin-bottom: 24px;
    }

    .large-avatar {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: #153243;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 28px;
      margin: 0 auto 16px;
      overflow: hidden;
    }

    .large-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .user-profile h2 {
      margin: 0 0 4px;
      font-size: 20px;
    }

    .user-email {
      color: #666;
      margin: 0 0 12px;
    }

    .user-badges {
      display: flex;
      gap: 8px;
      justify-content: center;
    }

    .user-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 24px;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 12px;
    }

    .stat-box {
      text-align: center;
    }

    .stat-box .stat-value {
      display: block;
      font-size: 18px;
      font-weight: 700;
      color: #153243;
    }

    .stat-box .stat-label {
      font-size: 12px;
      color: #666;
    }

    .info-section {
      text-align: left;
      margin-bottom: 16px;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .info-section h4 {
      margin: 0 0 12px;
      font-size: 14px;
      color: #666;
      text-transform: uppercase;
    }

    .info-section p {
      margin: 8px 0;
      font-size: 14px;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      padding: 16px 20px;
      border-top: 1px solid #f0f0f0;
    }

    .btn {
      padding: 10px 20px;
      border: 2px solid transparent;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
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

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `]
})
export class UserListComponent implements OnInit {
  adminService = inject(AdminService);

  users = computed(() => this.adminService.users());
  pagination = computed(() => this.adminService.userPagination());

  // Filters
  searchTerm = '';
  roleFilter = '';
  statusFilter = '';
  private searchTimeout: any;

  // Modal
  showDetailModal = signal(false);
  selectedUser = signal<AdminUser | null>(null);

  // Current user ID (to prevent self-modification)
  currentUserId = ''; // Should be set from AuthService

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    const params: any = { page: 1, limit: 20 };
    
    if (this.searchTerm) params.search = this.searchTerm;
    if (this.roleFilter) params.role = this.roleFilter;
    if (this.statusFilter === 'active') params.active = true;
    else if (this.statusFilter === 'inactive') params.active = false;

    this.adminService.loadUsers(params).subscribe();
  }

  onSearch(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.loadUsers();
    }, 300);
  }

  applyFilters(): void {
    this.loadUsers();
  }

  goToPage(page: number): void {
    const params: any = { page, limit: 20 };
    
    if (this.searchTerm) params.search = this.searchTerm;
    if (this.roleFilter) params.role = this.roleFilter;
    if (this.statusFilter === 'active') params.active = true;
    else if (this.statusFilter === 'inactive') params.active = false;

    this.adminService.loadUsers(params).subscribe();
  }

  getPageNumbers(): number[] {
    const { page, pages } = this.pagination();
    const result: number[] = [];
    
    let start = Math.max(1, page - 2);
    let end = Math.min(pages, page + 2);
    
    for (let i = start; i <= end; i++) {
      result.push(i);
    }
    
    return result;
  }

  viewUser(user: AdminUser): void {
    this.selectedUser.set(user);
    this.showDetailModal.set(true);
  }

  closeDetailModal(): void {
    this.showDetailModal.set(false);
    this.selectedUser.set(null);
  }

  toggleRole(user: AdminUser): void {
    if (this.isCurrentUser(user._id)) return;
    
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    const action = newRole === 'admin' ? 'nâng cấp thành quản trị viên' : 'hạ cấp thành khách hàng';
    
    if (confirm(`Bạn có chắc chắn muốn ${action} cho ${user.name || user.email}?`)) {
      this.adminService.updateUserRole(user._id, newRole).subscribe();
    }
  }

  toggleStatus(user: AdminUser): void {
    if (this.isCurrentUser(user._id)) return;
    
    const action = user.isActive ? 'khóa' : 'mở khóa';
    
    if (confirm(`Bạn có chắc chắn muốn ${action} tài khoản ${user.name || user.email}?`)) {
      this.adminService.toggleUserStatus(user._id).subscribe();
    }
  }

  isCurrentUser(userId: string): boolean {
    return userId === this.currentUserId;
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('vi-VN');
  }
}
