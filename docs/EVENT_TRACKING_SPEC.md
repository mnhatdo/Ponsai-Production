# Event Tracking Specification - Minimal Behavioral Layer

**Purpose:** Unlock conversion funnel and abandonment analytics with minimal tracking overhead  
**Philosophy:** Track only what's needed for business decisions, not vanity metrics  
**Approach:** Server-side persistence, client-side triggers, defensive data quality

---

## Step 1: Behavioral Blind Spot Analysis

### Critical Business Questions We Cannot Answer Today

#### 1. "Where do users drop off in the purchase flow?"

**Current Blind Spot:**
- Can only see: `Order Created → Order Paid`
- Cannot see: `View Product → Add to Cart → Start Checkout → Attempt Payment`

**Why Critical:**
- If 1000 users view products but only 10 buy, we need to know where the 990 leave
- Optimizing the wrong step wastes development effort

**Minimal Events Required:**
- ✅ `product_viewed` - User lands on product detail page
- ✅ `cart_modified` - User adds/removes items (captures add-to-cart rate)
- ✅ `checkout_started` - User clicks "Proceed to Checkout"
- ✅ `payment_attempted` - User clicks "Pay Now" (before payment gateway)

**Impact:** Enables 4-step funnel analysis, identifies biggest drop-off point

---

#### 2. "What % of carts are abandoned and why?"

**Current Blind Spot:**
- Carts are wiped after checkout
- No visibility into users who add items but never checkout

**Why Critical:**
- Cart abandonment rate in e-commerce averages 60-80%
- High-value abandoned carts = lost revenue opportunity

**Minimal Events Required:**
- ✅ `cart_modified` (already listed above)
- ✅ `checkout_started` (already listed above)

**Impact:** Calculate `(Carts Created - Checkouts Started) / Carts Created`

---

#### 3. "Which products are viewed but not purchased?"

**Current Blind Spot:**
- Can see which products sold (from Order.items)
- Cannot see which products were viewed but didn't convert

**Why Critical:**
- Low conversion could mean: bad price, unclear description, poor images
- Cannot optimize without knowing which products have the issue

**Minimal Events Required:**
- ✅ `product_viewed` (already listed above)

**Impact:** Calculate view-to-purchase ratio per product

---

#### 4. "How long do users take between adding to cart and purchasing?"

**Current Blind Spot:**
- No timestamp for when cart was first created
- Cart.updatedAt changes on every modification

**Why Critical:**
- Identifies "slow decision makers" (potential for abandoned cart emails)
- Understand purchase urgency patterns

**Minimal Events Required:**
- ✅ `cart_modified` with `isFirstItem` flag (already listed above)

**Impact:** Time-to-purchase analysis, abandoned cart retargeting strategy

---

### Questions That Are NOT Critical (Excluded)

**"Which page did users come from?"** → Referrer tracking, session reconstruction
- **Why Excluded:** Requires session IDs, complex user journey tracking
- **ROI:** Low (unless running paid ads)

