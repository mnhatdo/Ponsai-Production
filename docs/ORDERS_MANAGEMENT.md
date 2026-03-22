# Hệ Thống Quản Lý Đơn Hàng (Orders Management)

## 📋 Mục Lục
1. [Tổng Quan](#tổng-quan)
2. [Kiến Trúc Hệ Thống](#kiến-trúc-hệ-thống)
3. [Tính Năng Chi Tiết](#tính-năng-chi-tiết)
4. [API Endpoints](#api-endpoints)
5. [Database Schema](#database-schema)
6. [Frontend Components](#frontend-components)
7. [Business Logic](#business-logic)
8. [Hướng Dẫn Sử Dụng](#hướng-dẫn-sử-dụng)
9. [Troubleshooting](#troubleshooting)

---

## Tổng Quan

Hệ thống quản lý đơn hàng cho phép Admin xem, tìm kiếm, lọc, cập nhật trạng thái và hủy đơn hàng. Hệ thống tự động xử lý việc hoàn trả số lượng sản phẩm vào kho khi đơn hàng bị hủy.

### Công Nghệ Sử Dụng
- **Frontend**: Angular 18+ (Standalone Components, Signals)
- **Backend**: Node.js + Express + TypeScript
- **Database**: MongoDB + Mongoose
- **State Management**: Angular Signals + Services

---

## Kiến Trúc Hệ Thống

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Angular)                    │
├─────────────────────────────────────────────────────────┤
│  OrderListComponent                                      │
│  ├── Search & Filters                                    │
│  ├── Orders Table                                        │
│  ├── Pagination                                          │
│  └── Modals                                              │
│      ├── Order Detail Modal                              │
│      ├── Status Update Modal                             │
│      └── Cancel Confirmation Modal                       │
├─────────────────────────────────────────────────────────┤
│  AdminService (State Management)                         │
│  ├── orders signal                                       │
│  ├── pagination signal                                   │
│  └── loading signal                                      │
└─────────────────────────────────────────────────────────┘
                            │
                            │ HTTP Requests
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    BACKEND (Express)                     │
├─────────────────────────────────────────────────────────┤
│  AdminController                                         │
│  ├── getAdminOrders()                                    │
│  ├── getAdminOrderById()                                 │
│  ├── updateOrderStatus()                                 │
│  └── cancelOrder()                                       │
├─────────────────────────────────────────────────────────┤
│  PaymentLifecycleManager                                 │
│  ├── transitionToCancelled()                             │
│  └── restoreStock()                                      │
├─────────────────────────────────────────────────────────┤
│  Order Model                                             │
│  ├── user (ref User)                                     │
│  ├── items (ref Product)                                 │
│  ├── status                                              │
│  └── paymentStatus                                       │
└─────────────────────────────────────────────────────────┘
                            │
                            │ Mongoose
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    DATABASE (MongoDB)                    │
│  ├── orders                                              │
│  ├── users                                               │
│  └── products                                            │
└─────────────────────────────────────────────────────────┘
```

---

## Tính Năng Chi Tiết

### 1. Xem Danh Sách Đơn Hàng

#### Thông tin hiển thị:
- **Mã đơn**: 8 ký tự cuối của Order ID
- **Khách hàng**: Tên + Email
- **Sản phẩm**: Ảnh thumbnail (hiển thị 2 sản phẩm đầu + số lượng còn lại)
- **Tổng tiền**: Format GBP currency
- **Trạng thái đơn hàng**: Badge với màu sắc phân biệt
- **Trạng thái thanh toán**: Badge với màu sắc phân biệt
- **Ngày tạo**: Format dd/mm/yyyy
- **Thao tác**: 3 buttons (View, Cập nhật, Cancel)

#### Màu sắc Status Badge:
```scss
// Order Status
pending     → Yellow  (#fff3cd)
processing  → Cyan    (#d1ecf1)
shipped     → Orange  (#ffe8d6)
delivered   → Green   (#d4edda)
cancelled   → Red     (#f8d7da)

// Payment Status
pending     → Lime    (#c3d350)
paid        → Navy    (#153243)
failed      → Gray    (#e6e6ea)
refunded    → Blue    (#284b63)
```

---

### 2. Tìm Kiếm & Lọc

#### Search (Debounce 300ms):
- Tìm theo **Order ID**
- Tìm theo **Email khách hàng**

#### Filters:
1. **Trạng thái đơn hàng**
   - Tất cả / Chờ xử lý / Đang xử lý / Đang giao / Đã giao / Đã hủy

2. **Trạng thái thanh toán**
   - Tất cả / Chờ thanh toán / Đã thanh toán / Thất bại / Hoàn tiền

3. **Khoảng thời gian**
   - Từ ngày → Đến ngày (Date pickers)

4. **Clear Filters Button**
   - Reset tất cả filters về mặc định

#### Pagination:
- 20 orders/page
- Smart pagination (hiển thị 5 pages gần current page)
- Buttons: Trước, [1,2,3,4,5], Sau

---

### 3. Xem Chi Tiết Đơn Hàng

Modal hiển thị đầy đủ thông tin:

#### Grid 2 cột (4 sections):
1. **Thông tin khách hàng**
   - Họ tên
   - Email
   - Điện thoại

2. **Địa chỉ giao hàng**
   - Đường
   - Thành phố, Tiểu bang
   - Mã bưu điện, Quốc gia

3. **Trạng thái**
   - Trạng thái đơn hàng (badge)
   - Trạng thái thanh toán (badge)
   - Mã vận chuyển (nếu có)
   - Ghi chú (nếu có)

4. **Thông tin đơn hàng**
   - Ngày tạo
   - Cập nhật lần cuối
   - Phương thức thanh toán

#### Bảng sản phẩm (full width):
| Sản phẩm | SKU | Đơn giá | Số lượng | Thành tiền |
|----------|-----|---------|----------|------------|
| Ảnh + Tên | - | £63.49 | 1 | £63.49 |

**Footer**: Tổng cộng (right-aligned)

---

### 4. Cập Nhật Trạng Thái

#### Điều kiện mở modal:
- ✅ Tất cả orders **TRỪ** `status === 'cancelled'`
- ✅ Có thể update khi đã giao (`delivered`)

#### Form fields:
1. **Trạng thái đơn hàng** (dropdown)
   - Không thay đổi / Chờ xử lý / Đang xử lý / Đang giao / Đã giao

2. **Trạng thái thanh toán** (dropdown)
   - Không thay đổi / Chờ thanh toán / Đã thanh toán / Thất bại / Hoàn tiền

3. **Mã vận chuyển** (text input)
   - Placeholder: "VD: VN123456789"

4. **Ghi chú** (textarea, 2 rows)
   - Placeholder: "Ghi chú thêm..."

#### Hành vi:
- Pre-fill current status vào dropdown
- Giữ vị trí scroll sau khi update
- Reload orders list với populate đầy đủ
- Không hiển thị N/A cho user/product data

---

### 5. Hủy Đơn Hàng (Cancel Order)

#### Điều kiện hiển thị button Cancel:
❌ **KHÔNG cho cancel** nếu:
- `status === 'shipped'` (Đang giao)
- `status === 'delivered'` (Đã giao)
- `status === 'cancelled'` (Đã hủy)
- `paymentStatus === 'paid'` (Đã thanh toán)
- `paymentStatus === 'refunded'` (Đã hoàn tiền)

✅ **CHO PHÉP cancel** khi:
- `status` trong [`pending`, `processing`]
- `paymentStatus` trong [`pending`, `failed`]

#### Cancel Flow:

```
1. Admin nhấn button "Cancel"
   ↓
2. Confirmation Modal hiện ra
   - Hiển thị Order ID
   - Textarea nhập lý do
   - Warning: "Số lượng sản phẩm sẽ được hoàn trả vào kho"
   ↓
3. Admin confirm "Hủy đơn"
   ↓
4. Frontend gọi API: PATCH /api/v1/admin/orders/:id/cancel
   ↓
5. Backend xử lý:
   a. Kiểm tra điều kiện (delivered? cancelled?)
   b. PaymentLifecycle.transitionToCancelled()
   c. RestoreStock() → Tăng stockQuantity
   d. Update order.notes với lý do
   e. Create AuditLog
   ↓
6. Frontend nhận response:
   a. Alert thành công
   b. Reload orders list
   c. Giữ vị trí scroll
   ↓
7. Stock đã được hoàn trả vào kho ✅
```

## Hướng Dẫn Sử Dụng

### 1. Xem Danh Sách Orders

```
1. Truy cập: http://localhost:4200/admin/orders
2. Bảng hiển thị 20 orders/page
3. Mỗi order hiển thị:
   - Mã đơn (8 ký tự)
   - Thông tin khách hàng
   - Preview sản phẩm (2 items + count)
   - Tổng tiền
   - Status badges
   - Action buttons
```

---

### 2. Tìm Kiếm Orders

**By Order ID:**
```
1. Nhập 8 ký tự cuối của order ID vào search box
   VD: "5f05c8"
2. Chờ 300ms (debounce)
3. Kết quả hiển thị real-time
```

**By Customer Email:**
```
1. Nhập email hoặc một phần email
   VD: "a9@tester"
2. System tìm tất cả orders của user đó
```

---

### 3. Lọc Orders

**Single Filter:**
```
1. Chọn dropdown: "Trạng thái đơn hàng"
2. Select "Đang xử lý"
3. Table auto-refresh với filtered results
```

**Multiple Filters:**
```
1. Status = "Đang giao"
2. Payment = "Đã thanh toán"
3. Date range = "01/01/2026" đến "31/01/2026"
4. All conditions combined với AND logic
```

**Clear All Filters:**
```
1. Click button "🗑️ Xóa lọc"
2. Tất cả filters reset về default
3. Table reload với full data
```

---

### 4. Cập Nhật Trạng Thái

**Step-by-step:**
```
1. Click button "Cập nhật" (orange) trên order row
2. Modal hiện ra với current status pre-filled
3. Update các fields cần thiết:
   - Order status: "Đang giao"
   - Payment status: "Đã thanh toán"
   - Tracking number: "VN123456789"
   - Notes: "Đã gửi hàng qua GHTK"
4. Click "Cập nhật"
5. ✅ Success → Alert → Table reload → Scroll giữ nguyên
```

**Tips:**
- Dropdown có option "-- Không thay đổi --" để skip field
- Chỉ fields được điền mới được update
- Có thể update đơn đã giao (delivered) để sửa tracking/notes

---

### 5. Hủy Đơn Hàng

**When to cancel:**
- ✅ Order status: `pending` hoặc `processing`
- ✅ Payment status: `pending` hoặc `failed`
- ❌ KHÔNG thể cancel khi:
  - Đã giao (`delivered`)
  - Đang giao (`shipped`)
  - Đã thanh toán (`paid`)
  - Đã hoàn tiền (`refunded`)

**Cancel Process:**
```
1. Click button "Cancel" (red) trên order row
2. Confirmation modal hiện ra:
   - Hiển thị Order ID
   - Warning: Stock sẽ được hoàn trả
3. Nhập lý do hủy (optional but recommended):
   "Khách hàng yêu cầu hủy do đổi ý"
4. Click "Hủy đơn" (red button)
5. ✅ Alert: "Đơn hàng đã được hủy thành công! 
            Số lượng sản phẩm đã được hoàn trả về kho."
6. Table reload với order status = CANCELLED
7. Scroll giữ nguyên vị trí
```

**Stock Restoration:**
```
VD: Order có 3 sản phẩm:
- Product A (qty: 2)
- Product B (qty: 1)
- Product C (qty: 5)

Sau khi cancel:
- Product A stock: +2
- Product B stock: +1
- Product C stock: +5
```

---

### 6. Xem Chi Tiết Order

```
1. Click button "View" (blue) trên order row
2. Modal large hiển thị 4 sections + product table
3. Xem đầy đủ thông tin:
   - Customer details
   - Shipping address
   - Order & Payment status
   - Tracking number
   - Notes
   - Full product list với SKU
4. Click "Đóng" hoặc click outside modal để đóng
```

---

## Troubleshooting

### 1. Button "Cập nhật" bị disabled

**Nguyên nhân:**
- Order status = `cancelled`

**Solution:**
- Không thể update order đã hủy
- Cần tạo order mới

---

### 2. Button "Cancel" không hiển thị

**Nguyên nhân:**
- Order đã shipped/delivered
- Payment đã paid/refunded

**Solution:**
- Cancel chỉ áp dụng cho orders pending/processing
- Với orders đã giao → Contact customer support

---

### 3. Stock không được hoàn trả sau khi cancel

**Check console log:**
```bash
# Backend terminal should show:
🔄 [PaymentLifecycle] Restoring stock for cancelled order ...
   ✅ Restored 2x of product ...
   ✅ Restored 1x of product ...
```

**Nếu không thấy:**
1. Check `paymentLifecycleManager.ts` → `restoreStock()` method
2. Verify `transitionToCancelled()` gọi `await this.restoreStock(order)`
3. Check Product model có field `stockQuantity`

**Nếu thấy error:**
```bash
❌ Failed to restore stock for product ...: Error message
```
→ Check Product ID có tồn tại trong DB không

---

### 4. User/Product hiển thị N/A sau update

**Nguyên nhân:**
- Backend không populate user/product khi update

**Solution:**
✅ Đã fix: `loadOrders()` luôn được gọi sau update
```typescript
this.adminService.updateOrderStatus(...).subscribe({
  next: () => {
    this.loadOrders();  // Full populate
  }
});
```

Backend populate:
```typescript
.populate('user', 'name email')
.populate('items.product', 'name primaryImage price sku')
```

---

### 5. Scroll bị nhảy lên đầu trang sau update

**Nguyên nhân:**
- Page reload mà không save scroll position

**Solution:**
✅ Đã fix với `savedScrollPosition` mechanism
```typescript
// Before action
this.savedScrollPosition = window.scrollY;

// After reload (in loadOrders success callback)
setTimeout(() => {
  window.scrollTo(0, this.savedScrollPosition);
  this.savedScrollPosition = 0;
}, 100);
```

---

### 6. Cannot cancel order: "Payment is already PAID"

**Error Message:**
```json
{
  "success": false,
  "message": "Payment is already PAID. This is a final state and cannot be changed."
}
```

**Nguyên nhân:**
- PaymentLifecycle không cho transition từ PAID → CANCELLED
- PAID là final state (business rule)

**Solution:**
- Không thể cancel order đã thanh toán
- Cần process refund thay vì cancel:
  1. Admin manually refund payment
  2. Update order status = `refunded`
  3. Manual restore stock (hoặc thêm feature refund order)

---

### 7. Search không hoạt động

**Check:**
1. Network tab: Request có đi đến backend?
2. Backend log: Query có đúng?
3. Database: User email có đúng format?

**Debug search:**
```typescript
// In onSearch()
console.log('Search term:', this.searchTerm);

// In backend
console.log('Search query:', req.query.search);
console.log('Matching users:', matchingUsers);
```

---

### 8. SKU không hiển thị trong Order Detail

**Check:**
1. Product model có field `sku`?
2. Backend populate có include `sku`?
   ```typescript
   .populate('items.product', 'name primaryImage price sku')
   ```
3. Product trong DB có giá trị SKU?

**Fix:**
```typescript
// Template
<td>{{ item.product.sku || '-' }}</td>

// Backend adminController.ts
.populate('items.product', 'name primaryImage price sku')
```

---

## Best Practices

### 1. Always populate full data
```typescript
// ✅ Good
.populate('user', 'name email phone')
.populate('items.product', 'name primaryImage price sku')

// ❌ Bad
.populate('user')  // Returns everything (password!)
```

---

### 2. Use atomic operations for stock
```typescript
// ✅ Good - Atomic
Product.findByIdAndUpdate(id, { $inc: { stockQuantity: qty } })

// ❌ Bad - Race condition
const product = await Product.findById(id);
product.stockQuantity += qty;
await product.save();
```

---

### 3. Always handle errors gracefully
```typescript
// ✅ Good
.subscribe({
  next: () => { /* success */ },
  error: (error) => {
    console.error('Error:', error);
    alert('Lỗi: ' + (error.error?.message || 'Vui lòng thử lại'));
  }
})

// ❌ Bad
.subscribe(() => { /* only success, error crashes app */ })
```

---

### 4. Preserve user experience
```typescript
// ✅ Good - Save scroll position
this.savedScrollPosition = window.scrollY;
// ... action ...
window.scrollTo(0, this.savedScrollPosition);

// ❌ Bad - User loses position
this.loadOrders();  // Jumps to top
```

---

## Changelog

### Version 1.0.0 (2026-01-18)
- ✅ Initial release
- ✅ Full CRUD operations
- ✅ Search & filters
- ✅ Auto stock restoration
- ✅ Scroll position preservation
- ✅ SKU display in order details
- ✅ Allow update delivered orders
- ✅ Cancel with reason & warning

---

## License

Internal documentation for Ponsai Store Admin Panel.

---

**Last Updated:** January 18, 2026  
**Author:** Development Team  
**Version:** 1.0.0
