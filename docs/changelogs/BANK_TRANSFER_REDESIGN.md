# Bank Transfer Payment Redesign

## Problem Statement
Bank transfer payment flow had the same state transition error as manual payment:
```
Invalid transition: pending → pending
```

**Root Cause**: Order already created with `pending` status, but `initiateBankTransfer` tried to transition to `pending` again.

## Solution

### New Design: Simulated International Bank Transfer
- **Currency**: GBP only (no conversion needed)
- **Flow**: Generate invoice → User pays → Admin confirms
- **Payment Gateway**: Simulated international bank transfer with UK bank details
- **Features**:
  - IBAN/SWIFT code generation
  - Unique payment reference code
  - Invoice generation with QR code data
  - 3-day payment deadline
  - Admin manual confirmation

---

## Architecture Changes

### 1. Service Layer (`bankTransferService.ts`)

#### Old Flow (BROKEN)
```typescript
async initiateBankTransfer(orderId, userId) {
  await paymentLifecycle.transitionToPending(order); // ❌ DUPLICATE TRANSITION!
  // Generate bank details...
}

async verifyBankTransfer(orderId) {
  // Auto-verify after delay (unrealistic)
}
```

#### New Flow (FIXED)
```typescript
async generatePaymentInvoice(orderId, userId): IBankTransferInvoice {
  // NO state transition - order already pending from creation
  
  const reference = `GBPORD-${orderId.slice(-8).toUpperCase()}`;
  const invoiceNumber = `INV-${new Date().getFullYear()}-${orderId.slice(-6)}`;
  const dueDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // +3 days
  
  // Save invoice to order
  order.paymentDetails = {
    gateway: 'bank_transfer',
    reference,
    invoiceNumber,
    invoiceIssuedAt: new Date(),
    invoiceDueDate: dueDate
  };
  await order.save();
  
  // Return invoice with UK bank details
  return {
    orderId,
    reference,
    invoiceNumber,
    amount: order.totalAmount,
    currency: 'GBP',
    issuedAt: new Date(),
    dueDate,
    bankDetails: {
      bankName: 'NatWest Bank',
      accountName: 'Ponsai JSC',
      iban: 'GB29NWBK60161331926819',
      swift: 'NWBKGB2L',
      sortCode: '60-16-13',
      accountNumber: '31926819'
    },
    qrData: JSON.stringify({...}) // For mobile banking apps
  };
}

async confirmBankTransfer(orderId, adminUserId, adminUserName, bankReference?) {
  // Admin confirms when they see payment in bank account
  const transactionId = bankReference || this.generateTransactionId();
  
  await paymentLifecycle.transitionToPaid(order, {
    confirmedBy: adminUserId,
    confirmedByName: adminUserName,
    transactionId
  });
  
  return {
    success: true,
    orderId,
    transactionId,
    confirmedAt: new Date(),
    message: 'Bank transfer confirmed'
  };
}
```

### Key Changes
1. **Removed duplicate state transition** - Order already `pending` from creation
2. **Removed currency conversion** - Pure GBP system
3. **Removed auto-verify** - Admin must manually confirm
4. **Added invoice generation** - IBAN, SWIFT, reference code
5. **Added QR code data** - For mobile banking

---

## API Endpoints

### User Endpoints

#### POST `/api/payments/bank-transfer/initiate`
**Description**: Generate payment invoice for bank transfer

**Request**:
```json
{
  "orderId": "507f1f77bcf86cd799439011"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "orderId": "507f1f77bcf86cd799439011",
    "reference": "GBPORD-99439011",
    "invoiceNumber": "INV-2024-439011",
    "amount": 299.99,
    "currency": "GBP",
    "issuedAt": "2024-01-15T10:30:00Z",
    "dueDate": "2024-01-18T10:30:00Z",
    "bankDetails": {
      "bankName": "NatWest Bank",
      "accountName": "Ponsai JSC",
      "iban": "GB29NWBK60161331926819",
      "swift": "NWBKGB2L",
      "sortCode": "60-16-13",
      "accountNumber": "31926819"
    },
    "qrData": "{...}" // JSON string for QR generation
  },
  "message": "Payment invoice generated"
}
```

#### GET `/api/payments/bank-transfer/invoice/:orderId`
**Description**: Retrieve invoice details for existing order

**Response**: Same as initiate endpoint

---

### Admin Endpoints

#### PATCH `/api/admin/payments/bank-transfer/:id/confirm`
**Description**: Confirm bank transfer payment (admin only)

**Request**:
```json
{
  "bankReference": "TXN-123456789", // Optional
  "note": "Received via NatWest online banking"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "orderId": "507f1f77bcf86cd799439011",
    "previousStatus": "pending",
    "newStatus": "paid",
    "confirmedAt": "2024-01-16T14:20:00Z",
    "confirmedBy": "Admin Name",
    "transactionId": "TXN-123456789"
  },
  "message": "Bank transfer payment confirmed successfully"
}
```

