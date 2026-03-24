import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  template: `
    <footer class="footer-20192">
      <div class="site-section">
        <div class="container">
          <div class="row g-4 footer-content">
            <div class="col-12 col-sm-6 col-lg-3">
              <a routerLink="/" class="footer-logo">
                <img src="assets/images/P-logo.png" alt="Ponsai Logo" class="footer-brand-logo">
              </a>
              <p class="copyright mb-0">
                <small>© {{ currentYear }} Ponsai</small>
              </p>
            </div>

            <div class="col-6 col-sm-6 col-lg-2">
              <h3>Company</h3>
              <ul class="list-unstyled links mb-0">
                <li><a routerLink="/about">{{ 'footer.aboutUs' | translate }}</a></li>
                <li><a routerLink="/services">{{ 'nav.services' | translate }}</a></li>
                <li><a routerLink="/blog">Blog</a></li>
                <li><a routerLink="/contact">{{ 'footer.contactUs' | translate }}</a></li>
              </ul>
            </div>

            <div class="col-6 col-sm-6 col-lg-2">
              <h3>Shopping</h3>
              <ul class="list-unstyled links mb-0">
                <li><a routerLink="/shop">{{ 'nav.products' | translate }}</a></li>
                <li><a routerLink="/cart">Cart</a></li>
                <li><a routerLink="/profile" [queryParams]="{tab: 'orders'}">My Orders</a></li>
              </ul>
            </div>

            <div class="col-6 col-sm-6 col-lg-2">
              <h3>Support</h3>
              <ul class="list-unstyled links mb-0">
                <li><a routerLink="/contact">Contact</a></li>
                <li><a routerLink="/services">Care Services</a></li>
                <li><a routerLink="/blog">Care Blog</a></li>
              </ul>
            </div>

            <div class="col-6 col-sm-6 col-lg-3">
              <h3>Quick Access</h3>
              <ul class="list-unstyled links mb-0">
                <li><a routerLink="/">Home</a></li>
                <li><a routerLink="/auth/login">Login</a></li>
                <li><a routerLink="/profile">Profile</a></li>
                <li><a routerLink="/admin">Admin</a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .footer-20192 {
      position: relative;
      color: #000;
      padding: clamp(1.5rem, 3vw, 2.2rem) 0;
      min-height: 25vh;
      margin-top: 4rem;
      display: flex;
      align-items: center;
      background-color: #beee62;
    }

    .footer-20192 .site-section {
      position: relative;
    }

    .footer-20192 .container {
      position: relative;
    }

    .footer-20192 .footer-content {
      margin-top: 0;
    }

    .footer-20192 h3 {
      font-size: 16px;
      margin-bottom: 10px;
      margin-top: 0;
      line-height: 1.5;
      color: #000;
      font-weight: 600;
    }

    .footer-20192 .links li {
      margin-bottom: 10px;
      line-height: 1.5;
      display: block;
    }

    .footer-20192 .links li a {
      color: #000;
      text-decoration: none;
      transition: color 0.3s ease;
    }

    .footer-20192 .links li a:hover {
      color: #fff;
    }

    .footer-20192 .footer-logo {
      color: #000;
      font-size: 20px;
      letter-spacing: 0.1rem;
      text-decoration: none;
      display: inline-block;
      margin-bottom: 0.6rem;
    }

    .footer-brand-logo {
      height: 56px;
      width: auto;
      max-width: 240px;
      object-fit: cover;
      object-position: center;
      transform: scale(1.08);
      transform-origin: left center;
    }

    .footer-20192 .copyright {
      color: rgba(0, 0, 0, 0.72);
      margin-top: 0.75rem;
    }

    @media (max-width: 991.98px) {
      .footer-20192 {
        margin-top: 3.5rem;
      }
    }

    @media (max-width: 767.98px) {
      .footer-20192 {
        min-height: auto;
        padding-top: 1.8rem;
      }

      .footer-brand-logo {
        height: 48px;
      }
    }
  `]
})
export class FooterComponent {
  currentYear = new Date().getFullYear();
}
