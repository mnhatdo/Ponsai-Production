require('dotenv').config();
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/furni_db')
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    
    // Delete all users
    const result = await mongoose.connection.db.collection('users').deleteMany({});
    console.log(`🗑️  Deleted ${result.deletedCount} users`);
    
    await mongoose.disconnect();
    console.log('👋 Done!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
