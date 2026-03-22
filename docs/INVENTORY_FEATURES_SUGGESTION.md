# 💡 Gợi ý Tính năng Inventory Management

## ✅ Đã cải thiện

### 🎨 **CSS Enhancements**
- **Modal Header**: Gradient background, tăng padding, border đậm hơn
- **Close Button**: Background color, hover rotate 90°, border-radius
- **Product Preview**: Gradient background, shadow, border, layout tốt hơn
- **Adjust Form**: Radio buttons với hover effects, better spacing
- **Form Inputs**: Border dày hơn (2px), focus effects, placeholder colors
- **Preview Result**: Gradient background xanh/đỏ dựa vào trạng thái
- **Quick Action Buttons**: Nút +1, +5, +10, +50 để điều chỉnh nhanh
- **History Items**: Card design với icons, hover effects, timeline view

---

## 🚀 Tính năng mới đề xuất

### 1️⃣ **Adjust Stock Modal - Nâng cao**

#### A. Real-time Validation
```typescript
// Hiển thị warning khi:
- Giảm quá nhiều (>50% tồn kho hiện tại)
- Tồn kho sau điều chỉnh < 10 (sắp hết)
- Tồn kho = 0 (hết hàng)

// UI:
<div class="warning-box" *ngIf="isLargeDecrease()">
  ⚠️ Cảnh báo: Bạn đang giảm hơn 50% tồn kho hiện tại
</div>
```

#### B. Lý do điều chỉnh có sẵn
```typescript
// Dropdown gợi ý lý do:
- Nhập hàng từ nhà cung cấp
- Kiểm kê định kỳ
- Hàng bị hư hỏng/hết hạn
- Điều chỉnh sai số
- Khuyến mãi/tặng kèm
- Trả hàng từ khách
- Tùy chỉnh (nhập tự do)
```

#### C. Confirm Dialog cho thay đổi lớn
```typescript
// Popup confirm khi:
- Giảm > 50 items
- Đặt về 0
- Thay đổi > 100 items

"Bạn có chắc muốn giảm từ 150 xuống 20? Đây là thay đổi lớn!"
```

#### D. Batch Adjustment
```typescript
// Cho phép điều chỉnh nhiều sản phẩm cùng lúc:
- Chọn nhiều sản phẩm từ bảng
- Áp dụng cùng 1 action (add/subtract/set)
- Ghi chú chung cho tất cả
```

---

### 2️⃣ **History Modal - Backend Integration**

#### A. Data Structure Backend
```typescript
interface StockHistory {
  _id: string;
  product: string; // Product ID
  type: 'add' | 'subtract' | 'set' | 'order' | 'return' | 'damaged';
  previousStock: number;
  newStock: number;
  change: number; // +/- amount
  reason: string;
  note?: string;
  performedBy: {
    _id: string;
    name: string;
    email: string;
  };
  orderId?: string; // Nếu từ đơn hàng
  supplierId?: string; // Nếu nhập hàng
  createdAt: Date;
}
```

#### B. API Endpoints
```typescript
// GET /api/v1/admin/products/:id/stock-history
// Query params:
- page, limit (pagination)
- startDate, endDate (filter by date)
- type (filter by type)
- sort (newest/oldest)

// Response:
{
  success: true,
  data: StockHistory[],
  pagination: { page, limit, total, pages }
}
```

#### C. Frontend Features
```typescript
// Filters:
- Theo loại thay đổi (nhập/xuất/kiểm kê/đơn hàng)
- Theo ngày (hôm nay/tuần này/tháng này/tùy chỉnh)
- Theo người thực hiện

// Export:
- Xuất lịch sử ra CSV/Excel
- Gửi email báo cáo

// Analytics:
- Biểu đồ thay đổi tồn kho theo thời gian
- Tần suất nhập/xuất
- Người thực hiện nhiều nhất
```

#### D. Real-time Updates
```typescript
// WebSocket/SSE để cập nhật real-time:
- Khi có đơn hàng mới → giảm tồn kho
- Khi nhập hàng → tăng tồn kho
- Thông báo cho admin đang xem
```

---

### 3️⃣ **Inventory Table - Additional Features**

#### A. Bulk Actions
```typescript
// Checkbox để chọn nhiều sản phẩm:
- Điều chỉnh tồn kho hàng loạt
- Export danh sách đã chọn
- Set trạng thái (còn hàng/hết hàng)
- Thêm vào danh mục
```

#### B. Advanced Filters
```typescript
// Thêm filters:
- Theo nhà cung cấp
- Theo khoảng giá
- Theo ngày nhập gần nhất
- Sản phẩm không bán được (0 đơn trong X ngày)
```

#### C. Alerts & Notifications
```typescript
// Cảnh báo tự động:
- Email khi sản phẩm sắp hết (< 10)
- Email khi sản phẩm hết hàng
- Báo cáo hàng tồn kho hằng ngày
- Cảnh báo hàng tồn quá lâu (> 90 ngày)
```

#### D. Stock Forecasting
```typescript
// Dự đoán tồn kho:
- Dựa vào lịch sử bán hàng
- Tính số ngày còn lại trước khi hết
- Gợi ý số lượng cần nhập
- Mùa vụ/xu hướng bán hàng
```

---

### 4️⃣ **Import/Export Features**

#### A. Import Stock from CSV
```typescript
// Upload CSV để nhập hàng hàng loạt:
Columns: SKU, Quantity, Reason, Note
- Validate trước khi import
- Hiển thị preview
- Rollback nếu lỗi
```

#### B. Advanced Export
```typescript
// Export options:
- PDF với logo & header
- Excel với formulas
- JSON cho API
- QR codes cho từng sản phẩm
```

---

