import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AdminService } from '../../services/admin.service';
import { AdminCategory, CategoryFormData } from '../../models/admin.models';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule, TranslateModule],
  template: `
    <div class="category-list-page">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-left">
          <h1>{{ 'admin.categoryManagement' | translate }}</h1>
          <p class="subtitle">{{ categories().length }} {{ 'admin.categoriesCount' | translate }}</p>
        </div>
        <div class="header-right">
          <button class="btn btn-primary" (click)="openModal()">

            {{ 'admin.addCategory' | translate }}
          </button>
        </div>
      </div>

      <!-- Loading State -->
      @if (adminService.loading() && !showModal()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>{{ 'admin.loading' | translate }}</p>
        </div>
      }

      <!-- Categories Grid -->
      @if (!adminService.loading() || showModal()) {
        <div class="categories-grid">
          @for (category of categories(); track category._id) {
            <div class="category-card" [class.inactive]="!category.active">
              <div class="card-header">
                <div class="category-info">
                  <h3>{{ category.name }}</h3>
                  <span class="slug">{{ category.slug }}</span>
                </div>
                <div 
                  class="status-indicator" 
                  [class.active]="category.active"
                  (click)="toggleCategoryStatus(category)"
                  [title]="'admin.toggleStatus' | translate">
                  {{ category.active ? ('admin.active' | translate) : ('admin.inactiveHidden' | translate) }}
                </div>
              </div>
              
              @if (category.description) {
                <p class="description">{{ category.description }}</p>
              }

              <div class="card-stats">
                <div class="stat">
                  <span class="stat-value">{{ category.productCount }}</span>
                  <span class="stat-label">{{ 'admin.productsCount' | translate }}</span>
                </div>
                @if (category.parent) {
                  <div class="parent-info">
                    <span class="parent-label">{{ 'admin.parentCategory' | translate }}:</span>
                    <span class="parent-name">{{ category.parent.name }}</span>
                  </div>
                }
              </div>

              <div class="card-actions">
                <button class="action-btn edit" (click)="editCategory(category)" [title]="'button.edit' | translate">
                  {{ 'button.edit' | translate }}
                </button>
                <button 
                  class="action-btn delete" 
                  (click)="confirmDelete(category)" 
                  [title]="'button.delete' | translate"
                  [disabled]="category.productCount > 0">
                  {{ 'button.delete' | translate }}
                </button>
              </div>
            </div>
          } @empty {
            <div class="empty-state">
              <p>{{ 'admin.noCategoriesYet' | translate }}</p>
              <button class="btn btn-primary" (click)="openModal()">{{ 'admin.createFirstCategory' | translate }}</button>
            </div>
          }
        </div>
      }

      <!-- Category Form Modal -->
      @if (showModal()) {
        <div class="modal-overlay" (click)="closeModal()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>{{ isEditMode ? ('admin.editCategory' | translate) : ('admin.addNewCategory' | translate) }}</h3>
              <button class="close-btn" (click)="closeModal()">×</button>
            </div>
            <form [formGroup]="categoryForm" (ngSubmit)="onSubmit()">
              <div class="modal-body">
                <div class="form-group">
                  <label for="name">{{ 'admin.categoryName' | translate }} <span class="required">*</span></label>
                  <input 
                    type="text" 
                    id="name" 
                    formControlName="name"
                    class="form-control"
                    [class.error]="isFieldInvalid('name')">
                  @if (isFieldInvalid('name')) {
                    <span class="error-message">{{ 'admin.categoryNameRequired' | translate }}</span>
                  }
                </div>

                <div class="form-group">
                  <label for="description">{{ 'admin.description' | translate }}</label>
                  <textarea 
                    id="description" 
                    formControlName="description"
                    class="form-control"
                    rows="3"
                    [placeholder]="'admin.categoryDescriptionPlaceholder' | translate"></textarea>
                </div>

                <div class="form-group">
                  <label for="parent">{{ 'admin.parentCategory' | translate }}</label>
                  <select id="parent" formControlName="parent" class="form-control">
                    <option value="">-- {{ 'admin.none' | translate }} --</option>
                    @for (cat of availableParents(); track cat._id) {
                      <option [value]="cat._id">{{ cat.name }}</option>
                    }
                  </select>
                </div>

                <div class="form-group checkbox-group">
                  <label class="checkbox-label">
                    <input type="checkbox" formControlName="active">
                    <span>{{ 'admin.activateCategory' | translate }}</span>
                  </label>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="closeModal()">{{ 'button.cancel' | translate }}</button>
                <button type="submit" class="btn btn-primary" [disabled]="adminService.loading()">
                  @if (adminService.loading()) {
                    {{ 'profile.saving' | translate }}
                  } @else {
                    {{ isEditMode ? ('button.update' | translate) : ('button.create' | translate) }}
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Delete Confirmation Modal -->
      @if (showDeleteModal()) {
        <div class="modal-overlay" (click)="closeDeleteModal()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>{{ 'admin.confirmDeleteTitle' | translate }}</h3>
              <button class="close-btn" (click)="closeDeleteModal()">×</button>
            </div>
            <div class="modal-body">
              <p>{{ 'admin.confirmDeleteCategory' | translate }} <strong>{{ deleteTarget()?.name }}</strong>?</p>
              <p class="warning-text">{{ 'admin.cannotUndo' | translate }}</p>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="closeDeleteModal()">{{ 'button.cancel' | translate }}</button>
              <button class="btn btn-danger" (click)="deleteCategory()">{{ 'button.delete' | translate }}</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .category-list-page {
      padding: 24px;
      max-width: 1400px;
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

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
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

    /* Categories Grid */
    .categories-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
    }

    .category-card {
      background: #fff;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      transition: box-shadow 0.2s;
    }

    .category-card:hover {
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    }

    .category-card.inactive {
      opacity: 0.7;
    }

    .card-header {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 12px;
    }

    .category-info {
      flex: 1;
      min-width: 0;
    }

    .category-info h3 {
      margin: 0 0 4px;
      font-size: 16px;
      font-weight: 600;
    }

    .slug {
      font-size: 12px;
      color: #666;
      font-family: monospace;
    }

    .status-indicator {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      background: #e6e6ea;
      color: #153243;
      white-space: nowrap;
      min-width: 70px;
      cursor: pointer;
      transition: all 0.2s;
      user-select: none;
    }

    .status-indicator:hover {
      transform: scale(1.05);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    }

    .status-indicator.active {
      background: #153243;
      color: #c3d350;
    }

    .status-indicator.active:hover {
      background: #0d1f29;
    }

    .description {
      font-size: 14px;
      color: #666;
      margin: 0 0 12px;
      line-height: 1.5;
    }

    .card-stats {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-top: 1px solid #f0f0f0;
      border-bottom: 1px solid #f0f0f0;
      margin-bottom: 12px;
    }

    .stat {
      display: flex;
      align-items: baseline;
      gap: 6px;
    }

    .stat-value {
      font-size: 20px;
      font-weight: 700;
      color: #153243;
    }

    .stat-label {
      font-size: 13px;
      color: #666;
    }

    .parent-info {
      font-size: 13px;
    }

    .parent-label {
      color: #999;
    }

    .parent-name {
      color: #153243;
      font-weight: 500;
    }

    .card-actions {
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
      font-size: 12px;
      font-weight: 600;
      transition: all 0.2s;
      white-space: nowrap;
      min-width: 60px;
    }

    .action-btn.edit {
      background: #e3f2fd;
      color: #1976d2;
      border-color: #e3f2fd;
    }

    .action-btn.edit:hover:not(:disabled) {
      background: #1976d2;
      color: #fff;
      border-color: #1976d2;
    }

    .action-btn.delete {
      background: #ffebee;
      color: #d32f2f;
      border-color: #ffebee;
    }

    .action-btn.delete:hover:not(:disabled) {
      background: #d32f2f;
      color: #fff;
      border-color: #d32f2f;
    }

    .action-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .empty-state {
      grid-column: 1 / -1;
      text-align: center;
      padding: 60px 20px;
      background: #fff;
      border-radius: 12px;
    }

    .empty-state p {
      color: #666;
      margin-bottom: 20px;
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
      max-width: 480px;
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

    .required {
      color: #dc3545;
    }

    .form-control {
      width: 100%;
      padding: 10px 14px;
      border: 1px solid #e6e6ea;
      border-radius: 8px;
      font-size: 14px;
      transition: all 0.2s;
    }

    .form-control:focus {
      outline: none;
      border-color: #153243;
      box-shadow: 0 0 0 3px rgba(21, 50, 67, 0.1);
    }

    .form-control.error {
      border-color: #dc3545;
    }

    .error-message {
      display: block;
      color: #dc3545;
      font-size: 12px;
      margin-top: 4px;
    }

    textarea.form-control {
      resize: vertical;
    }

    .checkbox-group {
      padding-top: 8px;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      font-size: 14px;
      line-height: 1.5;
    }

    .checkbox-label input {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
      cursor: pointer;
      margin: 0;
    }

    .checkbox-label span {
      user-select: none;
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
export class CategoryListComponent implements OnInit {
  adminService = inject(AdminService);
  private fb = inject(FormBuilder);
  private translate = inject(TranslateService);

  categories = computed(() => this.adminService.categories());

  showModal = signal(false);
  showDeleteModal = signal(false);
  isEditMode = false;
  editingCategoryId: string | null = null;
  deleteTarget = signal<AdminCategory | null>(null);

  categoryForm!: FormGroup;

  availableParents = computed(() => {
    const cats = this.categories();
    if (!this.editingCategoryId) return cats;
    return cats.filter(c => c._id !== this.editingCategoryId);
  });

  ngOnInit(): void {
    this.initForm();
    this.loadCategories();
  }

  initForm(): void {
    this.categoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(50)]],
      description: ['', Validators.maxLength(500)],
      icon: [''],
      parent: [''],
      active: [true]
    });
  }

  loadCategories(): void {
    this.adminService.loadCategories().subscribe();
  }

  openModal(): void {
    this.isEditMode = false;
    this.editingCategoryId = null;
    this.categoryForm.reset({
      name: '',
      description: '',
      icon: '',
      parent: '',
      active: true
    });
    this.showModal.set(true);
  }

  editCategory(category: AdminCategory): void {
    this.isEditMode = true;
    this.editingCategoryId = category._id;
    this.categoryForm.patchValue({
      name: category.name,
      description: category.description || '',
      icon: category.icon || '',
      parent: category.parent?._id || '',
      active: category.active
    });
    this.showModal.set(true);
  }

  toggleCategoryStatus(category: AdminCategory): void {
    const newStatus = !category.active;
    this.adminService.updateCategory(category._id, { active: newStatus }).subscribe({
      next: () => {
        this.loadCategories();
      },
      error: (err) => {
        console.error('Error toggling category status:', err);
        alert(err.error?.message || this.translate.instant('admin.cannotUpdateStatus'));
      }
    });
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingCategoryId = null;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.categoryForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  onSubmit(): void {
    if (this.categoryForm.invalid) {
      Object.keys(this.categoryForm.controls).forEach(key => {
        this.categoryForm.get(key)?.markAsTouched();
      });
      return;
    }

    const formValue = this.categoryForm.value;
    
    // Prepare category data - convert empty strings to undefined for proper backend handling
    const categoryData: CategoryFormData = {
      name: formValue.name.trim(),
      description: formValue.description?.trim() || undefined,
      icon: formValue.icon?.trim() || undefined,
      parent: formValue.parent && formValue.parent.trim() !== '' ? formValue.parent : undefined,
      active: formValue.active
    };

    if (this.isEditMode && this.editingCategoryId) {
      this.adminService.updateCategory(this.editingCategoryId, categoryData).subscribe({
        next: () => {
          this.closeModal();
          this.loadCategories();
        },
        error: (err) => {
          console.error('Error updating category:', err);
          alert(err.error?.message || this.translate.instant('admin.cannotUpdateCategory'));
        }
      });
    } else {
      this.adminService.createCategory(categoryData).subscribe({
        next: () => {
          this.closeModal();
          this.loadCategories();
        },
        error: (err) => {
          console.error('Error creating category:', err);
          alert(err.error?.message || this.translate.instant('admin.cannotCreateCategory'));
        }
      });
    }
  }

  confirmDelete(category: AdminCategory): void {
    this.deleteTarget.set(category);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.deleteTarget.set(null);
  }

  deleteCategory(): void {
    const category = this.deleteTarget();
    if (!category) return;

    this.adminService.deleteCategory(category._id).subscribe({
      next: () => {
        this.closeDeleteModal();
        this.loadCategories();
      },
      error: (err) => {
        console.error('Error deleting category:', err);
        alert(err.error?.message || this.translate.instant('admin.cannotDeleteCategoryWithProducts'));
      }
    });
  }
}
