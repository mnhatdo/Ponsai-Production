# Ponsai E-Commerce - Getting Started Guide

**🎯 Mục đích:** Hướng dẫn chi tiết để setup và chạy project từ đầu sau khi clone về.

**👥 Đối tượng:** Developers, Team members, Reviewers

---

## 📋 Prerequisites (Yêu cầu trước khi bắt đầu)

### 1. Cài đặt Node.js
- **Version:** 20.0.0 hoặc mới hơn
- **Download:** https://nodejs.org/
- **Kiểm tra:**
  ```bash
  node --version  # v20.x.x
  npm --version   # 10.x.x
  ```

### 2. Cài đặt Python
- **Version:** 3.13 hoặc mới hơn
- **Download:** https://www.python.org/downloads/
- **Kiểm tra:**
  ```bash
  python --version  # 3.13.x
  pip --version
  ```

### 3. Cài đặt MongoDB
- **Version:** 6.0 hoặc mới hơn
- **Tùy chọn 1:** MongoDB Community Server (Local)
  - Download: https://www.mongodb.com/try/download/community
- **Tùy chọn 2:** MongoDB Atlas (Cloud - Free tier)
  - https://www.mongodb.com/cloud/atlas/register

**Khởi động MongoDB (nếu cài local):**
```bash
# Windows (chạy mongod)
mongod

# Linux/Mac
sudo systemctl start mongod
```

**Kiểm tra:**
```bash
mongosh  # Kết nối đến MongoDB shell
```

### 4. Cài đặt Git
- **Download:** https://git-scm.com/downloads
- **Kiểm tra:**
  ```bash
  git --version
  ```

---

## 🚀 Quick Start (3 bước đơn giản)

### Bước 1: Clone Repository

```bash
git clone https://github.com/mnhatdo/advanced_webdev.git
cd advanced_webdev
```

### Bước 2: Chạy Setup Script

**Windows (PowerShell - Recommended):**
```powershell
.\setup-ml-system.ps1
```

**Windows (Command Prompt):**
```batch
setup-ml-system.bat
```

**Linux/Mac:**
```bash
chmod +x setup-ml-system.sh
./setup-ml-system.sh
```

Script này sẽ tự động:
- ✅ Cài đặt dependencies cho Backend, Frontend, ML Service
- ✅ Build TypeScript cho Backend
- ✅ Tạo Python virtual environment
- ✅ Seed database với sample data (products, admin user, test data)

### Bước 3: Chạy Services

**Mở 4 terminal riêng biệt:**

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# ✓ Backend chạy tại: http://localhost:3000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
ng serve
# ✓ Frontend chạy tại: http://localhost:4200
```

**Terminal 3 - ML Service:**
```bash
cd ml-service
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

python main.py
# ✓ ML Service chạy tại: http://localhost:8000
```

**Terminal 4 - MongoDB (nếu chưa chạy):**
```bash
mongod
# ✓ MongoDB chạy tại: mongodb://localhost:27017
```

---

## 🔧 Manual Setup (Setup thủ công từng bước)

Nếu setup script không hoạt động, làm theo hướng dẫn chi tiết dưới đây:

### 1. Backend Setup

```bash
cd backend

# Cài đặt dependencies
npm install

# Cài thêm cookie-parser (bắt buộc)
npm install cookie-parser @types/cookie-parser

# Build TypeScript
npm run build

# Kiểm tra build thành công
ls dist/  # Phải có các file .js được compile
```

**Tạo file .env:**
```bash
# Tạo file .env trong thư mục backend/
touch .env  # Linux/Mac
# Hoặc tạo bằng notepad trên Windows
```

**Nội dung .env:**
```env
# Server
NODE_ENV=development
PORT=3000

# MongoDB (Local)
MONGO_URI=mongodb://localhost:27017/ponsai_ecommerce

# Hoặc MongoDB Atlas (Cloud)
# MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/ponsai_ecommerce

# JWT Secrets (Đổi thành secret key của bạn)
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long
JWT_EXPIRE=7d
REFRESH_TOKEN_SECRET=your-refresh-token-secret-min-32-characters
REFRESH_TOKEN_EXPIRE=30d

# Session
SESSION_SECRET=your-session-secret-key-min-32-characters

# MoMo Payment (Test credentials - cần đăng ký tại momo.vn)
MOMO_PARTNER_CODE=your-partner-code
MOMO_ACCESS_KEY=your-access-key
MOMO_SECRET_KEY=your-secret-key
MOMO_ENDPOINT=https://test-payment.momo.vn/v2/gateway/api/create
MOMO_REDIRECT_URL=http://localhost:4200/payment/momo/callback
MOMO_IPN_URL=http://localhost:3000/api/v1/payment/momo/ipn

