# 🚀 Unified Development Environment Guide

## Overview

The Ponsai full-stack application features a **smart unified development environment** that automatically manages dependencies and runs both frontend and backend servers concurrently with minimal manual intervention.

---

## Quick Start

### Simple Commands

```bash
# Start development environment (auto-installs dependencies if needed)
npm run dev
```

or

```bash
npm start
```

Both commands launch the **smart development script** that:
1. ✅ Checks if dependencies are installed
2. 📦 Automatically installs missing dependencies
3. 🚀 Starts both frontend and backend servers concurrently
4. 📊 Provides clear status messages

---

## How It Works

### Architecture

```
Root Package.json
     │
     ├──> dev.js (Smart Launcher)
     │       │
     │       ├──> Check Dependencies
     │       │    ├─ Root node_modules
     │       │    ├─ Frontend node_modules  
     │       │    └─ Backend node_modules
     │       │
     │       ├──> Auto-Install Missing
     │       │    └─ npm install in each directory
     │       │
     │       └──> Launch Servers
     │            ├─ Backend: npm run dev:backend
     │            └─ Frontend: npm run dev:frontend
     │
     └──> Environment Variables
          ├─ Backend: .env
          └─ Frontend: environment.ts
```

### Smart Dependency Management

The `dev.js` script intelligently:

- **Detects** missing `node_modules` directories
- **Installs** dependencies only where needed
- **Skips** installation if already present
- **Reports** clear status for each step

### Server Orchestration

1. **Backend starts first** (port 3000)
2. **Frontend starts after 1 second** (port 4200)
3. **Both run concurrently** with combined output
4. **Graceful shutdown** on Ctrl+C

---

## Available Scripts

### Development

| Command | Description | Use Case |
|---------|-------------|----------|
| `npm run dev` | Smart unified launcher | **Primary development** |
| `npm start` | Alias for `npm run dev` | Quick start |
| `npm run dev:backend` | Backend only | API development |
| `npm run dev:frontend` | Frontend only | UI development |

### Installation

| Command | Description | When to Use |
|---------|-------------|-------------|
| `npm run install:all` | Install all dependencies | First setup, clean install |
| `npm install` | Root dependencies | Rarely needed |

### Building

| Command | Description | Output |
|---------|-------------|--------|
| `npm run build` | Build both apps | Production bundles |
| `npm run build:frontend` | Frontend only | `frontend/dist/` |
| `npm run build:backend` | Backend only | `backend/dist/` |

### Production

| Command | Description | Requirements |
|---------|-------------|--------------|
| `npm run start:backend` | Run built backend | MongoDB running |
| `npm run start:frontend` | Serve frontend | Build completed |

### Testing

| Command | Description |
|---------|-------------|
| `npm test` | Run all tests |
| `npm run test:backend` | Backend tests (Jest) |
| `npm run test:frontend` | Frontend tests (Karma) |

---

## Environment Configuration

### Backend (.env)

Create `backend/.env`:

```env
# Server
NODE_ENV=development
PORT=3000

# Database
MONGODB_URI=mongodb://localhost:27017/ponsai
MONGODB_URI_TEST=mongodb://localhost:27017/ponsai_test

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# CORS
CORS_ORIGIN=http://localhost:4200
```

### Frontend (environment.ts)

Already configured in `frontend/src/environments/`:

```typescript
// environment.ts (development)
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api/v1'
};

// environment.prod.ts (production)
export const environment = {
  production: true,
  apiUrl: '/api/v1'  // Relative URL for same-origin deployment
};
```

---

## Extending the Run Mechanism

### Adding New Services

To add additional services (e.g., Redis, ElasticSearch):

1. **Update `dev.js`:**

```javascript
// Around line 90, after backend starts
const redis = spawn('redis-server', [], {
  stdio: 'inherit',
  shell: true
});

// Add to shutdown handler
process.on('SIGINT', () => {
  backend.kill();
  redis.kill();
  process.exit(0);
});
```

2. **Add to package.json:**

```json
{
  "scripts": {
    "dev:redis": "redis-server",
    "dev:all": "node dev.js"
  }
}
```

### Custom Environment Variables

#### Option 1: Using .env files

Backend already supports `.env`. For frontend:

```bash
# Install dotenv for frontend
cd frontend
npm install dotenv --save-dev
```

Update `angular.json`:

```json
{
  "projects": {
    "ponsai-frontend": {
      "architect": {
        "build": {
          "options": {
            "scripts": [
              "node_modules/dotenv/config.js"
            ]
          }
        }
      }
    }
  }
}
```

#### Option 2: Cross-platform environment variables

```bash
# Install cross-env
npm install --save-dev cross-env

# Use in scripts
"dev:backend": "cross-env NODE_ENV=development cd backend && npm run dev"
```

