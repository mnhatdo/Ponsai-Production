require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/furni_db')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// User Schema (simplified)
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  isActive: Boolean,
  isEmailVerified: Boolean,
  authProvider: String
});

const User = mongoose.model('User', userSchema);

async function checkAndCreateAdmin() {
  try {
    // Check if admin exists
    const admin = await User.findOne({ email: 'nhatdo@admin.gmail.com' });
    
    if (admin) {
      console.log('\n📋 Admin user found:');
      console.log('  Email:', admin.email);
      console.log('  Name:', admin.name);
      console.log('  Role:', admin.role);
      console.log('  Active:', admin.isActive);
      console.log('  Email Verified:', admin.isEmailVerified);
      console.log('  Auth Provider:', admin.authProvider);
      console.log('  Password Hash:', admin.password.substring(0, 30) + '...');
      
      // Test password
      const testPasswords = ['nhatnhatnheo', 'admin123', '12345678', 'password'];
      console.log('\n🔐 Testing passwords...');
      for (const pwd of testPasswords) {
        const isMatch = await bcrypt.compare(pwd, admin.password);
        console.log(`  ${pwd}: ${isMatch ? '✅ MATCH' : '❌'}`);
      }
    } else {
      console.log('\n❌ Admin user not found!');
      console.log('\n📝 Creating admin user...');
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('nhatnhatnheo', salt);
      
      const newAdmin = await User.create({
        name: 'Admin User',
        email: 'nhatdo@admin.gmail.com',
        password: hashedPassword,
        role: 'admin',
        isActive: true,
        isEmailVerified: true,
        authProvider: 'local'
      });
      
      console.log('✅ Admin user created successfully!');
      console.log('  Email: nhatdo@admin.gmail.com');
      console.log('  Password: nhatnhatnheo');
      console.log('  Role:', newAdmin.role);
    }
    
    // List all users
    console.log('\n👥 All users in database:');
    const allUsers = await User.find({}, 'name email role');
    allUsers.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.email} - ${user.name} (${user.role})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
    process.exit(0);
  }
}

checkAndCreateAdmin();
