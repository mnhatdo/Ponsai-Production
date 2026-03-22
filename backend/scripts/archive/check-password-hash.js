require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/furni_db')
  .then(async () => {
    console.log('✅ Connected to MongoDB\n');
    
    const User = mongoose.model('User', new mongoose.Schema({
      email: String,
      password: String,
      name: String
    }));
    
    const users = await User.find({}, 'email password name');
    
    console.log('👥 Users in database:\n');
    for (const user of users) {
      console.log(`📧 ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Password: ${user.password}`);
      console.log(`   Length: ${user.password.length}`);
      console.log(`   Starts with $2: ${user.password.startsWith('$2')}`);
      console.log(`   Is bcrypt hash: ${user.password.length === 60 && user.password.startsWith('$2')}`);
      console.log('');
    }
    
    await mongoose.disconnect();
    console.log('👋 Done');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