### Platform-Specific Overrides

The `dev.js` script already handles Windows vs Unix differences:

```javascript
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
```

For additional platform-specific logic:

```javascript
if (process.platform === 'win32') {
  // Windows-specific code
} else if (process.platform === 'darwin') {
  // macOS-specific code
} else {
  // Linux/Unix-specific code
}
```

---

## Troubleshooting

### Port Already in Use

**Frontend (4200):**
```bash
# Windows
netstat -ano | findstr :4200
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:4200 | xargs kill -9
```

**Backend (3000):**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3000 | xargs kill -9
```

### Dependencies Won't Install

```bash
# Clear npm cache
npm cache clean --force

# Delete all node_modules
Remove-Item -Recurse -Force node_modules, frontend\node_modules, backend\node_modules

# Reinstall
npm run install:all
```

### Backend Won't Start

1. **Check MongoDB:**
   ```bash
   # Verify MongoDB is running
   mongosh
   ```

2. **Check .env file:**
   ```bash
   # Verify backend/.env exists
   cat backend/.env
   ```

3. **Check TypeScript compilation:**
   ```bash
   cd backend
   npm run build
   ```

### Frontend Build Errors

1. **Check Angular CLI:**
   ```bash
   cd frontend
   npx ng version
   ```

2. **Clear Angular cache:**
   ```bash
   cd frontend
   npx ng cache clean
   ```

3. **Rebuild:**
   ```bash
   npm run build:frontend
   ```

---

## Development Workflow

### Standard Development

```bash
# 1. Start development environment
npm run dev

# 2. Make changes to code
# - Frontend: http://localhost:4200 (auto-reloads)
# - Backend: http://localhost:3000 (auto-restarts with nodemon)

# 3. Test changes
# - Frontend tests update automatically
# - Backend uses ts-node for live compilation

# 4. Stop servers
# Press Ctrl+C
```

### Frontend-Only Development

```bash
# If backend isn't needed
npm run dev:frontend

# Uses mock data or existing backend instance
```

### Backend-Only Development

```bash
# If UI isn't needed
npm run dev:backend

# Test API with Postman/Thunder Client
```

### Full-Stack Feature Development

```bash
# 1. Start both servers
npm run dev

# 2. Backend: Add API endpoint
#    backend/src/routes/newFeature.ts
#    backend/src/controllers/newFeatureController.ts

# 3. Frontend: Create service
#    frontend/src/app/core/services/new-feature.service.ts

# 4. Frontend: Create component
#    frontend/src/app/features/new-feature/

# 5. Test integration
#    Open http://localhost:4200
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: CI/CD

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      mongodb:
        image: mongo:6
        ports:
          - 27017:27017
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm run install:all
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build
```

### Docker Compose

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db

  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - MONGODB_URI=mongodb://mongodb:27017/ponsai
    depends_on:
      - mongodb
    volumes:
      - ./backend:/app
      - /app/node_modules

  frontend:
    build: ./frontend
    ports:
      - "4200:4200"
    volumes:
      - ./frontend:/app
      - /app/node_modules

volumes:
  mongo-data:
```

Run with: `docker-compose up`

---

## Best Practices

### ✅ Do's

- ✅ Use `npm run dev` for most development
- ✅ Keep `.env` files out of version control
- ✅ Commit `package-lock.json` files
- ✅ Test on clean install occasionally
- ✅ Document environment variable changes

### ❌ Don'ts

- ❌ Don't manually run `npm install` in subdirectories (use `npm run install:all`)
- ❌ Don't commit `node_modules/`
- ❌ Don't commit `.env` files
- ❌ Don't use hardcoded URLs/ports
- ❌ Don't skip `npm run build` before production deployment

---

## Performance Tips

### Speed Up Installation

```bash
# Use npm ci (clean install) in CI/CD
npm ci

# Or use pnpm (faster alternative to npm)
npm install -g pnpm
pnpm install
```

### Reduce Build Time

**Frontend:**
```json
// angular.json - development config
{
  "optimization": false,
  "sourceMap": true,
  "buildOptimizer": false
}
```

**Backend:**
```json
// tsconfig.json
{
  "compilerOptions": {
    "incremental": true,  // Faster rebuilds
    "skipLibCheck": true  // Skip type checking of declarations
  }
}
```

---

## Summary

The unified development environment provides:

- **Zero-configuration** startup for new developers
- **Automatic dependency management** reduces friction
- **Concurrent server execution** for full-stack development
- **Environment-based configuration** for flexibility
- **Extensible architecture** for adding new services
- **Cross-platform compatibility** (Windows, macOS, Linux)
- **Clear error messages** for troubleshooting

**Primary command to remember:** `npm run dev` or `npm start`

Everything else is handled automatically! 🎉


