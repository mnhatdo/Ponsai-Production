import { Component, Input, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ReviewService } from '@core/services/review.service';
import { Review, ReviewStats } from '@models/index';
import { AuthService } from '@core/services/auth.service';
import { ReviewFormComponent } from '@shared/components/review-form.component';

@Component({
  selector: 'app-product-reviews',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, ReviewFormComponent],
  template: `
    <div class="product-reviews">
      <!-- Reviews Summary -->
      <div class="reviews-summary">
        <h2>{{ 'reviews.title' | translate }}</h2>
        
        @if (stats()) {
          <div class="rating-overview">
            <div class="average-rating">
              <div class="rating-number">{{ formatAverageRating(stats()!.averageRating) }}</div>
              <div class="average-meta">
                <div class="stars">
                  @for (star of [1,2,3,4,5]; track star) {
                    <i class="star bi" [class.bi-heart-fill]="star <= stats()!.averageRating" [class.bi-heart]="star > stats()!.averageRating" [class.filled]="star <= stats()!.averageRating" aria-hidden="true"></i>
                  }
                </div>
              </div>
            </div>
            
            <div class="rating-distribution">
              @for (rating of [5,4,3,2,1]; track rating) {
                <div class="rating-bar">
                  <span class="rating-label">{{ rating }}</span>
                  <div class="bar-container">
                    <div
                      class="bar-fill"
                      [style.width.%]="getRatingPercentage(rating)"
                      [style.background]="getRatingBarColor(rating)"
                    ></div>
                  </div>
                  <span class="rating-percent">{{ getRatingPercentage(rating) | number:'1.0-0' }}%</span>
                  <span class="rating-count">{{ getDistributionCount(rating) }}</span>
                </div>
              }
            </div>
          </div>
        }
      </div>

      <!-- Review Form -->
      @if (showReviewForm()) {
        <app-review-form 
          [productId]="productId"
          (reviewSubmitted)="onReviewSubmitted()"
          (cancel)="showReviewForm.set(false)"
        />
      } @else {
        <button class="write-review-btn" (click)="showReviewForm.set(true)">
          {{ 'reviews.writeReview' | translate }}
        </button>
      }

      <!-- Filters -->
      <div class="reviews-filters">
        <div class="reviews-filter-main">
        <select [(ngModel)]="selectedRating" (change)="onFilterChange()" class="filter-select">
          <option value="">{{ 'reviews.allRatings' | translate }}</option>
          <option value="5">5/5</option>
          <option value="4">4/5</option>
          <option value="3">3/5</option>
          <option value="2">2/5</option>
          <option value="1">1/5</option>
        </select>

        <select [(ngModel)]="sortBy" (change)="onFilterChange()" class="filter-select">
          <option value="newest">{{ 'reviews.sortNewest' | translate }}</option>
          <option value="helpful">{{ 'reviews.sortHelpful' | translate }}</option>
          <option value="rating-high">{{ 'reviews.sortHighRating' | translate }}</option>
          <option value="rating-low">{{ 'reviews.sortLowRating' | translate }}</option>
        </select>
        </div>

        <label class="verified-filter verified-filter-inline">
          <input type="checkbox" [(ngModel)]="verifiedOnly" (change)="onFilterChange()">
          <span>{{ 'reviews.verifiedOnly' | translate }}</span>
        </label>
      </div>

      <!-- Reviews List -->
      <div class="reviews-list">
        @if (loading()) {
          <div class="loading">{{ 'common.loading' | translate }}</div>
        } @else if (reviews().length === 0) {
          <div class="no-reviews">{{ 'reviews.noReviews' | translate }}</div>
        } @else {
          @for (review of reviews(); track review._id) {
            <div class="review-card">
              <div class="review-header">
                <div class="reviewer-info">
                  <div class="reviewer-name">{{ review.userName }}</div>
                  @if (review.verified) {
                    <span class="verified-badge">
                      <i class="gi gi-ui-success" aria-hidden="true"></i> {{ 'reviews.verifiedPurchase' | translate }}
                    </span>
                  }
                </div>
                <div class="review-date">{{ formatDate(review.createdAt) }}</div>
              </div>

              <div class="review-rating">
                @for (star of [1,2,3,4,5]; track star) {
                  <i class="star bi" [class.bi-star-fill]="star <= review.rating" [class.bi-star]="star > review.rating" [class.filled]="star <= review.rating" aria-hidden="true"></i>
                }
              </div>

              <h4 class="review-title">{{ review.title }}</h4>
              <div class="review-comment-shell">
                <p class="review-comment">{{ review.comment }}</p>
              </div>

              @if (review.images && review.images.length > 0) {
                <div class="review-images">
                  @for (image of review.images; track image) {
                    <img [src]="image" [alt]="review.title" class="review-image">
                  }
                </div>
              }

              <div class="review-actions">
                <button class="helpful-btn" (click)="markAsHelpful(review._id)">
                  <i class="gi gi-ui-thumbs-up" aria-hidden="true"></i> {{ 'reviews.helpful' | translate }} ({{ review.helpful }})
                </button>

                @if (canEditReview(review)) {
                  <button class="edit-btn" (click)="editReview(review)">
                    {{ 'common.edit' | translate }}
                  </button>
                  <button class="delete-btn" (click)="deleteReview(review._id)">
                    {{ 'common.delete' | translate }}
                  </button>
                }
              </div>
            </div>
          }
        }
      </div>

      <!-- Pagination -->
      @if (totalPages() > 1) {
        <div class="pagination">
          <button 
            [disabled]="currentPage() === 1"
            (click)="goToPage(currentPage() - 1)"
            class="page-btn"
          >
            {{ 'common.previous' | translate }}
          </button>

          <span class="page-info">
            {{ 'common.page' | translate }} {{ currentPage() }} / {{ totalPages() }}
          </span>

          <button 
            [disabled]="currentPage() === totalPages()"
            (click)="goToPage(currentPage() + 1)"
            class="page-btn"
          >
            {{ 'common.next' | translate }}
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .product-reviews {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
      border-radius: 20px;
      background: #ffffff;
      border: 1px solid #e3ece6;
      box-shadow: 0 14px 30px rgba(21, 50, 67, 0.08);
    }

    .reviews-summary h2 {
      font-size: 2rem;
      margin-bottom: 1.75rem;
      color: #1f2a6b;
      letter-spacing: -0.03em;
    }

    .rating-overview {
      display: grid;
      grid-template-columns: 250px 1fr;
      gap: 3rem;
      margin-bottom: 2rem;
      padding: 2rem;
      background: #f8fbf8;
      border-radius: 14px;
      border: 1px solid #e0e9e3;
    }

    .average-rating {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      justify-content: center;
    }

    .rating-number {
      font-size: clamp(4.2rem, 7vw, 5.8rem);
      font-weight: 800;
      line-height: 0.9;
      color: #1f2a6b;
      letter-spacing: -0.08em;
    }

    .average-meta {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .stars {
      font-size: 1.3rem;
      display: inline-flex;
      gap: 0.35rem;
    }

    .star {
      color: #d7dbe6;
    }

    .star.filled {
      color: #6fdda1;
    }

    .rating-distribution {
      display: flex;
      flex-direction: column;
      gap: 0.95rem;
      justify-content: center;
    }

    .rating-bar {
      display: grid;
      grid-template-columns: 28px 1fr 56px 40px;
      align-items: center;
      gap: 1rem;
    }

    .rating-label {
      font-weight: 500;
      color: #70779c;
    }

    .bar-container {
      flex: 1;
      height: 16px;
      background: #edf0f7;
      border-radius: 999px;
      overflow: hidden;
      border: 1px solid #e1e8e4;
    }

    .bar-fill {
      height: 100%;
      border-radius: inherit;
      transition: width 0.3s ease;
    }

    .rating-percent {
      font-weight: 700;
      color: #1f2a6b;
      text-align: right;
    }

    .rating-count {
      min-width: 40px;
      text-align: right;
      color: #73799c;
    }

    .write-review-btn {
      padding: 1rem 1.8rem;
      background: #153243;
      color: #f8faff;
      border: none;
      border-radius: 12px;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      margin-bottom: 2rem;
      transition: all 0.25s ease;
      box-shadow: 0 10px 20px rgba(21, 50, 67, 0.24);
    }

    .write-review-btn:hover {
      background: #1b455d;
      transform: translateY(-2px);
    }

    .reviews-filters {
      display: flex;
      flex-direction: column;
      gap: 0.9rem;
      margin-bottom: 2rem;
      align-items: stretch;
      padding: 1.2rem;
      border-radius: 14px;
      background: #f8fbf8;
      border: 1px solid #e0e9e3;
    }

    .reviews-filter-main {
      display: grid;
      grid-template-columns: minmax(220px, 1fr) minmax(220px, 1fr);
      gap: 1rem;
      align-items: center;
    }

    .filter-select {
      padding: 0.9rem 1rem;
      border: 1px solid #d9e5de;
      border-radius: 12px;
      font-size: 0.9rem;
      background: #ffffff;
      color: #3d4852;
    }

    .verified-filter {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      cursor: pointer;
      color: #5d6587;
      font-weight: 500;
      padding: 0.9rem 1rem;
      border-radius: 16px;
      background: #e0e5ec;
      box-shadow:
        -5px -5px 12px rgba(255, 255, 255, 0.56),
        5px 5px 12px rgba(163, 177, 198, 0.5);
    }

    .verified-filter-inline {
      display: inline-flex;
      padding: 0;
      border-radius: 0;
      background: transparent;
      box-shadow: none;
      color: #68708f;
      font-weight: 500;
      align-self: flex-start;
      justify-content: flex-start;
      white-space: nowrap;
      gap: 0.5rem;
    }

    .verified-filter input {
      accent-color: #6c63ff;
      margin: 0;
      flex: 0 0 auto;
    }

    .verified-filter-inline span {
      white-space: nowrap;
    }

    .reviews-list {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .review-card {
      padding: 1.5rem;
      border-radius: 14px;
      background: #ffffff;
      border: 1px solid #e0e9e3;
      box-shadow: 0 8px 18px rgba(21, 50, 67, 0.06);
    }

    .review-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 1rem;
      gap: 1rem;
    }

    .reviewer-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .reviewer-name {
      font-weight: 700;
      color: #1f2a6b;
    }

    .verified-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.45rem 0.75rem;
      background: linear-gradient(145deg, #ebfbf6, #d7f4ec);
      color: #2e978e;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 600;
      box-shadow:
        -4px -4px 10px rgba(255, 255, 255, 0.52),
        4px 4px 10px rgba(128, 194, 184, 0.26);
    }

    .review-date {
      color: #73799c;
      font-size: 0.875rem;
    }

    .review-rating {
      margin-bottom: 0.5rem;
      font-size: 1.25rem;
    }

    .review-title {
      font-size: 1.125rem;
      margin-bottom: 0.5rem;
      color: #2e3b65;
    }

    .review-comment-shell {
      padding: 1rem 1.1rem;
      border-radius: 12px;
      background: #f8fbf8;
      border: 1px solid #e0e9e3;
      margin-bottom: 1rem;
    }

    .review-comment {
      color: #5f6789;
      line-height: 1.6;
      margin: 0;
    }

    .review-images {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }

    .review-image {
      width: 100px;
      height: 100px;
      object-fit: cover;
      border-radius: 16px;
      cursor: pointer;
      transition: transform 0.3s ease;
      box-shadow:
        -4px -4px 10px rgba(255, 255, 255, 0.52),
        4px 4px 10px rgba(163, 177, 198, 0.36);
    }

    .review-image:hover {
      transform: scale(1.05);
    }

    .review-actions {
      display: flex;
      gap: 1rem;
      padding-top: 1rem;
      border-top: none;
      flex-wrap: wrap;
    }

    .helpful-btn, .edit-btn, .delete-btn {
      padding: 0.75rem 1rem;
      border: 1px solid #d9e5de;
      border-radius: 12px;
      background: #ffffff;
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 600;
      color: #46506d;
      transition: all 0.25s ease;
      box-shadow: 0 6px 14px rgba(21, 50, 67, 0.08);
    }

    .helpful-btn:hover {
      color: #6c63ff;
      transform: translateY(-1px);
    }

    .edit-btn:hover {
      color: #38b2ac;
      transform: translateY(-1px);
    }

    .delete-btn:hover {
      color: #f26d55;
      transform: translateY(-1px);
    }

    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      margin-top: 2rem;
    }

    .page-btn {
      padding: 0.8rem 1.2rem;
      border: 1px solid #d9e5de;
      border-radius: 12px;
      background: #ffffff;
      cursor: pointer;
      color: #46506d;
      font-weight: 600;
      transition: all 0.25s ease;
      box-shadow: 0 6px 14px rgba(21, 50, 67, 0.08);
    }

    .page-btn:hover:not(:disabled) {
      color: #6c63ff;
      transform: translateY(-1px);
    }

    .page-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .page-info {
      color: #6b7280;
    }

    .loading, .no-reviews {
      text-align: center;
      padding: 3rem;
      color: #6b7280;
      font-size: 1.125rem;
    }

    @media (max-width: 768px) {
      .product-reviews {
        padding: 1.25rem;
        border-radius: 24px;
      }

      .rating-overview {
        grid-template-columns: 1fr;
        gap: 2rem;
        padding: 1.4rem;
      }

      .rating-bar {
        grid-template-columns: 24px 1fr 48px 34px;
        gap: 0.6rem;
      }

      .reviews-filters {
        flex-direction: column;
        align-items: stretch;
      }

      .reviews-filter-main {
        grid-template-columns: 1fr;
      }

      .filter-select {
        width: 100%;
      }

      .review-header {
        flex-direction: column;
      }
    }
  `]
})
export class ProductReviewsComponent implements OnInit {
  private reviewService = inject(ReviewService);
  private authService = inject(AuthService);

