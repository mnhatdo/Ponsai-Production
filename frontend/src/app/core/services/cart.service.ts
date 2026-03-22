import { Injectable, signal, inject, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of, map } from 'rxjs';
import { CartItem, Product } from '@models/index';
import { AuthService } from './auth.service';
import { environment } from '@environments/environment';

interface CartResponse {
  success: boolean;
  data: {
    _id: string;
    user: string;
    items: Array<{
      product: Product;
      quantity: number;
      price: number;
    }>;
    createdAt: string;
    updatedAt: string;
  };
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/cart`;
  
  private cartItems = signal<CartItem[]>([]);
  private isLoading = signal(false);
  private isSyncing = signal(false);
  private baseStorageKey = 'furni_cart';
  private currentUserId: string | null = null;

  // Computed signals
  readonly items = this.cartItems.asReadonly();
  readonly loading = this.isLoading.asReadonly();
  readonly syncing = this.isSyncing.asReadonly();
  readonly total = computed(() => {
    return this.cartItems().reduce((total, item) => {
      return total + (item.product.price * item.quantity);
    }, 0);
  });
  readonly itemCount = computed(() => {
    return this.cartItems().reduce((count, item) => count + item.quantity, 0);
  });

  constructor() {
    // Initialize with current user
    const currentUser = this.authService.currentUser();
    if (currentUser) {
      this.currentUserId = currentUser._id;
    }
    this.loadCart();
    
    // Sync cart when user logs in/out
    this.authService.currentUser$.subscribe(user => {
      const previousUserId = this.currentUserId;
      
      if (user) {
        // User logged in
        this.currentUserId = user._id;
        
        // If switching users, save old cart and load new user's cart
        if (previousUserId && previousUserId !== user._id) {
          this.saveCart(); // Save previous user's cart
          this.loadCart(); // Load current user's cart
        }
        
        this.syncWithBackend();
      } else {
        // User logged out
        if (previousUserId) {
          // Save logged-out user's cart before switching to guest
          this.saveCart();
        }
        this.currentUserId = null;
        this.loadCart(); // Load guest cart
      }
    });
  }
  
  // Get storage key based on current user
  private getStorageKey(): string {
    return this.currentUserId 
      ? `${this.baseStorageKey}_${this.currentUserId}`
      : `${this.baseStorageKey}_guest`;
  }

  // Add item to cart
  addItem(product: Product, quantity: number = 1): void {
    const items = this.cartItems();
    const existingItem = items.find(item => item.product._id === product._id);

    if (existingItem) {
      existingItem.quantity += quantity;
      this.cartItems.set([...items]);
    } else {
      this.cartItems.set([...items, { product, quantity }]);
    }

    this.saveCart();

    // Sync with backend if user is logged in
    if (this.authService.isAuthenticated()) {
      this.addToBackend(product._id, quantity).subscribe();
    }
  }

  // Remove item from cart
  removeItem(productId: string): void {
    const items = this.cartItems().filter(item => item.product._id !== productId);
    this.cartItems.set(items);
    this.saveCart();

    // Sync with backend if user is logged in
    if (this.authService.isAuthenticated()) {
      this.removeFromBackend(productId).subscribe();
    }
  }

  // Update item quantity
  updateQuantity(productId: string, quantity: number): void {
    const items = this.cartItems();
    const item = items.find(item => item.product._id === productId);
    
    if (item) {
      if (quantity <= 0) {
        this.removeItem(productId);
      } else {
        item.quantity = quantity;
        this.cartItems.set([...items]);
        this.saveCart();

        // Sync with backend if user is logged in
        if (this.authService.isAuthenticated()) {
          this.updateBackend(productId, quantity).subscribe();
        }
      }
    }
  }

  // Clear cart
  clearCart(): void {
    this.cartItems.set([]);
    this.saveCart();

    // Sync with backend if user is logged in
    if (this.authService.isAuthenticated()) {
      this.clearBackend().subscribe();
    }
  }

  // Get total
  getTotal(): number {
    return this.total();
  }

  // Get item count
  getItemCount(): number {
    return this.itemCount();
  }

  // Get items (for backward compatibility)
  getItems() {
    return this.items;
  }

  // Backend API methods
  private addToBackend(productId: string, quantity: number): Observable<CartResponse> {
    return this.http.post<CartResponse>(`${this.apiUrl}/add`, { productId, quantity }).pipe(
      tap(response => {
        if (response.success) {
          this.updateFromBackend(response.data);
        }
      }),
      catchError(err => {
        console.error('Failed to add to cart:', err);
        return of({ success: false, data: null as any });
      })
    );
  }

  private updateBackend(productId: string, quantity: number): Observable<CartResponse> {
    return this.http.put<CartResponse>(`${this.apiUrl}/update`, { productId, quantity }).pipe(
      tap(response => {
        if (response.success) {
          this.updateFromBackend(response.data);
        }
      }),
      catchError(err => {
        console.error('Failed to update cart:', err);
        return of({ success: false, data: null as any });
      })
    );
  }

  private removeFromBackend(productId: string): Observable<CartResponse> {
    return this.http.delete<CartResponse>(`${this.apiUrl}/remove/${productId}`).pipe(
      tap(response => {
        if (response.success) {
          this.updateFromBackend(response.data);
        }
      }),
      catchError(err => {
        console.error('Failed to remove from cart:', err);
        return of({ success: false, data: null as any });
      })
    );
  }

  private clearBackend(): Observable<CartResponse> {
    return this.http.delete<CartResponse>(`${this.apiUrl}/clear`).pipe(
      tap(response => {
        if (response.success) {
          this.updateFromBackend(response.data);
        }
      }),
      catchError(err => {
        console.error('Failed to clear cart:', err);
        return of({ success: false, data: null as any });
      })
    );
  }

  // Sync cart with backend
  private syncWithBackend(): void {
    if (this.isSyncing()) return;

    this.isSyncing.set(true);
    
    // Get localStorage items
    const localItems = this.cartItems().map(item => ({
      productId: item.product._id,
      quantity: item.quantity
    }));

    // If there are local items, sync them
    if (localItems.length > 0) {
      this.http.post<CartResponse>(`${this.apiUrl}/sync`, { items: localItems }).pipe(
        tap(response => {
          if (response.success) {
            this.updateFromBackend(response.data);
          }
          this.isSyncing.set(false);
        }),
        catchError(err => {
          console.error('Failed to sync cart:', err);
          this.isSyncing.set(false);
          // Fallback to fetching cart
          this.fetchCart();
          return of(null);
        })
      ).subscribe();
    } else {
      // Just fetch the cart from backend
      this.fetchCart();
    }
  }

  // Force sync local cart to backend before checkout to avoid backend "Cart is empty" errors.
  syncForCheckout(): Observable<boolean> {
    if (!this.authService.isAuthenticated()) {
      return of(true);
    }

    const localItems = this.cartItems().map(item => ({
      productId: item.product._id,
      quantity: item.quantity
    }));

    if (localItems.length === 0) {
      return of(true);
    }

    return this.http.post<CartResponse>(`${this.apiUrl}/sync`, { items: localItems }).pipe(
      tap(response => {
        if (response.success) {
          this.updateFromBackend(response.data);
        }
      }),
      map(response => !!response?.success),
      catchError(err => {
        console.error('Failed to sync cart for checkout:', err);
        return of(false);
      })
    );
  }

  // Fetch cart from backend
  private fetchCart(): void {
    this.isLoading.set(true);
    
    this.http.get<CartResponse>(`${this.apiUrl}`).pipe(
      tap(response => {
        if (response.success) {
          this.updateFromBackend(response.data);
        }
        this.isLoading.set(false);
        this.isSyncing.set(false);
      }),
      catchError(err => {
        console.error('Failed to fetch cart:', err);
        this.isLoading.set(false);
        this.isSyncing.set(false);
        return of(null);
      })
    ).subscribe();
  }

  // Update local cart from backend response
  private updateFromBackend(backendCart: any): void {
    if (!backendCart || !backendCart.items) return;

    const cartItems: CartItem[] = backendCart.items.map((item: any) => ({
      product: item.product,
      quantity: item.quantity
    }));

    this.cartItems.set(cartItems);
    this.saveCart();
  }

  // LocalStorage operations
  private saveCart(): void {
    const storageKey = this.getStorageKey();
    localStorage.setItem(storageKey, JSON.stringify(this.cartItems()));
  }

  private loadCart(): void {
    const storageKey = this.getStorageKey();
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        this.cartItems.set(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load cart:', e);
        this.cartItems.set([]);
      }
    } else {
      this.cartItems.set([]);
    }
  }
}

