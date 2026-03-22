import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-maintenance',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="maintenance-container">
      <div class="maintenance-content">
        <div class="maintenance-icon">
          <i class="gi gi-ui-warning" aria-hidden="true"></i>
        </div>
        
        <h1>Website đang bảo trì</h1>
        <p class="subtitle">We're currently performing scheduled maintenance</p>
        
        <div class="info-box">
          <p>
            Chúng tôi đang nâng cấp hệ thống để mang đến trải nghiệm tốt hơn cho bạn.
            Vui lòng quay lại sau ít phút.
          </p>
        </div>
        
        <div class="contact-info">
          <p>Nếu cần hỗ trợ khẩn cấp, vui lòng liên hệ:</p>
          <a href="mailto:contact&#64;ponsai.vn" class="contact-link">
            <i class="gi gi-envelope-fill" aria-hidden="true"></i>
            contact&#64;ponsai.vn
          </a>
        </div>
        
        <button class="reload-btn" (click)="reload()">
          <i class="gi gi-arrow-repeat" aria-hidden="true"></i>
          Thử lại
        </button>
      </div>
    </div>
  `,
  styles: [`
    .maintenance-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%);
      padding: 20px;
    }

    .maintenance-content {
      max-width: 600px;
      width: 100%;
      text-align: center;
      background: #fff;
      padding: 60px 40px;
      border-radius: 20px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
    }

    .maintenance-icon {
      margin-bottom: 30px;
      animation: float 3s ease-in-out infinite;
    }

    .maintenance-icon i {
      width: 120px;
      height: 120px;
      font-size: 120px;
      display: inline-flex;
      color: #153243;
    }

    @keyframes float {
      0%, 100% {
        transform: translateY(0px);
      }
      50% {
        transform: translateY(-10px);
      }
    }

    h1 {
      font-size: 32px;
      font-weight: 700;
      color: #153243;
      margin: 0 0 10px;
    }

    .subtitle {
      font-size: 16px;
      color: #666;
      margin: 0 0 30px;
    }

    .info-box {
      background: #f8f9fa;
      border-left: 4px solid #c3d350;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
    }

    .info-box p {
      margin: 0;
      color: #333;
      line-height: 1.6;
      font-size: 15px;
    }

    .contact-info {
      margin-bottom: 30px;
    }

    .contact-info p {
      margin: 0 0 10px;
      color: #666;
      font-size: 14px;
    }

    .contact-link {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: #153243;
      text-decoration: none;
      font-weight: 500;
      padding: 8px 16px;
      border-radius: 6px;
      transition: background-color 0.2s;
    }

    .contact-link i,
    .reload-btn i {
      width: 20px;
      height: 20px;
      font-size: 20px;
      display: inline-flex;
    }

    .contact-link:hover {
      background: #f0f0f0;
    }

    .reload-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 32px;
      background: #153243;
      color: #c3d350;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .reload-btn:hover {
      background: #0d1f29;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(21, 50, 67, 0.3);
    }

    .reload-btn i {
      animation: spin 2s linear infinite;
    }

    .reload-btn:hover i {
      animation-play-state: running;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @media (max-width: 768px) {
      .maintenance-content {
        padding: 40px 24px;
      }

      h1 {
        font-size: 24px;
      }

      .subtitle {
        font-size: 14px;
      }
    }
  `]
})
export class MaintenanceComponent {
  reload(): void {
    window.location.reload();
  }
}