  @Input({ required: true }) productId!: string;

  reviews = signal<Review[]>([]);
  stats = signal<ReviewStats | null>(null);
  loading = signal(false);
  currentPage = signal(1);
  totalPages = signal(1);
  showReviewForm = signal(false);

  selectedRating = '';
  verifiedOnly = false;
  sortBy: 'newest' | 'helpful' | 'rating-high' | 'rating-low' = 'newest';

  currentUser = computed(() => this.authService.currentUser());

  ngOnInit() {
    this.loadReviews();
  }

  loadReviews() {
    this.loading.set(true);

    const params: any = {
      page: this.currentPage(),
      limit: 10,
      sort: this.sortBy
    };

    if (this.selectedRating) {
      params.rating = parseInt(this.selectedRating);
    }

    if (this.verifiedOnly) {
      params.verified = true;
    }

    this.reviewService.getProductReviews(this.productId, params).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.reviews.set(response.data.reviews);
          this.stats.set(response.data.stats);
          this.totalPages.set(response.data.pagination.pages);
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading reviews:', error);
        this.loading.set(false);
      }
    });
  }

  onFilterChange() {
    this.currentPage.set(1);
    this.loadReviews();
  }

  goToPage(page: number) {
    this.currentPage.set(page);
    this.loadReviews();
  }

  getRatingPercentage(rating: number): number {
    if (!this.stats()) return 0;
    const total = this.stats()!.total;
    if (total === 0) return 0;
    const distribution = this.stats()!.distribution;
    const count = distribution[rating as 1 | 2 | 3 | 4 | 5] || 0;
    return (count / total) * 100;
  }

  getDistributionCount(rating: number): number {
    if (!this.stats()) return 0;
    const distribution = this.stats()!.distribution;
    return distribution[rating as 1 | 2 | 3 | 4 | 5] || 0;
  }

  getRatingBarColor(rating: number): string {
    const colors: Record<number, string> = {
      5: 'linear-gradient(90deg, #69dca0, #6fd89f)',
      4: 'linear-gradient(90deg, #b7e86d, #a8df63)',
      3: 'linear-gradient(90deg, #ffd85a, #ffc94c)',
      2: 'linear-gradient(90deg, #ffbb53, #ffad45)',
      1: 'linear-gradient(90deg, #fb8354, #f26d55)'
    };

    return colors[rating] || colors[5];
  }

  formatAverageRating(value: number): string {
    return value.toFixed(1).replace('.', ',');
  }

  markAsHelpful(reviewId: string) {
    this.reviewService.markHelpful(reviewId).subscribe({
      next: () => {
        this.loadReviews();
      },
      error: (error) => {
        console.error('Error marking review as helpful:', error);
      }
    });
  }

  canEditReview(review: Review): boolean {
    const user = this.currentUser();
    if (!user || !review.user) return false;
    
    const userId = typeof review.user === 'string' ? review.user : review.user._id;
    return user._id === userId || user.role === 'admin';
  }

  editReview(review: Review) {
    // TODO: Implement edit functionality
    console.log('Edit review:', review);
  }

  deleteReview(reviewId: string) {
    if (!confirm('Are you sure you want to delete this review?')) return;

    this.reviewService.deleteReview(reviewId).subscribe({
      next: () => {
        this.loadReviews();
      },
      error: (error) => {
        console.error('Error deleting review:', error);
      }
    });
  }

  onReviewSubmitted() {
    this.showReviewForm.set(false);
    this.loadReviews();
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
