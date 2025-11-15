/**
 * Story 10.3: Audit Logging - Comprehensive Test Suite
 *
 * Tests all audit logging components:
 * - AuditLog model methods
 * - Audit middleware integration
 * - Admin action logging
 * - Audit log retrieval API
 */

const axios = require('axios');
const bcrypt = require('bcrypt');
const db = require('./backend/src/db');
const AuditLog = require('./backend/src/models/AuditLog');

const API_URL = 'http://localhost:5000/api';

// Unique test run identifier (prevents duplicate email errors)
const TEST_RUN_ID = Date.now();

// Test results tracking
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  components: {
    model: { total: 0, passed: 0, failed: 0, tests: [] },
    middleware: { total: 0, passed: 0, failed: 0, tests: [] },
    endpoints: { total: 0, passed: 0, failed: 0, tests: [] },
    integration: { total: 0, passed: 0, failed: 0, tests: [] },
  }
};

// Test users and tokens
let testUsers = {
  superAdmin: null,
  admin: null,
  testUser: null,
};
let authTokens = {
  superAdmin: null,
  admin: null,
};

// Helper: Record test result
function recordTest(component, name, passed, error = null) {
  results.total++;
  results.components[component].total++;

  const result = { name, passed, error };
  results.components[component].tests.push(result);

  if (passed) {
    results.passed++;
    results.components[component].passed++;
    console.log(`  ✅ ${name}`);
  } else {
    results.failed++;
    results.components[component].failed++;
    console.log(`  ❌ ${name}`);
    if (error) console.log(`     Error: ${error}`);
  }
}

// Helper: Progress indicator
function progress(message) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`  ${message}`);
  console.log(`${'='.repeat(70)}`);
}

// Helper: Create test users via registration
async function setupTestUsers() {
  progress('SETUP: Creating Test Users');

  try {
    // Create super admin directly in DB (can't register as super_admin)
    const superAdminHash = await bcrypt.hash('SuperAdmin123!', 10);
    const superAdminResult = await db.query(
      `INSERT INTO users (username, email, password_hash, role, email_verified, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, username, email, role`,
      ['test_superadmin_audit', 'superadmin.audit@test.com', superAdminHash, 'super_admin', true, true]
    );
    testUsers.superAdmin = superAdminResult.rows[0];
    console.log(`  ✅ Super Admin created: ${testUsers.superAdmin.email}`);

    // Create admin directly in DB
    const adminHash = await bcrypt.hash('Admin123!', 10);
    const adminResult = await db.query(
      `INSERT INTO users (username, email, password_hash, role, email_verified, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, username, email, role`,
      ['test_admin_audit', 'admin.audit@test.com', adminHash, 'admin', true, true]
    );
    testUsers.admin = adminResult.rows[0];
    console.log(`  ✅ Admin created: ${testUsers.admin.email}`);

    // Create regular user directly in DB
    const userHash = await bcrypt.hash('User123!', 10);
    const userResult = await db.query(
      `INSERT INTO users (username, email, password_hash, role, email_verified, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, username, email, role`,
      ['test_user_audit', 'user.audit@test.com', userHash, 'user', true, true]
    );
    testUsers.testUser = userResult.rows[0];
    console.log(`  ✅ Regular user created: ${testUsers.testUser.email}`);

    // Login super admin
    const superLoginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'superadmin.audit@test.com',
      password: 'SuperAdmin123!',
    }, { validateStatus: () => true });

    if (superLoginRes.status === 200 && superLoginRes.data.data?.tokens?.accessToken) {
      authTokens.superAdmin = superLoginRes.data.data.tokens.accessToken;
      console.log(`  ✅ Super admin logged in`);
    } else {
      throw new Error(`Super admin login failed: ${superLoginRes.status}`);
    }

    // Login admin
    const adminLoginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin.audit@test.com',
      password: 'Admin123!',
    }, { validateStatus: () => true });

    if (adminLoginRes.status === 200 && adminLoginRes.data.data?.tokens?.accessToken) {
      authTokens.admin = adminLoginRes.data.data.tokens.accessToken;
      console.log(`  ✅ Admin logged in`);
    } else {
      throw new Error(`Admin login failed: ${adminLoginRes.status}`);
    }

    console.log(`\n  Setup complete!`);
    return true;
  } catch (error) {
    console.error(`  ❌ Setup failed: ${error.message}`);
    throw error;
  }
}

