import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  template: `
    <div class="hero">
      <div class="container">
        <div class="row justify-content-between">
          <div class="col-lg-5">
            <div class="intro-excerpt">
              <h1>{{ 'about.title' | translate }}</h1>
              <p class="mb-4">{{ 'about.subtitle' | translate }}</p>
              <p class="hero-cta-group"><a routerLink="/shop" class="hero-cta-btn hero-cta-btn-primary">{{ 'about.browseCollection' | translate }}</a><a routerLink="/services" class="hero-cta-btn hero-cta-btn-secondary">{{ 'about.whatWeOffer' | translate }}<span aria-hidden="true">→</span></a><button type="button" class="hero-cta-btn hero-cta-btn-contact" (click)="openContactPopup()">{{ 'nav.contact' | translate }}</button></p>
            </div>
          </div>
          <div class="col-lg-7">
            <div class="hero-img-wrap">
              <img src="assets/images/couch.png" class="img-fluid" alt="Couch">
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="why-choose-section">
      <div class="container">
        <div class="row justify-content-between align-items-center">
          <div class="col-lg-6">
            <h2 class="section-title">{{ 'about.whatWeBelieve' | translate }}</h2>
            <p>{{ 'about.belief' | translate }}</p>
            <div class="row my-5">
              <div class="col-6 col-md-6" *ngFor="let feature of features">
                <div class="feature">
                  <div class="icon">
                    <img [src]="'assets/images/' + feature.icon" [alt]="feature.title | translate" class="imf-fluid">
                  </div>
                  <h3>{{ feature.title | translate }}</h3>
                  <p>{{ feature.description | translate }}</p>
                </div>
              </div>
            </div>
          </div>
          <div class="col-lg-5">
            <div class="img-wrap">
              <img src="assets/images/why-choose-us-img.jpg" alt="Why Choose Us" class="img-fluid">
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="contact-popup-backdrop" *ngIf="isContactPopupOpen()" (click)="closeContactPopup()">
      <div class="contact-popup" (click)="$event.stopPropagation()">
        <button type="button" class="contact-popup-close" (click)="closeContactPopup()" aria-label="Close contact popup">×</button>
        <h3 class="contact-popup-title">{{ 'footer.contactUs' | translate }}</h3>
        <p class="contact-popup-subtitle">Hãy để lại thông tin, đội ngũ Ponsai sẽ liên hệ trong thời gian sớm nhất.</p>

        <div class="contact-popup-info">
          <div class="info-chip"><i class="bi bi-geo-alt-fill"></i><span>1428 Industrial Way, Portland, OR 97209</span></div>
          <div class="info-chip"><i class="bi bi-envelope-fill"></i><span>care&#64;ponsai.co</span></div>
          <div class="info-chip"><i class="bi bi-telephone-fill"></i><span>+1 (503) 555-0142</span></div>
        </div>

        <form class="contact-popup-form">
          <div class="row g-3">
            <div class="col-12 col-md-6">
              <input type="text" class="form-control popup-input" placeholder="First name">
            </div>
            <div class="col-12 col-md-6">
              <input type="text" class="form-control popup-input" placeholder="Last name">
            </div>
            <div class="col-12">
              <input type="email" class="form-control popup-input" placeholder="Email">
            </div>
            <div class="col-12">
              <textarea class="form-control popup-input popup-textarea" rows="4" placeholder="Message"></textarea>
            </div>
          </div>
          <button type="button" class="popup-submit">Send Message</button>
        </form>
      </div>
    </div>

  `,
  styles: [`
    .hero {
      position: relative;
      background-image: url('/assets/images/banner2.jpg');
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      overflow: hidden;
    }

    .hero::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(90deg, rgba(21, 50, 67, 0.74) 0%, rgba(21, 50, 67, 0.5) 38%, rgba(21, 50, 67, 0.2) 70%, rgba(21, 50, 67, 0.06) 100%);
      z-index: 1;
    }

    .hero .container {
      position: relative;
      z-index: 2;
    }

    .hero .intro-excerpt {
      max-width: 560px;
    }

    .hero .hero-img-wrap {
      display: none;
    }

    .hero-cta-group {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 0;
    }

    .hero-cta-btn {
      position: relative;
      min-width: 164px;
      height: 48px;
      padding: 0 1.6rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 999px;
      background: #24272d;
      color: #fff;
      text-decoration: none;
      font-weight: 700;
      letter-spacing: 0.01em;
      z-index: 0;
    }

    .hero-cta-btn::before {
      content: '';
      position: absolute;
      inset: -1px;
      border-radius: inherit;
      background: linear-gradient(-45deg, #e81cff 0%, #40c9ff 100%);
      z-index: -2;
      transition: transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    .hero-cta-btn::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      background: #24272d;
      z-index: -1;
      box-shadow: 0 18px 28px rgba(10, 16, 30, 0.22);
    }

    .hero-cta-btn:hover {
      color: #fff;
    }

    .hero-cta-btn:hover::before {
      transform: rotate(-180deg);
    }

    .hero-cta-btn:active::before {
      transform: scale(0.92);
    }

    .hero-cta-btn-secondary {
      min-width: auto;
      background: transparent;
      color: #ffc107;
      padding: 0;
      height: auto;
      border-radius: 0;
      gap: 0.5rem;
      font-weight: 700;
    }

    .hero-cta-btn-secondary::before,
    .hero-cta-btn-secondary::after {
      display: none;
    }

    .hero-cta-btn-secondary:hover {
      color: #ffd24a;
    }

    .hero-cta-btn-contact {
      background: #153243;
      color: #fff;
      border: 1px solid rgba(255, 255, 255, 0.45);
    }

    .hero-cta-btn-contact::before,
    .hero-cta-btn-contact::after {
      display: none;
    }

    .hero-cta-btn-contact:hover {
      color: #fff;
      background: #1a4258;
    }

    .contact-popup-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(17, 30, 42, 0.58);
      z-index: 4200;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }

    .contact-popup {
      width: min(760px, 100%);
      background: #f8fbf6;
      border-radius: 18px;
      border: 1px solid #dfe9db;
      box-shadow: 0 22px 44px rgba(14, 35, 28, 0.26);
      padding: 1.4rem;
      position: relative;
    }

    .contact-popup-close {
      position: absolute;
      top: 0.75rem;
      right: 0.9rem;
      border: none;
      background: transparent;
      font-size: 1.6rem;
      line-height: 1;
      color: #425652;
      cursor: pointer;
    }

    .contact-popup-title {
      margin-bottom: 0.35rem;
      color: #172a27;
      font-weight: 700;
    }

    .contact-popup-subtitle {
      color: #576763;
      margin-bottom: 1rem;
    }

    .contact-popup-info {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 0.6rem;
      margin-bottom: 1rem;
    }

    .info-chip {
      background: #eef4ea;
      border: 1px solid #d8e5d1;
      border-radius: 10px;
      min-height: 72px;
      padding: 0.65rem;
      color: #2d3d39;
      display: flex;
      gap: 0.5rem;
      align-items: flex-start;
      font-size: 0.86rem;
      line-height: 1.4;
    }

    .info-chip i {
      margin-top: 0.1rem;
      color: #1e6b52;
    }

    .popup-input {
      background: #ffffff;
      border: 1px solid #d6e2d3;
      border-radius: 10px;
      min-height: 46px;
    }

    .popup-input:focus {
      border-color: #88b3a0;
      box-shadow: 0 0 0 3px rgba(47, 138, 103, 0.16);
    }

    .popup-textarea {
      min-height: 118px;
      resize: vertical;
    }

    .popup-submit {
      margin-top: 0.95rem;
      width: 100%;
      min-height: 46px;
      border-radius: 10px;
      border: 1px solid #153243;
      background: #153243;
      color: #fff;
      font-weight: 700;
    }

    .popup-submit:hover {
      background: #1b455d;
    }

    @media (max-width: 768px) {
      .contact-popup-info {
        grid-template-columns: 1fr;
      }
    }

  `]
})
export class AboutComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  isContactPopupOpen = signal(false);

  constructor() {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        if (params.get('contact') === '1') {
          this.isContactPopupOpen.set(true);
        }
      });
  }

  features = [
    { icon: 'truck.svg', title: 'about.features.shipped.title', description: 'about.features.shipped.desc' },
    { icon: 'bag.svg', title: 'about.features.selection.title', description: 'about.features.selection.desc' },
    { icon: 'support.svg', title: 'about.features.guidance.title', description: 'about.features.guidance.desc' },
    { icon: 'return.svg', title: 'about.features.returns.title', description: 'about.features.returns.desc' }
  ];

  openContactPopup(): void {
    this.isContactPopupOpen.set(true);
  }

  closeContactPopup(): void {
    this.isContactPopupOpen.set(false);
    if (this.route.snapshot.queryParamMap.get('contact') === '1') {
      this.router.navigate([], {
        queryParams: { contact: null },
        queryParamsHandling: 'merge',
        replaceUrl: true
      });
    }
  }

}
