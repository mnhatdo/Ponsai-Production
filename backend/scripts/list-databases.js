const mongoose = require('mongoose');

async function listDatabases() {
  try {
    await mongoose.connect('mongodb://localhost:27017/');
    const dbs = await mongoose.connection.db.admin().listDatabases();
    
    console.log('\n📊 Available Databases:\n');
    for (const db of dbs.databases) {
      if (!['admin', 'local', 'config'].includes(db.name)) {
        console.log(`  - ${db.name}`);
        
        // Check if it has promotions
        await mongoose.connection.useDb(db.name);
        const promoCount = await mongoose.connection.db.collection('promotions').countDocuments();
        if (promoCount > 0) {
          console.log(`    ✅ Has ${promoCount} promotions`);
        }
      }
    }
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

listDatabases();