// Helper: Cleanup test data
async function cleanup() {
  progress('CLEANUP: Removing Test Data');

  try {
    await db.query(`DELETE FROM audit_logs WHERE admin_email LIKE '%.audit@test.com'`);
    console.log(`  ✅ Audit logs deleted`);

    await db.query(`DELETE FROM users WHERE email LIKE '%.audit@test.com'`);
    console.log(`  ✅ Test users deleted`);

    console.log(`\n  Cleanup complete!`);
  } catch (error) {
    console.error(`  ❌ Cleanup error: ${error.message}`);
  }
}

// ============================================================
// COMPONENT 1: AuditLog Model Tests
// ============================================================
async function testAuditLogModel() {
  progress('COMPONENT 1: AuditLog Model Functions');

  // Test 1: Create audit log entry
  try {
    const logEntry = await AuditLog.create({
      admin_id: testUsers.admin.id,
      admin_email: testUsers.admin.email,
      action: 'USER_CREATE',
      target_type: 'user',
      target_id: testUsers.testUser.id,
      details: { username: testUsers.testUser.username },
      ip_address: '127.0.0.1',
      user_agent: 'Test Suite',
    });

    recordTest('model', 'AuditLog.create() - Creates log entry',
      logEntry && logEntry.id > 0);
  } catch (error) {
    recordTest('model', 'AuditLog.create() - Creates log entry',
      false, error.message);
  }

  // Test 2: Find all audit logs
  try {
    const result = await AuditLog.findAll({ page: 1, pageSize: 10 });
    recordTest('model', 'AuditLog.findAll() - Returns paginated logs',
      result && result.logs && Array.isArray(result.logs) && result.pagination);
  } catch (error) {
    recordTest('model', 'AuditLog.findAll() - Returns paginated logs',
      false, error.message);
  }

  // Test 3: Find logs by admin
  try {
    const logs = await AuditLog.findByAdmin(testUsers.admin.id, 10);
    recordTest('model', 'AuditLog.findByAdmin() - Returns admin logs',
      Array.isArray(logs));
  } catch (error) {
    recordTest('model', 'AuditLog.findByAdmin() - Returns admin logs',
      false, error.message);
  }

  // Test 4: Find logs by target
  try {
    const logs = await AuditLog.findByTarget('user', testUsers.testUser.id, 10);
    recordTest('model', 'AuditLog.findByTarget() - Returns target logs',
      Array.isArray(logs));
  } catch (error) {
    recordTest('model', 'AuditLog.findByTarget() - Returns target logs',
      false, error.message);
  }

  // Test 5: Find logs by action
  try {
    const logs = await AuditLog.findByAction('USER_CREATE', 10);
    recordTest('model', 'AuditLog.findByAction() - Returns action logs',
      Array.isArray(logs) && logs.every(log => log.action === 'USER_CREATE'));
  } catch (error) {
    recordTest('model', 'AuditLog.findByAction() - Returns action logs',
      false, error.message);
  }

  // Test 6: Get recent logs
  try {
    const logs = await AuditLog.getRecent(5);
    recordTest('model', 'AuditLog.getRecent() - Returns recent logs',
      Array.isArray(logs) && logs.length <= 5);
  } catch (error) {
    recordTest('model', 'AuditLog.getRecent() - Returns recent logs',
      false, error.message);
  }

  // Test 7: Get statistics
  try {
    const stats = await AuditLog.getStatistics();
    recordTest('model', 'AuditLog.getStatistics() - Returns statistics',
      stats && typeof stats.total_logs !== 'undefined');
  } catch (error) {
    recordTest('model', 'AuditLog.getStatistics() - Returns statistics',
      false, error.message);
  }

  console.log(`\n  Model tests complete: ${results.components.model.passed}/${results.components.model.total} passed`);
}

