/**
 * Integration Tests for Story 10.1: Admin Role & Permissions Setup
 *
 * Tests:
 * 1. Admin middleware blocks unauthenticated users (401)
 * 2. Admin middleware blocks regular users (403)
 * 3. Admin middleware allows admin users (200)
 * 4. Admin middleware allows super_admin users (200)
 * 5. Super admin check blocks admin users (403)
 * 6. Super admin can grant super_admin role
 * 7. Admin cannot grant super_admin role
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000';

// Test users
let regularUser = null;
let adminUser = null;
let superAdminUser = null;

// Tokens
let regularToken = null;
let adminToken = null;
let superAdminToken = null;

// Test state
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  tests: [],
};

/**
 * Log test result
 */
function logTest(name, passed, message) {
  results.total++;
  if (passed) {
    results.passed++;
    console.log(`✅ ${name}`);
  } else {
    results.failed++;
    console.log(`❌ ${name}`);
    console.log(`   ${message}`);
  }
  results.tests.push({ name, passed, message });
}

/**
 * Setup: Create test users with different roles
 */
async function setup() {
  console.log('\n📝 Setting up test users...\n');

  try {
    // 1. Create regular user
    const regularEmail = `regular_${Date.now()}@test.com`;
    const regularResponse = await axios.post(`${API_URL}/api/auth/register`, {
      username: `regular_${Date.now()}`,
      email: regularEmail,
      password: 'Test123!@#',
    });
    regularUser = regularResponse.data.data.user;

    // Verify email manually (bypass verification)
    const db = require('./backend/src/db');
    await db.query('UPDATE users SET email_verified = true WHERE id = $1', [regularUser.id]);

    // Login to get token
    const regularLoginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: regularEmail,
      password: 'Test123!@#',
    });
    regularToken = regularLoginResponse.data.data.tokens.accessToken;

    // 2. Create admin user
    const adminEmail = `admin_${Date.now()}@test.com`;
    const adminResponse = await axios.post(`${API_URL}/api/auth/register`, {
      username: `admin_${Date.now()}`,
      email: adminEmail,
      password: 'Test123!@#',
    });
    adminUser = adminResponse.data.data.user;

    // Update role to admin and verify email
    await db.query('UPDATE users SET role = $1, email_verified = true WHERE id = $2', ['admin', adminUser.id]);

    // Login to get token
    const adminLoginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: adminEmail,
      password: 'Test123!@#',
    });
    adminToken = adminLoginResponse.data.data.tokens.accessToken;

    // 3. Create super_admin user
    const superAdminEmail = `superadmin_${Date.now()}@test.com`;
    const superAdminResponse = await axios.post(`${API_URL}/api/auth/register`, {
      username: `superadmin_${Date.now()}`,
      email: superAdminEmail,
      password: 'Test123!@#',
    });
    superAdminUser = superAdminResponse.data.data.user;

    // Update role to super_admin and verify email
    await db.query('UPDATE users SET role = $1, email_verified = true WHERE id = $2', ['super_admin', superAdminUser.id]);

    // Login to get token
    const superAdminLoginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: superAdminEmail,
      password: 'Test123!@#',
    });
    superAdminToken = superAdminLoginResponse.data.data.tokens.accessToken;

    console.log('✅ Test users created:');
    console.log(`   Regular User: ${regularUser.email} (ID: ${regularUser.id})`);
    console.log(`   Admin User: ${adminUser.email} (ID: ${adminUser.id})`);
    console.log(`   Super Admin User: ${superAdminUser.email} (ID: ${superAdminUser.id})`);
  } catch (error) {
    console.error('❌ Setup failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

/**
 * Test 1: Unauthenticated access blocked (401)
 */
async function test1_UnauthenticatedBlocked() {
  try {
    await axios.get(`${API_URL}/api/admin/users`);
    logTest('Test 1: Unauthenticated access blocked', false, 'Expected 401, got success');
  } catch (error) {
    const passed = error.response?.status === 401;
    logTest(
      'Test 1: Unauthenticated access blocked',
      passed,
      passed ? 'Correctly returned 401' : `Expected 401, got ${error.response?.status}`
    );
  }
}

/**
 * Test 2: Regular user access blocked (403)
 */
async function test2_RegularUserBlocked() {
  try {
    await axios.get(`${API_URL}/api/admin/users`, {
      headers: { Authorization: `Bearer ${regularToken}` },
    });
    logTest('Test 2: Regular user access blocked', false, 'Expected 403, got success');
  } catch (error) {
    const passed = error.response?.status === 403;
    logTest(
      'Test 2: Regular user access blocked',
      passed,
      passed ? 'Correctly returned 403' : `Expected 403, got ${error.response?.status}`
    );
  }
}

/**
 * Test 3: Admin user access allowed (200)
 */
async function test3_AdminUserAllowed() {
  try {
    const response = await axios.get(`${API_URL}/api/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const passed = response.status === 200;
    logTest(
      'Test 3: Admin user access allowed',
      passed,
      passed ? 'Successfully accessed admin endpoint' : `Expected 200, got ${response.status}`
    );
  } catch (error) {
    logTest('Test 3: Admin user access allowed', false, `Expected 200, got ${error.response?.status}`);
  }
}

/**
 * Test 4: Super admin user access allowed (200)
 */
async function test4_SuperAdminUserAllowed() {
  try {
    const response = await axios.get(`${API_URL}/api/admin/users`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    const passed = response.status === 200;
    logTest(
      'Test 4: Super admin user access allowed',
      passed,
      passed ? 'Successfully accessed admin endpoint' : `Expected 200, got ${response.status}`
    );
  } catch (error) {
    logTest('Test 4: Super admin user access allowed', false, `Expected 200, got ${error.response?.status}`);
  }
}

/**
 * Test 5: Admin cannot grant super_admin role (403)
 */
async function test5_AdminCannotGrantSuperAdmin() {
  try {
    await axios.put(
      `${API_URL}/api/admin/users/${regularUser.id}/role`,
      { role: 'super_admin' },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    logTest('Test 5: Admin cannot grant super_admin role', false, 'Expected 403, got success');
  } catch (error) {
    const passed = error.response?.status === 403;
    logTest(
      'Test 5: Admin cannot grant super_admin role',
      passed,
      passed ? 'Correctly blocked with 403' : `Expected 403, got ${error.response?.status}`
    );
  }
}

/**
 * Test 6: Super admin can grant super_admin role (200)
 */
async function test6_SuperAdminCanGrantSuperAdmin() {
  try {
    const response = await axios.put(
      `${API_URL}/api/admin/users/${regularUser.id}/role`,
      { role: 'super_admin' },
      { headers: { Authorization: `Bearer ${superAdminToken}` } }
    );
    const passed = response.status === 200;
    logTest(
      'Test 6: Super admin can grant super_admin role',
      passed,
      passed ? 'Successfully granted super_admin' : `Expected 200, got ${response.status}`
    );
  } catch (error) {
    logTest('Test 6: Super admin can grant super_admin role', false, `Expected 200, got ${error.response?.status}`);
  }
}

/**
 * Test 7: Dashboard stats endpoint requires admin
 */
async function test7_DashboardRequiresAdmin() {
  try {
    await axios.get(`${API_URL}/api/admin/dashboard/stats`, {
      headers: { Authorization: `Bearer ${regularToken}` },
    });
    logTest('Test 7: Dashboard requires admin', false, 'Expected 403, got success');
  } catch (error) {
    const passed = error.response?.status === 403;
    logTest(
      'Test 7: Dashboard requires admin',
      passed,
      passed ? 'Correctly blocked regular user' : `Expected 403, got ${error.response?.status}`
    );
  }
}

/**
 * Test 8: Admin can access dashboard stats
 */
async function test8_AdminCanAccessDashboard() {
  try {
    const response = await axios.get(`${API_URL}/api/admin/dashboard/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const passed = response.status === 200;
    logTest(
      'Test 8: Admin can access dashboard',
      passed,
      passed ? 'Successfully accessed dashboard' : `Expected 200, got ${response.status}`
    );
  } catch (error) {
    logTest('Test 8: Admin can access dashboard', false, `Expected 200, got ${error.response?.status}`);
  }
}

/**
 * Cleanup: Delete test users
 */
async function cleanup() {
  console.log('\n🧹 Cleaning up test users...\n');

  try {
    const db = require('./backend/src/db');

    if (regularUser) {
      await db.query('DELETE FROM users WHERE id = $1', [regularUser.id]);
      console.log(`✅ Deleted regular user (ID: ${regularUser.id})`);
    }

    if (adminUser) {
      await db.query('DELETE FROM users WHERE id = $1', [adminUser.id]);
      console.log(`✅ Deleted admin user (ID: ${adminUser.id})`);
    }

    if (superAdminUser) {
      await db.query('DELETE FROM users WHERE id = $1', [superAdminUser.id]);
      console.log(`✅ Deleted super admin user (ID: ${superAdminUser.id})`);
    }
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('🧪 Integration Tests: Story 10.1 - Admin Role & Permissions Setup\n');

  try {
    // Setup
    await setup();

    // Run tests
    console.log('\n🏃 Running authorization tests...\n');
    await test1_UnauthenticatedBlocked();
    await test2_RegularUserBlocked();
    await test3_AdminUserAllowed();
    await test4_SuperAdminUserAllowed();
    await test5_AdminCannotGrantSuperAdmin();
    await test6_SuperAdminCanGrantSuperAdmin();
    await test7_DashboardRequiresAdmin();
    await test8_AdminCanAccessDashboard();

    // Cleanup
    await cleanup();

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Test Summary');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${results.total}`);
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
    console.log('='.repeat(50));

    // Exit with appropriate code
    process.exit(results.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('\n❌ Test runner failed:', error.message);
    await cleanup();
    process.exit(1);
  }
}

// Run tests
runTests();
