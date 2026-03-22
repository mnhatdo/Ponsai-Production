# Admin Dashboard - Hướng dẫn sử dụng

## Tổng quan

Hệ thống Admin Dashboard được xây dựng cho Ponsai Store với đầy đủ các chức năng CRUD (Create, Read, Update, Delete) và quản lý hệ thống.

## Truy cập Admin

- **URL**: `/admin`
- **Yêu cầu**: Tài khoản có role `admin`
- **Bảo mật**: Rate limiting 200 requests/15 phút

## Các module chính

### 1. Dashboard (`/admin`)
- Thống kê tổng quan: sản phẩm, đơn hàng, doanh thu, khách hàng
- Đơn hàng gần đây
- Sản phẩm bán chạy
- Biểu đồ đơn hàng theo trạng thái

### 2. Quản lý Sản phẩm (`/admin/products`)

#### Danh sách sản phẩm
- Tìm kiếm theo tên, SKU
- Lọc theo danh mục, trạng thái tồn kho
- Sắp xếp theo nhiều tiêu chí
- Xóa hàng loạt
- Cập nhật nhanh tồn kho

#### Thêm/Sửa sản phẩm (`/admin/products/new`, `/admin/products/:id/edit`)
- Form đầy đủ thông tin
- Upload nhiều hình ảnh
- Quản lý biến thể (materials, colors, tags)
- Validation đầy đủ

### 3. Quản lý Danh mục (`/admin/categories`)
- CRUD danh mục
- Hỗ trợ danh mục cha-con
- Hiển thị số lượng sản phẩm
- Toggle active/inactive

### 4. Quản lý Đơn hàng (`/admin/orders`)
- Danh sách đơn hàng với pagination
- Lọc theo trạng thái, thời gian
- Cập nhật trạng thái đơn hàng
- Hủy đơn hàng với lý do
- Xem chi tiết đơn hàng

**Các trạng thái đơn hàng:**
- `pending` - Chờ xử lý
- `processing` - Đang xử lý
- `shipped` - Đang giao
- `delivered` - Đã giao
- `cancelled` - Đã hủy

### 5. Quản lý Khách hàng (`/admin/users`)
- Danh sách người dùng
- Lọc theo vai trò, trạng thái
- Thay đổi vai trò (user ↔ admin)
- Khóa/Mở khóa tài khoản
- Xem thống kê đơn hàng của khách

### 6. Quản lý Khuyến mãi (`/admin/promotions`)
- Tạo mã khuyến mãi
- Các loại: giảm %, giảm cố định, miễn phí ship
- Thiết lập điều kiện: đơn tối thiểu, giới hạn sử dụng
- Thời gian hiệu lực
- Theo dõi lượt sử dụng

### 7. Quản lý Tồn kho (`/admin/inventory`)
- Tổng quan tồn kho
- Cảnh báo sắp hết hàng
- Điều chỉnh số lượng
- Xuất báo cáo CSV

### 8. Nhật ký Hoạt động (`/admin/audit-logs`)
- Ghi nhận mọi thay đổi
- Lọc theo hành động, đối tượng, thời gian
- Xem chi tiết thay đổi (before/after)
- Xuất CSV

### 9. Cài đặt (`/admin/settings`)
- Thông tin cửa hàng
- Cài đặt đơn hàng (phí ship, thuế)
- Ngưỡng cảnh báo tồn kho
- Chế độ bảo trì

## API Endpoints

### Dashboard
```
GET /api/admin/dashboard
```

### Products
```
GET    /api/admin/products
POST   /api/admin/products
PUT    /api/admin/products/:id
DELETE /api/admin/products/:id
DELETE /api/admin/products (bulk delete)
PATCH  /api/admin/products/:id/stock
```

### Categories
```
GET    /api/admin/categories
POST   /api/admin/categories
PUT    /api/admin/categories/:id
DELETE /api/admin/categories/:id
```

### Orders
```
GET   /api/admin/orders
GET   /api/admin/orders/:id
PATCH /api/admin/orders/:id/status
PATCH /api/admin/orders/:id/cancel
```

### Users
```
GET   /api/admin/users
GET   /api/admin/users/:id
PATCH /api/admin/users/:id/role
PATCH /api/admin/users/:id/status
```

### Promotions
```
GET    /api/admin/promotions
POST   /api/admin/promotions
PUT    /api/admin/promotions/:id
DELETE /api/admin/promotions/:id
PATCH  /api/admin/promotions/:id/status
```

### Inventory
```
GET   /api/admin/inventory/low-stock
PATCH /api/admin/inventory/:id/stock
PATCH /api/admin/inventory/bulk-update
```

### Audit Logs
```
GET /api/admin/audit-logs
```

## Cấu trúc file

```
frontend/src/app/features/admin/
├── admin.routes.ts
├── guards/
│   └── admin.guard.ts
├── models/
│   └── admin.models.ts
├── services/
│   └── admin.service.ts
└── components/
    ├── layout/
    │   └── admin-layout.component.ts
    ├── dashboard/
    │   └── admin-dashboard.component.ts
    ├── products/
    │   ├── product-list.component.ts
    │   └── product-form.component.ts
    ├── categories/
    │   └── category-list.component.ts
    ├── orders/
    │   └── order-list.component.ts
    ├── users/
    │   └── user-list.component.ts
    ├── promotions/
    │   └── promotion-list.component.ts
    ├── inventory/
    │   └── inventory.component.ts
    ├── audit-logs/
    │   └── audit-logs.component.ts
    └── settings/
        └── settings.component.ts

backend/src/
├── models/
│   ├── Promotion.ts
│   └── AuditLog.ts
├── controllers/
│   └── adminController.ts
└── routes/
    └── adminRoutes.ts
```

## Bảo mật

### RBAC (Role-Based Access Control)
- Tất cả routes admin yêu cầu role `admin`
- Middleware `protect` + `authorize('admin')`

### Rate Limiting
- 200 requests / 15 phút cho mỗi IP
- Bảo vệ khỏi brute force attacks

### Audit Logging
- Ghi nhận mọi thay đổi
- Lưu trữ 90 ngày (TTL index)
- Thông tin: user, IP, action, changes

## Hướng dẫn phát triển

### Thêm module mới

1. Tạo component trong `frontend/src/app/features/admin/components/`
2. Thêm route trong `admin.routes.ts`
3. Thêm link trong `admin-layout.component.ts`
4. Tạo API endpoint tương ứng trong backend

### Tạo tài khoản admin

```javascript
// Trong MongoDB shell hoặc script
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)
```

Hoặc sử dụng API:
```bash
# Đăng nhập với admin account có sẵn
PATCH /api/admin/users/:userId/role
Body: { "role": "admin" }
```

## Changelog

### v1.0.0 (Phase 1/2)
- ✅ Dashboard với thống kê
- ✅ CRUD Sản phẩm
- ✅ CRUD Danh mục
- ✅ Quản lý Đơn hàng
- ✅ Quản lý Khách hàng
- ✅ Quản lý Khuyến mãi
- ✅ Quản lý Tồn kho
- ✅ Nhật ký Hoạt động
- ✅ Cài đặt cơ bản
- ✅ RBAC + Rate Limiting
