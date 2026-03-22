const mongoose = require('mongoose');
require('dotenv').config();

const UserSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', UserSchema, 'users');

async function listAllUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/furni');
    
    console.log('\n=== ALL USERS IN DATABASE ===\n');
    
    const users = await User.find({});
    console.log(`Total users: ${users.length}\n`);
    
    if (users.length === 0) {
      console.log('❌ NO USERS FOUND IN DATABASE\n');
      console.log('You need to create admin users first!');
      return;
    }
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Has password: ${user.password ? 'Yes' : 'No'}`);
      console.log(`   Provider: ${user.authProvider || 'local'}`);
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

listAllUsers();
