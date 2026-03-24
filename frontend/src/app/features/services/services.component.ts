import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { SERVICES, STAFF_ZALO_PHONE } from './services.data';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  template: `
    <!-- Hero Section -->
    <div class="hero services-hero">
      <div class="container">
        <div class="row justify-content-between">
          <div class="col-lg-5">
            <div class="intro-excerpt">
              <h1>Gói Dịch Vụ<br>Bonsai Chuyên Nghiệp</h1>
              <p class="mb-4">Tùy chỉnh gói chăm sóc hoàn hảo cho bộ sưu tập cây cảnh của bạn. Chúng tôi cung cấp giải pháp toàn diện để cây luôn khỏe mạnh và đẹp mắt.</p>
              <p>
                <a routerLink="/shop" class="btn btn-secondary me-2">Sản phẩm</a>
                <a routerLink="/about" [queryParams]="{ contact: '1' }" class="btn btn-white-outline">Liên hệ</a>
              </p>
            </div>
          </div>
          <div class="col-lg-7">
            <div class="hero-img-wrap">
              <img src="assets/images/couch.png" class="img-fluid" alt="Bonsai Services">
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pricing Packages Section -->
    <section class="pricing-section py-5 bg-light-pattern">
      <div class="container">
        <div class="text-center mb-5">
          <h2 class="display-5 fw-bold mb-3">Bảng giá dịch vụ</h2>
          <p class="text-muted fs-5">Tùy chỉnh gói chăm sóc chính xác theo nhu cầu của bạn.</p>
          <p class="small text-muted mb-5">Giá được điều chỉnh theo số lượng cây (VNĐ) để mang lại giá trị tốt nhất.</p>
          
          <!-- Slider Component -->
          <div class="slider-container max-w-600 mx-auto px-4 mb-5">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <span class="fw-bold">Số lượng cây:</span>
              <span class="fw-bold text-primary fs-5">{{ sliderValue }} cây</span>
            </div>
            
            <div class="range-wrap position-relative">
              <input type="range" class="form-range custom-range" min="1" max="50" step="1" [value]="sliderValue" (input)="updateSlider($event)">
            </div>
            
            <div class="d-flex justify-content-center mt-3 text-muted small">
              <span>Trượt để xem giá theo số lượng cây</span>
            </div>
          </div>
        </div>

        <div class="row align-items-center justify-content-center g-4">
          <!-- Basic Plan -->
          <div class="col-lg-4 col-md-6" (click)="setPlan('basic')">
            <div class="pricing-card cursor-pointer" 
                 [class.pricing-card-featured]="currentPlan === 'basic'" 
                 [class.shadow-lg]="currentPlan === 'basic'" 
                 [class.border-dark]="currentPlan === 'basic'">
              <div class="card-body">
                <span class="badge bg-light text-dark mb-4 px-3 py-2 fw-bold border">Cơ bản</span>
                <h3 class="pricing-price">{{ basicPrice | number }}đ</h3>
                <p class="text-muted mb-4 d-flex flex-column gap-1">
                  <span>Phù hợp cho nhu cầu chăm sóc cơ bản (tối đa 3 cây).</span>
                  <span class="small border-top pt-2 mt-2">{{ basicTrees }} cây &bull; 150,000đ / cây</span>
                </p>
                <ul class="list-unstyled pricing-features mb-5">
                  <li [class.text-dark]="currentPlan === 'basic'"><i class="bi bi-check-circle translate-icon"></i> Cắt tỉa cành cơ bản</li>
                  <li [class.text-dark]="currentPlan === 'basic'"><i class="bi bi-check-circle translate-icon"></i> Bón phân định kỳ</li>
                  <li [class.text-dark]="currentPlan === 'basic'"><i class="bi bi-check-circle translate-icon"></i> Kiểm tra sâu bệnh 1 lần/tuần</li>
                  <li [class.text-dark]="currentPlan === 'basic'"><i class="bi bi-check-circle translate-icon"></i> Hỗ trợ qua Email/Zalo</li>
                </ul>
                <div class="text-center">
                  <button *ngIf="currentPlan === 'basic'" type="button" class="package-action-button w-100" [class.is-sending]="sendingPlan === 'basic'" (click)="startPlanSelection('basic')" aria-label="Chọn Cơ Bản">
                    <span class="outline"></span>
                    <span class="state state--default">
                      <span class="icon" [innerHTML]="buttonIcon"></span>
                      <span class="button-label">
                        <span *ngFor="let char of animatedChars('Chọn Cơ Bản'); let i = index" [style.--i]="i">{{ char }}</span>
                      </span>
                    </span>
                    <span class="state state--sent">
                      <span class="icon" [innerHTML]="sentIcon"></span>
                      <span class="button-label">
                        <span *ngFor="let char of animatedChars('Đã gửi'); let i = index" [style.--i]="i + 5">{{ char }}</span>
                      </span>
                    </span>
                  </button>
                  <button *ngIf="currentPlan !== 'basic'" type="button" class="package-action-button w-100" aria-label="Xem Cơ Bản">
                    <span class="outline"></span>
                    <span class="state state--default">
                      <span class="icon" [innerHTML]="buttonIcon"></span>
                      <span class="button-label">
                        <span *ngFor="let char of animatedChars('Xem Cơ Bản'); let i = index" [style.--i]="i">{{ char }}</span>
                      </span>
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Standard Plan -->
          <div class="col-lg-4 col-md-6" (click)="setPlan('standard')">
            <div class="pricing-card cursor-pointer" 
                 [class.pricing-card-featured]="currentPlan === 'standard'" 
                 [class.shadow-lg]="currentPlan === 'standard'" 
                 [class.border-dark]="currentPlan === 'standard'">
              <div class="card-body position-relative">
                <div class="d-flex justify-content-between align-items-center mb-4">
                  <span class="badge bg-dark text-white px-3 py-2 fw-bold rounded-pill">Tiêu chuẩn</span>
                  <span class="badge bg-light text-dark px-3 py-2 border rounded-pill" *ngIf="currentPlan === 'standard'">Khuyên dùng</span>
                </div>
                <h3 class="pricing-price">{{ standardPrice | number }}đ</h3>
                <p class="text-muted mb-4 d-flex flex-column gap-1">
                  <span>Giải pháp toàn diện (tối đa 10 cây).</span>
                  <span class="small border-top pt-2 mt-2">{{ standardTrees }} cây &bull; 300,000đ / cây</span>
                </p>
                <ul class="list-unstyled pricing-features mb-5">
                  <li [class.text-dark]="currentPlan === 'standard'"><i class="bi bi-check-circle translate-icon"></i> Chăm sóc tạo dáng chuyên sâu</li>
                  <li [class.text-dark]="currentPlan === 'standard'"><i class="bi bi-check-circle translate-icon"></i> Thay đất & chậu định kỳ</li>
                  <li [class.text-dark]="currentPlan === 'standard'"><i class="bi bi-check-circle translate-icon"></i> Xử phòng ngừa bệnh đặc trị</li>
                  <li [class.text-dark]="currentPlan === 'standard'"><i class="bi bi-check-circle translate-icon"></i> Ưu tiên xử lý sự cố trong 12h</li>
                </ul>
                <div class="text-center">
                  <button *ngIf="currentPlan === 'standard'" type="button" class="package-action-button w-100" [class.is-sending]="sendingPlan === 'standard'" (click)="startPlanSelection('standard')" aria-label="Chọn Tiêu Chuẩn">
                    <span class="outline"></span>
                    <span class="state state--default">
                      <span class="icon" [innerHTML]="buttonIcon"></span>
                      <span class="button-label">
                        <span *ngFor="let char of animatedChars('Chọn Tiêu Chuẩn'); let i = index" [style.--i]="i">{{ char }}</span>
                      </span>
                    </span>
                    <span class="state state--sent">
                      <span class="icon" [innerHTML]="sentIcon"></span>
                      <span class="button-label">
                        <span *ngFor="let char of animatedChars('Đã gửi'); let i = index" [style.--i]="i + 5">{{ char }}</span>
                      </span>
                    </span>
                  </button>
                  <button *ngIf="currentPlan !== 'standard'" type="button" class="package-action-button w-100" aria-label="Xem Tiêu Chuẩn">
                    <span class="outline"></span>
                    <span class="state state--default">
                      <span class="icon" [innerHTML]="buttonIcon"></span>
                      <span class="button-label">
                        <span *ngFor="let char of animatedChars('Xem Tiêu Chuẩn'); let i = index" [style.--i]="i">{{ char }}</span>
                      </span>
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Pro Plan -->
          <div class="col-lg-4 col-md-6" (click)="setPlan('pro')">
            <div class="pricing-card cursor-pointer" 
                 [class.pricing-card-featured]="currentPlan === 'pro'" 
                 [class.shadow-lg]="currentPlan === 'pro'" 
                 [class.border-dark]="currentPlan === 'pro'">
              <div class="card-body">
                <span class="badge bg-light text-dark mb-4 px-3 py-2 fw-bold border">Cao cấp</span>
                <h3 class="pricing-price">{{ proPrice | number }}đ</h3>
                <p class="text-muted mb-4 d-flex flex-column gap-1">
                  <span>Chăm sóc đặc biệt nghệ thuật giá trị cao.</span>
                  <span class="small border-top pt-2 mt-2">{{ proTrees }} cây &bull; 500,000đ / cây</span>
                </p>
                <ul class="list-unstyled pricing-features mb-5">
                  <li [class.text-dark]="currentPlan === 'pro'"><i class="bi bi-check-circle translate-icon"></i> Chuyên gia thiết kế dáng nghệ thuật</li>
                  <li [class.text-dark]="currentPlan === 'pro'"><i class="bi bi-check-circle translate-icon"></i> Phân tích vi sinh đất & môi trường</li>
                  <li [class.text-dark]="currentPlan === 'pro'"><i class="bi bi-check-circle translate-icon"></i> Quản lý hồ sơ từng cây & 3D quét</li>
                  <li [class.text-dark]="currentPlan === 'pro'"><i class="bi bi-check-circle translate-icon"></i> Bảo hiểm đền bù khi mất/chết cây</li>
                </ul>
                <div class="text-center">
                  <button *ngIf="currentPlan === 'pro'" type="button" class="package-action-button w-100" [class.is-sending]="sendingPlan === 'pro'" (click)="startPlanSelection('pro')" aria-label="Chọn Cao Cấp">
                    <span class="outline"></span>
                    <span class="state state--default">
                      <span class="icon" [innerHTML]="buttonIcon"></span>
                      <span class="button-label">
                        <span *ngFor="let char of animatedChars('Chọn Cao Cấp'); let i = index" [style.--i]="i">{{ char }}</span>
                      </span>
                    </span>
                    <span class="state state--sent">
                      <span class="icon" [innerHTML]="sentIcon"></span>
                      <span class="button-label">
                        <span *ngFor="let char of animatedChars('Đã gửi'); let i = index" [style.--i]="i + 5">{{ char }}</span>
                      </span>
                    </span>
                  </button>
                  <button *ngIf="currentPlan !== 'pro'" type="button" class="package-action-button w-100" aria-label="Xem Cao Cấp">
                    <span class="outline"></span>
                    <span class="state state--default">
                      <span class="icon" [innerHTML]="buttonIcon"></span>
                      <span class="button-label">
                        <span *ngFor="let char of animatedChars('Xem Cao Cấp'); let i = index" [style.--i]="i">{{ char }}</span>
                      </span>
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="contact-box mt-5 text-center">
          <h2 class="h4 mb-3">Bạn có yêu cầu đặc biệt?</h2>
          <p class="mb-4">Nhấn vào nút bên dưới để nhận tư vấn thiết kế dịch vụ riêng qua Zalo.</p>
          <a class="btn btn-primary" [href]="zaloLink" target="_blank" rel="noopener noreferrer">
            Nhắn tin với chuyên gia
          </a>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .hero {
      position: relative;
      background-image: url('/assets/images/banner3.jpg');
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

    .services-hero {
      box-sizing: border-box;
      padding: calc(var(--hero-menu-offset) + 2.25rem) 0 2.25rem;
    }

    .services-hero .container {
      height: 100%;
    }

    .services-hero .row {
      align-items: center;
      min-height: 100%;
    }

    .services-hero .intro-excerpt {
      max-width: 500px;
      padding: 0;
    }

    .services-hero .intro-excerpt h1 {
      font-size: clamp(2.45rem, 4.4vw, 3.85rem);
      line-height: 1.08;
      margin-bottom: 0.85rem;
    }

    .services-hero .intro-excerpt .mb-4 {
      max-width: 30rem;
      margin-bottom: 1rem !important;
      line-height: 1.45;
      font-size: 1rem;
    }

    .services-hero .intro-excerpt p:last-child {
      margin-bottom: 0;
    }

    @media (max-width: 991.98px) {
      .services-hero {
        padding: calc(var(--hero-menu-offset) + 1.75rem) 0 1.75rem;
      }

      .services-hero .intro-excerpt h1 {
        font-size: clamp(2rem, 7vw, 3rem);
      }

      .services-hero .intro-excerpt .mb-4 {
        max-width: 100%;
      }
    }

    .max-w-600 {
      max-width: 600px;
    }

    .cursor-pointer {
      cursor: pointer;
    }

    /* Custom Range Slider Styling */
    .custom-range {
      width: 100%;
      height: 10px;
      padding: 0;
      border-radius: 5px;
      background: transparent;
      outline: none;
      opacity: 0.7;
      transition: opacity 0.2s;
      -webkit-appearance: none;
    }

    .custom-range:hover {
      opacity: 1;
    }

    .custom-range::-webkit-slider-runnable-track {
      height: 10px;
      border-radius: 5px;
      background-color: #4158d0;
      background-image: linear-gradient(90deg, #6f7de1 0%, #c97bd1 50%, #ffd27a 100%);
    }

    .custom-range::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background-color: #4c00ff;
      background-image: linear-gradient(160deg, #4900f5 0%, #80d0c7 100%);
      cursor: pointer;
      border: none;
      box-shadow: 0 2px 6px rgba(33, 20, 74, 0.28);
      transition: transform 0.1s;
      margin-top: -5px;
    }

    .custom-range::-webkit-slider-thumb:hover {
      transform: scale(1.1);
    }

    .custom-range::-moz-range-track {
      height: 10px;
      border-radius: 5px;
      background-color: #4158d0;
      background-image: linear-gradient(90deg, #6f7de1 0%, #c97bd1 50%, #ffd27a 100%);
    }

    .custom-range::-moz-range-thumb {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background-color: #0093e9;
      background-image: linear-gradient(160deg, #0093e9 0%, #80d0c7 100%);
      cursor: pointer;
      border: none;
      box-shadow: 0 2px 6px rgba(33, 20, 74, 0.28);
      transition: transform 0.1s;
    }

    .bg-light-pattern {
      background: #f4f7f1;
    }

    .pricing-card {
      background: #f9fcf7;
      border: 1px solid #dce7d8;
      border-radius: 12px;
      padding: 1.4rem 0.85rem;
      box-shadow: 0 10px 24px rgba(18, 40, 32, 0.08);
      transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
      height: 100%;
    }

    .pricing-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 14px 30px rgba(18, 40, 32, 0.12);
    }

    .pricing-card-featured {
      background: #ffffff;
      border: 2px solid #153243 !important;
      transform: none;
      z-index: 10;
      box-shadow: 0 16px 30px rgba(21, 50, 67, 0.16);
    }

    @media (max-width: 991px) {
      .pricing-card-featured {
        transform: scale(1);
      }
    }

    .package-action-button {
      min-width: 200px;
      height: 52px;
      border-radius: 12px;
      background: #153243;
      color: #ffffff;
      border: 1px solid #153243;
      text-shadow: none;
      box-shadow: 0 10px 20px rgba(21, 50, 67, 0.24);
      font-size: 0.95rem;
      font-weight: 700;
    }

    .package-action-button::before,
    .package-action-button::after,
    .package-action-button .outline,
    .package-action-button .icon {
      display: none !important;
    }

    .package-action-button .state {
      padding-left: 0;
    }

    .package-action-button .button-label span {
      opacity: 1;
      animation: none !important;
      transform: none !important;
      filter: none !important;
      color: currentColor;
    }

    .package-action-button .state--sent {
      display: none !important;
    }

    .package-action-button:hover {
      transform: translateY(-1px);
      box-shadow: 0 12px 24px rgba(21, 50, 67, 0.3);
    }

    .package-action-button.is-sending {
      opacity: 0.85;
    }

    .pricing-price {
      font-size: 1.9rem;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 0.35rem;
    }

    .pricing-features li {
      margin-bottom: 0.8rem;
      color: #6c757d;
      display: flex;
      align-items: center;
      transition: color 0.3s ease;
      font-size: 0.95rem;
      line-height: 1.45;
    }

    .pricing-features li.text-dark {
      color: #212529 !important;
      font-weight: 500;
    }

    .translate-icon {
      color: #1a1a1a;
      margin-right: 0.6rem;
      font-size: 1rem;
    }

    .btn-rounded {
      border-radius: 30px;
    }

    .package-action-button {
      --primary: #ff5569;
      --neutral-1: #f7f8f7;
      --neutral-2: #e7e7e7;
      --radius: 14px;
      position: relative;
      min-width: 200px;
      height: 60px;
      padding: 16px 18px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: none;
      border-radius: var(--radius);
      background: transparent;
      cursor: pointer;
      color: #202226;
      text-decoration: none;
      text-shadow: 0 1px 1px rgba(0, 0, 0, 0.3);
      box-shadow:
        0 0.5px 0.5px 1px rgba(255, 255, 255, 0.2),
        0 10px 20px rgba(0, 0, 0, 0.2),
        0 4px 5px 0 rgba(0, 0, 0, 0.05);
      transition: all 0.3s ease;
      overflow: hidden;
      font-family: Poppins, Montserrat, sans-serif;
      font-size: 16px;
      font-weight: 600;
    }

    .package-action-button:hover {
      transform: scale(1.02);
      box-shadow:
        0 0 1px 2px rgba(255, 255, 255, 0.3),
        0 15px 30px rgba(0, 0, 0, 0.3),
        0 10px 3px -3px rgba(0, 0, 0, 0.04);
    }

    .package-action-button:active {
      transform: scale(1);
      box-shadow:
        0 0 1px 2px rgba(255, 255, 255, 0.3),
        0 10px 3px -3px rgba(0, 0, 0, 0.2);
    }

    .package-action-button::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: var(--radius);
      border: 2.5px solid transparent;
      background:
        linear-gradient(var(--neutral-1), var(--neutral-2)) padding-box,
        linear-gradient(to bottom, rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.45)) border-box;
      z-index: 0;
      transition: all 0.4s ease;
    }

    .package-action-button:hover::after {
      transform: scale(1.05, 1.1);
      box-shadow: inset 0 -1px 3px 0 rgba(255, 255, 255, 1);
    }

    .package-action-button::before {
      content: '';
      position: absolute;
      inset: 7px 6px 6px 6px;
      background: linear-gradient(to top, var(--neutral-1), var(--neutral-2));
      border-radius: 30px;
      filter: blur(0.5px);
      z-index: 0;
    }

    .package-action-button .outline {
      position: absolute;
      inset: -2px -3.5px;
      border-radius: inherit;
      overflow: hidden;
      z-index: 1;
      opacity: 0;
      transition: opacity 0.4s ease;
    }

    .package-action-button .outline::before {
      content: '';
      position: absolute;
      inset: -100%;
      background: conic-gradient(from 180deg, transparent 60%, white 80%, transparent 100%);
      animation: package-spin 2s linear infinite;
      animation-play-state: paused;
    }

    .package-action-button:hover .outline {
      opacity: 1;
    }

    .package-action-button:hover .outline::before {
      animation-play-state: running;
    }

    .package-action-button .state {
      position: relative;
      z-index: 2;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding-left: 29px;
    }

    .package-action-button .button-label {
      display: flex;
      align-items: center;
      justify-content: center;
      white-space: nowrap;
      line-height: 1;
    }

    .pricing-card .card-body {
      padding: 0.5rem 0.5rem 0.25rem;
    }

    .pricing-card .text-muted.mb-4 {
      margin-bottom: 1rem !important;
      font-size: 0.95rem;
      line-height: 1.45;
    }

    .pricing-card .pricing-features.mb-5 {
      margin-bottom: 1.6rem !important;
    }

    .pricing-card .small.border-top {
      padding-top: 0.7rem !important;
      margin-top: 0.7rem !important;
    }

    .package-action-button .button-label span {
      display: block;
      opacity: 0;
      animation: package-slide-down 0.8s ease forwards calc(var(--i) * 0.03s);
    }

    .package-action-button:hover .button-label span {
      opacity: 1;
      animation: package-wave 0.5s ease forwards calc(var(--i) * 0.02s);
    }

    .package-action-button .icon {
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      margin: auto;
      transform: scale(1.25);
      transition: all 0.3s ease;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: currentColor;
    }

    .package-action-button:hover .icon {
      transform: rotate(45deg) scale(1.25);
    }

    .package-action-button .icon svg {
      width: 1em;
      height: 1em;
      overflow: visible;
    }

    .package-action-button .state--sent {
      display: none;
    }

    .package-action-button .state--sent .icon svg {
      opacity: 0;
      animation: none;
    }

    .package-action-button.is-sending {
      pointer-events: none;
    }

    .package-action-button.is-sending .state--default {
      position: absolute;
    }

    .package-action-button.is-sending .state--default .button-label span {
      opacity: 1;
      animation: package-disappear 0.6s ease forwards calc(var(--i) * 0.03s);
    }

    .package-action-button.is-sending .state--default .icon {
      transform: rotate(0) scale(1.25);
    }

    .package-action-button.is-sending .state--default .icon svg {
      animation: package-takeoff 0.8s linear forwards;
    }

    .package-action-button.is-sending .state--default .icon::before {
      content: '';
      position: absolute;
      top: 50%;
      left: -5px;
      height: 2px;
      width: 0;
      background: linear-gradient(to right, transparent, rgba(0, 0, 0, 0.5));
      animation: package-contrail 0.8s linear forwards;
    }

    .package-action-button.is-sending .state--sent {
      display: inline-flex;
    }

    .package-action-button.is-sending .state--sent .button-label span {
      opacity: 0;
      animation: package-slide-down 0.8s ease forwards calc(var(--i) * 0.2s);
    }

    .package-action-button.is-sending .state--sent .icon svg {
      animation: package-appear 1.2s ease forwards 0.8s;
    }

    @keyframes package-spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @keyframes package-wave {
      30% { opacity: 1; transform: translateY(4px); }
      50% { opacity: 1; transform: translateY(-3px); color: var(--primary); }
      100% { opacity: 1; transform: translateY(0); }
    }

    @keyframes package-slide-down {
      0% {
        opacity: 0;
        transform: translateY(-20px) translateX(5px) rotate(-90deg);
        color: var(--primary);
        filter: blur(5px);
      }
      30% {
        opacity: 1;
        transform: translateY(4px) translateX(0) rotate(0);
        filter: blur(0);
      }
      50% { opacity: 1; transform: translateY(-3px); }
      100% { opacity: 1; transform: translateY(0); }
    }

    @keyframes package-disappear {
      from { opacity: 1; }
      to {
        opacity: 0;
        transform: translateX(5px) translateY(20px);
        color: var(--primary);
        filter: blur(5px);
      }
    }

    @keyframes package-takeoff {
      0% { opacity: 1; }
      60% {
        opacity: 1;
        transform: translateX(70px) rotate(45deg) scale(2);
      }
      100% {
        opacity: 0;
        transform: translateX(160px) rotate(45deg) scale(0);
      }
    }

    @keyframes package-contrail {
      0% {
        width: 0;
        opacity: 1;
      }
      8% { width: 15px; }
      60% {
        opacity: 0.7;
        width: 80px;
      }
      100% {
        opacity: 0;
        width: 160px;
      }
    }

    @keyframes package-appear {
      0% {
        opacity: 0;
        transform: scale(4) rotate(-40deg);
        color: var(--primary);
        filter: blur(4px);
      }
      30% {
        opacity: 1;
        transform: scale(0.6);
        filter: blur(1px);
      }
      50% {
        opacity: 1;
        transform: scale(1.2);
        filter: blur(0);
      }
      100% {
        opacity: 1;
        transform: scale(1);
      }
    }

    .services-kicker {
      font-size: 0.875rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--bs-secondary-color);
      font-weight: 600;
    }

    .services-title {
      font-size: clamp(1.75rem, 2.8vw, 2.6rem);
      color: var(--bs-body-color);
      font-weight: 700;
    }

    .services-subtitle {
      max-width: 680px;
      color: var(--bs-secondary-color);
    }

    .contact-box {
      border-radius: 16px;
      padding: 2rem 1.25rem;
      background: rgba(255, 255, 255, 0.78);
      border: 1px solid rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(4px);
      box-shadow: 0 10px 24px rgba(18, 22, 28, 0.08);
    }
  `]
})
export class ServicesComponent {
  readonly services = SERVICES;
  readonly zaloLink = `https://zalo.me/${STAFF_ZALO_PHONE}`;
  sendingPlan: 'basic' | 'standard' | 'pro' | null = null;
  readonly buttonIcon = `
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g style="filter: url(#shadow)">
        <path d="M14.2199 21.63C13.0399 21.63 11.3699 20.8 10.0499 16.83L9.32988 14.67L7.16988 13.95C3.20988 12.63 2.37988 10.96 2.37988 9.78001C2.37988 8.61001 3.20988 6.93001 7.16988 5.60001L15.6599 2.77001C17.7799 2.06001 19.5499 2.27001 20.6399 3.35001C21.7299 4.43001 21.9399 6.21001 21.2299 8.33001L18.3999 16.82C17.0699 20.8 15.3999 21.63 14.2199 21.63ZM7.63988 7.03001C4.85988 7.96001 3.86988 9.06001 3.86988 9.78001C3.86988 10.5 4.85988 11.6 7.63988 12.52L10.1599 13.36C10.3799 13.43 10.5599 13.61 10.6299 13.83L11.4699 16.35C12.3899 19.13 13.4999 20.12 14.2199 20.12C14.9399 20.12 16.0399 19.13 16.9699 16.35L19.7999 7.86001C20.3099 6.32001 20.2199 5.06001 19.5699 4.41001C18.9199 3.76001 17.6599 3.68001 16.1299 4.19001L7.63988 7.03001Z" fill="currentColor"></path>
        <path d="M10.11 14.4C9.92005 14.4 9.73005 14.33 9.58005 14.18C9.29005 13.89 9.29005 13.41 9.58005 13.12L13.16 9.53C13.45 9.24 13.93 9.24 14.22 9.53C14.51 9.82 14.51 10.3 14.22 10.59L10.64 14.18C10.5 14.33 10.3 14.4 10.11 14.4Z" fill="currentColor"></path>
      </g>
      <defs>
        <filter id="shadow">
          <feDropShadow dx="0" dy="1" stdDeviation="0.6" flood-opacity="0.5"></feDropShadow>
        </filter>
      </defs>
    </svg>
  `;
  readonly sentIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" height="1em" width="1em" stroke-width="0.5px" stroke="black">
      <g style="filter: url(#shadow)">
        <path fill="currentColor" d="M12 22.75C6.07 22.75 1.25 17.93 1.25 12C1.25 6.07 6.07 1.25 12 1.25C17.93 1.25 22.75 6.07 22.75 12C22.75 17.93 17.93 22.75 12 22.75ZM12 2.75C6.9 2.75 2.75 6.9 2.75 12C2.75 17.1 6.9 21.25 12 21.25C17.1 21.25 21.25 17.1 21.25 12C21.25 6.9 17.1 2.75 12 2.75Z"></path>
        <path fill="currentColor" d="M10.5795 15.5801C10.3795 15.5801 10.1895 15.5001 10.0495 15.3601L7.21945 12.5301C6.92945 12.2401 6.92945 11.7601 7.21945 11.4701C7.50945 11.1801 7.98945 11.1801 8.27945 11.4701L10.5795 13.7701L15.7195 8.6301C16.0095 8.3401 16.4895 8.3401 16.7795 8.6301C17.0695 8.9201 17.0695 9.4001 16.7795 9.6901L11.1095 15.3601C10.9695 15.5001 10.7795 15.5801 10.5795 15.5801Z"></path>
      </g>
      <defs>
        <filter id="shadow">
          <feDropShadow dx="0" dy="1" stdDeviation="0.6" flood-opacity="0.5"></feDropShadow>
        </filter>
      </defs>
    </svg>
  `;

  sliderValue = 3; // Default number of trees

  get currentPlan(): string {
    if (this.sliderValue <= 3) return 'basic';
    if (this.sliderValue <= 10) return 'standard';
    return 'pro';
  }

  get basicTrees(): number { return Math.min(this.sliderValue, 3); }
  get standardTrees(): number { return Math.min(this.sliderValue, 10); }
  get proTrees(): number { return this.sliderValue; }

  get basicPrice(): number {
    return this.basicTrees * 150000;
  }

  get standardPrice(): number {
    return this.standardTrees * 300000;
  }

  get proPrice(): number {
    return this.proTrees * 500000;
  }

  updateSlider(event: any) {
    this.sliderValue = Number(event.target.value);
  }

  setPlan(plan: string) {
    if (plan === 'basic') this.sliderValue = 3;
    if (plan === 'standard') this.sliderValue = 10;
    if (plan === 'pro') this.sliderValue = 20;
  }

  animatedChars(text: string): string[] {
    return Array.from(text).map(char => (char === ' ' ? '\u00A0' : char));
  }

  startPlanSelection(plan: 'basic' | 'standard' | 'pro'): void {
    if (this.sendingPlan) {
      return;
    }

    this.sendingPlan = plan;

    window.setTimeout(() => {
      window.open(this.zaloLink, '_blank', 'noopener,noreferrer');
      this.sendingPlan = null;
    }, 1800);
  }
}

