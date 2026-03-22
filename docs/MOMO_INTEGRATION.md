# MOMO Payment Integration Guide

## Tổng quan

Dự án đã được tích hợp cổng thanh toán MOMO ở chế độ **Sandbox** (test mode) để xử lý thanh toán trực tuyến. Luồng thanh toán tuân theo tiêu chuẩn bảo mật của MOMO với xác thực chữ ký HMAC SHA256.

## Kiến trúc

### Backend Components

1. **MomoService** (`backend/src/services/momoService.ts`)
   - Tạo payment request
   - Xác thực chữ ký IPN
   - Parse result codes
   - Quản lý MOMO credentials

2. **PaymentController** (`backend/src/controllers/paymentController.ts`)
   - `initiateMomoPayment`: Khởi tạo thanh toán
   - `handleMomoIPN`: Xử lý callback từ MOMO server (IPN)
   - `handleMomoCallback`: Xử lý redirect từ MOMO
   - `checkPaymentStatus`: Kiểm tra trạng thái thanh toán

3. **OrderController** (`backend/src/controllers/orderController.ts`)
   - `createOrder`: Tạo đơn hàng từ giỏ
   - `getUserOrders`: Lấy danh sách đơn hàng
   - `cancelOrder`: Hủy đơn hàng

4. **Routes**
   - `/api/orders` - Order management
   - `/api/payment/momo/*` - MOMO payment endpoints

### Frontend Components

1. **CheckoutComponent** (`frontend/src/app/features/checkout/checkout.component.ts`)
   - Form nhập thông tin shipping
   - Tạo đơn hàng
   - Khởi tạo thanh toán MOMO
   - Redirect đến MOMO

2. **PaymentCallbackComponent** (`frontend/src/app/features/payment/payment-callback.component.ts`)
   - Nhận kết quả từ MOMO
   - Hiển thị trạng thái thanh toán (success/failed/pending)
   - Retry payment nếu thất bại

3. **Services**
   - `OrderService` - Quản lý đơn hàng
   - `PaymentService` - Xử lý thanh toán

## Luồng thanh toán

### 1. User Checkout
```
User -> Checkout Page -> Fill shipping info -> Click "Pay with MOMO"
```

### 2. Create Order & Initiate Payment
```
Frontend: POST /api/orders
  ↓
Backend: Create order with status='pending', paymentStatus='pending'
  ↓
Frontend: POST /api/payment/momo/initiate
  ↓
Backend: Call MOMO API to create payment
  ↓
Backend: Return payUrl
  ↓
Frontend: Redirect to MOMO payment page
```

### 3. User Payment on MOMO
```
User completes payment on MOMO app/website
```

### 4. MOMO Callbacks

**A. IPN (Instant Payment Notification) - Server to Server**
```
MOMO Server -> POST /api/payment/momo/ipn
  ↓
Verify signature
  ↓
Update order status:
  - resultCode = 0: paymentStatus='paid', status='processing'
  - Others: paymentStatus='failed', status='cancelled'
```

**B. Redirect - User Returns**
```
MOMO -> Redirect to /payment/momo/callback?orderId=...&resultCode=...
  ↓
Frontend: GET /api/payment/momo/callback
  ↓
Backend: Return payment status
  ↓
Frontend: Show result page (success/failed/pending)
```

## Cấu hình

### Backend Environment Variables

Đã được cấu hình trong `backend/.env`:

```bash
# MOMO Sandbox Credentials (public test credentials)
MOMO_PARTNER_CODE=MOMOBKUN20180529
MOMO_ACCESS_KEY=klm05TvNBzhg7h7j
MOMO_SECRET_KEY=at67qH6mk8w5Y1nAyMoYKMWACiEi2bsa
MOMO_ENDPOINT=https://test-payment.momo.vn/v2/gateway/api/create
MOMO_REDIRECT_URL=http://localhost:4200/payment/momo/callback
MOMO_IPN_URL=http://localhost:3000/api/payment/momo/ipn
```

**Lưu ý**: Đây là credentials sandbox công khai của MOMO. Khi triển khai production, bạn cần:
1. Đăng ký tài khoản MOMO Business tại https://business.momo.vn
2. Xin cấp Partner Code, Access Key, Secret Key riêng
3. Cập nhật endpoint sang production: `https://payment.momo.vn/v2/gateway/api/create`

### Frontend Routes

Đã thêm route trong `frontend/src/app/app.routes.ts`:
```typescript
{
  path: 'payment/momo/callback',
  loadComponent: () => import('./features/payment/payment-callback.component')
}
```

## Trạng thái thanh toán

### Order Status
- `pending`: Đơn hàng mới tạo
- `processing`: Đã thanh toán, đang xử lý
- `shipped`: Đã gửi hàng
- `delivered`: Đã giao hàng
- `cancelled`: Đã hủy

### Payment Status
- `pending`: Chưa thanh toán
- `paid`: Đã thanh toán ✅ (Chỉ được set khi MOMO IPN trả về resultCode = 0)
- `failed`: Thanh toán thất bại
- `refunded`: Đã hoàn tiền

### MOMO Result Codes

