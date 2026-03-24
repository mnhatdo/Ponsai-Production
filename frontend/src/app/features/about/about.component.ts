import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
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
              <p class="hero-cta-group"><a routerLink="/shop" class="hero-cta-btn hero-cta-btn-primary">{{ 'about.browseCollection' | translate }}</a><a routerLink="/services" class="hero-cta-btn hero-cta-btn-secondary">{{ 'about.whatWeOffer' | translate }}<span aria-hidden="true">→</span></a></p>
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

  `]
})
export class AboutComponent {
  features = [
    { icon: 'truck.svg', title: 'about.features.shipped.title', description: 'about.features.shipped.desc' },
    { icon: 'bag.svg', title: 'about.features.selection.title', description: 'about.features.selection.desc' },
    { icon: 'support.svg', title: 'about.features.guidance.title', description: 'about.features.guidance.desc' },
    { icon: 'return.svg', title: 'about.features.returns.title', description: 'about.features.returns.desc' }
  ];

}
