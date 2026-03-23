# 🔄 Request Flow Diagrams

Visual representations of how data flows through the Ponsai application.

---

## 1️⃣ User Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER REGISTRATION                         │
└─────────────────────────────────────────────────────────────────┘

User fills form
    │
    ├── Name: "John Doe"
    ├── Email: "john@example.com"
    └── Password: "SecurePass123"
    │
    ▼
┌─────────────────────────┐
│  Register Component     │
│  (Angular)              │
│  ─────────────────────  │
│  • Validate form        │
│  • Call authService     │
└─────────────────────────┘
    │
    │ HTTP POST /api/v1/auth/register
    │ { name, email, password }
    ▼
┌─────────────────────────┐
│  Auth Interceptor       │
│  (No token needed)      │
└─────────────────────────┘
    │
    ▼
┌─────────────────────────┐
│  Backend API Server     │
│  ─────────────────────  │
│  • Receive request      │
│  • Validate input       │
└─────────────────────────┘
    │
    ▼
┌─────────────────────────┐
│  authController.ts      │
│  ─────────────────────  │
│  • Check if user exists │
│  • Hash password        │
│  • Create user          │
│  • Generate JWT token   │
└─────────────────────────┘
    │
    ▼
┌─────────────────────────┐
│  User Model (Mongoose)  │
│  ─────────────────────  │
│  • Save to MongoDB      │
│  • Pre-save hook:       │
│    bcrypt password      │
└─────────────────────────┘
    │
    ▼
┌─────────────────────────┐
│  MongoDB Database       │
│  ─────────────────────  │
│  Users collection       │
│  • Document created     │
└─────────────────────────┘
    │
    │ Return user data + token
    ▼
┌─────────────────────────┐
│  Response to Frontend   │
│  ─────────────────────  │
│  {                      │
│    success: true,       │
│    token: "eyJhbGc...", │
│    data: { id, name }   │
│  }                      │
└─────────────────────────┘
    │
    ▼
┌─────────────────────────┐
│  authService.ts         │
│  ─────────────────────  │
│  • Store token          │
│    localStorage         │
│  • Update user$ stream  │
└─────────────────────────┘
    │
    ▼
┌─────────────────────────┐
│  Component Updates      │
│  ─────────────────────  │
│  • Show success message │
│  • Redirect to home     │
│  • Update nav bar       │
└─────────────────────────┘
```

---

## 2️⃣ Protected API Request Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                   GET PRODUCTS (Authenticated)                   │
└─────────────────────────────────────────────────────────────────┘

User navigates to /shop
    │
    ▼
┌─────────────────────────┐
│  Shop Component         │
│  (Angular)              │
│  ─────────────────────  │
│  ngOnInit() {           │
│    loadProducts()       │
│  }                      │
└─────────────────────────┘
    │
    │ this.productService.getProducts()
    ▼
┌─────────────────────────┐
│  ProductService         │
│  ─────────────────────  │
│  • Build HTTP request   │
│  • Return Observable    │
└─────────────────────────┘
    │
    │ HTTP GET /api/v1/products?page=1&limit=12
    ▼
┌─────────────────────────┐
│  Auth Interceptor       │
│  ─────────────────────  │
│  • Get token from       │
│    localStorage         │
│  • Add header:          │
│    Authorization:       │
│    Bearer <token>       │
└─────────────────────────┘
    │
    │ Request with token
    ▼
┌─────────────────────────┐
│  Backend Server         │
│  ─────────────────────  │
│  • Route matching       │
│  • Middleware pipeline  │
└─────────────────────────┘
    │
    ▼
┌─────────────────────────┐
│  Auth Middleware        │
│  (middleware/auth.ts)   │
│  ─────────────────────  │
│  • Extract token        │
│  • Verify JWT           │
│  • Decode user info     │
│  • Attach to req.user   │
└─────────────────────────┘
    │
    │ ✓ Token valid
    ▼
┌─────────────────────────┐
│  productController.ts   │
│  ─────────────────────  │
│  • Extract query params │
│  • Build database query │
└─────────────────────────┘
    │
    ▼
┌─────────────────────────┐
│  Product Model          │
│  ─────────────────────  │
│  • Find products        │
│  • Apply filters        │
│  • Pagination           │
│  • Populate category    │
└─────────────────────────┘
    │
    ▼
┌─────────────────────────┐
│  MongoDB Query          │
│  ─────────────────────  │
│  db.products.find({})   │
│    .skip(0).limit(12)   │
│    .populate('category')│
└─────────────────────────┘
    │
    │ Return results
    ▼
┌─────────────────────────┐
│  Response to Frontend   │
│  ─────────────────────  │
│  {                      │
│    success: true,       │
│    count: 12,           │
│    total: 45,           │
│    page: 1,             │
│    data: [products]     │
│  }                      │
└─────────────────────────┘
    │
    ▼
┌─────────────────────────┐
│  Error Interceptor      │
│  ─────────────────────  │
│  • No errors, pass      │
│    through              │
└─────────────────────────┘
    │
    │ Observable emits
    ▼
┌─────────────────────────┐
│  Shop Component         │
│  ─────────────────────  │
│  • Receive products     │
│  • Update template      │
│  • Display grid         │
└─────────────────────────┘
    │
    ▼
┌─────────────────────────┐
│  User Sees Products     │
│  ─────────────────────  │
│  [Product 1] [Product 2]│
│  [Product 3] [Product 4]│
└─────────────────────────┘
```

