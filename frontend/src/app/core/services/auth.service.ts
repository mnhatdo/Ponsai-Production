import { Injectable, inject, signal, computed, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, tap, of, catchError } from 'rxjs';
import { environment } from '@environments/environment';
import { AuthResponse, LoginCredentials, RegisterData, User } from '@models/index';

declare const google: any;

export interface OTPResponse {
  success: boolean;
  message: string;
  emailSent?: boolean;
  devOTP?: string; // Only in development when email not sent
}

export interface VerifyOTPData {
  email: string;
  otp: string;
}

export interface GoogleAuthStatus {
  success: boolean;
  configured: boolean;
  clientId: string | null;
}

export interface UpdateProfileData {
  name?: string;
  phone?: string;
  avatar?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private ngZone = inject(NgZone);
  private router = inject(Router);
  private apiUrl = `${environment.apiUrl}/auth`;
  
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  // Synchronous getter for current user value
  currentUser(): User | null {
    return this.currentUserSubject.getValue();
  }

  // Signals for reactive state
  private _isLoading = signal(false);
  private _error = signal<string | null>(null);
  private _googleClientId = signal<string | null>(null);
  private _isInitialized = signal(false);
  
  public isLoading = computed(() => this._isLoading());
  public error = computed(() => this._error());
  public googleClientId = computed(() => this._googleClientId());
  public isInitialized = computed(() => this._isInitialized());

  private tokenKey = 'furni_token';
  private googleInitialized = false;

  constructor() {
    this.initAuth();
    this.checkGoogleAuthStatus();
  }

  // Initialize authentication state
  private initAuth(): void {
    if (this.isAuthenticated()) {
      // Fetch current user when app starts with existing token
      this.getCurrentUser();
    } else {
      this._isInitialized.set(true);
    }
  }

  // Check Google OAuth status
  private checkGoogleAuthStatus(): void {
    console.log('Calling Google OAuth status API...');
    this.http.get<GoogleAuthStatus>(`${this.apiUrl}/google/status`).pipe(
      catchError((error) => {
        console.error('Google OAuth status API error:', error);
        return of({ success: false, configured: false, clientId: null });
      })
    ).subscribe(response => {
      console.log('Google OAuth status response:', response);
      if (response.configured && response.clientId) {
        console.log('Setting Google Client ID:', response.clientId);
        this._googleClientId.set(response.clientId);
      } else {
        console.warn('Google OAuth not configured or no clientId');
      }
    });
  }

