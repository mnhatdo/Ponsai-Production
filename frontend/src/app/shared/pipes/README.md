# Product Translation Pipe

## Mô tả
Pipe `productTranslate` tự động dịch tên sản phẩm từ tiếng Anh sang tiếng Việt dựa trên các từ khóa phổ biến.

## Cách hoạt động
- **Tiếng Anh (en)**: Hiển thị tên gốc
- **Tiếng Việt (vi)**: Tự động thay thế các từ khóa tiếng Anh bằng tiếng Việt

## Sử dụng

### 1. Import pipe vào component
```typescript
import { ProductTranslatePipe } from '@shared/pipes/product-translate.pipe';

@Component({
  imports: [CommonModule, ProductTranslatePipe],
  // ...
})
```

### 2. Sử dụng trong template
```html
<!-- Trước -->
<h3>{{ product.name }}</h3>

<!-- Sau -->
<h3>{{ product.name | productTranslate }}</h3>
```

## Ví dụ dịch

| Tên gốc (EN) | Tên dịch (VI) |
|--------------|---------------|
| Juniper Bonsai Starter Pot | Cây Tùng Cây Bonsai Khởi đầu Chậu |
| Ceramic Brown Round Pot 15cm | Gốm sứ Nâu Tròn Chậu 15cm |
| Handmade Rustic Square Container | Làm thủ công Phong cách mộc mạc Vuông Hộp |
| Pruning Scissors Set | Cắt tỉa Kéo Bộ |

## Từ khóa được hỗ trợ

### Loại cây
- Bonsai, Juniper, Pine, Maple, Elm, Ficus, Oak, Cherry, Azalea

### Loại sản phẩm
- Pot, Ceramic, Planter, Container, Dish, Bowl, Vase

### Dụng cụ
- Scissors, Shears, Pruning, Wire, Tools, Cutters, Trimming, Rake

### Vật liệu
- Soil, Fertilizer, Moss, Stone, Gravel, Sand, Compost, Mix

### Màu sắc
- Brown, Green, Blue, White, Black, Red, Yellow, Gray, Cream, Beige

### Phong cách
- Rustic, Modern, Classic, Traditional, Vintage, Handmade, Handcrafted
- Glazed, Unglazed, Rectangular, Round, Square, Oval, Cascade, Cube

### Kích thước
- Small, Medium, Large, Starter, Mini

## Thêm từ khóa mới

Để thêm từ mới, mở file `product-translate.pipe.ts` và cập nhật object `translations`:

```typescript
private readonly translations: Record<string, string> = {
  // ... existing translations
  'NewWord': 'TừMới',
};
```

## Lưu ý
- Pipe tự động phát hiện ngôn ngữ hiện tại
- Không ảnh hưởng database hoặc backend
- Có thể tắt bằng cách xóa `| productTranslate` khỏi template
