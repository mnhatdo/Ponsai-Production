# Payment System Documentation

**Status:** ✅ Production Ready  
**Last Updated:** January 10, 2026  
**Payment Methods:** 2 (MoMo E-Wallet, Manual Payment)

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Payment Methods](#payment-methods)
   - [MoMo E-Wallet](#momo-e-wallet)
   - [Manual Payment](#manual-payment)
4. [API Endpoints](#api-endpoints)
5. [Testing Guide](#testing-guide)
6. [Troubleshooting](#troubleshooting)
7. [Changelog](#changelog)

---

## Overview

Ponsai e-commerce platform supports **2 payment methods**:

| Method | Type | Processing Time | Currency | Status |
|--------|------|-----------------|----------|--------|
| **MoMo E-Wallet** | External Gateway | Instant | VND (auto-convert) | ✅ Production |
| **Manual Payment** | Admin-Confirmed | 1-2 business days | GBP | ✅ Production |

### Key Features

- ✅ **Unified Payment Lifecycle** - Single controller manages all methods
- ✅ **Currency Conversion** - Automatic GBP → VND for MoMo
- ✅ **IPN Callback Handling** - Server-to-server payment verification
- ✅ **Stock Management** - Automatic inventory updates
- ✅ **Payment Status Tracking** - Real-time order status updates
- ✅ **Security** - JWT authentication, signature verification

---

## Architecture

### Payment Lifecycle

```
┌─────────────────┐
│  Create Order   │
│  (pending)      │
└────────┬────────┘
         │
         ├─────┐
         │     │
    ┌────▼──┐  │
    │ MoMo  │  │
    └───┬───┘  │
        │      │
    ┌───▼────────┐
    │  Redirect  │
    │  to MoMo   │
    └─────┬──────┘
          │
    ┌─────▼──────┐
    │ IPN        │
    │ Callback   │
    └─────┬──────┘
          │
    ┌─────▼─────────┐
    │ Update Order  │
    │ (paid/failed) │
    └───────────────┘
```

### Backend Components

**Services:**
- `momoService.ts` - MoMo API integration, signature generation/verification
- `exchangeRateService.ts` - GBP ↔ VND conversion
- `manualPaymentService.ts` - Manual payment logic
- `paymentLifecycleManager.ts` - Order status transitions

**Controllers:**
- `paymentController.ts` - All payment endpoints
- `orderController.ts` - Order creation and management

**Routes:**
- `/api/v1/payment/*` - Payment operations
- `/api/v1/orders/*` - Order management

---

## Payment Methods

### MoMo E-Wallet

**Overview:**  
Enables Vietnamese customers to pay via MoMo app or QR code. System automatically converts GBP prices to VND.

**Configuration:**

```env
# backend/.env
MOMO_PARTNER_CODE=MOMOBKUN20180529
MOMO_ACCESS_KEY=klm05TvNBzhg7h7j
MOMO_SECRET_KEY=at67qH6mk8w5Y1nAyMoYKMWACiEi2bsa
MOMO_ENDPOINT=https://test-payment.momo.vn/v2/gateway/api/create
MOMO_IPN_URL=http://localhost:3000/api/v1/payment/momo/ipn
MOMO_REDIRECT_URL=http://localhost:4200/payment/momo/callback
```

**Flow:**

1. **Initiate Payment:**
   ```bash
   POST /api/v1/payment/momo/initiate
   Headers: Authorization: Bearer <token>
   Body: { "orderId": "..." }
   
   Response:
   {
     "success": true,
     "data": {
       "payUrl": "https://test-payment.momo.vn/...",
       "qrCodeUrl": "...",
       "orderId": "..."
     }
   }
   ```

2. **User redirects to MoMo** - Complete payment on MoMo app/web

3. **IPN Callback** (server-to-server):
   ```bash
   POST /api/v1/payment/momo/ipn
   # MoMo sends payment result
   # System verifies signature
   # Updates order status
   # Restores stock if failed
   ```

4. **Return Callback** (user redirect):
   ```bash
   GET /api/v1/payment/momo/callback?orderId=...
   # Frontend displays result
   ```

**Test Cards:**
- Use MoMo sandbox account
- Any amount works in test environment

**Currency Conversion:**
- Base: 1 GBP = 30,000 VND
- Example: £99.99 → 2,999,700 VND
- Conversion happens only at payment time

---

### Manual Payment

**Overview:**  
Allows payments via bank transfer, cash, or check. Requires admin confirmation.

**Use Cases:**
- Bank deposits to company account
- Cash on delivery (COD) 
- Check payments
- Corporate accounts

**Flow:**

1. **Initiate Manual Payment:**
   ```bash
   POST /api/v1/payment/manual/initiate
   Headers: Authorization: Bearer <token>
   Body: { "orderId": "..." }
   
   Response:
   {
     "success": true,
     "data": {
       "orderId": "...",
       "message": "Manual payment initiated. Awaiting admin confirmation."
     }
   }
   ```

2. **Order Status:** `pending_manual_payment`

3. **Admin Confirms Payment:**
   ```bash
   PATCH /api/v1/payment/manual/:orderId/confirm
   Headers: Authorization: Bearer <admin_token>
   
   Response:
   {
     "success": true,
     "data": {
       "orderId": "...",
       "status": "paid"
     }
   }
   ```

4. **Order Status:** `paid`

**Admin Responsibilities:**
- Verify payment received in bank account
- Update order status within 1-2 business days
- Notify customer of confirmation

---

## API Endpoints

### Get Payment Methods
```http
GET /api/v1/payment/methods
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "momo",
      "name": "MoMo E-Wallet",
      "description": "Secure payment with MoMo e-wallet",
      "type": "external_gateway",
      "processingTime": "instant",
      "enabled": true
    },
    {
      "id": "manual_payment",
      "name": "Manual Payment",
      "description": "Bank transfer or cash payment - requires admin confirmation",
      "type": "manual",
      "processingTime": "1-2 business days",
      "enabled": true
    }
  ]
}
```

### MoMo Endpoints

```http
POST /api/v1/payment/momo/initiate
POST /api/v1/payment/momo/ipn
GET  /api/v1/payment/momo/callback
```

### Manual Payment Endpoints

```http
POST  /api/v1/payment/manual/initiate
PATCH /api/v1/payment/manual/:orderId/confirm (Admin only)
```

### Payment Status

```http
GET /api/v1/payment/status/:orderId
Authorization: Bearer <token>
```

---

## Testing Guide

### MoMo Happy Path

```bash
# 1. Login
POST /api/v1/auth/login
{
  "email": "test@example.com",
  "password": "password"
}

# 2. Create Order
POST /api/v1/orders
{
  "shippingAddress": { ... },
  "paymentMethod": "momo"
}
# Response: orderId

# 3. Initiate MoMo Payment
POST /api/v1/payment/momo/initiate
{
  "orderId": "<orderId>"
}
# Response: payUrl

# 4. Visit payUrl in browser
# Complete payment on MoMo

# 5. MoMo sends IPN callback
# Order status → paid
```

### MoMo Failure Scenario

```bash
# Same steps 1-4 above
# Cancel payment on MoMo page

# IPN callback with resultCode != 0
# Order status → failed, cancelled
# Stock restored automatically
```

### Manual Payment Test

```bash
# 1. Login as user
POST /api/v1/auth/login

# 2. Create Order  
POST /api/v1/orders
{
  "shippingAddress": { ... },
  "paymentMethod": "manual_payment"
}

# 3. Initiate Manual Payment
POST /api/v1/payment/manual/initiate
{
  "orderId": "<orderId>"
}
# Order status: pending_manual_payment

# 4. Login as admin
POST /api/v1/auth/login
{
  "email": "nhatdo@admin.gmail.com",
  "password": "nhatnhatnheo"
}

# 5. Confirm Payment
PATCH /api/v1/payment/manual/<orderId>/confirm
# Order status: paid
```

---

## Troubleshooting

### MoMo Payment Issues

**Problem:** "MoMo API is unreachable"  
**Solution:** Check MOMO_ENDPOINT in .env, verify network connection

**Problem:** "Invalid signature" in IPN callback  
**Solution:** Verify MOMO_SECRET_KEY matches partner credentials

**Problem:** Order stuck in "pending"  
**Solution:** Check IPN endpoint is publicly accessible (not localhost in production)

**Problem:** Currency conversion wrong  
**Solution:** Verify exchange rate in exchangeRateService.ts

### Manual Payment Issues

**Problem:** Admin cannot confirm payment  
**Solution:** Verify admin role in JWT token

**Problem:** Order not found  
**Solution:** Check orderId in request, verify order exists

---

## Changelog

### January 10, 2026
- ✅ Consolidated payment documentation
- ✅ Removed outdated multi-payment docs (Card, Bank Transfer)
- ✅ Clarified only 2 methods in production

### December 2025
- ✅ Implemented Manual Payment system
- ✅ Added MoMo IPN signature verification
- ✅ Added automatic stock restoration on payment failure

### November 2025
- ✅ MoMo integration completed
- ✅ GBP → VND currency conversion
- ✅ Payment lifecycle manager

---

## Related Documentation

- [API Documentation](./API.md) - Full API reference
- [MOMO Integration](./MOMO_INTEGRATION.md) - Detailed MoMo docs
- [Manual Payment](./MANUAL_PAYMENT.md) - Manual payment details
- [Architecture](./ARCHITECTURE.md) - System design

---

## Support

- **MoMo Documentation:** https://developers.momo.vn
- **MoMo Support:** support@momo.vn
- **Test Environment:** https://test-payment.momo.vn

---

**License:** MIT
