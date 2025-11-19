/**
 * Integration Test: Logout Functionality
 *
 * Tests the complete logout flow including:
 * - Backend session invalidation
 * - Frontend token clearing
 * - Database session status verification
 *
 * Story 11.1: Comprehensive Backend Testing
 */

const axios = require('axios');
const db = require('./backend/src/db');

const API_URL = process.env.API_URL || 'http://localhost:5000';

// ANSI color codes for pretty output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

// Test state
let testUser = null;
let authToken = null;
let sessionIds = [];

/**
 * Test 1: User Login (Setup)
 */
async function test1_userLogin() {
  logSection('Test 1: User Login');

  try {
    // Register a test user
    const registerData = {
      email: `logout-test-${Date.now()}@example.com`,
      password: 'Test123!@#',
      username: `logout_test_${Date.now()}`,
      firstName: 'Logout',
      lastName: 'Test',
    };

    log('Registering test user...', 'blue');
    const registerResponse = await axios.post(`${API_URL}/api/auth/register`, registerData);

    // Handle auth-system response structure
    testUser = registerResponse.data.data.user;
    authToken = registerResponse.data.data.tokens.accessToken;

    if (!testUser || !authToken) {
      log(`✗ Registration succeeded but response structure unexpected`, 'red');
      log(`Response: ${JSON.stringify(registerResponse.data, null, 2)}`, 'yellow');
      return false;
    }

    log(`✓ User registered: ${testUser.email}`, 'green');
    log(`✓ Auth token received: ${authToken.substring(0, 20)}...`, 'green');

    return true;
  } catch (error) {
    log(`✗ Login failed: ${error.response?.data?.error || error.message}`, 'red');
    return false;
  }
}

/**
 * Test 2: Verify Active Sessions Exist
 */
async function test2_verifyActiveSessions() {
  logSection('Test 2: Verify Active Sessions in Database');

  try {
    const query = `
      SELECT id, user_id, is_active, device_name, created_at
      FROM sessions
      WHERE user_id = $1 AND is_active = true
      ORDER BY created_at DESC
    `;

    const result = await db.query(query, [testUser.id]);
    sessionIds = result.rows.map(row => row.id);

    log(`Active sessions found: ${result.rows.length}`, 'blue');
    result.rows.forEach(session => {
      log(`  Session ID: ${session.id} | Device: ${session.device_name || 'Unknown'} | Active: ${session.is_active}`, 'blue');
    });

    if (result.rows.length > 0) {
      log('✓ Active sessions exist in database', 'green');
      return true;
    } else {
      log('✗ No active sessions found', 'red');
      return false;
    }
  } catch (error) {
    log(`✗ Database query failed: ${error.message}`, 'red');
    return false;
  }
}

/**
 * Test 3: Call Logout API Endpoint
 */
