# Hướng dẫn sử dụng hệ thống đa ngôn ngữ

## Tổng quan
Dự án đã được tích hợp hệ thống đa ngôn ngữ (i18n) với **ngx-translate**, hỗ trợ 2 ngôn ngữ:
- 🇻🇳 Tiếng Việt (vi) - Mặc định
- 🇬🇧 English (en)

## Cấu trúc file
```
frontend/src/assets/i18n/
├── vi.json  # Bản dịch tiếng Việt
└── en.json  # Bản dịch tiếng Anh
```

## Sử dụng trong Component

### 1. Import TranslateModule trong component standalone
```typescript
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  // ...
})
```

### 2. Sử dụng trong Template

#### a. Sử dụng pipe `translate`
```html
<!-- Text đơn giản -->
<h1>{{ 'nav.home' | translate }}</h1>

<!-- Với tham số -->
<p>{{ 'message.welcome' | translate: {name: userName} }}</p>

<!-- Trong attribute -->
<button [title]="'button.close' | translate">X</button>
```

#### b. Sử dụng directive `translate`
```html
<h1 translate>nav.home</h1>

<!-- Với tham số -->
<p translate [translateParams]="{name: userName}">message.welcome</p>
```

### 3. Sử dụng trong TypeScript

#### Inject TranslationService
```typescript
import { TranslationService } from '@core/services/translation.service';

export class MyComponent {
  private translationService = inject(TranslationService);

  someMethod() {
    // Lấy bản dịch
    const text = this.translationService.translate('nav.home');
    
    // Đổi ngôn ngữ
    this.translationService.setLanguage('en');
    
    // Lấy ngôn ngữ hiện tại
    const currentLang = this.translationService.getCurrentLanguage();
  }
}
```

## Thêm bản dịch mới

### Bước 1: Thêm key vào file JSON
**frontend/src/assets/i18n/vi.json**
```json
{
  "product.addToCart": "Thêm vào giỏ",
  "product.buyNow": "Mua ngay"
}
```

**frontend/src/assets/i18n/en.json**
```json
{
  "product.addToCart": "Add to Cart",
  "product.buyNow": "Buy Now"
}
```

### Bước 2: Sử dụng trong template
```html
<button>{{ 'product.addToCart' | translate }}</button>
<button>{{ 'product.buyNow' | translate }}</button>
```

## Quy tắc đặt tên key

Sử dụng cấu trúc **module.action** hoặc **module.element**:

```
nav.home           → Navigation items
product.price      → Product related
cart.total         → Cart related
form.submit        → Form elements
message.success    → Messages
button.confirm     → Buttons
```

## Language Switcher

Component `LanguageSwitcherComponent` đã được thêm vào header. Người dùng có thể:
- Click vào cờ quốc gia để đổi ngôn ngữ
- Ngôn ngữ được lưu vào `localStorage`
- Tự động detect ngôn ngữ trình duyệt lần đầu

## Ví dụ Component hoàn chỉnh

```typescript
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { TranslationService } from '@core/services/translation.service';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="product-card">
      <h3>{{ productName }}</h3>
      <p class="price">{{ 'product.price' | translate }}: {{ price }}</p>
      <button (click)="addToCart()">
        {{ 'product.addToCart' | translate }}
      </button>
      <p class="stock">
        {{ isInStock ? ('product.inStock' | translate) : ('product.outOfStock' | translate) }}
      </p>
    </div>
  `
})
export class ProductCardComponent {
  private translationService = inject(TranslationService);
  
  productName = 'Bonsai Tree';
  price = '$99';
  isInStock = true;

  addToCart() {
    const message = this.translationService.translate('message.addedToCart');
    alert(message);
  }
}
```

## Testing

### Kiểm tra chức năng
1. Mở trình duyệt tại http://localhost:4200
2. Click vào icon cờ ở header
3. Chọn ngôn ngữ khác
4. Quan sát text trên trang thay đổi ngay lập tức
5. Reload trang → Ngôn ngữ vẫn được giữ

### Debug
```typescript
// Xem ngôn ngữ hiện tại
console.log(this.translationService.getCurrentLanguage());

// Xem tất cả ngôn ngữ hỗ trợ
console.log(this.translationService.getSupportedLanguages());
```

## Notes

- ✅ File translation tự động load từ `assets/i18n/`
- ✅ Ngôn ngữ được lưu trong `localStorage` với key `app.lang`
- ✅ Auto-detect ngôn ngữ trình duyệt lần đầu
- ✅ Hỗ trợ query parameter `?lang=en` hoặc `?lang=vi`
- ⚠️ Nhớ import `TranslateModule` trong mỗi standalone component sử dụng pipe `translate`
