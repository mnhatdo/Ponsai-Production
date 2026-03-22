# 🚀 Quick Setup Guide

Get Ponsai E-commerce running in **3 simple steps**!

---

## Prerequisites

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **MongoDB** - [Download here](https://www.mongodb.com/try/download/community)
- **Git** - [Download here](https://git-scm.com/)

---

## Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/mnhatdo/advanced_webdev.git
cd advanced_webdev
git checkout nhat
```

### Step 2: Run Setup Script

This will install all dependencies and configure the environment:

```bash
npm run setup
```

**What this does:**
- ✅ Checks system requirements
- ✅ Installs all dependencies (root, backend, frontend)
- ✅ Creates `.env` file from template
- ✅ Verifies MongoDB connection

### Step 3: Start MongoDB

**Windows:**
```bash
mongod
```

**Mac/Linux:**
```bash
sudo systemctl start mongod
```

Or use **MongoDB Compass** for a GUI interface.

---

## 🎯 Quick Start

### Option A: One Command (Recommended)

```bash
npm run dev
```

This starts both backend and frontend servers automatically.

- **Frontend:** http://localhost:4200
- **Backend API:** http://localhost:3000

### Option B: Manual Start

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

---

## 🌱 Seed Database (Optional)

Add sample products and admin user:

```bash
cd backend
npm run seed:admin
npm run seed:bonsai
```

**Default Admin Credentials:**
- Email: `admin@ponsai.com`
- Password: `admin123`

---

## 🎨 Features

✅ **3D Particle Bonsai Hero** - 450,000 particles, interactive
✅ **Product Catalog** - Browse and search products
✅ **Shopping Cart** - Add to cart, manage quantities
✅ **Checkout Flow** - Complete order process
✅ **Payment Integration** - MOMO sandbox, bank transfer, card
✅ **Admin Panel** - Product management, orders, analytics
✅ **Responsive Design** - Mobile-friendly UI

---

## 📂 Project Structure

```
advanced_webdev/
├── frontend/          # Angular 17 application
│   ├── src/
│   │   ├── app/
│   │   │   ├── features/    # Feature modules
│   │   │   ├── core/        # Services, guards, interceptors
│   │   │   └── shared/      # Shared components
│   │   └── assets/          # Images, styles, icons
│   └── package.json
│
├── backend/           # Node.js/Express API
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── models/          # MongoDB models
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   └── middleware/      # Auth, error handling
│   ├── data/seeds/          # Database seeds
│   └── package.json
│
├── docs/              # Documentation
├── dev.js             # Development launcher
├── setup.js           # Setup wizard
└── package.json       # Root package
```

---

## ⚙️ Configuration

### Backend Configuration (`backend/.env`)

```env
# Server
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/furni

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d

# CORS
CORS_ORIGIN=http://localhost:4200

# Payment (MOMO Sandbox)
MOMO_PARTNER_CODE=MOMOBKUN20180529
MOMO_ACCESS_KEY=klm05TvNBzhg7h7j
MOMO_SECRET_KEY=at67qH6mk8w5Y1nAyMoYKMWACiEi2bsa
```

### Frontend Configuration (`frontend/src/environments/environment.ts`)

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api/v1'
};
```

---

## 🐛 Troubleshooting

### MongoDB Connection Failed

**Problem:** `MongoNetworkError: connect ECONNREFUSED`

**Solution:**
1. Ensure MongoDB is running: `mongod`
2. Check MongoDB URI in `backend/.env`
3. Verify MongoDB is installed correctly

### Port Already in Use

**Problem:** `EADDRINUSE: address already in use :::3000`

**Solution:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9
```

The `dev.js` script automatically handles this for you.

### Angular Compilation Errors

**Problem:** TypeScript errors during compilation

**Solution:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Dependencies Installation Failed

**Problem:** npm install errors

**Solution:**
1. Clear npm cache: `npm cache clean --force`
2. Delete node_modules: `rm -rf node_modules`
3. Reinstall: `npm install`

---

## 📚 Documentation

- **[README.md](README.md)** - Project overview
- **[QUICK_START.md](QUICK_START.md)** - Detailed quick start
- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** - System architecture
- **[docs/API.md](docs/API.md)** - API documentation
- **[docs/FRONTEND.md](docs/FRONTEND.md)** - Frontend guide
- **[BONSAI_3D_HERO_GUIDE.md](BONSAI_3D_HERO_GUIDE.md)** - 3D Bonsai implementation

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License.

---

## 🆘 Need Help?

- **Issues:** [GitHub Issues](https://github.com/mnhatdo/advanced_webdev/issues)
- **Discussions:** [GitHub Discussions](https://github.com/mnhatdo/advanced_webdev/discussions)
- **Email:** support@ponsai.com

---

**Happy coding! 🎉**
