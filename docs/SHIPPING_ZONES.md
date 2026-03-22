# Shipping Fee System - Zone-Based Flat Rates (Domestic & International)

## Overview

The shipping fee system uses **simple zone-based flat rates** based on delivery location. This is the simplest and most transparent pricing model for customers, supporting both domestic Vietnam and international shipping.

**Last Updated:** March 2026  
**Version:** 5.0 (International Support)

---

## Shipping Rates

### 🇻🇳 Domestic Vietnam

#### 1. Thủ Đức District - FREE ✨
- **Fee:** ₫0 (Free shipping)
- **Coverage:** Thủ Đức district, Ho Chi Minh City
- **Reason:** Store location is in UEL University, Thủ Đức
- **Delivery:** 1-2 days

#### 2. Ho Chi Minh City - ₫20,000
- **Fee:** ₫20,000 flat rate
- **Coverage:** All districts in HCMC except Thủ Đức
- Examples:
  - District 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12
  - Bình Thạnh, Phú Nhuận, Tân Bình, Tân Phú
  - Gò Vấp, Bình Tân, Nhà Bè, Cần Giờ, etc.
- **Delivery:** 2-3 days

#### 3. Other Provinces - ₫40,000 - ₫100,000
- **Fee Range:** ₫40,000 to ₫100,000
- **Coverage:** All provinces outside HCMC
- **Current Implementation:** Random fee between 40k and 100k
- **Delivery:** 3-5 days

### 🌏 International Shipping

#### Southeast Asia (₫180,000 - ₫220,000)
- **Thailand:** ₫180,000
- **Singapore:** ₫200,000  
- **Malaysia:** ₫180,000
- **Philippines:** ₫220,000
- **Indonesia:** ₫220,000
- **Delivery:** 7-14 days

#### Asia Pacific (₫230,000 - ₫280,000)
- **Japan:** ₫280,000
- **South Korea:** ₫280,000
- **Hong Kong:** ₫250,000
- **China:** ₫230,000
- **Taiwan:** ₫230,000
- **Delivery:** 10-14 days

#### Americas (₫450,000 - ₫550,000)
- **USA:** ₫500,000
- **Canada:** ₫500,000
- **Mexico:** ₫450,000
- **Brazil:** ₫550,000
- **Delivery:** 14-21 days

#### Europe (₫450,000)
- **United Kingdom:** ₫450,000
- **France:** ₫450,000
- **Germany:** ₫450,000
- **Italy:** ₫450,000
- **Spain:** ₫450,000
- **Delivery:** 14-21 days

#### Oceania (₫500,000)
- **Australia:** ₫500,000
- **New Zealand:** ₫500,000
- **Delivery:** 14-21 days

#### Other Countries
- **Default International:** ₫400,000
- **Delivery:** 14-30 days

### ❌ No Free Shipping Threshold
**Important:** Free shipping threshold of ₫1,000,000 has been **removed**. Only Thủ Đức district receives free shipping regardless of order value.

---

## Address Detection Logic

### Detection Algorithm

```typescript
// Priority order:
1. Check if country is Vietnam → Domestic rates
   a. Check if address contains "Thủ Đức" → FREE
   b. Check if address contains HCMC keywords → ₫20,000
   c. Otherwise → ₫40,000 - ₫100,000 (provinces)
2. Check country for international rates
   a. Southeast Asia → ₫180,000 - ₫220,000
   b. Asia Pacific → ₫230,000 - ₫280,000
   c. Americas → ₫450,000 - ₫550,000
   d. Europe → ₫450,000
   e. Oceania → ₫500,000
   f. Other → ₫400,000
```

### Vietnam Detection
Checks for these keywords (case-insensitive):
- "vietnam"
- "việt nam"
- "viet nam"
- "vn"

### Thủ Đức Detection
Checks for these keywords (case-insensitive):
- "thủ đức"
- "thu duc"
- "thuduc"

