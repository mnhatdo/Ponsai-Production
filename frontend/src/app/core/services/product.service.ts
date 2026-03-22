import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { Product, PaginatedResponse } from '@models/index';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/products`;

  getProducts(params?: {
    page?: number;
    limit?: number;
    category?: string;
    featured?: boolean;
    search?: string;
  }): Observable<PaginatedResponse<Product[]>> {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }

    return this.http.get<PaginatedResponse<Product[]>>(this.apiUrl, { params: httpParams });
  }

  getProduct(id: string): Observable<{ success: boolean; data: Product }> {
    return this.http.get<{ success: boolean; data: Product }>(`${this.apiUrl}/${id}`);
  }

  createProduct(product: Partial<Product>): Observable<{ success: boolean; data: Product }> {
    return this.http.post<{ success: boolean; data: Product }>(this.apiUrl, product);
  }

  updateProduct(id: string, product: Partial<Product>): Observable<{ success: boolean; data: Product }> {
    return this.http.put<{ success: boolean; data: Product }>(`${this.apiUrl}/${id}`, product);
  }

  deleteProduct(id: string): Observable<{ success: boolean; data: {} }> {
    return this.http.delete<{ success: boolean; data: {} }>(`${this.apiUrl}/${id}`);
  }
}
