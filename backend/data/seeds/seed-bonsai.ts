/**
 * Bonsai Product Seeder
 * 
 * Imports bonsai products from the JSON dataset into MongoDB
 * Run with: npm run seed:bonsai or ts-node backend/data/seeds/seed-bonsai.ts
 */

import mongoose from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';
import Product from '../../src/models/Product';
import Category from '../../src/models/Category';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

interface BonsaiProduct {
  id: string;
  title: string;
  slug: string;
  sku: string;
  product_type: string;
  brand_id: string;
  description: string;
  short_description: string;
  price: number;
  currency: string;
  price_formatted: string;
  in_stock: boolean;
  stock_status: string;
  url: string;
  category_ids: string[];
  image_ids: string[];
  primary_image_id: string;
  tags: string[];
  specifications: any;
  seo: {
    meta_title: string;
    meta_description: string;
    schema_org_availability: string;
  };
  created_at: string;
  updated_at: string;
  images?: Array<{
    id: string;
    url: string;
    alt?: string;
    width: number;
    height: number;
  }>;
  variants?: any[];
}

interface BonsaiDataset {
  metadata: {
    source: string;
    generated_at: string;
    version: string;
    total_products: number;
    total_images: number;
    total_variants: number;
  };
  products: BonsaiProduct[];
}

/**
 * Connect to MongoDB
 */
const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/furni';
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

/**
 * Create default categories if they don't exist
 */
const createDefaultCategories = async (): Promise<Map<string, mongoose.Types.ObjectId>> => {
  const categoryMap = new Map<string, mongoose.Types.ObjectId>();
  
  const categories = [
    { name: 'Bonsai Trees', slug: 'bonsai-trees', description: 'Live bonsai plants and trees' },
    { name: 'Bonsai Pots', slug: 'bonsai-pots', description: 'Ceramic and stoneware bonsai containers' },
    { name: 'Tools', slug: 'tools', description: 'Bonsai maintenance and care tools' },
    { name: 'Accessories', slug: 'accessories', description: 'Wire, soil, fertilizers, and more' },
    { name: 'Books & Guides', slug: 'books-guides', description: 'Educational materials for bonsai enthusiasts' }
  ];

  for (const cat of categories) {
    let category = await Category.findOne({ slug: cat.slug });
    
    if (!category) {
      category = await Category.create(cat);
      console.log(`  📁 Created category: ${cat.name}`);
    }
    
    categoryMap.set(cat.slug, category._id as mongoose.Types.ObjectId);
  }

  return categoryMap;
};

/**
 * Map product type to category
 */
const getCategory = (
  productType: string, 
  categoryMap: Map<string, mongoose.Types.ObjectId>
): mongoose.Types.ObjectId => {
  const typeMap: { [key: string]: string } = {
    'pot': 'bonsai-pots',
    'tree': 'bonsai-trees',
    'tool': 'tools',
    'book': 'books-guides',
    'accessory': 'accessories',
    'soil': 'accessories',
    'fertilizer': 'accessories',
    'wire': 'accessories'
  };

  const categorySlug = typeMap[productType.toLowerCase()] || 'accessories';
  return categoryMap.get(categorySlug)!;
};

/**
 * Transform bonsai product to Furni product format
 */
const transformProduct = (
  bonsaiProduct: BonsaiProduct,
  categoryMap: Map<string, mongoose.Types.ObjectId>
): any => {
  // Extract image URLs
  const images = bonsaiProduct.images?.map(img => img.url) || [];
  
  // Convert GBP to USD (approximate rate: 1 GBP = 1.27 USD)
  const priceInUSD = Math.round(bonsaiProduct.price * 1.27 * 100) / 100;

  return {
    name: bonsaiProduct.title,
    slug: bonsaiProduct.slug,
    sku: bonsaiProduct.sku,
    description: bonsaiProduct.description,
    shortDescription: bonsaiProduct.short_description,
    price: priceInUSD,
    originalPrice: bonsaiProduct.price,
    originalCurrency: bonsaiProduct.currency,
    category: getCategory(bonsaiProduct.product_type, categoryMap),
    productType: bonsaiProduct.product_type,
    images: images,
    primaryImage: images[0] || '',
    inStock: bonsaiProduct.in_stock,
    stockQuantity: bonsaiProduct.in_stock ? 10 : 0, // Default quantity
    featured: false,
    tags: bonsaiProduct.tags,
    externalId: bonsaiProduct.id,
    externalUrl: bonsaiProduct.url,
    brandId: bonsaiProduct.brand_id,
    seo: {
      metaTitle: bonsaiProduct.seo?.meta_title,
      metaDescription: bonsaiProduct.seo?.meta_description
    },
    rating: 0,
    reviews: 0
  };
};

/**
 * Seed products from JSON file
 */
const seedProducts = async (): Promise<void> => {
  try {
    console.log('\n🌱 Starting Bonsai Product Seeding...\n');

    // Read the complete dataset
    const dataPath = path.join(__dirname, 'complete_dataset.json');
    const rawData = fs.readFileSync(dataPath, 'utf-8');
    const dataset: BonsaiDataset = JSON.parse(rawData);

    console.log(`📊 Dataset Info:`);
    console.log(`   Source: ${dataset.metadata.source}`);
    console.log(`   Version: ${dataset.metadata.version}`);
    console.log(`   Total Products: ${dataset.metadata.total_products}`);
    console.log(`   Total Images: ${dataset.metadata.total_images}\n`);

    // Create categories
    console.log('📁 Creating categories...');
    const categoryMap = await createDefaultCategories();
    console.log('');

    // Clear existing products (optional - comment out to keep existing)
    console.log('🗑️  Clearing existing bonsai products...');
    await Product.deleteMany({ externalId: { $exists: true } });
    console.log('');

    // Import products
    console.log('📦 Importing products...');
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const bonsaiProduct of dataset.products) {
      try {
        const productData = transformProduct(bonsaiProduct, categoryMap);
        await Product.create(productData);
        imported++;
        
        if (imported % 50 === 0) {
          console.log(`   ✓ Imported ${imported}/${dataset.products.length} products...`);
        }
      } catch (error: any) {
        skipped++;
        errors.push(`${bonsaiProduct.sku}: ${error.message}`);
      }
    }

    console.log('\n✅ Seeding Complete!\n');
    console.log(`📊 Results:`);
    console.log(`   ✓ Imported: ${imported} products`);
    console.log(`   ⚠️  Skipped: ${skipped} products`);
    
    if (errors.length > 0 && errors.length <= 10) {
      console.log(`\n❌ Errors:`);
      errors.forEach(err => console.log(`   - ${err}`));
    } else if (errors.length > 10) {
      console.log(`\n❌ ${errors.length} errors occurred (showing first 10):`);
      errors.slice(0, 10).forEach(err => console.log(`   - ${err}`));
    }

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
};

/**
 * Main execution
 */
const main = async (): Promise<void> => {
  try {
    await connectDB();
    await seedProducts();
    
    console.log('\n👋 Disconnecting from database...');
    await mongoose.disconnect();
    console.log('✅ Done!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
};

// Run if executed directly
if (require.main === module) {
  main();
}

export { seedProducts, transformProduct };
