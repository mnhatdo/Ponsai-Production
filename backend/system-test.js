const http = require('http');

console.log('\n🧪 BACKEND SYSTEM TEST\n');
console.log('='.repeat(60));

const tests = [];
let passedTests = 0;
let failedTests = 0;

// Test helper
function makeRequest(options, testName, expectedStatus = 200) {
  return new Promise((resolve) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        const passed = res.statusCode === expectedStatus;
        if (passed) {
          console.log(`✅ ${testName}`);
          console.log(`   Status: ${res.statusCode}`);
          passedTests++;
        } else {
          console.log(`❌ ${testName}`);
          console.log(`   Expected: ${expectedStatus}, Got: ${res.statusCode}`);
          failedTests++;
        }
        
        try {
          const data = JSON.parse(body);
          if (data.data) {
            console.log(`   Data keys: ${Object.keys(data.data).join(', ')}`);
          }
          if (data.meta) {
            console.log(`   Meta: dateRange=${data.meta.dateRange ? 'YES' : 'NO'}`);
          }
        } catch (e) {
          // Not JSON or parsing failed
        }
        
        console.log('');
        resolve();
      });
    });

    req.on('error', (error) => {
      console.log(`❌ ${testName}`);
      console.log(`   Error: ${error.message}\n`);
      failedTests++;
      resolve();
    });

    if (options.method === 'POST' && options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function runTests() {
  // Test 1: Health Check
  await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/health',
    method: 'GET'
  }, 'Test 1: Health Check', 200);

  // Test 2: Event Tracking (Guest User)
  await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/events',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      eventType: 'product_viewed',
      anonymousId: 'test_guest_789',
      metadata: {
        productId: 'test_product_123',
        productName: 'Test Chair',
        price: 100
      }
    })
  }, 'Test 2: Event Tracking (Guest User)', 202);

  // Test 3: Event Tracking Batch
  await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/events/batch',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      events: [
        {
          eventType: 'product_viewed',
          anonymousId: 'batch_test_001',
          metadata: { productId: 'prod1' }
        },
        {
          eventType: 'added_to_cart',
          anonymousId: 'batch_test_001',
          metadata: { productId: 'prod1', quantity: 2, price: 50 }
        }
      ]
    })
  }, 'Test 3: Event Tracking Batch', 202);

  // Test 4: Analytics Overview (should fail - no auth)
  await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/admin/analytics/events/overview',
    method: 'GET'
  }, 'Test 4: Analytics Overview (No Auth - Expected Fail)', 401);

  // Test 5: Analytics Funnel (should fail - no auth)
  await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/admin/analytics/events/funnel',
    method: 'GET'
  }, 'Test 5: Analytics Funnel (No Auth - Expected Fail)', 401);

  // Test 6: Products Endpoint
  await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/products?limit=5',
    method: 'GET'
  }, 'Test 6: Public Products API', 200);

  // Test 7: Invalid Event Type (should still return 202 but log warning)
  await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/events',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      eventType: 'invalid_event_type',
      anonymousId: 'test_invalid'
    })
  }, 'Test 7: Invalid Event Type (Non-blocking)', 202);

  // Test 8: Event without eventType (should still return 202)
  await makeRequest({
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/events',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      anonymousId: 'test_no_type',
      metadata: { test: 'data' }
    })
  }, 'Test 8: Event without eventType (Non-blocking)', 202);

  // Summary
  console.log('='.repeat(60));
  console.log('\n📊 TEST SUMMARY\n');
  console.log(`Total Tests: ${passedTests + failedTests}`);
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  
  if (failedTests === 0) {
    console.log('\n🎉 ALL TESTS PASSED!\n');
  } else {
    console.log('\n⚠️  SOME TESTS FAILED\n');
  }

  console.log('='.repeat(60));
  console.log('\n📝 NOTES:');
  console.log('- Event tracking is non-blocking (always returns 202)');
  console.log('- Analytics endpoints require admin authentication');
  console.log('- Invalid events are silently logged, not rejected');
  console.log('- Health check confirms MongoDB connection');
  console.log('\n');
}

runTests();