// ============================================================
// COMPONENT 2: Audit Middleware Tests
// ============================================================
async function testAuditMiddleware() {
  progress('COMPONENT 2: Audit Middleware Integration');

  // Test 1: Audit log created on user creation
  try {
    const uniqueEmail = `middleware.test.${TEST_RUN_ID}@test.com`;
    const uniqueUsername = `middleware_test_${TEST_RUN_ID}`;
    const response = await axios.post(
      `${API_URL}/admin/users`,
      {
        username: uniqueUsername,
        email: uniqueEmail,
        password: 'Test123!',
        role: 'user',
      },
      {
        headers: { Authorization: `Bearer ${authTokens.admin}` },
        validateStatus: () => true,
      }
    );

    const userCreated = response.status === 201;

    if (userCreated) {
      // Wait for audit log to be created
      await new Promise(resolve => setTimeout(resolve, 1000));

      const logs = await AuditLog.findByAction('USER_CREATE', 5);
      const found = logs.some(log =>
        log.admin_id === testUsers.admin.id &&
        log.details &&
        log.details.email === uniqueEmail
      );

      recordTest('middleware', 'Creates audit log on user creation', found);

      // Cleanup
      await db.query(`DELETE FROM users WHERE email = 'middleware.test@test.com'`);
    } else {
      recordTest('middleware', 'Creates audit log on user creation',
        false, `User creation failed with status ${response.status}`);
    }
  } catch (error) {
    recordTest('middleware', 'Creates audit log on user creation',
      false, error.message);
  }

  // Test 2: Audit log created on user update
  try {
    const response = await axios.put(
      `${API_URL}/admin/users/${testUsers.testUser.id}`,
      { first_name: 'Updated' },
      {
        headers: { Authorization: `Bearer ${authTokens.admin}` },
        validateStatus: () => true,
      }
    );

    if (response.status === 200) {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const logs = await AuditLog.findByAction('USER_UPDATE', 5);
      const found = logs.some(log =>
        log.admin_id === testUsers.admin.id &&
        log.target_id === testUsers.testUser.id
      );

      recordTest('middleware', 'Creates audit log on user update', found);
    } else {
      recordTest('middleware', 'Creates audit log on user update',
        false, `Update failed with status ${response.status}`);
    }
  } catch (error) {
    recordTest('middleware', 'Creates audit log on user update',
      false, error.message);
  }

  // Test 3: Audit log created on role change
  try {
    const response = await axios.put(
      `${API_URL}/admin/users/${testUsers.testUser.id}/role`,
      { role: 'admin' },
      {
        headers: { Authorization: `Bearer ${authTokens.superAdmin}` },
        validateStatus: () => true,
      }
    );

    if (response.status === 200) {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const logs = await AuditLog.findByAction('USER_ROLE_CHANGE', 5);
      const found = logs.some(log =>
        log.admin_id === testUsers.superAdmin.id &&
        log.target_id === testUsers.testUser.id &&
        log.details &&
        log.details.newRole === 'admin'
      );

      recordTest('middleware', 'Creates audit log on role change', found);
    } else {
      recordTest('middleware', 'Creates audit log on role change',
        false, `Role change failed with status ${response.status}`);
    }
  } catch (error) {
    recordTest('middleware', 'Creates audit log on role change',
      false, error.message);
  }

  // Test 4: Audit log created on status change
  try {
    const response = await axios.put(
      `${API_URL}/admin/users/${testUsers.testUser.id}/status`,
      { is_active: false },
      {
        headers: { Authorization: `Bearer ${authTokens.admin}` },
        validateStatus: () => true,
      }
    );

    if (response.status === 200) {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const logs = await AuditLog.findByAction('USER_STATUS_CHANGE', 5);
      const found = logs.some(log =>
        log.admin_id === testUsers.admin.id &&
        log.target_id === testUsers.testUser.id
      );

      recordTest('middleware', 'Creates audit log on status change', found);

      // Reactivate user for further tests
      await axios.put(
        `${API_URL}/admin/users/${testUsers.testUser.id}/status`,
        { is_active: true },
        { headers: { Authorization: `Bearer ${authTokens.admin}` } }
      );
    } else {
      recordTest('middleware', 'Creates audit log on status change',
        false, `Status change failed with status ${response.status}`);
    }
  } catch (error) {
    recordTest('middleware', 'Creates audit log on status change',
      false, error.message);
  }

  // Test 5: Audit log includes IP address
  try {
    const logs = await AuditLog.findByAdmin(testUsers.admin.id, 1);
    recordTest('middleware', 'Audit log captures IP address',
      logs.length > 0 && logs[0].ip_address !== null);
  } catch (error) {
    recordTest('middleware', 'Audit log captures IP address',
      false, error.message);
  }

  // Test 6: Audit log includes user agent
  try {
    const logs = await AuditLog.findByAdmin(testUsers.admin.id, 1);
    recordTest('middleware', 'Audit log captures user agent',
      logs.length > 0 && logs[0].user_agent !== null);
  } catch (error) {
    recordTest('middleware', 'Audit log captures user agent',
      false, error.message);
  }

  console.log(`\n  Middleware tests complete: ${results.components.middleware.passed}/${results.components.middleware.total} passed`);
}

