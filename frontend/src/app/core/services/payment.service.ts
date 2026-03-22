import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface MomoPaymentResponse {
  payUrl: string;
  deeplink?: string;
  qrCodeUrl?: string;
  orderId: string;
}

export interface ManualPaymentResponse {
  orderId: string;
  message: string;
}

export interface CardPaymentData {
  cardNumber: string;
  cardHolder: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
}

export interface CardPaymentResponse {
  orderId: string;
  message: string;
  requiresProcessing: boolean;
}

export interface CardProcessingResponse {
  orderId: string;
  status: 'paid' | 'failed';
  message: string;
  transactionId?: string;
}

export interface BankTransferResponse {
  orderId: string;
  reference: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  issuedAt: string;
  dueDate: string;
  bankDetails: {
    bankName: string;
    accountName: string;
    iban: string;
  swift: string;
    sortCode: string;
    accountNumber: string;
  };
  qrData: string;
}

export interface BankTransferVerifyResponse {
  orderId: string;
  status: 'paid' | 'pending' | 'expired';
  message: string;
  transactionId?: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  icon: string;
  enabled: boolean;
  type: string;
  processingTime?: string;
}

export interface PaymentStatus {
  orderId: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  orderStatus: string;
  paymentMethod?: string;
  paymentDetails?: any;
  totalAmount?: number;
  resultCode?: number;
  resultMessage?: string;
  transactionId?: string;
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
export class PaymentService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/payment`;

  /**
   * Get available payment methods
   */
  getPaymentMethods(): Observable<ApiResponse<PaymentMethod[]>> {
    return this.http.get<ApiResponse<PaymentMethod[]>>(
      `${this.apiUrl}/methods`
    );
  }

  /**
   * Initiate MOMO payment for an order
   */
  initiateMomoPayment(orderId: string): Observable<ApiResponse<MomoPaymentResponse>> {
    return this.http.post<ApiResponse<MomoPaymentResponse>>(
      `${this.apiUrl}/momo/initiate`,
      { orderId }
    );
  }

  /**
   * Initiate manual payment for an order
   */
  initiateManualPayment(orderId: string): Observable<ApiResponse<ManualPaymentResponse>> {
    return this.http.post<ApiResponse<ManualPaymentResponse>>(
      `${this.apiUrl}/manual/initiate`,
      { orderId }
    );
  }

  /**
   * Initiate card payment for an order
   */
  initiateCardPayment(orderId: string, cardData: CardPaymentData): Observable<ApiResponse<CardPaymentResponse>> {
    return this.http.post<ApiResponse<CardPaymentResponse>>(
      `${this.apiUrl}/card/initiate`,
      { orderId, cardData }
    );
  }

  /**
   * Process card payment (simulate processing)
   */
  processCardPayment(orderId: string): Observable<ApiResponse<CardProcessingResponse>> {
    return this.http.post<ApiResponse<CardProcessingResponse>>(
      `${this.apiUrl}/card/process`,
      { orderId }
    );
  }

  /**
   * Initiate bank transfer for an order
   */
  initiateBankTransfer(orderId: string): Observable<ApiResponse<BankTransferResponse>> {
    return this.http.post<ApiResponse<BankTransferResponse>>(
      `${this.apiUrl}/bank-transfer/initiate`,
      { orderId }
    );
  }

  /**
   * Verify bank transfer payment
   */
  verifyBankTransfer(orderId: string, transferCode: string): Observable<ApiResponse<BankTransferVerifyResponse>> {
    return this.http.post<ApiResponse<BankTransferVerifyResponse>>(
      `${this.apiUrl}/bank-transfer/verify`,
      { orderId, transferCode }
    );
  }

  /**
   * Check payment status of an order
   */
  checkPaymentStatus(orderId: string): Observable<ApiResponse<PaymentStatus>> {
    return this.http.get<ApiResponse<PaymentStatus>>(
      `${this.apiUrl}/status/${orderId}`
    );
  }

  /**
   * Handle MOMO callback (called from frontend redirect)
   */
  handleMomoCallback(params: any): Observable<ApiResponse<PaymentStatus>> {
    return this.http.get<ApiResponse<PaymentStatus>>(
      `${this.apiUrl}/momo/callback`,
      { params }
    );
  }

  /**
   * Redirect user to MOMO payment page
   */
  redirectToMomo(payUrl: string): void {
    window.location.href = payUrl;
  }
}
