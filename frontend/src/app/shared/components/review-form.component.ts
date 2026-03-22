import { Component, EventEmitter, Input, Output, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ReviewService } from '@core/services/review.service';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-review-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  template: `
    <div class="review-form-container">
      <h3>{{ 'reviews.writeReview' | translate }}</h3>

      <form [formGroup]="reviewForm" (ngSubmit)="onSubmit()">
        <!-- Rating -->
        <div class="form-group">
          <label class="required">{{ 'reviews.rating' | translate }}</label>
          <div class="star-rating">
            @for (star of [1,2,3,4,5]; track star) {
              <span 
                class="star-input"
                [class.selected]="star <= selectedRating()"
                (click)="setRating(star)"
                (mouseenter)="hoveredRating.set(star)"
                (mouseleave)="hoveredRating.set(0)"
              >
                <i class="gi bi bi-star-fill" aria-hidden="true"></i>
              </span>
            }
          </div>
          @if (reviewForm.get('rating')?.invalid && reviewForm.get('rating')?.touched) {
            <span class="error">{{ 'reviews.ratingRequired' | translate }}</span>
          }
        </div>

        <!-- Title -->
        <div class="form-group">
          <label class="required">{{ 'reviews.title' | translate }}</label>
          <input 
            type="text" 
            formControlName="title"
            [placeholder]="'reviews.titlePlaceholder' | translate"
            class="form-control"
          >
          @if (reviewForm.get('title')?.invalid && reviewForm.get('title')?.touched) {
            <span class="error">{{ 'reviews.titleRequired' | translate }}</span>
          }
        </div>

        <!-- Comment -->
        <div class="form-group">
          <label class="required">{{ 'reviews.comment' | translate }}</label>
          <textarea 
            formControlName="comment"
            [placeholder]="'reviews.commentPlaceholder' | translate"
            rows="5"
            class="form-control"
          ></textarea>
          @if (reviewForm.get('comment')?.invalid && reviewForm.get('comment')?.touched) {
            <span class="error">{{ 'reviews.commentRequired' | translate }}</span>
          }
        </div>

        <!-- User Info (if not logged in) -->
        @if (!isLoggedIn()) {
          <div class="form-group">
            <label class="required">{{ 'reviews.yourName' | translate }}</label>
            <input 
              type="text" 
              formControlName="userName"
              [placeholder]="'reviews.namePlaceholder' | translate"
              class="form-control"
            >
            @if (reviewForm.get('userName')?.invalid && reviewForm.get('userName')?.touched) {
              <span class="error">{{ 'reviews.nameRequired' | translate }}</span>
            }
          </div>

          <div class="form-group">
            <label>{{ 'reviews.yourEmail' | translate }} ({{ 'common.optional' | translate }})</label>
            <input 
              type="email" 
              formControlName="userEmail"
              [placeholder]="'reviews.emailPlaceholder' | translate"
              class="form-control"
            >
            @if (reviewForm.get('userEmail')?.invalid && reviewForm.get('userEmail')?.touched) {
              <span class="error">{{ 'reviews.emailInvalid' | translate }}</span>
            }
          </div>
        }

        <!-- Error Message -->
        @if (errorMessage()) {
          <div class="alert alert-error">
            {{ errorMessage() }}
          </div>
        }

        <!-- Success Message -->
        @if (successMessage()) {
          <div class="alert alert-success">
            {{ successMessage() }}
          </div>
        }

        <!-- Actions -->
        <div class="form-actions">
          <button 
            type="button" 
            class="btn btn-secondary"
            (click)="onCancel()"
            [disabled]="submitting()"
          >
            {{ 'common.cancel' | translate }}
          </button>
          <button 
            type="submit" 
            class="btn btn-primary"
            [disabled]="submitting() || reviewForm.invalid"
          >
            @if (submitting()) {
              {{ 'common.submitting' | translate }}...
            } @else {
              {{ 'reviews.submitReview' | translate }}
            }
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .review-form-container {
      background: #e0e5ec;
      padding: 2rem;
      border-radius: 28px;
      box-shadow:
        -12px -12px 28px rgba(255, 255, 255, 0.58),
        12px 12px 28px rgba(163, 177, 198, 0.52);
      margin-bottom: 2rem;
    }

    h3 {
      margin-bottom: 1.5rem;
      color: #1f2a6b;
      letter-spacing: -0.02em;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 600;
      color: #3d4852;
    }

    label.required::after {
      content: ' *';
      color: #f44336;
    }

    .form-control {
      width: 100%;
      padding: 0.95rem 1rem;
      border: none;
      border-radius: 18px;
      font-size: 1rem;
      color: #3d4852;
      background: linear-gradient(145deg, #e5eaf1, #d8dde5);
      box-shadow:
        inset -6px -6px 12px rgba(255, 255, 255, 0.52),
        inset 6px 6px 12px rgba(163, 177, 198, 0.22);
      transition: box-shadow 0.25s ease, transform 0.25s ease;
    }

    .form-control:focus {
      outline: none;
      box-shadow:
        inset -6px -6px 12px rgba(255, 255, 255, 0.52),
        inset 6px 6px 12px rgba(163, 177, 198, 0.22),
        0 0 0 3px rgba(108, 99, 255, 0.16);
    }

    .form-control.ng-invalid.ng-touched {
      box-shadow:
        inset -6px -6px 12px rgba(255, 255, 255, 0.52),
        inset 6px 6px 12px rgba(163, 177, 198, 0.22),
        0 0 0 2px rgba(242, 109, 85, 0.2);
    }

    textarea.form-control {
      resize: vertical;
      font-family: inherit;
      min-height: 140px;
    }

    .star-rating {
      display: flex;
      gap: 0.5rem;
      font-size: 2rem;
      padding: 0.6rem 0.25rem;
    }

    .star-input {
      cursor: pointer;
      color: #cfd4df;
      transition: color 0.2s ease, transform 0.2s ease;
      user-select: none;
    }

    .star-input.selected {
      color: #6fdda1;
    }

    .star-input:hover {
      transform: scale(1.1);
    }

    .error {
      display: block;
      color: #d85f45;
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }

    .alert {
      padding: 1rem;
      border-radius: 16px;
      margin-bottom: 1rem;
      box-shadow:
        inset -4px -4px 10px rgba(255, 255, 255, 0.42),
        inset 4px 4px 10px rgba(163, 177, 198, 0.16);
    }

    .alert-error {
      background: #fde9e3;
      color: #c75a45;
      border: none;
    }

    .alert-success {
      background: #e2f7ef;
      color: #2e978e;
      border: none;
    }

    .form-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      margin-top: 2rem;
    }

    .btn {
      padding: 0.95rem 1.6rem;
      border: none;
      border-radius: 18px;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.25s ease;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-primary {
      background: linear-gradient(145deg, #2a2a31, #17171b);
      color: #f8faff;
      box-shadow:
        -10px -10px 22px rgba(255, 255, 255, 0.42),
        12px 12px 24px rgba(23, 23, 27, 0.28);
    }

    .btn-primary:hover:not(:disabled) {
      background: linear-gradient(145deg, #1f1f25, #0f0f12);
      transform: translateY(-2px);
    }

    .btn-secondary {
      background: #e0e5ec;
      color: #4b5675;
      box-shadow:
        -8px -8px 18px rgba(255, 255, 255, 0.52),
        8px 8px 18px rgba(163, 177, 198, 0.44);
    }

    .btn-secondary:hover:not(:disabled) {
      color: #38b2ac;
      transform: translateY(-2px);
    }

    @media (max-width: 768px) {
      .review-form-container {
        padding: 1rem;
      }

      .form-actions {
        flex-direction: column;
      }

      .btn {
        width: 100%;
      }
    }
  `]
})
export class ReviewFormComponent {
  private fb = inject(FormBuilder);
  private reviewService = inject(ReviewService);
  private authService = inject(AuthService);