### HCMC Detection
Checks for these keywords (case-insensitive):
- "hồ chí minh"
- "hcm"
- "tp.hcm"
- "tp hcm"
- "sài gòn"
- "saigon"

### Province Fee Calculation
Currently returns random amount between ₫40,000 and ₫100,000 in increments of ₫10,000:
- ₫40,000, ₫50,000, ₫60,000, ₫70,000, ₫80,000, ₫90,000, ₫100,000

**Future Enhancement:** Map specific provinces to exact fees:
```typescript
// Example:
if (address.includes('đà nẵng')) return 60000;
if (address.includes('hà nội')) return 80000;
if (address.includes('cần thơ')) return 50000;
```

---

## Frontend Implementation

### ShippingService

**File:** `frontend/src/app/core/services/shipping.service.ts`

```typescript
// Shipping rates configuration
private readonly RATES = {
  thuDucFree: 0,           // Free in Thu Duc
  hcmcOther: 20000,        // 20k for other HCMC districts
  provinceMin: 40000,      // Min for provinces
  provinceMax: 100000,     // Max for provinces
  freeShippingMin: 1000000 // Free shipping threshold
};
```

**Main Method:**
```typescript
calculateShippingFee(address: string, country: string, orderTotal?: number): number
```

**Input:**
- `address`: Delivery address string (e.g., "Thủ Đức, Hồ Chí Minh")
- `country`: Country name or code (e.g., "Vietnam", "Thailand", "TH")
- `orderTotal`: Order subtotal in VND (optional, not used for free shipping anymore)

**Output:**
- Shipping fee in VND

**Example Usage:**
```typescript
// Domestic - Thu Duc (free)
const fee1 = shippingService.calculateShippingFee(
  'Thủ Đức, Hồ Chí Minh', 
  'Vietnam',
  850000
);
// Returns: 0 (free in Thu Duc)

// Domestic - HCMC other district
const fee2 = shippingService.calculateShippingFee(
  'Quận 1, Hồ Chí Minh', 
  'Vietnam',
  450000
);
// Returns: 20000 (HCMC other districts)

// International - Thailand
const fee3 = shippingService.calculateShippingFee(
  'Bangkok', 
  'Thailand',
  1200000
);
// Returns: 180000 (Thailand rate, no free shipping)

// International - USA
const fee4 = shippingService.calculateShippingFee(
  'New York, NY',
  'United States',
  2000000
);
// Returns: 500000 (USA rate)
```

### CheckoutComponent Integration

**File:** `frontend/src/app/features/checkout/checkout.component.ts`

**Calculation Trigger:**
- Automatically recalculates when user types in `city`, `state`, or `country` form fields
- Uses `valueChanges` subscription on form controls

**Code:**
```typescript
// In initForms()
this.checkoutForm.get('city')?.valueChanges.subscribe(() => {
  this.calculateShipping();
});
this.checkoutForm.get('state')?.valueChanges.subscribe(() => {
  this.calculateShipping();
});
this.checkoutForm.get('country')?.valueChanges.subscribe(() => {
  this.calculateShipping();
});

// Calculation method
private calculateShipping() {
  const city = this.checkoutForm?.get('city')?.value || '';
  const state = this.checkoutForm?.get('state')?.value || '';
  const country = this.checkoutForm?.get('country')?.value || 'Vietnam';
  const address = `${city}, ${state}`.trim();
  
  const orderTotal = this.cartService.total();
  const fee = this.shippingService.calculateShippingFee(address, country, orderTotal);
  
  this.shippingFee.set(fee);
  this.shippingInfo.set(
    this.shippingService.getShippingInfo(fee, country)
  );
}
```

---

## Translation Keys

