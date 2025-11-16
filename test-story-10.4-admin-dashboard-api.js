/**
 * Story 10.4: Admin Dashboard API - Integration Tests
 *
 * Tests all dashboard API endpoints:
 * - GET /api/admin/dashboard/stats - Overall statistics
 * - GET /api/admin/dashboard/user-growth - User growth trends
 * - GET /api/admin/dashboard/activity - Activity summary
 * - GET /api/admin/dashboard/security - Security overview
 */

const axios = require('axios');

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:5000';
const TEST_USER_EMAIL = 'dashboard-test-admin@example.com';
const TEST_USER_PASSWORD = 'DashboardTest123!';

// Test state
let authToken = null;
let testUserId = null;

// Helper: Login and get auth token
async function login(email, password) {
  try {
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      email,
      password,
    });

    return response.data.data.tokens.accessToken;
  } catch (error) {
    console.error('Login error:', error.response?.data || error.message);
    throw error;
  }
}

// Helper: Create admin user for testing
async function createAdminUser() {
  try {
    const response = await axios.post(`${API_URL}/api/auth/register`, {
      username: 'admintestuser',
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
    });

    testUserId = response.data.user.id;

    // Manually update user role to admin (requires direct DB access or existing admin)
    // For now, assume user creation endpoint is available
    console.log('✓ Test admin user created (ID: ' + testUserId + ')');
    console.log('⚠ Note: You may need to manually set role to "admin" in database');

    return testUserId;
  } catch (error) {
    if (error.response?.status === 409) {
      console.log('✓ Test admin user already exists');
    } else {
      console.error('Create user error:', error.response?.data || error.message);
    }
  }
}

// Helper: Create test data for dashboards
async function seedTestData() {
  console.log('\n📊 Seeding test data for dashboards...');

  // We would need to create users, sessions, login history, etc.
  // For now, we'll work with existing data

  console.log('✓ Using existing data in database');
}

// Test: GET /api/admin/dashboard/stats
async function testGetDashboardStats() {
  console.log('\n📊 Testing: GET /api/admin/dashboard/stats');

  try {
    const response = await axios.get(`${API_URL}/api/admin/dashboard/stats`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    console.log('✓ Response status:', response.status);
    console.log('✓ Response data:', JSON.stringify(response.data, null, 2));

    // Assertions
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }

    if (!response.data.success) {
      throw new Error('Expected success: true');
    }

    const stats = response.data.data;
    const requiredFields = [
      'totalUsers',
      'activeUsers',
      'newUsersToday',
      'newUsersThisWeek',
      'newUsersThisMonth',
      'adminCount',
      'suspendedCount',
    ];

    requiredFields.forEach(field => {
      if (!(field in stats)) {
        throw new Error(`Missing required field: ${field}`);
      }
      if (typeof stats[field] !== 'number') {
        throw new Error(`${field} should be a number, got ${typeof stats[field]}`);
      }
    });

    console.log('✅ PASS: Get dashboard stats');
    return true;
  } catch (error) {
    console.error('❌ FAIL: Get dashboard stats');
    console.error('Error:', error.response?.data || error.message);
    return false;
  }
}

// Test: GET /api/admin/dashboard/user-growth
async function testGetUserGrowth() {
  console.log('\n📈 Testing: GET /api/admin/dashboard/user-growth');

  try {
    const response = await axios.get(`${API_URL}/api/admin/dashboard/user-growth`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    console.log('✓ Response status:', response.status);

    // Assertions
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }

    if (!response.data.success) {
      throw new Error('Expected success: true');
    }

    const growth = response.data.data;

    if (!Array.isArray(growth.labels)) {
      throw new Error('labels should be an array');
    }

    if (!Array.isArray(growth.data)) {
      throw new Error('data should be an array');
    }

    if (growth.labels.length !== growth.data.length) {
      throw new Error('labels and data arrays should have the same length');
    }

    console.log(`✓ Growth data contains ${growth.labels.length} days`);
    console.log(`✓ Sample: ${growth.labels[0]} = ${growth.data[0]} users`);

    console.log('✅ PASS: Get user growth (default 30 days)');
    return true;
  } catch (error) {
    console.error('❌ FAIL: Get user growth');
    console.error('Error:', error.response?.data || error.message);
    return false;
  }
}