// ============================================================
// COMPONENT 3: Audit Logs API Endpoint Tests
// ============================================================
async function testAuditLogsEndpoint() {
  progress('COMPONENT 3: Audit Logs API Endpoint');

  // Test 1: Get all audit logs
  try {
    const response = await axios.get(`${API_URL}/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${authTokens.admin}` },
      validateStatus: () => true,
    });

    recordTest('endpoints', 'GET /admin/audit-logs - Returns 200',
      response.status === 200);

    recordTest('endpoints', 'Response has correct structure',
      response.data.success &&
      response.data.data &&
      Array.isArray(response.data.data.logs) &&
      response.data.data.pagination);
  } catch (error) {
    recordTest('endpoints', 'GET /admin/audit-logs - Returns 200',
      false, error.message);
    recordTest('endpoints', 'Response has correct structure', false);
  }

  // Test 2: Filter by admin_id
  try {
    const response = await axios.get(
      `${API_URL}/admin/audit-logs?admin_id=${testUsers.admin.id}`,
      {
        headers: { Authorization: `Bearer ${authTokens.admin}` },
        validateStatus: () => true,
      }
    );

    const allMatch = response.data.data.logs.every(
      log => log.admin_id === testUsers.admin.id
    );

    recordTest('endpoints', 'Filter by admin_id works correctly', allMatch);
  } catch (error) {
    recordTest('endpoints', 'Filter by admin_id works correctly',
      false, error.message);
  }

  // Test 3: Filter by action
  try {
    const response = await axios.get(
      `${API_URL}/admin/audit-logs?action=USER_CREATE`,
      {
        headers: { Authorization: `Bearer ${authTokens.admin}` },
        validateStatus: () => true,
      }
    );

    const allMatch = response.data.data.logs.every(
      log => log.action === 'USER_CREATE'
    );

    recordTest('endpoints', 'Filter by action works correctly',
      response.status === 200 && allMatch);
  } catch (error) {
    recordTest('endpoints', 'Filter by action works correctly',
      false, error.message);
  }

  // Test 4: Pagination
  try {
    const response = await axios.get(
      `${API_URL}/admin/audit-logs?page=1&pageSize=2`,
      {
        headers: { Authorization: `Bearer ${authTokens.admin}` },
        validateStatus: () => true,
      }
    );

    recordTest('endpoints', 'Pagination works correctly',
      response.status === 200 &&
      response.data.data.pagination.page === 1 &&
      response.data.data.pagination.pageSize === 2 &&
      response.data.data.logs.length <= 2);
  } catch (error) {
    recordTest('endpoints', 'Pagination works correctly',
      false, error.message);
  }

  // Test 5: Sort order DESC (default)
  try {
    const response = await axios.get(
      `${API_URL}/admin/audit-logs?sortOrder=DESC&pageSize=5`,
      {
        headers: { Authorization: `Bearer ${authTokens.admin}` },
        validateStatus: () => true,
      }
    );

    let isSorted = true;
    const logs = response.data.data.logs;
    for (let i = 1; i < logs.length; i++) {
      if (new Date(logs[i-1].created_at) < new Date(logs[i].created_at)) {
        isSorted = false;
        break;
      }
    }

    recordTest('endpoints', 'Sort order DESC works correctly',
      response.status === 200 && isSorted);
  } catch (error) {
    recordTest('endpoints', 'Sort order DESC works correctly',
      false, error.message);
  }

  // Test 6: Sort order ASC
  try {
    const response = await axios.get(
      `${API_URL}/admin/audit-logs?sortOrder=ASC&pageSize=5`,
      {
        headers: { Authorization: `Bearer ${authTokens.admin}` },
        validateStatus: () => true,
      }
    );

    let isSorted = true;
    const logs = response.data.data.logs;
    for (let i = 1; i < logs.length; i++) {
      if (new Date(logs[i-1].created_at) > new Date(logs[i].created_at)) {
        isSorted = false;
        break;
      }
    }

    recordTest('endpoints', 'Sort order ASC works correctly',
      response.status === 200 && isSorted);
  } catch (error) {
    recordTest('endpoints', 'Sort order ASC works correctly',
      false, error.message);
  }

  // Test 7: Requires authentication
  try {
    const response = await axios.get(`${API_URL}/admin/audit-logs`, {
      validateStatus: () => true,
    });

    recordTest('endpoints', 'Requires authentication (401 without token)',
      response.status === 401);
  } catch (error) {
    recordTest('endpoints', 'Requires authentication (401 without token)',
      false, error.message);
  }

  console.log(`\n  Endpoint tests complete: ${results.components.endpoints.passed}/${results.components.endpoints.total} passed`);
}