---

## 3️⃣ Shopping Cart Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      ADD TO CART FLOW                            │
└─────────────────────────────────────────────────────────────────┘

User clicks "Add to Cart" on product
    │
    ▼
┌─────────────────────────┐
│  Product Card Component │
│  ─────────────────────  │
│  onAddToCart(product) { │
│    ...                  │
│  }                      │
└─────────────────────────┘
    │
    │ Emit event / call service
    ▼
┌─────────────────────────┐
│  CartService            │
│  (Signal-based)         │
│  ─────────────────────  │
│  addItem(product, qty)  │
└─────────────────────────┘
    │
    ├─→ Check if item exists in cart
    │   │
    │   ├─→ YES: Increment quantity
    │   │
    │   └─→ NO: Add new cart item
    │
    ▼
┌─────────────────────────┐
│  Update Signal          │
│  ─────────────────────  │
│  cartItems.set([...])   │
└─────────────────────────┘
    │
    ▼
┌─────────────────────────┐
│  Save to localStorage   │
│  ─────────────────────  │
│  localStorage.setItem(  │
│    'ponsai_cart',        │
│    JSON.stringify(cart) │
│  )                      │
└─────────────────────────┘
    │
    │ Signal updates automatically
    ▼
┌─────────────────────────┐
│  Cart Icon Component    │
│  ─────────────────────  │
│  • Badge updates        │
│  • Shows item count     │
└─────────────────────────┘
    │
    ▼
