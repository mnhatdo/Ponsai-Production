# Ponsai E-Commerce Platform - Project Updates & Feature Summary

**Prepared by:** Nhat Do (GitHub: @mnhatdo)  
**Last Updated:** January 24, 2026  
**Repository:** advanced_webdev  
**Branch:** nhat  
**Created by:** Sang
---

## 📌 Executive Summary

This document provides a comprehensive overview of all major features, enhancements, and improvements implemented in the **Ponsai E-Commerce Platform** - a full-stack modern web application built with **Angular 19**, **Node.js/Express**, **TypeScript**, **MongoDB**, and integrated **Python ML Service** for predictive analytics.

The platform is designed as an **academic project** demonstrating enterprise-level e-commerce architecture with advanced features including multiple payment gateways, real-time analytics, machine learning predictions, and comprehensive admin management.

---

## 🏗️ System Architecture

### Technology Stack

#### Frontend
- **Framework:** Angular 19 (Standalone Components)
- **Language:** TypeScript 5.6
- **Styling:** SCSS with custom design system
- **State Management:** Signals API (Angular 19 native)
- **HTTP Client:** HttpClient with RxJS observables
- **3D Graphics:** Three.js for Bonsai Hero Section

#### Backend
- **Runtime:** Node.js 20+
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT (Access + Refresh Token)
- **Session Management:** Express sessions with MongoDB store

#### ML Service
- **Language:** Python 3.13
- **Framework:** FastAPI
- **ML Library:** scikit-learn 1.5.2
- **Data Processing:** pandas, numpy
- **Model Persistence:** joblib

#### Infrastructure
- **Development:** Local development with hot reload
- **API Documentation:** Swagger/OpenAPI (FastAPI auto-docs)
- **Version Control:** Git with feature branches

---

## ✨ Core Features Implemented

### 1. **Authentication & Authorization**

#### User Authentication
- **JWT-based authentication** with access and refresh tokens
- **Secure password hashing** using bcrypt
- **Role-based access control** (User, Admin)
- **Session tracking** with MongoDB session store
- **Auto-logout** on token expiration
- **Refresh token rotation** for enhanced security

#### Admin Authorization
- Protected admin routes with `protect` and `authorize` middleware
- Audit logging for all admin actions
- Admin-specific UI with role verification

**Files:**
- [backend/src/middleware/auth.ts](backend/src/middleware/auth.ts)
- [backend/src/controllers/authController.ts](backend/src/controllers/authController.ts)
- [frontend/src/app/core/guards/auth.guard.ts](frontend/src/app/core/guards/auth.guard.ts)

---

### 2. **Multi-Payment Gateway Integration**

Implemented **4 payment methods** with complete lifecycle management:

#### 2.1 MoMo E-Wallet Integration
- **Production-ready MoMo API integration**
- QR code payment flow
- Webhook (IPN) for real-time payment confirmation
- Automatic order status update on successful payment
- Currency conversion (GBP → VND)
- **HMAC SHA256 signature verification** for security

**Key Features:**
- Order creation with MoMo payment method
- Redirect to MoMo payment page
- Server-to-server IPN callback handling
- User redirect callback handling
- Payment status tracking

**Files:**
- [backend/src/services/momoService.ts](backend/src/services/momoService.ts)
- [backend/src/controllers/paymentController.ts](backend/src/controllers/paymentController.ts)
- [docs/MOMO_INTEGRATION.md](docs/MOMO_INTEGRATION.md)

#### 2.2 Manual Payment (Cash/Bank Transfer)
- Admin manual payment confirmation
- Payment proof upload capability
- Status tracking: pending → confirming → paid
- Audit trail for all payment actions

**Files:**
- [backend/src/services/manualPaymentService.ts](backend/src/services/manualPaymentService.ts)

#### 2.3 Card Payment (Simulated)
- Card details capture (for academic purposes)
- Validation and secure processing
- Success/failure flow simulation

**Files:**
- [backend/src/services/cardPaymentService.ts](backend/src/services/cardPaymentService.ts)

#### 2.4 Bank Transfer
- Bank account details display
- Transfer reference generation
- Invoice generation for confirmation
- Admin verification workflow

**Files:**
- [backend/src/services/bankTransferService.ts](backend/src/services/bankTransferService.ts)

#### Payment Lifecycle Management
- **Centralized payment state machine** managing all payment workflows
- **Status transitions:** created → pending → paid/failed/cancelled
- **Payment method agnostic** architecture
- **Idempotent IPN handling** to prevent duplicate processing

**Files:**
- [backend/src/services/paymentLifecycleManager.ts](backend/src/services/paymentLifecycleManager.ts)

---

### 3. **E-Commerce Core Features**

