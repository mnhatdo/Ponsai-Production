# Shipping Fee Calculation Setup

## Overview

The shipping fee calculation feature uses Google Maps Distance Matrix API to calculate real-world driving distances from the store location in Hanoi  to delivery addresses across Vietnam.

## Store Location

**Base Location**: UEL University, Ho Chi Minh City, Vietnam
- **Latitude**: 10.870427757451457
- **Longitude**: 106.77573517570406
- **Address**: Trường Đại học Kinh tế - Luật, ĐHQG-HCM (UEL)

## Pricing Structure

| Distance Range | Fee Calculation |
|---------------|----------------|
| 0 - 5 km | Base rate: **15,000 VND** |
| > 5 km | Base rate + **3,000 VND per km** |
| Order ≥ 500,000 VND | **Free shipping** |

### Examples:
- **3 km**: 15,000 VND (base rate - within HCMC)
- **10 km**: 15,000 + (5 × 3,000) = **30,000 VND**
- **50 km**: 15,000 + (45 × 3,000) = **150,000 VND**
- **Order > 500,000 VND**: 0 VND (free shipping)

## Google Maps API Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click **Create Project** or select existing project
3. Name project (e.g., "Ponsai Shipping Calculator")
4. Click **Create**

### Step 2: Enable Distance Matrix API

1. In Google Cloud Console, navigate to **APIs & Services > Library**
2. Search for "Distance Matrix API"
3. Click on **Distance Matrix API**
4. Click **Enable**

### Step 3: Create API Key

1. Navigate to **APIs & Services > Credentials**
2. Click **+ Create Credentials > API Key**
3. Copy the generated API key
4. Click **Edit API Key** (pencil icon)

### Step 4: Restrict API Key (Recommended)

#### Application Restrictions:
- Select **HTTP referrers (websites)**
- Add authorized referrers:
  ```
  http://localhost:4200/*
  https://yourdomain.com/*
  ```

#### API Restrictions:
- Select **Restrict key**
- Choose **Distance Matrix API** from list
- Click **Save**

### Step 5: Configure Application

#### Update Environment File

**File**: `frontend/src/environments/environment.ts`

```typescript
export const environment = {
  apiUrl: '/api/v1',
  apiTimeout: 30000,
  appName: 'Ponsai',
  version: '1.0.0',
  googleMapsApiKey: 'YOUR_ACTUAL_API_KEY_HERE' // ← Replace this
};
```

**File**: `frontend/src/environments/environment.prod.ts`

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.yourdomain.com/api/v1',
  apiTimeout: 30000,
  appName: 'Ponsai',
  version: '1.0.0',
  googleMapsApiKey: 'YOUR_ACTUAL_API_KEY_HERE' // ← Replace this
};
```

#### Update index.html

**File**: `frontend/src/index.html`

Replace `YOUR_API_KEY` in the Google Maps script tag:

```html
<script async defer 
  src="https://maps.googleapis.com/maps/api/js?key=YOUR_ACTUAL_API_KEY_HERE&libraries=places">
</script>
```

### Step 6: Setup Billing (Required)

⚠️ **Important**: Google Maps API requires billing to be enabled.

1. Go to **Billing** in Google Cloud Console
2. Link a billing account
3. Set up budget alerts (recommended)

**Free Tier**:
- First **$200/month** in Google Maps usage is free
- Distance Matrix API: **Free quota of 40,000 elements/month**
- Beyond free tier: **$10 per 1,000 elements**

## Fallback System

If Google Maps API is unavailable (no key, quota exceeded, network error), the system automatically falls back to Vietnamese city-based distance estimates:

| City | Estimated Distance from UEL HCMC |
|------|----------------------------------|
| Ho Chi Minh City, HCMC, Sài Gòn | 5 km |
| Biên Hòa, Đồng Nai | 30 km |
| Vũng Tàu, Bà Rịa | 120 km |
| Cần Thơ | 170 km |
| Nha Trang, Khánh Hòa | 450 km |
| Buôn Ma Thuột, Đắk Lắk | 350 km |
| Quy Nhơn, Bình Định | 600 km |
| Đà Nẵng | 950 km |
| Huế | 1,050 km |
| Hanoi, Hà Nội | 1,700 km |
| Hai Phong, Hải Phòng | 1,670 km |

**Default**: 30 km for unrecognized addresses

## Architecture

### ShippingService

**Location**: `frontend/src/app/core/services/shipping.service.ts`

**Key Methods**:

```typescript
// Calculate shipping fee for address and order total
async calculateShippingFee(address: string, orderTotal: number): Promise<number>