# ML Service
ML_SERVICE_URL=http://localhost:8000

# CORS
FRONTEND_URL=http://localhost:4200
```

**Seed Database:**
```bash
# Tạo products và categories (Bonsai data)
npm run seed:bonsai

# Tạo admin user
npm run seed:admin

# Tạo test data (6 months data cho analytics & ML)
npm run build  # Build lại nếu cần
node scripts/generate-realistic-data.js
```

**Khởi động Backend:**
```bash
npm run dev
# ✓ Backend running on http://localhost:3000
# ✓ API endpoint: http://localhost:3000/api/v1
```

### 2. Frontend Setup

```bash
cd frontend

# Cài đặt dependencies
npm install

# Cấu hình environment (không cần thay đổi cho development)
# File: frontend/src/environments/environment.ts
```

**Khởi động Frontend:**
```bash
ng serve
# ✓ Frontend running on http://localhost:4200
```

**Hoặc chạy với host để access từ các thiết bị khác:**
```bash
ng serve --host 0.0.0.0
```

### 3. ML Service Setup

```bash
cd ml-service

# Tạo Python virtual environment
python -m venv venv

# Kích hoạt virtual environment
# Windows (Command Prompt):
venv\Scripts\activate.bat
# Windows (PowerShell):
venv\Scripts\Activate.ps1
# Linux/Mac:
source venv/bin/activate

# Cài đặt dependencies
pip install -r requirements.txt

# Nếu gặp lỗi với scikit-learn, thử:
pip install --upgrade pip
pip install -r requirements.txt --no-cache-dir
```

**Khởi động ML Service:**
```bash
# Đảm bảo venv đã được activate (có (venv) ở đầu dòng)
python main.py
# ✓ ML Service running on http://localhost:8000
# ✓ API Docs: http://localhost:8000/docs
```

---

## ✅ Verification (Kiểm tra hệ thống)

### 1. Kiểm tra Backend

**Test API:**
```bash
# Health check
curl http://localhost:3000/api/v1/health

# Get products
curl http://localhost:3000/api/v1/products
```

**Kết quả mong đợi:**
```json
{
  "success": true,
  "data": [...],
  "count": 249
}
```

### 2. Kiểm tra Frontend

**Mở browser:**
```
http://localhost:4200
```

**Kiểm tra:**
- ✅ Homepage hiển thị đúng
- ✅ 3D Bonsai hero section load thành công
- ✅ Product catalog hiển thị products
- ✅ Navigation menu hoạt động

### 3. Kiểm tra ML Service

**Mở API docs:**
```
http://localhost:8000/docs
```

**Test train endpoint:**
```bash
curl -X POST http://localhost:8000/health
```

**Kết quả:**
```json
{
  "status": "healthy",
  "service": "E-Commerce ML Service",
  "version": "1.0.0"
}
```

### 4. Kiểm tra MongoDB

**Kết nối mongosh:**
```bash
mongosh
```

**Check database:**
```javascript
use ponsai_ecommerce
show collections
db.products.countDocuments()  // Should be 249
db.users.countDocuments()     // Should be 11
```

---

## 🔐 Login Credentials

### Admin Account
- **Email:** `admin@ponsai.vn`
- **Password:** `Admin123!@#`
- **Access:** http://localhost:4200/admin

### Test User Account
- **Email:** `user@example.com`
- **Password:** `User123!@#`
- **Access:** http://localhost:4200

### Tạo user mới
**Cách 1: Qua UI**
- Vào http://localhost:4200/auth/register

**Cách 2: Qua API**
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Your Name",
    "email": "your.email@example.com",
    "password": "YourPassword123"
  }'
```

---

## 📊 Generate Test Data (Tạo dữ liệu test)

### Dữ liệu có sẵn sau khi seed

Sau khi chạy `npm run seed:bonsai` và `npm run seed:admin`:
- ✅ **249 products** (Bonsai trees với nhiều variants)
- ✅ **5 categories**
- ✅ **1 admin user** (admin@ponsai.vn)
- ✅ **10 test users** (user1-10@example.com)

### Tạo dữ liệu 6 tháng cho Analytics & ML

**Script tạo:**
```bash
cd backend
npm run build  # Build TypeScript nếu chưa
node scripts/generate-realistic-data.js
```

**Dữ liệu được tạo:**
- ✅ **23,454 sessions** (realistic visitor patterns)
- ✅ **140,694 page visits** (distributed across site)
- ✅ **2,330 orders** (£692K total revenue)
- ✅ **185 daily metrics** (auto-aggregated)

**Đặc điểm dữ liệu:**
- Thời gian: 6 tháng gần nhất (184 days)
- Pattern: Weekend boost (1.5x), growth trend (+30%)
- Conversion: 8.63% (realistic)
- AOV: £343.35
- Payment methods: Even distribution (MoMo, Manual, Bank, COD)

**Verify data quality:**
```bash
# Kiểm tra data
node scripts/verify-data.js

