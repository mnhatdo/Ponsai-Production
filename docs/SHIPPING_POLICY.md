# Shipping Fee Quick Reference

## Customer-Facing Shipping Information

### 📍 Shipping Origin
All orders ship from our store at **UEL University, Ho Chi Minh City, Vietnam**

### 💰 Shipping Rates

| Distance from Hanoi | Shipping Fee |
|---------------------|-------------|
| **0 - 5 km** | ₫15,000 (Base rate) |
| **5 - 10 km** | ₫15,000 + ₫3,000/km |
| **10 - 50 km** | ₫15,000 + ₫3,000/km |
| **50+ km** | ₫15,000 + ₫3,000/km |

### 🎯 Free Shipping Threshold
**Orders ≥ ₫500,000 qualify for FREE SHIPPING** to any location in Vietnam

### 📊 Example Calculations

#### Local Delivery (Hanoi)
- **Distance**: 3 km
- **Fee**: ₫15,000
- **Delivery**: Same day or next day

#### Northern Vietnam (Hai Phong)
- **Distance**: ~100 km
- **Fee**: ₫15,000 + (95 km × ₫3,000) = **₫300,000**
- **Delivery**: 1-2 days

#### Central Vietnam (Da Nang)
- **Distance**: ~750 km  
- **Fee**: ₫15,000 + (745 km × ₫3,000) = **₫2,250,000**
- **Delivery**: 3-5 days
- **💡 Tip**: Orders ≥ ₫500,000 ship FREE!

#### Southern Vietnam (Ho Chi Minh City)
- **Distance**: ~1,700 km
- **Fee**: ₫15,000 + (1,695 km × ₫3,000) = **₫5,100,000**
- **Delivery**: 5-7 days
- **💡 Tip**: Orders ≥ ₫500,000 ship FREE!

### 🚚 How Shipping is Calculated

1. **Enter Delivery Address** at checkout
2. **Automatic Calculation** using real road distance from Hanoi
3. **See Fee Before Payment** in order summary
4. **Progress to Free Shipping** shown if under threshold

### ❓ Frequently Asked Questions

**Q: Why is shipping so expensive to Hanoi?**
A: Vietnam is 1,730 km long! Hanoi is ~1,700 km from our Ho Chi Minh City store. However, orders over ₫500,000 ship FREE regardless of distance.

**Q: How accurate is the distance calculation?**
A: We use Google Maps to calculate real driving distances, ensuring fair and accurate pricing.

**Q: Can I get free shipping on smaller orders?**
A: Yes! Simply add more items to reach ₫500,000 total. You'll see how much more you need in the checkout summary.

**Q: Does the fee include insurance?**
A: Yes, all shipments are insured up to the order value.

**Q: What if my address isn't recognized?**
A: Our system will estimate distance based on your city/province. You can contact us to verify before ordering.

**Q: Is there express shipping?**
A: Currently, we offer standard shipping only. Express shipping coming soon!

**Q: Do you ship internationally?**
A: Currently, we only ship within Vietnam. International shipping coming in the future.

### 💡 Tips to Save on Shipping

1. **Reach ₫500,000**: Add accessories, pots, or soil to qualify for free shipping
2. **Combine Orders**: Order multiple plants together instead of separately
3. **Check Distance**: If you're far from Hanoi, the free shipping threshold saves significantly
4. **Watch Promotions**: We occasionally offer free shipping promotions

### 📦 Estimated Delivery Times

| Region | Distance | Delivery Time |
|--------|----------|---------------|
| HCMC Metro & Nearby | 0-50 km | Same day - 1 day |
| Southern Provinces | 50-300 km | 1-2 days |
| Central Vietnam | 300-1000 km | 2-4 days |
| Northern Vietnam | 1000+ km | 5-7 days |

*Delivery times are estimates and may vary based on weather, holidays, and carrier availability.*

### 🛡️ Shipping Guarantee

- **Safe Packaging**: Plants carefully packaged to prevent damage
- **Tracking**: Tracking number provided for all orders
- **Insurance**: Full order value coverage
- **Damage Policy**: Photos within 24 hours of delivery for replacement

### 📞 Shipping Support

**Questions about your shipping cost?**
- Live chat on website
- Email: shipping@ponsai.vn
- Phone: +84 (24) xxxx-xxxx
- Response time: Within 2 hours during business hours

---

## Internal Reference (Admin/Support)

### Base Configuration
```
Store Location: 10.870427757451457, 106.77573517570406 (UEL HCMC)
Base Rate: ₫15,000
Per KM Rate: ₫3,000
Free Threshold: ₫500,000
```

### City Distance Estimates (Fallback)
```
HCMC/Sài Gòn: 5 km
Biên Hòa/Đồng Nai: 30 km
Vũng Tàu: 120 km
Cần Thơ: 170 km
Nha Trang: 450 km
Buôn Ma Thuột: 350 km
Quy Nhơn: 600 km
Đà Nẵng: 950 km
Huế: 1,050 km
Hanoi/Hà Nội: 1,700 km
Hải Phòng: 1,670 km
Default: 30 km
```

### Common Customer Scenarios

**Scenario 1**: Customer in HCMC, ₫300,000 order
- Distance: ~5 km
- Fee: ₫15,000
- Total: ₫315,000
- Message: "Add ₫200,000 more for free shipping!"

**Scenario 2**: Customer in Hanoi, ₫450,000 order
- Distance: ~1,700 km
- Fee: ₫5,100,000 → **₫0 (Free shipping applies!)**
- Total: ₫450,000
- Message: "Already qualifies for free shipping!"

**Scenario 3**: Customer in Nha Trang, ₫150,000 order
- Distance: ~450 km
- Fee: ₫1,350,000
- Total: ₫1,500,000
- Message: "Add ₫350,000 more for free shipping and save ₫1,350,000!"

### Support Scripts

**Customer: "Why is shipping so expensive?"**
```
I understand shipping costs can seem high for long distances. Vietnam is 
1,730 km long, and we calculate based on real driving distance from our 
Ho Chi Minh City store (UEL University). However, all orders over ₫500,000 
qualify for FREE SHIPPING regardless of distance. You're currently at [X]₫, 
so adding just [Y]₫ more would eliminate the shipping fee entirely and save 
you money!
```

**Customer: "Can you reduce the shipping fee?"**
```
Our shipping rates are calculated automatically based on real distances to 
ensure fairness for all customers. However, I can help you qualify for FREE 
SHIPPING! You're currently [X]₫ away from the ₫500,000 threshold. Would you 
like recommendations for items to add?
```

**Customer: "Do you have pickup option?"**
```
Great idea! Yes, if you're in Ho Chi Minh City, you can pick up your order 
from our UEL University store to avoid shipping fees entirely. Let me process 
this as a pickup order for you.
```
