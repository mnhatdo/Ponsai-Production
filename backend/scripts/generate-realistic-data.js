/**
 * Generate Realistic Test Data
 * 
 * Tạo dữ liệu giả hợp lý cho:
 * - Sessions (6 tháng)
 * - PageVisits
 * - Orders (sử dụng users và products hiện có)
 * - DailyMetrics (tổng hợp từ dữ liệu thật)
 * 
 * Yêu cầu:
 * - Không tạo users mới (dùng users hiện có)
 * - Không tạo products/categories mới (dùng hiện có)
 * - Thời gian: 6 tháng trở lại từ hôm nay
 * - Orders: không có status/payment 'created'
 * - Nếu order cancelled thì payment phải cancelled
 * - Dữ liệu đồng nhất và hợp lý
 * 
 * Usage:
 * cd backend
 * npm run build
 * node scripts/generate-realistic-data.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Import compiled models
require('../dist/models/User');
require('../dist/models/Product');
require('../dist/models/Category');
require('../dist/models/Order');
require('../dist/models/Session');
require('../dist/models/PageVisit');
require('../dist/models/DailyMetric');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ponsai';

// Realistic user agents
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPad; CPU OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
];

// Realistic page paths
const PAGE_PATHS = [
  '/',
  '/products',
  '/cart',
  '/checkout',
  '/about',
  '/contact'
];

// Order statuses theo workflow hợp lý (NO 'created')
const ORDER_WORKFLOWS = [
  { status: 'pending', paymentStatus: 'pending', weight: 10 }, // Đợi xử lý
  { status: 'pending', paymentStatus: 'paid', weight: 15 }, // Đã thanh toán, chờ xử lý
  { status: 'processing', paymentStatus: 'paid', weight: 20 }, // Đang xử lý
  { status: 'shipped', paymentStatus: 'paid', weight: 25 }, // Đã gửi hàng
  { status: 'delivered', paymentStatus: 'paid', weight: 25 }, // Đã giao
  { status: 'cancelled', paymentStatus: 'cancelled', weight: 5 } // Đã hủy
];

// Payment methods
const PAYMENT_METHODS = ['momo', 'manual_payment', 'cod', 'bank_transfer'];

// Helper: Random IP address
function randomIP() {
  return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}

// Helper: Random item from array
function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Helper: Random number in range
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper: Weighted random selection
function weightedRandom(items) {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const item of items) {
    random -= item.weight;
    if (random <= 0) return item;
  }
  
  return items[0];
}

// Helper: Random date in range
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Helper: Vietnamese addresses
const VIETNAMESE_ADDRESSES = [
  { street: '123 Nguyễn Huệ', city: 'Hồ Chí Minh', state: 'TP.HCM', zipCode: '700000', country: 'Vietnam' },
  { street: '456 Lê Lợi', city: 'Hà Nội', state: 'Hà Nội', zipCode: '100000', country: 'Vietnam' },
  { street: '789 Trần Phú', city: 'Đà Nẵng', state: 'Đà Nẵng', zipCode: '550000', country: 'Vietnam' },
  { street: '321 Hai Bà Trưng', city: 'Huế', state: 'Thừa Thiên Huế', zipCode: '530000', country: 'Vietnam' },
  { street: '654 Nguyễn Trãi', city: 'Cần Thơ', state: 'Cần Thơ', zipCode: '900000', country: 'Vietnam' }
];

async function generateRealisticData() {
  try {
    console.log('='.repeat(70));
    console.log('GENERATE REALISTIC TEST DATA - 6 MONTHS');
    console.log('='.repeat(70));
    console.log('');

    // Connect to database
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    const User = mongoose.model('User');
    const Product = mongoose.model('Product');
    const Category = mongoose.model('Category');
    const Order = mongoose.model('Order');
    const Session = mongoose.model('Session');
    const PageVisit = mongoose.model('PageVisit');
    const DailyMetric = mongoose.model('DailyMetric');

    // ==========================================
    // STEP 1: Check existing data
    // ==========================================
    console.log('📊 Checking existing data in database...\n');
    
    const userCount = await User.countDocuments();
    const productCount = await Product.countDocuments();
    const categoryCount = await Category.countDocuments();
    
    console.log(`   Users:      ${userCount}`);
    console.log(`   Products:   ${productCount}`);
    console.log(`   Categories: ${categoryCount}`);
    console.log('');

    if (userCount === 0) {
      console.log('❌ ERROR: No users found! Please seed users first.');
      console.log('   Run: npm run seed:admin\n');
      process.exit(1);
    }

    if (productCount === 0) {
      console.log('❌ ERROR: No products found! Please seed products first.');
      console.log('   Run: npm run seed:bonsai\n');
      process.exit(1);
    }

    // Fetch all users and products
    console.log('📥 Loading existing data...\n');
    const users = await User.find({ role: 'user' }).select('_id name email').lean();
    const products = await Product.find({ inStock: true }).select('_id name price').lean();
    
    if (users.length === 0) {
      console.log('❌ ERROR: No regular users found! Only admins exist.');
      console.log('   Please create some test users first.\n');
      process.exit(1);
    }

    console.log(`   ✓ Loaded ${users.length} users (role: user)`);
    console.log(`   ✓ Loaded ${products.length} products (in stock)\n`);

    // ==========================================
    // STEP 2: Clear old test data
    // ==========================================
    console.log('🗑️  Clearing old test data...\n');
    
    const deletedSessions = await Session.deleteMany({});
    const deletedPageVisits = await PageVisit.deleteMany({});
    const deletedOrders = await Order.deleteMany({});
    const deletedMetrics = await DailyMetric.deleteMany({});
    
    console.log(`   ✓ Deleted ${deletedSessions.deletedCount} sessions`);
    console.log(`   ✓ Deleted ${deletedPageVisits.deletedCount} page visits`);
    console.log(`   ✓ Deleted ${deletedOrders.deletedCount} orders`);
    console.log(`   ✓ Deleted ${deletedMetrics.deletedCount} daily metrics\n`);

    // ==========================================
    // STEP 3: Generate data for last 6 months
    // ==========================================
    console.log('🎲 Generating realistic data for last 6 months...\n');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const sixMonthsAgo = new Date(today);
    sixMonthsAgo.setMonth(today.getMonth() - 6);
    
    const daysToGenerate = Math.floor((today - sixMonthsAgo) / (1000 * 60 * 60 * 24));
    
    console.log(`   Start date: ${sixMonthsAgo.toISOString().split('T')[0]}`);
    console.log(`   End date:   ${today.toISOString().split('T')[0]}`);
    console.log(`   Total days: ${daysToGenerate}\n`);

    let totalSessionsCreated = 0;
    let totalPageVisitsCreated = 0;
    let totalOrdersCreated = 0;

    // Generate day by day
    for (let dayOffset = 0; dayOffset < daysToGenerate; dayOffset++) {
      const currentDate = new Date(sixMonthsAgo);
      currentDate.setDate(sixMonthsAgo.getDate() + dayOffset);
      
      const dayOfWeek = currentDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      
      // Realistic visitor patterns
      const baseVisitors = randomInt(50, 150);
      const weekendBoost = isWeekend ? 1.5 : 1.0;
      const growthTrend = 1 + (dayOffset / daysToGenerate) * 0.3; // 30% growth over 6 months
      
      const dailyVisitors = Math.floor(baseVisitors * weekendBoost * growthTrend);
      
      // Sessions for this day
      const sessionsForDay = [];
      const pageVisitsForDay = [];
      
      for (let i = 0; i < dailyVisitors; i++) {
        // Random time during the day (weighted towards afternoon/evening)
        const hour = Math.random() < 0.7 ? randomInt(14, 22) : randomInt(8, 13);
        const sessionDate = new Date(currentDate);
        sessionDate.setHours(hour, randomInt(0, 59), randomInt(0, 59));
        
        const sessionId = `sess_${sessionDate.getTime()}_${randomInt(100000, 999999)}`;
        const ipAddress = randomIP();
        const userAgent = randomItem(USER_AGENTS);
        
        // 30% chance user is logged in
        const isLoggedIn = Math.random() < 0.3;
        const userId = isLoggedIn ? randomItem(users)._id : undefined;
        
        // Session duration: 2-15 minutes
        const sessionDurationMinutes = randomInt(2, 15);
        const lastActivity = new Date(sessionDate);
        lastActivity.setMinutes(lastActivity.getMinutes() + sessionDurationMinutes);
        
        // Pages viewed: 2-10 pages
        const pagesViewed = randomInt(2, 10);
        
        const session = {
          sessionId,
          ipAddress,
          userAgent,
          userId,
          startTime: sessionDate,
          lastActivity,
          expiresAt: new Date(lastActivity.getTime() + 30 * 60 * 1000),
          pageViews: pagesViewed,
          isActive: false
        };
        
        sessionsForDay.push(session);
        
        // Generate page visits for this session
        let currentTime = new Date(sessionDate);
        for (let p = 0; p < pagesViewed; p++) {
          let pagePath = p === 0 ? '/' : randomItem(PAGE_PATHS);
          
          // Add product detail pages
          if (Math.random() < 0.3) {
            const productId = randomItem(products)._id;
            pagePath = `/products/${productId}`;
          }
          
          const pageVisit = {
            sessionId,
            url: `http://localhost:4200${pagePath}`,
            path: pagePath,
            referrer: p === 0 ? 'https://google.com' : undefined,
            timestamp: new Date(currentTime),
            timeOnPage: randomInt(10, 120) // 10-120 seconds
          };
          
          pageVisitsForDay.push(pageVisit);
          
          // Next page view is 10-60 seconds later
          currentTime = new Date(currentTime.getTime() + randomInt(10, 60) * 1000);
        }
      }
      
      // Bulk insert sessions (without session reference)
      if (sessionsForDay.length > 0) {
        const insertedSessions = await Session.insertMany(sessionsForDay);
        totalSessionsCreated += insertedSessions.length;
        
        // Link page visits to actual session documents
        const sessionMap = {};
        insertedSessions.forEach(s => {
          sessionMap[s.sessionId] = s._id;
        });
        
        pageVisitsForDay.forEach(pv => {
          pv.session = sessionMap[pv.sessionId];
        });
        
        await PageVisit.insertMany(pageVisitsForDay);
        totalPageVisitsCreated += pageVisitsForDay.length;
      }
      
      // ==========================================
      // Generate Orders for this day
      // ==========================================
      // 5-15% of sessions result in orders
      const conversionRate = randomInt(5, 15) / 100;
      const ordersToday = Math.floor(dailyVisitors * conversionRate);
      
      const ordersForDay = [];
      
      for (let o = 0; o < ordersToday; o++) {
        // Random order time during the day
        const orderHour = randomInt(9, 21);
        const orderDate = new Date(currentDate);
        orderDate.setHours(orderHour, randomInt(0, 59), randomInt(0, 59));
        
        // Random user
        const user = randomItem(users);
        
        // Random 1-3 products
        const numItems = randomInt(1, 3);
        const items = [];
        let totalAmount = 0;
        
        for (let i = 0; i < numItems; i++) {
          const product = randomItem(products);
          const quantity = randomInt(1, 3);
          const price = product.price;
          
          items.push({
            product: product._id,
            quantity,
            price
          });
          
          totalAmount += price * quantity;
        }
        
        // Random workflow (NO 'created' status)
        const workflow = weightedRandom(ORDER_WORKFLOWS);
        
        // Payment method
        const paymentMethod = randomItem(PAYMENT_METHODS);
        
        // Payment details based on status
        let paymentDetails = {
          gateway: paymentMethod
        };
        
        if (workflow.paymentStatus === 'paid') {
          paymentDetails.paidAt = new Date(orderDate.getTime() + randomInt(1, 60) * 60 * 1000);
          paymentDetails.transactionId = `TXN${Date.now()}${randomInt(1000, 9999)}`;
          
          if (paymentMethod === 'momo') {
            paymentDetails.momoOrderId = `MOMO${Date.now()}`;
            paymentDetails.momoRequestId = `REQ${Date.now()}`;
            paymentDetails.resultCode = 0;
            paymentDetails.amountGBP = totalAmount;
            paymentDetails.amountVND = Math.floor(totalAmount * 30000);
          } else if (paymentMethod === 'bank_transfer') {
            paymentDetails.reference = `GBPORD-${Date.now().toString().slice(-8)}`;
            paymentDetails.invoiceNumber = `INV-2026-${String(o + 1).padStart(6, '0')}`;
          }
        }
        
        const order = {
          user: user._id,
          items,
          totalAmount,
          shippingAddress: randomItem(VIETNAMESE_ADDRESSES),
          status: workflow.status,
          paymentStatus: workflow.paymentStatus,
          paymentMethod,
          paymentDetails,
          trackingNumber: ['shipped', 'delivered'].includes(workflow.status) 
            ? `VN${Date.now().toString().slice(-10)}` 
            : undefined,
          createdAt: orderDate,
          updatedAt: orderDate
        };
        
        ordersForDay.push(order);
      }
      
      if (ordersForDay.length > 0) {
        await Order.insertMany(ordersForDay);
        totalOrdersCreated += ordersForDay.length;
      }
      
      // Progress indicator
      if ((dayOffset + 1) % 30 === 0 || dayOffset === daysToGenerate - 1) {
        const progress = ((dayOffset + 1) / daysToGenerate * 100).toFixed(1);
        console.log(`   Progress: ${progress}% (${dayOffset + 1}/${daysToGenerate} days)`);
      }
    }
    
    console.log('\n   ✓ Data generation complete!\n');
    console.log(`   Total Sessions:    ${totalSessionsCreated}`);
    console.log(`   Total Page Visits: ${totalPageVisitsCreated}`);
    console.log(`   Total Orders:      ${totalOrdersCreated}\n`);

    // ==========================================
    // STEP 4: Aggregate Daily Metrics
    // ==========================================
    console.log('📊 Aggregating daily metrics from real data...\n');
    
    const dailyMetricsService = require('../dist/services/dailyMetricsService').default;
    await dailyMetricsService.aggregateLastNDays(daysToGenerate);
    
    const metricsCount = await DailyMetric.countDocuments();
    console.log(`   ✓ Created ${metricsCount} daily metric records\n`);

    // ==========================================
    // STEP 5: Verify data quality
    // ==========================================
    console.log('✅ Verifying data quality...\n');
    
    // Check no 'created' status orders
    const createdOrders = await Order.countDocuments({ 
      $or: [
        { status: 'created' },
        { paymentStatus: 'created' }
      ]
    });
    
    if (createdOrders > 0) {
      console.log(`   ❌ WARNING: Found ${createdOrders} orders with 'created' status!`);
    } else {
      console.log('   ✓ No orders with "created" status');
    }
    
    // Check cancelled orders have cancelled payment
    const invalidCancelled = await Order.countDocuments({
      status: 'cancelled',
      paymentStatus: { $ne: 'cancelled' }
    });
    
    if (invalidCancelled > 0) {
      console.log(`   ❌ WARNING: Found ${invalidCancelled} cancelled orders without cancelled payment!`);
    } else {
      console.log('   ✓ All cancelled orders have cancelled payment status');
    }
    
    // Check date range
    const oldestSession = await Session.findOne().sort({ startTime: 1 });
    const newestSession = await Session.findOne().sort({ startTime: -1 });
    
    if (oldestSession && newestSession) {
      console.log(`   ✓ Date range: ${oldestSession.startTime.toISOString().split('T')[0]} to ${newestSession.startTime.toISOString().split('T')[0]}`);
    }
    
    // Check orders use existing users/products
    const ordersWithInvalidUser = await Order.countDocuments({
      user: { $nin: users.map(u => u._id) }
    });
    
    if (ordersWithInvalidUser > 0) {
      console.log(`   ❌ WARNING: Found ${ordersWithInvalidUser} orders with invalid users!`);
    } else {
      console.log('   ✓ All orders reference existing users');
    }

    console.log('');
    console.log('='.repeat(70));
    console.log('✅ DATA GENERATION SUCCESSFUL!');
    console.log('='.repeat(70));
    console.log('');
    console.log('📈 Summary:');
    console.log(`   • ${totalSessionsCreated} sessions over ${daysToGenerate} days`);
    console.log(`   • ${totalPageVisitsCreated} page views`);
    console.log(`   • ${totalOrdersCreated} orders`);
    console.log(`   • ${metricsCount} daily metric records`);
    console.log(`   • Using ${users.length} existing users`);
    console.log(`   • Using ${products.length} existing products`);
    console.log('');
    console.log('🎯 Ready for analytics and ML training!');
    console.log('');

    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('');
    console.error('❌ ERROR:', error.message);
    console.error(error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run
generateRealisticData();

