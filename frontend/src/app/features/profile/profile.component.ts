import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService, UpdateProfileData, ChangePasswordData } from '@core/services/auth.service';
import { OrderService, Order } from '@core/services/order.service';
import { CartService } from '@core/services/cart.service';
import { TranslationService } from '@core/services/translation.service';
import { User } from '@models/index';

type ProfileTab = 'profile' | 'security' | 'orders';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslateModule],
  template: `
    <!-- Hero Section -->
    <div class="hero hero-small">
      <div class="container">
        <div class="row justify-content-center">
          <div class="col-lg-6 text-center">
            <div class="intro-excerpt">
              <h1>{{ 'account.profile' | translate }}</h1>
              <p class="mb-0">{{ 'profile.subtitle' | translate }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Profile Section -->
    <div class="untree_co-section profile-section">
      <div class="container">
        <div class="row">
          <!-- Sidebar -->
          <div class="col-lg-3 mb-4">
            <div class="profile-sidebar">
              <!-- User Info -->
              <div class="user-info">
                <div class="avatar">
                  <img *ngIf="user()?.avatar" [src]="user()?.avatar" [alt]="user()?.name">
                  <span *ngIf="!user()?.avatar" class="avatar-placeholder">
                    {{ getInitials() }}
                  </span>
                </div>
                <h4>{{ user()?.name }}</h4>
                <p>{{ user()?.email }}</p>
                <span class="auth-badge" [class.google]="user()?.authProvider === 'google'">
                  <i *ngIf="user()?.authProvider === 'google'" class="gi gi-admin-logo" aria-hidden="true"></i>
                  {{ user()?.authProvider === 'google' ? ('profile.googleAccount' | translate) : ('profile.emailAccount' | translate) }}
                </span>
              </div>

              <!-- Navigation -->
              <nav class="profile-nav">
                <button 
                  [class.active]="activeTab() === 'profile'" 
                  (click)="setTab('profile')"
                >
                  <i class="gi gi-admin-users" aria-hidden="true"></i>
                  {{ 'profile.tab.profileInfo' | translate }}
                </button>
                <button 
                  [class.active]="activeTab() === 'security'" 
                  (click)="setTab('security')"
                >
                  <i class="gi gi-lock" aria-hidden="true"></i>
                  {{ 'profile.tab.security' | translate }}
                </button>
                <button 
                  [class.active]="activeTab() === 'orders'" 
                  (click)="setTab('orders')"
                >
                  <i class="gi gi-cart-plus" aria-hidden="true"></i>
                  {{ 'profile.tab.orderHistory' | translate }}
                </button>
                <button class="logout-btn" (click)="logout()">
                  <i class="gi gi-ui-close" aria-hidden="true"></i>
                  {{ 'nav.logout' | translate }}
                </button>
              </nav>
            </div>
          </div>

          <!-- Content -->
          <div class="col-lg-9">
            <div class="profile-content">
              <!-- Profile Tab -->
              <div *ngIf="activeTab() === 'profile'" class="tab-content">
                <h3>{{ 'profile.profileInfoTitle' | translate }}</h3>
                <p class="tab-description">{{ 'profile.profileInfoDesc' | translate }}</p>

                <!-- Success Message -->
                <div class="alert alert-success" *ngIf="successMessage()">
                  <i class="gi gi-check-circle" aria-hidden="true"></i>
                  {{ successMessage() }}
                </div>

                <!-- Error Message -->
                <div class="alert alert-danger" *ngIf="errorMessage()">
                  <i class="gi gi-ui-alert" aria-hidden="true"></i>
                  {{ errorMessage() }}
                </div>

                <form (ngSubmit)="updateProfile()" #profileForm="ngForm">
                  <div class="form-row">
                    <div class="form-group col-md-6">
                      <label class="form-label">{{ 'form.fullName' | translate }}</label>
                      <input 
                        type="text" 
                        class="form-control"
                        name="name"
                        [(ngModel)]="profileData.name"
                        required
                        minlength="2"
                      >
                    </div>
                    <div class="form-group col-md-6">
                      <label class="form-label">{{ 'form.email' | translate }}</label>
                      <input 
                        type="email" 
                        class="form-control"
                        [value]="user()?.email"
                        disabled
                      >
                      <small class="text-muted">{{ 'profile.emailCannotChange' | translate }}</small>
                    </div>
                  </div>

                  <div class="form-row">
                    <div class="form-group col-md-6">
                      <label class="form-label">{{ 'form.phone' | translate }}</label>
                      <input 
                        type="tel" 
                        class="form-control"
                        name="phone"
                        [(ngModel)]="profileData.phone"
                        [placeholder]="'profile.phonePlaceholder' | translate"
                      >
                    </div>
                    <div class="form-group col-md-6">
                      <label class="form-label">{{ 'profile.avatarUrl' | translate }}</label>
                      <input 
                        type="url" 
                        class="form-control"
                        name="avatar"
                        [(ngModel)]="profileData.avatar"
                        [placeholder]="'profile.avatarPlaceholder' | translate"
                      >
                    </div>
                  </div>

                  <h4>{{ 'profile.shippingAddress' | translate }}</h4>
                  
                  <div class="form-group" *ngIf="profileData.address">
                    <label class="form-label">{{ 'form.streetAddress' | translate }}</label>
                    <input 
                      type="text" 
                      class="form-control"
                      name="street"
                      [(ngModel)]="profileData.address!.street"
                      [placeholder]="'form.streetPlaceholder' | translate"
                    >
                  </div>

                  <div class="form-row" *ngIf="profileData.address">
                    <div class="form-group col-md-6">
                      <label class="form-label">{{ 'form.city' | translate }}</label>
                      <input 
                        type="text" 
                        class="form-control"
                        name="city"
                        [(ngModel)]="profileData.address!.city"
                      >
                    </div>
                    <div class="form-group col-md-6">
                      <label class="form-label">{{ 'form.stateProvince' | translate }}</label>
                      <input 
                        type="text" 
                        class="form-control"
                        name="state"
                        [(ngModel)]="profileData.address!.state"
                      >
                    </div>
                  </div>

                  <div class="form-row" *ngIf="profileData.address">
                    <div class="form-group col-md-6">
                      <label class="form-label">{{ 'form.zipCode' | translate }}</label>
                      <input 
                        type="text" 
                        class="form-control"
                        name="zipCode"
                        [(ngModel)]="profileData.address!.zipCode"
                      >
                    </div>
                    <div class="form-group col-md-6">
                      <label class="form-label">{{ 'form.country' | translate }}</label>
                      <input 
                        type="text" 
                        class="form-control"
                        name="country"
                        [(ngModel)]="profileData.address!.country"
                      >
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    class="btn btn-primary"
                    [disabled]="profileForm.invalid || isLoading()"
                  >
                    <span *ngIf="!isLoading()">{{ 'profile.saveChanges' | translate }}</span>
                    <span *ngIf="isLoading()" class="btn-loading">
                      <span class="spinner"></span>
                      {{ 'profile.saving' | translate }}
                    </span>
                  </button>
                </form>
              </div>

              <!-- Security Tab -->
              <div *ngIf="activeTab() === 'security'" class="tab-content">
                <h3>{{ 'profile.securityTitle' | translate }}</h3>
                <p class="tab-description">{{ 'profile.securityDesc' | translate }}</p>

                <!-- OAuth Warning -->
                <div class="oauth-notice" *ngIf="user()?.authProvider === 'google'">
                  <i class="gi gi-info-circle" aria-hidden="true"></i>
                  <div>
                    <h5>{{ 'profile.googleLinkedTitle' | translate }}</h5>
                    <p>{{ 'profile.googleLinkedDesc' | translate }}</p>
                  </div>
                </div>

                <!-- Change Password Form -->
                <form 
                  *ngIf="user()?.authProvider !== 'google'"
                  (ngSubmit)="changePassword()" 
                  #passwordForm="ngForm"
                >
                  <!-- Success Message -->
                  <div class="alert alert-success" *ngIf="passwordSuccess()">
                    <i class="gi gi-check-circle" aria-hidden="true"></i>
                    {{ passwordSuccess() }}
                  </div>

                  <!-- Error Message -->
                  <div class="alert alert-danger" *ngIf="passwordError()">
                    <i class="gi gi-ui-alert" aria-hidden="true"></i>
                    {{ passwordError() }}
                  </div>

                  <div class="form-group">
                    <label class="form-label">{{ 'profile.currentPassword' | translate }}</label>
                    <input 
                      type="password" 
                      class="form-control"
                      name="currentPassword"
                      [(ngModel)]="passwordData.currentPassword"
                      required
                    >
                  </div>

                  <div class="form-group">
                    <label class="form-label">{{ 'profile.newPassword' | translate }}</label>
                    <input 
                      type="password" 
                      class="form-control"
                      name="newPassword"
                      [(ngModel)]="passwordData.newPassword"
                      required
                      minlength="6"
                    >
                    <small class="text-muted">{{ 'profile.minPasswordHint' | translate }}</small>
                  </div>

                  <div class="form-group">
                    <label class="form-label">{{ 'profile.confirmNewPassword' | translate }}</label>
                    <input 
                      type="password" 
                      class="form-control"
                      name="confirmPassword"
                      [(ngModel)]="passwordData.confirmPassword"
                      required
                    >
                    <div class="invalid-feedback" *ngIf="passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword">
                      {{ 'profile.passwordMismatch' | translate }}
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    class="btn btn-primary"
                    [disabled]="passwordForm.invalid || passwordData.newPassword !== passwordData.confirmPassword || isLoading()"
                  >
                    <span *ngIf="!isLoading()">{{ 'profile.updatePassword' | translate }}</span>
                    <span *ngIf="isLoading()" class="btn-loading">
                      <span class="spinner"></span>
                      {{ 'profile.updating' | translate }}
                    </span>
                  </button>
                </form>

                <!-- Account Info -->
                <div class="account-info">
                  <h4>{{ 'profile.accountInformation' | translate }}</h4>
                  <div class="info-grid">
                    <div class="info-item">
                      <span class="label">{{ 'profile.accountCreated' | translate }}</span>
                      <span class="value">{{ formatDate(user()?.createdAt) }}</span>
                    </div>
                    <div class="info-item">
                      <span class="label">{{ 'profile.emailVerified' | translate }}</span>
                      <span class="value" [class.verified]="user()?.isEmailVerified">
                        {{ user()?.isEmailVerified ? ('profile.yes' | translate) : ('profile.no' | translate) }}
                      </span>
                    </div>
                    <div class="info-item">
                      <span class="label">{{ 'profile.accountType' | translate }}</span>
                      <span class="value">{{ user()?.role === 'admin' ? ('profile.administrator' | translate) : ('profile.customer' | translate) }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Orders Tab -->
              <div *ngIf="activeTab() === 'orders'" class="tab-content">
                <h3>{{ 'profile.orderHistoryTitle' | translate }}</h3>
                <p class="tab-description">{{ 'profile.orderHistoryDesc' | translate }}</p>

                <!-- Loading State -->
                <div *ngIf="loadingOrders()" class="loading-state">
                  <div class="spinner-large"></div>
                  <p>{{ 'profile.loadingOrders' | translate }}</p>
                </div>

                <!-- Orders List -->
                <div *ngIf="!loadingOrders() && orders().length > 0" class="orders-list">
                  <div *ngFor="let order of orders()" class="order-card">
                    <!-- Order Header -->
                    <div class="order-header">
                      <div class="order-info">
                        <h5>{{ 'profile.order' | translate }} #{{ order._id.slice(-8).toUpperCase() }}</h5>
                        <span class="order-date">{{ formatDate(order.createdAt) }}</span>
                      </div>
                      <div class="order-badges">
                        <span class="status-badge" [class]="'status-' + order.status">
                          {{ formatStatus(order.status) }}
                        </span>
                        <span class="payment-badge" [class]="'payment-' + order.paymentStatus">
                          {{ formatPaymentStatus(order.paymentStatus) }}
                        </span>
                      </div>
                    </div>

                    <!-- Order Items -->
                    <div class="order-items">
                      <div *ngFor="let item of order.items" class="order-item">
                        <img 
                          [src]="item.product?.images?.[0] || 'assets/images/placeholder.jpg'" 
                          [alt]="item.product?.name"
                          class="item-image"
                        >
                        <div class="item-details">
                          <h6>{{ item.product?.name }}</h6>
                          <p class="item-meta">{{ 'profile.quantity' | translate }}: {{ item.quantity }} x \${{ item.price }}</p>
                        </div>
                        <div class="item-total">
                          \${{ (item.quantity * item.price).toFixed(2) }}
                        </div>
                      </div>
                    </div>

                    <!-- Order Summary -->
                    <div class="order-summary">
                      <div class="summary-row">
                        <span>{{ 'profile.totalAmount' | translate }}:</span>
                        <strong class="total-amount">\${{ order.totalAmount.toFixed(2) }}</strong>
                      </div>
                      <div class="summary-row" *ngIf="order.trackingNumber">
                        <span>{{ 'profile.trackingNumber' | translate }}:</span>
                        <strong class="tracking-number">{{ order.trackingNumber }}</strong>
                      </div>
                      <div class="summary-row" *ngIf="order.paymentMethod">
                        <span>{{ 'profile.paymentMethod' | translate }}:</span>
                        <span>{{ formatPaymentMethod(order.paymentMethod) }}</span>
                      </div>
                    </div>

                    <!-- Shipping Address -->
                    <div class="shipping-info">
                      <h6>{{ 'profile.shippingAddress' | translate }}</h6>
                      <p>
                        {{ order.shippingAddress.street }}<br>
                        {{ order.shippingAddress.city }}, {{ order.shippingAddress.state }} {{ order.shippingAddress.zipCode }}<br>
                        {{ order.shippingAddress.country }}
                      </p>
                    </div>

                    <!-- Order Actions -->
                    <div class="order-actions">
                      <button 
                        class="btn-view-details" 
                        (click)="viewOrderDetails(order._id)"
                      >
                        <i class="gi gi-info-circle" aria-hidden="true"></i>
                        {{ 'profile.viewDetails' | translate }}
                      </button>
                      <button 
                        *ngIf="order.status === 'pending' || order.status === 'pending_manual_payment' || order.status === 'processing'" 
                        class="btn-cancel-order"
                        (click)="cancelOrder(order._id)"
                        [disabled]="cancellingOrder() === order._id"
                      >
                        <i class="gi gi-ui-close" aria-hidden="true"></i>
                        {{ cancellingOrder() === order._id ? ('profile.cancelling' | translate) : ('profile.cancelOrder' | translate) }}
                      </button>
                      <button
                        *ngIf="order.status === 'cancelled'"
                        class="btn-reorder-order"
                        (click)="reorderOrder(order)"
                        [disabled]="reorderingOrder() === order._id"
                      >
                        <i class="gi gi-cart-plus" aria-hidden="true"></i>
                        {{ reorderingOrder() === order._id ? 'Đang đặt lại...' : 'Đặt lại' }}
                      </button>
                    </div>
                  </div>

                  <!-- Pagination -->
                  <div *ngIf="orderPagination() && orderPagination()!.pages > 1" class="pagination">
                    <button 
                      class="pagination-btn"
                      [disabled]="orderPagination()!.page === 1"
                      (click)="loadOrders(orderPagination()!.page - 1)"
                    >
                      {{ 'profile.previous' | translate }}
                    </button>
                    <span class="pagination-info">
                      {{ 'profile.page' | translate }} {{ orderPagination()!.page }} {{ 'profile.of' | translate }} {{ orderPagination()!.pages }}
                    </span>
                    <button 
                      class="pagination-btn"
                      [disabled]="orderPagination()!.page === orderPagination()!.pages"
                      (click)="loadOrders(orderPagination()!.page + 1)"
                    >
                      {{ 'profile.next' | translate }}
                    </button>
                  </div>
                </div>

                <!-- Empty State -->
                <div *ngIf="!loadingOrders() && orders().length === 0" class="empty-state">
                  <i class="gi gi-cart-plus" aria-hidden="true"></i>
                  <h4>{{ 'profile.noOrdersYet' | translate }}</h4>
                  <p>{{ 'profile.noOrdersDesc' | translate }}</p>
                  <a routerLink="/shop" class="btn btn-primary">{{ 'profile.startShopping' | translate }}</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Hero Small */
    .hero-small {
      padding: 4rem 0 2rem;
    }

    .hero-small .intro-excerpt h1 {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
    }

    /* Profile Section */
    .profile-section {
      padding: 3rem 0 7rem;
    }

    /* Sidebar */
    .profile-sidebar {
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
      overflow: hidden;
    }

    .user-info {
      padding: 2rem;
      text-align: center;
      background: linear-gradient(135deg, #153243 0%, #284b63 100%);
      color: white;
    }

    .avatar {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      margin: 0 auto 1rem;
      overflow: hidden;
      background: rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .avatar-placeholder {
      font-size: 1.5rem;
      font-weight: 600;
    }

    .user-info h4 {
      margin: 0 0 0.25rem;
      font-size: 1.25rem;
    }

    .user-info p {
      margin: 0 0 0.75rem;
      opacity: 0.9;
      font-size: 0.9rem;
    }

    .auth-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      background: rgba(255, 255, 255, 0.2);
      padding: 0.35rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .auth-badge i {
      font-size: 14px;
      width: 14px;
      height: 14px;
      display: inline-flex;
    }

    .auth-badge.google {
      background: rgba(255, 255, 255, 0.3);
    }

    /* Profile Navigation */
    .profile-nav {
      padding: 1rem 0;
    }

    .profile-nav button {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      width: 100%;
      padding: 1rem 1.5rem;
      border: none;
      background: none;
      text-align: left;
      font-size: 0.95rem;
      color: #6c757d;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .profile-nav button i {
      font-size: 18px;
      width: 18px;
      height: 18px;
      display: inline-flex;
      flex-shrink: 0;
    }

    .profile-nav button:hover {
      background: #f8f9fa;
      color: #153243;
    }

    .profile-nav button.active {
      background: #e8f4f8;
      color: #153243;
      font-weight: 500;
      border-left: 3px solid #153243;
    }

    .profile-nav .logout-btn {
      color: #dc3545;
      border-top: 1px solid #e9ecef;
      margin-top: 0.5rem;
    }

    .profile-nav .logout-btn:hover {
      background: #fef5f5;
      color: #dc3545;
    }

    /* Profile Content */
    .profile-content {
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
      padding: 2rem;
    }

    .tab-content h3 {
      margin: 0 0 0.5rem;
      font-size: 1.5rem;
      color: #2f2f2f;
    }

    .tab-description {
      color: #6c757d;
      margin-bottom: 2rem;
    }

    .tab-content h4 {
      margin: 2rem 0 1rem;
      font-size: 1.1rem;
      color: #2f2f2f;
    }

    /* Form Styles */
    .form-row {
      display: flex;
      gap: 1rem;
      margin-bottom: 0;
    }

    .form-row .form-group {
      flex: 1;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-label {
      display: block;
      font-weight: 600;
      color: #2f2f2f;
      margin-bottom: 0.5rem;
      font-size: 0.9rem;
    }

    .form-control {
      height: 48px;
      border: 2px solid #e9ecef;
      border-radius: 10px;
      font-size: 1rem;
      padding: 0 1rem;
      transition: all 0.3s ease;
    }

    .form-control:focus {
      border-color: #153243;
      box-shadow: 0 0 0 4px rgba(21, 50, 67, 0.1);
      outline: none;
    }

    .form-control:disabled {
      background: #f8f9fa;
      cursor: not-allowed;
    }

    .text-muted {
      font-size: 0.8rem;
      color: #9ca3af;
      margin-top: 0.25rem;
    }

    /* Alert */
    .alert {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      border-radius: 10px;
      margin-bottom: 1.5rem;
      font-size: 0.9rem;
    }

    .alert-success {
      background: #d1fae5;
      color: #065f46;
      border: 1px solid #a7f3d0;
    }

    .alert-danger {
      background: #fee2e2;
      color: #dc2626;
      border: 1px solid #fecaca;
    }

    /* OAuth Notice */
    .oauth-notice {
      display: flex;
      gap: 1rem;
      padding: 1.5rem;
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      border-radius: 10px;
      margin-bottom: 2rem;
      color: #0369a1;
    }

    .oauth-notice i {
      font-size: 24px;
      width: 24px;
      height: 24px;
      display: inline-flex;
      flex-shrink: 0;
    }

    .oauth-notice h5 {
      margin: 0 0 0.25rem;
      font-size: 1rem;
    }

    .oauth-notice p {
      margin: 0;
      font-size: 0.9rem;
      opacity: 0.8;
    }

    /* Account Info */
    .account-info {
      margin-top: 3rem;
      padding-top: 2rem;
      border-top: 1px solid #e9ecef;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1.5rem;
      margin-top: 1rem;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .info-item .label {
      font-size: 0.85rem;
      color: #6c757d;
    }

    .info-item .value {
      font-weight: 600;
      color: #2f2f2f;
    }

    .info-item .value.verified {
      color: #10b981;
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 3rem;
      color: #6c757d;
    }

    .empty-state svg,
    .empty-state i {
      margin-bottom: 1.5rem;
      opacity: 0.3;
    }

    .empty-state i {
      font-size: 64px;
      width: 64px;
      height: 64px;
      display: inline-flex;
    }

    .empty-state h4 {
      margin: 0 0 0.5rem;
      color: #2f2f2f;
    }

    .empty-state p {
      margin: 0 0 1.5rem;
    }

    /* Buttons */
    .btn-primary {
      background: #153243;
      color: white;
      border: none;
      height: 48px;
      padding: 0 2rem;
      font-weight: 600;
      font-size: 0.95rem;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn-primary:hover:not(:disabled) {
      background: #0d1f29;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(21, 50, 67, 0.3);
    }

    .btn-primary:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .btn-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .spinner {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .invalid-feedback {
      display: block;
      color: #dc3545;
      font-size: 0.85rem;
      margin-top: 0.5rem;
    }

    /* Orders List */
    .loading-state {
      text-align: center;
      padding: 3rem;
      color: #6c757d;
    }

    .spinner-large {
      width: 48px;
      height: 48px;
      border: 4px solid #e9ecef;
      border-top-color: #153243;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 1rem;
    }

    .orders-list {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .order-card {
      background: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 12px;
      padding: 1.5rem;
      transition: all 0.3s ease;
    }

    .order-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .order-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #dee2e6;
    }

    .order-info h5 {
      margin: 0 0 0.25rem;
      font-size: 1.1rem;
      color: #2f2f2f;
    }

    .order-date {
      font-size: 0.85rem;
      color: #6c757d;
    }

    .order-badges {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      justify-content: flex-end;
    }

    .status-badge,
    .payment-badge {
      padding: 0.4rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .status-badge.status-pending {
      background: #fef3c7;
      color: #92400e;
    }

    .status-badge.status-processing {
      background: #dbeafe;
      color: #1e40af;
    }

    .status-badge.status-shipped {
      background: #e0e7ff;
      color: #4338ca;
    }

    .status-badge.status-delivered {
      background: #d1fae5;
      color: #065f46;
    }

    .status-badge.status-cancelled {
      background: #fee2e2;
      color: #991b1b;
    }

    .payment-badge.payment-pending {
      background: #fef3c7;
      color: #92400e;
    }

    .payment-badge.payment-paid {
      background: #d1fae5;
      color: #065f46;
    }

    .payment-badge.payment-failed {
      background: #fee2e2;
      color: #991b1b;
    }

    .payment-badge.payment-refunded {
      background: #e5e7eb;
      color: #374151;
    }

    .order-items {
      margin-bottom: 1rem;
    }

    .order-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem;
      background: white;
      border-radius: 8px;
      margin-bottom: 0.5rem;
    }

    .item-image {
      width: 60px;
      height: 60px;
      object-fit: cover;
      border-radius: 6px;
      flex-shrink: 0;
    }

    .item-details {
      flex: 1;
    }

    .item-details h6 {
      margin: 0 0 0.25rem;
      font-size: 0.95rem;
      color: #2f2f2f;
    }

    .item-meta {
      margin: 0;
      font-size: 0.85rem;
      color: #6c757d;
    }

    .item-total {
      font-weight: 600;
      color: #153243;
      font-size: 1rem;
    }

    .order-summary {
      background: white;
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1rem;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0;
      font-size: 0.9rem;
    }

    .summary-row:not(:last-child) {
      border-bottom: 1px solid #f3f4f6;
    }

    .total-amount {
      font-size: 1.25rem;
      color: #153243;
    }

    .tracking-number {
      font-family: monospace;
      color: #153243;
    }

    .shipping-info {
      background: white;
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1rem;
    }

    .shipping-info h6 {
      margin: 0 0 0.5rem;
      font-size: 0.9rem;
      color: #6c757d;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .shipping-info p {
      margin: 0;
      font-size: 0.9rem;
      color: #2f2f2f;
      line-height: 1.6;
    }

    .order-actions {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .btn-view-details,
    .btn-cancel-order,
    .btn-track-order,
    .btn-reorder-order {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.6rem 1.25rem;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-view-details i,
    .btn-cancel-order i,
    .btn-track-order i,
    .btn-reorder-order i {
      font-size: 16px;
      width: 16px;
      height: 16px;
      display: inline-flex;
    }

    .btn-view-details {
      background: #153243;
      color: white;
      border: none;
    }

    .btn-view-details:hover {
      background: #0d1f29;
      transform: translateY(-1px);
    }

    .btn-cancel-order {
      background: white;
      color: #dc3545;
      border: 1px solid #dc3545;
    }

    .btn-cancel-order:hover:not(:disabled) {
      background: #dc3545;
      color: white;
    }

    .btn-cancel-order:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-reorder-order {
      background: white;
      color: #153243;
      border: 1px solid #153243;
    }

    .btn-reorder-order:hover:not(:disabled) {
      background: #153243;
      color: white;
    }

    .btn-reorder-order:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-track-order {
      background: white;
      color: #153243;
      border: 1px solid #153243;
    }

    .btn-track-order:hover {
      background: #153243;
      color: white;
    }

    /* Pagination */
    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid #e9ecef;
    }

    .pagination-btn {
      padding: 0.6rem 1.5rem;
      background: white;
      color: #153243;
      border: 1px solid #153243;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .pagination-btn:hover:not(:disabled) {
      background: #153243;
      color: white;
    }

    .pagination-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      border-color: #e9ecef;
      color: #9ca3af;
    }

    .pagination-info {
      font-size: 0.9rem;
      color: #6c757d;
    }

    /* Responsive */
    @media (max-width: 991px) {
      .profile-sidebar {
        margin-bottom: 2rem;
      }
    }

    @media (max-width: 576px) {
      .form-row {
        flex-direction: column;
        gap: 0;
      }

      .profile-content {
        padding: 1.5rem;
      }

      .order-header {
        flex-direction: column;
        gap: 1rem;
      }

      .order-badges {
        justify-content: flex-start;
      }

      .order-item {
        flex-direction: column;
        align-items: flex-start;
        text-align: left;
      }

      .item-image {
        width: 100%;
        height: 150px;
      }

      .order-actions {
        flex-direction: column;
      }

      .order-actions button,
      .order-actions a {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private orderService = inject(OrderService);
  private cartService = inject(CartService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private translationService = inject(TranslationService);

  user = signal<User | null>(null);
  activeTab = signal<ProfileTab>('profile');
  isLoading = signal(false);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);
  passwordSuccess = signal<string | null>(null);
  passwordError = signal<string | null>(null);
  
  // Order-related signals
  orders = signal<Order[]>([]);
  loadingOrders = signal(false);
  cancellingOrder = signal<string | null>(null);
  reorderingOrder = signal<string | null>(null);
  orderPagination = signal<{ page: number; limit: number; total: number; pages: number } | null>(null);

  profileData: UpdateProfileData = {
    name: '',
    phone: '',
    avatar: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    }
  };

  passwordData: ChangePasswordData & { confirmPassword: string } = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      const tab = params.get('tab');
      const resolvedTab: ProfileTab = tab === 'orders' || tab === 'security' || tab === 'profile'
        ? tab
        : 'profile';

      this.activeTab.set(resolvedTab);

      if (resolvedTab === 'orders' && this.orders().length === 0) {
        this.loadOrders();
      }
    });

    this.authService.currentUser$.subscribe(user => {
      this.user.set(user);
      if (user) {
        this.profileData = {
          name: user.name,
          phone: user.phone || '',
          avatar: user.avatar || '',
          address: {
            street: user.address?.street || '',
            city: user.address?.city || '',
            state: user.address?.state || '',
            zipCode: user.address?.zipCode || '',
            country: user.address?.country || ''
          }
        };
      }
    });
  }

  getInitials(): string {
    const name = this.user()?.name || '';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  setTab(tab: ProfileTab): void {
    this.activeTab.set(tab);
    this.clearMessages();

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
    
    // Load orders when switching to orders tab
    if (tab === 'orders' && this.orders().length === 0) {
      this.loadOrders();
    }
  }

  loadOrders(page: number = 1): void {
    this.loadingOrders.set(true);
    
    this.orderService.getUserOrders(page, 10).subscribe({
      next: (response: any) => {
        this.loadingOrders.set(false);
        if (response.success && response.data) {
          this.orders.set(response.data);
          if (response.pagination) {
            this.orderPagination.set(response.pagination);
          }
        }
      },
      error: (err) => {
        this.loadingOrders.set(false);
        console.error('Failed to load orders:', err);
      }
    });
  }

  clearMessages(): void {
    this.successMessage.set(null);
    this.errorMessage.set(null);
    this.passwordSuccess.set(null);
    this.passwordError.set(null);
  }

  updateProfile(): void {
    this.isLoading.set(true);
    this.clearMessages();

    this.authService.updateProfile(this.profileData).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        if (response.success) {
          this.successMessage.set(this.translationService.translate('profile.profileUpdatedSuccess'));
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.error || this.translationService.translate('profile.profileUpdateFailed'));
      }
    });
  }


  changePassword(): void {
    if (this.passwordData.newPassword !== this.passwordData.confirmPassword) {
      this.passwordError.set(this.translationService.translate('profile.passwordMismatch'));
      return;
    }

    this.isLoading.set(true);
    this.clearMessages();

    this.authService.changePassword({
      currentPassword: this.passwordData.currentPassword,
      newPassword: this.passwordData.newPassword
    }).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        if (response.success) {
          this.passwordSuccess.set(this.translationService.translate('profile.passwordChangedSuccess'));
          this.passwordData = {
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          };
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.passwordError.set(err.error?.error || this.translationService.translate('profile.passwordChangeFailed'));
      }
    });
  }

  formatDate(dateString?: string | Date): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatStatus(status: string): string {
    const statusMap: Record<string, string> = {
      pending: this.translationService.translate('order.statusPending'),
      processing: this.translationService.translate('order.statusProcessing'),
      shipped: this.translationService.translate('order.statusShipped'),
      delivered: this.translationService.translate('order.statusDelivered'),
      cancelled: this.translationService.translate('order.statusCancelled')
    };
    return statusMap[status] || status;
  }

  formatPaymentStatus(status: string): string {
    const statusMap: Record<string, string> = {
      pending: this.translationService.translate('order.paymentPending'),
      paid: this.translationService.translate('order.paymentPaid'),
      failed: this.translationService.translate('order.paymentFailed'),
      refunded: this.translationService.translate('order.paymentRefunded')
    };
    return statusMap[status] || status;
  }

  formatPaymentMethod(method: string): string {
    const methodMap: Record<string, string> = {
      momo: this.translationService.translate('checkout.momo'),
      bank_transfer: this.translationService.translate('checkout.bankTransfer'),
      cod: this.translationService.translate('checkout.cod'),
      card: this.translationService.translate('checkout.cardDetails')
    };
    return methodMap[method] || method;
  }

  viewOrderDetails(orderId: string): void {
    // Navigate to order details page (you can implement this later)
    this.router.navigate(['/orders', orderId]);
  }

  cancelOrder(orderId: string): void {
    if (!confirm(this.translationService.translate('profile.cancelOrderConfirm'))) {
      return;
    }

    this.cancellingOrder.set(orderId);
    
    this.orderService.cancelOrder(orderId).subscribe({
      next: (response) => {
        this.cancellingOrder.set(null);
        if (response.success) {
          this.cartService.clearCart();
          // Reload orders to show updated status
          this.loadOrders(this.orderPagination()?.page || 1);
          alert(this.translationService.translate('profile.cancelOrderSuccess'));
        }
      },
      error: (err) => {
        this.cancellingOrder.set(null);
        alert(err.error?.error || this.translationService.translate('profile.cancelOrderFailed'));
      }
    });
  }

  reorderOrder(order: Order): void {
    this.reorderingOrder.set(order._id);

    try {
      this.cartService.clearCart();

      for (const item of order.items) {
        if (item.product?._id && item.quantity > 0) {
          this.cartService.addItem(item.product, item.quantity);
        }
      }

      this.router.navigate(['/checkout']);
    } finally {
      this.reorderingOrder.set(null);
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
