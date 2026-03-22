# Promotion System - User Guide

## 📋 Overview

Hệ thống promotion cho phép admin tạo mã giảm giá và user áp dụng chúng khi checkout. Hệ thống hỗ trợ nhiều loại giảm giá và validation rules.

---

## 🎯 Features

### Admin Side
- ✅ Tạo promotion codes với nhiều loại giảm giá
- ✅ Quản lý trạng thái (active/inactive)
- ✅ Thiết lập điều kiện (min order, usage limit, date range)
- ✅ Theo dõi usage statistics

### User Side  
- ✅ Nhập promotion code tại checkout
- ✅ Real-time validation
- ✅ Hiển thị discount amount
- ✅ Free shipping benefits
- ✅ Auto-calculate final total

---

## 🔧 Admin - Tạo Promotion Code

### Loại giảm giá:

#### 1. **Percentage (Giảm theo %)**
```
Type: percentage
Value: 10-100 (%)
Max Discount: Optional (£50 tối đa)
Min Order: £20

Example: SUMMER20
- Giảm 20%
- Tối đa £50
- Đơn tối thiểu £20
```

#### 2. **Fixed Amount (Giảm cố định)**
```
Type: fixed
Value: £10
Min Order: £50

Example: SAVE10
- Giảm £10
- Đơn tối thiểu £50
```

#### 3. **Free Shipping (Miễn phí vận chuyển)**
```
Type: free_shipping
Value: 0 (ignored)
Min Order: £30

Example: FREESHIP
- Miễn phí ship
- Đơn tối thiểu £30
```

### Thiết lập nâng cao:

**Usage Limits:**
- `usageLimit`: Tổng số lần sử dụng (VD: 100)
- `usagePerUser`: Mỗi user tối đa (VD: 1)

**Date Range:**
- `startDate`: Ngày bắt đầu
- `endDate`: Ngày kết thúc

**Status:**
- `active: true` - Hoạt động
- `active: false` - Tạm dừng

---

## 👤 User - Sử dụng Promotion Code

### Bước 1: Checkout Page
1. Thêm sản phẩm vào cart
2. Đi đến checkout page
3. Tìm "Promotion Code" section (trong Order Summary)

### Bước 2: Nhập Promotion Code
```
Input: SUMMER20
↓
Click "Apply"
↓
Validation...
↓
✅ Success: "Promotion applied successfully!"
```

### Bước 3: Xem Discount
```
Order Summary:
- Subtotal: £100.00
- Promotion Discount: -£20.00  ← Automatically calculated
- Shipping: Free
- Total: £80.00  ← Final amount

💰 You save £20.00!
```

### Bước 4: Complete Order
- Discount tự động apply vào order
- Order được tạo với promotion info
- Usage count tăng lên

---

## 🔍 Validation Rules

### Promotion Code Checks:
1. ✅ Code exists
2. ✅ Status is active
3. ✅ Date range valid (now between start/end)
4. ✅ Usage limit not exceeded
5. ✅ User hasn't exceeded per-user limit
6. ✅ Order meets minimum amount

### Error Messages:

| Error | Reason |
|-------|--------|
| "Invalid promotion code" | Code không tồn tại |
| "This promotion is currently inactive" | Admin đã tạm dừng |
| "This promotion has expired" | Quá ngày kết thúc |
| "This promotion has reached its usage limit" | Đã hết lượt dùng |
| "You have already used this promotion X time(s)" | User đã dùng hết quota |
| "Minimum order amount is £XX" | Cart total chưa đủ |

---

## 🛠️ Technical Flow

### 1. User applies promotion:
```typescript
POST /api/v1/promotions/validate
Body: {
  code: "SUMMER20",
  orderAmount: 100,
  items: [{ productId, quantity }]
}

Response: {
  valid: true,
  data: {
    promotion: { code, name, type, value... },
    discount: { amount: 20, finalAmount: 80 }
  }
}
```

### 2. Frontend stores promotion:
```typescript
PromotionService.applyPromotion(promotion, discount)
// Stores in signals for reactivity
```

### 3. Order creation includes promotion:
```typescript
POST /api/v1/orders
Body: {
  shippingAddress: {...},
  paymentMethod: "momo",
  promotionCode: "SUMMER20",  ← Added
  promotionDiscount: 20        ← Added
}
```

### 4. Backend records usage:
```typescript
POST /api/v1/promotions/apply
Body: {
  promotionId: "xxx",
  orderId: "yyy",
  discountAmount: 20
}
// Increments usedCount
// Records usage in usedBy array
```

---

## 📊 Admin - Theo dõi Promotion

### Stats Dashboard:
```
Promotion Card:
┌─────────────────────────────────┐
│ SUMMER20                        │
│ Giảm 20% - Tối đa £50          │
│                                 │
│ Used: 25/100                    │
│ Progress: ████░░░░░░ 25%       │
│                                 │
│ Active | Edit | Delete         │
└─────────────────────────────────┘
```

