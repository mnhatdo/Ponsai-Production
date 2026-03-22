const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ponsai');

const ProductSchema = new mongoose.Schema({}, { strict: false });
const CategorySchema = new mongoose.Schema({}, { strict: false });

const Product = mongoose.model('Product', ProductSchema, 'products');
const Category = mongoose.model('Category', CategorySchema, 'categories');

async function checkCategories() {
  try {
    console.log('\n=== CATEGORIES IN DATABASE ===');
    const categories = await Category.find({});
    console.log(`Total categories: ${categories.length}\n`);
    categories.forEach(cat => {
      console.log(`- ${cat.name} (slug: ${cat.slug}, _id: ${cat._id})`);
    });

    console.log('\n=== SAMPLE PRODUCTS WITH CATEGORY ===');
    const products = await Product.find({}).limit(10);
    console.log(`Checking ${products.length} products:\n`);
    
    const categoryStats = {};
    products.forEach(p => {
      const categoryId = p.category ? p.category.toString() : 'null';
      const categoryType = typeof p.category;
      const key = `${categoryId} (${categoryType})`;
      categoryStats[key] = (categoryStats[key] || 0) + 1;
      
      console.log(`Product: ${p.name.substring(0, 50)}...`);
      console.log(`  category field: ${p.category} (type: ${categoryType})`);
      console.log(`  productType: ${p.productType}`);
      console.log('');
    });

    console.log('\n=== CATEGORY DISTRIBUTION ===');
    Object.entries(categoryStats).forEach(([key, count]) => {
      console.log(`${key}: ${count} products`);
    });

    // Check if category references are valid
    console.log('\n=== VALIDATING CATEGORY REFERENCES ===');
    const allProducts = await Product.find({});
    const categoryIds = new Set(categories.map(c => c._id.toString()));
    
    let validRefs = 0;
    let invalidRefs = 0;
    let nullRefs = 0;
    
    allProducts.forEach(p => {
      if (!p.category) {
        nullRefs++;
      } else if (categoryIds.has(p.category.toString())) {
        validRefs++;
      } else {
        invalidRefs++;
        console.log(`⚠️  Product "${p.name}" has invalid category ID: ${p.category}`);
      }
    });
    
    console.log(`\nValid references: ${validRefs}`);
    console.log(`Invalid references: ${invalidRefs}`);
    console.log(`Null references: ${nullRefs}`);
    console.log(`Total products: ${allProducts.length}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkCategories();