  getCurrentUser(): void {
    const token = this.getToken();
    
    if (!token) {
      // No token, no need to call API
      this._isInitialized.set(true);
      this.currentUserSubject.next(null);
      return;
    }
    
    // We have a token, try to get current user
    this.http.get<{ success: boolean; data: User }>(`${this.apiUrl}/me`)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.currentUserSubject.next(response.data);
          }
          this._isInitialized.set(true);
        },
        error: (err) => {
          // Log detailed error info based on status
          const status = err?.status;
          if (status === 401) {
            console.warn('Auth token expired or invalid (401) - clearing session');
            // Clear token and user on 401
            localStorage.removeItem(this.tokenKey);
            this.currentUserSubject.next(null);
          } else if (status === 0) {
            console.warn('Network error while fetching user - backend may be down');
          } else if (!status) {
            console.warn('Failed to get current user - no response received');
          } else {
            console.warn(`Failed to get current user (HTTP ${status}):`, err.error?.error || err.message);
          }
          
          this._isInitialized.set(true);
        }
      });
  }

  // Initialize Google Sign-In
  initializeGoogleSignIn(buttonElement: HTMLElement, callback: (response: any) => void): void {
    const clientId = this._googleClientId();
    console.log('[AuthService] initializeGoogleSignIn called with clientId:', clientId);
    
    if (!clientId || this.googleInitialized) {
      console.log('[AuthService] Skip initialization:', { 
        hasClientId: !!clientId, 
        alreadyInitialized: this.googleInitialized 
      });
      return;
    }

    // Wait for Google script to load
    console.log('[AuthService] Waiting for Google script to load...');
    const checkGoogle = setInterval(() => {
      if (typeof google !== 'undefined' && google.accounts) {
        clearInterval(checkGoogle);
        console.log('[AuthService] Google script loaded');
        
        google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: any) => {
            console.log('[AuthService] Google callback triggered:', response);
            this.ngZone.run(() => callback(response));
          }
        });

        console.log('[AuthService] Rendering Google button...');
        google.accounts.id.renderButton(buttonElement, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          width: '100%'
        });

        this.googleInitialized = true;
        console.log('[AuthService] Google button rendered successfully');
      }
    }, 100);

    // Timeout after 5 seconds
    setTimeout(() => {
      clearInterval(checkGoogle);
      console.warn('[AuthService] Google script load timeout');
    }, 5000);
  }

  // Google Sign-In
  googleSignIn(credential: string): Observable<AuthResponse> {
    this._isLoading.set(true);
    this._error.set(null);
    return this.http.post<AuthResponse>(`${this.apiUrl}/google`, { credential }).pipe(
      tap({
        next: (response) => {
          this._isLoading.set(false);
          if (response.success && response.token) {
            this.setToken(response.token);
            // Map backend response to User interface
            const userData = response.data as any;
            const user: User = {
              _id: userData.id || userData._id,
              name: userData.name,
              email: userData.email,
              role: userData.role || 'user',
              phone: userData.phone,
              avatar: userData.avatar,
              authProvider: userData.authProvider || 'google',
              createdAt: userData.createdAt || new Date().toISOString(),
              updatedAt: userData.updatedAt || new Date().toISOString()
            };
            this.currentUserSubject.next(user);
          }
        },
        error: (err) => {
          this._isLoading.set(false);
          this._error.set(err.error?.error || 'Google sign-in failed');
        }
      })
    );
  }

  // Initiate registration with OTP
  initiateRegister(data: RegisterData): Observable<OTPResponse> {
    this._isLoading.set(true);
    this._error.set(null);
    return this.http.post<OTPResponse>(`${this.apiUrl}/register/initiate`, data).pipe(
      tap({
        next: () => this._isLoading.set(false),
        error: (err) => {
          this._isLoading.set(false);
          this._error.set(err.error?.error || 'Registration failed');
        }
      })
    );
  }

  // Verify OTP and complete registration
  verifyOTPAndRegister(data: VerifyOTPData): Observable<AuthResponse> {
    this._isLoading.set(true);
    this._error.set(null);
    return this.http.post<AuthResponse>(`${this.apiUrl}/register/verify`, data).pipe(
      tap({
        next: (response) => {
          this._isLoading.set(false);
          if (response.success && response.token) {
            this.setToken(response.token);
            this.getCurrentUser();
          }
        },
        error: (err) => {
          this._isLoading.set(false);
          this._error.set(err.error?.error || 'Verification failed');
        }
      })
    );
  }

  // Resend OTP
  resendOTP(email: string): Observable<OTPResponse> {
    this._isLoading.set(true);
    return this.http.post<OTPResponse>(`${this.apiUrl}/register/resend-otp`, { email }).pipe(
      tap({
        next: () => this._isLoading.set(false),
        error: () => this._isLoading.set(false)
      })
    );
  }

  // Legacy register (direct without OTP)
  register(data: RegisterData): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data).pipe(
      tap(response => {
        if (response.success && response.token) {
          this.setToken(response.token);
          this.getCurrentUser();
        }
      })
    );
  }

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    this._isLoading.set(true);
    this._error.set(null);
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap({
        next: (response) => {
          this._isLoading.set(false);
          if (response.success && response.token) {
            this.setToken(response.token);
            this.getCurrentUser();
          }
        },
        error: (err) => {
          this._isLoading.set(false);
          this._error.set(err.error?.error || 'Login failed');
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.currentUserSubject.next(null);
    // Sign out from Google if initialized
    if (typeof google !== 'undefined' && google.accounts) {
      google.accounts.id.disableAutoSelect();
    }
    // Redirect to home page after logout
    this.router.navigate(['/']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // Update user profile
  updateProfile(data: UpdateProfileData): Observable<{ success: boolean; message: string; data: User }> {
    this._isLoading.set(true);
    this._error.set(null);
    return this.http.put<{ success: boolean; message: string; data: User }>(`${this.apiUrl}/profile`, data).pipe(
      tap({
        next: (response) => {
          this._isLoading.set(false);
          if (response.success) {
            this.currentUserSubject.next(response.data);
          }
        },
        error: (err) => {
          this._isLoading.set(false);
          this._error.set(err.error?.error || 'Failed to update profile');
        }
      })
    );
  }

  // Change password
  changePassword(data: ChangePasswordData): Observable<{ success: boolean; message: string }> {
    this._isLoading.set(true);
    this._error.set(null);
    return this.http.put<{ success: boolean; message: string }>(`${this.apiUrl}/change-password`, data).pipe(
      tap({
        next: () => this._isLoading.set(false),
        error: (err) => {
          this._isLoading.set(false);
          this._error.set(err.error?.error || 'Failed to change password');
        }
      })
    );
  }

  clearError(): void {
    this._error.set(null);
  }
}
