const mongoose = require('mongoose');
const Product = require('../dist/models/Product').default;
const Category = require('../dist/models/Category').default;
require('dotenv').config();

async function fixRemainingProducts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ponsai');
    
    console.log('\n=== FIXING REMAINING PRODUCTS ===\n');
    
    // Get categories
    const categories = await Category.find({});
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.slug] = cat._id;
    });
    
    const toolsId = categoryMap['tools'];
    const accessoriesId = categoryMap['accessories'];
    
    // Update products with productType = 'tools' (lowercase)
    const toolsProducts = await Product.find({ productType: 'tools' });
    console.log(`Fixing ${toolsProducts.length} products with productType='tools'`);
    for (const product of toolsProducts) {
      product.category = toolsId;
      await product.save();
      console.log(`  Updated: ${product.name.substring(0, 50)}`);
    }
    
    // Update products with Fertiliser
    const fertiliserProducts = await Product.find({ productType: /Fertiliser/i });
    console.log(`\nFixing ${fertiliserProducts.length} products with Fertiliser`);
    for (const product of fertiliserProducts) {
      product.category = accessoriesId;
      await product.save();
      console.log(`  Updated: ${product.name.substring(0, 50)}`);
    }
    
    // Update products with Soil
    const soilProducts = await Product.find({ productType: /Soil/i });
    console.log(`\nFixing ${soilProducts.length} products with Soil`);
    for (const product of soilProducts) {
      product.category = accessoriesId;
      await product.save();
      console.log(`  Updated: ${product.name.substring(0, 50)}`);
    }
    
    // Update products with Cut Paste
    const cutPasteProducts = await Product.find({ productType: /Cut Paste/i });
    console.log(`\nFixing ${cutPasteProducts.length} products with Cut Paste`);
    for (const product of cutPasteProducts) {
      product.category = accessoriesId;
      await product.save();
      console.log(`  Updated: ${product.name.substring(0, 50)}`);
    }
    
    // Show final distribution
    console.log('\n\n=== FINAL PRODUCT DISTRIBUTION ===\n');
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

fixRemainingProducts();