#### 3.1 Product Catalog Management
- **Full CRUD operations** for products (Admin)
- **Image upload** support (base64 encoding)
- **Multi-variant system:** Size, color, material variations
- **Category management** with hierarchical structure
- **Stock tracking** and inventory management
- **Price management** with currency conversion support
- **Product search and filtering** by category, price range, inStock status

**Admin Features:**
- Create/Edit/Delete products
- Bulk stock updates
- Low stock alerts
- Product performance analytics

**Files:**
- [backend/src/models/Product.ts](backend/src/models/Product.ts)
- [backend/src/controllers/adminController.ts](backend/src/controllers/adminController.ts)
- [frontend/src/app/features/admin/components/products/](frontend/src/app/features/admin/components/products/)

#### 3.2 Shopping Cart System
- **Persistent cart** stored in MongoDB (linked to user)
- **Guest cart support** with localStorage
- **Real-time price calculation** with promotion codes
- **Stock validation** before checkout
- **Cart merging** on user login
- **Cart abandonment tracking** (for analytics)

**Features:**
- Add to cart with variant selection
- Update quantities
- Remove items
- Apply promotion codes
- View total with discounts

**Files:**
- [backend/src/models/Cart.ts](backend/src/models/Cart.ts)
- [backend/src/controllers/cartController.ts](backend/src/controllers/cartController.ts)

#### 3.3 Order Management
- **Complete order lifecycle:** Created → Processing → Shipped → Delivered
- **Order cancellation** with refund flow
- **Order tracking** with status updates
- **Email notifications** (webhook ready)
- **Order history** for users
- **Admin order dashboard** with filtering and bulk actions

**Order Features:**
- Create order from cart
- Payment method selection
- Shipping address validation
- Order status updates (Admin)
- Order cancellation (User/Admin)
- Refund processing

**Files:**
- [backend/src/models/Order.ts](backend/src/models/Order.ts)
- [backend/src/controllers/orderController.ts](backend/src/controllers/orderController.ts)

---

### 4. **Promotion Code System**

**Complete promotion management** with flexible discount types:

#### Promotion Types
1. **Percentage Discount:** X% off total order
2. **Fixed Amount Discount:** £X off total order
3. **Free Shipping:** Waive shipping costs

#### Promotion Features
- **Unique promotion codes** (uppercase, validated)
- **Usage limits:** Total uses and per-user limits
- **Date range validation:** Start and end dates
- **Minimum order amount** requirement
- **Automatic code application** at checkout
- **Real-time validation** with error messages
- **Multi-currency support** with automatic conversion

#### Admin Management
- Create/Edit/Delete promotions
- Activate/Deactivate promotions
- View promotion usage statistics
- Filter by status, type, date range

#### Frontend Integration
- Promotion code input at checkout
- Real-time validation with visual feedback
- Applied discount display
- Multi-currency formatting (GBP, USD, VND)

**Files:**
- [backend/src/models/Promotion.ts](backend/src/models/Promotion.ts)
- [backend/src/controllers/promotionController.ts](backend/src/controllers/promotionController.ts)
- [frontend/src/app/features/admin/components/promotions/](frontend/src/app/features/admin/components/promotions/)

---

### 5. **Analytics Dashboard (Admin)**

**Comprehensive business intelligence** system with two analytics engines:

#### 5.1 Order Analytics (Wave 1 - Trustworthy Data)
Based on **existing orders, users, and products** only.

**Revenue Analytics:**
- Total revenue by date range
- Revenue by payment method
- Monthly revenue trends
- Average order value (AOV)

**Customer Analytics:**
- Customer retention rate (repeat purchase %)
- New vs returning customers
- Customer lifetime value

**Product Analytics:**
- Top products by revenue
- Products with zero sales
- Sales velocity

**Payment Analytics:**
- Payment method success rates
- Payment timing analysis (time to payment)
- Failed payment insights

**Operational Metrics:**
- Orders pending fulfillment
- Average processing time
- Cancellation rate

**Files:**
- [backend/src/services/analyticsService.ts](backend/src/services/analyticsService.ts)
- [backend/src/controllers/analyticsController.ts](backend/src/controllers/analyticsController.ts)

#### 5.2 Event Analytics (Wave 2 - User Behavior Insights)
Based on **event tracking system** capturing user interactions.

**Conversion Funnel:**
- Page views → Add to cart → Checkout → Payment → Success
- Drop-off rates at each step
- Conversion rate calculation

**Cart Abandonment:**
- Users who added to cart but didn't checkout
- Abandonment rate
- Recovery opportunities

**Product Performance:**
- Product views vs purchases
- Engagement metrics
- Popular products by views

**Payment Failure Analysis:**
- Failed payment attempts by method
- Common failure reasons
- User impact analysis

**Files:**
- [backend/src/services/eventAnalyticsService.ts](backend/src/services/eventAnalyticsService.ts)
- [backend/src/controllers/eventAnalyticsController.ts](backend/src/controllers/eventAnalyticsController.ts)
- [backend/src/models/Event.ts](backend/src/models/Event.ts)

