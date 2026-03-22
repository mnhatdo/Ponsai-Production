# Admin Dashboard Guide

**Status:** ✅ Production Ready  
**Last Updated:** January 10, 2026  
**Access Level:** Admin only

---

## Table of Contents

1. [Access & Login](#access--login)
2. [Dashboard Overview](#dashboard-overview)
3. [Analytics Dashboard](#analytics-dashboard)
4. [Product Management](#product-management)
5. [Order Management](#order-management)
6. [User Management](#user-management)
7. [Reports](#reports)
8. [Design System](#design-system)

---

## Access & Login

### Admin URL

```
http://localhost:4200/admin
```

### Admin Credentials

```
Email: nhatdo@admin.gmail.com
Password: nhatnhatnheo
```

### Authentication Flow

1. Navigate to `/admin` (any admin route)
2. If not logged in → redirect to `/auth/login?returnUrl=/admin`
3. Login with admin credentials
4. System validates JWT + role
5. Redirect to requested admin page

**Note:** Regular users cannot access admin routes (403 Forbidden)

---

## Dashboard Overview

### Navigation Structure

```
DASHBOARD
├── 📊 Dashboard         - Main overview
├── 📦 Products         - CRUD products
├── 📝 Orders           - Order management
├── 👥 Users            - User management
│
ANALYTICS
├── 📈 Analytics        - 5-tab analytics dashboard
├── 📋 Reports          - Business reports
│
SYSTEM
├── 🔍 Audit Logs       - System activity tracking
└── ⚙️ Settings         - System configuration
```

### Main Dashboard

**URL:** `/admin`

**Widgets:**
- Quick Stats (orders, users, products, revenue)
- Recent Orders
- Low Stock Alerts
- Pending Manual Payments
- Quick Actions

---

## Analytics Dashboard

**URL:** `/admin/analytics`

### Tab 1: Overview 📈

**Metrics Displayed:**
- Total Events (all tracked user actions)
- Unique Users (logged in users)
- Unique Guests (anonymous sessions)
- Conversion Rate (% of viewers who buy)
- Total Revenue (from completed payments)

**Charts:**
- Top Event Types (bar chart)
- Daily Activity (line chart)

**Date Filters:**
- Last 7 days
- Last 30 days
- Last 90 days
- Custom date range

**Use Cases:**
- Monitor user engagement
- Track conversion trends
- Identify popular event types

---

### Tab 2: Conversion Funnel 🔄

**Funnel Stages:**
1. **Product Viewed** → Baseline (100%)
2. **Added to Cart** → Conversion % and drop-off %
3. **Checkout Started** → Conversion % and drop-off %
4. **Payment Completed** → Final conversion %

**Metrics:**
- Total users in funnel
- Users per stage
- Conversion rate (stage to next)
- Drop-off rate (who left at this stage)

**Insights:**
- High drop-off at Cart → product page issue
- High drop-off at Checkout → form too complex
- High drop-off at Payment → payment method problem

**Actions:**
- Optimize weak stages
- A/B test improvements
- Simplify checkout if needed

---

### Tab 3: Cart Abandonment 🛒

**Metrics:**
- Total abandoned carts
- Abandonment rate %
- Top abandoned products (with view/add counts)
- Value of abandoned carts

**Insights:**
- Which products cause hesitation?
- Pricing issues
- Stock concerns
- Checkout friction

**Actions:**
- Send cart recovery emails
- Review product pricing
- Add trust badges
- Simplify checkout

---

### Tab 4: Product Performance 📦

**Table Columns:**
- Product Name
- Total Views
- Times Added to Cart
- Times Purchased
- Conversion Rate (views → purchases)

**Sorting:**
- By views (most popular)
- By conversion rate (best performers)
- By revenue (top earners)

**Insights:**
- **High views + low cart** → Product page issue
- **High cart + low purchase** → Checkout problem
- **Low views overall** → SEO/marketing needed
- **High conversion** → Successful product

**Actions:**
- Improve product descriptions for low converters
- Promote high-performing products
- Re-evaluate low-performing products

---

### Tab 5: Payment Failures 💳

**Metrics:**
- Total payment attempts
- Successful payments
- Failed payments
- Failure rate %

**Breakdown by Method:**
- MoMo (attempts, success, failure, failure %)
- Manual Payment (attempts, success, failure, failure %)

**Common Failure Reasons:**
- Insufficient funds
- Payment gateway error
- User canceled
- Network timeout

**Actions:**
- Contact users with failed payments
- Investigate high failure rates
- Switch payment methods if needed
- Improve error messaging

---

## Product Management

**URL:** `/admin/products`

### Features

✅ **CRUD Operations**
- Create new products
- Edit existing products
- Delete products (soft delete)
- Bulk actions (coming soon)

✅ **Product Details**
- Name, description
- Price (GBP)
- Category
- Images (multiple uploads)
- Stock quantity
- SKU
- Status (active/inactive)

✅ **Filtering**
- By category
- By stock status (low stock alert)
- By active/inactive

✅ **Search**
- By name
- By SKU
- By description

### Low Stock Alerts

Products with `stock < 10` trigger alerts:
- Red badge on product card
- Notification on main dashboard
- Email notification (if configured)

---

## Order Management

**URL:** `/admin/orders`

### Order Statuses

| Status | Meaning | Actions Available |
|--------|---------|------------------|
| `pending` | Order created, awaiting payment | Cancel |
| `pending_manual_payment` | Manual payment initiated | Confirm Payment, Cancel |
| `paid` | Payment completed | Mark as Processing |
| `processing` | Order being prepared | Mark as Shipped |
| `shipped` | Order shipped to customer | Mark as Delivered |
| `delivered` | Order received by customer | - |
| `cancelled` | Order cancelled | - |
| `failed` | Payment failed | - |

### Features

✅ **Order List**
- Filter by status
- Search by order ID, customer name
- Sort by date, amount

✅ **Order Details**
- Customer information
- Shipping address
- Order items (products, quantity, price)
- Payment method
- Payment status
- Order timeline

✅ **Actions**
- Update order status
- Confirm manual payments (admin only)
- Cancel orders
- Print invoice (coming soon)
- Email customer

### Manual Payment Confirmation

For orders with status `pending_manual_payment`:

1. Verify payment received in bank account
2. Click "Confirm Payment" button
3. Order status → `paid`
4. Customer notified via email
5. Order moves to fulfillment

**Timeline:** Aim for 1-2 business days

---

## User Management

**URL:** `/admin/users`

### Features

✅ **User List**
- All registered users
- Filter by role (user/admin)
- Filter by status (active/inactive)
- Search by name, email

✅ **User Details**
- Name, email, phone
- Role (user/admin)
- Registration date
- Last login
- Order history
- Total spent

✅ **Actions**
- Change user role (user ↔ admin)
- Deactivate/Activate account
- View order history
- Reset password (coming soon)

### Role Management

**User Roles:**
- `user` - Regular customer
- `admin` - Full admin access

**Changing Roles:**
1. Navigate to user detail
2. Click "Change Role" dropdown
3. Select new role
4. Confirm action
5. User's next login reflects new permissions

**Security:**
- Only super admins can promote to admin
- Cannot demote yourself
- Audit log tracks all role changes

---

## Reports

**URL:** `/admin/reports`

### Available Reports

#### 1. Sales Report
- Revenue by period (day, week, month)
- Order count
- Average order value
- Revenue trends

#### 2. Product Report
- Top selling products
- Revenue per product
- Stock levels
- Product performance

#### 3. Customer Report
- New customers vs returning
- Customer retention rate
- Lifetime value
- Geographic distribution

#### 4. Payment Report
- Payment method breakdown
- Success/failure rates
- Transaction volume
- Revenue per method

### Export Options

- 📊 CSV Export
- 📄 PDF Report (coming soon)
- 📧 Email Report (coming soon)

---

## Design System

### Color Palette

**Brand Colors:**
```scss
Deep Space Blue:  #153243  // Primary (buttons, headers)
Yale Blue:        #284b63  // Secondary (hover states)
Lemon-lime:       #c3d350  // Accent (highlights, CTAs)
Alabaster Grey:   #e6e6ea  // Background
```

**Semantic Colors:**
```scss
Success:  #28a745  // Paid orders, confirmations
Warning:  #ffc107  // Pending, low stock
Danger:   #dc3545  // Failed, errors, cancelled
Info:     #17a2b8  // Processing, informational
```

### Status Badges

```html
<!-- Order Status -->
<span class="badge bg-warning">Pending</span>
<span class="badge bg-success">Paid</span>
<span class="badge bg-info">Processing</span>
<span class="badge bg-primary">Shipped</span>
<span class="badge bg-dark">Delivered</span>
<span class="badge bg-danger">Cancelled</span>

<!-- Stock Status -->
<span class="badge bg-danger">Low Stock</span>
<span class="badge bg-success">In Stock</span>
<span class="badge bg-secondary">Out of Stock</span>
```

### Button Styles

**Primary Actions:**
```html
<button class="btn btn-primary">Save Changes</button>
<button class="btn btn-success">Confirm</button>
```

**Secondary Actions:**
```html
<button class="btn btn-outline-primary">Cancel</button>
<button class="btn btn-secondary">Back</button>
```

**Danger Actions:**
```html
<button class="btn btn-danger">Delete</button>
<button class="btn btn-outline-danger">Cancel Order</button>
```

### Card Layout

Standard admin card:
```html
<div class="card">
  <div class="card-header">
    <h5 class="mb-0">
      <i class="bi bi-icon me-2"></i>
      Card Title
    </h5>
  </div>
  <div class="card-body">
    <!-- Content -->
  </div>
  <div class="card-footer">
    <!-- Actions -->
  </div>
</div>
```

---

## Changelog

### January 10, 2026
- ✅ Consolidated admin documentation
- ✅ Added Analytics Dashboard (5 tabs)
- ✅ Added design system reference

### December 2025
- ✅ Manual payment confirmation workflow
- ✅ User role management
- ✅ Order status tracking

### November 2025
- ✅ Initial admin dashboard
- ✅ Product CRUD
- ✅ Order management
- ✅ User management

---

## Related Documentation

- [Analytics System](./ANALYTICS_SYSTEM.md) - Full analytics docs
- [Payment System](./PAYMENT_SYSTEM.md) - Payment workflows
- [API Documentation](./API.md) - API reference
- [Color System](./COLOR_SYSTEM.md) - Design guidelines

---

**License:** MIT
