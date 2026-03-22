# Data Management & Seeding

## Overview

The Furni application includes a comprehensive **bonsai product dataset** containing 411+ real products from ZeroBonsai.com. This document explains how to manage, import, and use this data.

---

## 📊 Dataset Information

### Statistics
- **Total Products**: 411
- **Total Images**: 2,260 (hosted on CDN)
- **Total Variants**: 411
- **Source**: zerobonsai.com
- **Version**: 2.0-enriched
- **Generated**: December 31, 2025

### Product Categories
- **Bonsai Trees**: Live bonsai plants in various species
- **Bonsai Pots**: Handcrafted ceramic and stoneware containers
- **Tools**: Bonsai maintenance and care tools
- **Accessories**: Wire, soil, fertilizers, and supplies
- **Books & Guides**: Educational materials

### Data Files Location
```
backend/data/seeds/bonsai/
├── complete_dataset.json    # Full dataset (55K+ lines)
├── products.json             # Products only (55K+ lines)
├── variants.json             # Product variants (6K+ lines)
├── images_manifest.json      # Image registry (20K+ lines)
└── README.md                 # Dataset documentation
```

---

## 🌱 Importing Data

### Quick Import

```bash
# From project root
cd backend
npm run seed:bonsai
```

### What Happens During Import

1. **Connects** to MongoDB
2. **Creates** 5 product categories:
   - Bonsai Trees
   - Bonsai Pots
   - Tools
   - Accessories
   - Books & Guides
3. **Transforms** bonsai data to Furni schema:
   - Converts GBP to USD (1 GBP ≈ 1.27 USD)
   - Maps product types to categories
   - Extracts image URLs from nested structure
   - Preserves all metadata and tags
4. **Imports** all 411 products
5. **Reports** success/failure statistics

### Import Output Example

```
🌱 Starting Bonsai Product Seeding...

📊 Dataset Info:
   Source: zerobonsai.com
   Version: 2.0-enriched
   Total Products: 411
   Total Images: 2260

📁 Creating categories...
  📁 Created category: Bonsai Trees
  📁 Created category: Bonsai Pots
  📁 Created category: Tools
  📁 Created category: Accessories
  📁 Created category: Books & Guides

🗑️  Clearing existing bonsai products...

📦 Importing products...
   ✓ Imported 50/411 products...
   ✓ Imported 100/411 products...
   ✓ Imported 150/411 products...
   ...

✅ Seeding Complete!

📊 Results:
   ✓ Imported: 411 products
   ⚠️  Skipped: 0 products

👋 Disconnecting from database...
✅ Done!
```

---

## 📋 Data Structure

### Product Schema

Each product includes:

```typescript
{
  // Basic Info
  name: string;              // "Solar Red - White Stoneware Cascade Bonsai Pot 5cm"
  slug: string;              // "solar-red-white-stoneware-cascade-bonsai-pot-5cm"
  sku: string;               // "ZP216"
  
  // Descriptions
  description: string;       // Full product description
  shortDescription: string;  // Truncated version
  
  // Pricing
  price: number;             // Price in USD (converted)
  originalPrice: number;     // Original price in GBP
  originalCurrency: string;  // "GBP"
  
  // Classification
  category: ObjectId;        // Reference to Category
  productType: string;       // "Pot", "Tree", "Tool", etc.
  
  // Media
  images: string[];          // Array of CDN URLs
  primaryImage: string;      // Main product image
  
  // Inventory
  inStock: boolean;
  stockQuantity: number;
  
  // Metadata
  tags: string[];            // ["mame", "cascade", "pot", "Stoneware"]
  featured: boolean;
  
  // External References
  externalId: string;        // Original ZeroBonsai ID
  externalUrl: string;       // Original product URL
  brandId: string;           // Brand identifier
  
  // SEO
  seo: {
    metaTitle: string;
    metaDescription: string;
  }
  
  // Ratings
  rating: number;            // 0-5 stars
  reviews: number;           // Review count
}
```

### Example Product

```json
{
  "name": "Solar Red - White Stoneware Cascade Bonsai Pot 5cm",
  "slug": "solar-red-white-stoneware-cascade-bonsai-pot-5cm",
  "sku": "ZP216",
  "description": "Our handcrafted WHITE Stoneware ceramic pots...",
  "shortDescription": "Handcrafted white stoneware ceramic pot...",
  "price": 33.01,
  "originalPrice": 25.99,
  "originalCurrency": "GBP",
  "productType": "Pot",
  "images": [
    "https://cdn.shopify.com/s/files/1/0771/8010/9084/files/zbp-aug-s1-084.jpg",
    "https://cdn.shopify.com/s/files/1/0771/8010/9084/files/zbp-aug-s1-085.jpg"
  ],
  "primaryImage": "https://cdn.shopify.com/s/files/1/0771/8010/9084/files/zbp-aug-s1-084.jpg",
  "inStock": true,
  "stockQuantity": 10,
  "tags": ["mame", "mamecollection", "cascade", "pot", "Stoneware"],
  "externalId": "prod-solar-red-white-stoneware-casc-cb689e73",
  "externalUrl": "https://zerobonsai.com/products/dark-blue-opal-white-stoneware-cascade-bonsai-pot-5cm-copy-2",
  "rating": 0,
  "reviews": 0
}
```

