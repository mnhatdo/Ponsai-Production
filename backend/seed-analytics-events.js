// Seed Analytics Events for Testing
const baseUrl = 'http://localhost:3000';

// Helper function to make requests
async function postEvent(event) {
  try {
    const response = await fetch(`${baseUrl}/api/v1/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    });
    
    if (response.status === 202) {
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

// Seed events
async function seedEvents() {
  console.log('\n🌱 SEEDING ANALYTICS EVENTS...\n');

  const users = ['user_001', 'user_002', 'user_003'];
  const guests = ['guest_001', 'guest_002', 'guest_003', 'guest_004'];
  const products = [
    { id: '69569cdb927a8da299d475d5', name: 'Venus Brown Cascade Bonsai Pot 15cm', price: 114.29 },
    { id: '69569cdb927a8da299d475d3', name: 'Juniper Bonsai Starter', price: 57.14 },
    { id: '69569cdb927a8da299d475d1', name: 'Juniper Bonsai Starter 2', price: 57.14 }
  ];

  let successCount = 0;
  let totalEvents = 0;

  // Simulate user journey 1: Complete purchase (user)
  console.log('📊 User Journey 1: Complete Purchase (Registered User)');
  for (const product of products) {
    totalEvents++;
    if (await postEvent({
      eventType: 'product_viewed',
      userId: users[0],
      metadata: { productId: product.id, productName: product.name, price: product.price }
    })) successCount++;
    await new Promise(r => setTimeout(r, 100));
  }

  totalEvents++;
  if (await postEvent({
    eventType: 'added_to_cart',
    userId: users[0],
    metadata: { productId: products[0].id, quantity: 1, price: products[0].price }
  })) successCount++;

  totalEvents++;
  if (await postEvent({
    eventType: 'checkout_started',
    userId: users[0],
    metadata: { cartValue: products[0].price, itemCount: 1 }
  })) successCount++;

  totalEvents++;
  if (await postEvent({
    eventType: 'payment_method_selected',
    userId: users[0],
    metadata: { paymentMethod: 'momo' }
  })) successCount++;

  totalEvents++;
  if (await postEvent({
    eventType: 'payment_completed',
    userId: users[0],
    metadata: { amount: products[0].price, paymentMethod: 'momo', orderId: 'order_001' }
  })) successCount++;

  console.log('✅ Complete purchase journey seeded\n');

  // Simulate user journey 2: Cart abandonment (guest)
  console.log('🛒 User Journey 2: Cart Abandonment (Guest)');
  totalEvents++;
  if (await postEvent({
    eventType: 'product_viewed',
    anonymousId: guests[0],
    metadata: { productId: products[1].id, productName: products[1].name }
  })) successCount++;

  totalEvents++;
  if (await postEvent({
    eventType: 'added_to_cart',
    anonymousId: guests[0],
    metadata: { productId: products[1].id, quantity: 2, price: products[1].price }
  })) successCount++;

  console.log('✅ Cart abandonment seeded\n');

  // Simulate user journey 3: Checkout abandonment
  console.log('💔 User Journey 3: Checkout Abandonment');
  totalEvents++;
  if (await postEvent({
    eventType: 'product_viewed',
    userId: users[1],
    metadata: { productId: products[2].id, productName: products[2].name }
  })) successCount++;

  totalEvents++;
  if (await postEvent({
    eventType: 'added_to_cart',
    userId: users[1],
    metadata: { productId: products[2].id, quantity: 1, price: products[2].price }
  })) successCount++;

  totalEvents++;
  if (await postEvent({
    eventType: 'checkout_started',
    userId: users[1],
    metadata: { cartValue: products[2].price, itemCount: 1 }
  })) successCount++;

  console.log('✅ Checkout abandonment seeded\n');

  // Simulate user journey 4: Payment failure
  console.log('❌ User Journey 4: Payment Failure');
  totalEvents++;
  if (await postEvent({
    eventType: 'product_viewed',
    anonymousId: guests[1],
    metadata: { productId: products[0].id, productName: products[0].name }
  })) successCount++;

  totalEvents++;
  if (await postEvent({
    eventType: 'added_to_cart',
    anonymousId: guests[1],
    metadata: { productId: products[0].id, quantity: 1, price: products[0].price }
  })) successCount++;

  totalEvents++;
  if (await postEvent({
    eventType: 'checkout_started',
    anonymousId: guests[1],
    metadata: { cartValue: products[0].price }
  })) successCount++;

  totalEvents++;
  if (await postEvent({
    eventType: 'payment_attempted',
    anonymousId: guests[1],
    metadata: { amount: products[0].price, paymentMethod: 'bank_transfer' }
  })) successCount++;

  totalEvents++;
  if (await postEvent({
    eventType: 'payment_failed',
    anonymousId: guests[1],
    metadata: { 
      amount: products[0].price, 
      paymentMethod: 'bank_transfer',
      errorCode: 'INSUFFICIENT_FUNDS',
      errorMessage: 'Insufficient balance'
    }
  })) successCount++;

  console.log('✅ Payment failure seeded\n');

  // Additional browsing events
  console.log('👀 Additional Browsing Events');
  for (let i = 0; i < 5; i++) {
    const randomUser = guests[Math.floor(Math.random() * guests.length)];
    const randomProduct = products[Math.floor(Math.random() * products.length)];
    
    totalEvents++;
    if (await postEvent({
      eventType: 'product_viewed',
      anonymousId: randomUser,
      metadata: { productId: randomProduct.id, productName: randomProduct.name }
    })) successCount++;
    
    await new Promise(r => setTimeout(r, 50));
  }

  console.log('✅ Additional browsing seeded\n');

  // Summary
  console.log('==========================================');
  console.log('📊 SEEDING SUMMARY');
  console.log('==========================================');
  console.log(`Total Events Attempted: ${totalEvents}`);
  console.log(`Successfully Seeded: ${successCount}`);
  console.log(`Failed: ${totalEvents - successCount}`);
  console.log('==========================================\n');

  if (successCount === totalEvents) {
    console.log('🎉 ALL EVENTS SEEDED SUCCESSFULLY!\n');
  } else {
    console.log('⚠️  Some events failed to seed\n');
  }

  console.log('Next steps:');
  console.log('1. Login to admin at http://localhost:4200/admin/login');
  console.log('2. Navigate to Analytics dashboard');
  console.log('3. View the seeded analytics data\n');
}

// Run seed
seedEvents().catch(console.error);