#### 5.3 Analytics Dashboard UI
**Modern, responsive admin dashboard** with:
- **Real-time data visualization**
- **Date range filters**
- **Export to CSV**
- **Interactive charts** (ready for chart library integration)
- **Metric explanations** with business context
- **Data quality caveats** (transparency)

**Files:**
- [frontend/src/app/features/admin/components/analytics/analytics-dashboard.component.ts](frontend/src/app/features/admin/components/analytics/analytics-dashboard.component.ts)
- [frontend/src/app/features/admin/services/analytics.service.ts](frontend/src/app/features/admin/services/analytics.service.ts)

---

### 6. **Machine Learning Predictive Analytics**

**Full-stack ML system** for business forecasting:

#### 6.1 ML Service (Python FastAPI)
Standalone **Python microservice** for ML operations.

**ML Models Supported:**
1. **Revenue Prediction:** Predict future revenue from visits and orders
2. **Order Count Prediction:** Predict number of orders from website traffic
3. **Time Series Forecasting:** Excel/Power BI style forecasting

**ML Workflow:**
1. **Data Collection:** Daily metrics from MongoDB
2. **Model Training:** Linear Regression with train/test split
3. **Model Evaluation:** R², RMSE, MAE metrics
4. **Model Persistence:** Save to .joblib files
5. **Prediction:** Real-time predictions using trained models

**Key Features:**
- **RESTful API** with FastAPI
- **Auto-generated API docs** (Swagger UI)
- **Model versioning** with unique IDs
- **Performance metrics tracking**
- **Model management** (list, activate, deactivate, delete)

**Algorithms:**
- **Linear Regression:** Excel-style predictions
- **Moving Average:** Simple forecasting
- **Exponential Smoothing:** Power BI-style trend analysis

**Files:**
- [ml-service/main.py](ml-service/main.py)
- [ml-service/forecast_service.py](ml-service/forecast_service.py)
- [ml-service/requirements.txt](ml-service/requirements.txt)
- [ml-service/README.md](ml-service/README.md)

#### 6.2 Backend ML Integration
**Node.js backend acts as ML orchestrator:**

**Features:**
- **ML API client** to communicate with Python service
- **Model metadata storage** in MongoDB
- **Training data preparation** from DailyMetric collection
- **Prediction history tracking**
- **Model lifecycle management**

**Endpoints:**
- `POST /api/v1/admin/ml/train` - Train new model
- `POST /api/v1/admin/ml/predict` - Make prediction
- `GET /api/v1/admin/ml/models` - List models
- `POST /api/v1/admin/ml/forecast` - Generate time series forecast

**Files:**
- [backend/src/services/mlService.ts](backend/src/services/mlService.ts)
- [backend/src/controllers/mlController.ts](backend/src/controllers/mlController.ts)
- [backend/src/models/TrainedModel.ts](backend/src/models/TrainedModel.ts)
- [backend/src/models/Prediction.ts](backend/src/models/Prediction.ts)

#### 6.3 ML Analytics UI
**Professional ML dashboard** for non-technical admins:

**Features:**
- **Train Model Tab:**
  - Select prediction type (revenue/orders)
  - Choose training window (3/6/12 months)
  - Name model with version
  - View training tips and best practices
  - See performance metrics (R², RMSE, MAE)

- **Make Prediction Tab:**
  - Select trained model
  - Input features (visits, orders)
  - View predicted value
  - Save to prediction history

- **Manage Models Tab:**
  - View all trained models
  - Filter by type and status
  - Compare multiple models
  - Activate/Deactivate models
  - Rename and delete models
  - Export models to CSV

- **Prediction History Tab:**
  - View all past predictions
  - Export history to CSV
  - Clear history

**Dashboard Stats:**
- Total models trained
- Active models count
- Total predictions made
- Best R² score achieved

**Files:**
- [frontend/src/app/features/admin/components/analytics/analytics-ml.component.ts](frontend/src/app/features/admin/components/analytics/analytics-ml.component.ts)
- [frontend/src/app/features/admin/components/analytics/analytics-forecast.component.ts](frontend/src/app/features/admin/components/analytics/analytics-forecast.component.ts)
- [frontend/src/app/features/admin/services/ml.service.ts](frontend/src/app/features/admin/services/ml.service.ts)

---

### 7. **Session & Visit Tracking**

**Comprehensive user behavior tracking system:**

#### Session Tracking
- **Automatic session creation** on website visit
- **Session expiry:** 30 minutes of inactivity
- **IP address and User-Agent tracking**
- **Page view counter** per session
- **User association** for logged-in users
- **Anonymous tracking** for guests

**Files:**
- [backend/src/models/Session.ts](backend/src/models/Session.ts)
- [backend/src/middleware/sessionTracker.ts](backend/src/middleware/sessionTracker.ts)

