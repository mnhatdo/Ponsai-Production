# Payment System Guide

> **Comprehensive guide for the Ponsai Payment System**  
> Last Updated: January 7, 2026

---

## 📚 Table of Contents

1. [Quick Start](#quick-start)
2. [Payment Architecture](#payment-architecture)
3. [Payment Methods](#payment-methods)
4. [MoMo Integration](#momo-integration)
5. [Manual Payment](#manual-payment)
6. [Testing Guide](#testing-guide)

---

## 🚀 Quick Start

### Prerequisites
- Backend running on `http://localhost:3000`
- MongoDB running with product data
- Admin account configured

### Start Development Server

```bash
# From project root
npm run dev
```

This starts both frontend (port 4200) and backend (port 3000).

---

## 🏗️ Payment Architecture

### Unified Payment Lifecycle

All payment methods follow the same lifecycle:

```
CREATED → PENDING → PAID | FAILED | CANCELLED
```

**Payment Status Definitions:**

| Status | Meaning | Is Final? |
|--------|---------|-----------|
| `created` | Order created, no payment attempt yet | ❌ No |
| `pending` | Payment processing | ❌ No |
| `paid` | Payment confirmed - **MONEY RECEIVED** | ✅ Yes |
| `failed` | Payment failed | ❌ No |
| `cancelled` | Order cancelled | ✅ Yes |

### Idempotency Protection

The system prevents duplicate payment confirmations:
- MoMo IPN callbacks are idempotent
- Admin manual confirmations cannot be applied twice
- Revenue is counted accurately

---

## 💳 Payment Methods

### 1. MoMo E-Wallet (Production Ready)

**Type:** External Gateway  
**Processing:** Instant  
**Currency:** VND (auto-converted from GBP)

**Features:**
- ✅ Real-time currency conversion (GBP → VND)
- ✅ Sandbox environment support
- ✅ IPN callback handling
- ✅ Signature verification

**Endpoints:**
- `POST /api/v1/payment/momo/initiate` - Create payment request
- `POST /api/v1/payment/momo/ipn` - Server-to-server callback
- `GET /api/v1/payment/momo/callback` - User redirect callback

### 2. Manual Payment

**Type:** Admin-Confirmed  
**Processing:** 1-2 business days

**Use Cases:**
- Bank deposits
- Cash payments
- Check payments

**Endpoints:**
- `POST /api/v1/payment/manual/initiate` - Initiate manual payment
- `PATCH /api/v1/payment/manual/:orderId/confirm` - Admin confirms (Admin only)

---

## 🔵 MoMo Integration

### Overview

MoMo payment enables users to pay via QR code or MoMo app. The system automatically converts GBP prices to VND at payment time.

### Configuration

Add to `backend/.env`:

```env
# MoMo Sandbox Credentials
MOMO_PARTNER_CODE=MOMOBKUN20180529
MOMO_ACCESS_KEY=klm05TvNBzhg7h7j
MOMO_SECRET_KEY=at67qH6mk8w5Y1nAyMoYKMWACiEi2bsa
MOMO_ENDPOINT=https://test-payment.momo.vn/v2/gateway/api/create
MOMO_IPN_URL=http://localhost:3000/api/v1/payment/momo/ipn
MOMO_REDIRECT_URL=http://localhost:4200/payment/momo/callback
```

### Currency Conversion Flow

```
1. Order Created (GBP)
        ↓
2. User Clicks "Pay with MoMo"
        ↓
3. Backend: Fetch GBP → VND exchange rate
        ↓
4. Backend: Round to nearest 1,000 VND
        ↓
5. Backend: Send VND amount to MoMo
        ↓
6. User: Pays in VND via MoMo
        ↓
7. Order: Stores both GBP & VND amounts
```

**Exchange Rate API:** Free Currency API (no API key required)  
**Cache Duration:** 1 hour  
**Fallback Rate:** 30,000 VND/GBP

### Testing MoMo Payment

1. **Login as test user:**
   - Email: `a0@tester.gmail.com`
   - Password: `tester123`

2. **Create an order:**
   - Add products to cart
   - Proceed to checkout
   - Fill shipping information
   - Select "MoMo Payment"

3. **Complete payment:**
   - Redirected to MoMo test page
   - Follow sandbox instructions
   - Test success/failure scenarios

---

## 📝 Manual Payment

### Flow

1. User selects "Manual Payment" at checkout
2. Order created with `paymentStatus: pending`
3. User transfers money via bank/cash
4. Admin confirms payment in dashboard
5. Order status updates to `paid`

### Admin Confirmation

**Dashboard Location:** Admin Panel → Pending Manual Payments

**API Endpoint:**
```http
PATCH /api/v1/payment/manual/:orderId/confirm
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "success": true,
  "message": "Payment confirmed successfully",
  "order": {
    "paymentStatus": "paid",
    "status": "processing"
  }
}
```

---

## 🧪 Testing Guide

### Backend Health Check

```bash
curl http://localhost:3000/health
```

Expected:
```json
{
  "status": "success",
  "message": "Server is running"
}
```

### Test User Accounts

| Email | Password | Role |
|-------|----------|------|
| `nhatdo@admin.gmail.com` | `nhatnhatnheo` | Admin |
| `a0@tester.gmail.com` | `tester123` | User |

### Test Order Creation

```bash
POST http://localhost:3000/api/v1/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "shippingAddress": {
    "fullName": "Test User",
    "phone": "0909123456",
    "street": "123 Test St",
    "city": "Ho Chi Minh",
    "state": "Ho Chi Minh",
    "zipCode": "700000",
    "country": "Vietnam"
  },
  "paymentMethod": "momo"
}
```

### Verify Payment Status

```bash
GET http://localhost:3000/api/v1/orders/:orderId
Authorization: Bearer <token>
```

Check `paymentStatus` field for current status.

---

## 🔍 Troubleshooting

### MoMo Payment Fails

1. Check backend logs for signature generation
2. Verify MoMo credentials in `.env`
3. Ensure IPN URL is accessible (use ngrok for local testing)
4. Check exchange rate API is responding

### Manual Payment Not Updating

1. Verify admin is logged in with admin role
2. Check order is in `pending` status
3. Ensure order ID is correct
4. Check backend logs for errors

### Currency Conversion Issues

1. Check exchange rate API: `https://api.exchangerate-api.com/v4/latest/GBP`
2. Verify fallback rate is configured
3. Check cache is working (1-hour TTL)

---

## 📂 Related Documentation

- **[PAYMENT_ARCHITECTURE.md](PAYMENT_ARCHITECTURE.md)** - Detailed architecture documentation
- **[MULTI_PAYMENT_SYSTEM.md](../MULTI_PAYMENT_SYSTEM.md)** - Multi-payment method overview
- **[MOMO_PAYMENT_README.md](../MOMO_PAYMENT_README.md)** - Detailed MoMo integration guide
- **[MOMO_QUICK_START.md](../MOMO_QUICK_START.md)** - MoMo quick start guide
- **[PAYMENT_QUICK_START.md](../PAYMENT_QUICK_START.md)** - Payment system quick start
- **[Archived Testing Guides](./archived/)** - Detailed testing documentation

---

## 🔐 Security Notes

1. **Never commit credentials:** Use `.env` and `.env.example`
2. **Validate signatures:** All MoMo callbacks verify HMAC-SHA256 signatures
3. **Idempotency:** Prevent duplicate payment confirmations
4. **HTTPS in production:** Always use HTTPS for payment callbacks
5. **Rate limiting:** API has rate limiting enabled

---

## 🚀 Deployment

### Production Checklist

- [ ] Replace sandbox MoMo credentials with production keys
- [ ] Configure production IPN URL (must be HTTPS)
- [ ] Set up proper logging and monitoring
- [ ] Configure database backups
- [ ] Test payment flows thoroughly
- [ ] Set up error alerting
- [ ] Document rollback procedures

---

For more information, see the main [README.md](../README.md) or [QUICK_START.md](./guides/QUICK_START.md).

