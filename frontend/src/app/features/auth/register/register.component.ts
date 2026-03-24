import { Component, inject, signal, OnDestroy, AfterViewInit, ElementRef, ViewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

type RegistrationStep = 'form' | 'otp' | 'success';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslateModule],
  template: `
    <!-- Hero Section -->
    <div class="hero hero-small">
      <div class="container">
        <div class="row justify-content-center">
          <div class="col-md-6 col-lg-5 text-center">
            <div class="intro-excerpt">
              <h1>{{ getHeroTitle() }}</h1>
              <p class="mb-0">{{ getHeroSubtitle() }}</p>
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
              <!-- Tab Navigation (only show on form step) -->
              <div class="auth-tabs" *ngIf="currentStep() === 'form'">
                <a routerLink="/auth/login" class="auth-tab">{{ 'auth.signIn' | translate }}</a>
                <a routerLink="/auth/register" class="auth-tab active">{{ 'auth.signUp' | translate }}</a>
              </div>

              <!-- Progress Steps (show during OTP) -->
              <div class="progress-steps" *ngIf="currentStep() !== 'form'">
                <div class="step" [class.completed]="true">
                  <div class="step-icon">
                    <i class="gi gi-check-circle" aria-hidden="true"></i>
                  </div>
                  <span>{{ 'auth.details' | translate }}</span>
                </div>
                <div class="step-line" [class.active]="currentStep() !== 'form'"></div>
                <div class="step" [class.active]="currentStep() === 'otp'" [class.completed]="currentStep() === 'success'">
                  <div class="step-icon">
                    <span *ngIf="currentStep() === 'otp'">2</span>
                    <i *ngIf="currentStep() === 'success'" class="gi gi-check-circle" aria-hidden="true"></i>
                  </div>
                  <span>{{ 'auth.verify' | translate }}</span>
                </div>
                <div class="step-line" [class.active]="currentStep() === 'success'"></div>
                <div class="step" [class.active]="currentStep() === 'success'">
                  <div class="step-icon">3</div>
                  <span>{{ 'auth.done' | translate }}</span>
                </div>
              </div>

              <!-- Step 1: Registration Form -->
              <form *ngIf="currentStep() === 'form'" (ngSubmit)="onSubmitForm()" #registerForm="ngForm">
                <!-- Error Message -->
                <div class="alert alert-danger" *ngIf="errorMessage()">
                  <i class="gi gi-ui-alert" aria-hidden="true"></i>
                  {{ errorMessage() }}
                </div>

                <!-- Name Field -->
                <div class="form-group">
                  <label class="form-label" for="name">{{ 'form.fullName' | translate }}</label>
                  <div class="input-icon-wrapper">
                    <i class="gi gi-admin-users" aria-hidden="true"></i>
                    <input 
                      type="text" 
                      class="form-control" 
                      id="name"
                      name="name"
                      [(ngModel)]="registerData.name"
                      required
                      minlength="2"
                      [placeholder]="'auth.fullNamePlaceholder' | translate"
                      #nameInput="ngModel"
                    >
                  </div>
                  <div class="invalid-feedback" *ngIf="nameInput.touched && nameInput.invalid">
                    {{ 'auth.nameRequired' | translate }}
                  </div>
                </div>

                <!-- Email Field -->
                <div class="form-group">
                  <label class="form-label" for="email">{{ 'form.email' | translate }}</label>
                  <div class="input-icon-wrapper">
                    <i class="gi gi-envelope-fill" aria-hidden="true"></i>
                    <input 
                      type="email" 
                      class="form-control" 
                      id="email"
                      name="email"
                      [(ngModel)]="registerData.email"
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

                <!-- Phone Field (Optional) -->
                <div class="form-group">
                  <label class="form-label" for="phone">{{ 'form.phone' | translate }} <span class="optional">({{ 'form.optional' | translate }})</span></label>
                  <div class="input-icon-wrapper">
                    <i class="gi gi-telephone-fill" aria-hidden="true"></i>
                    <input 
                      type="tel" 
                      class="form-control" 
                      id="phone"
                      name="phone"
                      [(ngModel)]="registerData.phone"
                      [placeholder]="'auth.phonePlaceholder' | translate"
                    >
                  </div>
                </div>

                <!-- Password Field -->
                <div class="form-group">
                  <label class="form-label" for="password">{{ 'form.password' | translate }}</label>
                  <div class="input-icon-wrapper">
                    <i class="gi gi-lock" aria-hidden="true"></i>
                    <input 
                      [type]="showPassword() ? 'text' : 'password'" 
                      class="form-control" 
                      id="password"
                      name="password"
                      [(ngModel)]="registerData.password"
                      required
                      minlength="6"
                      [placeholder]="'auth.createPasswordPlaceholder' | translate"
                      #passwordInput="ngModel"
                    >
                    <button type="button" class="password-toggle" (click)="togglePassword()">
                      <svg *ngIf="!showPassword()" xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
                        <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
                        <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
                      </svg>
                      <svg *ngIf="showPassword()" xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
                        <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755-.165.165-.337.328-.517.486l.708.709z"/>
                        <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829l.822.822zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829z"/>
                        <path d="M3.35 5.47c-.18.16-.353.322-.518.487A13.134 13.134 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7.029 7.029 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12-.708.708z"/>
                      </svg>
                    </button>
                  </div>
                  <div class="password-strength" *ngIf="registerData.password">
                    <div class="strength-bar">
                      <div class="strength-fill" [style.width]="getPasswordStrength().width" [style.background]="getPasswordStrength().color"></div>
                    </div>
                    <span class="strength-text" [style.color]="getPasswordStrength().color">{{ getPasswordStrength().label }}</span>
                  </div>
                  <div class="invalid-feedback" *ngIf="passwordInput.touched && passwordInput.invalid">
                    {{ 'auth.passwordMinLength' | translate }}
                  </div>
                </div>

                <!-- Confirm Password -->
                <div class="form-group">
                  <label class="form-label" for="confirmPassword">{{ 'form.confirmPassword' | translate }}</label>
                  <div class="input-icon-wrapper">
                    <i class="gi gi-lock" aria-hidden="true"></i>
                    <input 
                      [type]="showPassword() ? 'text' : 'password'" 
                      class="form-control" 
                      id="confirmPassword"
                      name="confirmPassword"
                      [(ngModel)]="confirmPassword"
                      required
                      [placeholder]="'auth.confirmPasswordPlaceholder' | translate"
                      #confirmInput="ngModel"
                    >
                  </div>
                  <div class="invalid-feedback" *ngIf="confirmInput.touched && confirmPassword !== registerData.password">
                    {{ 'auth.passwordsNoMatch' | translate }}
                  </div>
                </div>

                <!-- Terms Checkbox -->
                <div class="form-group">
                  <label class="custom-checkbox">
                    <input type="checkbox" [(ngModel)]="acceptTerms" name="acceptTerms" required>
                    <span class="checkmark"></span>
                    <span class="terms-text">
                      <span>{{ 'auth.agreeToTerms' | translate }}</span>
                      <a href="#" class="terms-link">{{ 'auth.termsOfService' | translate }}</a>
                      <span>{{ 'auth.and' | translate }}</span>
                      <a href="#" class="terms-link">{{ 'auth.privacyPolicy' | translate }}</a>
                    </span>
                  </label>
                </div>

                <!-- Submit Button -->
                <button 
                  type="submit" 
                  class="btn btn-primary btn-block"
                  [disabled]="registerForm.invalid || confirmPassword !== registerData.password || !acceptTerms || isLoading()"
                >
                  <span *ngIf="!isLoading()">{{ 'button.continue' | translate }}</span>
                  <span *ngIf="isLoading()" class="btn-loading">
                    <span class="spinner"></span>
                    {{ 'auth.pleaseWait' | translate }}...
                  </span>
                </button>

                <!-- Divider -->
                <div class="auth-divider">
                  <span>{{ 'auth.orSignUpWith' | translate }}</span>
                </div>

                <!-- Google Sign-Up -->
                <div class="social-login">
                  <div #googleBtn class="google-btn-container" *ngIf="googleClientId()"></div>
                  <button 
                    type="button" 
                    class="btn-social btn-google" 
                    *ngIf="!googleClientId()"
                    disabled
                    [title]="'auth.googleNotConfigured' | translate"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    {{ 'auth.google' | translate }}
                  </button>
                </div>

                <!-- Sign In Link -->
                <p class="auth-footer">
                  {{ 'auth.alreadyHaveAccount' | translate }}
                  <a routerLink="/auth/login">{{ 'auth.signIn' | translate }}</a>
                </p>
              </form>

              <!-- Step 2: OTP Verification -->
              <div *ngIf="currentStep() === 'otp'" class="otp-section">
                <div class="otp-header">
                  <div class="otp-icon">
                    <i class="gi gi-envelope-fill" aria-hidden="true"></i>
                  </div>
                  <h3>{{ 'auth.verifyYourEmail' | translate }}</h3>
                  <p>{{ 'auth.sentOtpTo' | translate }}<br><strong>{{ registerData.email }}</strong></p>
                </div>

                <!-- Error Message -->
                <div class="alert alert-danger" *ngIf="errorMessage()">
                  <i class="gi gi-ui-alert" aria-hidden="true"></i>
                  {{ errorMessage() }}
                </div>

                <!-- OTP Input -->
                <div class="otp-input-group">
                  <input 
                    *ngFor="let i of [0,1,2,3,4,5]"
                    type="text"
                    maxlength="1"
                    class="otp-input"
                    [class.filled]="otpDigits[i]"
                    [(ngModel)]="otpDigits[i]"
                    (input)="onOtpInput($event, i)"
                    (keydown)="onOtpKeydown($event, i)"
                    (paste)="onOtpPaste($event)"
                    [id]="'otp-' + i"
                  >
                </div>

                <!-- Timer & Resend -->
                <div class="otp-actions">
                  <p class="otp-timer" *ngIf="resendCountdown() > 0">
                    {{ 'auth.resendCodeIn' | translate }} <strong>{{ formatTime(resendCountdown()) }}</strong>
                  </p>
                  <button 
                    type="button" 
                    class="btn-resend" 
                    *ngIf="resendCountdown() === 0"
                    (click)="resendOTP()"
                    [disabled]="isLoading()"
                  >
                    <i class="gi gi-arrow-repeat" aria-hidden="true"></i>
                    {{ 'auth.resendCode' | translate }}
                  </button>
                </div>

                <!-- Verify Button -->
                <button 
                  type="button" 
                  class="btn btn-primary btn-block"
                  (click)="verifyOTP()"
                  [disabled]="getOtpString().length !== 6 || isLoading()"
                >
                  <span *ngIf="!isLoading()">{{ 'auth.verifyAndCreate' | translate }}</span>
                  <span *ngIf="isLoading()" class="btn-loading">
                    <span class="spinner"></span>
                    {{ 'auth.verifying' | translate }}...
                  </span>
                </button>

                <!-- Back Button -->
                <button type="button" class="btn-back" (click)="goBack()">
                  <i class="gi gi-arrow-left" aria-hidden="true"></i>
                  {{ 'auth.backToRegistration' | translate }}
                </button>

                <!-- Dev OTP Display -->
                <div class="dev-otp" *ngIf="devOTP()">
                  <strong>{{ 'auth.devOtp' | translate }}:</strong> {{ devOTP() }}
                </div>
              </div>

              <!-- Step 3: Success -->
              <div *ngIf="currentStep() === 'success'" class="success-section">
                <div class="success-icon">
                  <i class="gi gi-check-circle-fill" aria-hidden="true"></i>
                </div>
                <h3>{{ 'auth.accountCreatedTitle' | translate }}</h3>
                <p>{{ 'auth.accountCreatedDesc' | translate }}</p>
                <button type="button" class="btn btn-primary btn-block" (click)="goToHome()">
                  {{ 'auth.startShopping' | translate }}
                </button>
              </div>
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
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
      color: #ffffff;
    }

    .hero-small .intro-excerpt p {
      opacity: 0.9;
      color: rgba(255, 255, 255, 0.9);
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

    .progress-steps {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1.7rem;
      padding: 0.6rem 0;
    }

    .step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.45rem;
    }

    .step-icon {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--nm-bg);
      color: var(--nm-muted);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.9rem;
      box-shadow:
        5px 5px 12px var(--nm-shadow-dark),
        -5px -5px 12px var(--nm-shadow-light);
    }

    .step-icon i {
      font-size: 16px;
      width: 16px;
      height: 16px;
      display: inline-flex;
    }

    .step.active .step-icon {
      color: var(--nm-accent);
      box-shadow:
        inset 4px 4px 9px var(--nm-shadow-dark),
        inset -4px -4px 9px var(--nm-shadow-light);
    }

    .step.completed .step-icon {
      color: var(--nm-success);
    }

    .step span {
      font-size: 0.78rem;
      color: var(--nm-muted);
    }

    .step.active span,
    .step.completed span {
      color: var(--nm-fg);
      font-weight: 500;
    }

    .step-line {
      width: 58px;
      height: 2px;
      margin: 0 0.4rem 1.45rem;
      background: rgba(107, 114, 128, 0.35);
      transition: background 0.3s ease;
    }

    .step-line.active {
      background: var(--nm-accent);
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

    .optional {
      font-weight: 400;
      color: var(--nm-muted);
    }

    .input-icon-wrapper {
      position: relative;
    }

    .input-icon-wrapper i {
      position: absolute;
      left: 16px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--nm-muted);
      z-index: 1;
      font-size: 18px;
      width: 18px;
      height: 18px;
      display: inline-flex;
    }

    .input-icon-wrapper .form-control {
      padding-left: 48px;
      padding-right: 48px;
    }

    .password-toggle {
      position: absolute;
      right: 16px;
      top: 50%;
      transform: translateY(-50%);
      background: #ffffff;
      border: 1px solid #dde8df;
      cursor: pointer;
      color: var(--nm-muted);
      width: 30px;
      height: 30px;
      padding: 0;
      line-height: 1;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2;
      box-shadow: 0 4px 10px rgba(25, 49, 40, 0.08);
    }

    .password-toggle:hover {
      color: var(--nm-accent);
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

    .password-strength {
      margin-top: 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.65rem;
    }

    .strength-bar {
      flex: 1;
      height: 6px;
      background: var(--nm-bg);
      border-radius: 4px;
      overflow: hidden;
      box-shadow:
        inset 3px 3px 6px var(--nm-shadow-dark),
        inset -3px -3px 6px var(--nm-shadow-light);
    }

    .strength-fill {
      height: 100%;
      transition: all 0.3s ease;
      border-radius: 4px;
    }

    .strength-text {
      font-size: 0.75rem;
      font-weight: 600;
    }

    .alert {
      display: flex;
      align-items: center;
      gap: 0.7rem;
      padding: 0.9rem 1rem;
      border-radius: var(--nm-radius-md);
      margin-bottom: 1.2rem;
      font-size: 0.88rem;
      background: #fff1f4;
      color: #a14258;
      border: 1px solid #f2c6d0;
    }

    .custom-checkbox {
      display: flex;
      align-items: center;
      cursor: pointer;
      font-size: 0.86rem;
      color: var(--nm-muted);
      line-height: 1.2;
    }

    .custom-checkbox input {
      display: none;
    }

    .checkmark {
      width: 20px;
      height: 20px;
      min-width: 20px;
      border: 1px solid #cdddcf;
      border-radius: 6px;
      margin-right: 0.75rem;
      position: relative;
      background: #ffffff;
    }

    .terms-text {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      white-space: nowrap;
      flex-wrap: nowrap;
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

    .terms-link {
      color: var(--nm-accent);
      text-decoration: none;
      white-space: nowrap;
    }

    .terms-link:hover {
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

    .auth-divider {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      margin: 1.1rem 0 0.75rem;
      color: var(--nm-muted);
      font-size: 0.9rem;
      font-weight: 500;
    }

    .auth-divider::before,
    .auth-divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: rgba(107, 114, 128, 0.35);
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
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .auth-footer {
      text-align: center;
      margin-top: 1.3rem;
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

    .otp-section {
      text-align: center;
    }

    .otp-header {
      margin-bottom: 1.8rem;
    }

    .otp-icon {
      width: 78px;
      height: 78px;
      background: var(--nm-bg);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.2rem;
      color: var(--nm-accent);
      box-shadow:
        8px 8px 18px var(--nm-shadow-dark),
        -8px -8px 18px var(--nm-shadow-light);
    }

    .otp-icon i {
      font-size: 46px;
      width: 46px;
      height: 46px;
      display: inline-flex;
    }

    .otp-header h3 {
      font-size: 1.35rem;
      margin-bottom: 0.45rem;
      color: var(--nm-fg);
    }

    .otp-header p {
      color: var(--nm-muted);
      font-size: 0.93rem;
    }

    .otp-header strong {
      color: var(--nm-accent);
    }

    .otp-input-group {
      display: flex;
      justify-content: center;
      gap: 0.7rem;
      margin-bottom: 1.4rem;
    }

    .otp-input {
      width: 48px;
      height: 56px;
      text-align: center;
      font-size: 1.45rem;
      font-weight: 600;
      border: none;
      border-radius: var(--nm-radius-md);
      background: var(--nm-bg);
      color: var(--nm-fg);
      box-shadow:
        inset 4px 4px 9px var(--nm-shadow-dark),
        inset -4px -4px 9px var(--nm-shadow-light);
      transition: all 0.2s ease;
    }

    .otp-input:focus {
      outline: none;
      box-shadow:
        inset 5px 5px 10px var(--nm-shadow-dark),
        inset -5px -5px 10px var(--nm-shadow-light),
        0 0 0 2px rgba(108, 99, 255, 0.35);
    }

    .otp-input.filled {
      color: var(--nm-accent);
    }

    .otp-actions {
      margin-bottom: 1.4rem;
    }

    .otp-timer {
      color: var(--nm-muted);
      font-size: 0.9rem;
    }

    .btn-resend {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      border: none;
      background: var(--nm-bg);
      color: var(--nm-accent);
      font-weight: 600;
      cursor: pointer;
      padding: 0.55rem 1rem;
      border-radius: 12px;
      box-shadow:
        5px 5px 11px var(--nm-shadow-dark),
        -5px -5px 11px var(--nm-shadow-light);
      transition: all 0.2s ease;
    }

    .btn-resend i,
    .btn-back i {
      font-size: 16px;
      width: 16px;
      height: 16px;
      display: inline-flex;
    }

    .btn-resend:hover:not(:disabled) {
      color: var(--nm-accent-light);
    }

    .btn-resend:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }

    .btn-back {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: none;
      border: none;
      color: var(--nm-muted);
      font-size: 0.9rem;
      cursor: pointer;
      margin-top: 1rem;
      padding: 0.5rem;
      transition: color 0.2s ease;
    }

    .btn-back:hover {
      color: var(--nm-accent);
    }

    .dev-otp {
      margin-top: 1.35rem;
      padding: 0.75rem 1rem;
      background: #e6ecef;
      border-radius: 10px;
      font-size: 0.84rem;
      color: var(--nm-fg);
      box-shadow:
        inset 3px 3px 8px var(--nm-shadow-dark),
        inset -3px -3px 8px var(--nm-shadow-light);
    }

    .success-section {
      text-align: center;
      padding: 1.6rem 0;
    }

    .success-icon {
      color: var(--nm-success);
      margin-bottom: 1.1rem;
    }

    .success-icon i {
      font-size: 64px;
      width: 64px;
      height: 64px;
      display: inline-flex;
    }

    .success-section h3 {
      font-size: 1.45rem;
      margin-bottom: 0.5rem;
      color: var(--nm-fg);
    }

    .success-section p {
      color: var(--nm-muted);
      margin-bottom: 1.9rem;
    }

    .google-btn-container {
      width: 100%;
      display: flex;
      justify-content: center;
      margin-top: 0.2rem;
    }

    .google-btn-container > div {
      width: 100% !important;
    }

    .social-login {
      display: flex;
      gap: 0.9rem;
      margin-top: 1rem;
    }

    .btn-social {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      height: 48px;
      border: none;
      border-radius: var(--nm-radius-md);
      background: var(--nm-bg);
      color: var(--nm-fg);
      font-weight: 500;
      font-size: 0.9rem;
      cursor: pointer;
      box-shadow:
        6px 6px 14px var(--nm-shadow-dark),
        -6px -6px 14px var(--nm-shadow-light);
      transition: all 0.25s ease;
    }

    .btn-social:hover {
      color: var(--nm-accent);
      transform: translateY(-1px);
    }

    @media (max-width: 576px) {
      .hero-small {
        padding: 2.5rem 0 1rem;
      }

      .auth-card {
        padding: 1.4rem;
        border-radius: 18px;
      }

      .otp-input {
        width: 42px;
        height: 50px;
        font-size: 1.25rem;
      }

      .otp-input-group {
        gap: 0.5rem;
      }

      .custom-checkbox {
        align-items: flex-start;
      }

      .terms-text {
        white-space: normal;
        flex-wrap: wrap;
        row-gap: 0.2rem;
      }

      .social-login {
        flex-direction: column;
      }
    }
  `]
})
export class RegisterComponent implements OnDestroy, AfterViewInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private countdownInterval: any;

  @ViewChild('googleBtn') googleBtnRef!: ElementRef;

  registerData = {
    name: '',
    email: '',
    password: '',
    phone: ''
  };
  confirmPassword = '';
  acceptTerms = false;
  showPassword = signal(false);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  currentStep = signal<RegistrationStep>('form');
  otpDigits: string[] = ['', '', '', '', '', ''];
  resendCountdown = signal(0);
  devOTP = signal<string | null>(null);
  googleClientId = this.authService.googleClientId;

  constructor() {
    // Watch for googleClientId changes and initialize button when ready
    effect(() => {
      const clientId = this.googleClientId();
      if (clientId && this.googleBtnRef?.nativeElement) {
        setTimeout(() => {
          this.authService.initializeGoogleSignIn(
            this.googleBtnRef.nativeElement,
            (response: any) => this.handleGoogleSignIn(response)
          );
        }, 100);
      }
    });
  }

  ngAfterViewInit(): void {
    // Try to initialize Google Sign-In if clientId is already available
    if (this.googleClientId() && this.googleBtnRef?.nativeElement) {
      setTimeout(() => {
        this.authService.initializeGoogleSignIn(
          this.googleBtnRef.nativeElement,
          (response: any) => this.handleGoogleSignIn(response)
        );
      }, 100);
    }
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  getPasswordStrength(): { width: string; color: string; label: string } {
    const password = this.registerData.password;
    if (!password) return { width: '0%', color: '#e9ecef', label: '' };
    
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) return { width: '20%', color: '#dc2626', label: this.translate.instant('auth.passwordStrength.weak') };
    if (score <= 2) return { width: '40%', color: '#f59e0b', label: this.translate.instant('auth.passwordStrength.fair') };
    if (score <= 3) return { width: '60%', color: '#eab308', label: this.translate.instant('auth.passwordStrength.good') };
    if (score <= 4) return { width: '80%', color: '#22c55e', label: this.translate.instant('auth.passwordStrength.strong') };
    return { width: '100%', color: '#10b981', label: this.translate.instant('auth.passwordStrength.veryStrong') };
  }

  getHeroTitle(): string {
    switch (this.currentStep()) {
      case 'form': return this.translate.instant('auth.hero.createAccountTitle');
      case 'otp': return this.translate.instant('auth.hero.verifyEmailTitle');
      case 'success': return this.translate.instant('auth.hero.welcomeTitle');
      default: return this.translate.instant('auth.hero.createAccountTitle');
    }
  }

  getHeroSubtitle(): string {
    switch (this.currentStep()) {
      case 'form': return this.translate.instant('auth.hero.createAccountSubtitle');
      case 'otp': return this.translate.instant('auth.hero.verifyEmailSubtitle');
      case 'success': return this.translate.instant('auth.hero.welcomeSubtitle');
      default: return '';
    }
  }

  onSubmitForm(): void {
    if (!this.registerData.name || !this.registerData.email || !this.registerData.password) return;
    if (this.confirmPassword !== this.registerData.password) return;
    if (!this.acceptTerms) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.initiateRegister(this.registerData).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        if (response.success) {
          this.currentStep.set('otp');
          this.startResendCountdown();
          if (response.devOTP) {
            this.devOTP.set(response.devOTP);
          }
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.error || this.translate.instant('auth.error.registrationFailed'));
      }
    });
  }

  // OTP Input handling
  onOtpInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`) as HTMLInputElement;
      if (nextInput) nextInput.focus();
    }
  }

  onOtpKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace' && !this.otpDigits[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`) as HTMLInputElement;
      if (prevInput) prevInput.focus();
    }
  }

  onOtpPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text') || '';
    const digits = pastedData.replace(/\D/g, '').slice(0, 6).split('');
    
    digits.forEach((digit, index) => {
      this.otpDigits[index] = digit;
    });

    const lastFilledIndex = Math.min(digits.length - 1, 5);
    const lastInput = document.getElementById(`otp-${lastFilledIndex}`) as HTMLInputElement;
    if (lastInput) lastInput.focus();
  }

  getOtpString(): string {
    return this.otpDigits.join('');
  }

  verifyOTP(): void {
    const otp = this.getOtpString();
    if (otp.length !== 6) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.verifyOTPAndRegister({
      email: this.registerData.email,
      otp
    }).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        if (response.success) {
          this.currentStep.set('success');
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.error || this.translate.instant('auth.error.verificationFailed'));
        // Clear OTP inputs
        this.otpDigits = ['', '', '', '', '', ''];
        const firstInput = document.getElementById('otp-0') as HTMLInputElement;
        if (firstInput) firstInput.focus();
      }
    });
  }

  resendOTP(): void {
    this.isLoading.set(true);
    this.authService.resendOTP(this.registerData.email).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        this.startResendCountdown();
        if (response.devOTP) {
          this.devOTP.set(response.devOTP);
        }
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  startResendCountdown(): void {
    this.resendCountdown.set(60);
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    this.countdownInterval = setInterval(() => {
      this.resendCountdown.update(v => {
        if (v <= 1) {
          clearInterval(this.countdownInterval);
          return 0;
        }
        return v - 1;
      });
    }, 1000);
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  goBack(): void {
    this.currentStep.set('form');
    this.otpDigits = ['', '', '', '', '', ''];
    this.errorMessage.set(null);
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  goToHome(): void {
    this.router.navigate(['/']);
  }

  // Google Sign-In
  handleGoogleSignIn(response: any): void {
    if (response.credential) {
      this.isLoading.set(true);
      this.errorMessage.set(null);

      this.authService.googleSignIn(response.credential).subscribe({
        next: (res) => {
          this.isLoading.set(false);
          if (res.success) {
            this.currentStep.set('success');
          }
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(err.error?.error || this.translate.instant('auth.error.googleSignInFailed'));
        }
      });
    }
  }
}
