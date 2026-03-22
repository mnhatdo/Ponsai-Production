import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { AdminService } from '../../services/admin.service';
import { AdminProduct, AdminCategory } from '../../models/admin.models';
import { AdminCurrencyPipe } from '../../pipes/admin-currency.pipe';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, AdminCurrencyPipe, TranslateModule],
  template: `
    <div class="product-list-page">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-left">
          <h1>{{ 'admin.productManagement' | translate }}</h1>
          <p class="subtitle">{{ pagination().total }} {{ 'admin.productsCount' | translate }}</p>
        </div>
        <div class="header-right">
          <a routerLink="/admin/products/new" class="btn btn-primary">
            {{ 'admin.addProduct' | translate }}
          </a>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-bar">
        <div class="search-box">
          <input 
            type="text" 
            [placeholder]="'admin.searchProducts' | translate"
            [(ngModel)]="searchTerm"
            (input)="onSearch()">
        </div>

        <div class="filter-group">
          <select [(ngModel)]="selectedCategory" (change)="applyFilters()">
            <option value="">{{ 'admin.allCategories' | translate }}</option>
            @for (cat of categories(); track cat._id) {
              <option [value]="cat._id">{{ cat.name }}</option>
            }
          </select>

          <select [(ngModel)]="stockFilter" (change)="applyFilters()">
            <option value="">{{ 'admin.allStatus' | translate }}</option>
            <option value="inStock">{{ 'admin.inStock' | translate }}</option>
            <option value="outOfStock">{{ 'admin.outOfStock' | translate }}</option>
            <option value="lowStock">{{ 'admin.lowStock' | translate }}</option>
          </select>
        </div>

        @if (selectedProducts().length > 0) {
          <button class="btn btn-danger" (click)="bulkDelete()">
            {{ 'admin.delete' | translate }} {{ selectedProducts().length }} {{ 'admin.productsCount' | translate }}
          </button>
        }
      </div>

      <!-- Loading State -->
      @if (adminService.loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>{{ 'admin.loading' | translate }}</p>
        </div>
      }

      <!-- Products Table -->
      @if (!adminService.loading()) {
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th class="checkbox-col">
                  <input 
                    type="checkbox" 
                    [checked]="allSelected()"
                    (change)="toggleSelectAll($event)">
                </th>
                <th class="image-col">{{ 'admin.image' | translate }}</th>
                <th>{{ 'admin.productName' | translate }}</th>
                <th>{{ 'product.sku' | translate }}</th>
                <th>{{ 'admin.category' | translate }}</th>
                <th>{{ 'admin.price' | translate }}</th>
                <th>{{ 'admin.stock' | translate }}</th>
                <th>{{ 'admin.status' | translate }}</th>
                <th class="actions-col">{{ 'admin.actions' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              @for (product of products(); track product._id) {
                <tr [class.selected]="isSelected(product._id)">
                  <td>
                    <input 
                      type="checkbox" 
                      [checked]="isSelected(product._id)"
                      (change)="toggleSelect(product._id)">
                  </td>
                  <td>
                    <div class="product-image">
                      @if (product.primaryImage) {
                        <img [src]="product.primaryImage" [alt]="product.name">
                      } @else {
                        <div class="no-image">{{ 'admin.noImage' | translate }}</div>
                      }
                    </div>
                  </td>
                  <td>
                    <div class="product-name">
                      <span class="name">{{ product.name }}</span>
                      @if (product.featured) {
                        <span class="badge featured">{{ 'admin.featured' | translate }}</span>
                      }
                    </div>
                  </td>
                  <td class="sku">{{ product.sku || '-' }}</td>
                  <td>{{ getCategoryName(product.category) }}</td>
                  <td>
                    <div class="price-wrapper">
                      <span class="current-price">{{ product.price | adminCurrency }}</span>
                      @if (product.originalPrice && product.originalPrice > product.price) {
                        <span class="original-price">{{ product.originalPrice | adminCurrency }}</span>
                      }
                    </div>
                  </td>
                  <td>
                    <div class="stock-info" [class.low]="isLowStock(product.stockQuantity)" [class.out]="product.stockQuantity === 0">
                      <span class="stock-qty">{{ product.stockQuantity }}</span>
                      <button class="stock-edit-btn" (click)="openStockModal(product)" [title]="'admin.updateStock' | translate">
                        {{ 'button.edit' | translate }}
                      </button>
                    </div>
                  </td>
                  <td>
                    @if (product.stockQuantity === 0) {
                      <span class="status-badge danger">{{ 'admin.outOfStock' | translate }}</span>
                    } @else if (isLowStock(product.stockQuantity)) {
                      <span class="status-badge warning">{{ 'admin.lowStock' | translate }}</span>
                    } @else {
                      <span class="status-badge success">{{ 'admin.inStock' | translate }}</span>
                    }
                  </td>
                  <td>
                    <div class="action-buttons">
                      <a [routerLink]="['/admin/products', product._id, 'edit']" class="action-btn edit" [title]="'button.edit' | translate">
                        {{ 'button.edit' | translate }}
                      </a>
                      <button class="action-btn delete" (click)="deleteProduct(product)" [title]="'button.delete' | translate">
                        {{ 'button.delete' | translate }}
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="9" class="empty-row">
                    <p>Không tìm thấy sản phẩm nào</p>
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

      <!-- Stock Modal -->
      @if (showStockModal()) {
        <div class="modal-overlay" (click)="closeStockModal()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Cập nhật tồn kho</h3>
              <button class="close-btn" (click)="closeStockModal()">×</button>
            </div>
            <div class="modal-body">
              <p class="product-name-modal">{{ stockProduct()?.name }}</p>
              <div class="form-group">
                <label>Số lượng tồn kho</label>
                <input 
                  type="number" 
                  [(ngModel)]="newStockQuantity" 
                  min="0"
                  class="form-control">
              </div>
              <div class="form-group">
                <label>Lý do điều chỉnh (tùy chọn)</label>
                <input 
                  type="text" 
                  [(ngModel)]="stockReason" 
                  placeholder="VD: Nhập hàng mới"
                  class="form-control">
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="closeStockModal()">Hủy</button>
              <button class="btn btn-primary" (click)="updateStock()">Cập nhật</button>
            </div>
          </div>
        </div>
      }

      <!-- Delete Confirmation Modal -->
      @if (showDeleteModal()) {
        <div class="modal-overlay" (click)="closeDeleteModal()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Xác nhận xóa</h3>
              <button class="close-btn" (click)="closeDeleteModal()">×</button>
            </div>
            <div class="modal-body">
              <p>Bạn có chắc chắn muốn xóa sản phẩm <strong>{{ deleteProductTarget()?.name }}</strong>?</p>
              <p class="warning-text">Hành động này không thể hoàn tác.</p>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="closeDeleteModal()">Hủy</button>
              <button class="btn btn-danger" (click)="confirmDelete()">Xóa</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .product-list-page {
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

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      border: 2px solid transparent;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
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

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Filters */
    .filters-bar {
      display: flex;
      gap: 20px;
      align-items: center;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }

    .search-box {
      position: relative;
      flex: 1;
      min-width: 300px;
      max-width: 500px;
    }

    .search-box img {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      width: 18px;
      height: 18px;
      opacity: 0.5;
    }

    .search-box input {
      width: 100%;
      padding: 12px 16px 12px 44px;
      border: 1px solid #e6e6ea;
      border-radius: 8px;
      font-size: 14px;
      transition: all 0.2s;
    }

    .search-box input:focus {
      outline: none;
      border-color: #153243;
      box-shadow: 0 0 0 3px rgba(21, 50, 67, 0.1);
    }

    .filter-group {
      display: flex;
      gap: 16px;
      align-items: center;
    }

    .filter-group select {
      min-width: 180px;
      padding: 12px 16px;
      border: 1px solid #e6e6ea;
      border-radius: 8px;
      font-size: 14px;
      background: #fff;
      cursor: pointer;
      transition: all 0.2s;
    }

    .filter-group select:focus {
      outline: none;
      border-color: #153243;
      box-shadow: 0 0 0 3px rgba(21, 50, 67, 0.1);
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
      vertical-align: middle;
    }

    .data-table th {
      background: #f8f9fa;
      font-weight: 600;
      color: #666;
    }

    .data-table tr:hover {
      background: #fafafa;
    }

    .data-table tr.selected {
      background: #f0f7f4;
    }

    .checkbox-col {
      width: 40px;
    }

    .image-col {
      width: 70px;
    }

    .actions-col {
      width: 100px;
    }

    .product-image {
      width: 50px;
      height: 50px;
      border-radius: 8px;
      overflow: hidden;
      background: #f5f5f5;
    }

    .product-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .no-image {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      color: #999;
    }

    .product-name {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .product-name .name {
      font-weight: 500;
    }

    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 11px;
      font-weight: 500;
    }

    .badge.featured {
      background: #c3d350;
      color: #153243;
    }

    .sku {
      font-family: monospace;
      color: #666;
    }

    .price-wrapper {
      display: flex;
      flex-direction: column;
      gap: 2px;
      align-items: flex-start;
    }

    .current-price {
      font-weight: 600;
      color: #153243;
    }

    .original-price {
      font-size: 12px;
      color: #999;
      text-decoration: line-through;
    }

    .stock-info {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .stock-info.low .stock-qty {
      color: #f0ad4e;
    }

    .stock-info.out .stock-qty {
      color: #dc3545;
    }

    .stock-qty {
      font-weight: 600;
    }

    .stock-edit-btn {
      padding: 6px 12px;
      height: 28px;
      border: 1px solid #e6e6ea;
      background: #fff;
      border-radius: 6px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 500;
      color: #153243;
      transition: all 0.2s;
      white-space: nowrap;
    }

    .stock-edit-btn img {
      width: 14px;
      height: 14px;
    }

    .stock-edit-btn:hover {
      background: #153243;
      color: #fff;
      border-color: #153243;
    }

    .status-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      white-space: nowrap;
      text-align: center;
      min-width: 70px;
    }

    .status-badge.success {
      background: #153243;
      color: #c3d350;
    }

    .status-badge.warning {
      background: #c3d350;
      color: #153243;
    }

    .status-badge.danger {
      background: #e6e6ea;
      color: #153243;
    }

    .action-buttons {
      display: flex;
      gap: 8px;
    }

    .action-btn {
      padding: 6px 12px;
      height: 32px;
      border: 1px solid transparent;
      border-radius: 6px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      text-decoration: none;
      font-size: 12px;
      font-weight: 600;
      transition: all 0.2s;
      white-space: nowrap;
      min-width: 60px;
    }

    .action-btn img {
      width: 14px;
      height: 14px;
    }

    .action-btn.edit {
      background: #e3f2fd;
      color: #1976d2;
      border-color: #e3f2fd;
    }

    .action-btn.edit:hover {
      background: #1976d2;
      color: #fff;
      border-color: #1976d2;
    }

    .action-btn.delete {
      background: #ffebee;
      color: #d32f2f;
      border-color: #ffebee;
    }

    .action-btn.delete:hover {
      background: #d32f2f;
      color: #fff;
      border-color: #d32f2f;
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
      max-width: 450px;
      overflow: hidden;
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
      padding: 20px;
    }

    .product-name-modal {
      font-weight: 600;
      margin-bottom: 16px;
      padding-bottom: 16px;
      border-bottom: 1px solid #f0f0f0;
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
      color: #dc3545;
      font-size: 13px;
      margin-top: 8px;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 20px;
      border-top: 1px solid #f0f0f0;
    }
  `]
})
export class ProductListComponent implements OnInit {
  adminService = inject(AdminService);