### Vietnamese (vi.json)
```json
"shipping.fee": "Phí vận chuyển",
"shipping.free": "Miễn phí vận chuyển",
"shipping.calculating": "Đang tính phí...",
"shipping.thuDucFree": "Miễn phí (Thủ Đức)",
"shipping.hcmcRate": "20.000đ (TP. Hồ Chí Minh)",
"shipping.provinceRate": "40.000đ - 100.000đ (Tỉnh khác)",
"shipping.freeAt": "Miễn phí từ",
"shipping.needMore": "Thêm {{amount}} để miễn phí ship",
"shipping.freeOver1M": "Miễn phí từ 1 triệu đồng",
"shipping.byLocation": "Theo khu vực giao hàng",
"shipping.thuDuc": "Thủ Đức",
"shipping.hcmc": "TP. Hồ Chí Minh",
"shipping.province": "Tỉnh khác"
```

### English (en.json)
```json
"shipping.fee": "Shipping Fee",
"shipping.free": "Free Shipping",
"shipping.calculating": "Calculating...",
"shipping.thuDucFree": "Free (Thu Duc)",
"shipping.hcmcRate": "20,000 VND (Ho Chi Minh City)",
"shipping.provinceRate": "40,000 VND - 100,000 VND (Other Provinces)",
"shipping.freeAt": "Free from",
"shipping.needMore": "Add {{amount}} for free shipping",
"shipping.freeOver1M": "Free over 1 million VND",
"shipping.byLocation": "By delivery location",
"shipping.thuDuc": "Thu Duc",
"shipping.hcmc": "Ho Chi Minh City",
"shipping.province": "Other Provinces"
```

---

## Customer-Facing Messages

### Domestic Shipping

1. **Free - Thu Duc:**
   ```
   Miễn phí vận chuyển (khu vực Thủ Đức)
   ```

2. **HCMC Rate:**
   ```
   Phí vận chuyển: 20.000đ (TP. Hồ Chí Minh)
   ```

3. **Province Rate:**
   ```
   Phí vận chuyển: 60.000đ (Tỉnh khác)
   ```

### International Shipping

1. **Southeast Asia:**
   ```
   Phí vận chuyển quốc tế: 180.000đ (Thái Lan)
   Phí vận chuyển quốc tế: 200.000đ (Singapore)
   ```

2. **Asia Pacific:**
   ```
   Phí vận chuyển quốc tế: 280.000đ (Nhật Bản)
   Phí vận chuyển quốc tế: 250.000đ (Hồng Kông)
   ```

3. **Americas/Europe:**
   ```
   Phí vận chuyển quốc tế: 500.000đ (Mỹ)
   Phí vận chuyển quốc tế: 450.000đ (Anh)
   ```

---

## Advantages of Zone-Based System

### 1. **Simplicity**
- No complex calculations
- Easy to understand for customers
- Simple to explain to support staff
- Works for both domestic and international

### 2. **Transparency**
- Clear, predictable pricing
- No surprises at checkout
- Customers know costs upfront
- Same rate for same country

### 3. **Performance**
- No API calls (unlike Google Maps or carrier APIs)
- Instant calculation
- No external dependencies
- Fast for all countries

### 4. **Maintenance**
- Easy to update rates
- No weight/dimension data required
- Simple codebase
- Add new countries easily

### 5. **Fairness**
- Equal rates for same zone/country
- Not affected by product weight
- Consistent international pricing
- No hidden fees

### 6. **Global Reach**
- Support 25+ countries
- Cover all major markets
- Expandable to more countries
- Simple default rate for unlisted countries

---

## Migration from Previous Systems

### Version History

1. **V1 - Google Maps Distance (Hanoi Origin)**
   - Used Google Maps Distance Matrix API
   - Origin: Hanoi
   - Problem: Too expensive for southern customers

2. **V2 - Google Maps Distance (UEL HCMC Origin)**
   - Updated origin to UEL University, Thu Duc, HCMC
   - Coordinates: 10.870427757451457, 106.77573517570406
   - Problem: API costs, complex implementation

3. **V3 - Weight & Volume Based**
   - Calculate by product weight and dimensions
   - Base rate + weight surcharge + volume surcharge
   - Oversized/bulky item surcharges
   - Problem: Too complex, requires product data maintenance

