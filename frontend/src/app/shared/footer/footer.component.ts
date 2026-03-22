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
          <div class="cta d-block d-md-flex align-items-center px-4 px-lg-5">
            <div>
              <h2 class="mb-0">{{ 'footer.newsletter' | translate }}</h2>
              <h3>{{ 'footer.description' | translate }}</h3>
            </div>
            <div class="ms-md-auto mt-3 mt-md-0">
              <a routerLink="/contact" class="btn btn-dark rounded-0 py-3 px-4 px-lg-5">{{ 'footer.contactUs' | translate }}</a>
            </div>
          </div>

          <div class="row g-4 footer-content">
            <div class="col-12 col-sm-6 col-lg-3">
              <a routerLink="/" class="footer-logo">
                <img src="assets/images/logo.png" alt="Ponsai Logo" class="footer-brand-logo">
              </a>
              <p class="copyright mb-0">
                <small>© {{ currentYear }} Ponsai</small>
              </p>
            </div>

            <div class="col-6 col-sm-6 col-lg-2">
              <h3>{{ 'footer.aboutUs' | translate }}</h3>
              <ul class="list-unstyled links mb-0">
                <li><a routerLink="/about">{{ 'footer.aboutUs' | translate }}</a></li>
                <li><a routerLink="/services">{{ 'nav.services' | translate }}</a></li>
                <li><a routerLink="/blog">Blog</a></li>
                <li><a routerLink="/contact">{{ 'footer.contactUs' | translate }}</a></li>
              </ul>
            </div>

            <div class="col-6 col-sm-6 col-lg-2">
              <h3>{{ 'footer.support' | translate }}</h3>
              <ul class="list-unstyled links mb-0">
                <li><a href="#">{{ 'footer.support' | translate }}</a></li>
                <li><a href="#">{{ 'footer.knowledge' | translate }}</a></li>
                <li><a href="#">{{ 'footer.liveChat' | translate }}</a></li>
              </ul>
            </div>

            <div class="col-6 col-sm-6 col-lg-2">
              <h3>{{ 'footer.ourTeam' | translate }}</h3>
              <ul class="list-unstyled links mb-0">
                <li><a href="#">{{ 'footer.jobs' | translate }}</a></li>
                <li><a href="#">{{ 'footer.ourTeam' | translate }}</a></li>
                <li><a href="#">{{ 'footer.leadership' | translate }}</a></li>
                <li><a href="#">{{ 'footer.privacyPolicy' | translate }}</a></li>
              </ul>
            </div>

            <div class="col-6 col-sm-6 col-lg-3">
              <h3>{{ 'footer.followUs' | translate }}</h3>
              <ul class="list-unstyled social mb-3">
                <li><a href="#" aria-label="Facebook"><span class="fa fa-brands fa-facebook-f"></span></a></li>
                <li><a href="#" aria-label="Twitter"><span class="fa fa-brands fa-twitter"></span></a></li>
                <li><a href="#" aria-label="Instagram"><span class="fa fa-brands fa-instagram"></span></a></li>
                <li><a href="#" aria-label="LinkedIn"><span class="fa fa-brands fa-linkedin"></span></a></li>
                <li><a href="#" aria-label="Newsletter"><span class="fa fa-paper-plane"></span></a></li>
              </ul>
              <ul class="list-unstyled links mb-0">
                <li><a routerLink="/shop">{{ 'footer.bonsaiTrees' | translate }}</a></li>
                <li><a routerLink="/shop">{{ 'footer.pots' | translate }}</a></li>
                <li><a routerLink="/shop">{{ 'footer.tools' | translate }}</a></li>
                <li><a href="#">{{ 'footer.termsOfService' | translate }}</a></li>
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
      color: #fff;
      padding: 7rem 0 4rem;
      margin-top: 7rem;
      background-color: var(--deep-space-blue);
    }

    .footer-20192 .site-section {
      position: relative;
    }

    .footer-20192 .container {
      position: relative;
    }

    .footer-20192 .footer-content {
      margin-top: -5.25rem;
    }

    .footer-20192 h3 {
      font-size: 16px;
      margin-bottom: 10px;
      margin-top: 0;
      line-height: 1.5;
      color: #fff;
      font-weight: 600;
    }

    .footer-20192 .links li {
      margin-bottom: 10px;
      line-height: 1.5;
      display: block;
    }

    .footer-20192 .links li a {
      color: rgba(255, 255, 255, 0.65);
      text-decoration: none;
      transition: color 0.3s ease;
    }

    .footer-20192 .links li a:hover {
      color: #fff;
    }

    .footer-20192 .social {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
      padding-left: 0;
    }

    .footer-20192 .social li {
      display: inline-block;
      position: relative;
    }

    .footer-20192 .social li a {
      position: relative;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin: 0;
      padding: 0;
      background-color: var(--yale-blue);
      color: #fff;
      transition: all 0.3s ease;
    }

    .footer-20192 .social li a:hover {
      background-color: var(--lemon-lime);
      color: var(--deep-space-blue);
      transform: translateY(-2px);
    }

    .footer-20192 .footer-logo {
      color: #fff;
      font-size: 20px;
      letter-spacing: 0.1rem;
      text-decoration: none;
      display: inline-block;
      margin-bottom: 1rem;
    }

    .footer-brand-logo {
      height: 64px;
      width: auto;
      max-width: 240px;
      object-fit: cover;
      object-position: center;
      transform: scale(1.08);
      transform-origin: left center;
    }

    .footer-20192 .copyright {
      color: rgba(255, 255, 255, 0.6);
      margin-top: 0.75rem;
    }

    .footer-20192 .cta {
      box-shadow: -20px -20px 0 0 rgba(13, 31, 41, 0.25);
      padding: 24px;
      background-color: var(--yale-blue);
      max-width: 1120px;
      margin: 0 auto;
      top: -162px;
      position: relative;
      z-index: 1;
    }

    .footer-20192 .cta h2,
    .footer-20192 .cta h3 {
      line-height: 1.4;
      color: #fff;
      margin-bottom: 0;
    }

    .footer-20192 .cta h2 {
      font-size: 1.75rem;
      font-weight: 700;
      margin-bottom: 0.2rem;
    }

    .footer-20192 .cta h3 {
      font-size: 1.05rem;
      opacity: 0.9;
      font-weight: 500;
    }

    .footer-20192 .cta .btn.btn-dark {
      background-color: #111;
      border-color: #111;
      color: #fff;
      font-weight: 600;
      text-decoration: none;
      white-space: nowrap;
    }

    .footer-20192 .cta .btn.btn-dark:hover {
      background-color: #000;
      border-color: #000;
      transform: translateY(-1px);
    }

    @media (max-width: 991.98px) {
      .footer-20192 {
        margin-top: 5rem;
      }

      .footer-20192 .cta {
        top: -96px;
      }

      .footer-20192 .footer-content {
        margin-top: -3.5rem;
      }
    }

    @media (max-width: 767.98px) {
      .footer-20192 {
        padding-top: 5.5rem;
      }

      .footer-20192 .cta {
        top: -72px;
      }

      .footer-20192 .footer-content {
        margin-top: -1.5rem;
      }

      .footer-brand-logo {
        height: 56px;
      }
    }
  `]
})
export class FooterComponent {
  currentYear = new Date().getFullYear();
}