#### Page Visit Tracking
- **Individual page view logging**
- **Path and URL tracking**
- **Time on page measurement**
- **Referrer tracking**
- **Session association**

**Files:**
- [backend/src/models/PageVisit.ts](backend/src/models/PageVisit.ts)

#### Daily Metrics Aggregation
- **Automated aggregation service**
- **Daily business metrics:**
  - Total sessions
  - Unique visitors
  - Total page views
  - Average session duration
  - Total orders
  - Completed orders
  - Total revenue
  - Average order value
  - Conversion rate

**Files:**
- [backend/src/models/DailyMetric.ts](backend/src/models/DailyMetric.ts)
- [backend/src/services/dailyMetricsService.ts](backend/src/services/dailyMetricsService.ts)

---

### 8. **Admin Dashboard & Management**

**Comprehensive admin panel** with full CRUD operations:

#### 8.1 Dashboard Overview
- **Real-time stats:** Orders, revenue, products, users
- **Recent activity feed**
- **Quick actions**
- **System health indicators**

#### 8.2 Product Management
- Product catalog with search and filters
- Create/Edit/Delete products
- Image upload
- Variant management
- Stock control
- Category assignment

#### 8.3 Order Management
- Order list with status filters
- Order details view
- Status updates (Processing → Shipped → Delivered)
- Payment confirmation (for manual payments)
- Order cancellation with refunds
- Bulk actions

#### 8.4 User Management
- User list with role filters
- User details with order history
- Role assignment (User ↔ Admin)
- Account activation/deactivation
- User search

#### 8.5 Promotion Management
- Create/Edit/Delete promotion codes
- Activate/Deactivate promotions
- Usage tracking
- Date range management
- Discount type selection

#### 8.6 Inventory Management
- Low stock alerts
- Bulk stock updates
- Stock movement tracking
- Reorder suggestions

#### 8.7 Audit Logs
- **Complete action logging** for accountability
- **Tracked actions:**
  - Product CRUD
  - Order updates
  - Payment confirmations
  - User role changes
  - Promotion changes
  - Settings updates
- **Log details:** User, timestamp, action, entity, changes
- **Search and filter** by date, user, action

**Files:**
- [backend/src/models/AuditLog.ts](backend/src/models/AuditLog.ts)
- [frontend/src/app/features/admin/components/audit-logs/](frontend/src/app/features/admin/components/audit-logs/)

#### 8.8 Settings Management
- **Currency selection** (GBP, USD, VND)
- **Exchange rate management**
- **Real-time currency conversion** across admin panel
- **System-wide configuration**

**Files:**
- [backend/src/models/Settings.ts](backend/src/models/Settings.ts)
- [frontend/src/app/features/admin/components/settings/](frontend/src/app/features/admin/components/settings/)

---

### 9. **Multi-Currency Support**

**Complete currency system** with real-time conversion:

#### Currency Pipes
1. **AdminCurrencyPipe:** Converts from GBP (base) to selected currency
   - Used for product prices (stored in GBP)
   - Automatic conversion to GBP/USD/VND
   - Format with appropriate symbols

2. **FormatCurrencyPipe:** Formats without conversion
   - Used for values already in selected currency
   - Consistent formatting across UI

**Features:**
- **Base currency:** All prices stored in GBP (database)
- **Display currency:** Selectable by admin (GBP/USD/VND)
- **Real-time conversion** using exchange rates
- **Automatic formatting:** £, $, ₫ symbols
- **Decimal handling:** 2 decimals for GBP/USD, 0 for VND

**Files:**
- [frontend/src/app/features/admin/pipes/admin-currency.pipe.ts](frontend/src/app/features/admin/pipes/admin-currency.pipe.ts)
- [frontend/src/app/features/admin/pipes/format-currency.pipe.ts](frontend/src/app/features/admin/pipes/format-currency.pipe.ts)
- [backend/src/services/exchangeRateService.ts](backend/src/services/exchangeRateService.ts)

---

### 10. **Data Generation & Testing**

**Realistic test data generators** for development and demo:

#### Realistic Data Generation Script
**Generates 6 months of historical data** for analytics and ML training:

**Generated Data:**
- **23,454 sessions** with realistic patterns
  - Weekend boost (1.5x traffic)
  - Growth trend (+30% over 6 months)
  - Realistic IP addresses
  - Real user agents (Chrome, Safari, Firefox, Mobile)
- **140,694 page visits** distributed across site
  - Home, Products, Checkout, Cart, Product details
  - Realistic time on page
- **2,330 orders** (£692K total revenue)
  - Realistic order values (£343 AOV)
  - Multiple payment methods
  - Valid status workflows
  - 8.63% conversion rate
- **185 daily metrics** (auto-aggregated)