┌─────────────────────────┐
│  User Feedback          │
│  ─────────────────────  │
│  🛒 Cart (3)            │
│  "Item added!"          │
└─────────────────────────┘
```

---

## 4️⃣ Order Checkout Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     CHECKOUT & ORDER FLOW                        │
└─────────────────────────────────────────────────────────────────┘

User on Cart page → Click "Proceed to Checkout"
    │
    ▼
┌─────────────────────────┐
│  Auth Guard             │
│  ─────────────────────  │
│  • Check if logged in   │
└─────────────────────────┘
    │
    ├─→ NOT LOGGED IN
    │   │
    │   └─→ Redirect to /auth/login?returnUrl=/checkout
    │
    └─→ LOGGED IN
        │
        ▼
┌─────────────────────────┐
│  Checkout Component     │
│  ─────────────────────  │
│  • Show cart summary    │
│  • Shipping form        │
│  • Payment method       │
└─────────────────────────┘
    │
    │ User fills form
    │ • Address
    │ • Payment details
    │
    │ Clicks "Place Order"
    ▼
┌─────────────────────────┐
│  Checkout Component     │
│  ─────────────────────  │
│  onSubmit() {           │
│    const order = {      │
│      items: cart,       │
│      address: form,     │
│      total: calc()      │
│    };                   │
│    orderService.create()│
│  }                      │
└─────────────────────────┘
    │
    │ HTTP POST /api/v1/orders
    │ { items, address, total }
    ▼
┌─────────────────────────┐
│  Auth Interceptor       │
│  ─────────────────────  │
│  • Add JWT token        │
└─────────────────────────┘
    │
    ▼
┌─────────────────────────┐
│  Backend: Auth          │
│  ─────────────────────  │
│  • Verify token         │
│  • Get user ID          │
└─────────────────────────┘
    │
    ▼
┌─────────────────────────┐
│  orderController.ts     │
│  ─────────────────────  │
│  • Validate order       │
│  • Check stock          │
│  • Calculate total      │
└─────────────────────────┘
    │
    ▼
┌─────────────────────────┐
│  Order Model            │
│  ─────────────────────  │
│  • Create order doc     │
│  • Set status: pending  │
│  • Save to DB           │
└─────────────────────────┘
    │
    ▼
┌─────────────────────────┐
│  MongoDB                │
│  ─────────────────────  │
│  • Orders collection    │
│  • New document saved   │
└─────────────────────────┘
    │
    │ (Future: Process payment)
    │ (Future: Send email)
    │ (Future: Update inventory)
    │
    │ Return order
    ▼
┌─────────────────────────┐
│  Response to Frontend   │
│  ─────────────────────  │
│  {                      │
│    success: true,       │
│    data: {              │
│      _id: "...",        │
│      status: "pending"  │
│    }                    │
│  }                      │
└─────────────────────────┘
    │
    ▼
┌─────────────────────────┐
│  Checkout Component     │
│  ─────────────────────  │
│  • Clear cart           │
│  • Show success         │
│  • Redirect to          │
│    /thank-you           │
└─────────────────────────┘
    │
    ▼
┌─────────────────────────┐
│  Thank You Page         │
│  ─────────────────────  │
│  "Order placed! 🎉"     │
│  Order #12345           │
│  Expected: 3-5 days     │
└─────────────────────────┘
```

---

## 5️⃣ Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        ERROR HANDLING                            │
└─────────────────────────────────────────────────────────────────┘

Request fails (network, auth, validation, server error)
    │
    ▼
┌─────────────────────────┐
│  Error Occurs           │
│  ─────────────────────  │
│  • Network timeout      │
│  • 401 Unauthorized     │
│  • 404 Not Found        │
│  • 500 Server Error     │
└─────────────────────────┘
    │
    │ Observable throws error
    ▼
┌─────────────────────────┐
│  Error Interceptor      │
│  (Frontend)             │
│  ─────────────────────  │
│  catchError((error) => {│
│    // Log error         │
│    // Show user message │
│    return throwError()  │
│  })                     │
└─────────────────────────┘
    │
    ├─→ 401 Unauthorized
    │   │
    │   └─→ Redirect to login
    │
    ├─→ 404 Not Found
    │   │
    │   └─→ Show "Not found" message
    │
    ├─→ 500 Server Error
    │   │
    │   └─→ Show "Something went wrong"
    │
    └─→ Network Error
        │
        └─→ Show "Check connection"
    │
    ▼
┌─────────────────────────┐
│  Component Handles      │
│  ─────────────────────  │
│  .subscribe({           │
│    error: (err) => {    │
│      // Show toast      │
│      // Reset form      │
│    }                    │
│  })                     │
└─────────────────────────┘
    │
    ▼
┌─────────────────────────┐
│  User Sees Error        │
│  ─────────────────────  │
│  ❌ "Login failed"      │
│  ❌ "Product not found" │
│  ❌ "Server error"      │
└─────────────────────────┘

─────────────────────────────────────────

Backend Error Flow:
    │
    ▼
┌─────────────────────────┐
│  Error Occurs           │
│  ─────────────────────  │
│  • Validation error     │
│  • Database error       │
│  • Business logic error │
└─────────────────────────┘
    │
    │ throw new AppError()
    │ or next(error)
    ▼
┌─────────────────────────┐
│  Error Middleware       │
│  (middleware/           │
│   errorHandler.ts)      │
│  ─────────────────────  │
│  • Check error type     │
│  • Sanitize message     │
│  • Set status code      │
└─────────────────────────┘
    │
    ├─→ Mongoose ValidationError
    │   └─→ 400 Bad Request
    │
    ├─→ Mongoose CastError
    │   └─→ 404 Not Found
    │
    ├─→ AppError (custom)
    │   └─→ Use specified status
    │
    └─→ Unknown Error
        └─→ 500 Internal Server Error
    │
    ▼