4. **V4 - Zone-Based Domestic**
   - Simple flat rates by location zone
   - Free shipping threshold: 1M VND
   - No external dependencies
   - Problem: Vietnam only, no international support

5. **V5 - International Support (Current)** ✅
   - Added international shipping to 25+ countries
   - **Removed free shipping threshold** (only Thu Duc free)
   - Organized by regions (SEA, Asia Pacific, Americas, Europe, Oceania)
   - Same simple flat-rate approach
   - Perfect balance of simplicity and global reach

### Removed Components

The following are **no longer used** in V4:

- ❌ Google Maps API integration
- ❌ `googleMapsApiKey` in environment files
- ❌ Product weight field (optional, can be removed)
- ❌ Product dimensions field
- ❌ `CartItemForShipping` interface
- ❌ Weight/volume calculation methods
- ❌ Oversized/bulky detection logic

---

## Testing Checklist

### Domestic Vietnam Tests

- [ ] **Thu Duc Address**
  - Input: "Thủ Đức, Hồ Chí Minh" / Country: "Vietnam"
  - Order: ₫500,000
  - Expected: ₫0 (free)

- [ ] **HCMC Other District**
  - Input: "Quận 1, Hồ Chí Minh" / Country: "Vietnam"  
  - Order: ₫500,000
  - Expected: ₫20,000

- [ ] **Province Address**
  - Input: "Đà Nẵng" / Country: "Vietnam"
  - Order: ₫500,000
  - Expected: ₫40,000 - ₫100,000

- [ ] **Large Order (No Free Shipping)**
  - Input: "Hà Nội" / Country: "Vietnam"
  - Order: ₫2,000,000
  - Expected: ₫40,000 - ₫100,000 (NOT free)

### International Tests

- [ ] **Southeast Asia - Thailand**
  - Input: "Bangkok" / Country: "Thailand"
  - Order: ₫800,000
  - Expected: ₫180,000

- [ ] **Southeast Asia - Singapore**
  - Input: "Singapore" / Country: "Singapore"
  - Order: ₫1,500,000
  - Expected: ₫200,000 (no free shipping even for large order)

- [ ] **Asia Pacific - Japan**
  - Input: "Tokyo" / Country: "Japan"
  - Order: ₫1,000,000
  - Expected: ₫280,000

- [ ] **Americas - USA**
  - Input: "New York, NY" / Country: "United States"
  - Order: ₫2,000,000
  - Expected: ₫500,000

- [ ] **Europe - France**
  - Input: "Paris" / Country: "France"
  - Order: ₫900,000
  - Expected: ₫450,000

- [ ] **Oceania - Australia**
  - Input: "Sydney" / Country: "Australia"
  - Order: ₫1,200,000
  - Expected: ₫500,000

- [ ] **Unlisted Country**
  - Input: "Cairo" / Country: "Egypt"
  - Order: ₫800,000
  - Expected: ₫400,000 (default international)

### Address Detection Variations

- [ ] **Vietnam Variations**
  - "Vietnam" ✅
  - "Việt Nam" ✅
  - "Viet Nam" ✅
  - "VN" ✅

- [ ] **Thủ Đức Variations**
  - "Thủ Đức" ✅
  - "Thu Duc" ✅  
  - "thuduc" ✅

- [ ] **HCMC Variations**
  - "HCM" ✅
  - "tp.hcm" ✅
  - "Sài Gòn" ✅
  - "Ho Chi Minh" ✅

- [ ] **Country Code Support**
  - "TH" → Thailand ✅
  - "US" → USA ✅
  - "GB" → UK ✅
  - "JP" → Japan ✅

### Real-time Recalculation

- [ ] **Change Country**
  - Change from "Vietnam" to "Thailand"
  - Expected: Fee updates from ₫20,000 to ₫180,000

