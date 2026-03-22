const mongoose = require('mongoose');
const Product = require('../dist/models/Product').default;
const Category = require('../dist/models/Category').default;
require('dotenv').config();

async function fixCategoryMapping() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ponsai');
    
    console.log('\n=== FIXING CATEGORY MAPPING ===\n');
    
    // Get all categories
    const categories = await Category.find({});
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.slug] = cat._id;
      categoryMap[cat.name] = cat._id;
    });
    
    console.log('Available categories:');
    Object.keys(categoryMap).forEach(key => {
      console.log(`  - ${key}`);
    });
    
    // Define mapping rules based on productType
    const mappingRules = {
      'Bonsai Tree': categoryMap['bonsai-trees'] || categoryMap['Bonsai Trees'],
      'Pot': categoryMap['bonsai-pots'] || categoryMap['Bonsai Pots'],
      'Wire': categoryMap['tools'] || categoryMap['Tools'],
      'Kit': categoryMap['tools'] || categoryMap['Tools'],
      'Tool': categoryMap['tools'] || categoryMap['Tools'],
      'Book': categoryMap['books-&-guides'] || categoryMap['Books & Guides'],
    };
    
    console.log('\n\nMapping rules:');
    Object.entries(mappingRules).forEach(([type, catId]) => {
      const catName = categories.find(c => c._id.equals(catId))?.name || 'Unknown';
      console.log(`  ${type} → ${catName}`);
    });
    
    // Get all products
    const allProducts = await Product.find({});
    
    console.log(`\n\nProcessing ${allProducts.length} products...\n`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const product of allProducts) {
      const productType = product.productType;
      const newCategoryId = mappingRules[productType];
      
      if (newCategoryId && !product.category.equals(newCategoryId)) {
        const oldCat = categories.find(c => c._id.equals(product.category));
        const newCat = categories.find(c => c._id.equals(newCategoryId));
        
        console.log(`Updating: ${product.name.substring(0, 50)}`);
        console.log(`  Type: ${productType}`);
        console.log(`  From: ${oldCat?.name}`);
        console.log(`  To:   ${newCat?.name}`);
        
        product.category = newCategoryId;
        await product.save();
        updatedCount++;
      } else if (!newCategoryId && productType) {
        console.log(`⚠️  No mapping for productType: ${productType} (Product: ${product.name.substring(0, 40)})`);
        skippedCount++;
      }
    }
    
    console.log(`\n\n=== SUMMARY ===`);
    console.log(`Updated: ${updatedCount} products`);
    console.log(`Skipped: ${skippedCount} products`);
    
    // Show new distribution
    console.log('\n=== NEW PRODUCT DISTRIBUTION ===\n');
    for (const cat of categories) {
      const count = await Product.countDocuments({ category: cat._id });
      console.log(`${cat.name}: ${count} products`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

fixCategoryMapping();