┌─────────────────────────┐
│  Response               │
│  ─────────────────────  │
│  {                      │
│    success: false,      │
│    error: "Message",    │
│    stack: (dev only)    │
│  }                      │
└─────────────────────────┘
```

---

## 6️⃣ Data Flow Summary

```
┌───────────────────────────────────────────────────────────────┐
│                    COMPLETE DATA FLOW                         │
└───────────────────────────────────────────────────────────────┘

    ┌─────────────┐
    │    USER     │
    └──────┬──────┘
           │
           │ Interacts with
           ▼
    ┌─────────────────────┐
    │  Angular Component  │
    │  ─────────────────  │
    │  • User actions     │
    │  • Template events  │
    └──────┬──────────────┘
           │
           │ Calls
           ▼
    ┌─────────────────────┐
    │  Angular Service    │
    │  ─────────────────  │
    │  • Business logic   │
    │  • HTTP calls       │
    └──────┬──────────────┘
           │
           │ HTTP Request
           ▼
    ┌─────────────────────┐
    │  HTTP Interceptor   │
    │  ─────────────────  │
    │  • Add auth token   │
    │  • Handle errors    │
    └──────┬──────────────┘
           │
           │ To backend
           ▼
    ┌─────────────────────┐
    │  Express Middleware │
    │  ─────────────────  │
    │  • CORS             │
    │  • Body parsing     │
    │  • Authentication   │
    └──────┬──────────────┘
           │
           │ Route matched
           ▼
    ┌─────────────────────┐
    │  Controller         │
    │  ─────────────────  │
    │  • Request handling │
    │  • Validation       │
    └──────┬──────────────┘
           │
           │ Database query
           ▼
    ┌─────────────────────┐
    │  Mongoose Model     │
    │  ─────────────────  │
    │  • Schema           │
    │  • Validation       │
    │  • Methods          │
    └──────┬──────────────┘
           │
           │ Query database
           ▼
    ┌─────────────────────┐
    │  MongoDB            │
    │  ─────────────────  │
    │  • Store data       │
    │  • Return results   │
    └──────┬──────────────┘
           │
           │ Results
           ▼
    [Flow returns up the chain]
           │
           ▼
    ┌─────────────────────┐
    │  Component          │
    │  ─────────────────  │
    │  • Update view      │
    │  • Show data        │
    └──────┬──────────────┘
           │
           ▼
    ┌─────────────┐
    │    USER     │
    │  Sees result│
    └─────────────┘
```

---

## 🔄 Middleware Pipeline (Backend)

```
Incoming Request
    │
    ▼
┌────────────────┐
│ Express App    │
└────────┬───────┘
         │
         ├─→ helmet()              → Security headers
         │
         ├─→ cors()                → CORS handling
         │
         ├─→ compression()         → Response compression
         │
         ├─→ express.json()        → Parse JSON body
         │
         ├─→ express.urlencoded()  → Parse URL-encoded
         │
         ├─→ morgan()              → Logging
         │
         ▼
┌────────────────┐
│ Route Matching │
└────────┬───────┘
         │
         ▼
┌────────────────┐
│ Route-Specific │
│ Middleware     │
└────────┬───────┘
         │
         ├─→ protect()            → Auth check (if needed)
         │
         ├─→ authorize('admin')   → Role check (if needed)
         │
         ▼
┌────────────────┐
│ Controller     │
│ Handler        │
└────────┬───────┘
         │
         ▼
Response or Error
         │
         ├─→ Success → Send response
         │
         └─→ Error → errorHandler middleware
```

---

## 📊 Request Types Summary

| Request Type | Auth Required | Example | Response |
|--------------|---------------|---------|----------|
| **Public GET** | ❌ No | GET /products | Product list |
| **Public POST** | ❌ No | POST /auth/register | User + token |
| **Protected GET** | ✅ Yes | GET /auth/me | Current user |
| **Protected POST** | ✅ Yes | POST /orders | New order |
| **Admin Only** | ✅ Yes + Admin | POST /products | New product |

---

**Use these diagrams to understand the flow of data through your application!**

*Last Updated: December 31, 2025*


