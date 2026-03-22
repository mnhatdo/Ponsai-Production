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

    <div class="untree_co-section">
      <div class="container">
        <div class="row mb-5">
          <div class="col-lg-5 mx-auto text-center">
            <h2 class="section-title">{{ 'about.ourTeam' | translate }}</h2>
          </div>
        </div>
        <div class="row g-4 justify-content-center">
          <div class="col-12 col-md-6 col-lg-3" *ngFor="let member of teamMembers">
            <div class="team-client-card">
              <div class="team-user-picture">
                <img [src]="'assets/images/' + member.image" [alt]="member.firstName + ' ' + member.lastName">
              </div>

              <p class="team-name-client">
                {{ member.firstName }} {{ member.lastName }}
                <span>{{ member.position | translate }}</span>
              </p>

              <p class="team-bio">{{ member.bio | translate }}</p>

              <div class="team-social-media">
                <a href="#" aria-label="Twitter">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                    <path d="M459.37 151.716c.325 4.548.325 9.097.325 13.645 0 138.72-105.583 298.558-298.558 298.558-59.452 0-114.68-17.219-161.137-47.106 8.447.974 16.568 1.299 25.34 1.299 49.055 0 94.213-16.568 130.274-44.832-46.132-.975-84.792-31.188-98.112-72.772 6.498.974 12.995 1.624 19.818 1.624 9.421 0 18.843-1.3 27.614-3.573-48.081-9.747-84.143-51.98-84.143-102.985v-1.299c13.969 7.797 30.214 12.67 47.431 13.319-28.264-18.843-46.781-51.005-46.781-87.391 0-19.492 5.197-37.36 14.294-52.954 51.655 63.675 129.3 105.258 216.365 109.807-1.624-7.797-2.599-15.918-2.599-24.04 0-57.828 46.782-104.934 104.934-104.934 30.213 0 57.502 12.67 76.67 33.137 23.715-4.548 46.456-13.32 66.599-25.34-7.798 24.366-24.366 44.833-46.132 57.827 21.117-2.273 41.584-8.122 60.426-16.243-14.292 20.791-32.161 39.308-52.628 54.253z"></path>
                  </svg>
                  <span class="tooltip-social">Twitter</span>
                </a>
                <a href="#" aria-label="Instagram">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                    <path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"></path>
                  </svg>
                  <span class="tooltip-social">Instagram</span>
                </a>
                <a href="#" aria-label="Facebook">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                    <path d="M504 256C504 119 393 8 256 8S8 119 8 256c0 123.78 90.69 226.38 209.25 245V327.69h-63V256h63v-54.64c0-62.15 37-96.48 93.67-96.48 27.14 0 55.52 4.84 55.52 4.84v61h-31.28c-30.8 0-40.41 19.12-40.41 38.73V256h68.78l-11 71.69h-57.78V501C413.31 482.38 504 379.78 504 256z"></path>
                  </svg>
                  <span class="tooltip-social">Facebook</span>
                </a>
                <a href="#" aria-label="LinkedIn">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                    <path d="M100.28 448H7.4V148.9h92.88zM53.79 108.1C24.09 108.1 0 83.5 0 53.8a53.79 53.79 0 0 1 107.58 0c0 29.7-24.1 54.3-53.79 54.3zM447.9 448h-92.68V302.4c0-34.7-.7-79.2-48.29-79.2-48.29 0-55.69 37.7-55.69 76.7V448h-92.78V148.9h89.08v40.8h1.3c12.4-23.5 42.69-48.3 87.88-48.3 94 0 111.28 61.9 111.28 142.3V448z"></path>
                  </svg>
                  <span class="tooltip-social">LinkedIn</span>
                </a>
              </div>
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

    .team-client-card {
      background: #284b63;
      border: 4px solid #153243;
      box-shadow: 0 6px 10px rgba(207, 212, 222, 1);
      border-radius: 10px;
      text-align: center;
      color: #fff;
      font-family: Poppins, sans-serif;
      transition: all 0.3s ease;
      padding: 1.6rem 1.25rem;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .team-client-card:hover {
      transform: translateY(-10px);
    }

    .team-user-picture {
      overflow: hidden;
      width: 5rem;
      height: 5rem;
      border: 4px solid #7cdacc;
      border-radius: 999px;
      display: flex;
      justify-content: center;
      align-items: center;
      margin: 0 auto;
      background: rgba(255, 255, 255, 0.12);
    }

    .team-user-picture img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .team-name-client {
      margin: 1.25rem 0 0;
      font-weight: 600;
      font-size: 18px;
      color: #fff;
    }

    .team-name-client span {
      display: block;
      margin-top: 0.35rem;
      font-weight: 300;
      font-size: 15px;
      color: rgba(255, 255, 255, 0.9);
    }

    .team-bio {
      margin: 1rem 0 0;
      color: rgba(255, 255, 255, 0.94);
      font-size: 0.95rem;
      line-height: 1.55;
      flex: 1;
    }

    .team-social-media {
      width: 100%;
      margin-top: 1.25rem;
      padding-top: 1.25rem;
      border-top: 2px solid #7cdacc;
      display: flex;
      justify-content: center;
      gap: 0.85rem;
    }

    .team-social-media a {
      position: relative;
      text-decoration: none;
      color: inherit;
    }

    .team-social-media a svg {
      width: 1.1rem;
      fill: currentColor;
    }

    .tooltip-social {
      background: #262626;
      display: block;
      position: absolute;
      bottom: 0;
      left: 50%;
      padding: 0.5rem 0.4rem;
      border-radius: 5px;
      font-size: 0.8rem;
      font-weight: 600;
      opacity: 0;
      pointer-events: none;
      transform: translate(-50%, -90%);
      transition: all 0.2s ease;
      z-index: 1;
      white-space: nowrap;
    }

    .tooltip-social::after {
      content: ' ';
      position: absolute;
      bottom: 1px;
      left: 50%;
      border: solid;
      border-width: 10px 10px 0 10px;
      border-color: transparent;
      transform: translate(-50%, 100%);
      border-top-color: #262626;
    }

    .team-social-media a:hover .tooltip-social {
      opacity: 1;
      transform: translate(-50%, -130%);
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

  teamMembers = [
    { firstName: 'Kien', lastName: 'Tran', position: 'about.team.kien.position', image: 'person_5.jpg', bio: 'about.team.kien.bio' },
    { firstName: 'Nhat', lastName: 'Do', position: 'about.team.nhat.position', image: 'person_2.jpg', bio: 'about.team.nhat.bio' },
    { firstName: 'Nga', lastName: 'Tran', position: 'about.team.nga.position', image: 'person_3.jpg', bio: 'about.team.nga.bio' },
    { firstName: 'Sang', lastName: 'Nguyen', position: 'about.team.sang.position', image: 'person_4.jpg', bio: 'about.team.sang.bio' },
    { firstName: 'Danh', lastName: 'Le', position: 'about.team.danh.position', image: 'person_1.jpg', bio: 'about.team.danh.bio' }
  ];
}
