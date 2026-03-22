import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface OrderItem {
  product: any;
  quantity: number;
  price: number;
}

export interface Order {
  _id: string;
  user: string;
  items: OrderItem[];
  totalAmount: number;
  shippingAddress: ShippingAddress;
  status: 'created' | 'pending' | 'pending_manual_payment' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'created' | 'pending' | 'pending_manual_payment' | 'paid' | 'failed' | 'refunded' | 'cancelled';
  paymentMethod?: string;
  paymentDetails?: {
    gateway?: string;
    transactionId?: string;
    momoOrderId?: string;
    momoRequestId?: string;
    resultCode?: number;
    paidAt?: Date;
  };
  trackingNumber?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOrderRequest {
  shippingAddress: ShippingAddress;
  paymentMethod: string;
  notes?: string;
  promotionCode?: string;
  promotionDiscount?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/orders`;

  /**
   * Get all orders for current user
   */
  getUserOrders(page: number = 1, limit: number = 10): Observable<ApiResponse<Order[]>> {
    return this.http.get<ApiResponse<Order[]>>(
      `${this.apiUrl}?page=${page}&limit=${limit}`
    );
  }

  /**
   * Get single order by ID
   */
  getOrder(orderId: string): Observable<ApiResponse<Order>> {
    return this.http.get<ApiResponse<Order>>(`${this.apiUrl}/${orderId}`);
  }

  /**
   * Create order from cart (checkout)
   */
  createOrder(orderData: CreateOrderRequest): Observable<ApiResponse<Order>> {
    return this.http.post<ApiResponse<Order>>(this.apiUrl, orderData);
  }

  /**
   * Cancel order
   */
  cancelOrder(orderId: string): Observable<ApiResponse<Order>> {
    return this.http.patch<ApiResponse<Order>>(
      `${this.apiUrl}/${orderId}/cancel`,
      {}
    );
  }
}