### Usage Tracking:
- `usedCount`: Total times used
- `usedBy[]`: Array of usage records
  - `user`: User ID
  - `usedAt`: Timestamp
  - `orderId`: Order reference
  - `discountAmount`: Saved amount

---

## 🧪 Testing Examples

### Test Promotion Codes (Create these in admin):

```typescript
// Test 1: Percentage with max discount
{
  code: "TEST20",
  type: "percentage",
  value: 20,
  maxDiscount: 50,
  minOrderAmount: 20,
  active: true,
  startDate: "2026-01-01",
  endDate: "2026-12-31"
}

// Test 2: Fixed discount
{
  code: "SAVE10",
  type: "fixed",
  value: 10,
  minOrderAmount: 50,
  active: true
}

// Test 3: Free shipping
{
  code: "FREESHIP",
  type: "free_shipping",
  value: 0,
  minOrderAmount: 30,
  active: true
}

// Test 4: Limited usage
{
  code: "LIMITED5",
  type: "percentage",
  value: 15,
  usageLimit: 5,           ← Only 5 total uses
  usagePerUser: 1,         ← Each user once
  active: true
}
```

### Test Scenarios:

#### ✅ Success Cases:
1. Cart = £100, Code = "TEST20" → Discount = £20
2. Cart = £300, Code = "TEST20" → Discount = £50 (max cap)
3. Cart = £60, Code = "SAVE10" → Discount = £10
4. Cart = £40, Code = "FREESHIP" → Free shipping

#### ❌ Failure Cases:
1. Cart = £15, Code = "TEST20" → Error: Min £20
2. Code = "EXPIRED" (end date passed) → Error: Expired
3. Code = "INACTIVE" (active: false) → Error: Inactive
4. Code = "LIMITED5" (used 5 times) → Error: Limit reached
5. User used "LIMITED5" before → Error: Already used

---

## 📝 Code Checklist

### Backend ✅
- [x] `promotionController.ts` - Validation & application logic
- [x] `promotionRoutes.ts` - API endpoints
- [x] Routes registered in `index.ts`
- [x] Promotion model with validation

### Frontend ✅
- [x] `promotion.service.ts` - Service layer
- [x] Checkout component integration
- [x] Promotion input UI
- [x] Discount display
- [x] Order creation with promotion data

### Features ✅
- [x] Real-time validation
- [x] Discount calculation
- [x] Free shipping support
- [x] Usage tracking
- [x] Error handling
- [x] Success feedback

---

## 🎨 UI Components

### Promotion Input (Checkout Page)
```html
┌─ Promotion Code ───────────────┐
│ [SUMMER20____] [Apply]         │
│ ✓ SUMMER20 - Summer Sale       │
└────────────────────────────────┘
```

### Order Summary with Discount
```html
┌─ Order Summary ────────────────┐
│ Subtotal:       £100.00        │
│ 🏷️ Discount:    -£20.00       │
│ Shipping:       Free           │
│ ─────────────────────────────  │
│ Total:          £80.00         │
│                                │
│ 💰 You save £20.00!            │
└────────────────────────────────┘
```

---

## 🚀 Quick Start

### 1. Admin tạo promotion:
```bash
Navigate to: /admin/promotions
→ Click "Tạo mã mới"
→ Fill form
→ Click "Tạo mã"
```

### 2. User áp dụng:
```bash
Navigate to: /checkout
→ Find "Promotion Code" section
→ Enter code: SUMMER20
→ Click "Apply"
→ See discount applied
→ Complete order
```

### 3. Verify:
```bash
Admin panel:
→ See usedCount increased
→ Check usage details
```

---

## ⚡ Performance Notes

- Promotion validation: < 100ms
- Cached in frontend signals
- Auto-clears after checkout
- No impact on cart operations

---

## 🔒 Security

- ✅ Authentication required for validation
- ✅ Server-side validation (not client)
- ✅ Usage limits enforced
- ✅ Discount amount verified before order creation
- ✅ Cannot apply expired/inactive codes
- ✅ User-specific usage tracking

---

## 📞 Support

**Admin Issues:**
- Promotion not applying? Check active status & date range
- Usage count not updating? Verify API call in network tab

**User Issues:**
- Code invalid? Verify code spelling (case-insensitive)
- Min order error? Add more items to cart
- Already used? Each code has per-user limits

**Debug:**
```bash
# Check promotion in DB
db.promotions.find({ code: "SUMMER20" })

# Check user usage
db.promotions.findOne(
  { code: "SUMMER20" },
  { usedBy: 1 }
)
```

---

**🎉 Promotion system ready to use!**
