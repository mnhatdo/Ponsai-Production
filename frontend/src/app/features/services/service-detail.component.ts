import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { SERVICES, STAFF_ZALO_PHONE, ServiceItem } from './services.data';

@Component({
  selector: 'app-service-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <section class="service-detail-page py-5" *ngIf="service; else notFoundTpl">
      <div class="container">
        <a routerLink="/services" class="back-link mb-4 d-inline-flex align-items-center gap-2">
          ← Quay lại trang dịch vụ
        </a>

        <div class="row g-4 align-items-start">
          <div class="col-12 col-lg-6">
            <img [src]="service.image" [alt]="service.title" class="detail-image w-100">
          </div>

          <div class="col-12 col-lg-6">
            <span class="detail-category mb-2 d-inline-block">{{ service.category }}</span>
            <h1 class="detail-title mb-3">{{ service.title }}</h1>
            <p class="detail-description mb-4">{{ service.detailDescription }}</p>

            <a class="btn btn-dark mb-4" [href]="zaloLink" target="_blank" rel="noopener noreferrer">
              Liên hệ với nhân viên
            </a>

            <div class="detail-panel mb-4">
              <h2 class="h5 mb-3">Điểm nổi bật</h2>
              <ul class="mb-0 ps-3">
                <li class="mb-2" *ngFor="let item of service.highlights">{{ item }}</li>
              </ul>
            </div>

            <div class="detail-panel">
              <h2 class="h5 mb-3">Quy trình triển khai</h2>
              <ol class="mb-0 ps-3">
                <li class="mb-2" *ngFor="let step of service.process">{{ step }}</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </section>

    <ng-template #notFoundTpl>
      <section class="py-5">
        <div class="container text-center">
          <h1 class="h3 mb-3">Không tìm thấy dịch vụ</h1>
          <p class="mb-4">Dịch vụ bạn chọn hiện không tồn tại hoặc đã được cập nhật.</p>
          <a routerLink="/services" class="btn btn-dark">Về danh sách dịch vụ</a>
        </div>
      </section>
    </ng-template>
  `,
  styles: [`
    .service-detail-page {
      padding-top: calc(8rem + 30px) !important;
    }
    
    .back-link {
      text-decoration: none;
      color: var(--bs-secondary-color);
      font-weight: 600;
    }

    .back-link:hover {
      color: var(--bs-body-color);
    }

    .detail-image {
      border-radius: 16px;
      aspect-ratio: 4 / 3;
      object-fit: cover;
      box-shadow: 0 12px 28px rgba(18, 22, 28, 0.12);
    }

    .detail-category {
      font-size: 0.82rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--bs-primary);
    }

    .detail-title {
      font-size: clamp(1.6rem, 2.4vw, 2.3rem);
      line-height: 1.25;
      font-weight: 700;
      color: var(--bs-body-color);
    }

    .detail-description {
      color: var(--bs-secondary-color);
      max-width: 58ch;
    }

    .detail-panel {
      border-radius: 14px;
      padding: 1rem 1rem 0.8rem;
      background: rgba(255, 255, 255, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(4px);
    }
  `]
})
export class ServiceDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);

  service: ServiceItem | null = null;
  zaloLink = '';

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    this.service = SERVICES.find(item => item.slug === slug) ?? null;
    this.zaloLink = `https://zalo.me/${this.normalizePhone(STAFF_ZALO_PHONE)}`;
  }

  private normalizePhone(phone: string): string {
    return phone.replace(/\D/g, '');
  }
}