---

## Database Schema Changes

### Order Model - `paymentDetails` Extension
```typescript
paymentDetails?: {
  // ... existing fields ...
  
  // NEW: Bank transfer specific fields
  reference?: string;         // GBPORD-XXXXXXXX
  invoiceNumber?: string;     // INV-2024-XXXXXX
  invoiceIssuedAt?: Date;     // When invoice was generated
  invoiceDueDate?: Date;      // Payment deadline (+3 days)
}
```

---

## User Flow

### 1. Create Order with Bank Transfer
```
User → Checkout → Select "Bank Transfer" → Create Order
Result: Order created with status = 'pending', paymentStatus = 'pending'
```

### 2. Generate Invoice
```
Frontend → POST /api/payments/bank-transfer/initiate
Backend → Generate invoice (NO state change)
Frontend ← Receive invoice with IBAN/SWIFT/Reference
```

### 3. Display Invoice to User
```
Frontend displays:
- Bank account details (IBAN, SWIFT, etc.)
- Payment reference code (COPY button)
- Amount: £299.99 GBP
- Due date: 3 days
- QR code for mobile banking
```

### 4. User Makes Payment
```
User → Opens banking app/website
User → Transfers £299.99 to IBAN GB29NWBK60161331926819
User → Uses reference: GBPORD-99439011
```

### 5. Admin Confirms Payment
```
Admin → Checks bank account
Admin → Sees payment with reference GBPORD-99439011
Admin → Goes to admin panel
Admin → PATCH /api/admin/payments/bank-transfer/:id/confirm
Backend → Transitions order to PAID
User → Receives order confirmation email
```

---

## Frontend Implementation (TODO)

### Invoice Display Component
```typescript
// src/app/features/payment/bank-transfer-invoice.component.ts

interface BankTransferInvoice {
  reference: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  dueDate: Date;
  bankDetails: {
    bankName: string;
    accountName: string;
    iban: string;
    swift: string;
  };
  qrData: string;
}

@Component({
  selector: 'app-bank-transfer-invoice',
  template: `
    <div class="invoice-container">
      <h3>Payment Invoice</h3>
      
      <!-- Bank Details -->
      <div class="bank-details">
        <p><strong>Bank Name:</strong> {{ invoice.bankDetails.bankName }}</p>
        <p><strong>Account Name:</strong> {{ invoice.bankDetails.accountName }}</p>
        <p><strong>IBAN:</strong> 
          <code>{{ invoice.bankDetails.iban }}</code>
          <button (click)="copy(invoice.bankDetails.iban)">📋 Copy</button>
        </p>
        <p><strong>SWIFT/BIC:</strong> {{ invoice.bankDetails.swift }}</p>
      </div>
      
      <!-- Payment Details -->
      <div class="payment-details">
        <p><strong>Amount:</strong> £{{ invoice.amount }} {{ invoice.currency }}</p>
        <p><strong>Reference:</strong> 
          <code>{{ invoice.reference }}</code>
          <button (click)="copy(invoice.reference)">📋 Copy</button>
        </p>
        <p><strong>Due Date:</strong> {{ invoice.dueDate | date }}</p>
      </div>
      
      <!-- QR Code -->
      <div class="qr-code">
        <qr-code [data]="invoice.qrData" size="200"></qr-code>
        <p>Scan to pay via mobile banking</p>
      </div>
      
      <!-- Important Notice -->
      <div class="notice">
        <p>⚠️ <strong>IMPORTANT:</strong> You MUST include the reference code in your transfer!</p>
        <p>Your order will be processed once we verify the payment (1-3 business days).</p>
      </div>
    </div>
  `
})
export class BankTransferInvoiceComponent {
  @Input() invoice!: BankTransferInvoice;
  
  copy(text: string) {
    navigator.clipboard.writeText(text);
    // Show success toast
  }
}
```

### Checkout Integration
```typescript
// Update checkout.component.ts

private async processBankTransferPayment(orderId: string) {
  try {
    const response = await this.paymentService.generateBankTransferInvoice(orderId);
    
    // Display invoice modal
    this.showInvoiceModal(response.data);
    
    // Navigate to orders page
    this.router.navigate(['/orders']);
  } catch (error) {
    this.handleError(error);
  }
}
```

---

## Testing Checklist

### Backend Tests

- [ ] Generate invoice for new order (should succeed)
- [ ] Generate invoice when order already has invoice (should return existing)
- [ ] Confirm payment as admin (should transition to PAID)
- [ ] Confirm already-paid order (should return idempotent response)
- [ ] Try to confirm as non-admin user (should fail with 403)
- [ ] Verify stock restoration on payment timeout (if implemented)