**Data Quality Guarantees:**
- ✅ No users created (uses 10 existing users)
- ✅ Uses existing products and categories
- ✅ NO 'created' status in orders (validated)
- ✅ Cancelled orders have cancelled payment (100% consistency)
- ✅ Exactly 6 months date range
- ✅ Database validation before generation
- ✅ Realistic and internally consistent

**Usage:**
```bash
cd backend
npm run build
node scripts/generate-realistic-data.js
```

**Verification:**
```bash
node scripts/verify-data.js
node scripts/sample-queries.js
```

**Files:**
- [backend/scripts/generate-realistic-data.js](backend/scripts/generate-realistic-data.js)
- [backend/scripts/verify-data.js](backend/scripts/verify-data.js)
- [backend/scripts/sample-queries.js](backend/scripts/sample-queries.js)
- [backend/scripts/DATA_GENERATION_GUIDE.md](backend/scripts/DATA_GENERATION_GUIDE.md)
- [backend/scripts/GENERATION_REPORT.md](backend/scripts/GENERATION_REPORT.md)

---

### 11. **3D Bonsai Hero Section**

**Interactive 3D bonsai tree** on homepage using Three.js:

**Features:**
- **3D model rendering** with realistic materials
- **Auto-rotation animation**
- **Responsive design** (mobile-friendly)
- **Smooth camera animations**
- **Lighting effects** (ambient + directional)
- **Performance optimized** with requestAnimationFrame

**Files:**
- [frontend/src/app/shared/components/bonsai-3d-hero/](frontend/src/app/shared/components/bonsai-3d-hero/)
- [BONSAI_3D_HERO_GUIDE.md](BONSAI_3D_HERO_GUIDE.md)

---

### 12. **Error Handling & Validation**

#### Backend Error Handling
- **Centralized error middleware**
- **Custom AppError class** for controlled errors
- **Validation middleware** using express-validator
- **Async error wrapper** to avoid try-catch repetition
- **Environment-aware error responses** (dev vs prod)

**Files:**
- [backend/src/middleware/errorHandler.ts](backend/src/middleware/errorHandler.ts)

#### Frontend Error Handling
- **HTTP interceptors** for global error handling
- **User-friendly error messages**
- **Automatic token refresh** on 401
- **Loading states** and error states
- **Form validation** with real-time feedback

---

### 13. **Maintenance Mode**

**Production-ready maintenance page:**

**Features:**
- Elegant design matching brand identity
- Clear communication in Vietnamese and English
- Contact information display
- Reload functionality
- Floating animation effects

**Files:**
- [frontend/src/app/shared/components/maintenance.component.ts](frontend/src/app/shared/components/maintenance.component.ts)

---

## 🗂️ Project Structure

```
advanced_webdev/
├── backend/                    # Node.js/Express backend
│   ├── src/
│   │   ├── controllers/       # Request handlers
│   │   ├── models/            # Mongoose schemas
│   │   ├── routes/            # API routes
│   │   ├── services/          # Business logic
│   │   ├── middleware/        # Auth, error handling, session tracking
│   │   ├── utils/             # Helper functions
│   │   └── server.ts          # Application entry point
│   ├── scripts/               # Data generation, testing
│   ├── data/seeds/            # Database seed files
│   └── package.json
│
├── frontend/                   # Angular 19 frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/          # Singletons, guards, interceptors
│   │   │   ├── features/      # Feature modules
│   │   │   │   ├── admin/     # Admin dashboard
│   │   │   │   ├── auth/      # Authentication
│   │   │   │   ├── checkout/  # Checkout flow
│   │   │   │   ├── payment/   # Payment callbacks
│   │   │   │   └── shop/      # Shopping catalog
│   │   │   └── shared/        # Reusable components, pipes
│   │   ├── assets/            # Images, fonts
│   │   └── styles.scss        # Global styles
│   └── package.json
│
├── ml-service/                 # Python FastAPI ML service
│   ├── main.py                # FastAPI application
│   ├── forecast_service.py    # Time series forecasting
│   ├── models/                # Saved .joblib models
│   ├── requirements.txt       # Python dependencies
│   └── README.md
│
├── shared/                     # Shared TypeScript types
│   └── src/
│       ├── types.ts           # Common interfaces
│       └── constants.ts       # Shared constants
│
├── docs/                       # Documentation
│   ├── ANALYTICS_SYSTEM.md
│   ├── MOMO_INTEGRATION.md
│   ├── PAYMENT_SYSTEM.md
│   └── ...
│
├── setup.js                    # Quick setup script
├── setup-ml-system.bat         # Windows ML setup
├── setup-ml-system.ps1         # PowerShell ML setup
├── SETUP.md                    # Setup instructions
└── README.md                   # Main documentation
```

---

## 🚀 Quick Start Guide

### Prerequisites

- **Node.js:** v20.0.0 or higher
- **Python:** v3.13 or higher
- **MongoDB:** v6.0 or higher (running locally or MongoDB Atlas)
- **npm:** v10.0.0 or higher
- **Git:** For version control