// Get distance from store using Google Maps API
private async getDistance(destination: string): Promise<number>

// Fallback distance estimation for Vietnamese cities
private estimateDistanceFallback(address: string): number

// Calculate fee from distance in kilometers
private calculateFeeFromDistance(distanceKm: number): number

// Get human-readable shipping info
getShippingInfo(fee: number, orderTotal: number): string

// Check how much more needed for free shipping
getAmountForFreeShipping(currentTotal: number): number

// Get store location details
getStoreLocation(): object
```

### Checkout Integration

**Location**: `frontend/src/app/features/checkout/checkout.component.ts`

The shipping fee is automatically calculated:
- On component initialization
- When address fields change (debounced 800ms)
- When order total changes

The shipping fee is included in the final total calculation along with promotional discounts.

## Testing

### Test with Vietnamese Addresses

1. **HCMC address (local)**:
   ```
   Street: 123 Nguyen Hue
   City: Ho Chi Minh City
   State: HCMC
   Country: Vietnam
   ```
   Expected: ~15,000 - 20,000 VND (short distance)

2. **Hanoi address (far north)**:
   ```
   Street: 456 Hoan Kiem
   City: Hanoi
   State: Hanoi
   Country: Vietnam
   ```
   Expected: ~5,100,000 VND (1,700 km from HCMC)

3. **Order with free shipping**:
   - Cart total: 550,000 VND
   - Expected: 0 VND (free shipping threshold reached)

### Test Fallback System

1. Remove or invalidate API key in `environment.ts`
2. Enter address with city name (e.g., "Nha Trang, Vietnam")
3. Should see estimated distance used (450 km)
4. Fee: 15,000 + (445 × 3,000) = 1,350,000 VND

## Monitoring & Debugging

### Browser Console Logs

The service logs helpful debug information:
```javascript
// Success
"Calculating shipping for: Hanoi, Vietnam"
"Distance: 5 km, Fee: 15000 VND"

// Fallback
"Google Maps API not available, using fallback estimation"
"Using fallback estimation for: Da Nang"

// Error
"Error calculating shipping: [error details]"
```

### Check API Usage

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **APIs & Services > Dashboard**
3. Click on **Distance Matrix API**
4. View usage metrics and quota

### Common Issues

| Issue | Solution |
|-------|----------|
| "Cannot find name 'google'" | API script not loaded; check index.html |
| Shipping always shows 15,000 VND | API key invalid or quota exceeded; check console |
| Slow calculation | Network latency; consider preloading for common cities |
| CORS errors | Check API key restrictions in Google Cloud |

## Cost Optimization

### Strategies to Reduce API Calls:

1. **Cache Results**: Store calculated distances for common city pairs
2. **Debouncing**: Already implemented (800ms delay)
3. **Validate Address**: Only calculate when address is reasonably complete
4. **Use Fallback**: For known Vietnamese cities, use pre-calculated estimates
5. **Address Autocomplete**: Use Places API Autocomplete to get precise addresses faster

### Current Implementation:
- ✅ Debouncing enabled (800ms)
- ✅ Fallback for Vietnamese cities
- ✅ Free tier sufficient for most small-medium businesses
- ⚠️ Caching not yet implemented
- ⚠️ Address autocomplete not yet implemented

## Future Enhancements

- [ ] Implement distance caching in localStorage
- [ ] Add Google Places Autocomplete for address input
- [ ] Support multiple store locations
- [ ] Add express shipping option (higher rates)
- [ ] Province-based flat rates as alternative
- [ ] Admin panel to configure rates and zones
- [ ] Shipping calculator on product pages

## Support

For issues with Google Maps API:
- [Distance Matrix API Documentation](https://developers.google.com/maps/documentation/distance-matrix)
- [Google Maps Platform Support](https://developers.google.com/maps/support)
- [API Key Best Practices](https://developers.google.com/maps/api-security-best-practices)