---

## 🔄 Data Transformation

### Price Conversion
All prices are converted from GBP to USD using an approximate exchange rate:

```typescript
const priceInUSD = bonsaiProduct.price * 1.27;
```

Both original and converted prices are stored for reference.

### Category Mapping

Product types are mapped to categories:

| Product Type | Category |
|--------------|----------|
| `pot` | Bonsai Pots |
| `tree` | Bonsai Trees |
| `tool` | Tools |
| `book` | Books & Guides |
| `soil`, `fertilizer`, `wire` | Accessories |
| *others* | Accessories (default) |

### Image Processing

Images are extracted from nested structure:
```typescript
const images = bonsaiProduct.images?.map(img => img.url) || [];
```

All images are hosted on Shopify CDN and remain at original URLs.

---

## 🛠️ Advanced Usage

### Custom Import Script

Create your own import logic by extending the seeder:

```typescript
import { seedProducts, transformProduct } from './data/seeds/seed-bonsai';

// Custom import logic here
```

### Selective Import

Modify `seed-bonsai.ts` to import specific product types:

```typescript
const filteredProducts = dataset.products.filter(
  p => p.product_type === 'Pot'
);
```

### Update Existing Products

To update without clearing:

```typescript
// Comment out this line in seed-bonsai.ts
// await Product.deleteMany({ externalId: { $exists: true } });

// Use updateOne with upsert instead
await Product.updateOne(
  { externalId: productData.externalId },
  productData,
  { upsert: true }
);
```

---

## 📦 Database Schema Updates

The `Product` model has been enhanced to support the bonsai dataset:

### New Fields Added

```typescript
slug?: string;              // URL-friendly identifier
sku?: string;               // Stock Keeping Unit
shortDescription?: string;  // Brief description
originalPrice?: number;     // Price in original currency
originalCurrency?: string;  // GBP, EUR, etc.
productType?: string;       // Product category type
primaryImage?: string;      // Main image URL
tags?: string[];            // Product tags
externalId?: string;        // External system ID
externalUrl?: string;       // Original product URL
brandId?: string;           // Brand identifier
seo?: {                     // SEO metadata
  metaTitle?: string;
  metaDescription?: string;
}
```

### New Indexes

```typescript
ProductSchema.index({ slug: 1 });
ProductSchema.index({ sku: 1 });
ProductSchema.index({ externalId: 1 });
ProductSchema.index({ productType: 1 });
ProductSchema.index({ name: 'text', description: 'text', tags: 'text' });
```

---

## 🔍 Querying Products

### Find by SKU
```typescript
const product = await Product.findOne({ sku: 'ZP216' });
```

### Search by Tags
```typescript
const cascadePots = await Product.find({ tags: 'cascade' });
```

### Filter by Product Type
```typescript
const pots = await Product.find({ productType: 'Pot' });
```

### Full-text Search
```typescript
const results = await Product.find({ 
  $text: { $search: 'stoneware ceramic' } 
});
```

### By External ID
```typescript
const product = await Product.findOne({ 
  externalId: 'prod-solar-red-white-stoneware-casc-cb689e73' 
});
```

---

## 🗂️ Data Maintenance

### Re-seed Database

To completely refresh the data:

```bash
cd backend
npm run seed:bonsai
```

### Backup Data

Export current database:

```bash
mongodump --db furni --out ./backups/$(date +%Y%m%d)
```

### Restore Backup

```bash
mongorestore --db furni ./backups/20251231
```

---

## 🚨 Troubleshooting

### "Cannot find module" Error

Install ts-node if not present:
```bash
npm install --save-dev ts-node
```

### "Connection Failed" Error

Ensure MongoDB is running:
```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
```

### Duplicate Key Error

Clear existing products:
```typescript
await Product.deleteMany({});
```

Or skip duplicates by checking `externalId` before insert.

---

## 📚 Related Documentation

- [Backend Models](../backend/src/models/Product.ts) - Product schema definition
- [API Endpoints](API.md#products) - Product API reference
- [Database Setup](QUICK_START.md#step-3-start-mongodb) - MongoDB configuration

---

## 💡 Tips

1. **First Time**: Run the seeder after initial setup to have real product data
2. **Development**: Use seeded data for realistic testing
3. **Production**: Review and customize products before deployment
4. **Performance**: Images are CDN-hosted, no local storage needed
5. **Customization**: Modify `transformProduct()` function to adjust data mapping

---

*Last Updated: December 31, 2025*
