import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TranslateModule],
  template: `
    <div class="hero">
      <div class="container">
        <div class="row justify-content-between">
          <div class="col-lg-5">
            <div class="intro-excerpt">
              <h1>{{ 'contact.title' | translate }}</h1>
              <p class="mb-4">{{ 'contact.subtitle' | translate }}</p>
              <p class="hero-cta-group"><a routerLink="/shop" class="hero-cta-btn hero-cta-btn-primary">{{ 'about.browseCollection' | translate }}</a><a routerLink="/about" class="hero-cta-btn hero-cta-btn-secondary">{{ 'footer.aboutUs' | translate }} <span aria-hidden="true">→</span></a></p>
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

    <div class="untree_co-section contact-soft-section">
      <div class="container">
        <div class="block contact-shell">
          <div class="row justify-content-center">
            <div class="col-md-8 col-lg-8 pb-4">
              <div class="row contact-info-grid mb-5">
                <div class="col-lg-4" *ngFor="let contact of contactInfo">
                  <div class="service contact-card no-shadow align-items-center link horizontal d-flex active">
                    <div class="service-icon contact-icon" [innerHTML]="contact.icon"></div>
                    <div class="service-contents">
                      <p>{{ contact.value }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <form class="contact-form-shell">
                <div class="row">
                  <div class="col-6">
                    <div class="form-group">
                      <label class="contact-label" for="fname">{{ 'contact.firstName' | translate }}</label>
                      <input type="text" class="form-control contact-input" id="fname">
                    </div>
                  </div>
                  <div class="col-6">
                    <div class="form-group">
                      <label class="contact-label" for="lname">{{ 'contact.lastName' | translate }}</label>
                      <input type="text" class="form-control contact-input" id="lname">
                    </div>
                  </div>
                </div>
                <div class="form-group">
                  <label class="contact-label" for="email">{{ 'contact.email' | translate }}</label>
                  <input type="email" class="form-control contact-input" id="email">
                </div>
                <div class="form-group mb-5">
                  <label class="contact-label" for="message">{{ 'contact.message' | translate }}</label>
                  <textarea class="form-control contact-input contact-textarea" id="message" cols="30" rows="5"></textarea>
                </div>
                <button type="submit" class="btn contact-submit-btn">{{ 'contact.sendMessage' | translate }}</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .hero {
      position: relative;
      background-image: url('/assets/images/banner5.jpg');
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

    .contact-soft-section {
      background: transparent;
    }

    .contact-shell {
      padding: clamp(0.25rem, 1vw, 0.75rem);
    }

    .contact-info-grid > [class*='col-'] {
      display: flex;
    }

    .contact-card {
      width: 100%;
      min-height: 132px;
      padding: 1.35rem 1.1rem;
      border-radius: 24px;
      gap: 1rem;
      background: #e0e5ec;
      box-shadow:
        12px 12px 24px rgba(163, 177, 198, 0.62),
        -12px -12px 24px rgba(255, 255, 255, 0.56);
    }

    .contact-icon {
      width: 58px;
      height: 58px;
      margin-right: 0;
      margin-bottom: 0;
      border-radius: 18px;
      flex: 0 0 58px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      color: #6c63ff;
      background: #e0e5ec;
      box-shadow:
        inset 3px 3px 7px rgba(255, 255, 255, 0.55),
        inset -5px -5px 10px rgba(163, 177, 198, 0.25),
        10px 10px 20px rgba(163, 177, 198, 0.52),
        -8px -8px 18px rgba(255, 255, 255, 0.5);
    }

    .service-contents p {
      margin: 0;
      color: #3d4852;
      font-size: 0.98rem;
      line-height: 1.55;
    }

    .contact-form-shell {
      background: #e0e5ec;
      border-radius: 30px;
      padding: clamp(1.4rem, 3vw, 2.25rem);
      box-shadow:
        inset 6px 6px 14px rgba(163, 177, 198, 0.2),
        inset -6px -6px 14px rgba(255, 255, 255, 0.42),
        16px 16px 32px rgba(163, 177, 198, 0.62),
        -16px -16px 32px rgba(255, 255, 255, 0.5);
    }

    .form-group {
      margin-bottom: 1.25rem;
    }

    .contact-label {
      display: inline-block;
      margin-bottom: 0.55rem;
      color: #3d4852;
      font-size: 0.95rem;
      font-weight: 700;
      letter-spacing: 0.01em;
    }

    .contact-input {
      width: 100%;
      height: 58px;
      border: none;
      color: #3d4852;
      background: #e0e5ec;
      border-radius: 18px;
      padding: 0 1.15rem;
      box-shadow:
        inset 7px 7px 14px rgba(163, 177, 198, 0.45),
        inset -7px -7px 14px rgba(255, 255, 255, 0.6);
      transition: box-shadow 0.25s ease, color 0.25s ease, transform 0.25s ease;
    }

    .contact-input::placeholder {
      color: #6b7280;
    }

    .contact-input:focus {
      outline: none;
      box-shadow:
        inset 7px 7px 14px rgba(163, 177, 198, 0.48),
        inset -7px -7px 14px rgba(255, 255, 255, 0.62),
        0 0 0 3px rgba(108, 99, 255, 0.18);
    }

    .contact-textarea {
      min-height: 170px;
      padding-top: 1rem;
      resize: vertical;
    }

    .contact-submit-btn {
      min-width: 220px;
      height: 56px;
      border: none;
      color: #fff;
      background: linear-gradient(145deg, #8b84ff, #6c63ff);
      border-radius: 18px;
      font-weight: 700;
      letter-spacing: 0.02em;
      box-shadow:
        14px 14px 28px rgba(163, 177, 198, 0.5),
        -10px -10px 22px rgba(255, 255, 255, 0.3),
        inset 1px 1px 0 rgba(255, 255, 255, 0.25);
      transition: transform 0.25s ease, box-shadow 0.25s ease, filter 0.25s ease;
    }

    .contact-submit-btn:hover {
      transform: translateY(-2px);
      filter: brightness(1.02);
      box-shadow:
        18px 18px 30px rgba(163, 177, 198, 0.58),
        -12px -12px 24px rgba(255, 255, 255, 0.34),
        inset 1px 1px 0 rgba(255, 255, 255, 0.32);
    }

    .contact-submit-btn:focus-visible {
      outline: none;
      box-shadow:
        14px 14px 28px rgba(163, 177, 198, 0.5),
        -10px -10px 22px rgba(255, 255, 255, 0.3),
        inset 1px 1px 0 rgba(255, 255, 255, 0.25),
        0 0 0 4px rgba(108, 99, 255, 0.18);
    }

    @media (max-width: 991.98px) {
      .contact-card {
        min-height: 112px;
      }
    }

    @media (max-width: 767.98px) {
      .contact-shell {
        border-radius: 26px;
      }

      .contact-form-shell {
        border-radius: 24px;
      }

      .contact-submit-btn {
        width: 100%;
      }
    }
  `]
})
export class ContactComponent {
  contactInfo = [
    { icon: '<i class="bi bi-geo-alt-fill"></i>', value: '1428 Industrial Way, Portland, OR 97209' },
    { icon: '<i class="bi bi-envelope-fill"></i>', value: 'care@ponsai.co' },
    { icon: '<i class="bi bi-telephone-fill"></i>', value: '+1 (503) 555-0142' }
  ];
}
