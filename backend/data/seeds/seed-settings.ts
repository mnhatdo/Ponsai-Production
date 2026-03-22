/**
 * Script to initialize default settings in the database
 * Run: ts-node backend/data/seeds/seed-settings.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Import Settings model
import Settings from '../../src/models/Settings';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ponsai';

async function seedSettings() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if settings already exist
    const existingSettings = await Settings.findOne();

    if (existingSettings) {
      console.log('⚠️  Settings already exist in database');
      console.log('Current settings:', JSON.stringify(existingSettings, null, 2));
      console.log('\nTo reset settings, delete the existing document first or use the reset API endpoint.');
      process.exit(0);
    }

    // Create default settings
    console.log('📝 Creating default settings...');
    const settings = await Settings.create({
      shopName: 'Ponsai Store',
      shopDescription: 'Cửa hàng cây cảnh bonsai cao cấp',
      contactEmail: 'contact@ponsai.vn',
      contactPhone: '0123 456 789',
      address: '123 Đường ABC, Quận 1, TP.HCM',
      currency: 'GBP',
      taxRate: 10,
      shippingFee: 5,
      freeShippingThreshold: 50,
      orderPrefix: 'ORD',
      lowStockThreshold: 10,
      maintenanceMode: false
    });

    console.log('✅ Default settings created successfully!');
    console.log('\nSettings details:');
    console.log('─────────────────────────────────────');
    console.log(`Shop Name: ${settings.shopName}`);
    console.log(`Description: ${settings.shopDescription}`);
    console.log(`Email: ${settings.contactEmail}`);
    console.log(`Phone: ${settings.contactPhone}`);
    console.log(`Address: ${settings.address}`);
    console.log(`Currency: ${settings.currency}`);
    console.log(`Tax Rate: ${settings.taxRate}%`);
    console.log(`Shipping Fee: ${settings.shippingFee} ${settings.currency}`);
    console.log(`Free Shipping Threshold: ${settings.freeShippingThreshold} ${settings.currency}`);
    console.log(`Order Prefix: ${settings.orderPrefix}`);
    console.log(`Low Stock Threshold: ${settings.lowStockThreshold}`);
    console.log(`Maintenance Mode: ${settings.maintenanceMode}`);
    console.log('─────────────────────────────────────');

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error seeding settings:', error.message);
    console.error(error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the seed function
seedSettings();
