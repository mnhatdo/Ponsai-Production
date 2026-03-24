# Quick Start Guide

## 🚀 Bắt đầu trong 5 phút

### Prerequisites

Before you begin, ensure you have:
- **Node.js** 18+ installed ([Download](https://nodejs.org/))
- **MongoDB** 6+ installed and running ([Download](https://www.mongodb.com/try/download/community))
- **Git** installed ([Download](https://git-scm.com/))

### Bước 1: Di chuyển vào dự án và cài dependencies

```bash
# Navigate to project directory
cd d:\Document\Ki8\WebDev\deploy

# Install all dependencies (root + frontend + backend)
npm run install:all
```

This will install dependencies for:
- Root workspace
- Frontend (Angular)
- Backend (Node.js/Express)
- Shared module

### Step 2: Configure Backend

```bash
# Copy environment template
cd backend
cp .env.example .env
```

Edit `backend/.env` with your settings (or use defaults):

```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/ponsai
JWT_SECRET=dev-secret-key-change-in-production
CORS_ORIGIN=http://localhost:4200
```

### Lựa chọn setup theo nhu cầu

**Không dùng ML service (khuyến nghị cho dev web thông thường):**

```bash
npm run setup
```

**Có dùng ML service (Windows):**

```powershell
# PowerShell
.\tools\scripts\setup\setup-ml-system.ps1

# Hoặc Batch
tools\scripts\setup\setup-ml-system.bat
```

Tài liệu ML:
- [FORECAST_QUICKSTART.md](FORECAST_QUICKSTART.md)
- [ml-service/README.md](../../ml-service/README.md)

### Step 3: Start MongoDB

**Windows:**
```powershell
# If installed as service (default)
net start MongoDB

# Or run manually
mongod --dbpath C:\data\db
```

**macOS/Linux:**
```bash
# Start MongoDB service
sudo systemctl start mongod

# Or run manually
mongod --dbpath /data/db
```

### Step 4: Seed Database (Optional but Recommended)

Import real bonsai product data:

```bash
cd backend
npm run seed:bonsai
```

This imports **411 bonsai products** with images and full details from ZeroBonsai.com.

### Step 5: Launch Application

**Option A: Run Everything Together** (Recommended)
```bash
# From project root
npm run dev
```

This starts:
- Backend API server on http://localhost:3000
- Frontend dev server on http://localhost:4200

**Option B: Run Separately**

Terminal 1 - Backend:
```bash
npm run dev:backend
```

Terminal 2 - Frontend:
```bash
npm run dev:frontend
```

### Step 6: Verify Installation

Open your browser and visit:

- **Frontend**: http://localhost:4200
- **Backend Health**: http://localhost:3000/health
- **API Docs**: See [docs/API.md](docs/API.md)

You should see the Ponsai homepage! 🎉

---

## 📁 Project Structure Overview

```
ponsai-2.0.0/
│
├── 📦 frontend/                 # Angular Application
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/           # Services, guards, interceptors
│   │   │   ├── features/       # Lazy-loaded feature modules
│   │   │   ├── shared/         # Shared components
│   │   │   └── models/         # TypeScript interfaces
│   │   ├── assets/             # Images, styles
│   │   └── environments/       # Environment configs
│   └── package.json
│
├── 🔧 backend/                  # Node.js/Express API
│   ├── src/
│   │   ├── config/             # Database, config
│   │   ├── controllers/        # Request handlers
│   │   ├── models/             # Mongoose schemas
│   │   ├── routes/             # API routes
│   │   ├── middleware/         # Auth, validation
│   │   └── server.ts           # Entry point
│   └── package.json
│
├── 🔗 shared/                   # Shared TypeScript types
│   └── src/
│       ├── types.ts            # Interfaces
│       ├── constants.ts        # Constants
│       └── utils.ts            # Utilities
│
├── 📚 docs/                     # Documentation
│   ├── ARCHITECTURE.md         # System design
│   ├── API.md                  # API reference
│   ├── DEPLOYMENT.md           # Deploy guide
│   └── CONTRIBUTING.md         # Contribution guide
│
├── 📦 _static_original/         # Original HTML template (archived)
│
└── 📄 Root files
    ├── package.json            # Workspace scripts
    ├── .gitignore
    ├── .editorconfig
    ├── README.md
    └── QUICK_START.md         # This file!
```

---

## 🛠️ Common Development Tasks

### Install New Package

**Frontend:**
```bash
cd frontend
npm install <package-name>
```

**Backend:**
```bash
cd backend
npm install <package-name>
```

### Build for Production

```bash
# Build both frontend and backend
npm run build

# Build individually
npm run build:frontend
npm run build:backend
```

### Run Tests

```bash
# Run all tests
npm test

# Test individually
npm run test:frontend
npm run test:backend
```

### Linting & Formatting

```bash
# Lint code
cd backend && npm run lint

# Format code
cd backend && npm run format
```

### Create New Component (Frontend)

```bash
cd frontend
ng generate component features/my-feature/my-component --standalone
```

### Create New Model (Backend)

Create file in `backend/src/models/MyModel.ts`:

```typescript
import mongoose, { Schema, Document } from 'mongoose';

interface IMyModel extends Document {
  name: string;
}

const MyModelSchema = new Schema({
  name: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model<IMyModel>('MyModel', MyModelSchema);
```

---

## 🧪 Testing the API

### Using curl

```bash
# Health check
curl http://localhost:3000/health

# Register user
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'

# Get products
curl http://localhost:3000/api/v1/products
```

### Using Postman/Insomnia

Import the API endpoints:
- Base URL: `http://localhost:3000/api/v1`
- See [docs/API.md](docs/API.md) for all endpoints

---

## 🐛 Troubleshooting

### Backend won't start

**"MongoDB connection failed"**
```bash
# Check if MongoDB is running
# Windows:
net start MongoDB

# macOS/Linux:
sudo systemctl status mongod
```

**"Port 3000 already in use"**
```bash
# Change PORT in backend/.env
PORT=3001
```

### Frontend shows errors

**"Cannot connect to backend"**
- Ensure backend is running on http://localhost:3000
- Check `frontend/src/environments/environment.ts` has correct API URL
- Verify CORS settings in `backend/.env`

**"Module not found"**
```bash
# Reinstall dependencies
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Database issues

**"Collection not found"**
- Collections are created automatically when first document is inserted
- No need to manually create collections

**"Want to reset database"**
```bash
# Connect to MongoDB
mongosh

# Switch to ponsai database
use ponsai

# Drop database
db.dropDatabase()
```

---

## 📖 Next Steps

1. **Read Documentation**
   - [ARCHITECTURE.md](docs/ARCHITECTURE.md) - Understand system design
   - [API.md](docs/API.md) - API endpoint reference
   - [CONTRIBUTING.md](docs/CONTRIBUTING.md) - Contributing guidelines

2. **Explore Code**
   - Frontend: Start with `frontend/src/app/app.routes.ts`
   - Backend: Start with `backend/src/server.ts`

3. **Add Features**
   - Implement product catalog display
   - Add shopping cart functionality
   - Build checkout flow
   - Create admin dashboard

4. **Deploy**
   - See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for deployment guide

---

## 🎯 Available NPM Scripts

### Root Level

| Command | Description |
|---------|-------------|
| `npm run dev` | Run both frontend and backend |
| `npm run start:backend` | Start backend only |
| `npm run start:frontend` | Start frontend only |
| `npm run build` | Build both for production |
| `npm run install:all` | Install all dependencies |
| `npm test` | Run all tests |

### Frontend (cd frontend)

| Command | Description |
|---------|-------------|
| `npm start` | Start dev server (port 4200) |
| `npm run build` | Production build |
| `npm test` | Run tests |
| `npm run lint` | Lint code |

### Backend (cd backend)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start with nodemon (auto-reload) |
| `npm start` | Start production build |
| `npm run build` | Compile TypeScript |
| `npm test` | Run tests |
| `npm run lint` | Lint code |

---

## 💡 Tips

- **Hot Reload**: Both frontend and backend support hot reload during development
- **TypeScript**: IntelliSense works in VS Code - install recommended extensions
- **Debugging**: Use VS Code debugger with provided launch configurations
- **Database GUI**: Use MongoDB Compass to visualize database
- **API Testing**: Postman or Insomnia for testing API endpoints

---

## 🆘 Getting Help

- **Documentation**: Check [docs/](docs/) folder
- **Issues**: Create an issue on GitHub (if applicable)
- **Architecture Questions**: See [ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **API Questions**: See [API.md](docs/API.md)

---

## ✅ Quick Checklist

Before starting development:

- [ ] Node.js 18+ installed
- [ ] MongoDB installed and running
- [ ] Dependencies installed (`npm run install:all`)
- [ ] Backend `.env` configured
- [ ] Both servers running (`npm run dev`)
- [ ] Frontend accessible at http://localhost:4200
- [ ] Backend health check passes at http://localhost:3000/health

---

**Happy Coding! 🚀**

*Last Updated: December 31, 2025*


