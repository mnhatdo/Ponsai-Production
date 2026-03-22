const mongoose = require('mongoose');
const Product = require('../dist/models/Product').default;
const Category = require('../dist/models/Category').default;
require('dotenv').config();

async function checkAccessoriesProducts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ponsai');
    
    // Get Accessories category
    const accessoriesCategory = await Category.findOne({ slug: 'accessories' });
    
    console.log('\n=== PRODUCTS IN ACCESSORIES CATEGORY ===\n');
    
    const accessoriesProducts = await Product.find({ category: accessoriesCategory._id });
    
    console.log(`Total: ${accessoriesProducts.length} products\n`);
    
    const typeGroups = {};
    accessoriesProducts.forEach(p => {
      const type = p.productType || 'No Type';
      if (!typeGroups[type]) {
        typeGroups[type] = [];
      }
      typeGroups[type].push(p.name.substring(0, 60));
    });
    
    Object.entries(typeGroups).forEach(([type, products]) => {
      console.log(`\n${type} (${products.length}):`);
      products.forEach(name => {
        console.log(`  - ${name}`);
      });
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkAccessoriesProducts();
