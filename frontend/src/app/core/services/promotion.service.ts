/**
 * Promotion Service - Frontend service for promotion code handling
 * 
 * Features:
 * - Validate promotion codes
 * - Calculate discounts
 * - Get active promotions
 */

import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';

export interface PromotionValidationRequest {
  code: string;
  orderAmount: number;
  items?: Array<{ productId: string; quantity: number }>;
}

export interface PromotionDiscount {
  amount: number;
  percentage: number;
  originalAmount: number;
  finalAmount: number;
  freeShipping: boolean;
}

export interface PromotionData {
  _id: string;
  code: string;
  name: string;
  description?: string;
  type: 'percentage' | 'fixed' | 'free_shipping';
  value: number;
  maxDiscount?: number;
  freeShipping: boolean;
}

export interface PromotionValidationResponse {
  success: boolean;
  valid: boolean;
  data?: {
    promotion: PromotionData;
    discount: PromotionDiscount;
  };
  message: string;
}

export interface ActivePromotion {
  _id: string;
  code: string;
  name: string;
  description?: string;
  type: string;
  value: number;
  maxDiscount?: number;
  minOrderAmount?: number;
  startDate: string;
  endDate: string;
}

@Injectable({
  providedIn: 'root'
})
export class PromotionService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/promotions`;

  // Current applied promotion
  appliedPromotion = signal<PromotionData | null>(null);
  discountAmount = signal<number>(0);
  freeShipping = signal<boolean>(false);

  /**
   * Validate a promotion code
   */
  validatePromotion(request: PromotionValidationRequest): Observable<PromotionValidationResponse> {
    return this.http.post<PromotionValidationResponse>(
      `${this.apiUrl}/validate`,
      request
    );
  }

  /**
   * Apply promotion (set in service state)
   */
  applyPromotion(promotion: PromotionData, discount: PromotionDiscount): void {
    this.appliedPromotion.set(promotion);
    this.discountAmount.set(discount.amount);
    this.freeShipping.set(discount.freeShipping);
  }

  /**
   * Remove applied promotion
   */
  removePromotion(): void {
    this.appliedPromotion.set(null);
    this.discountAmount.set(0);
    this.freeShipping.set(false);
  }

  /**
   * Get active promotions (public)
   */
  getActivePromotions(): Observable<{ success: boolean; count: number; data: ActivePromotion[] }> {
    return this.http.get<{ success: boolean; count: number; data: ActivePromotion[] }>(
      `${this.apiUrl}/active`
    );
  }

  /**
   * Record promotion usage after order creation
   */
  applyPromotionToOrder(promotionId: string, orderId: string, discountAmount: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/apply`, {
      promotionId,
      orderId,
      discountAmount
    });
  }

  /**
   * Calculate final total with discount
   */
  calculateFinalTotal(subtotal: number): number {
    return Math.max(0, subtotal - this.discountAmount());
  }

  /**
   * Get discount percentage (for display)
   */
  getDiscountPercentage(subtotal: number): number {
    if (subtotal === 0) return 0;
    return (this.discountAmount() / subtotal) * 100;
  }

  /**
   * Clear promotion state (call on checkout completion or cancellation)
   */
  clear(): void {
    this.removePromotion();
  }
}
