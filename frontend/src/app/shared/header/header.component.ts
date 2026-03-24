import { Component, HostListener, OnDestroy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';
import { CartService } from '@core/services/cart.service';
import { AuthService } from '@core/services/auth.service';
import { LanguageSwitcherComponent } from '@core/components/language-switcher/language-switcher.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, LanguageSwitcherComponent],
  template: `
    <nav class="minimal-nav" [class.nav-hidden]="!isHeaderVisible">
      <div class="nav-inner">

        <a class="logo-wrap" routerLink="/">
          <div class="logo-tab">
            <img src="assets/images/P-logo.png" alt="Ponsai" class="logo-img">
          </div>
        </a>

        <!-- Hamburger Icon for Mobile -->
        <div class="hamburger-menu" (click)="toggleMobileMenu()">
          <i class="bi" [class.bi-list]="!isMobileMenuOpen" [class.bi-x]="isMobileMenuOpen" style="font-size: 1.5rem;"></i>
        </div>

        <ul class="nav-links" [class.mobile-open]="isMobileMenuOpen">
          <li routerLinkActive="link-active" [routerLinkActiveOptions]="{exact: true}">
            <a routerLink="/">{{ 'nav.home' | translate }}</a>
          </li>
          <li routerLinkActive="link-active"><a routerLink="/shop">{{ 'nav.products' | translate }}</a></li>
          <li routerLinkActive="link-active"><a routerLink="/about">{{ 'nav.about' | translate }}</a></li>
          <li routerLinkActive="link-active"><a routerLink="/services">{{ 'nav.services' | translate }}</a></li>
          <li routerLinkActive="link-active"><a routerLink="/blog">Blog</a></li>
          <li routerLinkActive="link-active"><a routerLink="/about" [queryParams]="{ contact: '1' }">{{ 'nav.contact' | translate }}</a></li>
        </ul>

        <ul class="nav-actions">
          <li class="lang-wrap" aria-label="Language switcher">
            <app-language-switcher></app-language-switcher>
          </li>

          <li class="user-dd" *ngIf="isAuthenticated()">
            <a class="user-trigger" href="#" (click)="$event.preventDefault()"
               data-bs-toggle="dropdown" role="button" aria-expanded="false">
              <i *ngIf="!currentUser()?.avatar" class="gi gi-admin-users" aria-hidden="true"></i>
              <img *ngIf="currentUser()?.avatar" [src]="currentUser()?.avatar" class="user-av-img" [alt]="currentUser()?.name">
            </a>
            <ul class="dd-menu dropdown-menu dropdown-menu-end">
              <li class="dd-profile-card">
                <div class="dd-profile-avatar">
                  <img *ngIf="currentUser()?.avatar" [src]="currentUser()?.avatar" [alt]="currentUser()?.name">
                  <i *ngIf="!currentUser()?.avatar" class="gi gi-admin-users" aria-hidden="true"></i>
                </div>
                <div class="dd-profile-meta">
                  <strong>{{ currentUser()?.name }}</strong>
                </div>
              </li>
              <li><hr class="dd-divider"></li>
              <li>
                <a class="dd-item dd-item-icon" routerLink="/profile">
                  <i class="gi gi-admin-settings" aria-hidden="true"></i>
                  <span>My Account</span>
                </a>
              </li>
              <li>
                <a class="dd-item dd-item-icon" routerLink="/profile" [queryParams]="{tab: 'orders'}">
                  <i class="gi gi-files" aria-hidden="true"></i>
                  <span>My Orders</span>
                </a>
              </li>
              <li><hr class="dd-divider"></li>
              <li>
                <a class="dd-item dd-item-icon dd-danger" (click)="logout()" style="cursor:pointer">
                  <i class="gi gi-ui-delete" aria-hidden="true"></i>
                  <span>Sign Out</span>
                </a>
              </li>
            </ul>
          </li>

          <li *ngIf="!isAuthenticated()">
            <a routerLink="/auth/login">
              <i class="gi gi-admin-users" aria-hidden="true"></i>
            </a>
          </li>

          <li class="cart-wrap">
            <a routerLink="/cart">
              <i class="gi gi-cart-plus" aria-hidden="true"></i>
              <span *ngIf="cartItemCount() > 0" class="cart-badge">{{ cartItemCount() }}</span>
            </a>
          </li>
        </ul>

      </div>
    </nav>
  `,
  styles: [`
    .minimal-nav {
      position: fixed;
      top: 1rem;
      left: 0;
      width: 100%;
      z-index: 3000;
      font-family: Inter, sans-serif;
      padding: 0 1.5rem;
      transform: translateY(0);
      transition: transform 0.28s ease;
    }

    .minimal-nav.nav-hidden {
      transform: translateY(-140%);
    }

    .nav-inner {
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: center;
      max-width: 1400px;
      margin: 0 auto;
      padding: 0 1.35rem 0 1.55rem;
      height: 72px;
      position: relative;
      border-radius: 999px;
      background: linear-gradient(130deg, rgba(255, 255, 255, 0.34), rgba(255, 255, 255, 0.14));
      border: 1px solid rgba(255, 255, 255, 0.55);
      backdrop-filter: blur(16px) saturate(1.2);
      -webkit-backdrop-filter: blur(16px) saturate(1.2);
      box-shadow: 0 18px 36px rgba(12, 27, 44, 0.2);
    }

    .logo-wrap {
      position: static;
      text-decoration: none;
      margin-right: 1rem;
    }

    .logo-tab {
      width: auto;
      height: 72px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .logo-img {
      height: 48px;
      width: auto;
      object-fit: contain;
    }

    .hamburger-menu {
      display: none;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      align-items: center;
      justify-content: center;
      color: rgba(11, 30, 48, 0.85);
      background: rgba(255, 255, 255, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.65);
      cursor: pointer;
      justify-self: center;
    }

    .nav-links {
      display: flex;
      list-style: none;
      justify-content: center;
      align-items: center;
      gap: clamp(0.65rem, 1.4vw, 1.75rem);
      margin: 0;
      padding: 0;
      width: 100%;
    }

    .nav-links li a {
      font-size: 0.9rem;
      font-weight: 700;
      color: rgba(16, 32, 48, 0.58);
      text-decoration: none;
      letter-spacing: 0.02em;
      transition: all 0.2s ease;
      padding: 0.52rem 0.68rem;
      border-radius: 999px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      white-space: nowrap;
    }

    .nav-links li a:hover {
      color: rgba(7, 25, 42, 0.95);
      background: rgba(255, 255, 255, 0.95);
      box-shadow: 0 4px 12px rgba(16, 34, 52, 0.12);
    }

    .nav-links li.link-active a {
      color: var(--deep-space-blue);
      background: rgba(255, 255, 255, 0.72);
      box-shadow: 0 2px 9px rgba(16, 34, 52, 0.08);
    }

    .nav-actions {
      display: flex;
      align-items: center;
      list-style: none;
      gap: 0.55rem;
      margin: 0;
      padding: 0;
      justify-self: end;
    }

    .nav-actions > li > a {
      display: flex;
      align-items: center;
      justify-content: center;
      text-decoration: none;
      color: rgba(11, 30, 48, 0.58);
      opacity: 1;
      transition: all 0.2s ease;
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.34);
      border: 1px solid rgba(255, 255, 255, 0.5);
    }

    .nav-actions > li > a:hover {
      color: rgba(11, 30, 48, 0.95);
      background: rgba(255, 255, 255, 0.95);
      box-shadow: 0 4px 12px rgba(16, 34, 52, 0.12);
    }

    .lang-wrap {
      display: flex;
      align-items: center;
      margin-right: 0.2rem;
    }

    .cart-wrap {
      position: relative;
    }

    .cart-badge {
      position: absolute;
      top: -8px;
      right: -10px;
      background: var(--deep-space-blue);
      color: #fff;
      font-size: 0.55rem;
      font-weight: 600;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .user-av-img {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      object-fit: cover;
    }

    .user-dd {
      position: relative;
    }

    .dd-menu {
      width: 260px;
      padding: 0.45rem 0;
      border: none;
      border-radius: 0;
      background: #ffffff;
      box-shadow: 0 18px 40px rgba(12, 28, 44, 0.18);
      overflow: hidden;
      margin-top: 0.75rem;
    }

    .dd-profile-card {
      display: flex;
      align-items: center;
      gap: 0.9rem;
      padding: 0.95rem 1rem 0.85rem;
    }

    .dd-profile-avatar {
      width: 54px;
      height: 54px;
      border-radius: 2px;
      overflow: hidden;
      background: #f1f3f6;
      display: flex;
      align-items: center;
      justify-content: center;
      flex: 0 0 54px;
      color: #6c7280;
      font-size: 1.2rem;
    }

    .dd-profile-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .dd-profile-meta {
      display: flex;
      flex-direction: column;
      gap: 0;
      min-width: 0;
      flex: 1;
    }

    .dd-profile-meta strong {
      font-size: 0.98rem;
      font-weight: 700;
      color: #3b4047;
      line-height: 1.2;
    }

    .dd-item {
      padding: 0.9rem 1rem;
      color: #4a4f57;
      text-decoration: none;
      display: flex;
      font-size: 0.9rem;
      width: 100%;
      height: auto;
      background: transparent;
      border: none;
      border-radius: 0;
      box-shadow: none;
    }

    .dd-item:hover {
      background: #f5f6f8;
      color: #1b2d3d;
    }

    .dd-item-icon {
      display: flex;
      align-items: center;
      gap: 0.8rem;
      font-weight: 500;
    }

    .dd-item-icon i {
      color: #9b9b9b;
      font-size: 1rem;
      flex: 0 0 1rem;
    }

    .dd-danger {
      color: #c1121f !important;
    }

    .dd-danger i {
      color: currentColor !important;
    }

    .dd-divider {
      margin: 0.2rem 0;
      border: none;
      border-top: 1px solid #eceef1;
    }

    @media (max-width: 1200px) {
      .logo-img {
        height: 43px;
      }

      .nav-links li a {
        padding: 0.48rem 0.22rem;
        font-size: 0.83rem;
      }

      .nav-links {
        gap: 0.9rem;
      }
    }

    @media (max-width: 992px) {
      .minimal-nav {
        padding: 0 0.75rem;
      }

      .nav-inner {
        height: 64px;
        padding: 0 0.75rem 0 0.95rem;
      }

      .logo-tab {
        height: 64px;
      }

      .logo-img {
        height: 38px;
      }

      .nav-links {
        gap: 0.65rem;
      }

      .nav-links li a {
        padding: 0.42rem 0.15rem;
        font-size: 0.76rem;
      }
    }

    @media (max-width: 860px) {
      .nav-inner {
        grid-template-columns: auto auto auto;
        padding: 0 0.75rem;
      }

      .hamburger-menu {
        display: inline-flex;
      }

      .nav-links {
        position: absolute;
        top: calc(100% + 10px);
        left: 0;
        right: 0;
        display: none;
        flex-direction: column;
        align-items: stretch;
        gap: 0.3rem;
        padding: 0.85rem;
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.92);
        border: 1px solid rgba(255, 255, 255, 0.85);
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
        box-shadow: 0 16px 28px rgba(16, 34, 52, 0.18);
      }

      .nav-links.mobile-open {
        display: flex;
      }

      .nav-links li a {
        justify-content: flex-start;
      }

      .nav-actions {
        gap: 0.35rem;
      }
    }
  `]
})
export class HeaderComponent implements OnDestroy {
  private cartService = inject(CartService);
  private authService = inject(AuthService);

