/**
 * Seed Test Users for Manual Payment Testing
 * 
 * Creates 10 test user accounts for manual payment testing:
 * - Email: a0@tester.gmail.com → a9@tester.gmail.com
 * - Password: tester123
 * 
 * These accounts:
 * - Do not require email verification
 * - Use the same auth and order flow as regular users
 * - Are meant for internal testing and QA
 * 
 * Run: npx ts-node data/seeds/seed-test-users.ts
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ponsai';

// Test users configuration
const TEST_PASSWORD = 'tester123';
const NUM_TEST_USERS = 10;

interface TestUser {
  name: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  isEmailVerified: boolean;
  authProvider: 'local' | 'google';
  isActive: boolean;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

function generateTestUsers(): TestUser[] {
  const users: TestUser[] = [];
  
  for (let i = 0; i < NUM_TEST_USERS; i++) {
    users.push({
      name: `Test User ${i}`,
      email: `a${i}@tester.gmail.com`,
      password: TEST_PASSWORD,
      role: 'user',
      isEmailVerified: true, // Pre-verified for testing
      authProvider: 'local',
      isActive: true,
      address: {
        street: `${100 + i} Test Street`,
        city: 'Test City',
        state: 'Test State',
        zipCode: `1000${i}`,
        country: 'Vietnam'
      }
    });
  }
  
  return users;
}

async function seedTestUsers() {
  try {
    console.log('🧪 Seeding Test Users for Manual Payment Testing');
    console.log('================================================\n');
    
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get Users collection
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }
    const usersCollection = db.collection('users');

    // Generate test users
    const testUsers = generateTestUsers();
    
    // Hash password once (all users share the same password)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(TEST_PASSWORD, salt);

    let created = 0;
    let updated = 0;
    let skipped = 0;

    console.log('📝 Processing test users...\n');

    for (const user of testUsers) {
      const existingUser = await usersCollection.findOne({ email: user.email });
      
      if (existingUser) {
        // Update existing user to ensure correct settings
        await usersCollection.updateOne(
          { email: user.email },
          {
            $set: {
              name: user.name,
              password: hashedPassword,
              role: user.role,
              isEmailVerified: user.isEmailVerified,
              authProvider: user.authProvider,
              isActive: user.isActive,
              address: user.address,
              updatedAt: new Date()
            }
          }
        );
        console.log(`   🔄 Updated: ${user.email}`);
        updated++;
      } else {
        // Create new user
        await usersCollection.insertOne({
          name: user.name,
          email: user.email,
          password: hashedPassword,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          authProvider: user.authProvider,
          isActive: user.isActive,
          address: user.address,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log(`   ✅ Created: ${user.email}`);
        created++;
      }
    }

    console.log('\n================================================');
    console.log('📊 Summary:');
    console.log(`   ✅ Created: ${created} users`);
    console.log(`   🔄 Updated: ${updated} users`);
    console.log(`   ⏭️  Skipped: ${skipped} users`);
    console.log(`   📦 Total: ${testUsers.length} users\n`);

    console.log('🔐 Test Account Credentials:');
    console.log('   Email Pattern: a0@tester.gmail.com → a9@tester.gmail.com');
    console.log(`   Password: ${TEST_PASSWORD}`);
    console.log('\n📋 Test Accounts List:');
    
    for (const user of testUsers) {
      console.log(`   • ${user.email}`);
    }

    console.log('\n🎯 How to use:');
    console.log('   1. Login with any test account');
    console.log('   2. Add products to cart');
    console.log('   3. Checkout and select "Manual Payment"');
    console.log('   4. Admin confirms payment in admin dashboard');
    console.log('   5. Order appears in reports and analytics\n');

  } catch (error) {
    console.error('❌ Error seeding test users:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the seed
seedTestUsers();

