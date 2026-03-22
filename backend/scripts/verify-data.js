/**
 * Verify Generated Data Quality
 * 
 * Kiểm tra chi tiết dữ liệu đã generate
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

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/furni';

async function verifyData() {
  try {
    await mongoose.connect(MONGODB_URI);
    
    const Order = mongoose.model('Order');
    const Session = mongoose.model('Session');
    const PageVisit = mongoose.model('PageVisit');
    const DailyMetric = mongoose.model('DailyMetric');
    
    console.log('\n='.repeat(70));
    console.log('📊 DATA VERIFICATION REPORT');
    console.log('='.repeat(70));
    
    // Orders breakdown
    console.log('\n📦 ORDERS BREAKDOWN:\n');
    
    const orderStatusCounts = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('   Order Status:');
    orderStatusCounts.forEach(s => {
      console.log(`   - ${s._id.padEnd(15)}: ${s.count}`);
    });
    
    const paymentStatusCounts = await Order.aggregate([
      { $group: { _id: '$paymentStatus', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('\n   Payment Status:');
    paymentStatusCounts.forEach(s => {
      console.log(`   - ${s._id.padEnd(15)}: ${s.count}`);
    });
    
    const paymentMethodCounts = await Order.aggregate([
      { $group: { _id: '$paymentMethod', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('\n   Payment Methods:');
    paymentMethodCounts.forEach(s => {
      console.log(`   - ${s._id.padEnd(15)}: ${s.count}`);
    });
    
    // Revenue stats
    const revenueStats = await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          avgOrderValue: { $avg: '$totalAmount' },
          count: { $sum: 1 }
        }
      }
    ]);
    
    if (revenueStats.length > 0) {
      const stats = revenueStats[0];
      console.log('\n💰 REVENUE STATS (Paid Orders):');
      console.log(`   Total Revenue:  £${stats.totalRevenue.toFixed(2)}`);
      console.log(`   Avg Order:      £${stats.avgOrderValue.toFixed(2)}`);
      console.log(`   Paid Orders:    ${stats.count}`);
    }
    
    // Sessions stats
    console.log('\n\n👥 SESSION STATS:\n');
    
    const sessionStats = await Session.aggregate([
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          avgPageViews: { $avg: '$pageViews' },
          maxPageViews: { $max: '$pageViews' }
        }
      }
    ]);
    
    if (sessionStats.length > 0) {
      const stats = sessionStats[0];
      console.log(`   Total Sessions:     ${stats.totalSessions}`);
      console.log(`   Avg Pages/Session:  ${stats.avgPageViews.toFixed(2)}`);
      console.log(`   Max Pages/Session:  ${stats.maxPageViews}`);
    }
    
    // Unique visitors (by IP)
    const uniqueIPs = await Session.distinct('ipAddress');
    console.log(`   Unique Visitors:    ${uniqueIPs.length}`);
    
    // User agent breakdown
    const userAgents = await Session.aggregate([
      { $group: { _id: '$userAgent', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    console.log('\n   Top User Agents:');
    userAgents.forEach(ua => {
      const browser = ua._id.includes('Chrome') ? 'Chrome' :
                     ua._id.includes('Firefox') ? 'Firefox' :
                     ua._id.includes('Safari') ? 'Safari' :
                     ua._id.includes('Edge') ? 'Edge' : 'Other';
      console.log(`   - ${browser.padEnd(10)}: ${ua.count}`);
    });
    
    // PageVisit stats
    const pageVisitCount = await PageVisit.countDocuments();
    console.log(`\n\n📄 PAGE VISITS: ${pageVisitCount}\n`);
    
    const topPages = await PageVisit.aggregate([
      { $group: { _id: '$path', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    console.log('   Top 10 Pages:');
    topPages.forEach((page, idx) => {
      console.log(`   ${(idx + 1).toString().padStart(2)}. ${page._id.padEnd(30)}: ${page.count}`);
    });
    
    // Daily Metrics
    console.log(`\n\n📈 DAILY METRICS:\n`);
    
    const metricsCount = await DailyMetric.countDocuments();
    console.log(`   Total Days:         ${metricsCount}`);
    
    const avgMetrics = await DailyMetric.aggregate([
      {
        $group: {
          _id: null,
          avgSessions: { $avg: '$totalSessions' },
          avgOrders: { $avg: '$totalOrders' },
          avgRevenue: { $avg: '$totalRevenue' },
          avgConversion: { $avg: '$conversionRate' }
        }
      }
    ]);
    
    if (avgMetrics.length > 0) {
      const stats = avgMetrics[0];
      console.log(`   Avg Sessions/Day:   ${stats.avgSessions.toFixed(1)}`);
      console.log(`   Avg Orders/Day:     ${stats.avgOrders.toFixed(1)}`);
      console.log(`   Avg Revenue/Day:    £${stats.avgRevenue.toFixed(2)}`);
      console.log(`   Avg Conversion:     ${stats.avgConversion.toFixed(2)}%`);
    }
    
    // Date range
    const oldestMetric = await DailyMetric.findOne().sort({ date: 1 });
    const newestMetric = await DailyMetric.findOne().sort({ date: -1 });
    
    if (oldestMetric && newestMetric) {
      console.log(`\n   Date Range:         ${oldestMetric.date.toISOString().split('T')[0]} to ${newestMetric.date.toISOString().split('T')[0]}`);
    }
    
    // Data quality checks
    console.log('\n\n✅ DATA QUALITY CHECKS:\n');
    
    const invalidOrders = await Order.countDocuments({
      $or: [
        { status: 'created' },
        { paymentStatus: 'created' }
      ]
    });
    console.log(`   Orders with 'created':          ${invalidOrders === 0 ? '✓ None' : '❌ ' + invalidOrders}`);
    
    const invalidCancelled = await Order.countDocuments({
      status: 'cancelled',
      paymentStatus: { $ne: 'cancelled' }
    });
    console.log(`   Invalid cancelled orders:       ${invalidCancelled === 0 ? '✓ None' : '❌ ' + invalidCancelled}`);
    
    const ordersWithoutItems = await Order.countDocuments({
      $or: [
        { items: { $exists: false } },
        { items: { $size: 0 } }
      ]
    });
    console.log(`   Orders without items:           ${ordersWithoutItems === 0 ? '✓ None' : '❌ ' + ordersWithoutItems}`);
    
    const sessionsWithoutPages = await Session.countDocuments({
      pageViews: { $lte: 0 }
    });
    console.log(`   Sessions without pageviews:     ${sessionsWithoutPages === 0 ? '✓ None' : '❌ ' + sessionsWithoutPages}`);
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ VERIFICATION COMPLETE');
    console.log('='.repeat(70) + '\n');
    
    await mongoose.disconnect();
    process.exit(0);
    
  } catch (error) {
    console.error('Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

verifyData();
