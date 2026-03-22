/**
 * Seed Admin Account
 * Run: npx ts-node data/seeds/seed-admin.ts
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/furni';

// Admin account configuration
const ADMIN_ACCOUNT = {
  name: 'Nhật Đỗ Admin',
  email: 'nhatdo@admin.gmail.com',
  password: 'nhatnhatnheo',
  role: 'admin',
  isEmailVerified: true,
  authProvider: 'local'
};

async function seedAdmin() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get Users collection
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }
    const usersCollection = db.collection('users');

    // Check if admin already exists
    const existingAdmin = await usersCollection.findOne({ email: ADMIN_ACCOUNT.email });
    
    if (existingAdmin) {
      console.log('⚠️  Admin account already exists!');
      console.log(`   Email: ${ADMIN_ACCOUNT.email}`);
      console.log(`   Role: ${existingAdmin.role}`);
      
      // Update to admin role if needed
      if (existingAdmin.role !== 'admin') {
        await usersCollection.updateOne(
          { email: ADMIN_ACCOUNT.email },
          { $set: { role: 'admin', isEmailVerified: true } }
        );
        console.log('✅ Updated to admin role');
      }
    } else {
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(ADMIN_ACCOUNT.password, salt);

      // Create admin account
      const result = await usersCollection.insertOne({
        name: ADMIN_ACCOUNT.name,
        email: ADMIN_ACCOUNT.email,
        password: hashedPassword,
        role: ADMIN_ACCOUNT.role,
        isEmailVerified: ADMIN_ACCOUNT.isEmailVerified,
        authProvider: ADMIN_ACCOUNT.authProvider,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      console.log('✅ Admin account created successfully!');
      console.log(`   ID: ${result.insertedId}`);
      console.log(`   Email: ${ADMIN_ACCOUNT.email}`);
      console.log(`   Password: ${ADMIN_ACCOUNT.password}`);
      console.log(`   Role: admin`);
    }

    console.log('\n📋 Login credentials:');
    console.log('   Email: nhatdo@admin.gmail.com');
    console.log('   Password: nhatnhatnheo');
    console.log('\n🔗 Admin panel: http://localhost:4200/admin');

  } catch (error) {
    console.error('❌ Error seeding admin:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

seedAdmin();
