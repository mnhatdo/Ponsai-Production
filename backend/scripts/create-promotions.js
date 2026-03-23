/**
 * Script to create sample promotion codes
 * Usage: node scripts/create-promotions.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Promotion Schema (simplified version)
const promotionSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  type: {
    type: String,
    enum: ['percentage', 'fixed', 'free_shipping'],
    required: true
  },
  value: {
    type: Number,
    required: function() {
      return this.type !== 'free_shipping';
    }
  },
  maxDiscount: Number,
  minOrderAmount: Number,
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  usageLimit: Number,
  usageLimitPerUser: {
    type: Number,
    default: 1
  },
  usedCount: {
    type: Number,
    default: 0
  },
  active: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Make optional for seed script
  }
}, {
  timestamps: true
});

const Promotion = mongoose.model('Promotion', promotionSchema);
const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));

// Sample promotions to create
const samplePromotions = [
  {
    code: 'WELCOME2',
    name: 'Welcome New Members',
    description: '$2 off for first order',
    type: 'fixed',
    value: 2,
    minOrderAmount: 8,
    startDate: new Date('2026-03-01'),
    endDate: new Date('2026-12-31'),
    usageLimit: 100,
    usageLimitPerUser: 1,
    active: true
  },
  {
    code: 'SUMMER4',
    name: 'Summer Sale',
    description: '$4 off for orders over $20',
    type: 'fixed',
    value: 4,
    minOrderAmount: 20,
    startDate: new Date('2026-03-01'),
    endDate: new Date('2026-08-31'),
    usageLimit: 50,
    usageLimitPerUser: 2,
    active: true
  },
  {
    code: 'BONSAI1',
    name: 'Special Discount',
    description: '$1 off no minimum',
    type: 'fixed',
    value: 1,
    minOrderAmount: 0,
    startDate: new Date('2026-03-01'),
    endDate: new Date('2026-06-30'),
    usageLimit: 200,
    usageLimitPerUser: 3,
    active: true
  },
  {
    code: 'VIP8',
    name: 'VIP Exclusive',
    description: '$8 off for orders over $40',
    type: 'fixed',
    value: 8,
    minOrderAmount: 40,
    startDate: new Date('2026-03-01'),
    endDate: new Date('2026-12-31'),
    usageLimit: 20,
    usageLimitPerUser: 1,
    active: true
  },
  {
    code: 'FREESHIP',
    name: 'Free Shipping',
    description: 'Free shipping for orders over $12',
    type: 'free_shipping',
    minOrderAmount: 12,
    startDate: new Date('2026-03-01'),
    endDate: new Date('2026-12-31'),
    usageLimit: 500,
    usageLimitPerUser: 5,
    active: true
  }
];

async function createPromotions() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ponsai');
    console.log('✅ Connected to database');

    // Try to find an admin user to use as createdBy
    const adminUser = await User.findOne({ role: 'admin' });
    const createdById = adminUser ? adminUser._id : null;

    // Clear existing promotions (optional)
    const deleteResult = await Promotion.deleteMany({});
    console.log(`🗑️  Deleted ${deleteResult.deletedCount} existing promotions`);

    // Create new promotions
    for (const promoData of samplePromotions) {
      try {
        const dataToCreate = { ...promoData };
        if (createdById) {
          dataToCreate.createdBy = createdById;
        }
        const promotion = await Promotion.create(dataToCreate);
        console.log(`✅ ${promotion.code}`);
      } catch (error) {
        console.error(`❌ ${promoData.code}: ${error.message}`);
      }
    }

    // Summary
    const total = await Promotion.countDocuments();
    console.log(`\n📊 Total: ${total} promotions created`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

// Run the script
createPromotions();