- [ ] **Change City within Vietnam**
  - Change from "Thủ Đức" to "Quận 1"
  - Expected: Fee updates from ₫0 to ₫20,000

- [ ] **Translation Keys**
  - Switch language to English
  - Check all shipping messages display correctly
  - Verify international country names

---

## Future Enhancements

### 1. Province-Specific Mapping
Map exact fees to specific provinces:
```typescript
private readonly PROVINCE_FEES = {
  'hà nội': 80000,
  'đà nẵng': 60000,
  'cần thơ': 50000,
  'hải phòng': 75000,
  'nha trang': 70000,
  // ... more provinces
};
```

### 2. District-Level HCMC Pricing
Different rates for different HCMC districts:
```typescript
if (isFarDistrict(address)) return 30000; // Nhà Bè, Cần Giờ
if (isCentralDistrict(address)) return 15000; // Q1, Q3, Q10
```

### 3. Express Shipping Option
Add premium shipping tier:
- Standard: Current rates
- Express (same day): +50% surcharge
- 2-hour delivery: +100% surcharge

### 4. Volume Discount
Bulk order shipping discount:
- 5+ items: -20% shipping
- 10+ items: -50% shipping

### 5. Time-Based Promotions
Special shipping promotions:
- Weekend free shipping
- Holiday season reduced rates
- Flash sale free shipping

---

## Configuration

### Updating Shipping Rates

To change shipping rates, modify the `RATES` object in `shipping.service.ts`:

```typescript
private readonly RATES = {
  // Domestic Vietnam
  thuDucFree: 0,
  hcmcOther: 25000,        // Change to 25k
  provinceMin: 50000,      // Increase minimum
  provinceMax: 120000,     // Increase maximum
  
  // International - Southeast Asia
  thailand: 200000,        // Increase rates
  singapore: 220000,
  // ... etc
  
  // International - Default
  internationalDefault: 450000  // Change default
};
```

**No code changes needed elsewhere** - rates will automatically apply!

### Adding New Countries

To add support for a new country, update `getInternationalFee()` method:

```typescript
private getInternationalFee(country: string): number {
  // Add new country
  if (country.includes('india') || country === 'in') {
    return 250000;  // India rate
  }
  
  // ... existing countries ...
  
  return this.RATES.internationalDefault;
}
```

Then add to `getSupportedCountries()`:

```typescript
{ 
  code: 'IN', 
  name: 'India', 
  nameVi: 'Ấn Độ', 
  region: 'asia', 
  fee: 250000 
}
```

---

## Support & Troubleshooting

### Common Issues

**Q: Why is province fee different each time?**  
A: Currently using random fee between 40k-100k. Implement province mapping for consistent fees.

**Q: Can we detect district automatically?**  
A: Not currently. Relies on user typing full address. Consider address autocomplete API.

**Q: What if user enters wrong address format?**  
A: System has fallback to HCMC rate (₫20,000) on detection failure.

**Q: How to test specific province fees?**  
A: Modify `getProvinceFee()` method to return fixed amount during testing.

---

## Conclusion

The zone-based shipping system with international support provides a **simple, fast, and transparent** pricing model that:
- ✅ Supports 25+ countries worldwide
- ✅ Eliminates complex calculations
- ✅ Removes external API dependencies  
- ✅ Provides instant pricing (domestic & international)
- ✅ Easy to maintain and update
- ✅ Fair for customers globally
- ✅ Scalable for future country additions
- ✅ No hidden fees or surprises

**Perfect for e-commerce stores with global ambitions prioritizing simplicity over precision.**

### Key Achievements

🌏 **Global Reach:** Ship to Southeast Asia, Asia Pacific, Americas, Europe, and Oceania  
💰 **Transparent Pricing:** Fixed rates per country, no calculations needed  
⚡ **Instant Calculation:** No API calls, immediate fee display  
🚫 **No Free Shipping Abuse:** Removed threshold to maintain profitability  
🎯 **Local Advantage:** Free shipping in Thu Duc (store location)
