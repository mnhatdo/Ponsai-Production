const mongoose = require('mongoose');
require('dotenv').config();

async function checkCollections() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ponsai');
    
    const colls = await mongoose.connection.db.listCollections().toArray();
    console.log('All collections:', colls.map(c => c.name).join(', '));
    
    const count = await mongoose.connection.db.collection('promotions').countDocuments();
    console.log('\nPromotions in "promotions" collection:', count);
    
    if (count > 0) {
      const samples = await mongoose.connection.db.collection('promotions').find({}).limit(2).toArray();
      console.log('\nSample promotions:');
      samples.forEach(p => console.log(`  - ${p.code}: ${p.name}`));
    }
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkCollections();

