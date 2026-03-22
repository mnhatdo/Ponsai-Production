require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/furni_db')
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    
    // Drop database
    await mongoose.connection.db.dropDatabase();
    console.log('🗑️  Dropped furni_db database');
    
    await mongoose.disconnect();
    console.log('👋 Done!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
