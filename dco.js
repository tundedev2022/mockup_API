/**
 * Haulr Mock Server Test Suite
 * File: dco.js
 *
 * Usage:
 *   node dco.js
 *
 * Requirements:
 *   Node.js v18+ (built-in fetch)
 *   mock_server.dart running on http://localhost:8080
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080/v1';

// ANSI color formatting for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
};

let passed = 0;
let failed = 0;
const failures = [];

async function 
test(name, fn) {
  process.stdout.write(`  ${colors.dim}•${colors.reset} ${name} ... `);
  const start = Date.now();
  try {
    await fn();
    const duration = Date.now() - start;
    console.log(`${colors.green}✔ PASS${colors.reset} ${colors.dim}(${duration}ms)${colors.reset}`);
    passed++;
  } catch (err) {
    const duration = Date.now() - start;
    console.log(`${colors.red}✘ FAIL${colors.reset} ${colors.dim}(${duration}ms)${colors.reset}`);
    console.log(`    ${colors.red}Error: ${err.message}${colors.reset}`);
    failures.push({ name, error: err.message });
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(
      `${message || 'Expected values to match'}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
    );
  }
}

async function request(path, options = {}) {
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
  const headers = { ...options.headers };

  if (options.body && typeof options.body === 'object') {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  let data = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  return { status: response.status, headers: response.headers, data };
}

async function main() {
  console.log(`\n${colors.bold}${colors.cyan}========================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}   HAULR MOCK API TEST SUITE (dco.js)   ${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}========================================${colors.reset}`);
  console.log(`Target: ${colors.yellow}${BASE_URL}${colors.reset}\n`);

  // Verify server reachability first
  try {
    const healthCheck = await fetch(`${BASE_URL}/health`);
    if (!healthCheck.ok) {
      throw new Error(`Server returned HTTP ${healthCheck.status}`);
    }
  } catch (err) {
    console.error(
      `${colors.red}Error: Could not connect to mock server at ${BASE_URL}.${colors.reset}\n` +
      `Make sure the server is running:\n` +
      `  dart mock_server.dart\n`
    );
    process.exit(1);
  }

  let authToken = '';
  let seededShipmentId = '';
  let createdShipmentId = '';

  // -----------------------------------------------------------
  // 1. Health & Server Basics
  // -----------------------------------------------------------
  console.log(`${colors.bold}1. Health & Base Routing${colors.reset}`);

  await test('GET /v1/health returns status ok', async () => {
    const res = await request('/health');
    assertEqual(res.status, 200, 'Status should be 200');
    assertEqual(res.data?.status, 'ok', 'Body status should be ok');
  });

  await test('OPTIONS /v1/health handles CORS preflight', async () => {
    const res = await request('/health', { method: 'OPTIONS' });
    assertEqual(res.status, 204, 'Preflight status should be 204');
    assert(res.headers.get('access-control-allow-origin') === '*', 'CORS origin header present');
  });

  await test('Missing /v1 prefix returns 404', async () => {
    const rootUrl = BASE_URL.replace(/\/v1$/, '');
    const res = await request(`${rootUrl}/health`);
    assertEqual(res.status, 404, 'Status should be 404');
    assert(res.data?.message?.includes('Not found. Use /v1/...'), 'Contains proper message');
  });

  // -----------------------------------------------------------
  // 2. Authentication
  // -----------------------------------------------------------
  console.log(`\n${colors.bold}2. Authentication & User Profile${colors.reset}`);

  await test('POST /v1/auth/sign-in succeeds with valid credentials', async () => {
    const res = await request('/auth/sign-in', {
      method: 'POST',
      body: {
        email: 'demo@haulr.com',
        password: 'password123',
      },
    });
    assertEqual(res.status, 200, 'Sign-in status should be 200');
    assert(typeof res.data?.token === 'string' && res.data.token.length > 0, 'Token returned');
    assertEqual(res.data?.user?.email, 'demo@haulr.com', 'User email matches');
    assertEqual(res.data?.user?.tier, 'Gold', 'User tier is Gold');
    authToken = res.data.token;
  });

  await test('POST /v1/auth/sign-in fails with invalid password', async () => {
    const res = await request('/auth/sign-in', {
      method: 'POST',
      body: {
        email: 'demo@haulr.com',
        password: 'wrongpassword',
      },
    });
    assertEqual(res.status, 401, 'Should fail with 401');
    assertEqual(res.data?.message, 'Invalid email or password');
  });

  await test('POST /v1/auth/sign-in fails with non-existent email', async () => {
    const res = await request('/auth/sign-in', {
      method: 'POST',
      body: {
        email: 'ghost@nowhere.com',
        password: 'password123',
      },
    });
    assertEqual(res.status, 401, 'Should fail with 401');
  });

  await test('POST /v1/auth/sign-up rejects invalid input with 422', async () => {
    const res = await request('/auth/sign-up', {
      method: 'POST',
      body: {
        name: 'A', // too short (<2)
        email: 'invalid-email',
        phone: '',
        password: 'short', // < 8
      },
    });
    assertEqual(res.status, 422, 'Should fail with 422 Unprocessable Entity');
  });

  await test('POST /v1/auth/sign-up rejects duplicate email with 409', async () => {
    const res = await request('/auth/sign-up', {
      method: 'POST',
      body: {
        name: 'Adaeze Copy',
        email: 'demo@haulr.com',
        phone: '08099999999',
        password: 'password1234',
      },
    });
    assertEqual(res.status, 409, 'Duplicate signup should return 409');
  });

  await test('POST /v1/auth/sign-up registers a new user successfully', async () => {
    const uniqueEmail = `user_${Date.now()}@haulr.com`;
    const res = await request('/auth/sign-up', {
      method: 'POST',
      body: {
        name: 'Test Rider',
        email: uniqueEmail,
        phone: '08012349999',
        password: 'securepassword123',
      },
    });
    assertEqual(res.status, 201, 'Signup status should be 201');
    assert(Boolean(res.data?.token), 'Token is returned');
    assertEqual(res.data?.user?.email, uniqueEmail, 'User email matches');
    assertEqual(res.data?.user?.tier, 'Standard', 'Tier defaults to Standard');
  });

  await test('POST /v1/auth/forgot-password always returns 200', async () => {
    const res = await request('/auth/forgot-password', {
      method: 'POST',
      body: { email: 'any_email@haulr.com' },
    });
    assertEqual(res.status, 200, 'Should return 200');
    assert(res.data?.message?.includes('reset link has been sent'), 'Message confirms reset link');
  });

  await test('GET /v1/me fails with 401 when unauthenticated', async () => {
    const res = await request('/me');
    assertEqual(res.status, 401, 'Protected route requires auth');
  });

  await test('GET /v1/me returns current user when authenticated', async () => {
    const res = await request('/me', {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assertEqual(res.status, 200, 'Status should be 200');
    assertEqual(res.data?.id, 'u1', 'User id matches demo user');
    assertEqual(res.data?.email, 'demo@haulr.com', 'Email matches demo user');
  });

  // -----------------------------------------------------------
  // 3. Shipments
  // -----------------------------------------------------------
  console.log(`\n${colors.bold}3. Shipments & Quotes${colors.reset}`);

  await test('GET /v1/shipments returns list of shipments', async () => {
    const res = await request('/shipments', {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assertEqual(res.status, 200, 'Status should be 200');
    assert(Array.isArray(res.data?.data), 'Shipments data is an array');
    assert(res.data.data.length > 0, 'Shipments list is seeded');
    seededShipmentId = res.data.data[0].id;
  });

  await test('GET /v1/shipments filters by status and search query', async () => {
    const res = await request('/shipments?status=inTransit&q=Abuja', {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assertEqual(res.status, 200, 'Status should be 200');
    assert(Array.isArray(res.data?.data), 'Returns array');
    for (const item of res.data.data) {
      assertEqual(item.status, 'inTransit', 'Filtered status matches');
    }
  });

  await test('POST /v1/shipments/quote returns express and standard quotes', async () => {
    const res = await request('/shipments/quote', {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: {
        size: 'medium',
        weight_kg: 3.5,
      },
    });
    assertEqual(res.status, 200, 'Quote status should be 200');
    assertEqual(res.data?.data?.length, 2, 'Returns two quotes');
    const speeds = res.data.data.map(q => q.speed);
    assert(speeds.includes('express'), 'Includes express quote');
    assert(speeds.includes('standard'), 'Includes standard quote');
  });

  await test('POST /v1/shipments/quote applies HAULR10 promo discount', async () => {
    const res = await request('/shipments/quote', {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: {
        size: 'medium',
        weight_kg: 2.0,
        promo_code: 'HAULR10',
      },
    });
    assertEqual(res.status, 200, 'Status should be 200');
    const expressQuote = res.data.data.find(q => q.speed === 'express');
    assert(expressQuote.discount > 0, 'Promo discount was applied');
    assertEqual(expressQuote.promo_code, 'HAULR10', 'Promo code preserved in response');
  });

  await test('POST /v1/shipments rejects invalid origin/destination with 422', async () => {
    const res = await request('/shipments', {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: {
        origin: 'not-an-object',
        destination: null,
      },
    });
    assertEqual(res.status, 422, 'Should fail with 422');
  });

  await test('POST /v1/shipments creates a new shipment with 201', async () => {
    const res = await request('/shipments', {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: {
        origin: { line: '15 Marina', city: 'Lagos Island' },
        destination: { line: 'Plot 4 Maitama', city: 'Abuja' },
        size: 'large',
        speed: 'express',
        weight_kg: 5.0,
        promo_code: 'HAULR10',
      },
    });
    assertEqual(res.status, 201, 'Created status should be 201');
    assert(typeof res.data?.id === 'string' && res.data.id.startsWith('HLR-'), 'Shipment ID generated');
    assertEqual(res.data?.status, 'pending', 'Initial status is pending');
    assert(res.data?.price > 0, 'Price calculated');
    createdShipmentId = res.data.id;
  });

  await test('GET /v1/shipments/:id fetches specific shipment', async () => {
    const targetId = createdShipmentId || seededShipmentId;
    const res = await request(`/shipments/${targetId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assertEqual(res.status, 200, 'Should find shipment with 200');
    assertEqual(res.data?.id, targetId, 'Shipment ID matches');
  });

  await test('GET /v1/shipments/:id returns 404 for non-existent shipment', async () => {
    const res = await request('/shipments/HLR-NONEXISTENT', {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assertEqual(res.status, 404, 'Should return 404');
    assertEqual(res.data?.message, 'Shipment not found');
  });

  // -----------------------------------------------------------
  // 4. Payments
  // -----------------------------------------------------------
  console.log(`\n${colors.bold}4. Payments${colors.reset}`);

  await test('GET /v1/payments/methods returns available payment methods', async () => {
    const res = await request('/payments/methods', {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assertEqual(res.status, 200, 'Status should be 200');
    assert(Array.isArray(res.data?.data), 'Data is array');
    const types = res.data.data.map(m => m.type);
    assert(types.includes('card'), 'Supports card payment');
    assert(types.includes('bank'), 'Supports bank payment');
  });

  await test('POST /v1/payments rejects missing amount or method with 422', async () => {
    const res = await request('/payments', {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: { amount: 0, method_id: '' },
    });
    assertEqual(res.status, 422, 'Should reject invalid payment with 422');
  });

  await test('POST /v1/payments simulates failure when method_id is "fail"', async () => {
    const res = await request('/payments', {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: {
        amount: 5000,
        method_id: 'fail',
        shipment_id: seededShipmentId,
      },
    });
    assertEqual(res.status, 402, 'Should return 402 Payment Required');
    assertEqual(res.data?.message, 'Payment declined (test method)');
  });

  await test('POST /v1/payments completes payment successfully with 201', async () => {
    const res = await request('/payments', {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: {
        amount: 8500,
        method_id: 'card',
        shipment_id: seededShipmentId,
      },
    });
    assertEqual(res.status, 201, 'Payment creation returns 201');
    assertEqual(res.data?.status, 'paid', 'Status is paid');
    assertEqual(res.data?.amount, 8500, 'Amount matches');
    assert(typeof res.data?.id === 'string' && res.data.id.startsWith('pay_'), 'Payment ID generated');
  });

  // -----------------------------------------------------------
  // 5. Error Handling & Edge Cases
  // -----------------------------------------------------------
  console.log(`\n${colors.bold}5. Edge Cases & Error Handling${colors.reset}`);

  await test('POST with malformed JSON body returns 400', async () => {
    const res = await request('/auth/sign-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{ malformed json syntax ',
    });
    assertEqual(res.status, 400, 'Status should be 400');
    assertEqual(res.data?.message, 'Invalid JSON body');
  });

  await test('Request to undefined route returns 404', async () => {
    const res = await request('/non-existent-route', {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assertEqual(res.status, 404, 'Status should be 404');
    assert(res.data?.message?.startsWith('No route for'), 'Returns no route message');
  });

  // -----------------------------------------------------------
  // Summary
  // -----------------------------------------------------------
  const total = passed + failed;
  console.log(`\n${colors.bold}${colors.cyan}========================================${colors.reset}`);
  console.log(`${colors.bold}TEST RUN SUMMARY${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}========================================${colors.reset}`);
  console.log(`Total:  ${total}`);
  console.log(`Passed: ${colors.green}${passed}${colors.reset}`);
  console.log(`Failed: ${failed > 0 ? colors.red : colors.dim}${failed}${colors.reset}`);

  if (failed > 0) {
    console.log(`\n${colors.red}${colors.bold}Failed Tests:${colors.reset}`);
    for (const f of failures) {
      console.log(`  - ${f.name}: ${f.error}`);
    }
    process.exit(1);
  } else {
    console.log(`\n${colors.green}${colors.bold}All tests passed successfully! 🚀${colors.reset}\n`);
    process.exit(0);
  }
}

main().catch(err => {
  console.error(`\n${colors.red}Unhandled error:${colors.reset}`, err);
  process.exit(1);
});
