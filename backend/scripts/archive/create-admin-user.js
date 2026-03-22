const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  phone: String,
  avatar: String,
  isEmailVerified: { type: Boolean, default: false },
  authProvider: { type: String, enum: ['local', 'google'], default: 'local' }
}, { timestamps: true });

const User = mongoose.model('User', UserSchema, 'users');

async function createAdminUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ponsai');
    
    console.log('\n=== CREATING ADMIN USER ===\n');
    
    const adminEmail = 'nhatdo@admin.gmail.com';
    const adminPassword = 'nhatnhatnheo';
    const adminName = 'Nhật Đỗ (Admin)';
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists. Updating password...\n');
      
      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);
      
      existingAdmin.password = hashedPassword;
      existingAdmin.role = 'admin';
      existingAdmin.name = adminName;
      existingAdmin.isEmailVerified = true;
      existingAdmin.authProvider = 'local';
      
      await existingAdmin.save();
      
      console.log('✅ Admin user updated successfully');
    } else {
      console.log('Creating new admin user...\n');
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);
      
      // Create admin user
      const adminUser = new User({
        name: adminName,
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        isEmailVerified: true,
        authProvider: 'local'
      });
      
      await adminUser.save();
      
      console.log('✅ Admin user created successfully');
    }
    
    // Verify the user
    console.log('\n=== VERIFYING ADMIN USER ===\n');
    
    const verifyUser = await User.findOne({ email: adminEmail });
    console.log('User details:');
    console.log(`  Email: ${verifyUser.email}`);
    console.log(`  Name: ${verifyUser.name}`);
    console.log(`  Role: ${verifyUser.role}`);
    console.log(`  Has password: ${verifyUser.password ? 'Yes' : 'No'}`);
    console.log(`  Password hash: ${verifyUser.password.substring(0, 20)}...`);
    
    // Test password
    console.log('\n=== TESTING PASSWORD ===\n');
    const isMatch = await bcrypt.compare(adminPassword, verifyUser.password);
    console.log(`Password "${adminPassword}": ${isMatch ? '✅ CORRECT' : '❌ WRONG'}`);
    
    if (isMatch) {
      console.log('\n✅ ADMIN USER IS READY FOR LOGIN\n');
      console.log('Login credentials:');
      console.log(`  Email: ${adminEmail}`);
      console.log(`  Password: ${adminPassword}`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

createAdminUser();
