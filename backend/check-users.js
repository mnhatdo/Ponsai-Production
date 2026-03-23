const mongoose = require('mongoose');
require('dotenv').config();

async function checkUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ponsai');
    console.log('✅ Connected to MongoDB\n');
    
    const usersCollection = mongoose.connection.db.collection('users');
    const users = await usersCollection.find({}).toArray();
    
    console.log('═══════════════════════════════════════════');
    console.log(`📊 TOTAL USERS IN DATABASE: ${users.length}`);
    console.log('═══════════════════════════════════════════\n');
    
    if (users.length === 0) {
      console.log('❌ No users found in database!\n');
    } else {
      users.forEach((user, index) => {
        console.log(`👤 User ${index + 1}:`);
        console.log(`   Name: ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Has Password: ${!!user.password}`);
        console.log(`   Email Verified: ${user.isEmailVerified}`);
        console.log(`   Auth Provider: ${user.authProvider}`);
        console.log(`   Active: ${user.isActive !== false}`);
        console.log(`   Created: ${user.createdAt}`);
        console.log('');
      });
      
      console.log('═══════════════════════════════════════════');
      console.log('📋 SUMMARY:');
      const adminCount = users.filter(u => u.role === 'admin').length;
      const userCount = users.filter(u => u.role === 'user').length;
      console.log(`   Admins: ${adminCount}`);
      console.log(`   Customers: ${userCount}`);
      console.log('═══════════════════════════════════════════\n');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkUsers();