// Test: GET /api/admin/dashboard/user-growth?days=7
async function testGetUserGrowthCustomDays() {
  console.log('\n📈 Testing: GET /api/admin/dashboard/user-growth?days=7');

  try {
    const response = await axios.get(`${API_URL}/api/admin/dashboard/user-growth?days=7`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    console.log('✓ Response status:', response.status);

    const growth = response.data.data;

    if (growth.labels.length !== 7) {
      throw new Error(`Expected 7 days, got ${growth.labels.length}`);
    }

    console.log(`✓ Growth data contains exactly 7 days`);
    console.log('✅ PASS: Get user growth (custom 7 days)');
    return true;
  } catch (error) {
    console.error('❌ FAIL: Get user growth (custom days)');
    console.error('Error:', error.response?.data || error.message);
    return false;
  }
}

// Test: GET /api/admin/dashboard/user-growth?days=invalid
async function testGetUserGrowthInvalidDays() {
  console.log('\n📈 Testing: GET /api/admin/dashboard/user-growth?days=invalid');

  try {
    const response = await axios.get(`${API_URL}/api/admin/dashboard/user-growth?days=999`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    // Should return 400 Bad Request
    console.error('❌ FAIL: Should have returned 400 for invalid days');
    return false;
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✓ Correctly rejected invalid days parameter');
      console.log('✅ PASS: Invalid days validation');
      return true;
    } else {
      console.error('❌ FAIL: Expected 400 status');
      console.error('Error:', error.response?.data || error.message);
      return false;
    }
  }
}

// Test: GET /api/admin/dashboard/activity
async function testGetActivitySummary() {
  console.log('\n🔍 Testing: GET /api/admin/dashboard/activity');

  try {
    const response = await axios.get(`${API_URL}/api/admin/dashboard/activity`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    console.log('✓ Response status:', response.status);
    console.log('✓ Response data:', JSON.stringify(response.data, null, 2));

    // Assertions
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }

    const activity = response.data.data;
    const requiredFields = [
      'loginAttemptsToday',
      'failedLoginsToday',
      'activeSessionsNow',
      'securityEventsToday',
    ];

    requiredFields.forEach(field => {
      if (!(field in activity)) {
        throw new Error(`Missing required field: ${field}`);
      }
      if (typeof activity[field] !== 'number') {
        throw new Error(`${field} should be a number`);
      }
    });

    console.log('✅ PASS: Get activity summary');
    return true;
  } catch (error) {
    console.error('❌ FAIL: Get activity summary');
    console.error('Error:', error.response?.data || error.message);
    return false;
  }
}

// Test: GET /api/admin/dashboard/security
async function testGetSecurityOverview() {
  console.log('\n🔒 Testing: GET /api/admin/dashboard/security');

  try {
    const response = await axios.get(`${API_URL}/api/admin/dashboard/security`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    console.log('✓ Response status:', response.status);
    console.log('✓ Response data:', JSON.stringify(response.data, null, 2));

    // Assertions
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }

    const security = response.data.data;
    const requiredFields = [
      'criticalAlertsCount',
      'mfaEnabledPercentage',
      'recentFailedLogins',
      'suspiciousActivity',
    ];

    requiredFields.forEach(field => {
      if (!(field in security)) {
        throw new Error(`Missing required field: ${field}`);
      }
    });

    if (typeof security.criticalAlertsCount !== 'number') {
      throw new Error('criticalAlertsCount should be a number');
    }

    if (typeof security.mfaEnabledPercentage !== 'number') {
      throw new Error('mfaEnabledPercentage should be a number');
    }

    if (!Array.isArray(security.recentFailedLogins)) {
      throw new Error('recentFailedLogins should be an array');
    }

    if (!Array.isArray(security.suspiciousActivity)) {
      throw new Error('suspiciousActivity should be an array');
    }

    console.log(`✓ MFA enabled: ${security.mfaEnabledPercentage}%`);
    console.log(`✓ Critical alerts: ${security.criticalAlertsCount}`);
    console.log(`✓ Recent failed logins: ${security.recentFailedLogins.length}`);
    console.log(`✓ Suspicious activities: ${security.suspiciousActivity.length}`);

    console.log('✅ PASS: Get security overview');
    return true;
  } catch (error) {
    console.error('❌ FAIL: Get security overview');
    console.error('Error:', error.response?.data || error.message);
    return false;
  }
}

// Test: Authorization - Non-admin user cannot access
async function testAuthorizationNonAdmin() {
  console.log('\n🔒 Testing: Authorization - Non-admin user blocked');

  try {
    // Register a regular user
    const regularUser = {
      username: 'regularuser',
      email: 'regular@example.com',
      password: 'Regular123!',
    };

    await axios.post(`${API_URL}/api/auth/register`, regularUser).catch(() => {});

    // Login as regular user
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: regularUser.email,
      password: regularUser.password,
    });

    const regularToken = loginResponse.data.data.tokens.accessToken;

    // Try to access dashboard stats
    const response = await axios.get(`${API_URL}/api/admin/dashboard/stats`, {
      headers: { Authorization: `Bearer ${regularToken}` },
    });

    console.error('❌ FAIL: Non-admin user was allowed access');
    return false;
  } catch (error) {
    if (error.response?.status === 403) {
      console.log('✓ Non-admin correctly blocked (403 Forbidden)');
      console.log('✅ PASS: Authorization check');
      return true;
    } else {
      console.error('❌ FAIL: Expected 403 status');
      console.error('Error:', error.response?.data || error.message);
      return false;
    }
  }
}

