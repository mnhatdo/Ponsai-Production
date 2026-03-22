/**
 * Daily Metrics Aggregation Script
 * 
 * Run this script to aggregate historical data for ML training
 * 
 * Usage:
 * node backend/scripts/aggregate-metrics.js [days]
 * 
 * Examples:
 * node backend/scripts/aggregate-metrics.js           # Last 30 days
 * node backend/scripts/aggregate-metrics.js 90        # Last 90 days
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Import service
const dailyMetricsService = require('../dist/services/dailyMetricsService').default;

// Database connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/furni';

async function aggregateMetrics(days = 30) {
  try {
    console.log('='.repeat(60));
    console.log('DAILY METRICS AGGREGATION');
    console.log('='.repeat(60));
    console.log(`Aggregating last ${days} days...`);
    console.log('');

    // Connect to database
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Run aggregation
    const startTime = Date.now();
    const results = await dailyMetricsService.aggregateLastNDays(days);
    const endTime = Date.now();

    console.log('');
    console.log('='.repeat(60));
    console.log('AGGREGATION COMPLETE');
    console.log('='.repeat(60));
    console.log(`✓ Processed ${results.length} days`);
    console.log(`✓ Time taken: ${((endTime - startTime) / 1000).toFixed(2)}s`);
    console.log('');
    
    // Show summary
    if (results.length > 0) {
      const totalSessions = results.reduce((sum, r) => sum + r.totalSessions, 0);
      const totalOrders = results.reduce((sum, r) => sum + r.completedOrders, 0);
      const totalRevenue = results.reduce((sum, r) => sum + r.totalRevenue, 0);
      
      console.log('SUMMARY:');
      console.log(`  Total Sessions: ${totalSessions}`);
      console.log(`  Total Orders: ${totalOrders}`);
      console.log(`  Total Revenue: £${totalRevenue.toFixed(2)}`);
      console.log('');
    }

    console.log('You can now train ML models with this data!');
    console.log('');

    // Close connection
    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('');
    console.error('❌ Aggregation failed:');
    console.error(error);
    process.exit(1);
  }
}

// Get days from command line argument
const days = process.argv[2] ? parseInt(process.argv[2]) : 30;

// Run aggregation
aggregateMetrics(days);