# Xem sample data
node scripts/sample-queries.js
```

**Xóa và tạo lại:**
```bash
# Script tự động xóa data cũ trước khi tạo mới
node scripts/generate-realistic-data.js
```

---

## 🎯 Feature Testing Checklist

### User Features (Frontend)

**Homepage:**
- [ ] 3D Bonsai hero section displays correctly
- [ ] Product carousel works
- [ ] Navigation menu functional

**Product Catalog:**
- [ ] Products load and display
- [ ] Category filtering works
- [ ] Product details page loads
- [ ] Add to cart works

**Shopping Cart:**
- [ ] Items added to cart
- [ ] Quantity update works
- [ ] Remove item works
- [ ] Cart total calculates correctly

**Checkout:**
- [ ] Shipping form validation
- [ ] Promotion code applies
- [ ] Payment method selection works

**Authentication:**
- [ ] Register new account
- [ ] Login works
- [ ] Logout works
- [ ] Protected routes redirect to login

### Admin Features (Admin Panel)

**Login:**
```
http://localhost:4200/admin
Email: admin@ponsai.vn
Password: Admin123!@#
```

**Dashboard:**
- [ ] Stats cards display (orders, revenue, products, users)
- [ ] Recent activity feed

**Products:**
- [ ] Product list loads
- [ ] Create product works
- [ ] Edit product works
- [ ] Delete product works
- [ ] Image upload works

**Orders:**
- [ ] Order list loads
- [ ] Filter by status works
- [ ] Order details view
- [ ] Update order status works
- [ ] Manual payment confirmation works

**Promotions:**
- [ ] Create promotion code
- [ ] Activate/deactivate works
- [ ] Promotion applied at checkout

**Analytics:**
- [ ] Revenue metrics load
- [ ] Charts display (if implemented)
- [ ] Date range filter works
- [ ] Export to CSV works

**ML Analytics:**
- [ ] Train new model works
- [ ] Model list displays
- [ ] Make prediction works
- [ ] Prediction history shows

---

## 🐛 Common Issues & Solutions

### 1. MongoDB Connection Failed

**Error:**
```
MongooseServerSelectionError: connect ECONNREFUSED 127.0.0.1:27017
```

**Solution:**
```bash
# Kiểm tra MongoDB đang chạy
mongosh

# Nếu không chạy:
# Windows:
mongod

# Linux/Mac:
sudo systemctl start mongod
```

### 2. Port Already in Use

**Error:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**
```bash
# Windows - Kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### 3. Python Virtual Environment Issues

**Error:**
```
'venv' is not recognized as an internal or external command
```

**Solution:**
```bash
# Đảm bảo Python đã được thêm vào PATH
python --version

# Nếu không có, reinstall Python và check "Add to PATH"

# Hoặc dùng py launcher (Windows):
py -m venv venv
```

### 4. ML Service Dependencies Failed

**Error:**
```
ERROR: Could not find a version that satisfies the requirement scikit-learn==1.5.2
```

**Solution:**
```bash
# Update pip trước
pip install --upgrade pip

# Cài từng package
pip install fastapi uvicorn pydantic
pip install scikit-learn pandas numpy joblib

# Hoặc dùng --no-cache-dir
pip install -r requirements.txt --no-cache-dir
```

### 5. TypeScript Build Errors

**Error:**
```
node_modules/@types/... errors
```

**Solution:**
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
npm run build
```

### 6. Frontend Compilation Errors

**Error:**
```
Cannot find module '@angular/...'
```

**Solution:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
ng serve
```

### 7. JWT Secret Errors

**Error:**
```
JWT_SECRET is not defined
```

**Solution:**
- Kiểm tra file `.env` tồn tại trong `backend/`
- Đảm bảo có dòng `JWT_SECRET=...` (min 32 characters)
- Restart backend server

---

## 📂 Project Structure Quick Reference

