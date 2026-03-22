# 🌱 Ponsai - Full-Stack E-Commerce Application

**Modern furniture e-commerce platform** with stunning **3D Particle Bonsai Hero** and complete full-stack architecture (Angular 17 + Node.js + Express + MongoDB).

---

## 🚀 Super Quick Start

### First Time Setup (3 Steps)

```bash
# 1. Clone and navigate
git clone https://github.com/mnhatdo/advanced_webdev.git
cd advanced_webdev
git checkout nhat

# 2. Run setup wizard (installs everything)
npm run setup

# 3. Start development servers
npm run dev
```

**That's it!** 🎉

- Frontend: http://localhost:4200
- Backend: http://localhost:3000

**For detailed setup:** See [SETUP.md](SETUP.md) | **Full guide:** [QUICK_START.md](QUICK_START.md)

---

## 🎯 What This Project Offers

### ✅ Original Template Fully Restored
- Complete Furni Bootstrap theme preserved pixel-perfect
- All 6 main pages working: Home, Shop, About, Services, Blog, Contact
- 31 original images, icons, and assets integrated
- Bootstrap 5 styling and JavaScript functionality intact

### ✅ Modern Full-Stack Architecture
- Angular 17+ frontend with standalone components
- Node.js/Express RESTful API backend
- MongoDB database with Mongoose ODM
- JWT authentication system
- TypeScript throughout for type safety
- Smart development environment with auto-dependency management

---

## 📚 Documentation Guide

### 🚀 Getting Started
- **[QUICK_START.md](QUICK_START.md)** - Get running in 5 minutes
- **[DEV_ENVIRONMENT.md](DEV_ENVIRONMENT.md)** - Complete development workflow guide

### � Frontend Development
- **[docs/FRONTEND.md](docs/FRONTEND.md)** - Complete frontend implementation guide
  - Product detail page
  - Shopping cart functionality
  - Component architecture
  - Services and state management

### 🔧 Technical Documentation
- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** - System design and patterns
- **[docs/API.md](docs/API.md)** - RESTful API reference
- **[docs/PAYMENT_GUIDE.md](docs/PAYMENT_GUIDE.md)** - Payment system comprehensive guide
- **[docs/DATA.md](docs/DATA.md)** - Database seeding and data management
- **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** - Production deployment
- **[docs/CONTRIBUTING.md](docs/CONTRIBUTING.md)** - Development standards
- **[docs/INDEX.md](docs/INDEX.md)** - Complete documentation index
- **[docs/CHANGELOG.md](docs/CHANGELOG.md)** - Project changelog and fixes history

---

## 🎯 Project Evolution

### From Template to Full-Stack Application

This project successfully transformed the original Furni Bootstrap template into a modern, production-ready full-stack application:

**What Was Preserved:**
- ✅ All 6 original pages (Home, Shop, About, Services, Blog, Contact)
- ✅ Complete Bootstrap 5 styling and custom CSS (700+ lines)
- ✅ All 31 original images, icons, and assets
- ✅ JavaScript functionality (sliders, forms, interactions)
- ✅ Pixel-perfect visual fidelity

**What Was Added:**
- ✅ Angular 17+ with standalone components and lazy loading
- ✅ Node.js/Express RESTful API with TypeScript
- ✅ MongoDB database with Mongoose ODM
- ✅ JWT authentication system
- ✅ Smart development environment with auto-dependency management
- ✅ 80+ new files and 8,000+ lines of code
- ✅ Comprehensive documentation (24,000+ words)

**Architecture Highlights:**
- Monorepo structure with shared types
- Feature-based frontend organization
- Service layer pattern in backend
- Environment-based configuration
- Type safety throughout the stack