  products = computed(() => this.adminService.products());
  categories = computed(() => this.adminService.categories());
  pagination = computed(() => this.adminService.productPagination());

  // Filters
  searchTerm = '';
  selectedCategory = '';
  stockFilter = '';
  private searchTimeout: any;

  // Selection
  selectedProducts = signal<string[]>([]);

  // Stock Modal
  showStockModal = signal(false);
  stockProduct = signal<AdminProduct | null>(null);
  newStockQuantity = 0;
  stockReason = '';

  // Delete Modal
  showDeleteModal = signal(false);
  deleteProductTarget = signal<AdminProduct | null>(null);

  allSelected = computed(() => {
    const products = this.products();
    const selected = this.selectedProducts();
    return products.length > 0 && products.every(p => selected.includes(p._id));
  });

  ngOnInit(): void {
    this.loadData();
    // Load settings to get lowStockThreshold
    this.adminService.loadSettings().subscribe();
  }

  loadData(): void {
    this.adminService.loadCategories().subscribe();
    this.loadProducts();
  }

  loadProducts(): void {
    const params: any = { page: 1, limit: 20 };
    
    if (this.searchTerm) params.search = this.searchTerm;
    if (this.selectedCategory) params.category = this.selectedCategory;
    
    if (this.stockFilter === 'inStock') params.inStock = true;
    else if (this.stockFilter === 'outOfStock') params.inStock = false;
    else if (this.stockFilter === 'lowStock') params.lowStock = true;

    this.adminService.loadProducts(params).subscribe();
  }