```
advanced_webdev/
├── backend/              # Node.js API
│   ├── dist/            # Compiled JS (after build)
│   ├── src/             # TypeScript source
│   ├── scripts/         # Data generation scripts
│   ├── .env             # ⚠️ CREATE THIS FILE
│   └── package.json
│
├── frontend/            # Angular app
│   ├── src/app/         # Application code
│   ├── src/assets/      # Images, fonts
│   └── package.json
│
├── ml-service/          # Python ML API
│   ├── venv/            # Virtual environment (created)
│   ├── models/          # Saved ML models
│   ├── main.py          # FastAPI app
│   └── requirements.txt
│
├── shared/              # Shared TypeScript types
│   └── src/
│
└── docs/                # Documentation
```

---

## 🎓 Next Steps

### 1. Explore Admin Panel
```
http://localhost:4200/admin
```

- Tạo products mới
- Quản lý orders
- Xem analytics dashboard
- Train ML models

### 2. Test Payment Flow

**MoMo Payment (cần credentials):**
- Tạo order với MoMo payment method
- Redirect đến MoMo test page
- Complete payment
- Order status auto-update

**Manual Payment:**
- Tạo order với Manual payment
- Admin confirm payment trong Admin panel

### 3. Generate More Test Data

```bash
cd backend
node scripts/generate-realistic-data.js
```

### 4. Train ML Models

**Via Admin UI:**
```
http://localhost:4200/admin/ml-analytics
```

- Train revenue prediction model
- Train order count model
- Make predictions
- View model performance

**Via API:**
```bash
# Train model
curl -X POST http://localhost:8000/train \
  -H "Content-Type: application/json" \
  -d @train_request.json

# Make prediction
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "model_file": "revenue_model_abc123.joblib",
    "input_features": {"visits": 1000, "orders": 50}
  }'
```

### 5. Explore Analytics

**Order Analytics:**
```
http://localhost:4200/admin/analytics
```

- Revenue trends
- Customer retention
- Product performance
- Payment method health

**Event Analytics:**
- Conversion funnel
- Cart abandonment
- Payment failure insights

---

## 📚 Documentation

Đọc thêm tài liệu chi tiết:

- [PROJECT_UPDATES_SUMMARY.md](PROJECT_UPDATES_SUMMARY.md) - Tổng quan features
- [SETUP.md](SETUP.md) - Setup chi tiết
- [docs/ANALYTICS_SYSTEM.md](docs/ANALYTICS_SYSTEM.md) - Analytics architecture
- [docs/MOMO_INTEGRATION.md](docs/MOMO_INTEGRATION.md) - MoMo payment guide
- [ml-service/README.md](ml-service/README.md) - ML service docs
- [backend/scripts/DATA_GENERATION_GUIDE.md](backend/scripts/DATA_GENERATION_GUIDE.md) - Data generation

---

## 💡 Tips & Best Practices

### Development Workflow

1. **Always pull latest code:**
   ```bash
   git pull origin nhat
   ```

2. **Rebuild after pulling:**
   ```bash
   cd backend && npm run build
   cd frontend && npm install
   ```

3. **Check logs for errors:**
   - Backend console
   - Frontend console (browser DevTools)
   - ML service console

4. **Use Git branches:**
   ```bash
   git checkout -b feature/your-feature
   # Make changes
   git add .
   git commit -m "feat: your feature description"
   git push origin feature/your-feature
   ```

### Database Management

**Backup database:**
```bash
mongodump --db ponsai_ecommerce --out backup/
```

**Restore database:**
```bash
mongorestore --db ponsai_ecommerce backup/ponsai_ecommerce/
```

**Drop database (careful!):**
```bash
mongosh
use ponsai_ecommerce
db.dropDatabase()
```

### Testing

**Backend API testing:**
- Use Postman or Thunder Client (VS Code extension)
- Import API endpoints from docs
- Test with different user roles

**Frontend testing:**
- Open browser DevTools (F12)
- Check Console for errors
- Check Network tab for API calls
- Use Redux DevTools (if applicable)

---

## 🤝 Need Help?

### Resources

- **GitHub Issues:** https://github.com/mnhatdo/advanced_webdev/issues
- **Email:** contact@ponsai.vn
- **Documentation:** See `docs/` folder

### Before Asking for Help

**Checklist:**
1. ✅ Đã đọc error message trong console
2. ✅ Đã check Prerequisites (Node, Python, MongoDB)
3. ✅ Đã thử restart services
4. ✅ Đã check `.env` file tồn tại và đúng
5. ✅ Đã search error trên Google/Stack Overflow

**Include in your question:**
- Operating System (Windows/Mac/Linux)
- Node version, Python version
- Error message (full stack trace)
- Steps to reproduce
- What you've tried

---

**Happy Coding! 🚀**

---

**Author:** Nhat Do  
**Last Updated:** January 24, 2026  
**Version:** 1.0.0