### Initial Setup

#### Option 1: Automated Setup (Windows)

**PowerShell (Recommended):**
```powershell
.\setup-ml-system.ps1
```

**Command Prompt:**
```batch
setup-ml-system.bat
```

#### Option 2: Manual Setup

**1. Clone Repository:**
```bash
git clone https://github.com/mnhatdo/advanced_webdev.git
cd advanced_webdev
```

**2. Backend Setup:**
```bash
cd backend
npm install
npm install cookie-parser @types/cookie-parser
npm run build
```

**3. Frontend Setup:**
```bash
cd ../frontend
npm install
```

**4. ML Service Setup:**
```bash
cd ../ml-service
python -m venv venv

# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

pip install -r requirements.txt
```

**5. Database Setup:**
```bash
cd ../backend

# Seed bonsai products and categories
npm run seed:bonsai

# Create admin user
npm run seed:admin

# Generate 6 months test data
node scripts/generate-realistic-data.js
```

### Environment Configuration

**Backend (.env):**
```env
NODE_ENV=development
PORT=3000

# MongoDB
MONGO_URI=mongodb://localhost:27017/ponsai_ecommerce

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRE=7d
REFRESH_TOKEN_SECRET=your-refresh-token-secret
REFRESH_TOKEN_EXPIRE=30d

# Session
SESSION_SECRET=your-session-secret-key

# MoMo Payment (Test credentials)
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

**Frontend (environment.ts):**
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api/v1'
};
```

### Running the Application

**Start all services in separate terminals:**

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Runs on http://localhost:3000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
ng serve
# Runs on http://localhost:4200
```

**Terminal 3 - ML Service:**
```bash
cd ml-service
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac
python main.py
# Runs on http://localhost:8000
```

**Terminal 4 - MongoDB (if not running as service):**
```bash
mongod
# Runs on mongodb://localhost:27017
```

### Access Points

- **Frontend:** http://localhost:4200
- **Backend API:** http://localhost:3000/api/v1
- **ML API Docs:** http://localhost:8000/docs
- **Admin Panel:** http://localhost:4200/admin

### Default Credentials

**Admin Account:**
- **Email:** `admin@ponsai.vn`
- **Password:** `Admin123!@#`

**Test User:**
- **Email:** `user@example.com`
- **Password:** `User123!@#`

---

## 📊 Database Schema Overview

### Core Collections

1. **Users:** User accounts with authentication
2. **Products:** Product catalog with variants
3. **Categories:** Product categorization
4. **Orders:** Customer orders with items
5. **Carts:** Shopping carts (user-specific)
6. **Promotions:** Discount codes
7. **Settings:** System configuration

### Analytics Collections

8. **Sessions:** User sessions (30-min expiry)
9. **PageVisits:** Individual page views
10. **DailyMetrics:** Aggregated daily business metrics
11. **Events:** User behavior event tracking

### ML Collections

12. **TrainedModels:** ML model metadata
13. **Predictions:** Prediction history

### Admin Collections

14. **AuditLogs:** Action logging for accountability

---

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm run test
```

### Frontend Tests
```bash
cd frontend
ng test
```

### ML Service Tests
```bash
cd ml-service
pytest
```

### Data Verification
```bash
cd backend
node scripts/verify-data.js
node scripts/sample-queries.js
```

---

## 📚 API Documentation

### Backend API Endpoints

#### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/logout` - Logout user
- `POST /api/v1/auth/refresh-token` - Refresh access token
- `GET /api/v1/auth/me` - Get current user

#### Products
- `GET /api/v1/products` - List products (public)
- `GET /api/v1/products/:id` - Get product details
- `GET /api/v1/categories` - List categories

#### Cart
- `GET /api/v1/cart` - Get user cart
- `POST /api/v1/cart` - Add item to cart
- `PATCH /api/v1/cart/:itemId` - Update cart item
- `DELETE /api/v1/cart/:itemId` - Remove cart item
- `DELETE /api/v1/cart` - Clear cart

#### Orders
- `POST /api/v1/orders` - Create order from cart
- `GET /api/v1/orders` - Get user orders
- `GET /api/v1/orders/:id` - Get order details
- `PATCH /api/v1/orders/:id/cancel` - Cancel order

#### Payments
- `GET /api/v1/payment/methods` - Get available payment methods
- `POST /api/v1/payment/momo/initiate` - Initiate MoMo payment
- `POST /api/v1/payment/momo/ipn` - MoMo IPN callback
- `GET /api/v1/payment/momo/callback` - MoMo redirect callback
- `POST /api/v1/payment/manual/initiate` - Initiate manual payment
- `POST /api/v1/payment/bank-transfer/initiate` - Initiate bank transfer
- `GET /api/v1/payment/status/:orderId` - Check payment status