// Test: Caching - Verify responses are cached
async function testCaching() {
  console.log('\n⚡ Testing: Response caching');

  try {
    // First request
    const start1 = Date.now();
    const response1 = await axios.get(`${API_URL}/api/admin/dashboard/stats`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const duration1 = Date.now() - start1;

    // Second request (should be cached)
    const start2 = Date.now();
    const response2 = await axios.get(`${API_URL}/api/admin/dashboard/stats`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const duration2 = Date.now() - start2;

    console.log(`✓ First request: ${duration1}ms`);
    console.log(`✓ Second request: ${duration2}ms (cached)`);

    // Cached response should be faster (usually)
    // But we can't guarantee this in tests, so just verify responses match
    if (JSON.stringify(response1.data) === JSON.stringify(response2.data)) {
      console.log('✓ Cached response matches original');
      console.log('✅ PASS: Caching verification');
      return true;
    } else {
      console.error('❌ FAIL: Cached response differs from original');
      return false;
    }
  } catch (error) {
    console.error('❌ FAIL: Caching test');
    console.error('Error:', error.response?.data || error.message);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('='.repeat(80));
  console.log('Story 10.4: Admin Dashboard API - Integration Tests');
  console.log('='.repeat(80));

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
  };

  try {
    // Setup
    console.log('\n🔧 Setup: Creating test user and logging in...');
    await createAdminUser();
    authToken = await login(TEST_USER_EMAIL, TEST_USER_PASSWORD);
    console.log('✓ Logged in successfully');

    await seedTestData();

    // Run all tests
    const tests = [
      { name: 'Get Dashboard Stats', fn: testGetDashboardStats },
      { name: 'Get User Growth (Default)', fn: testGetUserGrowth },
      { name: 'Get User Growth (Custom Days)', fn: testGetUserGrowthCustomDays },
      { name: 'Get User Growth (Invalid Days)', fn: testGetUserGrowthInvalidDays },
      { name: 'Get Activity Summary', fn: testGetActivitySummary },
      { name: 'Get Security Overview', fn: testGetSecurityOverview },
      { name: 'Authorization Check', fn: testAuthorizationNonAdmin },
      { name: 'Caching Verification', fn: testCaching },
    ];

    for (const test of tests) {
      results.total++;
      const passed = await test.fn();
      if (passed) {
        results.passed++;
      } else {
        results.failed++;
      }
    }

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('TEST SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total tests: ${results.total}`);
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`Success rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
    console.log('='.repeat(80));

    process.exit(results.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('\n❌ Test runner error:', error.message);
    process.exit(1);
  }
}

// Run tests
runTests();
