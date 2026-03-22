import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { Review, ReviewsResponse, CreateReviewData, ApiResponse } from '@models/index';

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  /**
   * Get all reviews for a product
   */
  getProductReviews(
    productId: string,
    params?: {
      page?: number;
      limit?: number;
      rating?: number;
      verified?: boolean;
      sort?: 'newest' | 'helpful' | 'rating-high' | 'rating-low';
    }
  ): Observable<ApiResponse<ReviewsResponse>> {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }

    return this.http.get<ApiResponse<ReviewsResponse>>(
      `${this.apiUrl}/products/${productId}/reviews`,
      { params: httpParams }
    );
  }

  /**
   * Create a new review for a product
   */
  createReview(
    productId: string,
    reviewData: CreateReviewData
  ): Observable<ApiResponse<Review>> {
    return this.http.post<ApiResponse<Review>>(
      `${this.apiUrl}/products/${productId}/reviews`,
      reviewData
    );
  }

  /**
   * Update an existing review
   */
  updateReview(
    reviewId: string,
    reviewData: Partial<CreateReviewData>
  ): Observable<ApiResponse<Review>> {
    return this.http.put<ApiResponse<Review>>(
      `${this.apiUrl}/reviews/${reviewId}`,
      reviewData
    );
  }

  /**
   * Delete a review
   */
  deleteReview(reviewId: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(
      `${this.apiUrl}/reviews/${reviewId}`
    );
  }

  /**
   * Mark a review as helpful
   */
  markHelpful(reviewId: string): Observable<ApiResponse<Review>> {
    return this.http.post<ApiResponse<Review>>(
      `${this.apiUrl}/reviews/${reviewId}/helpful`,
      {}
    );
  }

  /**
   * Get current user's reviews
   */
  getMyReviews(params?: {
    page?: number;
    limit?: number;
  }): Observable<ApiResponse<{
    reviews: Review[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }>> {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }

    return this.http.get<ApiResponse<any>>(
      `${this.apiUrl}/reviews/me`,
      { params: httpParams }
    );
  }
}
