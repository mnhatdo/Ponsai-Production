# Project Changelog & Fixes History

**Last Updated:** January 8, 2026

This document consolidates all major fixes, improvements, and changes made to the Furni/BonSight project. Historical changelog files have been archived in `docs/changelogs/` for detailed reference.

---

## Table of Contents

1. [System Stability Fixes](#system-stability-fixes)
2. [Admin Area Cleanup](#admin-area-cleanup)
3. [Payment System Fixes](#payment-system-fixes)
4. [Checkout Flow Stabilization](#checkout-flow-stabilization)
5. [Bank Transfer Implementation](#bank-transfer-implementation)
6. [Analytics Implementation](#analytics-implementation)
7. [Workspace Organization](#workspace-organization)

---

## System Stability Fixes

**Date:** January 8, 2026  
**Focus:** Performance optimization and error handling

### Issues Fixed

#### 1. Auth Error Logging (Frontend)
**File:** `frontend/src/app/core/services/auth.service.ts`

**Problem:** Console showed `undefined` for authentication errors

**Solution:** Detailed error classification by HTTP status:
- `401`: Token expired/invalid → clear session
- `0`: Network error → keep token
- Other errors → log with details

**Result:** Clear, actionable error messages

#### 2. Product API Timeout (Backend)
**Files:** 
- `backend/src/controllers/productController.ts`
- `backend/src/models/Product.ts`

**Problem:** 504 Gateway Timeout on product queries

**Solutions Applied:**
- Hard limit: max 100 items per request
- Parallel queries with `Promise.all()`
- Query optimization with `.lean()`
- Compound indexes for common query patterns

**Performance Metrics:**
| Metric | Before | After |
|--------|--------|-------|
| Product API (limit=6) | 504 timeout | <500ms |
| Product API (limit=1000) | Timeout/crash | Capped at 100 |

#### 3. Frontend Resilience (Frontend)
**File:** `frontend/src/app/features/home/home.component.ts`

**Problem:** Page crash if products API fails

**Solution:** Multi-level fallback mechanism:
1. Try featured products first
2. Fallback to all products on error
3. Final fallback to empty array (graceful degradation)

**Result:** No page crashes, better user experience

---

## Analytics Implementation

**Date:** January 8, 2026  
**Focus:** Business intelligence and data analysis capabilities

### Features Added

#### 1. Revenue Analytics
- Total revenue and order count
- Revenue by payment method
- Monthly revenue trends
- Average order value

**Endpoints:**
- `GET /api/v1/admin/analytics/revenue`
- `GET /api/v1/admin/analytics/revenue-by-method`
- `GET /api/v1/admin/analytics/revenue-monthly`

#### 2. Customer Retention Metrics
- Repeat purchase rate
- Customer distribution by order count
- New vs returning customers

**Endpoints:**
- `GET /api/v1/admin/analytics/retention`
- `GET /api/v1/admin/analytics/new-vs-returning`

#### 3. Product Performance
- Top products by revenue
- Zero sales products identification
- Sales metrics per product

**Endpoints:**
- `GET /api/v1/admin/analytics/products/top`
- `GET /api/v1/admin/analytics/products/zero-sales`

#### 4. Payment & Operations Metrics
- Payment method health and success rates
- Average time to payment
- Operational metrics (pending orders, low stock)

**Documentation:**
- `docs/ANALYTICS_CONTRACT.md` - Complete metric definitions
- `docs/ANALYTICS_IMPLEMENTATION.md` - Technical details
- `docs/ANALYTICS_ROADBLOCKS.md` - Current limitations
- `docs/EVENT_TRACKING_SPEC.md` - Future event tracking plans

**Key Constraint:** Wave 1 uses only existing transactional data, no new event tracking

---

---

## Admin Area Cleanup

**Date:** January 2026  
**Focus:** Eliminate Angular NG8107 warnings and TypeScript errors

### Issues Fixed

#### 1. Angular NG8107 Warnings - Redundant Optional Chaining
- **Root Cause:** Using `?.` on properties guaranteed by type system
- **Files Affected:** 13 warnings across admin components
- **Solution:** Removed unnecessary optional chaining where types guarantee non-null

**Example Fix:**
```typescript
// Before
<td>{{ order.user?.name || order.user?.email || 'N/A' }}</td>

// After  
<td>{{ order.user.name || order.user.email || 'N/A' }}</td>
```

**Components Updated:**
- `admin-dashboard.component.ts`
- `order-list.component.ts`
- `product-list.component.ts`
- `user-list.component.ts`

#### 2. Favicon 404 Errors
- **Issue:** Browser requesting `/favicon.png` → 404
- **Fix:** Updated `index.html` favicon references to use correct asset paths
- **Impact:** Cleaner console, better developer experience

**Result:** ✅ **0 Warnings, 0 Errors**

---

## Payment System Fixes

**Date:** January 2026  
**Focus:** Stabilize payment flow across all payment methods

### Critical Issues Resolved

#### 1. Invalid State Transition
**Error:** `Invalid transition: pending_manual_payment → pending`

**Root Cause:**
```typescript
// Order created with pending_manual_payment status
const order = await Order.create({
  status: 'pending_manual_payment',
  paymentStatus: 'pending_manual_payment'
});

// Frontend incorrectly called /manual/initiate
// Service tried to transition pending_manual_payment → pending (INVALID!)
await paymentLifecycle.transitionToPending(order, PaymentMethod.MANUAL);
```

**Solution:**
- Added `pending_manual_payment` to valid state machine transitions
- Removed unnecessary initiate call for manual payments
- Order creation now directly sets correct status

#### 2. "Cart is Empty" False Positive
**Error:** Cart cleared too early, before payment completion check

**Root Cause:**
```typescript
// 1. Order created ✅
const order = await Order.create({...});

// 2. Cart cleared ❌ TOO EARLY!
cart.items = [];
await cart.save();

// 3. Manual payment initiate tries to check cart → EMPTY!
```

**Solution:**
- Removed cart validation from manual payment initiate
- Cart clearing happens after order creation, not before payment methods

#### 3. Stock Not Restored on Payment Failure
**Issue:** Failed payments locked inventory permanently

**Solution:**
- Added automatic stock restoration in lifecycle manager
- Unified cancellation flow through state machine
- Stock released on payment failure, cancellation, or timeout

### Payment Methods & Flows

#### Manual Payment
```typescript
// Customer Flow
1. Create order → pending_manual_payment status
2. Cart cleared automatically
3. Navigate to /orders page
4. Wait for admin confirmation

// Admin Flow
1. View pending manual payments in admin panel
2. Confirm payment received
3. Order transitions → paid → processing
```

**Key Point:** NO separate `/manual/initiate` call needed!

#### MoMo Payment
```typescript
// Customer Flow
1. Create order → pending status
2. Call /momo/initiate → receive payUrl
3. Cart cleared
4. Redirect to MoMo payment page

// MoMo IPN Callback
- Success (resultCode=0) → order transitions to paid
- Failure (resultCode≠0) → order failed, stock restored
```

#### Bank Transfer Payment
```typescript
// Customer Flow
1. Create order → pending_bank_transfer status
2. Call /bank-transfer/invoice → receive payment details
3. Cart cleared
4. Customer makes bank transfer manually
5. Provide payment reference

// Admin Flow
1. Verify bank transfer received
2. Confirm payment in admin panel
3. Order transitions → paid → processing
```

### State Machine Valid Transitions

```typescript
const validTransitions = {
  pending: ['processing', 'cancelled', 'failed'],
  pending_manual_payment: ['paid', 'cancelled', 'failed'],
  pending_bank_transfer: ['paid', 'cancelled', 'failed'],
  processing: ['shipped', 'cancelled'],
  paid: ['processing', 'refunded'],
  shipped: ['delivered', 'returned'],
  delivered: ['completed'],
  cancelled: [],
  failed: [],
  refunded: [],
  returned: [],
  completed: []
};
```

---

## Checkout Flow Stabilization

**Date:** January 7, 2026  
**Focus:** Eliminate checkout warnings and errors

### Issues Fixed

#### 1. Animation @fadeIn Warning (NG8107)
**Location:** `profile.component.ts`

**Problem:**
- Template referenced `[@fadeIn]` animation
- No animation definition in component metadata
- Created console noise

**Solution:**
```typescript
// Before
<div *ngIf="activeTab() === 'profile'" class="tab-content" [@fadeIn]>

// After
<div *ngIf="activeTab() === 'profile'" class="tab-content">
```

**Impact:** ✅ Cleaner console, no animation warnings

#### 2. Favicon 404 Error
**Same fix as Admin Area Cleanup**

---

## Bank Transfer Implementation

**Date:** January 2026  
**Focus:** Add international bank transfer payment method

### Design Overview

**Currency:** GBP only (no conversion)  
**Flow:** Generate invoice → Customer pays → Admin confirms  
**Gateway:** Simulated international bank transfer with UK bank details

### Features Implemented

1. **IBAN/SWIFT Code Generation**
   - UK-based bank details
   - Unique payment reference per order
   
2. **Invoice Generation**
   - Unique invoice numbers
   - QR code data for banking apps
   - 3-day payment deadline
   
3. **Payment Tracking**
   - Reference code: `GBPORD-{orderId}`
   - Invoice number: `INV-{year}-{orderId}`
   
4. **Admin Confirmation**
   - Manual verification in admin panel
   - Payment proof upload support

### Service Architecture

```typescript
// No duplicate state transition!
async generatePaymentInvoice(orderId, userId): IBankTransferInvoice {
  // Order already in pending_bank_transfer from creation
  
  const reference = `GBPORD-${orderId.slice(-8).toUpperCase()}`;
  const invoiceNumber = `INV-${new Date().getFullYear()}-${orderId.slice(-6)}`;
  const dueDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  
  return {
    orderId,
    invoiceNumber,
    reference,
    bankDetails: {
      accountName: 'BonSight Ltd',
      iban: 'GB29 NWBK 6016 1331 9268 19',
      swiftCode: 'NWBKGB2L',
      bankName: 'NatWest Bank',
      accountNumber: '31926819',
      sortCode: '60-16-13'
    },
    amount: order.totalAmount,
    currency: 'GBP',
    dueDate,
    instructions: 'Include reference code in payment description'
  };
}
```

---

## Workspace Organization

**Date:** January 7, 2026  
**Type:** Project maintenance and optimization

### Files Removed (Previous Cleanup)

#### Test & Development Scripts
- `test-momo.ps1`
- `test-momo-conversion.ps1`
- `verify-momo.ps1`
- `test-manual-payment.http`
- `test-momo-simple.http`
- `test-system-stability.http`
- `backend/test-momo.js`
- `backend/test-momo-curl.js`
- `backend/test-momo-direct.mjs`
- `backend/fix-products-indexes.js`

#### Outdated Reports
- `SYSTEM_STATUS_REPORT.md`
- `MOMO_CURRENCY_CONVERSION_REPORT.md`
- `MOMO_FIXES_SUMMARY.md`
- `IMPLEMENTATION_SUMMARY.md`
- `PAYMENT_STANDARDIZATION_SUMMARY.md`

#### IDE Artifacts
- `backend/data/seeds/bonsai/.idea/`

### Files Archived to docs/archived/

- `MOMO_TESTING_GUIDE.md`
- `MULTI_PAYMENT_TESTING.md`
- `MOMO_PAYMENT_README.md`
- `MOMO_QUICK_START.md`
- `IMPLEMENTATION_MULTI_PAYMENT.md`
- `MULTI_PAYMENT_SYSTEM.md`
- `PAYMENT_QUICK_START.md`
- `PAYMENT_SYSTEM_TEST_CHECKLIST.md`

---

## Current Project Status

### Active Documentation

**Root Level:**
- `README.md` - Project overview and quick start
- `QUICK_START.md` - 5-minute setup guide
- `DEV_ENVIRONMENT.md` - Development environment details

**docs/ Directory:**
- `ARCHITECTURE.md` - System architecture
- `API.md` - API documentation
- `DATA.md` - Data management and seeding
- `DEPLOYMENT.md` - Deployment guide
- `FRONTEND.md` - Frontend documentation
- `PAYMENT_GUIDE.md` - Payment system guide
- `MANUAL_PAYMENT.md` - Manual payment workflow
- `MOMO_INTEGRATION.md` - MoMo integration guide

**docs/archived/:**
- Historical documentation for reference
- Detailed testing guides
- Legacy implementation notes

### Key Takeaways

✅ **Clean Codebase:** Zero warnings, zero errors  
✅ **Stable Payment Flow:** All payment methods working correctly  
✅ **Clear Documentation:** Well-organized, consolidated docs  
✅ **Maintainable Structure:** Archived old docs, kept essentials  
✅ **Developer Experience:** Fast dev environment, clear guides

---

## Future Improvements

Based on recent fixes, consider:

1. **Automated Testing:** Add integration tests for payment flows
2. **State Machine Validation:** Add compile-time checks for valid transitions
3. **Error Recovery:** Implement automatic retry mechanisms
4. **Monitoring:** Add payment flow analytics and alerting
5. **Documentation:** Keep changelog updated with each major change

---

*This document consolidates information from multiple changelog files that were previously scattered at the project root. All original files have been archived to `docs/changelogs/` for historical reference.*