// ============================================================
// COMPONENT 4: Integration Tests
// ============================================================
async function testIntegration() {
  progress('COMPONENT 4: End-to-End Integration');

  // Test 1: Complete audit trail for user lifecycle
  try {
    const uniqueEmail = `lifecycle.${TEST_RUN_ID}@test.com`;
    const uniqueUsername = `lifecycle_test_${TEST_RUN_ID}`;
    // Create user
    const createRes = await axios.post(
      `${API_URL}/admin/users`,
      {
        username: uniqueUsername,
        email: uniqueEmail,
        password: 'Test123!',
        role: 'user',
      },
      { headers: { Authorization: `Bearer ${authTokens.admin}` } }
    );

    const userId = createRes.data.data.user.id;

    // Update user
    await axios.put(
      `${API_URL}/admin/users/${userId}`,
      { first_name: 'Test' },
      { headers: { Authorization: `Bearer ${authTokens.admin}` } }
    );

    // Change role
    await axios.put(
      `${API_URL}/admin/users/${userId}/role`,
      { role: 'admin' },
      { headers: { Authorization: `Bearer ${authTokens.superAdmin}` } }
    );

    // Deactivate
    await axios.put(
      `${API_URL}/admin/users/${userId}/status`,
      { is_active: false },
      { headers: { Authorization: `Bearer ${authTokens.admin}` } }
    );

    // Wait for all audit logs
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Verify all 4 audit logs exist
    const logs = await AuditLog.findByTarget('user', userId, 10);

    const hasCreate = logs.some(l => l.action === 'USER_CREATE');
    const hasUpdate = logs.some(l => l.action === 'USER_UPDATE');
    const hasRoleChange = logs.some(l => l.action === 'USER_ROLE_CHANGE');
    const hasStatusChange = logs.some(l => l.action === 'USER_STATUS_CHANGE');

    recordTest('integration', 'Complete audit trail captured',
      hasCreate && hasUpdate && hasRoleChange && hasStatusChange);

    // Cleanup
    await db.query(`DELETE FROM users WHERE id = $1`, [userId]);
  } catch (error) {
    recordTest('integration', 'Complete audit trail captured',
      false, error.message);
  }

  // Test 2: Audit logs from multiple admins
  try {
    const uniqueEmail = `multi.admin.${TEST_RUN_ID}@test.com`;
    const uniqueUsername = `multi_admin_test_${TEST_RUN_ID}`;
    // Admin creates user
    const createRes = await axios.post(
      `${API_URL}/admin/users`,
      {
        username: uniqueUsername,
        email: uniqueEmail,
        password: 'Test123!',
        role: 'user',
      },
      { headers: { Authorization: `Bearer ${authTokens.admin}` } }
    );

    const userId = createRes.data.data.user.id;

    // Super admin changes role
    await axios.put(
      `${API_URL}/admin/users/${userId}/role`,
      { role: 'admin' },
      { headers: { Authorization: `Bearer ${authTokens.superAdmin}` } }
    );

    await new Promise(resolve => setTimeout(resolve, 1000));

    const logs = await AuditLog.findByTarget('user', userId, 10);

    const adminLog = logs.find(l => l.admin_id === testUsers.admin.id);
    const superAdminLog = logs.find(l => l.admin_id === testUsers.superAdmin.id);

    recordTest('integration', 'Tracks actions from multiple admins',
      adminLog && superAdminLog);

    // Cleanup
    await db.query(`DELETE FROM users WHERE id = $1`, [userId]);
  } catch (error) {
    recordTest('integration', 'Tracks actions from multiple admins',
      false, error.message);
  }

  // Test 3: Audit log details are accurate
  try {
    const uniqueEmail = `details.${TEST_RUN_ID}@test.com`;
    const uniqueUsername = `details_test_${TEST_RUN_ID}`;
    const createRes = await axios.post(
      `${API_URL}/admin/users`,
      {
        username: uniqueUsername,
        email: uniqueEmail,
        password: 'Test123!',
        role: 'user',
      },
      { headers: { Authorization: `Bearer ${authTokens.admin}` } }
    );

    const userId = createRes.data.data.user.id;

    await new Promise(resolve => setTimeout(resolve, 1000));

    const logs = await AuditLog.findByTarget('user', userId, 1);

    if (logs.length > 0) {
      const log = logs[0];
      const detailsCorrect =
        log.details &&
        log.details.username === uniqueUsername &&
        log.details.email === uniqueEmail &&
        log.details.role === 'user';

      recordTest('integration', 'Audit log details are accurate', detailsCorrect);
    } else {
      recordTest('integration', 'Audit log details are accurate',
        false, 'No audit log found');
    }

    // Cleanup
    await db.query(`DELETE FROM users WHERE id = $1`, [userId]);
  } catch (error) {
    recordTest('integration', 'Audit log details are accurate',
      false, error.message);
  }

  console.log(`\n  Integration tests complete: ${results.components.integration.passed}/${results.components.integration.total} passed`);
}

