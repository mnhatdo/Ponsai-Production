const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const UserSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', UserSchema, 'users');

async function checkAdminUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ponsai');
    
    console.log('\n=== CHECKING ADMIN USER ===\n');
    
    // Find user with email
    const email = 'nhatdo@admin.gmail.com';
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log(`❌ User with email "${email}" NOT FOUND in database`);
      
      // Check all admin users
      const allAdmins = await User.find({ role: 'admin' });
      console.log(`\nFound ${allAdmins.length} admin users in database:`);
      allAdmins.forEach(admin => {
        console.log(`  - ${admin.email} (role: ${admin.role})`);
      });
      
      return;
    }
    
    console.log('✅ User found in database\n');
    console.log('User details:');
    console.log(`  Email: ${user.email}`);
    console.log(`  Name: ${user.name}`);
    console.log(`  Role: ${user.role}`);
    console.log(`  Password (hashed): ${user.password}`);
    console.log(`  isEmailVerified: ${user.isEmailVerified}`);
    console.log(`  authProvider: ${user.authProvider}`);
    console.log(`  createdAt: ${user.createdAt}`);
    
    // Test password comparison
    console.log('\n=== TESTING PASSWORD ===\n');
    
    const testPassword = 'nhatnhatnheo';
    console.log(`Testing password: "${testPassword}"`);
    
    try {
      const isMatch = await bcrypt.compare(testPassword, user.password);
      console.log(`\nPassword match result: ${isMatch ? '✅ MATCH' : '❌ NO MATCH'}`);
      
      if (!isMatch) {
        console.log('\n⚠️  Password does not match!');
        console.log('This could be because:');
        console.log('  1. Password was never set properly');
        console.log('  2. Password hash is corrupted');
        console.log('  3. Wrong password is being tested');
        
        // Try to create correct hash
        console.log('\n=== CREATING CORRECT HASH ===\n');
        const salt = await bcrypt.genSalt(10);
        const correctHash = await bcrypt.hash(testPassword, salt);
        console.log(`Correct hash for "${testPassword}":`);
        console.log(correctHash);
        
        console.log('\nVerifying new hash:');
        const verifyNew = await bcrypt.compare(testPassword, correctHash);
        console.log(`New hash verification: ${verifyNew ? '✅ WORKS' : '❌ FAILED'}`);
      }
    } catch (error) {
      console.log(`❌ Error comparing password: ${error.message}`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkAdminUser();
