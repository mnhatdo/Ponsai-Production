import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import * as L from 'leaflet';
import 'leaflet-routing-machine';
import { OrderService, Order } from '@core/services/order.service';
import { CartService } from '@core/services/cart.service';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <!-- Hero Section -->
    <div class="hero hero-small">
      <div class="container">
        <div class="row justify-content-center">
          <div class="col-lg-8 text-center">
            <div class="intro-excerpt">
              <h1>Order Details</h1>
              <p class="mb-0" *ngIf="order()">
                Order #{{ order()!._id.slice(-8).toUpperCase() }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Order Detail Section -->
    <div class="untree_co-section order-detail-section">
      <div class="container">
        <!-- Loading State -->
        <div *ngIf="loading()" class="loading-state">
          <div class="spinner-large"></div>
          <p>Loading order details...</p>
        </div>

        <!-- Error State -->
        <div *ngIf="error()" class="error-state">
          <i class="bi bi-exclamation-circle error-state-icon" aria-hidden="true"></i>
          <h4>{{ error() }}</h4>
          <a routerLink="/profile" class="btn btn-primary">Back to Profile</a>
        </div>

        <!-- Order Content -->
        <div *ngIf="!loading() && !error() && order()" class="row">
          <div class="col-lg-8">
            <!-- Order Status -->
            <div class="detail-card">
              <div class="card-header">
                <h3>Order Status</h3>
              </div>
              <div class="card-body">
                <div class="status-timeline">
                  <div class="timeline-item" [class.active]="true">
                    <div class="timeline-icon">
                      <i class="bi bi-check-circle-fill" aria-hidden="true"></i>
                    </div>
                    <div class="timeline-content">
                      <h5>Order Placed</h5>
                      <p>{{ formatDate(order()!.createdAt) }}</p>
                    </div>
                  </div>

                  <div class="timeline-item" [class.active]="['processing', 'shipped', 'delivered'].includes(order()!.status)">
                    <div class="timeline-icon">
                      <i class="bi bi-admin-settings" aria-hidden="true"></i>
                    </div>
                    <div class="timeline-content">
                      <h5>Processing</h5>
                      <p>Your order is being prepared</p>
                    </div>
                  </div>

                  <div class="timeline-item" [class.active]="['shipped', 'delivered'].includes(order()!.status)">
                    <div class="timeline-icon">
                      <i class="bi bi-truck" aria-hidden="true"></i>
                    </div>
                    <div class="timeline-content">
                      <h5>Shipped</h5>
                      <p *ngIf="order()!.trackingNumber">Tracking: {{ order()!.trackingNumber }}</p>
                      <p *ngIf="!order()!.trackingNumber">Awaiting shipment</p>
                    </div>
                  </div>

                  <div class="timeline-item" [class.active]="order()!.status === 'delivered'">
                    <div class="timeline-icon">
                      <i class="bi bi-check-circle" aria-hidden="true"></i>
                    </div>
                    <div class="timeline-content">
                      <h5>Delivered</h5>
                      <p>Order completed</p>
                    </div>
                  </div>
                </div>

                <div class="status-badges">
                  <span class="status-badge" [class]="'status-' + order()!.status">
                    {{ formatStatus(order()!.status) }}
                  </span>
                  <span class="payment-badge" [class]="'payment-' + order()!.paymentStatus">
                    {{ formatPaymentStatus(order()!.paymentStatus) }}
                  </span>
                </div>
              </div>
            </div>



            <!-- Order Items -->
            <div class="detail-card">
              <div class="card-header">
                <h3>Order Items</h3>
              </div>
              <div class="card-body">
                <div class="order-items">
                  <div *ngFor="let item of order()!.items" class="order-item">
                    <img 
                      [src]="item.product?.images?.[0] || 'assets/images/placeholder.jpg'" 
                      [alt]="item.product?.name"
                      class="item-image"
                    >
                    <div class="item-details">
                      <h5>{{ item.product?.name }}</h5>
                      <p class="item-description">{{ item.product?.description?.substring(0, 100) }}...</p>
                      <div class="item-meta">
                        <span class="item-price">\${{ item.price }} × {{ item.quantity }}</span>
                      </div>
                    </div>
                    <div class="item-total">
                      <strong>\${{ (item.quantity * item.price).toFixed(2) }}</strong>
                    </div>
                  </div>
                </div>

                <div class="order-total">
                  <div class="total-row">
                    <span>Subtotal</span>
                    <span>\${{ order()!.totalAmount.toFixed(2) }}</span>
                  </div>
                  <div class="total-row">
                    <span>Shipping</span>
                    <span>Free</span>
                  </div>
                  <div class="total-row grand-total">
                    <strong>Total</strong>
                    <strong>\${{ order()!.totalAmount.toFixed(2) }}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="col-lg-4">
            <!-- Shipping Information -->
            <div class="detail-card">
              <div class="card-header">
                <h3>Shipping Address</h3>
              </div>
              <div class="card-body">
                <p class="address">
                  {{ order()!.shippingAddress.street }}<br>
                  {{ order()!.shippingAddress.city }}, {{ order()!.shippingAddress.state }}<br>
                  {{ order()!.shippingAddress.zipCode }}<br>
                  {{ order()!.shippingAddress.country }}
                </p>
              </div>
            </div>

            <!-- Payment Information -->
            <div class="detail-card">
              <div class="card-header">
                <h3>Payment</h3>
              </div>
              <div class="card-body">
                <div class="info-row">
                  <span class="label">Method:</span>
                  <span class="value">{{ formatPaymentMethod(order()!.paymentMethod || 'N/A') }}</span>
                </div>
                <div class="info-row" *ngIf="order()!.paymentDetails?.transactionId">
                  <span class="label">Transaction ID:</span>
                  <span class="value mono">{{ order()!.paymentDetails!.transactionId }}</span>
                </div>
                <div class="info-row" *ngIf="order()!.paymentDetails?.paidAt">
                  <span class="label">Paid At:</span>
                  <span class="value">{{ formatDate(order()!.paymentDetails!.paidAt) }}</span>
                </div>
              </div>
            </div>

            <!-- Order Actions -->
            <div class="detail-card">
              <div class="card-header">
                <h3>Actions</h3>
              </div>
              <div class="card-body">
                <button 
                  *ngIf="['shipped', 'delivered'].includes(order()!.status)"
                  class="btn btn-success btn-block mb-2"
                  (click)="openMapModal()"
                >
                  <i class="bi bi-crosshair me-2" aria-hidden="true"></i>
                  Kiểm tra vị trí đơn hàng
                </button>
                <button 
                  *ngIf="order()!.status === 'pending' || order()!.status === 'processing'" 
                  class="btn btn-danger btn-block"
                  (click)="cancelOrder()"
                  [disabled]="cancelling()"
                >
                  <span *ngIf="!cancelling()">Cancel Order</span>
                  <span *ngIf="cancelling()">Cancelling...</span>
                </button>
                <a routerLink="/shop" class="btn btn-outline btn-block">
                  Back to Products
                </a>
              </div>
            </div>

            <!-- Order Notes -->
            <div class="detail-card" *ngIf="order()!.notes">
              <div class="card-header">
                <h3>Notes</h3>
              </div>
              <div class="card-body">
                <p>{{ order()!.notes }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Map Modal -->
    <div class="map-modal" *ngIf="showMapModal()" (click)="closeMapModal()">
      <div class="map-modal-content" (click)="$event.stopPropagation()">
        <div class="map-modal-header">
          <h3>
            <i class="bi bi-geo-alt-fill me-2" aria-hidden="true"></i>
            Vị trí đơn hàng - Theo dõi giao hàng
          </h3>
          <button class="close-btn" (click)="closeMapModal()" type="button">
            <i class="bi bi-x-lg" aria-hidden="true"></i>
          </button>
        </div>
        <div class="map-modal-body">
          <div class="delivery-info-box mb-3">
            <div class="info-row">
              <i class="bi bi-geo-alt-fill text-success" aria-hidden="true"></i>
              <div>
                <strong>Địa chỉ giao hàng</strong>
                <p class="mb-0">{{ order()!.shippingAddress.street }}, {{ order()!.shippingAddress.city }}, {{ order()!.shippingAddress.country }}</p>
              </div>
            </div>
          </div>
          <div id="modalDeliveryMap" class="modal-delivery-map"></div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Color variables are from src/assets/styles/_colors.scss (:root) */
    .hero-small {
      padding: 4rem 0 2rem;
    }

    .order-detail-section {
      padding: 3rem 0 7rem;
    }

    .loading-state,
    .error-state {
      text-align: center;
      padding: 5rem 2rem;
      color: #6c757d;
    }

    .spinner-large {
      width: 48px;
      height: 48px;
      border: 4px solid #e9ecef;
      border-top-color: var(--deep-space-blue);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .error-state-icon {
      font-size: 64px;
      margin-bottom: 1.5rem;
      color: #dc3545;
    }

    .detail-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
      margin-bottom: 1.5rem;
      overflow: hidden;
    }

    .card-header {
      padding: 1.5rem;
      background: var(--deep-space-blue-rgb);
      border-bottom: 1px solid #e9ecef;
    }

    .card-header h3 {
      margin: 0;
      font-size: 1.25rem;
      color: #ffffff;
    }

    .card-body {
      padding: 1.5rem;
    }

    .status-timeline {
      margin-bottom: 1.5rem;
    }

    .timeline-item {
      display: flex;
      gap: 1rem;
      padding: 1rem 0;
      position: relative;
      opacity: 0.4;
    }

    .timeline-item.active {
      opacity: 1;
    }

    .timeline-item:not(:last-child)::before {
      content: '';
      position: absolute;
      left: 20px;
      top: 50px;
      width: 2px;
      height: calc(100% - 20px);
      background: #e9ecef;
    }

    .timeline-item.active:not(:last-child)::before {
      background: var(--deep-space-blue);
    }

    .timeline-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #e9ecef;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      position: relative;
      z-index: 1;
    }

    .timeline-item.active .timeline-icon {
      background: var(--deep-space-blue);
      color: white;
    }

    .timeline-icon i {
      font-size: 20px;
    }

    .timeline-content h5 {
      margin: 0 0 0.25rem;
      font-size: 1rem;
      color: #2f2f2f;
    }

    .timeline-content p {
      margin: 0;
      font-size: 0.85rem;
      color: #6c757d;
    }

    .status-badges {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .status-badge,
    .payment-badge {
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .status-badge.status-pending { background: #fef3c7; color: #92400e; }
    .status-badge.status-processing { background: #dbeafe; color: #1e40af; }
    .status-badge.status-shipped { background: #e0e7ff; color: #4338ca; }
    .status-badge.status-delivered { background: #d1fae5; color: #065f46; }
    .status-badge.status-cancelled { background: #fee2e2; color: #991b1b; }

    .payment-badge.payment-pending { background: #fef3c7; color: #92400e; }
    .payment-badge.payment-paid { background: #d1fae5; color: #065f46; }
    .payment-badge.payment-failed { background: #fee2e2; color: #991b1b; }

    .order-items {
      margin-bottom: 1.5rem;
    }

    .order-item {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 12px;
      margin-bottom: 1rem;
    }

    .item-image {
      width: 100px;
      height: 100px;
      object-fit: cover;
      border-radius: 8px;
      flex-shrink: 0;
    }

    .item-details {
      flex: 1;
    }

    .item-details h5 {
      margin: 0 0 0.5rem;
      font-size: 1.1rem;
      color: #2f2f2f;
    }

    .item-description {
      margin: 0 0 0.5rem;
      font-size: 0.85rem;
      color: #6c757d;
      line-height: 1.5;
    }

    .item-meta {
      font-size: 0.9rem;
      color: #6c757d;
    }

    .item-price {
      font-weight: 600;
      color: #2f2f2f;
    }

    .item-total {
      font-size: 1.1rem;
      color: var(--deep-space-blue);
      display: flex;
      align-items: center;
    }

    .order-total {
      padding-top: 1rem;
      border-top: 1px solid #e9ecef;
    }

    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      font-size: 0.95rem;
    }

    .total-row.grand-total {
      font-size: 1.25rem;
      color: var(--deep-space-blue);
      border-top: 2px solid #e9ecef;
      margin-top: 0.5rem;
      padding-top: 1rem;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 0.75rem 0;
      border-bottom: 1px solid #f3f4f6;
      font-size: 0.9rem;
    }

    .info-row:last-child {
      border-bottom: none;
    }

    .label {
      color: #6c757d;
    }

    .value {
      color: #2f2f2f;
      font-weight: 600;
    }

    .value.mono {
      font-family: monospace;
      font-size: 0.85rem;
    }

    .address {
      line-height: 1.8;
      color: #2f2f2f;
      margin: 0;
    }

    .btn {
      width: 100%;
      padding: 0.75rem 1.5rem;
      border-radius: 10px;
      font-weight: 600;
      font-size: 0.95rem;
      cursor: pointer;
      transition: all 0.3s ease;
      border: none;
      text-decoration: none;
      display: inline-block;
      text-align: center;
    }

    .btn-primary {
      background: var(--deep-space-blue);
      color: white;
    }

    .btn-primary:hover {
      background: var(--yale-blue);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(21, 50, 67, 0.3);
    }

    .btn-danger {
      background: #dc3545;
      color: white;
    }

    .btn-danger:hover:not(:disabled) {
      background: #c82333;
    }

    .btn-outline {
      background: white;
      color: var(--deep-space-blue);
      border: 2px solid var(--deep-space-blue);
    }

    .btn-outline:hover {
      background: var(--deep-space-blue);
      color: white;
    }

    .btn-block {
      margin-bottom: 0.75rem;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    @media (max-width: 991px) {
      .col-lg-4 {
        margin-top: 0;
      }
    }

    @media (max-width: 576px) {
      .order-item {
        flex-direction: column;
      }

      .item-image {
        width: 100%;
        height: 200px;
      }
    }

    .map-modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.75);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      padding: 20px;
      animation: fadeIn 0.2s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .map-modal-content {
      background: white;
      border-radius: 16px;
      width: 100%;
      max-width: 900px;
      max-height: 90vh;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      animation: slideUp 0.3s ease-out;
    }

    @keyframes slideUp {
      from {
        transform: translateY(50px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .map-modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.5rem;
      background: #f8f9fa;
      border-bottom: 1px solid #e9ecef;
    }

    .map-modal-header h3 {
      margin: 0;
      font-size: 1.25rem;
      color: #2f2f2f;
      display: flex;
      align-items: center;
    }

    .close-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 8px;
      color: #6c757d;
      transition: all 0.2s;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .close-btn:hover {
      background: #e9ecef;
      color: #2f2f2f;
    }

    .map-modal-body {
      padding: 1.5rem;
      overflow-y: auto;
      max-height: calc(90vh - 120px);
    }

    .modal-delivery-map {
      width: 100%;
      height: 500px;
      background: #f0f0f0;
      border-radius: 8px;
      overflow: hidden;
    }

    .delivery-info-box {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 16px;
    }

    .delivery-info-box .info-row {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      justify-content: flex-start;
      padding: 0;
      border-bottom: none;
      width: 100%;
    }

    .delivery-info-box .info-row > div {
      flex: 1;
      min-width: 0;
    }

    .delivery-info-box i {
      flex-shrink: 0;
      margin-top: 2px;
      font-size: 24px;
    }

    .delivery-info-box strong {
      display: block;
      margin-bottom: 4px;
      color: var(--deep-space-blue);
    }

    .delivery-info-box p {
      color: #6c757d;
      font-size: 14px;
    }

    @media (max-width: 768px) {
      .map-modal {
        padding: 0;
      }

      .map-modal-content {
        max-width: 100%;
        max-height: 100vh;
        border-radius: 0;
      }

      .modal-delivery-map {
        height: 400px;
      }
    }

    ::ng-deep .leaflet-routing-container {
      display: none !important;
    }

    ::ng-deep .leaflet-routing-alt {
      display: none !important;
    }

    :host ::ng-deep .leaflet-container img,
    :host ::ng-deep .leaflet-tile,
    :host ::ng-deep .leaflet-marker-icon,
    :host ::ng-deep .leaflet-marker-shadow {
      max-width: none !important;
      max-height: none !important;
    }

    ::ng-deep .leaflet-popup-content-wrapper {
      border-radius: 8px;
      box-shadow: 0 3px 14px rgba(0, 0, 0, 0.2);
    }

    ::ng-deep .leaflet-popup-content {
      margin: 12px;
      font-size: 13px;
    }

    ::ng-deep .leaflet-popup-content b {
      color: var(--deep-space-blue);
      font-size: 14px;
      display: block;
      margin-bottom: 4px;
    }

    @media (max-width: 768px) {
      .delivery-map {
        height: 350px;
      }
    }
  `]
})
export class OrderDetailComponent implements OnInit {
  private orderService = inject(OrderService);
  private cartService = inject(CartService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private deliveryMap: L.Map | null = null;

  order = signal<Order | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  cancelling = signal(false);
  mapInitialized = signal(false);
  showMapModal = signal(false);

  // Shop location for delivery tracking
  private readonly SHOP_LOCATION = {
    lat: 10.8704225,
    lng: 106.7783101,
    address: 'Trường Đại học Kinh tế - Luật, ĐHQG-HCM (UEL), Thủ Đức, TP. Hồ Chí Minh'
  };

  ngOnInit(): void {
    const orderId = this.route.snapshot.paramMap.get('id');
    if (orderId) {
      this.loadOrder(orderId);
    } else {
      this.error.set('Order ID not found');
      this.loading.set(false);
    }
  }

  loadOrder(orderId: string): void {
    this.loading.set(true);
    
    this.orderService.getOrder(orderId).subscribe({
      next: (response) => {
        this.loading.set(false);
        if (response.success && response.data) {
          this.order.set(response.data);
        } else {
          this.error.set('Order not found');
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.error || 'Failed to load order details');
      }
    });
  }

  formatDate(dateString?: string | Date): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatStatus(status: string): string {
    const statusMap: Record<string, string> = {
      pending: 'Pending',
      processing: 'Processing',
      shipped: 'Shipped',
      delivered: 'Delivered',
      cancelled: 'Cancelled'
    };
    return statusMap[status] || status;
  }

  formatPaymentStatus(status: string): string {
    const statusMap: Record<string, string> = {
      pending: 'Payment Pending',
      paid: 'Paid',
      failed: 'Payment Failed',
      refunded: 'Refunded'
    };
    return statusMap[status] || status;
  }

  formatPaymentMethod(method: string): string {
    const methodMap: Record<string, string> = {
      momo: 'MoMo E-Wallet',
      bank_transfer: 'Bank Transfer',
      cod: 'Cash on Delivery',
      card: 'Credit/Debit Card'
    };
    return methodMap[method] || method;
  }

  cancelOrder(): void {
    if (!this.order() || !confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    this.cancelling.set(true);
    
    this.orderService.cancelOrder(this.order()!._id).subscribe({
      next: (response) => {
        this.cancelling.set(false);
        if (response.success && response.data) {
          this.order.set(response.data);
          this.cartService.clearCart();
          alert('Order cancelled successfully');
        }
      },
      error: (err) => {
        this.cancelling.set(false);
        alert(err.error?.error || 'Failed to cancel order');
      }
    });
  }

  /**
   * Open map modal
   */
  openMapModal(): void {
    this.showMapModal.set(true);
    // Wait for DOM to render modal before initializing map
    setTimeout(() => {
      void this.initDeliveryMap();
    }, 100);
  }

  /**
   * Close map modal
   */
  closeMapModal(): void {
    if (this.deliveryMap) {
      this.deliveryMap.remove();
      this.deliveryMap = null;
    }
    this.showMapModal.set(false);
    this.mapInitialized.set(false);
  }

  /**
   * Initialize delivery tracking map with route from shop to customer
   */
  private async initDeliveryMap(): Promise<void> {
    try {
      const order = this.order();
      if (!order || !order.shippingAddress) return;

      const mapElement = document.getElementById('modalDeliveryMap');
      if (!mapElement) return;

      // Clear any existing map
      mapElement.innerHTML = '';

      // Prefer GPS position from user's device over typed address
      const gpsCustomerLoc = await this.getCurrentUserLocation();
      const geocodedCustomerLoc = gpsCustomerLoc
        ? null
        : await this.geocodeShippingAddress(order.shippingAddress);

      // Final fallback to nearby point only if both GPS and geocoding fail
      const customerLoc = gpsCustomerLoc || geocodedCustomerLoc || {
        lat: this.SHOP_LOCATION.lat + 0.01,
        lng: this.SHOP_LOCATION.lng + 0.01
      };

      if (gpsCustomerLoc) {
        console.log('Using GPS location from device for delivery point.');
      } else if (geocodedCustomerLoc) {
        console.log('Using geocoded shipping address for delivery point.');
      } else {
        console.warn('GPS and geocoding both failed. Using fallback location.');
      }

      const customerPopupTitle = gpsCustomerLoc ? 'Vị trí hiện tại của bạn (GPS)' : 'Địa chỉ giao hàng';
      const customerPopupContent = gpsCustomerLoc
        ? 'Định vị từ thiết bị của bạn'
        : `${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state}`;

      // Remove previous map instance before creating a new one
      if (this.deliveryMap) {
        this.deliveryMap.remove();
        this.deliveryMap = null;
      }

      // Create Leaflet map
      const map = L.map('modalDeliveryMap').setView([this.SHOP_LOCATION.lat, this.SHOP_LOCATION.lng], 12);
      this.deliveryMap = map;

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(map);

      // Fix Leaflet default icon issue
      const iconRetinaUrl = 'assets/marker-icon-2x.png';
      const iconUrl = 'assets/marker-icon.png';
      const shadowUrl = 'assets/marker-shadow.png';
      const iconDefault = L.icon({
        iconRetinaUrl,
        iconUrl,
        shadowUrl,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        tooltipAnchor: [16, -28],
        shadowSize: [41, 41]
      });
      L.Marker.prototype.options.icon = iconDefault;

      // Add markers
      const shopMarker = L.marker([this.SHOP_LOCATION.lat, this.SHOP_LOCATION.lng]).addTo(map)
        .bindPopup(`<b>Ponsai</b><br>${this.SHOP_LOCATION.address}`)
        .openPopup();

      const customerMarker = L.marker([customerLoc.lat, customerLoc.lng]).addTo(map)
        .bindPopup(`<b>${customerPopupTitle}</b><br>${customerPopupContent}`);

      // Add routing control
      const routingControl = (L as any).Routing.control({
        waypoints: [
          L.latLng(this.SHOP_LOCATION.lat, this.SHOP_LOCATION.lng),
          L.latLng(customerLoc.lat, customerLoc.lng)
        ],
        routeWhileDragging: false,
        showAlternatives: false,
        addWaypoints: false,
        lineOptions: {
          styles: [{ color: '#3B82F6', weight: 5, opacity: 0.7 }]
        },
        createMarker: function() { return null; }, // Don't create default markers
      }).addTo(map);

      // Listen for route found event
      routingControl.on('routesfound', (e: any) => {
        const routes = e.routes;
        const summary = routes[0].summary;
        console.log('Distance:', (summary.totalDistance / 1000).toFixed(2) + ' km');
        console.log('Estimated time:', Math.round(summary.totalTime / 60) + ' phút');
      });

      // Fit map to show both markers
      const group = L.featureGroup([shopMarker, customerMarker]);
      map.fitBounds(group.getBounds().pad(0.1));

      // Modal animation can delay layout, so force Leaflet to recalculate size
      setTimeout(() => {
        map.invalidateSize();
      }, 250);

      this.mapInitialized.set(true);

    } catch (error) {
      console.error('Map initialization error:', error);
    }
  }

  /**
   * Convert shipping address to coordinates using Nominatim.
   */
  private async geocodeShippingAddress(address: {
    street: string;
    city: string;
    state: string;
    country: string;
  }): Promise<{ lat: number; lng: number } | null> {
    const queries = [
      `${address.street}, ${address.city}, ${address.state}, ${address.country}`,
      `${address.street}, ${address.city}, ${address.country}`,
      `${address.city}, ${address.state}, ${address.country}`,
      `${address.city}, ${address.country}`
    ];

    for (const query of queries) {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=1&q=${encodeURIComponent(query)}`,
          {
            headers: {
              'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8'
            }
          }
        );

        if (!response.ok) {
          continue;
        }

        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          const lat = Number.parseFloat(data[0].lat);
          const lng = Number.parseFloat(data[0].lon);

          if (Number.isFinite(lat) && Number.isFinite(lng)) {
            return { lat, lng };
          }
        }
      } catch (error) {
        console.warn('Geocoding request failed for query:', query, error);
      }
    }

    return null;
  }

  /**
   * Get current GPS location from browser.
   */
  private getCurrentUserLocation(): Promise<{ lat: number; lng: number } | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => {
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 60000
        }
      );
    });
  }
}