  onSearch(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.loadProducts();
    }, 300);
  }

  applyFilters(): void {
    this.loadProducts();
  }

  goToPage(page: number): void {
    const params: any = { page, limit: 20 };
    
    if (this.searchTerm) params.search = this.searchTerm;
    if (this.selectedCategory) params.category = this.selectedCategory;
    
    if (this.stockFilter === 'inStock') params.inStock = true;
    else if (this.stockFilter === 'outOfStock') params.inStock = false;
    else if (this.stockFilter === 'lowStock') params.lowStock = true;

    this.adminService.loadProducts(params).subscribe();
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

  // Selection
  isSelected(id: string): boolean {
    return this.selectedProducts().includes(id);
  }

  toggleSelect(id: string): void {
    this.selectedProducts.update(selected => {
      if (selected.includes(id)) {
        return selected.filter(s => s !== id);
      } else {
        return [...selected, id];
      }
    });
  }

  toggleSelectAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.selectedProducts.set(this.products().map(p => p._id));
    } else {
      this.selectedProducts.set([]);
    }
  }

  bulkDelete(): void {
    if (confirm(`Bạn có chắc chắn muốn xóa ${this.selectedProducts().length} sản phẩm?`)) {
      this.adminService.bulkDeleteProducts(this.selectedProducts()).subscribe({
        next: () => {
          this.selectedProducts.set([]);
        }
      });
    }
  }

  // Stock Modal
  openStockModal(product: AdminProduct): void {
    this.stockProduct.set(product);
    this.newStockQuantity = product.stockQuantity;
    this.stockReason = '';
    this.showStockModal.set(true);
  }

  closeStockModal(): void {
    this.showStockModal.set(false);
    this.stockProduct.set(null);
  }

  updateStock(): void {
    const product = this.stockProduct();
    if (!product) return;

    this.adminService.updateProductStock(product._id, this.newStockQuantity, this.stockReason).subscribe({
      next: () => {
        this.closeStockModal();
      }
    });
  }

  // Delete Modal
  deleteProduct(product: AdminProduct): void {
    this.deleteProductTarget.set(product);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.deleteProductTarget.set(null);
  }

  confirmDelete(): void {
    const product = this.deleteProductTarget();
    if (!product) return;

    this.adminService.deleteProduct(product._id).subscribe({
      next: () => {
        this.closeDeleteModal();
      }
    });
  }

  isLowStock(quantity: number): boolean {
    const threshold = this.adminService.lowStockThreshold();
    return quantity > 0 && quantity <= threshold;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  }

  getCategoryName(category: AdminProduct['category']): string {
    if (typeof category === 'object' && category?.name) {
      return category.name;
    }
    // If string, try to find from categories list
    const categoryId = typeof category === 'string' ? category : category?._id;
    const found = this.categories().find(c => c._id === categoryId);
    return found?.name || 'N/A';
  }
}
