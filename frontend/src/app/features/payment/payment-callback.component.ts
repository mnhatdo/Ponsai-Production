import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PaymentService, PaymentStatus } from '../../core/services/payment.service';

@Component({
  selector: 'app-payment-callback',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="payment-callback-page">
      <div class="container py-5">
        <div class="row justify-content-center">
          <div class="col-md-8 col-lg-6">
            @if (isLoading()) {
              <div class="card text-center">
                <div class="card-body py-5">
                  <div class="spinner-border text-primary mb-3" style="width: 3rem; height: 3rem;"></div>
                  <h4>Processing Payment...</h4>
                  <p class="text-muted">Please wait while we verify your payment.</p>
                </div>
              </div>
            } @else if (paymentStatus()) {
              @if (paymentStatus()?.paymentStatus === 'paid') {
                <!-- Success -->
                <div class="card border-success">
                  <div class="card-body text-center py-5">
                    <div class="success-icon mb-3">
                      <i class="gi gi-check-circle-fill" aria-hidden="true"></i>
                    </div>
                    <h3 class="text-success mb-3">Payment Successful!</h3>
                    <p class="text-muted mb-4">
                      Your order has been successfully placed and paid.
                    </p>
                    <div class="payment-details mb-4">
                      <div class="row text-start">
                        <div class="col-6">
                          <small class="text-muted">Order ID:</small>
                          <p class="mb-2"><strong>{{ paymentStatus()?.orderId }}</strong></p>
                        </div>
                        @if (paymentStatus()?.transactionId) {
                          <div class="col-6">
                            <small class="text-muted">Transaction ID:</small>
                            <p class="mb-2"><strong>{{ paymentStatus()?.transactionId }}</strong></p>
                          </div>
                        }
                        @if (paymentStatus()?.totalAmount) {
                          <div class="col-12 mt-3">
                            <small class="text-muted">Amount Paid:</small>
                            <h4 class="text-success">\${{ paymentStatus()?.totalAmount?.toFixed(2) }}</h4>
                          </div>
                        }
                      </div>
                    </div>
                    <div class="d-grid gap-2">
                      <a [routerLink]="['/order-detail', paymentStatus()?.orderId]" class="btn btn-success btn-lg">View Order</a>
                      <a routerLink="/shop" class="btn btn-outline-secondary">Continue Shopping</a>
                    </div>
                  </div>
                </div>
              } @else if (paymentStatus()?.paymentStatus === 'failed') {
                <!-- Failed -->
                <div class="card border-danger">
                  <div class="card-body text-center py-5">
                    <div class="error-icon mb-3">
                      <i class="gi gi-ui-close" aria-hidden="true"></i>
                    </div>
                    <h3 class="text-danger mb-3">Payment Failed</h3>
                    <p class="text-muted mb-4">
                      {{ paymentStatus()?.resultMessage || 'Your payment could not be processed.' }}
                    </p>
                    @if (paymentStatus()?.orderId) {
                      <div class="payment-details mb-4">
                        <small class="text-muted">Order ID:</small>
                        <p><strong>{{ paymentStatus()?.orderId }}</strong></p>
                      </div>
                    }
                    <div class="d-grid gap-2">
                      <button class="btn btn-primary btn-lg" (click)="retryPayment()">
                        Retry Payment
                      </button>
                      <a routerLink="/cart" class="btn btn-outline-secondary">Back to Cart</a>
                    </div>
                  </div>
                </div>
              } @else {
                <!-- Pending -->
                <div class="card border-warning">
                  <div class="card-body text-center py-5">
                    <div class="warning-icon mb-3">
                      <i class="gi gi-ui-warning" aria-hidden="true"></i>
                    </div>
                    <h3 class="text-warning mb-3">Payment Pending</h3>
                    <p class="text-muted mb-4">
                      Your payment is being processed. Please wait...
                    </p>
                    @if (paymentStatus()?.orderId) {
                      <div class="payment-details mb-4">
                        <small class="text-muted">Order ID:</small>
                        <p><strong>{{ paymentStatus()?.orderId }}</strong></p>
                      </div>
                    }
                    <div class="d-grid gap-2">
                      <button class="btn btn-warning btn-lg" (click)="checkStatus()">
                        Check Status
                      </button>
                      <a [routerLink]="['/order-detail', paymentStatus()?.orderId]" class="btn btn-outline-secondary">View Order</a>
                    </div>
                  </div>
                </div>
              }
            } @else if (error()) {
              <!-- Error -->
              <div class="card border-danger">
                <div class="card-body text-center py-5">
                  <h3 class="text-danger mb-3">Error</h3>
                  <p class="text-muted mb-4">{{ error() }}</p>
                  <a routerLink="/" class="btn btn-primary">Go Home</a>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .payment-callback-page {
      min-height: 80vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
    }

    .card {
      border-radius: 1rem;
      box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
    }

    .success-icon,
    .error-icon,
    .warning-icon {
      animation: scaleIn 0.3s ease-out;
    }

    .success-icon i,
    .error-icon i,
    .warning-icon i {
      width: 80px;
      height: 80px;
      font-size: 80px;
      display: inline-flex;
    }

    .success-icon i {
      color: #28a745;
    }

    .error-icon i {
      color: #dc3545;
    }

    .warning-icon i {
      color: #ffc107;
    }

    @keyframes scaleIn {
      from {
        transform: scale(0);
        opacity: 0;
      }
      to {
        transform: scale(1);
        opacity: 1;
      }
    }

    .payment-details {
      background-color: #f8f9fa;
      padding: 1.5rem;
      border-radius: 0.5rem;
    }

    .btn-lg {
      padding: 0.75rem 1.5rem;
      font-weight: 600;
    }
  `]
})
export class PaymentCallbackComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private paymentService = inject(PaymentService);

  isLoading = signal(true);
  paymentStatus = signal<PaymentStatus | null>(null);
  error = signal<string | null>(null);

  ngOnInit() {
    this.handleCallback();
  }

  private handleCallback() {
    this.route.queryParams.subscribe(params => {
      const orderId = params['orderId'];
      const resultCode = params['resultCode'];

      if (!orderId || !resultCode) {
        this.error.set('Invalid payment callback parameters');
        this.isLoading.set(false);
        return;
      }

      // Call backend to handle callback and get payment status
      this.paymentService.handleMomoCallback(params).subscribe({
        next: (response) => {
          this.isLoading.set(false);
          if (response.success && response.data) {
            this.paymentStatus.set(response.data);
          } else {
            this.error.set(response.error || 'Failed to process payment callback');
          }
        },
        error: (err) => {
          console.error('Callback handling failed:', err);
          this.isLoading.set(false);
          this.error.set('Failed to verify payment status');
        }
      });
    });
  }

  retryPayment() {
    const orderId = this.paymentStatus()?.orderId;
    if (!orderId) return;

    this.isLoading.set(true);
    this.paymentService.initiateMomoPayment(orderId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.paymentService.redirectToMomo(response.data.payUrl);
        } else {
          this.error.set('Failed to retry payment');
          this.isLoading.set(false);
        }
      },
      error: () => {
        this.error.set('Failed to retry payment');
        this.isLoading.set(false);
      }
    });
  }

  checkStatus() {
    const orderId = this.paymentStatus()?.orderId;
    if (!orderId) return;

    this.isLoading.set(true);
    this.paymentService.checkPaymentStatus(orderId).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        if (response.success && response.data) {
          this.paymentStatus.set(response.data);
        }
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }
}