| Code | Meaning | Action |
|------|---------|--------|
| 0 | Success | Set `paymentStatus = 'paid'` |
| 9000 | Pending | Keep `paymentStatus = 'pending'` |
| 1006 | Transaction failed | Set `paymentStatus = 'failed'` |
| 4100 | User cancelled | Set `paymentStatus = 'failed'` |
| 1081 | Timeout | Set `paymentStatus = 'failed'` |
| 2007 | Invalid signature | Reject request |

## Bảo mật

### 1. Signature Verification
Mọi IPN từ MOMO đều được verify signature bằng HMAC SHA256:

```typescript
const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;

const signature = crypto
  .createHmac('sha256', secretKey)
  .update(rawSignature)
  .digest('hex');
```

**Quan trọng**: Nếu signature không khớp, request bị reject ngay lập tức.

### 2. Order State Protection
- Đơn hàng chỉ được đánh dấu `paid` khi IPN hợp lệ từ MOMO
- Frontend callback chỉ dùng để hiển thị, không update trạng thái
- Ngăn chặn race condition bằng cách kiểm tra trạng thái hiện tại

### 3. Stock Management
- Trừ stock ngay khi tạo order
- Hoàn lại stock nếu payment failed hoặc order cancelled
- Kiểm tra stock trước khi tạo order

## Testing

### Test trong Sandbox Mode

1. **Start backend**:
```bash
cd backend
npm run dev
```

2. **Start frontend**:
```bash
cd frontend
npm start
```

3. **Test flow**:
   - Thêm sản phẩm vào giỏ
   - Checkout và điền shipping info
   - Click "Pay with MOMO"
   - Sẽ redirect đến MOMO test page
   - Sử dụng các test credentials của MOMO để simulate payment

### MOMO Test Credentials

MOMO sandbox cho phép test các scenarios:
- **Successful payment**: Sử dụng số điện thoại test của MOMO
- **Failed payment**: Reject payment trên MOMO page
- **Timeout**: Để payment page timeout

## IPN Callback Testing

Để test IPN trong môi trường local, bạn cần expose backend ra internet:

### Option 1: ngrok (Recommended)
```bash
# Install ngrok
npm install -g ngrok

# Expose backend port
ngrok http 3000

# Update MOMO_IPN_URL in .env
MOMO_IPN_URL=https://your-ngrok-url.ngrok.io/api/payment/momo/ipn
```

### Option 2: localtunnel
```bash
npm install -g localtunnel
lt --port 3000
```

## Monitoring & Logs

Backend logs tất cả MOMO transactions:

```typescript
console.log('Creating MOMO payment request:', { orderId, amount });
console.log('MOMO payment response:', { resultCode, message });
console.log('Received MOMO IPN:', { orderId, resultCode, transId });
console.log('Order marked as PAID via MOMO:', orderId);
```

Kiểm tra logs để debug issues.

## Production Deployment

### 1. Cập nhật MOMO credentials
- Đăng ký MOMO Business account
- Nhận production credentials
- Update `.env` với production values

### 2. Cập nhật URLs
```bash
MOMO_ENDPOINT=https://payment.momo.vn/v2/gateway/api/create
MOMO_REDIRECT_URL=https://yourdomain.com/payment/momo/callback
MOMO_IPN_URL=https://yourdomain.com/api/payment/momo/ipn
```

### 3. SSL/HTTPS
- MOMO yêu cầu HTTPS cho IPN URL
- Sử dụng Let's Encrypt hoặc SSL certificate

### 4. Error Handling
- Monitor failed payments
- Setup alerts cho signature mismatches
- Log tất cả IPN callbacks

## Troubleshooting

### Payment không được cập nhật status

**Nguyên nhân**: IPN không được gọi hoặc bị block

**Giải pháp**:
1. Kiểm tra MOMO_IPN_URL có accessible từ internet không
2. Kiểm tra firewall/CORS settings
3. Xem backend logs xem có nhận IPN không

### Signature verification failed

**Nguyên nhân**: Secret key sai hoặc raw signature string sai thứ tự

**Giải pháp**:
1. Kiểm tra MOMO_SECRET_KEY
2. Đảm bảo raw signature params theo đúng alphabet order
3. Xem MOMO documentation để cập nhật signature format

### Order bị duplicate

**Nguyên nhân**: User click nhiều lần hoặc retry

**Giải pháp**:
1. Disable button khi processing
2. Kiểm tra order status trước khi update
3. Sử dụng requestId unique

## API Endpoints

### Orders
```
POST   /api/orders              - Create order
GET    /api/orders              - Get user orders
GET    /api/orders/:id          - Get single order
PATCH  /api/orders/:id/cancel   - Cancel order
```

### Payment
```
POST   /api/payment/momo/initiate          - Initiate MOMO payment
POST   /api/payment/momo/ipn               - MOMO IPN callback
GET    /api/payment/momo/callback          - MOMO redirect callback
GET    /api/payment/status/:orderId        - Check payment status
```

## Support

- MOMO Documentation: https://developers.momo.vn
- MOMO Support: support@momo.vn
- MOMO Test Environment: https://test-payment.momo.vn

## License

MIT