  isMobileMenuOpen = false;
  isHeaderVisible = true;
  private lastScrollY = 0;
  private hideTimeoutId: ReturnType<typeof setTimeout> | null = null;

  cartItemCount = computed(() => this.cartService.getItemCount());
  currentUser = toSignal(this.authService.currentUser$, {
    initialValue: this.authService.currentUser()
  });

  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  logout(): void {
    this.authService.logout();
  }

  ngOnDestroy(): void {
    this.clearHideTimer();
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    const currentScrollY = window.scrollY || 0;

    if (currentScrollY <= 70) {
      this.isHeaderVisible = true;
      this.clearHideTimer();
      this.lastScrollY = currentScrollY;
      return;
    }

    if (this.isMobileMenuOpen) {
      this.isHeaderVisible = true;
      this.clearHideTimer();
      this.lastScrollY = currentScrollY;
      return;
    }

    const isScrollingUp = currentScrollY < this.lastScrollY;
    if (isScrollingUp) {
      this.isHeaderVisible = true;
      this.clearHideTimer();
    } else {
      this.isHeaderVisible = true;
      this.scheduleAutoHide();
    }

    this.lastScrollY = currentScrollY;
  }

  @HostListener('window:mousemove', ['$event'])
  onWindowMouseMove(event: MouseEvent): void {
    if (event.clientY <= 90) {
      this.isHeaderVisible = true;
      if (!this.isMobileMenuOpen) {
        this.scheduleAutoHide();
      }
    }
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    this.isHeaderVisible = true;

    if (this.isMobileMenuOpen) {
      this.clearHideTimer();
    } else if ((window.scrollY || 0) > 70) {
      this.scheduleAutoHide();
    }
  }

  private scheduleAutoHide(): void {
    this.clearHideTimer();
    this.hideTimeoutId = window.setTimeout(() => {
      if (!this.isMobileMenuOpen && (window.scrollY || 0) > 70) {
        this.isHeaderVisible = false;
      }
    }, 2300);
  }

  private clearHideTimer(): void {
    if (this.hideTimeoutId !== null) {
      window.clearTimeout(this.hideTimeoutId);
      this.hideTimeoutId = null;
    }
  }
}
