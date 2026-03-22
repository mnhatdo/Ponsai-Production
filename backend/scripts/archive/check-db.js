require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/furni_db')
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    console.log('📊 Database:', mongoose.connection.db.databaseName);
    console.log('\n📋 Collections:');
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    collections.forEach(col => console.log('  -', col.name));
    
    // Check users collection
    console.log('\n👥 Users in "users" collection:');
    const usersCol = mongoose.connection.db.collection('users');
    const users = await usersCol.find({}).toArray();
    
    if (users.length === 0) {
      console.log('  ❌ No users found!');
    } else {
      users.forEach(user => {
        console.log(`\n  📧 ${user.email}`);
        console.log(`     Role: ${user.role}`);
        console.log(`     Name: ${user.name}`);
        console.log(`     Active: ${user.isActive}`);
        console.log(`     Email Verified: ${user.isEmailVerified}`);
        console.log(`     Auth Provider: ${user.authProvider}`);
        console.log(`     Has Password: ${!!user.password}`);
      });
    }
    
    // Try to find admin specifically
    console.log('\n🔍 Searching for admin email: nhatdo@admin.gmail.com');
    const admin1 = await usersCol.findOne({ email: 'nhatdo@admin.gmail.com' });
    console.log('  Result (exact):', admin1 ? '✅ FOUND' : '❌ NOT FOUND');
    
    // Try case-insensitive
    const admin2 = await usersCol.findOne({ 
      email: { $regex: /^nhatdo@admin\.gmail\.com$/i } 
    });
    console.log('  Result (case-insensitive):', admin2 ? '✅ FOUND' : '❌ NOT FOUND');
    
    // Try role filter
    const adminByRole = await usersCol.findOne({ role: 'admin' });
    console.log('  Result (role=admin):', adminByRole ? `✅ FOUND: ${adminByRole.email}` : '❌ NOT FOUND');
    
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