#### Promotions
- `POST /api/v1/promotions/validate` - Validate promotion code

#### Admin - Products
- `GET /api/v1/admin/products` - List all products (admin)
- `POST /api/v1/admin/products` - Create product
- `PUT /api/v1/admin/products/:id` - Update product
- `DELETE /api/v1/admin/products/:id` - Delete product

#### Admin - Orders
- `GET /api/v1/admin/orders` - List all orders
- `GET /api/v1/admin/orders/:id` - Get order details
- `PATCH /api/v1/admin/orders/:id/status` - Update order status
- `POST /api/v1/admin/orders/:id/confirm-payment` - Confirm manual payment

#### Admin - Users
- `GET /api/v1/admin/users` - List users
- `GET /api/v1/admin/users/:id` - Get user details
- `PATCH /api/v1/admin/users/:id/role` - Update user role
- `PATCH /api/v1/admin/users/:id/status` - Toggle user status

#### Admin - Promotions
- `GET /api/v1/admin/promotions` - List promotions
- `POST /api/v1/admin/promotions` - Create promotion
- `PUT /api/v1/admin/promotions/:id` - Update promotion
- `DELETE /api/v1/admin/promotions/:id` - Delete promotion
- `PATCH /api/v1/admin/promotions/:id/status` - Toggle promotion status

#### Admin - Analytics
- `GET /api/v1/admin/analytics/revenue` - Revenue metrics
- `GET /api/v1/admin/analytics/revenue-by-method` - Revenue by payment method
- `GET /api/v1/admin/analytics/revenue-monthly` - Monthly revenue trends
- `GET /api/v1/admin/analytics/retention` - Customer retention
- `GET /api/v1/admin/analytics/new-vs-returning` - New vs returning customers
- `GET /api/v1/admin/analytics/products/top` - Top products by revenue
- `GET /api/v1/admin/analytics/products/zero-sales` - Zero sales products
- `GET /api/v1/admin/analytics/payment-health` - Payment method health
- `GET /api/v1/admin/analytics/payment-timing` - Payment timing analysis
- `GET /api/v1/admin/analytics/operations` - Operational metrics
- `GET /api/v1/admin/analytics/overview` - Comprehensive overview

#### Admin - Event Analytics
- `GET /api/v1/admin/analytics/events/overview` - Event analytics overview
- `GET /api/v1/admin/analytics/events/funnel` - Conversion funnel
- `GET /api/v1/admin/analytics/events/cart-abandonment` - Cart abandonment
- `GET /api/v1/admin/analytics/events/products` - Product performance
- `GET /api/v1/admin/analytics/events/payments` - Payment failure insights

#### Admin - ML
- `POST /api/v1/admin/ml/train` - Train ML model
- `POST /api/v1/admin/ml/predict` - Make prediction
- `GET /api/v1/admin/ml/models` - List models
- `GET /api/v1/admin/ml/models/:id` - Get model details
- `PATCH /api/v1/admin/ml/models/:id/deactivate` - Deactivate model
- `PATCH /api/v1/admin/ml/models/:id/activate` - Activate model
- `PATCH /api/v1/admin/ml/models/:id/rename` - Rename model
- `DELETE /api/v1/admin/ml/models/:id` - Delete model
- `GET /api/v1/admin/ml/predictions` - Get prediction history
- `POST /api/v1/admin/ml/predictions/save` - Save prediction
- `DELETE /api/v1/admin/ml/predictions` - Clear history
- `GET /api/v1/admin/ml/dashboard-stats` - ML dashboard stats
- `POST /api/v1/admin/ml/forecast` - Generate time series forecast

#### Admin - Settings
- `GET /api/v1/admin/settings` - Get settings
- `PATCH /api/v1/admin/settings` - Update settings

#### Admin - Audit Logs
- `GET /api/v1/admin/audit-logs` - Get audit logs

### ML Service API Endpoints

- `GET /health` - Health check
- `POST /train` - Train new ML model
- `POST /predict` - Make prediction
- `GET /models` - List trained models
- `GET /models/{model_file}` - Get model info
- `POST /forecast` - Generate time series forecast

**API Documentation:** http://localhost:8000/docs

---

## 🔐 Security Features

### Authentication & Authorization
- **JWT with refresh tokens** for stateless authentication
- **Bcrypt password hashing** (10 salt rounds)
- **Role-based access control** (User, Admin)
- **Protected routes** with auth middleware
- **Token expiration** and automatic refresh
- **Session management** with MongoDB store

### Payment Security
- **HMAC SHA256 signature verification** for MoMo IPN
- **Idempotent IPN handling** to prevent duplicate processing
- **Secure payment data handling**
- **PCI DSS considerations** (card data never stored)

### API Security
- **CORS configuration** for frontend access
- **Rate limiting** (ready for implementation)
- **Input validation** using express-validator
- **SQL/NoSQL injection prevention** with Mongoose
- **XSS protection** with helmet.js (ready)