async function test3_callLogoutAPI() {
  logSection('Test 3: Call Backend Logout API');

  try {
    log('Calling POST /api/auth/logout...', 'blue');

    const response = await axios.post(
      `${API_URL}/api/auth/logout`,
      {},
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    log(`Response status: ${response.status}`, 'blue');
    log(`Response body: ${JSON.stringify(response.data, null, 2)}`, 'blue');

    if (response.status === 200 && response.data.success) {
      log('✓ Logout API call successful', 'green');
      return true;
    } else {
      log('✗ Logout API returned unexpected response', 'red');
      return false;
    }
  } catch (error) {
    log(`✗ Logout API call failed: ${error.response?.data?.error || error.message}`, 'red');
    return false;
  }
}

/**
 * Test 4: Verify Sessions are Invalidated
 */
async function test4_verifySessionsInvalidated() {
  logSection('Test 4: Verify Sessions Marked Inactive');

  try {
    const query = `
      SELECT id, user_id, is_active, device_name, updated_at
      FROM sessions
      WHERE user_id = $1
      ORDER BY created_at DESC
    `;

    const result = await db.query(query, [testUser.id]);

    log(`Total sessions: ${result.rows.length}`, 'blue');

    const activeSessions = result.rows.filter(row => row.is_active);
    const inactiveSessions = result.rows.filter(row => !row.is_active);

    log(`Active sessions: ${activeSessions.length}`, activeSessions.length === 0 ? 'green' : 'red');
    log(`Inactive sessions: ${inactiveSessions.length}`, inactiveSessions.length > 0 ? 'green' : 'red');

    result.rows.forEach(session => {
      const status = session.is_active ? 'ACTIVE ✗' : 'INACTIVE ✓';
      const color = session.is_active ? 'red' : 'green';
      log(`  Session ID: ${session.id} | Status: ${status}`, color);
    });

    if (activeSessions.length === 0 && inactiveSessions.length > 0) {
      log('✓ All sessions successfully invalidated', 'green');
      return true;
    } else {
      log('✗ Some sessions still active', 'red');
      return false;
    }
  } catch (error) {
    log(`✗ Database query failed: ${error.message}`, 'red');
    return false;
  }
}

/**
 * Test 5: Verify Token is Invalid After Logout
 */
async function test5_verifyTokenInvalid() {
  logSection('Test 5: Verify Token Cannot Access Protected Endpoints');

  try {
    log('Attempting to access /api/user/profile with old token...', 'blue');

    const response = await axios.get(`${API_URL}/api/user/profile`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    // If we get here, the token still works (unexpected)
    log('✗ Token still works after logout (SECURITY ISSUE)', 'red');
    log(`Response: ${JSON.stringify(response.data)}`, 'red');
    return false;

  } catch (error) {
    if (error.response?.status === 401) {
      log('✓ Token rejected with 401 Unauthorized', 'green');
      log(`Error message: ${error.response.data.error}`, 'blue');
      return true;
    } else {
      log(`✗ Unexpected error: ${error.message}`, 'red');
      return false;
    }
  }
}

/**
 * Test 6: Cleanup Test Data
 */
async function test6_cleanup() {
  logSection('Test 6: Cleanup Test Data');

  try {
    // Delete test user (cascade will delete sessions)
    const query = `DELETE FROM users WHERE id = $1`;
    await db.query(query, [testUser.id]);

    log(`✓ Test user ${testUser.email} deleted`, 'green');
    return true;
  } catch (error) {
    log(`✗ Cleanup failed: ${error.message}`, 'red');
    return false;
  }
}

/**
 * Main Test Runner
 */
async function runTests() {
  console.log('\n');
  log('╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║       LOGOUT FUNCTIONALITY INTEGRATION TESTS              ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');

  const tests = [
    { name: 'User Login (Setup)', fn: test1_userLogin },
    { name: 'Verify Active Sessions Exist', fn: test2_verifyActiveSessions },
    { name: 'Call Logout API', fn: test3_callLogoutAPI },
    { name: 'Verify Sessions Invalidated', fn: test4_verifySessionsInvalidated },
    { name: 'Verify Token Invalid', fn: test5_verifyTokenInvalid },
    { name: 'Cleanup Test Data', fn: test6_cleanup },
  ];

  const results = [];

  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];

    try {
      const passed = await test.fn();
      results.push({ name: test.name, passed });

      if (!passed && i < tests.length - 1) {
        log('\n⚠️  Test failed. Continuing to next test...', 'yellow');
      }
    } catch (error) {
      log(`\n✗ Test threw exception: ${error.message}`, 'red');
      results.push({ name: test.name, passed: false });
    }
  }

  // Summary
  logSection('TEST SUMMARY');

  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;

  results.forEach(result => {
    const status = result.passed ? '✓ PASS' : '✗ FAIL';
    const color = result.passed ? 'green' : 'red';
    log(`  ${status} | ${result.name}`, color);
  });

  console.log('\n' + '='.repeat(60));
  log(`Total: ${results.length} | Passed: ${passedCount} | Failed: ${failedCount}`, 'cyan');
  console.log('='.repeat(60) + '\n');

  if (failedCount === 0) {
    log('🎉 ALL TESTS PASSED! Logout functionality working correctly.', 'green');
  } else {
    log(`⚠️  ${failedCount} test(s) failed. Please review the output above.`, 'yellow');
  }

  // Close database connection (if available)
  try {
    if (db && typeof db.end === 'function') {
      await db.end();
    } else if (db && db.pool && typeof db.pool.end === 'function') {
      await db.pool.end();
    }
  } catch (error) {
    log(`Warning: Could not close database connection: ${error.message}`, 'yellow');
  }

  process.exit(failedCount === 0 ? 0 : 1);
}

// Run tests
runTests().catch(error => {
  log(`\n✗ Fatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
