require('dotenv').config();
const mongoose = require('mongoose');

// Import User model with pre-save hook from compiled TypeScript
// This is CRITICAL - the User model has password hashing logic
const User = require('../dist/models/User').default;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/furni_db')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Admin accounts to create
const adminAccounts = [
  {
    name: 'Super Admin',
    email: 'superadmin@bonsight.vn',
    password: 'admin123',
    role: 'admin'
  },
  {
    name: 'Admin User',
    email: 'nhatdo@admin.gmail.com',
    password: 'nhatnhatnheo',
    role: 'admin'
  },
  {
    name: 'Admin Test',
    email: 'admin@test.com',
    password: 'admin123',
    role: 'admin'
  }
];

async function createAdminUsers() {
  try {
    console.log('\n🔍 Checking and creating admin users...\n');
    
    for (const adminData of adminAccounts) {
      // Check if admin exists
      const existingAdmin = await User.findOne({ email: adminData.email });
      
      if (existingAdmin) {
        console.log(`✅ Admin already exists: ${adminData.email}`);
        console.log(`   Name: ${existingAdmin.name}`);
        console.log(`   Role: ${existingAdmin.role}`);
        console.log(`   Active: ${existingAdmin.isActive}`);
        console.log('');
      } else {
        console.log(`📝 Creating admin: ${adminData.email}...`);
        
        // Use new User() + save() to trigger pre-save hook
        // User.create() may bypass pre-save middleware in some cases
        const newAdmin = new User({
          name: adminData.name,
          email: adminData.email,
          password: adminData.password, // Plain text - will be hashed by pre-save hook
          role: adminData.role,
          isActive: true,
          isEmailVerified: true,
          authProvider: 'local'
        });
        
        await newAdmin.save(); // This triggers pre-save hook
        
        console.log(`✅ Admin created successfully!`);
        console.log(`   Email: ${adminData.email}`);
        console.log(`   Password: ${adminData.password}`);
        console.log(`   Role: ${newAdmin.role}`);
        console.log('');
      }
    }
    
    // List all users
    console.log('\n👥 All users in database:');
    const allUsers = await User.find({}, 'name email role isActive');
    allUsers.forEach((user, index) => {
      const status = user.isActive ? '✅' : '❌';
      console.log(`  ${index + 1}. ${status} ${user.email} - ${user.name} (${user.role})`);
    });
    
    // Summary
    const adminCount = await User.countDocuments({ role: 'admin' });
    const userCount = await User.countDocuments({ role: 'user' });
    console.log('\n📊 Summary:');
    console.log(`   Total users: ${allUsers.length}`);
    console.log(`   Admin users: ${adminCount}`);
    console.log(`   Regular users: ${userCount}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
    process.exit(0);
  }
}

createAdminUsers();