---

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ ([Download](https://nodejs.org/))
- MongoDB 6+ ([Download](https://www.mongodb.com/try/download/community))
- Git ([Download](https://git-scm.com/))

### Quick Installation

1. **Install all dependencies:**
   ```bash
   npm run install:all
   ```

2. **Configure environment variables:**
   
   Backend (.env in `backend/`):
   ```
   NODE_ENV=development
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/furni
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRE=7d
   ```

   Frontend (environment.ts in `frontend/src/environments/`):
   ```typescript
   export const environment = {
     production: false,
     apiUrl: 'http://localhost:3000/api'
   };
   ```

### Development

**Seed the database with bonsai products (optional):**
```bash
cd backend
npm run seed:bonsai
```
This imports 411+ bonsai products from ZeroBonsai.com into your database.

**Run both frontend and backend concurrently:**
```bash
npm run dev
```

**Or run them separately:**
```bash
# Terminal 1 - Backend (http://localhost:3000)
npm run dev:backend

# Terminal 2 - Frontend (http://localhost:4200)
npm run dev:frontend
```

### Building for Production

```bash
npm run build
```

This will create optimized production builds in:
- `frontend/dist/` - Angular production build
- `backend/dist/` - Compiled backend server

### Testing

```bash
# Run all tests
npm test

# Test backend only
npm run test:backend

# Test frontend only
npm run test:frontend
```

## 📁 Project Structure

### Frontend (`frontend/`)

```
frontend/
├── src/
│   ├── app/
│   │   ├── core/              # Singleton services, guards, interceptors
│   │   ├── shared/            # Shared components, directives, pipes
│   │   ├── features/          # Feature modules (lazy-loaded)
│   │   │   ├── home/
│   │   │   ├── shop/
│   │   │   ├── cart/
│   │   │   ├── checkout/
│   │   │   ├── auth/
│   │   │   └── ...
│   │   ├── layout/            # Layout components (header, footer)
│   │   └── models/            # TypeScript interfaces/types
│   ├── assets/                # Static assets (images, fonts)
│   ├── environments/          # Environment configurations
│   └── styles/                # Global styles
└── angular.json
```

### Backend (`backend/`)

```
backend/
├── src/
│   ├── config/                # Configuration (db, env)
│   ├── controllers/           # Request handlers
│   ├── models/                # Mongoose schemas/models
│   ├── routes/                # API route definitions
│   ├── middleware/            # Custom middleware (auth, validation)
│   ├── services/              # Business logic layer
│   ├── utils/                 # Helper functions
│   ├── types/                 # TypeScript types
│   └── server.ts              # Application entry point
├── tests/                     # Unit and integration tests
└── package.json
```

### Shared (`shared/`)

Common TypeScript interfaces and utilities shared between frontend and backend:
- API response types
- DTOs (Data Transfer Objects)
- Common validation schemas
- Shared constants

## 🔌 API Architecture

The backend follows RESTful principles with the following structure:

```
/api/v1
├── /auth          # Authentication & authorization
├── /products      # Product CRUD operations
├── /categories    # Product categories
├── /cart          # Shopping cart management
├── /orders        # Order processing
├── /users         # User management
└── /blog          # Blog posts
```

See [API Documentation](docs/API.md) for detailed endpoint specifications.

## 🎯 Design Decisions & Rationale

### 1. **Monorepo Structure**
- **Why**: Simplifies dependency management, enables code sharing, easier refactoring
- **Trade-off**: Slightly larger repository size vs. better developer experience

### 2. **TypeScript Throughout**
- **Why**: Type safety, better IDE support, reduces runtime errors
- **Benefit**: Shared types between frontend and backend ensure API contract consistency

### 3. **Feature-Based Frontend Organization**
- **Why**: Scalability - features can be lazy-loaded independently
- **Benefit**: Better code organization, easier team collaboration

### 4. **Service Layer in Backend**
- **Why**: Separates business logic from HTTP concerns
- **Benefit**: Easier testing, reusability, cleaner controllers

### 5. **Environment-Based Configuration**
- **Why**: Security (no hardcoded credentials), flexibility across environments
- **Benefit**: Easy deployment to different environments (dev/staging/prod)

### 6. **MongoDB with Mongoose**
- **Why**: Flexible schema for evolving product catalog, excellent Node.js integration
- **Trade-off**: Less rigid than SQL, but better for rapid development

## 🔐 Security Considerations

- JWT-based authentication with HTTP-only cookies
- Input validation on all API endpoints
- CORS configuration for frontend-backend communication
- Environment variables for sensitive data
- Password hashing with bcrypt
- Rate limiting on authentication endpoints (future)

## 🛣️ Roadmap

- [ ] Implement complete authentication system
- [ ] Add product image upload functionality
- [ ] Integrate payment gateway (Stripe/PayPal)
- [ ] Add order tracking system
- [ ] Implement email notifications
- [ ] Add admin dashboard
- [ ] Docker containerization
- [ ] CI/CD pipeline setup
- [ ] Performance monitoring
- [ ] SEO optimization

## 📚 Additional Documentation

- [Architecture Details](docs/ARCHITECTURE.md)
- [API Reference](docs/API.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Contributing Guidelines](docs/CONTRIBUTING.md)
- [Changelog & Fixes History](docs/CHANGELOG.md)
- [Cleanup Summary](CLEANUP_SUMMARY.md)

## 📄 License

MIT License - Originally based on Furni template by Untree.co (CC BY 3.0)

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

---

**Original Template**: Furni by [Untree.co](https://untree.co/)  
**Developed by**: Ki8 Development Team  
**Last Updated**: January 8, 2026