**"How long do users spend on product pages?"** → Time-on-page tracking
- **Why Excluded:** Inaccurate (users leave tabs open), high data volume
- **ROI:** Low (doesn't correlate with purchase intent)

**"Which button did they click?"** → Click tracking, heatmaps
- **Why Excluded:** Vanity metric, high cardinality
- **ROI:** Low (use A/B testing instead)

---

## Step 2: Event Contract Design

### Event 1: `product_viewed`

**Business Question:** "Which products are popular? What's the view-to-purchase ratio?"

**Trigger Condition:**
- **Frontend:** User lands on product detail page (`/shop/product/:id`)
- **Backend:** Endpoint `GET /api/v1/products/:id` returns 200
- **Timing:** After product data loads successfully

**Required Properties:**
```typescript
{
  eventType: 'product_viewed',
  productId: string,          // ObjectId
  userId?: string,            // ObjectId (if authenticated)
  sessionId: string,          // Client-generated UUID
  timestamp: Date,            // Server timestamp
  source: 'web' | 'mobile',   // Platform
  metadata?: {
    categoryId?: string,      // For category-level analysis
    price: number,            // Snapshot of price at view time
    inStock: boolean          // Was it available?
  }
}
```

**Source of Truth:** 
- **Primary:** Backend (logged on API response)
- **Fallback:** Frontend (if backend logging fails, send async)

**Implementation:**
```typescript
// Backend: productController.getProductById()
await Event.create({
  eventType: 'product_viewed',
  productId: product._id,
  userId: req.user?.id,
  sessionId: req.headers['x-session-id'],
  timestamp: new Date(),
  source: 'web',
  metadata: {
    categoryId: product.category,
    price: product.price,
    inStock: product.inStock
  }
});
```

**Failure Modes:**
- ⚠️ **Bot traffic:** Product views may include crawlers
  - Mitigation: Filter by sessionId length, user-agent patterns
- ⚠️ **Page refresh spam:** User refreshes → multiple views
  - Mitigation: Deduplicate within 5-minute window per sessionId+productId
- ⚠️ **Async logging fails:** Event not persisted
  - Mitigation: Non-blocking (don't fail product API), log errors

**Data Loss Risk:** LOW (product views are high-volume, losing 1-2% is acceptable)

---

### Event 2: `cart_modified`

**Business Question:** "What % of product views convert to cart adds? When do users abandon carts?"

**Trigger Condition:**
- **Frontend:** User clicks "Add to Cart" or "Remove from Cart"
- **Backend:** `POST /api/v1/cart/add` or `DELETE /api/v1/cart/remove/:id` succeeds
- **Timing:** After cart is successfully updated in database

**Required Properties:**
```typescript
{
  eventType: 'cart_modified',
  action: 'add' | 'remove' | 'update_quantity',
  userId?: string,            // ObjectId (if authenticated)
  sessionId: string,          // Client-generated UUID
  productId: string,          // Product being modified
  quantity: number,           // New quantity
  cartTotal: number,          // Total cart value after modification
  itemCount: number,          // Total items in cart
  isFirstItem: boolean,       // Is this the first item added to cart?
  timestamp: Date,            // Server timestamp
  metadata?: {
    previousQuantity?: number, // For update_quantity action
    price: number              // Product price at time of add
  }
}
```

**Source of Truth:** Backend (cartController.addToCart, removeFromCart)

**Implementation:**
```typescript
// Backend: cartController.addToCart()
const isFirstItem = cart.items.length === 0;

// Add product to cart...
await cart.save();

await Event.create({
  eventType: 'cart_modified',
  action: 'add',
  userId: req.user?.id,
  sessionId: req.headers['x-session-id'],
  productId: productId,
  quantity: quantity,
  cartTotal: cart.calculateTotal(),
  itemCount: cart.getItemCount(),
  isFirstItem: isFirstItem,
  timestamp: new Date(),
  metadata: {
    price: product.price
  }
});
```

**Failure Modes:**
- ⚠️ **Race condition:** Cart state changes between read and event log
  - Mitigation: Log AFTER cart.save() completes
- ⚠️ **Anonymous users:** No userId (guest checkout)
  - Mitigation: Use sessionId as fallback (requires persistent sessions)

**Data Loss Risk:** MEDIUM (cart actions are critical, losing >1% is problematic)

**Deduplication Strategy:**
- No deduplication (each add/remove is intentional)
- Track rapid add/remove cycles (may indicate UI issues)

---

### Event 3: `checkout_started`

**Business Question:** "What % of carts convert to checkout? What's the cart abandonment rate?"

**Trigger Condition:**
- **Frontend:** User clicks "Proceed to Checkout" button
- **Backend:** User lands on `/checkout` page OR Order created with status='pending'
- **Timing:** Immediately when checkout flow begins

**Required Properties:**
```typescript
{
  eventType: 'checkout_started',
  userId?: string,            // ObjectId (if authenticated)
  sessionId: string,          // Client-generated UUID
  cartTotal: number,          // Total value of cart
  itemCount: number,          // Number of items
  items: Array<{              // Snapshot of cart items
    productId: string,
    quantity: number,
    price: number
  }>,
  timestamp: Date,            // Server timestamp
  metadata?: {
    previousCartModified?: Date, // Time since last cart change (dwell time)
    paymentMethodPreselected?: string // If user selected method before checkout
  }
}
```

**Source of Truth:** Backend (triggered when Order is created OR checkout page loads)

**Implementation Option 1 (Order Creation):**
```typescript
// Backend: orderController.createOrder()
// BEFORE creating order, log checkout_started
await Event.create({
  eventType: 'checkout_started',
  userId: req.user?.id,
  sessionId: req.headers['x-session-id'],
  cartTotal: totalAmount,
  itemCount: orderItems.length,
  items: orderItems,
  timestamp: new Date()
});

// Then create order...
```

**Implementation Option 2 (Checkout Page Load):**
```typescript
// Backend: checkoutController.getCheckoutPage() [if exists]
// OR Frontend: Send event when /checkout loads
await Event.create({
  eventType: 'checkout_started',
  userId: req.user?.id,
  sessionId: req.headers['x-session-id'],
  cartTotal: cart.calculateTotal(),
  itemCount: cart.getItemCount(),
  items: cart.items,
  timestamp: new Date()
});
```

**Failure Modes:**
- ⚠️ **Double-counting:** User refreshes checkout page
  - Mitigation: Deduplicate within 10-minute window per sessionId
- ⚠️ **Never completes:** User starts checkout but never creates order
  - This is DESIRED behavior (captures true abandonment)

**Data Loss Risk:** LOW-MEDIUM (checkout starts are critical, but order creation is fallback)

---

### Event 4: `payment_attempted`

**Business Question:** "How many users fail payment before order creation? True payment gateway failure rate?"

**Trigger Condition:**
- **Frontend:** User clicks "Pay Now" button
- **Backend:** Payment initiation request sent to gateway (MOMO, bank transfer, etc.)
- **Timing:** BEFORE order is created (fills blind spot from Wave 1)

**Required Properties:**
```typescript
{
  eventType: 'payment_attempted',
  userId?: string,            // ObjectId
  sessionId: string,          // UUID
  orderId?: string,           // ObjectId (if order already created)
  paymentMethod: 'momo' | 'manual_payment' | 'cod' | 'card' | 'bank_transfer',
  amount: number,             // Payment amount
  currency: 'USD' | 'VND',    // Currency
  timestamp: Date,            // Server timestamp
  metadata?: {
    gatewayRequestId?: string,   // MOMO requestId, etc.
    gatewayResponse?: string,    // Initial response status
    errorCode?: string,          // If immediate failure
    errorMessage?: string        // Error description
  }
}
```

**Source of Truth:** Backend (paymentController.initiateMomoPayment, etc.)

**Implementation:**
```typescript
// Backend: paymentController.initiateMomoPayment()
const attemptEvent = await Event.create({
  eventType: 'payment_attempted',
  userId: req.user?.id,
  sessionId: req.headers['x-session-id'],
  orderId: order._id,
  paymentMethod: 'momo',
  amount: amountVND,
  currency: 'VND',
  timestamp: new Date(),
  metadata: {
    gatewayRequestId: momoResponse.requestId
  }
});

// Send request to MOMO...
// If MOMO returns error immediately:
if (!momoResponse.success) {
  await Event.findByIdAndUpdate(attemptEvent._id, {
    'metadata.errorCode': momoResponse.errorCode,
    'metadata.errorMessage': momoResponse.message
  });
}
```

**Failure Modes:**
- ⚠️ **User never receives gateway response:** Browser closed, network error
  - Mitigation: Mark as "abandoned" if no corresponding order created within 30 minutes
- ⚠️ **Gateway timeout:** No immediate response
  - Mitigation: Log attempt, wait for IPN callback to resolve

**Data Loss Risk:** HIGH (payment attempts are critical for revenue analysis)

**Idempotency:** 
- If user clicks "Pay Now" multiple times → multiple events (intentional, shows UI issue)
- Deduplicate by orderId+paymentMethod if needed

---

## Step 3: Trust & Scope Boundaries

### What These Events WILL Enable

#### ✅ Conversion Funnel Analysis
**New Analytics Possible:**
- Product View → Add-to-Cart Rate (per product)
- Cart → Checkout Conversion Rate
- Checkout → Payment Attempt Rate
- Payment Attempt → Order Success Rate (combined with existing Order data)

**Business Questions Answered:**
- "Where do we lose the most users?" (identify bottleneck)
- "Which step has the worst conversion?" (prioritize optimization)
- "What's the full purchase funnel efficiency?" (end-to-end view)

**Implementation:**
```typescript
// Analytics endpoint: GET /api/v1/admin/analytics/funnel
{
  productViews: 1000,
  cartAdds: 300,          // 30% add-to-cart rate
  checkoutStarts: 120,    // 40% cart-to-checkout rate
  paymentAttempts: 100,   // 83% checkout-to-payment rate
  ordersPaid: 85          // 85% payment success rate
}
// Overall conversion: 8.5% (view-to-purchase)
```

---

#### ✅ Cart Abandonment Metrics
**New Analytics Possible:**
- Abandoned Cart Rate: `(Cart Adds - Checkout Starts) / Cart Adds`
- Average Abandoned Cart Value (from `cartTotal` in events)
- Time-to-Abandon (time between `cart_modified` and `checkout_started`)

**Business Questions Answered:**
- "What % of carts are abandoned?"
- "What's the value of abandoned carts this month?"
- "How long do users wait before abandoning?" (identifies slow decision makers)

**Use Case:** 
- Send abandoned cart emails after 24h (if cart value > $50)
- Prioritize high-value abandonments

---

#### ✅ Product Performance (View-to-Purchase)
**New Analytics Possible:**
- View Count per product (from `product_viewed`)
- Add-to-Cart Rate: `Cart Adds / Product Views`
- Purchase Conversion: `Orders with Product / Product Views`

**Business Questions Answered:**
- "Which products are viewed a lot but don't sell?" (pricing/description issues)
- "Which products have high conversion?" (merchandising insights)
- "Are featured products actually driving engagement?" (validate promotions)

---

#### ✅ Payment Gateway True Failure Rate
**New Analytics Possible:**
- Payment Attempt Rate: `Payment Attempts / Checkout Starts`
- Payment Gateway Failure Rate: `(Attempts - Orders Created) / Attempts`
- Failure Reasons (from `metadata.errorCode`)

**Business Questions Answered:**
- "What % of users who click 'Pay' never create an order?" (true failure rate)
- "Which payment method has the most pre-order failures?" (gateway comparison)
- "What are common error codes?" (technical debt prioritization)

**Impact:** Fills Wave 1 blind spot (only saw orders created, not all attempts)

---

### What These Events WILL NOT Enable

#### ❌ Marketing Attribution
**Still Missing:**
- UTM parameters (source, medium, campaign)
- Referrer tracking
- User.acquisitionSource

**Why Not Included:**
- Requires different system (middleware to capture query params)
- Not directly related to conversion funnel
- Lower priority than understanding why users abandon

**When to Add:** Phase 3 (after funnel optimization complete)

---

#### ❌ User Engagement (DAU/MAU)
**Still Missing:**
- Login events
- User.lastLoginAt
- Session duration

**Why Not Included:**
- Not needed for conversion analysis
- Can infer "active users" from product_viewed events (loose proxy)

**When to Add:** Phase 3 (for product analytics, not revenue analytics)

---

#### ❌ Content Performance (Blog → Purchase)
**Still Missing:**
- Referrer tracking for blog posts
- Session journey reconstruction
- Cross-page navigation tracking

**Why Not Included:**
- Requires session-based tracking
- Blog is not primary conversion driver (based on current project state)

**When to Add:** Phase 4 (if blog becomes critical to growth)

---

#### ❌ A/B Testing Data
**Still Missing:**
- Variant assignments
- Test group tracking
- Statistical significance calculations

**Why Not Included:**
- Requires A/B test framework (separate system)
- Events alone don't enable A/B testing

**When to Add:** Phase 5 (after funnel is optimized via current events)

---

### Metrics That Should REMAIN Excluded (Even with Events)

#### 1. "Time Spent on Page"
**Why Excluded:**
- Inaccurate (users leave tabs open, step away from computer)
- High data volume (need heartbeat pings)
- Doesn't correlate with purchase intent

**Alternative:** Use "checkout_started within X minutes of product_viewed" as proxy for "quick decision"

---

#### 2. "Scroll Depth" or "Click Heatmaps"
**Why Excluded:**
- Vanity metrics (interesting but not actionable)
- High cardinality (every scroll position, every click)
- Better solved by user testing, not analytics

---

#### 3. "Which Search Terms Led to Views"
**Why Excluded:**
- Requires search query logging (not implemented)
- Low priority (catalog is curated, not search-driven)

**When to Add:** If search becomes primary navigation method

---

## Event Schema Implementation

### Database Collection: `Event`

```typescript
// backend/src/models/Event.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IEvent extends Document {
  eventType: 'product_viewed' | 'cart_modified' | 'checkout_started' | 'payment_attempted';
  
  // Identifiers
  userId?: mongoose.Types.ObjectId;  // Authenticated user
  sessionId: string;                 // Client-generated UUID (required)
  
  // Context (varies by event type)
  productId?: mongoose.Types.ObjectId;
  orderId?: mongoose.Types.ObjectId;
  
  // Event-specific data (use discriminated unions in TS)
  action?: 'add' | 'remove' | 'update_quantity';  // cart_modified only
  paymentMethod?: string;                          // payment_attempted only
  amount?: number;                                 // payment_attempted only
  cartTotal?: number;                              // cart_modified, checkout_started
  itemCount?: number;                              // cart_modified, checkout_started
  
  // Metadata (flexible JSON)
  metadata?: any;
  
  // Timestamps
  timestamp: Date;  // Server timestamp (source of truth)
  createdAt: Date;  // Auto-generated
}

const EventSchema: Schema = new Schema(
  {
    eventType: {
      type: String,
      enum: ['product_viewed', 'cart_modified', 'checkout_started', 'payment_attempted'],
      required: true,
      index: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true  // For per-user analysis
    },
    sessionId: {
      type: String,
      required: true,
      index: true  // For session-based funnel
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      index: true  // For product performance
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order'
    },
    action: {
      type: String,
      enum: ['add', 'remove', 'update_quantity']
    },
    paymentMethod: {
      type: String
    },
    amount: {
      type: Number
    },
    cartTotal: {
      type: Number
    },
    itemCount: {
      type: Number
    },
    metadata: {
      type: Schema.Types.Mixed
    },
    timestamp: {
      type: Date,
      required: true,
      index: true  // For time-based queries
    }
  },
  {
    timestamps: true  // createdAt, updatedAt
  }
);

// Compound indexes for common queries
EventSchema.index({ eventType: 1, timestamp: -1 });          // Funnel queries
EventSchema.index({ sessionId: 1, timestamp: 1 });           // Session journey
EventSchema.index({ productId: 1, eventType: 1 });           // Product performance
EventSchema.index({ userId: 1, eventType: 1, timestamp: -1 }); // User behavior

// TTL: Auto-delete events older than 90 days (GDPR compliance, storage optimization)
EventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export default mongoose.model<IEvent>('Event', EventSchema);
```

---

## Event Logging Best Practices

### 1. Non-Blocking (Async)
```typescript
// DON'T block user-facing API
await Event.create({ ... });  // ❌ Blocks response

// DO fire-and-forget
Event.create({ ... }).catch(err => {
  console.error('Event logging failed:', err);
  // Send to error tracking (Sentry, etc.)
});
```

### 2. Deduplication Strategy
```typescript
// For product_viewed: Deduplicate within 5 minutes
const recentView = await Event.findOne({
  eventType: 'product_viewed',
  sessionId: sessionId,
  productId: productId,
  timestamp: { $gte: new Date(Date.now() - 5 * 60 * 1000) }
});

if (!recentView) {
  await Event.create({ ... });
}
```

### 3. Failure Handling
```typescript
// Log errors but don't fail user request
try {
  await Event.create({ ... });
} catch (error) {
  console.error('Event creation failed:', error);
  // Optional: Send to monitoring service
  // DO NOT throw error to user
}
```

### 4. Session ID Generation
```typescript
// Frontend (on app load)
let sessionId = localStorage.getItem('sessionId');
if (!sessionId) {
  sessionId = crypto.randomUUID();  // Browser-native UUID
  localStorage.setItem('sessionId', sessionId);
}

// Send in all API requests
axios.defaults.headers.common['X-Session-ID'] = sessionId;
```

---

## Data Quality Safeguards

### Bot Traffic Filtering
```typescript
// In Event creation logic
const isLikelyBot = (userAgent: string) => {
  const botPatterns = /bot|crawler|spider|scraper/i;
  return botPatterns.test(userAgent);
};

if (isLikelyBot(req.headers['user-agent'])) {
  return; // Don't log bot events
}
```

### Anonymous vs Authenticated
```typescript
// Always prefer userId if available
const eventUserId = req.user?.id || undefined;

// Fallback to sessionId for anonymous users
// Later, can merge sessions after login
```

### Timestamp Source of Truth
```typescript
// ALWAYS use server timestamp (not client time)
timestamp: new Date()  // Server time zone
// NOT: timestamp: new Date(req.body.timestamp)  // Client could manipulate
```

---

## Analytics Queries Enabled

### Funnel Analysis (Session-Based)
```typescript
// GET /api/v1/admin/analytics/funnel
const funnel = await Event.aggregate([
  {
    $match: {
      timestamp: { $gte: dateStart, $lte: dateEnd }
    }
  },
  {
    $group: {
      _id: '$sessionId',
      events: { $push: { type: '$eventType', time: '$timestamp' } }
    }
  },
  // Count sessions at each stage
  {
    $facet: {
      views: [
        { $match: { 'events.type': 'product_viewed' } },
        { $count: 'count' }
      ],
      cartAdds: [
        { $match: { 'events.type': 'cart_modified' } },
        { $count: 'count' }
      ],
      checkouts: [
        { $match: { 'events.type': 'checkout_started' } },
        { $count: 'count' }
      ],
      paymentAttempts: [
        { $match: { 'events.type': 'payment_attempted' } },
        { $count: 'count' }
      ]
    }
  }
]);

// Combine with Order data for final conversion
const ordersPaid = await Order.countDocuments({
  paymentStatus: 'paid',
  createdAt: { $gte: dateStart, $lte: dateEnd }
});
```

### Abandoned Cart Analysis
```typescript
// Sessions with cart_modified but no checkout_started
const abandonedCarts = await Event.aggregate([
  {
    $match: {
      eventType: { $in: ['cart_modified', 'checkout_started'] }
    }
  },
  {
    $group: {
      _id: '$sessionId',
      hasCartAdd: { $max: { $cond: [{ $eq: ['$eventType', 'cart_modified'] }, 1, 0] } },
      hasCheckout: { $max: { $cond: [{ $eq: ['$eventType', 'checkout_started'] }, 1, 0] } },
      lastCartTotal: { $last: '$cartTotal' }
    }
  },
  {
    $match: {
      hasCartAdd: 1,
      hasCheckout: 0
    }
  }
]);
```

### Product View-to-Purchase Ratio
```typescript
// Per product
const productPerformance = await Event.aggregate([
  {
    $match: {
      eventType: 'product_viewed',
      productId: { $exists: true }
    }
  },
  {
    $group: {
      _id: '$productId',
      viewCount: { $sum: 1 },
      uniqueSessions: { $addToSet: '$sessionId' }
    }
  },
  {
    $lookup: {
      from: 'orders',
      let: { productId: '$_id' },
      pipeline: [
        { $unwind: '$items' },
        { $match: { $expr: { $eq: ['$items.product', '$$productId'] }, paymentStatus: 'paid' } },
        { $count: 'purchaseCount' }
      ],
      as: 'purchases'
    }
  }
]);
```

---

## What We Are Still Blind To, And Why

### 1. User Journey Across Sessions
**What We Don't Know:**
- "Did a user view product A on Monday, come back Tuesday, and buy?"
- "How many sessions does it take before a user purchases?"

**Why We're Blind:**
- No cross-session user identity (anonymous users have different sessionIds)
- No persistent user tracking before login

**To Unblock:**
- Implement session merging (merge sessionIds after user logs in)
- Track returning anonymous users (via cookie, but privacy concerns)

**Priority:** LOW (most purchases happen in single session for e-commerce)

---

### 2. Why Users Abandon (Qualitative Reasons)
**What We Don't Know:**
- "Was price too high?"
- "Was shipping cost a surprise?"
- "Was checkout form too long?"

**Why We're Blind:**
- Events track WHAT happened, not WHY
- Cannot infer intent from behavior alone

**To Unblock:**
- Exit surveys ("Why didn't you complete purchase?")
- User testing sessions
- Heatmaps/session recordings (Hotjar, FullStory)

**Priority:** MEDIUM (qualitative research complements quantitative events)

---

### 3. External Traffic Sources
**What We Don't Know:**
- "Did user come from Google, Facebook, email campaign?"
- "Which channel has best conversion rate?"

**Why We're Blind:**
- No UTM parameter capture
- No referrer logging

**To Unblock:**
- Middleware to extract UTM params from query string
- Store in User.acquisitionSource or Order.campaign

**Priority:** HIGH (if running paid ads), LOW (if organic-only)

---

### 4. Impact of Content (Blog, Reviews)
**What We Don't Know:**
- "Do users who read blog posts buy more?"
- "Does product description influence purchase?"

**Why We're Blind:**
- No referrer tracking from blog to product pages
- No content engagement events (scroll depth, time-on-page)

**To Unblock:**
- Session-based journey tracking
- Content interaction events (read_blog, view_review)

**Priority:** LOW (content is not primary conversion driver)

---

### 5. Device & Browser Performance
**What We Don't Know:**
- "Do mobile users abandon more than desktop?"
- "Does Safari have issues that Chrome doesn't?"

**Why We're Blind:**
- No device/browser tracking in events

**To Unblock:**
- Add `metadata.device`, `metadata.browser` to events
- Use User-Agent parsing

**Priority:** MEDIUM (useful if conversion rates are poor, but not immediate)

---

## Implementation Checklist

**Phase 1: Backend Infrastructure (Week 1)**
- [ ] Create Event model with schema
- [ ] Add indexes for performance
- [ ] Implement TTL for 90-day retention
- [ ] Add event creation helpers (non-blocking, error handling)

**Phase 2: Frontend Session Tracking (Week 1)**
- [ ] Generate sessionId on app load (store in localStorage)
- [ ] Send X-Session-ID header in all API requests
- [ ] Add session persistence (survive page refresh)

**Phase 3: Event Integration (Week 2)**
- [ ] `product_viewed` - productController.getProductById()
- [ ] `cart_modified` - cartController.addToCart(), removeFromCart()
- [ ] `checkout_started` - orderController.createOrder() (before order creation)
- [ ] `payment_attempted` - paymentController.initiateMomoPayment(), etc.

**Phase 4: Analytics Layer (Week 2)**
- [ ] Funnel analysis endpoint
- [ ] Abandoned cart metrics endpoint
- [ ] Product view-to-purchase endpoint
- [ ] Payment attempt success rate

**Phase 5: Data Quality (Week 3)**
- [ ] Bot filtering (User-Agent patterns)
- [ ] Deduplication logic (product views within 5 min)
- [ ] Event validation (required fields check)
- [ ] Monitoring (event creation failures, volume anomalies)

---

## Success Metrics for Event Tracking

**Data Quality:**
- ✅ <1% event creation failures
- ✅ >95% of sessions have sessionId
- ✅ Bot traffic filtered (<5% of product_viewed events)

**Business Value:**
- ✅ Identify biggest funnel drop-off point within 1 week of launch
- ✅ Measure cart abandonment rate (baseline established)
- ✅ Calculate view-to-purchase ratio for top 20 products

**Performance:**
- ✅ Event logging doesn't slow down API responses (< +10ms overhead)
- ✅ Event queries return in <2s for last 30 days

---

## Principle: Minimal but Sufficient

**Why Only 4 Events?**
1. **product_viewed** - Entry point (awareness)
2. **cart_modified** - Consideration signal (intent)
3. **checkout_started** - Decision point (commitment)
4. **payment_attempted** - Final hurdle (action)

**What About:**
- "category_viewed"? → Not needed (product_viewed has categoryId in metadata)
- "search_executed"? → Not primary navigation (curated catalog)
- "review_read"? → Not critical (no review system yet)

**Philosophy:**
> Track the minimum required to answer critical business questions.
> Add events later when specific needs arise, not speculatively.

---

## Conclusion

These 4 events unlock **conversion funnel analysis** and **cart abandonment metrics** — the two highest-ROI analytics for e-commerce.

**What Changes:**
- ❌ Before: "We know 85 orders were paid this month"
- ✅ After: "We know 1000 users viewed products, 300 added to cart (30%), 120 started checkout (40%), 100 attempted payment (83%), and 85 completed (85%)"

**Business Impact:**
- Identify biggest drop-off point (e.g., cart → checkout is 40%, needs optimization)
- Measure abandoned cart value (e.g., $10,000 lost this month)
- Calculate product-level conversion (e.g., Product A has 20% view-to-purchase, Product B has 2%)

**What Doesn't Change:**
- Still blind to marketing attribution (needs UTM tracking)
- Still blind to user intent (needs qualitative research)
- Still blind to cross-session journeys (needs session merging)

**Next Step:** Implement Event model, integrate 4 event triggers, build funnel analytics endpoint.
