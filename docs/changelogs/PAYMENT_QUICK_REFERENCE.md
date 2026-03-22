# Payment Flow Quick Reference

## 🎯 TL;DR - What Was Fixed

| Issue | Status | Fix |
|-------|--------|-----|
| Invalid transition `pending_manual_payment → pending` | ✅ FIXED | Added to state machine valid transitions |
| "Cart is empty" false positive | ✅ FIXED | Removed unnecessary cart check in manual payment |
| Stock locked on payment failure | ✅ FIXED | Auto-restore stock in lifecycle manager |
| Duplicate stock restoration | ✅ FIXED | Unified cancellation through lifecycle manager |

---

## 📋 Payment Methods & Flows

### Manual Payment
```typescript
// Customer
1. Create order → pending_manual_payment
2. Clear cart
3. Navigate to /orders
4. Wait for admin

// Admin
1. View pending manual payments
2. Confirm payment
3. Order → paid, processing
```

**NO separate initiate call needed!**

---

### MoMo Payment
```typescript
// Customer
1. Create order → pending
2. Initiate MoMo (get payUrl)
3. Clear cart
4. Redirect to MoMo

// MoMo IPN Callback
- Success (resultCode=0) → paid
- Failure (resultCode≠0) → failed, stock restored
```

---

## 🔄 State Transitions

### Valid Transitions
```
CREATED → PENDING
CREATED → PENDING_MANUAL_PAYMENT
CREATED → CANCELLED

PENDING → PAID
PENDING → FAILED
PENDING → CANCELLED

PENDING_MANUAL_PAYMENT → PAID
PENDING_MANUAL_PAYMENT → CANCELLED

FAILED → PENDING (retry)
FAILED → CANCELLED
```

### Final States (No further transitions)
- `PAID`
- `CANCELLED`
- `REFUNDED`

---

## 🛠️ Key Components

### PaymentLifecycleManager
**File:** `backend/src/services/paymentLifecycleManager.ts`

**Methods:**
- `transitionToPending(order, method)` - For MoMo initiate
- `transitionToPaid(order, metadata)` - For payment success
- `transitionToFailed(order, metadata)` - For payment failure (restores stock)
- `transitionToCancelled(order, metadata)` - For cancellation (restores stock)
- `checkIdempotency(order, targetStatus)` - Prevents double-processing

**Stock Restoration:**
```typescript
private async restoreStock(order: IOrder): Promise<void> {
  for (const item of order.items) {
    await Product.findByIdAndUpdate(
      productId,
      { $inc: { stockQuantity: item.quantity } }
    );
  }
}
```

Automatically called in:
- `transitionToFailed()` ✅
- `transitionToCancelled()` ✅

---

### Order Cancellation

**User Cancel:** `backend/src/controllers/orderController.ts`
```typescript
await paymentLifecycle.transitionToCancelled(order, {
  cancelledBy: 'user',
  reason: 'Cancelled by user'
});
```

**Admin Cancel:** `backend/src/controllers/adminController.ts`
```typescript
await paymentLifecycle.transitionToCancelled(order, {
  cancelledBy: 'admin',
  reason: reason || 'Cancelled by admin'
});
```

**Both restore stock automatically!**

---

## 🧪 Testing Scenarios

### Manual Payment Happy Path
```bash
POST /api/v1/orders
{
  "shippingAddress": {...},
  "paymentMethod": "manual_payment"
}
# → Order created with pending_manual_payment

# Frontend: Clear cart, navigate to /orders
# NO API call to /manual/initiate!

POST /api/v1/admin/orders/:id/confirm-manual-payment
{
  "note": "Received bank transfer"
}
# → Order → paid
```

### Manual Payment Cancellation
```bash
DELETE /api/v1/orders/:id
# → Order → cancelled
# → Stock restored ✅
```

### MoMo Happy Path
```bash
POST /api/v1/orders
{
  "shippingAddress": {...},
  "paymentMethod": "momo"
}
# → Order created with pending

POST /api/v1/payment/momo/initiate
{
  "orderId": "..."
}
# → Get payUrl, clear cart, redirect

# MoMo IPN Callback
POST /api/v1/payment/momo/ipn
{
  "orderId": "...",
  "resultCode": 0,
  "transId": "..."
}
# → Order → paid
```

### MoMo Failure
```bash
# MoMo IPN Callback with error
POST /api/v1/payment/momo/ipn
{
  "orderId": "...",
  "resultCode": 1001,  # Any non-zero code
  "transId": "..."
}
# → Order → failed, cancelled
# → Stock restored ✅
```

---

## ⚠️ Common Pitfalls

### ❌ DON'T: Call manual payment initiate after order creation
```typescript
// WRONG
const order = await createOrder({ paymentMethod: 'manual_payment' });
await initiateManualPayment(order._id); // ❌ Unnecessary!
```

### ✅ DO: Just create order and navigate
```typescript
// CORRECT
const order = await createOrder({ paymentMethod: 'manual_payment' });
clearCart();
navigate('/orders'); // ✅ Done!
```

---

### ❌ DON'T: Manually restore stock
```typescript
// WRONG - Lifecycle manager does this!
for (const item of order.items) {
  await Product.findByIdAndUpdate(item.product, {
    $inc: { stockQuantity: item.quantity }
  });
}
order.status = 'cancelled';
await order.save();
```

### ✅ DO: Use lifecycle manager
```typescript
// CORRECT
await paymentLifecycle.transitionToCancelled(order, {
  cancelledBy: 'admin',
  reason: 'Out of stock'
});
```

---

### ❌ DON'T: Bypass state validation
```typescript
// WRONG
order.paymentStatus = 'paid'; // Direct assignment
await order.save();
```

### ✅ DO: Use lifecycle transitions
```typescript
// CORRECT
await paymentLifecycle.transitionToPaid(order, {
  transactionId: '...',
  confirmedBy: adminId
});
```

---

## 🔍 Debugging

### Check Order State
```bash
GET /api/v1/orders/:id
```

Look for:
- `status` - Order fulfillment status
- `paymentStatus` - Payment state
- `paymentMethod` - Payment method used
- `paymentDetails.paidAt` - Payment timestamp
- `paymentDetails.confirmedBy` - Admin who confirmed (manual payment)

### Check Logs
Backend logs include:
```
✅ [PaymentLifecycle] pending_manual_payment → paid
   Order: 507f1f77bcf86cd799439011
   Amount: £125.00
   Paid At: 2026-01-07T03:50:00.000Z
   Method: manual_payment
```

```
🔄 [PaymentLifecycle] Restoring stock for cancelled order 507f...
   ✅ Restored 2x of product 507f191e810c19729de860ea
   ✅ Restored 1x of product 507f191e810c19729de860eb
```

### Verify Stock
```bash
GET /api/v1/products/:id
```

Check `stockQuantity` after:
- Order creation (should decrease)
- Payment failure (should restore)
- Order cancellation (should restore)

---

## 📚 Related Documentation

- [PAYMENT_FLOW_FIX_COMPLETE.md](./PAYMENT_FLOW_FIX_COMPLETE.md) - Full technical details
- [PAYMENT_ARCHITECTURE.md](./PAYMENT_ARCHITECTURE.md) - System design
- [MOMO_INTEGRATION.md](./docs/MOMO_INTEGRATION.md) - MoMo specific docs

---

*Last Updated: 2026-01-07*
*Status: ✅ Production Ready*
