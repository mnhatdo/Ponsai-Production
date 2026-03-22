# Furni Full-Stack Architecture

## Overview

This document describes the architectural decisions, patterns, and structure of the Furni e-commerce application—a modern full-stack solution built with Angular, Node.js/Express, and MongoDB.

## Table of Contents

1. [Architecture Philosophy](#architecture-philosophy)
2. [System Architecture](#system-architecture)
3. [Project Structure](#project-structure)
4. [Technology Stack](#technology-stack)
5. [Design Patterns](#design-patterns)
6. [Data Flow](#data-flow)
7. [Security Architecture](#security-architecture)
8. [Scalability Considerations](#scalability-considerations)

---

## Architecture Philosophy

### Core Principles

1. **Separation of Concerns**: Clear boundaries between frontend, backend, and shared logic
2. **Modularity**: Feature-based organization enabling independent development and lazy loading
3. **Type Safety**: TypeScript throughout for compile-time error detection
4. **DRY (Don't Repeat Yourself)**: Shared types and utilities prevent duplication
5. **Scalability**: Structure supports horizontal and vertical scaling
6. **Maintainability**: Consistent patterns, clear naming, comprehensive documentation

### Why Monorepo?

The project uses a monorepo structure for several strategic reasons:

**Advantages:**
- **Unified versioning**: All components evolve together
- **Code sharing**: Shared types ensure frontend-backend contract consistency
- **Atomic commits**: Related changes across frontend/backend in single commits
- **Simplified dependencies**: One node_modules at root for dev dependencies
- **Better developer experience**: Single clone, unified tooling

**Trade-offs Considered:**
- Slightly larger repository size (acceptable for project scale)
- All developers need access to entire codebase (beneficial for transparency)

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Angular Application (Port 4200)              │   │
│  │  - Standalone Components                             │   │
│  │  - Lazy-loaded Feature Modules                       │   │
│  │  - RxJS State Management                             │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/HTTPS (REST API)
                            │ JSON
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Application Layer                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │    Node.js/Express Server (Port 3000)                │   │
│  │  - RESTful API Endpoints                             │   │
│  │  - JWT Authentication                                │   │
│  │  - Request Validation                                │   │
│  │  - Business Logic (Services)                         │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Mongoose ODM
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                        Data Layer                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         MongoDB Database                             │   │
│  │  - Products Collection                               │   │
│  │  - Users Collection                                  │   │
│  │  - Orders Collection                                 │   │
│  │  - Categories Collection                             │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction

```
Frontend (Angular)
    │
    ├── Core Module
    │   ├── HTTP Interceptors (Auth, Error)
    │   ├── Guards (Auth Guard)
    │   └── Services (API Communication)
    │
    ├── Feature Modules (Lazy Loaded)
    │   ├── Home
    │   ├── Shop
    │   ├── Cart
    │   ├── Checkout
    │   └── Auth
    │
    └── Shared Module
        ├── Components (Reusable UI)
        ├── Directives
        └── Pipes

Backend (Express)
    │
    ├── Routes (Endpoint Definitions)
    │   └── → Controllers (Request Handlers)
    │       └── → Services (Business Logic)
    │           └── → Models (Data Access)
    │
    ├── Middleware
    │   ├── Authentication
    │   ├── Validation
    │   └── Error Handling
    │
    └── Config
        ├── Database Connection
        └── Environment Variables
```

---

## Project Structure

### Root Directory

```
furni-1.0.0/
├── frontend/              # Angular application
├── backend/               # Node.js/Express API
├── shared/                # Shared TypeScript types & utils
├── docs/                  # Architecture & API documentation
├── _static_original/      # Archived original HTML template
├── package.json           # Root package with workspace scripts
├── .gitignore
├── .editorconfig
├── .eslintrc.json
├── .prettierrc
└── README.md
```

### Frontend Structure (Angular)

```
frontend/
├── src/
│   ├── app/
│   │   ├── core/                    # Singleton services, guards
│   │   │   ├── guards/
│   │   │   │   └── auth.guard.ts
│   │   │   ├── interceptors/
│   │   │   │   ├── auth.interceptor.ts
│   │   │   │   └── error.interceptor.ts
│   │   │   └── services/
│   │   │       ├── auth.service.ts
│   │   │       ├── cart.service.ts
│   │   │       └── product.service.ts
│   │   │
│   │   ├── features/                # Feature modules (lazy-loaded)
│   │   │   ├── home/
│   │   │   ├── shop/
│   │   │   ├── cart/
│   │   │   ├── checkout/
│   │   │   ├── auth/
│   │   │   │   ├── login/
│   │   │   │   ├── register/
│   │   │   │   └── auth.routes.ts
│   │   │   └── ...
│   │   │
│   │   ├── shared/                  # Shared components, pipes, directives
│   │   │   ├── components/
│   │   │   ├── directives/
│   │   │   └── pipes/
│   │   │
│   │   ├── models/                  # TypeScript interfaces
│   │   │   └── index.ts
│   │   │
│   │   ├── app.component.ts
│   │   ├── app.config.ts
│   │   └── app.routes.ts
│   │
│   ├── assets/
│   │   ├── images/                  # Static images
│   │   └── styles/                  # Original CSS/SCSS
│   │
│   ├── environments/
│   │   ├── environment.ts
│   │   └── environment.prod.ts
│   │
│   ├── index.html
│   ├── main.ts
│   └── styles.scss
│
├── angular.json
├── package.json
└── tsconfig.json
```

**Rationale:**
- **Core**: Singleton services loaded once, used globally
- **Features**: Domain-driven structure, each feature is self-contained
- **Shared**: Reusable UI components across features
- **Lazy Loading**: Improves initial load time, loads features on demand

### Backend Structure (Node.js/Express)

```
backend/
├── src/
│   ├── config/
│   │   └── database.ts              # MongoDB connection
│   │
│   ├── controllers/                 # Request handlers
│   │   ├── authController.ts
│   │   └── productController.ts
│   │
│   ├── models/                      # Mongoose schemas
│   │   ├── User.ts
│   │   ├── Product.ts
│   │   ├── Category.ts
│   │   └── Order.ts
│   │
│   ├── routes/                      # API route definitions
│   │   ├── index.ts
│   │   ├── authRoutes.ts
│   │   ├── productRoutes.ts
│   │   └── ...
│   │
│   ├── middleware/                  # Custom middleware
│   │   ├── auth.ts
│   │   └── errorHandler.ts
│   │
│   ├── services/                    # Business logic (future)
│   │   └── emailService.ts
│   │
│   ├── utils/                       # Helper functions
│   │   └── validators.ts
│   │
│   ├── types/                       # TypeScript types
│   │   └── index.ts
│   │
│   └── server.ts                    # Application entry point
│
├── tests/                           # Unit & integration tests
├── .env.example
├── package.json
└── tsconfig.json
```

**Rationale:**
- **Controllers**: Handle HTTP requests/responses, thin layer
- **Services**: Business logic, can be reused across controllers
- **Models**: Data layer, schema definitions and validation
- **Separation**: Clear boundaries between concerns

### Shared Module Structure

```
shared/
├── src/
│   ├── types.ts        # Shared TypeScript interfaces
│   ├── constants.ts    # Application constants
│   ├── utils.ts        # Shared utility functions
│   └── index.ts        # Main export
│
├── package.json
└── tsconfig.json
```

**Purpose:**
- Ensures type consistency between frontend and backend
- Single source of truth for data structures
- Prevents drift between API contract and client expectations

---

## Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Angular** | 17+ | Modern web framework with standalone components |
| **TypeScript** | 5.2+ | Type-safe JavaScript |
| **RxJS** | 7.8+ | Reactive programming for async operations |
| **SCSS** | - | CSS preprocessing |

**Why Angular 17?**
- **Standalone Components**: Simplified architecture, no NgModules needed
- **Signals**: Built-in reactivity (future migration path)
- **Performance**: Improved compilation and runtime performance
- **Developer Experience**: Better tooling, faster builds

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 18+ | JavaScript runtime |
| **Express** | 4.18+ | Web application framework |
| **TypeScript** | 5.3+ | Type safety |
| **MongoDB** | 6.0+ | NoSQL database |
| **Mongoose** | 8.0+ | MongoDB ODM |
| **JWT** | 9.0+ | Authentication tokens |
| **bcryptjs** | 2.4+ | Password hashing |

**Why MongoDB?**
- **Flexible Schema**: Product catalogs evolve, schema flexibility is valuable
- **JSON-like Documents**: Natural fit with JavaScript/TypeScript
- **Scalability**: Horizontal scaling support
- **Developer Productivity**: Rapid iteration during development

### DevOps & Tools

| Tool | Purpose |
|------|---------|
| **ESLint** | Code linting |
| **Prettier** | Code formatting |
| **Concurrently** | Run frontend/backend simultaneously |
| **Nodemon** | Backend hot reload |
| **ts-node** | TypeScript execution |

---

## Design Patterns

### 1. Repository Pattern (Backend)

**Models** act as repositories, abstracting data access:

```typescript
// Direct Mongoose usage in controllers (simple approach)
const product = await Product.findById(id);

// Future: Service layer for complex queries
// productService.findByIdWithRelations(id);
```

### 2. Dependency Injection (Frontend)

Angular's built-in DI:

```typescript
export class ProductListComponent {
  private productService = inject(ProductService);
}
```

### 3. Interceptor Pattern (Frontend)

HTTP interceptors for cross-cutting concerns:

```typescript
// Auth interceptor adds JWT to requests
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = authService.getToken();
  if (token) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }
  return next(req);
};
```

### 4. Middleware Pattern (Backend)

Express middleware for request processing pipeline:

```typescript
app.use(helmet());           // Security headers
app.use(cors());             // CORS handling
app.use(authenticate);       // Auth check
app.use(errorHandler);       // Error handling
```

### 5. Guard Pattern (Frontend)

Route guards for access control:

```typescript
export const authGuard: CanActivateFn = (route, state) => {
  return authService.isAuthenticated() || router.navigate(['/login']);
};
```

---

## Data Flow

### Request Flow (Frontend → Backend)

```
1. User Action
   ↓
2. Component calls Service method
   ↓
3. Service makes HTTP request
   ↓
4. Auth Interceptor adds JWT token
   ↓
5. Request sent to Backend API
   ↓
6. Backend Middleware Pipeline
   - CORS check
   - Body parsing
   - JWT verification
   - Request validation
   ↓
7. Route matches → Controller method
   ↓
8. Controller calls Service (if exists)
   ↓
9. Service/Controller queries Model
   ↓
10. Mongoose queries MongoDB
   ↓
11. Response flows back up the chain
   ↓
12. Error Interceptor handles errors
   ↓
13. Component receives Observable data
   ↓
14. Template updates via data binding
```

### Authentication Flow

```
Registration/Login:
  User → Frontend → POST /api/v1/auth/register
                 ↓
           Backend validates input
                 ↓
           Password hashed (bcrypt)
                 ↓
           User saved to MongoDB
                 ↓
           JWT token generated
                 ↓
           Token returned to Frontend
                 ↓
           Frontend stores token (localStorage)
                 ↓
           Token included in subsequent requests

Protected Routes:
  Request → Auth Interceptor (adds token)
         → Backend auth middleware (verifies token)
         → If valid: proceed to controller
         → If invalid: return 401 Unauthorized
```

---

## Security Architecture

### 1. Authentication

- **JWT (JSON Web Tokens)** for stateless authentication
- Tokens stored in localStorage (consider httpOnly cookies for production)
- Token expiry: 7 days (configurable via `.env`)

### 2. Password Security

- **bcryptjs** with salt rounds: 10
- Passwords never sent in responses (Mongoose `select: false`)
- Minimum password requirements enforced

### 3. API Security

```typescript
// Helmet: Sets security HTTP headers
app.use(helmet());

// CORS: Controlled cross-origin access
app.use(cors({ origin: process.env.CORS_ORIGIN }));

// Rate Limiting: Prevent brute force attacks
// (to be implemented)
```

### 4. Input Validation

- **express-validator** on backend for request validation
- Angular reactive forms with validators on frontend
- Never trust client-side validation alone

### 5. Error Handling

- Custom error classes with operational error flagging
- No stack traces exposed in production
- Sensitive data sanitized from error messages

### Future Security Enhancements

- [ ] Refresh token mechanism
- [ ] httpOnly cookies instead of localStorage
- [ ] Rate limiting on authentication endpoints
- [ ] CSRF protection
- [ ] Input sanitization against XSS
- [ ] SQL/NoSQL injection prevention (Mongoose helps)
- [ ] Security headers audit

---

## Scalability Considerations

### Frontend Scalability

1. **Lazy Loading**: Features loaded on demand
2. **OnPush Change Detection**: Reduces unnecessary checks
3. **TrackBy in ngFor**: Optimizes list rendering
4. **Virtual Scrolling**: For large product lists (future)
5. **Service Workers**: PWA capabilities (future)
6. **CDN for Assets**: Static assets served from CDN (production)

### Backend Scalability

1. **Stateless Design**: JWT allows horizontal scaling
2. **Database Indexing**: Indexed fields in Mongoose schemas
3. **Connection Pooling**: Mongoose connection pool configured
4. **Caching**: Redis for session/query caching (future)
5. **Microservices**: Can split into microservices if needed
6. **Load Balancing**: Multiple backend instances behind load balancer

### Database Scalability

1. **Indexes**: Text search, category filters indexed
2. **Replica Sets**: MongoDB replication for read scaling
3. **Sharding**: Horizontal partitioning if data grows large
4. **Aggregation Pipeline**: Efficient complex queries

### Performance Monitoring (Future)

- Application performance monitoring (APM)
- Error tracking (Sentry)
- Database query optimization
- Frontend performance budgets

---

## Deployment Architecture (Future)

### Development
- Frontend: `ng serve` (localhost:4200)
- Backend: `nodemon` (localhost:3000)
- Database: Local MongoDB

### Production

```
┌─────────────────────────────────────────┐
│           Load Balancer                 │
└─────────────────────────────────────────┘
              │
      ┌───────┴───────┐
      │               │
┌─────▼─────┐   ┌─────▼─────┐
│  Angular  │   │  Angular  │
│   (CDN)   │   │   (CDN)   │
└───────────┘   └───────────┘

┌─────────────────────────────────────────┐
│     API Load Balancer                   │
└─────────────────────────────────────────┘
              │
      ┌───────┴───────┬─────────┐
      │               │         │
┌─────▼─────┐   ┌─────▼─────┐  │
│  Node API │   │  Node API │  │
│ Instance1 │   │ Instance2 │  │
└───────────┘   └───────────┘  │
      │               │         │
      └───────┬───────┘         │
              │                 │
      ┌───────▼─────────────────▼─┐
      │   MongoDB Cluster          │
      │  (Replica Set / Sharded)   │
      └────────────────────────────┘
```

**Deployment Options:**
- **Docker** + **Kubernetes** for container orchestration
- **AWS**: EC2 (compute), S3 (static assets), MongoDB Atlas (database)
- **Heroku**: Simplified deployment for smaller scale
- **Vercel/Netlify**: Frontend hosting

---

## Testing Strategy (Future Implementation)

### Frontend Tests
- **Unit Tests**: Jasmine + Karma for services/components
- **Integration Tests**: Component interaction testing
- **E2E Tests**: Cypress or Playwright for user flows

### Backend Tests
- **Unit Tests**: Jest for services, utilities
- **Integration Tests**: API endpoint testing with Supertest
- **Database Tests**: In-memory MongoDB for testing

### Testing Pyramid
```
        /\
       /E2E\        ← Few, slow, high-value
      /──────\
     /Integration\   ← Moderate, API contracts
    /──────────────\
   /  Unit Tests    \  ← Many, fast, isolated
  /──────────────────\
```

---

## Conclusion

This architecture is designed for:
- **Developer productivity**: Clear structure, consistent patterns
- **Maintainability**: Type safety, documentation, separation of concerns
- **Scalability**: Modular design, stateless backend, database indexing
- **Security**: Authentication, validation, error handling
- **Evolution**: Can grow into microservices if needed

The architecture is **pragmatic** rather than dogmatic—it uses proven patterns but allows flexibility for project-specific needs.

---

**Document Version**: 1.0  
**Last Updated**: December 31, 2025  
**Maintained By**: Ki8 Development Team
