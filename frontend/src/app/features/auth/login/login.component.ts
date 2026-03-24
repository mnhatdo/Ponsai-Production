import { Component, inject, signal, AfterViewInit, ElementRef, ViewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslateModule],
  template: `
    <!-- Hero Section -->
    <div class="hero hero-small">
      <div class="container">
        <div class="row justify-content-center">
          <div class="col-md-6 col-lg-5 text-center">
            <div class="intro-excerpt">
              <h1>{{ 'auth.welcomeBack' | translate }}</h1>
              <p class="mb-0">{{ 'auth.signInSubtitle' | translate }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Auth Section -->
    <div class="untree_co-section auth-section">
      <div class="container">
        <div class="row justify-content-center">
          <div class="col-md-6 col-lg-5">
            <div class="auth-card">
              <!-- Tab Navigation -->
              <div class="auth-tabs">
                <a routerLink="/auth/login" class="auth-tab active">{{ 'auth.signIn' | translate }}</a>
                <a routerLink="/auth/register" class="auth-tab">{{ 'auth.signUp' | translate }}</a>
              </div>

              <!-- Login Form -->
              <form (ngSubmit)="onSubmit()" #loginForm="ngForm">
                <!-- Error Message -->
                <div class="alert alert-danger" *ngIf="errorMessage()">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                    <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
                  </svg>
                  {{ errorMessage() }}
                </div>

                <!-- Email Field -->
                <div class="form-group">
                  <label class="form-label" for="email">{{ 'form.email' | translate }}</label>
                  <div class="input-icon-wrapper">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M.05 3.555A2 2 0 0 1 2 2h12a2 2 0 0 1 1.95 1.555L8 8.414.05 3.555zM0 4.697v7.104l5.803-3.558L0 4.697zM6.761 8.83l-6.57 4.027A2 2 0 0 0 2 14h12a2 2 0 0 0 1.808-1.144l-6.57-4.027L8 9.586l-1.239-.757zm3.436-.586L16 11.801V4.697l-5.803 3.546z"/>
                    </svg>
                    <input 
                      type="email" 
                      class="form-control" 
                      id="email"
                      name="email"
                      [(ngModel)]="credentials.email"
                      required
                      email
                      [placeholder]="'auth.emailPlaceholder' | translate"
                      #emailInput="ngModel"
                    >
                  </div>
                  <div class="invalid-feedback" *ngIf="emailInput.touched && emailInput.invalid">
                    {{ 'auth.emailRequired' | translate }}
                  </div>
                </div>

                <!-- Password Field -->
                <div class="form-group">
                  <label class="form-label" for="password">{{ 'form.password' | translate }}</label>
                  <div class="input-icon-wrapper">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
                    </svg>
                    <input 
                      [type]="showPassword() ? 'text' : 'password'" 
                      class="form-control" 
                      id="password"
                      name="password"
                      [(ngModel)]="credentials.password"
                      required
                      minlength="6"
                      [placeholder]="'auth.passwordPlaceholder' | translate"
                      #passwordInput="ngModel"
                    >
                    <button type="button" class="password-toggle" (click)="togglePassword()">
                      <svg *ngIf="!showPassword()" xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
                        <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
                      </svg>
                      <svg *ngIf="showPassword()" xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755-.165.165-.337.328-.517.486l.708.709z"/>
                        <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829l.822.822zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829z"/>
                        <path d="M3.35 5.47c-.18.16-.353.322-.518.487A13.134 13.134 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7.029 7.029 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12-.708.708z"/>
                      </svg>
                    </button>
                  </div>
                  <div class="invalid-feedback" *ngIf="passwordInput.touched && passwordInput.invalid">
                    {{ 'auth.passwordMinLength' | translate }}
                  </div>
                </div>

                <!-- Remember Me & Forgot Password -->
                <div class="form-options">
                  <label class="custom-checkbox">
                    <input type="checkbox" [(ngModel)]="rememberMe" name="rememberMe">
                    <span class="checkmark"></span>
                    {{ 'auth.rememberMe' | translate }}
                  </label>
                  <a href="#" class="forgot-link">{{ 'auth.forgotPassword' | translate }}</a>
                </div>

                <!-- Submit Button -->
                <button 
                  type="submit" 
                  class="btn btn-primary btn-block"
                  [disabled]="loginForm.invalid || isLoading()"
                >
                  <span *ngIf="!isLoading()">{{ 'auth.signIn' | translate }}</span>
                  <span *ngIf="isLoading()" class="btn-loading">
                    <span class="spinner"></span>
                    {{ 'auth.signingIn' | translate }}...
                  </span>
                </button>

                <!-- Divider -->
                <div class="auth-divider">
                  <span>{{ 'auth.orContinueWith' | translate }}</span>
                </div>

                <!-- Social Login -->
                <div class="social-login">
                  <!-- Google Sign-In Button Container -->
                  <div #googleBtn class="google-btn-container" *ngIf="googleClientId()"></div>
                  
                  <!-- Fallback Google button when not configured -->
                  <button 
                    type="button" 
                    class="btn-social btn-google" 
                    *ngIf="!googleClientId()"
                    disabled
                    title="Google Sign-In not configured"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    {{ 'auth.google' | translate }}
                  </button>
                </div>

                <!-- Sign Up Link -->
                <p class="auth-footer">
                  {{ 'auth.noAccount' | translate }}
                  <a routerLink="/auth/register">{{ 'auth.createOne' | translate }}</a>
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      --nm-bg: #f3f7f1;
      --nm-fg: #1f2c2b;
      --nm-muted: #5f6b68;
      --nm-accent: #1e6b52;
      --nm-accent-light: #2f8a67;
      --nm-success: #2f8a67;
      --nm-shadow-light: rgba(255, 255, 255, 0.7);
      --nm-shadow-dark: rgba(29, 55, 45, 0.12);
      --nm-radius-lg: 24px;
      --nm-radius-md: 14px;
    }

    .auth-section {
      background: var(--nm-bg);
    }

    .hero-small {
      padding: 4rem 0 2rem;
    }

    .hero-small .intro-excerpt h1 {
      color: #ffffff;
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
    }

    .hero-small .intro-excerpt p {
      color: rgba(255, 255, 255, 0.9);
      opacity: 0.9;
    }

    .auth-section {
      padding: calc(var(--hero-menu-offset) + 1.25rem) 0 6rem;
    }

    .auth-card {
      background: #ffffff;
      border-radius: var(--nm-radius-lg);
      border: 1px solid #e2ece3;
      box-shadow: 0 16px 34px rgba(25, 49, 40, 0.11);
      padding: 2rem;
    }

    .auth-tabs {
      display: flex;
      gap: 0.75rem;
      margin-bottom: 1.7rem;
      background: #edf4ec;
      padding: 0.35rem;
      border-radius: 14px;
      border: 1px solid #deeadf;
    }

    .auth-tab {
      flex: 1;
      text-align: center;
      padding: 0.8rem;
      font-weight: 600;
      color: var(--nm-muted);
      text-decoration: none;
      border-radius: 10px;
      transition: all 0.25s ease;
    }

    .auth-tab:hover,
    .auth-tab.active {
      color: var(--nm-accent);
      background: #ffffff;
      box-shadow: 0 6px 14px rgba(25, 49, 40, 0.08);
    }

    .form-group {
      margin-bottom: 1.2rem;
    }

    .form-label {
      display: block;
      font-weight: 600;
      color: var(--nm-fg);
      margin-bottom: 0.5rem;
      font-size: 0.9rem;
    }

    .input-icon-wrapper {
      position: relative;
    }

    .input-icon-wrapper svg {
      position: absolute;
      left: 16px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--nm-muted);
      z-index: 1;
    }

    .input-icon-wrapper .form-control {
      padding-left: 48px;
      padding-right: 56px;
    }

    .password-toggle {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      background: transparent;
      border: none;
      cursor: pointer;
      color: var(--nm-muted);
      width: 36px;
      height: 36px;
      padding: 0;
      line-height: 1;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2;
    }

    .password-toggle:hover {
      color: var(--nm-accent);
    }

    .password-toggle svg {
      display: block;
      width: 18px;
      height: 18px;
      flex: 0 0 18px;
    }

    .form-control {
      height: 52px;
      border: 1px solid #dbe7dd;
      background: #f8fbf7;
      border-radius: var(--nm-radius-md);
      font-size: 1rem;
      color: var(--nm-fg);
      transition: all 0.25s ease;
    }

    .form-control::placeholder {
      color: var(--nm-muted);
    }

    .form-control:focus {
      border-color: #8ab29f;
      box-shadow: 0 0 0 3px rgba(47, 138, 103, 0.18);
    }

    .invalid-feedback {
      display: block;
      color: #d04d66;
      font-size: 0.82rem;
      margin-top: 0.45rem;
    }

    .alert {
      display: flex;
      align-items: center;
      gap: 0.7rem;
      padding: 0.9rem 1rem;
      border-radius: var(--nm-radius-md);
      margin-bottom: 1.3rem;
      font-size: 0.88rem;
      background: #fff1f4;
      color: #a14258;
      border: 1px solid #f2c6d0;
    }

    .form-options {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.3rem;
    }

    .custom-checkbox {
      display: flex;
      align-items: center;
      cursor: pointer;
      font-size: 0.9rem;
      color: var(--nm-muted);
    }

    .custom-checkbox input {
      display: none;
    }

    .checkmark {
      width: 20px;
      height: 20px;
      border: 1px solid #cdddcf;
      border-radius: 6px;
      margin-right: 0.5rem;
      position: relative;
      background: #ffffff;
    }

    .custom-checkbox input:checked + .checkmark {
      border-color: #8ab29f;
      background: #e9f5ef;
    }

    .custom-checkbox input:checked + .checkmark::after {
      content: '';
      position: absolute;
      left: 6px;
      top: 2px;
      width: 5px;
      height: 10px;
      border: solid var(--nm-success);
      border-width: 0 2px 2px 0;
      transform: rotate(45deg);
    }

    .forgot-link {
      color: var(--nm-accent);
      font-size: 0.9rem;
      text-decoration: none;
    }

    .forgot-link:hover {
      color: var(--nm-accent-light);
    }

    .btn-primary {
      background: linear-gradient(145deg, var(--nm-accent-light), var(--nm-accent));
      color: #f8f9ff;
      border: none;
      height: 52px;
      font-weight: 600;
      font-size: 1rem;
      border-radius: var(--nm-radius-md);
      box-shadow: 0 10px 20px rgba(30, 107, 82, 0.3);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 12px 24px rgba(30, 107, 82, 0.34);
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-block {
      width: 100%;
    }

    .btn-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .spinner {
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255, 255, 255, 0.35);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .auth-divider {
      display: flex;
      align-items: center;
      margin: 1.4rem 0;
    }

    .auth-divider::before,
    .auth-divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: rgba(107, 114, 128, 0.35);
    }

    .auth-divider span {
      padding: 0 1rem;
      color: var(--nm-muted);
      font-size: 0.82rem;
    }

    .social-login {
      display: flex;
      gap: 0.9rem;
    }

    .btn-social {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      height: 48px;
      border: 1px solid #dbe7dd;
      border-radius: var(--nm-radius-md);
      background: #ffffff;
      color: var(--nm-fg);
      font-weight: 500;
      font-size: 0.9rem;
      cursor: pointer;
      box-shadow: 0 6px 14px rgba(25, 49, 40, 0.08);
      transition: all 0.25s ease;
    }

    .btn-social:hover {
      color: var(--nm-accent);
      transform: translateY(-1px);
    }

    .auth-footer {
      text-align: center;
      margin-top: 1.4rem;
      color: var(--nm-muted);
      font-size: 0.9rem;
    }

    .auth-footer a {
      color: var(--nm-accent);
      font-weight: 600;
      text-decoration: none;
    }

    .auth-footer a:hover {
      color: var(--nm-accent-light);
    }

    .google-btn-container {
      width: 100%;
      display: flex;
      justify-content: center;
    }

    .google-btn-container > div {
      width: 100% !important;
    }

    @media (max-width: 576px) {
      .hero-small {
        padding: 2.5rem 0 1rem;
      }

      .auth-card {
        padding: 1.4rem;
        border-radius: 18px;
      }

      .social-login {
        flex-direction: column;
      }

      .form-options {
        flex-direction: column;
        gap: 0.8rem;
        align-items: flex-start;
      }
    }
  `]
})
export class LoginComponent implements AfterViewInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  @ViewChild('googleBtn') googleBtnRef!: ElementRef;

  credentials = {
    email: '',
    password: ''
  };
  rememberMe = false;
  showPassword = signal(false);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  googleClientId = this.authService.googleClientId;

  constructor() {
    // Watch for googleClientId changes and initialize button when ready
    effect(() => {
      const clientId = this.googleClientId();
      console.log('🔄 [Login Component] googleClientId changed:', clientId);
      if (clientId && this.googleBtnRef?.nativeElement) {
        console.log('✅ [Login Component] Initializing Google button...');
        // Small delay to ensure DOM is ready
        setTimeout(() => {
          this.authService.initializeGoogleSignIn(
            this.googleBtnRef.nativeElement,
            (response: any) => this.handleGoogleSignIn(response)
          );
        }, 100);
      } else {
        console.log('⏳ [Login Component] Waiting for clientId or button element...');
      }
    });
  }

  ngAfterViewInit(): void {
    console.log('🎬 [Login Component] ngAfterViewInit - clientId:', this.googleClientId());
    // Check for error query param (from admin guard)
    const error = this.route.snapshot.queryParams['error'];
    if (error === 'Not an admin user') {
      this.errorMessage.set('You do not have permission to access the admin area. Please log in with an admin account.');
    }
    
    // Try to initialize Google Sign-In if clientId is already available
    if (this.googleClientId() && this.googleBtnRef?.nativeElement) {
      console.log('✅ [Login Component] ngAfterViewInit - Initializing immediately');
      setTimeout(() => {
        this.authService.initializeGoogleSignIn(
          this.googleBtnRef.nativeElement,
          (response: any) => this.handleGoogleSignIn(response)
        );
      }, 100);
    } else {
      console.log('⏳ [Login Component] ngAfterViewInit - Waiting (effect will handle it)');
    }
  }

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  handleGoogleSignIn(response: any): void {
    console.log('🎯 [Login Component] handleGoogleSignIn called:', response);
    
    if (response.credential) {
      console.log('✅ [Login Component] Got credential, length:', response.credential.length);
      this.isLoading.set(true);
      this.errorMessage.set(null);

      this.authService.googleSignIn(response.credential).subscribe({
        next: (res) => {
          console.log('✅ [Login Component] Backend response:', res);
          this.isLoading.set(false);
          if (res.success) {
            // Wait for currentUser to be set, then check role and redirect
            const checkUserAndRedirect = () => {
              const user = this.authService.currentUser();
              if (user) {
                // Check for returnUrl from query params
                let returnUrl = this.route.snapshot.queryParams['returnUrl'];
                
                // Decode the URL if it's encoded
                if (returnUrl) {
                  try {
                    returnUrl = decodeURIComponent(returnUrl);
                  } catch (e) {
                    // If decode fails, use as is
                  }
                }
                
                // Redirect based on returnUrl or user role
                if (returnUrl) {
                  // Validate returnUrl for admin users
                  if (user.role === 'admin' && returnUrl.startsWith('/admin')) {
                    this.router.navigate([returnUrl]);
                  } else if (user.role !== 'admin' && !returnUrl.startsWith('/admin')) {
                    this.router.navigate([returnUrl]);
                  } else {
                    // returnUrl not valid for this user role, use default
                    this.router.navigate([user.role === 'admin' ? '/admin' : '/']);
                  }
                } else {
                  // No returnUrl, redirect to admin if user is admin, otherwise to home
                  this.router.navigate([user.role === 'admin' ? '/admin' : '/']);
                }
              } else {
                // User not loaded yet, try again shortly
                setTimeout(checkUserAndRedirect, 100);
              }
            };
            checkUserAndRedirect();
          }
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(err.error?.error || 'Google sign-in failed. Please try again.');
        }
      });
    }
  }

  onSubmit(): void {
    if (!this.credentials.email || !this.credentials.password) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.login(this.credentials).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        if (response.success) {
          // Wait for currentUser to be set, then check role and redirect
          const checkUserAndRedirect = () => {
            const user = this.authService.currentUser();
            if (user) {
              // Check for returnUrl from query params
              let returnUrl = this.route.snapshot.queryParams['returnUrl'];
              
              // Decode the URL if it's encoded
              if (returnUrl) {
                try {
                  returnUrl = decodeURIComponent(returnUrl);
                } catch (e) {
                  // If decode fails, use as is
                }
              }
              
              // Redirect based on returnUrl or user role
              if (returnUrl) {
                // Validate returnUrl for admin users
                if (user.role === 'admin' && returnUrl.startsWith('/admin')) {
                  this.router.navigate([returnUrl]);
                } else if (user.role !== 'admin' && !returnUrl.startsWith('/admin')) {
                  this.router.navigate([returnUrl]);
                } else {
                  // returnUrl not valid for this user role, use default
                  this.router.navigate([user.role === 'admin' ? '/admin' : '/']);
                }
              } else {
                // No returnUrl, redirect to admin if user is admin, otherwise to home
                this.router.navigate([user.role === 'admin' ? '/admin' : '/']);
              }
            } else {
              // User not loaded yet, try again shortly
              setTimeout(checkUserAndRedirect, 100);
            }
          };
          checkUserAndRedirect();
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        
        // User-friendly error messages - 401 is expected for invalid credentials
        let errorMsg = 'Login failed. Please try again.';
        
        if (err.status === 401) {
          // Expected: Invalid credentials  
          errorMsg = 'Invalid email or password. Please check your credentials.';
        } else if (err.status === 0) {
          // Network error
          errorMsg = 'Cannot connect to server. Please check your internet connection.';
        } else if (err.status === 500) {
          // Server error
          errorMsg = 'Server error. Please try again later.';
        } else if (err.status === 429) {
          // Too many requests
          errorMsg = 'Too many login attempts. Please wait and try again.';
        } else if (err.error?.error) {
          // Use server's error message
          errorMsg = err.error.error;
        }
        
        this.errorMessage.set(errorMsg);
      }
    });
  }
}
