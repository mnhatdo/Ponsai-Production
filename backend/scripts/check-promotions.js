const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const promotionSchema = new mongoose.Schema({
  code: String,
  name: String,
  description: String,
  type: String,
  value: Number,
  maxDiscount: Number,
  minOrderAmount: Number,
  startDate: Date,
  endDate: Date,
  usageLimit: Number,
  usageLimitPerUser: Number,
  usedCount: Number,
  active: Boolean
}, { timestamps: true });

const Promotion = mongoose.model('Promotion', promotionSchema);

async function checkPromotions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/furni');
    console.log('✅ Connected to MongoDB\n');

    const promos = await Promotion.find({}).lean();
    console.log(`📊 Found ${promos.length} promotions:\n`);

    promos.forEach(p => {
      console.log(`Code: ${p.code}`);
      console.log(`  Name: ${p.name}`);
      console.log(`  Type: ${p.type}`);
      console.log(`  Active: ${p.active}`);
      console.log(`  Start: ${p.startDate}`);
      console.log(`  End: ${p.endDate}`);
      console.log(`  Used: ${p.usedCount || 0}/${p.usageLimit || 'unlimited'}`);
      console.log('');
    });

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkPromotions();
