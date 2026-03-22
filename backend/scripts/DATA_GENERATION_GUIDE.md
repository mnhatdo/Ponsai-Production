# Backend Scripts

Utility scripts cho database management, data generation, và testing.

---

## 📊 Data Generation Scripts (NEW)

### `generate-realistic-data.js` ⭐

**Mục đích:** Tạo dữ liệu giả hợp lý cho analytics và ML training (6 tháng)

**Chạy:**
```bash
cd backend
npm run build
node scripts/generate-realistic-data.js
```

**Tính năng:**
- ✅ Sử dụng users hiện có (không tạo mới)
- ✅ Sử dụng products & categories hiện có (không tạo mới)
- ✅ Tạo Sessions với realistic IP, user agents (23,000+ sessions)
- ✅ Tạo PageVisits liên kết với sessions (140,000+ page views)
- ✅ Tạo Orders với status hợp lệ (2,300+ orders):
  - ❌ KHÔNG có status/payment "created"
  - ✅ Nếu cancelled → payment phải cancelled
  - ✅ Realistic workflows: pending → processing → shipped → delivered
- ✅ Tạo DailyMetrics từ dữ liệu thực (185 days)
- ✅ Thời gian: 6 tháng trở lại từ hôm nay
- ✅ Dữ liệu đồng nhất và hợp lý

**Yêu cầu trước:**
```bash
# Phải có users
npm run seed:admin

# Phải có products
npm run seed:bonsai
```

**Output:**
```
✅ 23,454 sessions
✅ 140,694 page views  
✅ 2,330 orders (£692K revenue)
✅ 185 daily metrics
✅ 0 errors / invalid data
```

---

### `verify-data.js`

**Mục đích:** Kiểm tra chất lượng dữ liệu đã generate

**Chạy:**
```bash
node scripts/verify-data.js
```

**Output:**
- 📊 Orders breakdown (by status, payment, method)
- 💰 Revenue statistics (total, avg order value)
- 👥 Session statistics (total, unique visitors)
- 📄 Page visit statistics (top 10 pages)
- 📈 Daily metrics averages
- ✅ Data quality checks (no invalid data)

---

### `sample-queries.js`

**Mục đích:** Xem sample data để verify

**Chạy:**
```bash
node scripts/sample-queries.js
```

**Hiển thị:**
1. 5 orders gần nhất (với user + product details)
2. 5 sessions ngẫu nhiên
3. 10 page visits gần nhất
4. 7 ngày daily metrics
5. Revenue by payment method
6. Monthly revenue trend (6 months)

---

## 🗄️ Database Management Scripts

### `list-all-users.js`

**Mục đích:** Liệt kê tất cả users trong database

**Chạy:**
```bash
node scripts/list-all-users.js
```

---

### `migrate-payment-lifecycle.js`

**Mục đích:** Migration script cho payment lifecycle updates

**Chạy:**
```bash
node scripts/migrate-payment-lifecycle.js
```

**Note:** Migration này đã chạy rồi. Giữ lại để reference.

---

## 📂 Archive Scripts

Các scripts cũ không còn dùng, lưu trong `archive/` folder:
- Analysis scripts (analyze-categories, check-accessories)
- Debug scripts (check-admin, check-db, check-password-hash)
- One-time setup scripts (create-admin, fix-category-mapping)

---

## ⚙️ Complete Workflow

### 1️⃣ Setup Database Ban Đầu

```bash
# Tạo admin user
npm run seed:admin

# Tạo products & categories
npm run seed:bonsai

# Tạo settings
npm run seed:settings

# Tạo test users (optional)
npm run seed:test-users
```

### 2️⃣ Generate Test Data (6 Months)

```bash
# Build TypeScript trước
npm run build

# Generate realistic data
node scripts/generate-realistic-data.js
```

**Sẽ tạo:**
- ~23,000 sessions (realistic patterns)
- ~140,000 page visits
- ~2,300 orders (£692K revenue)
- 185 daily metrics

### 3️⃣ Verify Data Quality

```bash
# Check data quality
node scripts/verify-data.js

# Xem sample data
node scripts/sample-queries.js
```

### 4️⃣ Reset & Regenerate (Nếu cần)

```bash
# Script tự động xóa old data trước khi generate
node scripts/generate-realistic-data.js
```

---

## 📝 Data Generation Details

### Dữ liệu được tạo:

