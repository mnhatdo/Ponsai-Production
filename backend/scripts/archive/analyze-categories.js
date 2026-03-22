const mongoose = require('mongoose');
const Product = require('../dist/models/Product').default;
const Category = require('../dist/models/Category').default;
require('dotenv').config();

async function analyzeCategories() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ponsai');
    
    console.log('\n=== ANALYZING CATEGORY MAPPING ===\n');
    
    // Get all products with populated category
    const products = await Product.find({})
      .populate('category', 'name slug')
      .limit(20);
    
    // Group by category
    const categoryMap = new Map();
    
    products.forEach(p => {
      if (p.category) {
        const slug = p.category.slug;
        const name = p.category.name;
        const key = `${slug}|${name}`;
        
        if (!categoryMap.has(key)) {
          categoryMap.set(key, {
            slug,
            name,
            productCount: 0,
            productTypes: new Set(),
            sampleProducts: []
          });
        }
        
        const catData = categoryMap.get(key);
        catData.productCount++;
        if (p.productType) {
          catData.productTypes.add(p.productType);
        }
        if (catData.sampleProducts.length < 3) {
          catData.sampleProducts.push(p.name.substring(0, 40));
        }
      }
    });
    
    console.log('Categories found in products:\n');
    categoryMap.forEach((data, key) => {
      console.log(`Category: ${data.name}`);
      console.log(`  Slug: ${data.slug}`);
      console.log(`  Products: ${data.productCount}`);
      console.log(`  Product Types: ${Array.from(data.productTypes).join(', ')}`);
      console.log(`  Samples: ${data.sampleProducts.join(', ')}`);
      console.log('');
    });
    
    // Get all categories from database
    console.log('\n=== ALL CATEGORIES IN DATABASE ===\n');
    const allCategories = await Category.find({});
    allCategories.forEach(cat => {
      console.log(`- ${cat.name} (slug: ${cat.slug})`);
    });
    
    // Count products per category
    console.log('\n=== PRODUCT COUNT PER CATEGORY ===\n');
    for (const cat of allCategories) {
      const count = await Product.countDocuments({ category: cat._id });
      console.log(`${cat.name}: ${count} products`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

analyzeCategories();