### Data Security
- **Environment variable management** (.env files)
- **Sensitive data encryption** in transit (HTTPS ready)
- **Audit logging** for all admin actions
- **Error message sanitization** (no stack traces in production)

---

## 🎨 Design System

### Color Palette

**Primary Colors:**
- **Dark Blue:** `#153243` (headers, buttons, key UI)
- **Lime Green:** `#c3d350` (accents, CTAs)
- **Teal:** `#284b63` (secondary elements)

**Neutral Colors:**
- **Light Gray:** `#f4f4f4` (backgrounds)
- **Dark Gray:** `#333` (text)
- **White:** `#ffffff` (cards, panels)

**Status Colors:**
- **Success:** `#48bb78` (green)
- **Warning:** `#ed8936` (orange)
- **Error:** `#fc8181` (red)
- **Info:** `#4299e1` (blue)

### Typography

- **Font Family:** 'Inter', 'Segoe UI', system-ui, sans-serif
- **Headings:** Bold, dark blue `#153243`
- **Body:** Regular, dark gray `#333`
- **Small Text:** Medium, gray `#666`

### Responsive Breakpoints

```scss
$mobile: 480px;
$tablet: 768px;
$desktop: 1024px;
$large: 1440px;
```

---

## 📦 Deployment Considerations

### Production Checklist

#### Backend
- [ ] Set `NODE_ENV=production`
- [ ] Update JWT secrets (strong, random)
- [ ] Configure MongoDB connection string (MongoDB Atlas)
- [ ] Set up HTTPS with SSL certificates
- [ ] Configure CORS for production domain
- [ ] Enable rate limiting
- [ ] Set up logging (Winston, Bunyan)
- [ ] Configure error monitoring (Sentry, Datadog)
- [ ] Set up backup strategy for MongoDB
- [ ] Configure MoMo production credentials

#### Frontend
- [ ] Build for production: `ng build --configuration production`
- [ ] Update `environment.prod.ts` with production API URL
- [ ] Enable AOT compilation
- [ ] Configure CDN for assets
- [ ] Set up error tracking (Sentry)
- [ ] Configure analytics (Google Analytics)

#### ML Service
- [ ] Use production WSGI server (Gunicorn, Uvicorn workers)
- [ ] Configure reverse proxy (Nginx)
- [ ] Set up model versioning
- [ ] Enable API authentication
- [ ] Monitor model performance drift
- [ ] Set up logging and error tracking

#### Infrastructure
- [ ] Deploy to cloud provider (AWS, Azure, DigitalOcean)
- [ ] Set up CI/CD pipeline (GitHub Actions, GitLab CI)
- [ ] Configure load balancer for scalability
- [ ] Set up monitoring and alerts (Prometheus, Grafana)
- [ ] Configure automated backups
- [ ] Set up staging environment for testing

---

## 🤝 Contributing

This is an academic project, but suggestions and improvements are welcome!

### Development Workflow

1. **Clone repository**
2. **Create feature branch:** `git checkout -b feature/your-feature-name`
3. **Make changes** and commit with descriptive messages
4. **Push to branch:** `git push origin feature/your-feature-name`
5. **Create pull request** for review

### Code Standards

- **TypeScript:** ESLint + Prettier
- **Python:** PEP 8, Black formatter
- **Commit messages:** Conventional Commits format
- **Documentation:** Update docs for new features

---

## 📄 License

**MIT License**

---

## 👤 Author

**Nhat Do**  
- **GitHub:** [@mnhatdo](https://github.com/mnhatdo)
- **Email:** contact@ponsai.vn
- **Project:** Advanced Web Development (HK7)

---

## 🙏 Acknowledgments

- **Angular Team** for Angular 19 and Signals API
- **MongoDB** for database documentation
- **FastAPI** for excellent Python framework
- **scikit-learn** for ML library
- **Three.js** for 3D rendering
- **MoMo** for payment gateway documentation

---

## 📖 Additional Documentation

For detailed implementation guides, see:

- [SETUP.md](SETUP.md) - Complete setup instructions
- [docs/ANALYTICS_SYSTEM.md](docs/ANALYTICS_SYSTEM.md) - Analytics architecture
- [docs/MOMO_INTEGRATION.md](docs/MOMO_INTEGRATION.md) - MoMo payment integration
- [docs/PAYMENT_SYSTEM.md](docs/PAYMENT_SYSTEM.md) - Payment system overview
- [ml-service/README.md](ml-service/README.md) - ML service documentation
- [backend/scripts/DATA_GENERATION_GUIDE.md](backend/scripts/DATA_GENERATION_GUIDE.md) - Data generation guide

---

**Last Updated:** January 24, 2026  
**Version:** 1.0.0  
**Status:** ✅ Complete and Production-Ready (for academic purposes)