**Sessions (23,000+)**
- Realistic IP addresses (random, không duplicate quá nhiều)
- User agents thực tế (Chrome, Safari, Firefox, Mobile)
- Session duration: 2-15 minutes
- Page views per session: 2-10 pages
- 30% logged in, 70% anonymous
- Weekend boost: 1.5x traffic
- Growth trend: +30% over 6 months

**Page Visits (140,000+)**
- Home page: ~30,000 views
- Product listing: ~14,000 views
- Checkout: ~14,000 views
- Cart: ~14,000 views
- Product details: ~40,000 views (distributed)
- Time on page: 10-120 seconds

**Orders (2,300+)**
- Conversion rate: 8-10% (realistic)
- 1-3 products per order
- Total revenue: ~£692K
- AOV (Average Order Value): £343
- Payment methods:
  - 25% MoMo
  - 25% Manual Payment
  - 25% Bank Transfer
  - 25% COD
- Order status distribution:
  - 26% Delivered (best case)
  - 26% Shipped
  - 18% Processing
  - 25% Pending (various stages)
  - 5% Cancelled

**Daily Metrics (185 days)**
- Auto-aggregated từ dữ liệu thực
- Avg sessions/day: ~127
- Avg orders/day: ~13
- Avg revenue/day: £3,742
- Avg conversion: 8.6%

### Dữ liệu KHÔNG tạo:

❌ Users (dùng existing)  
❌ Products (dùng existing)  
❌ Categories (dùng existing)  
❌ Events (không liên quan đến yêu cầu)

### Data Quality Guarantees:

✅ **No 'created' status** - Tất cả orders có status hợp lệ  
✅ **Cancelled = Cancelled** - Orders cancelled phải có payment cancelled  
✅ **Valid references** - Tất cả user_id, product_id tồn tại  
✅ **Realistic dates** - 6 tháng gần nhất  
✅ **Consistent data** - Orders, sessions, metrics đồng bộ  
✅ **Realistic patterns** - Weekend boost, growth trend, conversion rate

---

## 🎯 Use Cases

### 1. Analytics Dashboard Testing
```bash
# Generate data
node scripts/generate-realistic-data.js

# Start backend
npm run dev

# View analytics at /admin/analytics
```

### 2. ML Model Training
```bash
# Daily metrics có đủ data cho:
- Revenue prediction (6 months history)
- Order forecasting (realistic patterns)
- Conversion optimization (realistic rates)
```

### 3. Performance Testing
```bash
# Test với data volume thực tế:
- 23K+ sessions
- 140K+ page visits
- 2.3K+ orders
- Complex aggregations
```

### 4. Demo & Presentation
```bash
# Show realistic business metrics:
- £692K revenue over 6 months
- 2,330 orders processed
- 8.6% conversion rate
- £343 average order value
```

---

## 🔍 Verification Checklist

Sau khi chạy `generate-realistic-data.js`, verify:

✅ **Orders:**
- [ ] No 'created' status
- [ ] Cancelled orders have cancelled payment
- [ ] All have items array
- [ ] All reference valid users/products

✅ **Sessions:**
- [ ] All have pageViews > 0
- [ ] Realistic IP addresses
- [ ] Valid user agents
- [ ] Date range = 6 months

✅ **Page Visits:**
- [ ] Linked to valid sessions
- [ ] timeOnPage > 0
- [ ] Paths are realistic

✅ **Daily Metrics:**
- [ ] One record per day
- [ ] All days in 6-month range
- [ ] Aggregations match raw data

---

## 💡 Tips

**Regenerate data:**
```bash
# Script tự động xóa old data, không cần manual cleanup
node scripts/generate-realistic-data.js
```

**Check specific data:**
```bash
# Xem sample orders, sessions, metrics
node scripts/sample-queries.js
```

**Full quality report:**
```bash
# Comprehensive verification
node scripts/verify-data.js
```

**MongoDB queries:**
```javascript
// Connect to DB và query trực tiếp nếu cần
db.orders.find({ paymentStatus: 'paid' }).count()
db.sessions.aggregate([{ $group: { _id: null, avg: { $avg: '$pageViews' }}}])
```

---

## 📚 Related Documentation

- [Analytics System](../docs/ANALYTICS_SYSTEM.md) - Chi tiết analytics architecture
- [Data Models](../src/models/) - Schema definitions
- [Seed Scripts](../data/seeds/) - Initial data seeding

---

**Last Updated:** January 24, 2026  
**Data Version:** 6-month realistic dataset  
**Quality:** Production-ready