### 5️⃣ **Stock Movement Report**

#### A. Dashboard Widget
```typescript
// Thêm vào admin dashboard:
- Top 10 sản phẩm nhập nhiều nhất
- Top 10 sản phẩm xuất nhiều nhất
- Biểu đồ thay đổi tồn kho 30 ngày
- Giá trị tồn kho theo thời gian
```

#### B. Movement Types Tracking
```typescript
// Phân loại chi tiết:
- SALE: Bán hàng (-stock)
- PURCHASE: Nhập hàng (+stock)
- RETURN_FROM_CUSTOMER: Trả hàng (+stock)
- RETURN_TO_SUPPLIER: Trả nhà cung cấp (-stock)
- DAMAGED: Hàng hư hỏng (-stock)
- EXPIRED: Hết hạn (-stock)
- INVENTORY_CHECK: Kiểm kê (±stock)
- TRANSFER: Chuyển kho (neutral)
```

---

### 6️⃣ **Integration với Orders**

#### A. Automatic Stock Deduction
```typescript
// Khi đơn hàng:
- Đặt hàng: Reserve stock (không giảm ngay)
- Thanh toán: Giảm stock, ghi history
- Hủy: Restore stock
- Trả hàng: Tăng stock lại
```

#### B. Stock Reservation System
```typescript
// Giữ hàng cho đơn chưa thanh toán:
- Reserved stock (15 phút)
- Available stock = Total - Reserved - Sold
- Auto release sau timeout
```

---

## 🎯 Ưu tiên triển khai

### Phase 1 (Ngay lập tức):
1. ✅ CSS improvements (DONE)
2. ✅ Quick action buttons (DONE)
3. Backend API cho Stock History
4. Real-time validation cho Adjust Modal

### Phase 2 (Tuần sau):
1. History Modal với real data
2. Bulk actions
3. Advanced filters
4. Email alerts

### Phase 3 (Dài hạn):
1. Stock forecasting
2. Advanced analytics
3. Import/Export CSV
4. Stock reservation system

---

## 📊 Database Schema Suggestions

```typescript
// Stock History Collection
{
  _id: ObjectId,
  product: ObjectId (ref: Product),
  type: String (enum),
  previousStock: Number,
  newStock: Number,
  change: Number,
  reason: String,
  note: String,
  performedBy: ObjectId (ref: User),
  orderId: ObjectId (ref: Order),
  createdAt: Date,
  metadata: {
    ip: String,
    userAgent: String,
    location: String
  }
}

// Index for fast queries
db.stockHistory.createIndex({ product: 1, createdAt: -1 })
db.stockHistory.createIndex({ type: 1, createdAt: -1 })
db.stockHistory.createIndex({ performedBy: 1, createdAt: -1 })
```

---

## 🔐 Security & Permissions

```typescript
// Role-based access:
- ADMIN: Full access
- WAREHOUSE_MANAGER: Adjust stock, view history
- STAFF: View only
- ACCOUNTANT: View reports only

// Audit trail:
- Log mọi thay đổi
- IP address, user agent
- Không cho xóa history
- Export audit log
```

---

## 💻 Code Examples

### History Service (Backend)
```typescript
// backend/src/services/stockHistoryService.ts
export class StockHistoryService {
  async logStockChange(data: {
    product: string;
    type: StockChangeType;
    previousStock: number;
    newStock: number;
    reason: string;
    note?: string;
    performedBy: string;
    orderId?: string;
  }) {
    const history = await StockHistory.create({
      ...data,
      change: data.newStock - data.previousStock,
      createdAt: new Date()
    });
    
    // Send notification if critical
    if (data.newStock <= 10) {
      await this.sendLowStockAlert(data.product);
    }
    
    return history;
  }
  
  async getProductHistory(productId: string, options: {
    page: number;
    limit: number;
    startDate?: Date;
    endDate?: Date;
    type?: StockChangeType;
  }) {
    const query: any = { product: productId };
    
    if (options.startDate || options.endDate) {
      query.createdAt = {};
      if (options.startDate) query.createdAt.$gte = options.startDate;
      if (options.endDate) query.createdAt.$lte = options.endDate;
    }
    
    if (options.type) query.type = options.type;
    
    const [data, total] = await Promise.all([
      StockHistory.find(query)
        .populate('performedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip((options.page - 1) * options.limit)
        .limit(options.limit),
      StockHistory.countDocuments(query)
    ]);
    
    return {
      data,
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        pages: Math.ceil(total / options.limit)
      }
    };
  }
}
```

### Frontend Service
```typescript
// frontend/src/app/features/admin/services/stock-history.service.ts
@Injectable({ providedIn: 'root' })
export class StockHistoryService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/admin`;
  
  getProductHistory(
    productId: string, 
    params?: { page?: number; limit?: number; type?: string }
  ): Observable<{ success: boolean; data: StockHistory[]; pagination: any }> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page);
    if (params?.limit) httpParams = httpParams.set('limit', params.limit);
    if (params?.type) httpParams = httpParams.set('type', params.type);
    
    return this.http.get<any>(
      `${this.apiUrl}/products/${productId}/stock-history`,
      { params: httpParams }
    );
  }
}
```

---

## 🎨 UI/UX Best Practices

1. **Loading States**: Spinner khi load history
2. **Empty States**: Illustration khi chưa có history
3. **Error Handling**: Toast notification cho errors
4. **Confirmation**: Modal confirm cho actions nguy hiểm
5. **Success Feedback**: Checkmark animation sau khi thành công
6. **Keyboard Shortcuts**: 
   - `Esc` để đóng modal
   - `Enter` để submit form
   - `Arrow keys` để navigate history items

---

Chúc bạn triển khai thành công! 🚀