### API Tests

```bash
# 1. Create order with bank transfer
POST /api/orders
{
  "items": [...],
  "paymentMethod": "bank_transfer"
}

# 2. Generate invoice
POST /api/payments/bank-transfer/initiate
{
  "orderId": "ORDER_ID"
}

# 3. Get invoice details
GET /api/payments/bank-transfer/invoice/ORDER_ID

# 4. Admin confirm payment
PATCH /api/admin/payments/bank-transfer/ORDER_ID/confirm
Headers: Authorization: Bearer ADMIN_TOKEN
{
  "bankReference": "TXN-12345"
}
```

### Frontend Tests

- [ ] Display invoice after checkout
- [ ] Copy IBAN to clipboard
- [ ] Copy reference to clipboard
- [ ] Generate QR code from qrData
- [ ] Show countdown to due date
- [ ] Display payment instructions

---

## State Machine Validation

### Valid Transitions
```
CREATED → PENDING (order creation)
PENDING → PAID (admin confirmation)
PENDING → CANCELLED (user/admin cancellation)
```

### Invalid Transitions (PREVENTED)
```
❌ PENDING → PENDING (duplicate initiate - FIXED!)
❌ PAID → PENDING (cannot unpay)
❌ CANCELLED → PAID (cannot pay cancelled order)
```

---

## Files Modified

### Backend
1. **services/bankTransferService.ts**
   - Renamed `initiateBankTransfer` → `generatePaymentInvoice`
   - Removed `verifyBankTransfer` method
   - Added `confirmBankTransfer` method
   - Removed duplicate state transition
   - Added invoice generation with IBAN/SWIFT

2. **controllers/paymentController.ts**
   - Updated `initiateBankTransfer` to call `generatePaymentInvoice`
   - Replaced `verifyBankTransfer` with `getBankTransferInvoice`

3. **controllers/adminController.ts**
   - Added `confirmBankTransfer` endpoint
   - Added import for `bankTransferService`

4. **routes/paymentRoutes.ts**
   - Removed `POST /bank-transfer/verify`
   - Added `GET /bank-transfer/invoice/:orderId`

5. **routes/adminRoutes.ts**
   - Added `PATCH /payments/bank-transfer/:id/confirm`

6. **models/Order.ts**
   - Added bank transfer fields to `paymentDetails`:
     - `reference`
     - `invoiceNumber`
     - `invoiceIssuedAt`
     - `invoiceDueDate`

### Frontend (TODO)
- `checkout.component.ts` - Update bank transfer handler
- `bank-transfer-invoice.component.ts` - Create new component
- `payment.service.ts` - Add invoice generation API call
- Install QR code library (e.g., `ngx-qrcode2`)

---

## Benefits

✅ **Fixed state transition error** - No duplicate `pending → pending`  
✅ **Simplified flow** - Order creation + Invoice generation (2 steps)  
✅ **No currency conversion** - Pure GBP system  
✅ **Realistic international transfer** - IBAN/SWIFT codes  
✅ **Admin control** - Manual confirmation prevents fraud  
✅ **User-friendly** - Clear invoice with copy buttons  
✅ **Mobile-ready** - QR code for banking apps  
✅ **Consistent with manual payment** - Same architecture pattern  

---

## Next Steps

1. ✅ **Backend Implementation** - COMPLETED
2. ⏳ **Frontend Implementation**
   - Create invoice display component
   - Update checkout flow
   - Add QR code generation
   - Add copy-to-clipboard
3. ⏳ **Admin Dashboard**
   - List pending bank transfers
   - Quick confirm button
   - Show reference codes
4. ⏳ **Testing**
   - End-to-end flow test
   - Admin confirmation test
   - Error handling test

---

## Comparison: Manual Payment vs Bank Transfer

| Feature | Manual Payment | Bank Transfer |
|---------|---------------|---------------|
| **Currency** | GBP | GBP |
| **Flow** | Create order → Admin confirms | Create order → Generate invoice → Admin confirms |
| **User Action** | None (wait) | Transfer money to bank |
| **State Transition** | CREATED → PENDING_MANUAL_PAYMENT | CREATED → PENDING |
| **Confirmation** | Admin marks as received | Admin verifies bank statement |
| **Invoice** | No | Yes (IBAN/SWIFT/Reference) |
| **QR Code** | No | Yes (for mobile banking) |

---

## Development Environment

This is a **simulated** international bank transfer for development purposes:
- Bank details are fake but realistic (UK format)
- No actual banking API integration
- Admin manually confirms by checking order in database
- Perfect for testing payment flow without real money

**For Production**: Replace with real payment gateway (Stripe, PayPal, TransferWise, etc.)

---

*Last Updated: 2024-01-15*  
*Status: Backend Complete ✅ | Frontend Pending ⏳*

