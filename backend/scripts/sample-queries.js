/**
 * Sample Data Queries
 * 
 * Các query mẫu để xem dữ liệu đã generate
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

require('../dist/models/User');
require('../dist/models/Product');
require('../dist/models/Order');
require('../dist/models/Session');
require('../dist/models/PageVisit');
require('../dist/models/DailyMetric');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ponsai';

async function sampleQueries() {
  try {
    await mongoose.connect(MONGODB_URI);
    
    const Order = mongoose.model('Order');
    const Session = mongoose.model('Session');
    const PageVisit = mongoose.model('PageVisit');
    const DailyMetric = mongoose.model('DailyMetric');
    
    console.log('\n📊 SAMPLE DATA QUERIES\n');
    console.log('='.repeat(70));
    
    // 1. Sample Orders
    console.log('\n1️⃣  Sample Orders (5 most recent):\n');
    const sampleOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name email')
      .populate('items.product', 'name price')
      .lean();
    
    sampleOrders.forEach((order, idx) => {
      console.log(`   ${idx + 1}. Order ID: ${order._id}`);
      console.log(`      User: ${order.user.name} (${order.user.email})`);
      console.log(`      Status: ${order.status} / Payment: ${order.paymentStatus}`);
      console.log(`      Method: ${order.paymentMethod}`);
      console.log(`      Total: £${order.totalAmount.toFixed(2)}`);
      console.log(`      Items: ${order.items.length} products`);
      order.items.forEach(item => {
        console.log(`         - ${item.product.name} x${item.quantity} @ £${item.price}`);
      });
      console.log(`      Created: ${order.createdAt.toISOString()}\n`);
    });
    
    // 2. Sample Sessions
    console.log('\n2️⃣  Sample Sessions (5 random):\n');
    const sampleSessions = await Session.aggregate([
      { $sample: { size: 5 } }
    ]);
    
    sampleSessions.forEach((session, idx) => {
      console.log(`   ${idx + 1}. Session ID: ${session.sessionId}`);
      console.log(`      IP: ${session.ipAddress}`);
      console.log(`      Page Views: ${session.pageViews}`);
      console.log(`      Duration: ${Math.round((session.lastActivity - session.startTime) / 1000 / 60)} minutes`);
      console.log(`      Started: ${session.startTime.toISOString()}\n`);
    });
    
    // 3. Sample Page Visits
    console.log('\n3️⃣  Sample Page Visits (10 recent):\n');
    const samplePageVisits = await PageVisit.find()
      .sort({ timestamp: -1 })
      .limit(10)
      .lean();
    
    samplePageVisits.forEach((pv, idx) => {
      console.log(`   ${idx + 1}. ${pv.path.padEnd(40)} | Time: ${pv.timeOnPage}s | ${pv.timestamp.toISOString()}`);
    });
    
    // 4. Sample Daily Metrics
    console.log('\n\n4️⃣  Sample Daily Metrics (Last 7 days):\n');
    const last7Days = await DailyMetric.find()
      .sort({ date: -1 })
      .limit(7)
      .lean();
    
    console.log('   Date         | Sessions | Orders | Revenue    | Conv% | Avg Order');
    console.log('   ' + '-'.repeat(68));
    
    last7Days.forEach(metric => {
      const date = metric.date.toISOString().split('T')[0];
      const sessions = metric.totalSessions.toString().padStart(8);
      const orders = metric.totalOrders.toString().padStart(6);
      const revenue = `£${metric.totalRevenue.toFixed(2)}`.padStart(10);
      const conv = `${metric.conversionRate.toFixed(1)}%`.padStart(5);
      const avgOrder = `£${metric.avgOrderValue.toFixed(2)}`.padStart(9);
      
      console.log(`   ${date} | ${sessions} | ${orders} | ${revenue} | ${conv} | ${avgOrder}`);
    });
    
    // 5. Revenue by Payment Method
    console.log('\n\n5️⃣  Revenue by Payment Method:\n');
    const revenueByMethod = await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      {
        $group: {
          _id: '$paymentMethod',
          totalRevenue: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 },
          avgOrder: { $avg: '$totalAmount' }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);
    
    console.log('   Method           | Revenue      | Orders | Avg Order');
    console.log('   ' + '-'.repeat(55));
    
    revenueByMethod.forEach(method => {
      const name = method._id.padEnd(16);
      const revenue = `£${method.totalRevenue.toFixed(2)}`.padStart(12);
      const count = method.orderCount.toString().padStart(6);
      const avg = `£${method.avgOrder.toFixed(2)}`.padStart(9);
      
      console.log(`   ${name} | ${revenue} | ${count} | ${avg}`);
    });
    
    // 6. Monthly trend
    console.log('\n\n6️⃣  Monthly Revenue Trend:\n');
    const monthlyRevenue = await DailyMetric.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          totalRevenue: { $sum: '$totalRevenue' },
          totalOrders: { $sum: '$totalOrders' },
          days: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    
    console.log('   Month       | Revenue      | Orders | Days | Avg/Day');
    console.log('   ' + '-'.repeat(56));
    
    monthlyRevenue.forEach(month => {
      const monthName = `${month._id.year}-${String(month._id.month).padStart(2, '0')}`.padEnd(11);
      const revenue = `£${month.totalRevenue.toFixed(2)}`.padStart(12);
      const orders = month.totalOrders.toString().padStart(6);
      const days = month.days.toString().padStart(4);
      const avgPerDay = `£${(month.totalRevenue / month.days).toFixed(2)}`.padStart(7);
      
      console.log(`   ${monthName} | ${revenue} | ${orders} | ${days} | ${avgPerDay}`);
    });
    
    console.log('\n' + '='.repeat(70) + '\n');
    
    await mongoose.disconnect();
    process.exit(0);
    
  } catch (error) {
    console.error('Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

sampleQueries();