  @Input({ required: true }) productId!: string;
  @Input() reviewToEdit?: any; // For future edit functionality
  
  @Output() reviewSubmitted = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  reviewForm: FormGroup;
  selectedRating = signal(0);
  hoveredRating = signal(0);
  submitting = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  isLoggedIn = computed(() => !!this.authService.currentUser());

  constructor() {
    const currentUser = this.authService.currentUser();
    
    this.reviewForm = this.fb.group({
      rating: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
      title: ['', [Validators.required, Validators.maxLength(200)]],
      comment: ['', [Validators.required, Validators.maxLength(2000)]],
      userName: [currentUser?.name || '', this.isLoggedIn() ? [] : [Validators.required]],
      userEmail: [currentUser?.email || '', [Validators.email]]
    });
  }

  setRating(rating: number) {
    this.selectedRating.set(rating);
    this.reviewForm.patchValue({ rating });
  }

  onSubmit() {
    if (this.reviewForm.invalid) {
      this.reviewForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const formData = this.reviewForm.value;
    
    // Remove userName and userEmail if logged in
    if (this.isLoggedIn()) {
      delete formData.userName;
      delete formData.userEmail;
    }

    this.reviewService.createReview(this.productId, formData).subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage.set('Review submitted successfully!');
          this.reviewForm.reset();
          this.selectedRating.set(0);
          
          setTimeout(() => {
            this.reviewSubmitted.emit();
          }, 1500);
        }
        this.submitting.set(false);
      },
      error: (error) => {
        this.errorMessage.set(error.error?.message || 'An error occurred. Please try again.');
        this.submitting.set(false);
      }
    });
  }

  onCancel() {
    this.cancel.emit();
  }
}
