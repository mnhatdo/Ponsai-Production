# Manual Payment System Documentation

## Overview

The Manual Payment system is a secondary payment method designed for internal testing, QA, and analytics validation. It operates independently from the MoMo payment gateway.

## Key Features

- **Separate from MoMo**: Completely independent service and logic
- **Admin Confirmation**: Payments are confirmed manually by admin users
- **Full Reporting Integration**: Orders appear in dashboard, analytics, and reports
- **Filterable**: Can be distinguished by `paymentMethod` field

## Payment Method Identifier

```
MANUAL_PAYMENT = 'manual_payment'
```

## Order Statuses

| Status | Description |
|--------|-------------|
| `pending_manual_payment` | Order created, awaiting admin payment confirmation |
| `processing` | Payment confirmed, order being processed |

## Payment Statuses

| Status | Description |
|--------|-------------|
| `pending_manual_payment` | Awaiting manual payment confirmation |
| `paid` | Payment confirmed by admin |

## API Endpoints

### User Endpoints

#### Get Payment Methods
```
GET /api/payment/methods
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": [
    {
      "id": "momo",
      "name": "MoMo E-Wallet",
      "description": "Pay with MoMo e-wallet",
      "enabled": true,
      "type": "external_gateway"
    },
    {
      "id": "manual_payment",
      "name": "Manual Payment (Test)",
      "description": "Manual payment for testing - requires admin confirmation",
      "enabled": true,
      "type": "manual"
    }
  ]
}
```

#### Initiate Manual Payment
```
POST /api/payment/manual/initiate
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "orderId": "<order_id>"
}

Response:
{
  "success": true,
  "data": {
    "orderId": "<order_id>",
    "status": "pending_manual_payment",
    "paymentStatus": "pending_manual_payment",
    "paymentMethod": "manual_payment",
    "message": "Manual payment initiated. Please wait for admin confirmation."
  }
}
```

### Admin Endpoints

#### Get Pending Manual Payments
```
GET /api/admin/payments/manual/pending
Authorization: Bearer <admin_token>

Response:
{
  "success": true,
  "data": [
    {
      "_id": "<order_id>",
      "user": { "name": "...", "email": "..." },
      "totalAmount": 100.00,
      "status": "pending_manual_payment",
      "paymentStatus": "pending_manual_payment",
      "paymentMethod": "manual_payment",
      "createdAt": "..."
    }
  ],
  "pagination": { ... }
}
```

#### Confirm Manual Payment
```
PATCH /api/admin/payments/manual/:orderId/confirm
Authorization: Bearer <admin_token>
Content-Type: application/json

Body:
{
  "note": "Optional confirmation note"
}

Response:
{
  "success": true,
  "data": {
    "orderId": "<order_id>",
    "previousStatus": "pending_manual_payment",
    "newStatus": "paid",
    "confirmedAt": "2026-01-07T...",
    "confirmedBy": "Admin Name"
  },
  "message": "Manual payment confirmed successfully"
}
```

#### Get Manual Payment Statistics
```
GET /api/admin/payments/manual/stats
Authorization: Bearer <admin_token>

Response:
{
  "success": true,
  "data": {
    "pending": 5,
    "confirmed": 10,
    "total": 15,
    "totalRevenue": 1500.00,
    "recentConfirmed": [...]
  }
}
```

## Payment Details Schema

When a manual payment is confirmed, the following metadata is stored:

```typescript
paymentDetails: {
  gateway: 'manual_payment',
  paidAt: Date,           // When payment was confirmed
  confirmedAt: Date,      // Same as paidAt
  confirmedBy: ObjectId,  // Admin user ID
  confirmedByName: string,// Admin display name
  manualPaymentNote?: string // Optional note
}
```

## User Flow

1. User adds products to cart
2. User proceeds to checkout
3. User selects "Manual Payment" as payment method
4. Order is created with status `pending_manual_payment`
5. User receives confirmation that order is awaiting admin confirmation
6. Admin sees order in pending manual payments list
7. Admin confirms payment receipt
8. Order status changes to `processing`, payment status to `paid`
9. Order proceeds through normal fulfillment flow

## Test Accounts

10 test accounts are available for testing:

| Email | Password |
|-------|----------|
| a0@tester.gmail.com | tester123 |
| a1@tester.gmail.com | tester123 |
| a2@tester.gmail.com | tester123 |
| a3@tester.gmail.com | tester123 |
| a4@tester.gmail.com | tester123 |
| a5@tester.gmail.com | tester123 |
| a6@tester.gmail.com | tester123 |
| a7@tester.gmail.com | tester123 |
| a8@tester.gmail.com | tester123 |
| a9@tester.gmail.com | tester123 |

### Recreating Test Users

```bash
cd backend
npx ts-node data/seeds/seed-test-users.ts
```

## Architecture

```
┌─────────────────┐     ┌──────────────────────┐
│   User Client   │────▶│  PaymentController   │
└─────────────────┘     │  - initiateManual()  │
                        │  - getPaymentMethods │
                        └──────────────────────┘
                                   │
                                   ▼
                        ┌──────────────────────┐
                        │ ManualPaymentService │
                        │  - initiatePayment() │
                        │  - confirmPayment()  │
                        └──────────────────────┘
                                   │
                                   ▼
                        ┌──────────────────────┐
                        │     Order Model      │
                        │  - paymentMethod     │
                        │  - paymentStatus     │
                        │  - paymentDetails    │
                        └──────────────────────┘
                                   │
┌─────────────────┐                │
│  Admin Client   │────────────────┘
└─────────────────┘
        │
        ▼
┌──────────────────────┐
│   AdminController    │
│  - getPendingManual  │
│  - confirmManual     │
│  - getManualStats    │
└──────────────────────┘
```

## Integration with Reporting

Manual payment orders are fully integrated with:

- **Dashboard Statistics**: Counted in total orders, revenue
- **Order Lists**: Visible with `paymentMethod` filter
- **Analytics**: Can be filtered by payment method
- **Audit Logs**: All confirmations are logged

## Error Handling

| Error | HTTP Code | Description |
|-------|-----------|-------------|
| Order not found | 404 | Order ID doesn't exist |
| Order already paid | 400 | Cannot initiate/confirm already paid order |
| Order cancelled | 400 | Cannot process cancelled orders |
| Invalid payment method | 400 | Order doesn't use manual payment |
| Admin auth required | 401 | Admin confirmation requires admin role |

## Security Considerations

- Manual payment confirmation requires admin authentication
- All confirmations create audit log entries
- Admin user ID and name are recorded with each confirmation
- Test accounts do not have elevated privileges