// ============================================================
// Main Test Runner
// ============================================================
async function runAllTests() {
  console.log('\n');
  console.log('╔' + '═'.repeat(68) + '╗');
  console.log('║' + ' '.repeat(10) + 'Story 10.3: Audit Logging - Test Suite' + ' '.repeat(19) + '║');
  console.log('╚' + '═'.repeat(68) + '╝');

  const startTime = Date.now();

  try {
    // Setup
    await setupTestUsers();

    // Run all test components
    await testAuditLogModel();
    await testAuditMiddleware();
    await testAuditLogsEndpoint();
    await testIntegration();

    // Cleanup
    await cleanup();

    // Final Report
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n');
    console.log('╔' + '═'.repeat(68) + '╗');
    console.log('║' + ' '.repeat(24) + 'FINAL TEST REPORT' + ' '.repeat(27) + '║');
    console.log('╚' + '═'.repeat(68) + '╝');

    console.log('\n  SUMMARY:');
    console.log(`  ├─ Total Tests: ${results.total}`);
    console.log(`  ├─ Passed: ${results.passed} ✅`);
    console.log(`  ├─ Failed: ${results.failed} ${results.failed > 0 ? '❌' : '✅'}`);
    console.log(`  ├─ Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
    console.log(`  └─ Duration: ${duration}s\n`);

    console.log('  COMPONENTS:');
    Object.entries(results.components).forEach(([name, data]) => {
      const status = data.failed === 0 ? '✅' : '⚠️';
      console.log(`  ${status} ${name.toUpperCase().padEnd(15)} ${data.passed}/${data.total} passed`);
    });

    if (results.failed > 0) {
      console.log('\n  FAILED TESTS:');
      Object.entries(results.components).forEach(([component, data]) => {
        const failed = data.tests.filter(t => !t.passed);
        if (failed.length > 0) {
          console.log(`\n  ${component.toUpperCase()}:`);
          failed.forEach(test => {
            console.log(`    ❌ ${test.name}`);
            if (test.error) console.log(`       ${test.error}`);
          });
        }
      });
    }

    console.log('\n' + '═'.repeat(70));
    console.log(`  ${results.failed === 0 ? '✅ ALL TESTS PASSED!' : '⚠️  SOME TESTS FAILED'}`);
    console.log('═'.repeat(70) + '\n');

    process.exit(results.failed > 0 ? 1 : 0);

  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error.message);
    console.error(error.stack);
    await cleanup();
    process.exit(1);
  }
}

// Run the test suite
runAllTests();
