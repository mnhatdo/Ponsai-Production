/**
 * Payment Lifecycle Migration Script
 * 
 * This script migrates existing orders from old payment statuses to new unified lifecycle.
 * 
 * CHANGES:
 * - 'pending_manual_payment' → 'pending' (both status and paymentStatus)
 * - Ensures all orders follow new lifecycle
 * 
 * SAFE TO RUN MULTIPLE TIMES (idempotent)
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ponsai');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Migration function
const migrateOrders = async () => {
  console.log('\n🔄 Starting payment lifecycle migration...\n');

  const Order = mongoose.connection.collection('orders');

  // Step 1: Find orders with old status
  const oldStatusOrders = await Order.find({
    $or: [
      { status: 'pending_manual_payment' },
      { paymentStatus: 'pending_manual_payment' }
    ]
  }).toArray();

  console.log(`📊 Found ${oldStatusOrders.length} orders with old statuses`);

  if (oldStatusOrders.length === 0) {
    console.log('✅ No orders need migration. System already up-to-date.');
    return;
  }

  // Step 2: Show summary before migration
  console.log('\n📋 Orders to migrate:');
  oldStatusOrders.forEach((order, idx) => {
    console.log(`  ${idx + 1}. Order ${order._id}`);
    console.log(`     Current status: ${order.status}`);
    console.log(`     Current paymentStatus: ${order.paymentStatus}`);
    console.log(`     Payment method: ${order.paymentMethod || 'N/A'}`);
  });

  // Step 3: Confirm migration
  console.log('\n⚠️  This will update the following:');
  console.log('   - status: "pending_manual_payment" → "created"');
  console.log('   - paymentStatus: "pending_manual_payment" → "pending"');
  console.log('\nStarting migration in 3 seconds...');
  
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Step 4: Execute migration
  let successCount = 0;
  let errorCount = 0;

  for (const order of oldStatusOrders) {
    try {
      const updateFields = {};

      // Update status if needed
      if (order.status === 'pending_manual_payment') {
        updateFields.status = 'created';
      }

      // Update paymentStatus if needed
      if (order.paymentStatus === 'pending_manual_payment') {
        updateFields.paymentStatus = 'pending';
      }

      // Perform update
      const result = await Order.updateOne(
        { _id: order._id },
        { $set: updateFields }
      );

      if (result.modifiedCount > 0) {
        console.log(`✅ Migrated order ${order._id}`);
        console.log(`   Updated: ${JSON.stringify(updateFields)}`);
        successCount++;
      } else {
        console.log(`⚠️  Order ${order._id} already in correct state`);
      }

    } catch (error) {
      console.error(`❌ Failed to migrate order ${order._id}:`, error.message);
      errorCount++;
    }
  }

  // Step 5: Summary
  console.log('\n═══════════════════════════════════════');
  console.log('MIGRATION SUMMARY');
  console.log('═══════════════════════════════════════');
  console.log(`Total orders found: ${oldStatusOrders.length}`);
  console.log(`Successfully migrated: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log('═══════════════════════════════════════\n');

  // Step 6: Verify migration
  console.log('🔍 Verifying migration...');
  
  const remainingOldStatus = await Order.countDocuments({
    $or: [
      { status: 'pending_manual_payment' },
      { paymentStatus: 'pending_manual_payment' }
    ]
  });

  if (remainingOldStatus === 0) {
    console.log('✅ Verification passed: No orders with old statuses remain');
  } else {
    console.error(`❌ Verification failed: ${remainingOldStatus} orders still have old statuses`);
  }

  // Step 7: Show new status distribution
  console.log('\n📊 Order Status Distribution (after migration):');
  
  const statusDistribution = await Order.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]);

  statusDistribution.forEach(stat => {
    console.log(`   ${stat._id}: ${stat.count}`);
  });

  console.log('\n📊 Payment Status Distribution (after migration):');
  
  const paymentStatusDistribution = await Order.aggregate([
    { $group: { _id: '$paymentStatus', count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]);

  paymentStatusDistribution.forEach(stat => {
    console.log(`   ${stat._id}: ${stat.count}`);
  });
};

// Main execution
const main = async () => {
  try {
    await connectDB();
    await migrateOrders();
    
    console.log('\n✅ Migration completed successfully');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
};

// Run migration
main();

