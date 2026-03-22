# Analytics System Documentation

**Status:** ✅ Production Ready  
**Last Updated:** January 10, 2026  
**Analytics Layers:** 2 (Revenue Analytics + Event Tracking)

---

## Table of Contents

1. [Overview](#overview)
2. [Wave 1: Revenue Analytics](#wave-1-revenue-analytics)
3. [Wave 2: Event Tracking System](#wave-2-event-tracking-system)
4. [Event Analytics Dashboard](#event-analytics-dashboard)
5. [API Endpoints](#api-endpoints)
6. [Testing](#testing)
7. [Known Limitations](#known-limitations)
8. [Future Roadmap](#future-roadmap)

---

## Overview

Ponsai analytics consists of **2 complementary layers**:

| Layer | Purpose | Data Source | Access |
|-------|---------|-------------|--------|
| **Revenue Analytics** | Business metrics (revenue, retention, products) | Orders & Users | Admin only |
| **Event Analytics** | User behavior tracking (funnel, cart abandonment) | Events collection | Admin only |

### Why Two Layers?

- **Revenue Analytics** answers: "How much money did we make?"
- **Event Analytics** answers: "Why did customers behave this way?"

Together, they provide complete business intelligence.

---

## Wave 1: Revenue Analytics

### Overview

Trustworthy metrics calculated from existing **Order** and **User** data.

### Available Metrics

#### 1. Revenue Analytics
```http
GET /api/v1/admin/analytics/revenue?dateStart=2026-01-01&dateEnd=2026-01-31
```

**Returns:**
- Total revenue (GBP)
- Order count
- Average order value
- Revenue trend over time

**Use Case:** "How much did we make this month?"

---

#### 2. Customer Retention
```http
GET /api/v1/admin/analytics/retention
```

**Returns:**
- Total customers
- Returning customers (2+ orders)
- Retention rate %
- Average orders per customer

**Use Case:** "Are customers coming back?"

---

#### 3. Product Performance
```http
GET /api/v1/admin/analytics/products
```

**Returns:**
- Top products by revenue
- Top products by quantity sold
- Revenue contribution per product
- Units sold

**Use Case:** "Which products drive our revenue?"

---

#### 4. Payment Method Health
```http
GET /api/v1/admin/analytics/payment-health
```

**Returns:**
- Success rate per payment method (MoMo, Manual)
- Transaction volume
- Revenue per method
- Failure reasons

**Use Case:** "Which payment method works best?"

---

#### 5. Payment Timing
```http
GET /api/v1/admin/analytics/payment-timing
```

**Returns:**
- Average time from order to payment
- Breakdown by payment method
- Slow payers identification

**Use Case:** "How long does payment take?"

---

#### 6. Operational Metrics
```http
GET /api/v1/admin/analytics/operations
```

**Returns:**
- Orders needing fulfillment
- Recent orders (today, week)
- Stock alerts
- Pending manual payments

**Use Case:** "What needs action today?"

---

#### 7. Analytics Overview
```http
GET /api/v1/admin/analytics/overview
```

**Returns:**
- Summary of all metrics above
- Quick dashboard view

**Use Case:** "Give me the full picture"

---

## Wave 2: Event Tracking System

### Overview

Captures user behavior events across the entire customer journey.

### Event Types

| Event Type | When Fired | Data Captured |
|-----------|-----------|---------------|
| `page_viewed` | User views any page | page, path, referrer |
| `product_viewed` | User views product detail | productId, productName, price |
| `added_to_cart` | User adds item to cart | productId, quantity |
| `checkout_started` | User begins checkout | cartItems, totalAmount |
| `payment_completed` | Payment successful | orderId, paymentMethod, amount |
| `payment_failed` | Payment failed | orderId, paymentMethod, reason |

### Event Model

```typescript
interface Event {
  eventType: string;
  userId?: string;          // If logged in
  sessionId: string;        // Anonymous tracking
  metadata: Record<string, any>;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
}
```

### Event Lifecycle

```
Frontend User Action
    ↓
EventTrackingService.track()
    ↓
POST /api/v1/events
    ↓
202 Accepted (non-blocking)
    ↓
Background save to MongoDB
    ↓
TTL: Auto-delete after 90 days
```

### Data Retention

- **TTL:** 90 days
- **Storage:** MongoDB collection with auto-expiry
- **Privacy:** No PII stored, just behavioral data

### Frontend Integration

```typescript
// Track product view
this.eventService.track('product_viewed', {
  productId: product._id,
  productName: product.name,
  price: product.price
});

// Track add to cart
this.eventService.track('added_to_cart', {
  productId: item.product._id,
  quantity: item.quantity
});
```

---

## Event Analytics Dashboard

### Access

```
http://localhost:4200/admin/analytics
```

**Credentials:**
```
Email: nhatdo@admin.gmail.com
Password: nhatnhatnheo
```

### 5 Analytics Tabs

#### Tab 1: Overview 📈

**Metrics:**
- Total events (all time)
- Unique users vs guests
- Total revenue from tracked events
- Conversion rate (viewed → purchased)
- Top event types
- Daily activity trends

**Use Case:** "How's our tracking system performing?"

**API:** `GET /api/v1/admin/analytics/events/overview`

---

#### Tab 2: Conversion Funnel 🔄

**Metrics:**
- 4-stage funnel:
  1. Product Viewed
  2. Added to Cart
  3. Checkout Started
  4. Payment Completed
- Drop-off rate per stage
- Conversion rate per stage
- Total users in funnel

**Use Case:** "Where are customers dropping off?"

**API:** `GET /api/v1/admin/analytics/events/funnel`

**Example Response:**
```json
{
  "totalUsers": 9876,
  "steps": [
    {
      "step": "1. Product Viewed",
      "count": 8234,
      "conversionRate": 100
    },
    {
      "step": "2. Added to Cart",
      "count": 3421,
      "dropoffRate": 58.45,
      "conversionRate": 41.55
    },
    ...
  ]
}
```

---

#### Tab 3: Cart Abandonment 🛒

**Metrics:**
- Total carts abandoned
- Abandonment rate %
- Top abandoned products
- Time since abandonment
- User emails (for recovery campaigns)

**Use Case:** "Which products get abandoned most?"

**API:** `GET /api/v1/admin/analytics/events/cart-abandonment`

**Actions:**
- Identify friction points
- Send reminder emails
- Optimize checkout flow

---

#### Tab 4: Product Performance 📦

**Metrics per product:**
- Total views
- Add-to-cart rate
- Purchase rate
- Conversion rate (views → purchases)
- Revenue contribution

**Use Case:** "Which products convert best?"

**API:** `GET /api/v1/admin/analytics/events/products`

**Insights:**
- High views + low conversions = pricing/quality issue
- High add-to-cart + low purchase = checkout friction
- Low views = SEO/marketing issue

---

#### Tab 5: Payment Failures 💳

**Metrics:**
- Total payment attempts
- Success vs failure count
- Failure rate %
- Breakdown by payment method
- Common failure reasons

**Use Case:** "Why are payments failing?"

**API:** `GET /api/v1/admin/analytics/events/payments`

**Example:**
```json
{
  "totalAttempted": 1789,
  "totalCompleted": 1456,
  "totalFailed": 190,
  "failureRate": 10.62,
  "byPaymentMethod": [
    {
      "method": "momo",
      "attempted": 654,
      "completed": 478,
      "failed": 123,
      "failureRate": 18.81
    }
  ]
}
```

---

## API Endpoints

### Revenue Analytics (Wave 1)

All under `/api/v1/admin/analytics`:

```
GET /revenue              - Revenue metrics
GET /retention            - Customer retention
GET /products             - Product performance
GET /payment-health       - Payment success rates
GET /payment-timing       - Payment timing analysis
GET /operations           - Operational metrics
GET /overview             - All metrics combined
```

### Event Analytics (Wave 2)

All under `/api/v1/admin/analytics/events`:

```
GET /overview             - Event system overview
GET /funnel               - Conversion funnel (4 stages)
GET /cart-abandonment     - Abandoned cart analysis
GET /products             - Product performance from events
GET /payments             - Payment failure insights
```

### Event Tracking

```
POST /api/v1/events       - Track single event
POST /api/v1/events/batch - Track multiple events
```

### Authentication

All analytics endpoints require:
- JWT authentication (`protect` middleware)
- Admin role (`authorize('admin')` middleware)

**Header:**
```
Authorization: Bearer <admin_jwt_token>
```

---

## Testing

### Seed Analytics Data

```bash
cd backend
node seed-analytics-events.js
```

**What it does:**
- Creates 15,000+ realistic events
- Covers all event types
- Spans 30 days
- Simulates user journeys
- Populates analytics dashboard

### Verify Data

```bash
cd backend
node test-admin-analytics.js
```

**Tests:**
- All 5 event analytics endpoints
- Response format validation
- Date range filtering
- Admin authentication

### Manual Testing

1. Login to admin: `http://localhost:4200/admin/login`
2. Click "📊 Analytics" in sidebar
3. Navigate through 5 tabs
4. Adjust date filters (7d, 30d, 90d, custom)
5. Verify charts and metrics

---

## Known Limitations

### What We DON'T Have

❌ **Real-time Analytics** - Data updates every request, no streaming  
❌ **Advanced Segmentation** - No cohort analysis or user segments yet  
❌ **Export to CSV/PDF** - Manual copy only  
❌ **Email Reports** - No scheduled analytics reports  
❌ **A/B Testing** - No experiment tracking  
❌ **User Paths** - Can't see individual user journeys  
❌ **Heatmaps** - No visual interaction tracking

### Data Quality Notes

- Events are **self-reported** from frontend → can be blocked by ad blockers
- **90-day TTL** → historical data beyond 90 days is lost
- **No deduplication** → multiple clicks may create duplicate events
- **Anonymous users** tracked by sessionId only (ephemeral)

---

## Future Roadmap

### Phase 3: Enhanced Analytics (Q2 2026)

- [ ] Export analytics to CSV/Excel
- [ ] Scheduled email reports (daily/weekly)
- [ ] Custom date range comparisons
- [ ] User segmentation (new vs returning)
- [ ] Revenue attribution per marketing channel

### Phase 4: Advanced Features (Q3 2026)

- [ ] Cohort analysis
- [ ] Funnel optimization suggestions (AI)
- [ ] Predictive analytics (churn risk)
- [ ] Real-time dashboard (WebSocket)
- [ ] Custom event builder (no-code)

### Phase 5: Enterprise (Q4 2026)

- [ ] Multi-tenant analytics
- [ ] Role-based dashboard permissions
- [ ] Data warehouse integration
- [ ] API rate limiting & quotas
- [ ] SLA monitoring

---

## Related Documentation

- [Event Tracking Spec](./EVENT_TRACKING_SPEC.md) - Detailed event contracts
- [Analytics Contract](./ANALYTICS_CONTRACT.md) - API contracts
- [Analytics Implementation](./ANALYTICS_IMPLEMENTATION.md) - Implementation notes
- [Admin Guide](./ADMIN_GUIDE.md) - Admin dashboard usage

---

## Troubleshooting

### Problem: No events showing in dashboard

**Solutions:**
1. Seed sample data: `node seed-analytics-events.js`
2. Check event tracking is enabled in frontend
3. Verify JWT token is admin role
4. Check date range filter

### Problem: Funnel shows 0% conversion

**Cause:** Incomplete event tracking or data  
**Solution:** Ensure all 4 event types are being tracked in frontend

### Problem: Analytics loading slow

**Cause:** Large date range (90 days) with millions of events  
**Solution:** Use shorter date ranges (7-30 days) or add MongoDB indexes

---

**License:** MIT
