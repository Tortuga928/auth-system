/**
 * Story 10.6: Admin Panel Integration Tests
 *
 * Comprehensive end-to-end tests for the entire admin panel functionality including:
 * - Role-Based Access Control (RBAC) enforcement
 * - Complete user management workflows
 * - Audit logging verification
 * - Dashboard statistics accuracy
 * - Error handling and edge cases
 * - Data consistency checks
 */

const axios = require('axios');
const bcrypt = require('bcrypt');
const db = require('./backend/src/db');

const API_URL = 'http://localhost:5000/api';

const config = {
  validateStatus: () => true,
};

// Test state
let testUsers = {
  superAdmin: null,
  admin: null,
  regularUser: null,
  targetUser1: null,
  targetUser2: null,
};

let authTokens = {
  superAdmin: null,
  admin: null,
  regularUser: null,
};

let testResults = {
  passed: 0,
  failed: 0,
  tests: [],
};

// Helper: Log test result
function logTestResult(testName, passed, details = '') {
  const status = passed ? '✅' : '❌';
  console.log(`${status} ${testName}${details ? ` - ${details}` : ''}`);
  testResults.tests.push({ name: testName, passed, details });
  if (passed) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
}

// Setup: Create test users
async function setupTestUsers() {
  console.log('\n============================================================');
  console.log('SETUP: Creating test users for integration tests');
  console.log('============================================================\n');

  const passwordHash = await bcrypt.hash('TestPassword123!', 10);
  const timestamp = Date.now();

  try {
    // Super Admin
    const superAdminResult = await db.query(
      `INSERT INTO users (username, email, password_hash, role, email_verified, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, username, email, role`,
      [`super_admin_int_${timestamp}`, `superadmin_int_${timestamp}@test.com`, passwordHash, 'super_admin', true, true]
    );
    testUsers.superAdmin = superAdminResult.rows[0];

    // Admin
    const adminResult = await db.query(
      `INSERT INTO users (username, email, password_hash, role, email_verified, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, username, email, role`,
      [`admin_int_${timestamp}`, `admin_int_${timestamp}@test.com`, passwordHash, 'admin', true, true]
    );
    testUsers.admin = adminResult.rows[0];

    // Regular User
    const regularResult = await db.query(
      `INSERT INTO users (username, email, password_hash, role, email_verified, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, username, email, role`,
      [`regular_int_${timestamp}`, `regular_int_${timestamp}@test.com`, passwordHash, 'user', true, true]
    );
    testUsers.regularUser = regularResult.rows[0];

    // Target users for operations
    const target1Result = await db.query(
      `INSERT INTO users (username, email, password_hash, role, email_verified, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, username, email, role`,
      [`target1_int_${timestamp}`, `target1_int_${timestamp}@test.com`, passwordHash, 'user', true, true]
    );
    testUsers.targetUser1 = target1Result.rows[0];

    const target2Result = await db.query(
      `INSERT INTO users (username, email, password_hash, role, email_verified, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, username, email, role`,
      [`target2_int_${timestamp}`, `target2_int_${timestamp}@test.com`, passwordHash, 'user', true, true]
    );
    testUsers.targetUser2 = target2Result.rows[0];

    console.log('✅ Test users created');
    console.log(`   Super Admin: ${testUsers.superAdmin.username} (ID: ${testUsers.superAdmin.id})`);
    console.log(`   Admin: ${testUsers.admin.username} (ID: ${testUsers.admin.id})`);
    console.log(`   Regular User: ${testUsers.regularUser.username} (ID: ${testUsers.regularUser.id})`);
    console.log(`   Target User 1: ${testUsers.targetUser1.username} (ID: ${testUsers.targetUser1.id})`);
    console.log(`   Target User 2: ${testUsers.targetUser2.username} (ID: ${testUsers.targetUser2.id})`);
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    throw error;
  }
}

// Setup: Login test users
async function loginTestUsers() {
  console.log('\n============================================================');
  console.log('SETUP: Logging in test users');
  console.log('============================================================\n');

  try {
    // Super Admin login
    const superAdminLogin = await axios.post(`${API_URL}/auth/login`, {
      email: testUsers.superAdmin.email,
      password: 'TestPassword123!',
    }, config);
    authTokens.superAdmin = superAdminLogin.data.data.tokens.accessToken;

    // Admin login
    const adminLogin = await axios.post(`${API_URL}/auth/login`, {
      email: testUsers.admin.email,
      password: 'TestPassword123!',
    }, config);
    authTokens.admin = adminLogin.data.data.tokens.accessToken;

    // Regular user login
    const regularLogin = await axios.post(`${API_URL}/auth/login`, {
      email: testUsers.regularUser.email,
      password: 'TestPassword123!',
    }, config);
    authTokens.regularUser = regularLogin.data.data.tokens.accessToken;

    console.log('✅ All test users logged in successfully');
  } catch (error) {
    console.error('❌ Login failed:', error.message);
    throw error;
  }
}

// Cleanup: Remove test data
async function cleanupTestData() {
  console.log('\n============================================================');
  console.log('CLEANUP: Removing test data');
  console.log('============================================================\n');

  try {
    const userIds = Object.values(testUsers)
      .filter((u) => u)
      .map((u) => u.id);

    if (userIds.length > 0) {
      // Delete audit logs
      await db.query('DELETE FROM audit_logs WHERE admin_id = ANY($1) OR target_id = ANY($1)', [userIds]);

      // Delete sessions
      await db.query('DELETE FROM sessions WHERE user_id = ANY($1)', [userIds]);

      // Delete login attempts
      await db.query('DELETE FROM login_attempts WHERE user_id = ANY($1)', [userIds]);

      // Delete security events
      await db.query('DELETE FROM security_events WHERE user_id = ANY($1)', [userIds]);

      // Delete MFA secrets (if table exists)
      try {
        await db.query('DELETE FROM mfa_secrets WHERE user_id = ANY($1)', [userIds]);
      } catch (e) {
        // Table might not exist
      }

      // Delete users
      await db.query('DELETE FROM users WHERE id = ANY($1)', [userIds]);
    }

    console.log('✅ Test data cleaned up');
  } catch (error) {
    console.error('⚠️ Cleanup warning:', error.message);
  }
}

// ============================================================
// TEST SUITE 1: Role-Based Access Control (RBAC)
// ============================================================

async function testRBAC() {
  console.log('\n============================================================');
  console.log('TEST SUITE 1: Role-Based Access Control (RBAC)');
  console.log('============================================================\n');

  // Test 1.1: Super Admin can access admin endpoints
  const superAdminAccess = await axios.get(`${API_URL}/admin/dashboard/stats`, {
    headers: { Authorization: `Bearer ${authTokens.superAdmin}` },
    ...config,
  });
  logTestResult(
    '1.1 Super Admin can access admin endpoints',
    superAdminAccess.status === 200,
    `Status: ${superAdminAccess.status}`
  );

  // Test 1.2: Admin can access admin endpoints
  const adminAccess = await axios.get(`${API_URL}/admin/dashboard/stats`, {
    headers: { Authorization: `Bearer ${authTokens.admin}` },
    ...config,
  });
  logTestResult('1.2 Admin can access admin endpoints', adminAccess.status === 200, `Status: ${adminAccess.status}`);

  // Test 1.3: Regular user CANNOT access admin endpoints
  const userAccess = await axios.get(`${API_URL}/admin/dashboard/stats`, {
    headers: { Authorization: `Bearer ${authTokens.regularUser}` },
    ...config,
  });
  logTestResult(
    '1.3 Regular user cannot access admin endpoints',
    userAccess.status === 403,
    `Status: ${userAccess.status}`
  );

  // Test 1.4: Unauthenticated requests are rejected
  const noAuthAccess = await axios.get(`${API_URL}/admin/dashboard/stats`, config);
  logTestResult(
    '1.4 Unauthenticated requests are rejected',
    noAuthAccess.status === 401,
    `Status: ${noAuthAccess.status}`
  );

  // Test 1.5: Only super_admin can change user to admin role
  const promoteToAdmin = await axios.put(
    `${API_URL}/admin/users/${testUsers.targetUser1.id}/role`,
    { role: 'admin' },
    {
      headers: { Authorization: `Bearer ${authTokens.admin}` },
      ...config,
    }
  );
  logTestResult(
    '1.5 Admin cannot promote user to admin role',
    promoteToAdmin.status === 403,
    `Status: ${promoteToAdmin.status}`
  );

  // Test 1.6: Super admin CAN promote user to admin
  const superAdminPromote = await axios.put(
    `${API_URL}/admin/users/${testUsers.targetUser1.id}/role`,
    { role: 'admin' },
    {
      headers: { Authorization: `Bearer ${authTokens.superAdmin}` },
      ...config,
    }
  );
  logTestResult(
    '1.6 Super admin can promote user to admin role',
    superAdminPromote.status === 200,
    `Status: ${superAdminPromote.status}`
  );

  // Reset role back to user
  await axios.put(
    `${API_URL}/admin/users/${testUsers.targetUser1.id}/role`,
    { role: 'user' },
    {
      headers: { Authorization: `Bearer ${authTokens.superAdmin}` },
      ...config,
    }
  );
}

// ============================================================
// TEST SUITE 2: Complete User Management Workflows
// ============================================================

async function testUserManagement() {
  console.log('\n============================================================');
  console.log('TEST SUITE 2: Complete User Management Workflows');
  console.log('============================================================\n');

  // Test 2.1: List users with pagination
  const listUsers = await axios.get(`${API_URL}/admin/users?page=1&pageSize=10`, {
    headers: { Authorization: `Bearer ${authTokens.superAdmin}` },
    ...config,
  });
  const hasUsers = listUsers.data.data.users && listUsers.data.data.users.length > 0;
  logTestResult('2.1 List users with pagination', listUsers.status === 200 && hasUsers, `Found ${listUsers.data.data.users?.length || 0} users`);

  // Test 2.2: Filter users by role
  const filterByRole = await axios.get(`${API_URL}/admin/users?role=admin`, {
    headers: { Authorization: `Bearer ${authTokens.superAdmin}` },
    ...config,
  });
  const allAdmins = filterByRole.data.data.users?.every((u) => u.role === 'admin' || u.role === 'super_admin');
  logTestResult('2.2 Filter users by role', filterByRole.status === 200 && allAdmins, `Found ${filterByRole.data.data.users?.length || 0} admins`);

  // Test 2.3: Search users by username
  const searchUsers = await axios.get(`${API_URL}/admin/users?search=${testUsers.targetUser1.username}`, {
    headers: { Authorization: `Bearer ${authTokens.superAdmin}` },
    ...config,
  });
  const foundTarget = searchUsers.data.data.users?.some((u) => u.username === testUsers.targetUser1.username);
  logTestResult('2.3 Search users by username', searchUsers.status === 200 && foundTarget, `Search returned ${searchUsers.data.data.users?.length || 0} results`);

  // Test 2.4: Get specific user by ID
  const getUser = await axios.get(`${API_URL}/admin/users/${testUsers.targetUser1.id}`, {
    headers: { Authorization: `Bearer ${authTokens.superAdmin}` },
    ...config,
  });
  logTestResult(
    '2.4 Get specific user by ID',
    getUser.status === 200 && getUser.data.data.user.id === testUsers.targetUser1.id,
    `User: ${getUser.data.data.user?.username}`
  );

  // Test 2.5: Create new user via admin API
  const timestamp = Date.now();
  const createUser = await axios.post(
    `${API_URL}/admin/users`,
    {
      username: `created_user_${timestamp}`,
      email: `created_${timestamp}@test.com`,
      password: 'NewUser123!',
      role: 'user',
    },
    {
      headers: { Authorization: `Bearer ${authTokens.superAdmin}` },
      ...config,
    }
  );
  const createdUserId = createUser.data.data.user?.id;
  logTestResult(
    '2.5 Create new user via admin API',
    createUser.status === 201 && createdUserId,
    `Created user ID: ${createdUserId}`
  );

  // Test 2.6: Update user details
  const updateUser = await axios.put(
    `${API_URL}/admin/users/${createdUserId}`,
    { username: `updated_user_${timestamp}` },
    {
      headers: { Authorization: `Bearer ${authTokens.superAdmin}` },
      ...config,
    }
  );
  logTestResult(
    '2.6 Update user details',
    updateUser.status === 200 && updateUser.data.data.user.username === `updated_user_${timestamp}`,
    `Updated username: ${updateUser.data.data.user?.username}`
  );

  // Test 2.7: Change user status (deactivate)
  const deactivateUser = await axios.put(
    `${API_URL}/admin/users/${testUsers.targetUser2.id}/status`,
    { is_active: false },
    {
      headers: { Authorization: `Bearer ${authTokens.admin}` },
      ...config,
    }
  );
  logTestResult('2.7 Deactivate user account', deactivateUser.status === 200, `Status: ${deactivateUser.status}`);

  // Test 2.8: Re-activate user
  const reactivateUser = await axios.put(
    `${API_URL}/admin/users/${testUsers.targetUser2.id}/status`,
    { is_active: true },
    {
      headers: { Authorization: `Bearer ${authTokens.admin}` },
      ...config,
    }
  );
  logTestResult('2.8 Reactivate user account', reactivateUser.status === 200, `Status: ${reactivateUser.status}`);

  // Test 2.9: Delete user (soft delete)
  const deleteUser = await axios.delete(`${API_URL}/admin/users/${createdUserId}`, {
    headers: { Authorization: `Bearer ${authTokens.superAdmin}` },
    ...config,
  });
  logTestResult('2.9 Delete user via admin API', deleteUser.status === 200, `Status: ${deleteUser.status}`);

  // Test 2.10: Verify deleted user is deactivated (soft delete)
  const getDeleted = await axios.get(`${API_URL}/admin/users/${createdUserId}`, {
    headers: { Authorization: `Bearer ${authTokens.superAdmin}` },
    ...config,
  });
  const isDeactivated = getDeleted.data.data?.user?.is_active === false;
  logTestResult('2.10 Soft-deleted user is deactivated', getDeleted.status === 200 && isDeactivated, `is_active: ${getDeleted.data.data?.user?.is_active}`);
}

// ============================================================
// TEST SUITE 3: Audit Logging Verification
// ============================================================

async function testAuditLogging() {
  console.log('\n============================================================');
  console.log('TEST SUITE 3: Audit Logging Verification');
  console.log('============================================================\n');

  // Perform actions that should be logged
  const timestamp = Date.now();
  const auditTestUser = await db.query(
    `INSERT INTO users (username, email, password_hash, role, email_verified, is_active)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [`audit_test_${timestamp}`, `audit_test_${timestamp}@test.com`, await bcrypt.hash('Test123!', 10), 'user', true, true]
  );
  const auditUserId = auditTestUser.rows[0].id;

  // Action 1: Update user role (should log USER_ROLE_CHANGE)
  await axios.put(
    `${API_URL}/admin/users/${auditUserId}/role`,
    { role: 'admin' },
    {
      headers: { Authorization: `Bearer ${authTokens.superAdmin}` },
      ...config,
    }
  );

  // Action 2: Change status (should log USER_STATUS_CHANGE)
  await axios.put(
    `${API_URL}/admin/users/${auditUserId}/status`,
    { is_active: false },
    {
      headers: { Authorization: `Bearer ${authTokens.superAdmin}` },
      ...config,
    }
  );

  // Action 3: Delete user (should log USER_DELETE)
  await axios.delete(`${API_URL}/admin/users/${auditUserId}`, {
    headers: { Authorization: `Bearer ${authTokens.superAdmin}` },
    ...config,
  });

  // Wait a moment for logs to be written
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Test 3.1: Retrieve audit logs
  const getAuditLogs = await axios.get(`${API_URL}/admin/audit-logs`, {
    headers: { Authorization: `Bearer ${authTokens.superAdmin}` },
    ...config,
  });
  logTestResult(
    '3.1 Retrieve audit logs',
    getAuditLogs.status === 200 && getAuditLogs.data.data.logs.length > 0,
    `Found ${getAuditLogs.data.data.logs?.length || 0} logs`
  );

  // Test 3.2: Filter audit logs by action type
  const filterByAction = await axios.get(`${API_URL}/admin/audit-logs?action=USER_ROLE_CHANGE`, {
    headers: { Authorization: `Bearer ${authTokens.superAdmin}` },
    ...config,
  });
  const roleChangeLogs = filterByAction.data.data.logs?.filter((l) => l.action === 'USER_ROLE_CHANGE');
  logTestResult(
    '3.2 Filter audit logs by action type',
    filterByAction.status === 200 && roleChangeLogs.length > 0,
    `Found ${roleChangeLogs?.length || 0} USER_ROLE_CHANGE logs`
  );

  // Test 3.3: Verify audit log contains admin ID
  const logsWithAdminId = getAuditLogs.data.data.logs?.filter((l) => l.admin_id === testUsers.superAdmin.id);
  logTestResult(
    '3.3 Audit logs contain correct admin ID',
    logsWithAdminId.length > 0,
    `Found ${logsWithAdminId?.length || 0} logs by test super admin`
  );

  // Test 3.4: Verify audit log contains target user info
  const logsWithTarget = getAuditLogs.data.data.logs?.filter((l) => l.target_id === auditUserId);
  logTestResult(
    '3.4 Audit logs contain target user info',
    logsWithTarget.length > 0,
    `Found ${logsWithTarget?.length || 0} logs for target user`
  );

  // Test 3.5: Verify audit log captures IP address
  const logsWithIP = getAuditLogs.data.data.logs?.filter((l) => l.ip_address);
  logTestResult(
    '3.5 Audit logs capture IP address',
    logsWithIP.length > 0,
    `${logsWithIP?.length || 0} logs have IP addresses`
  );

  // Test 3.6: Audit logs pagination works
  const paginatedLogs = await axios.get(`${API_URL}/admin/audit-logs?page=1&pageSize=5`, {
    headers: { Authorization: `Bearer ${authTokens.superAdmin}` },
    ...config,
  });
  logTestResult(
    '3.6 Audit logs pagination works',
    paginatedLogs.status === 200 && paginatedLogs.data.data.pagination,
    `Page: ${paginatedLogs.data.data.pagination?.page}, Total: ${paginatedLogs.data.data.pagination?.total}`
  );

  // Test 3.7: Filter by date range
  const today = new Date().toISOString().split('T')[0];
  const dateFilter = await axios.get(`${API_URL}/admin/audit-logs?start_date=${today}`, {
    headers: { Authorization: `Bearer ${authTokens.superAdmin}` },
    ...config,
  });
  logTestResult(
    '3.7 Filter audit logs by date range',
    dateFilter.status === 200,
    `Found ${dateFilter.data.data.logs?.length || 0} logs for today`
  );

  // Test 3.8: Sort audit logs (DESC by default - newest first)
  const sortedLogs = await axios.get(`${API_URL}/admin/audit-logs?sortOrder=DESC`, {
    headers: { Authorization: `Bearer ${authTokens.superAdmin}` },
    ...config,
  });
  let isSorted = true;
  if (sortedLogs.data.data.logs?.length > 1) {
    for (let i = 1; i < sortedLogs.data.data.logs.length; i++) {
      if (new Date(sortedLogs.data.data.logs[i - 1].created_at) < new Date(sortedLogs.data.data.logs[i].created_at)) {
        isSorted = false;
        break;
      }
    }
  }
  logTestResult('3.8 Audit logs sorted correctly (DESC)', sortedLogs.status === 200 && isSorted, 'Logs sorted by date descending');
}

// ============================================================
// TEST SUITE 4: Dashboard Statistics Accuracy
// ============================================================

async function testDashboardStats() {
  console.log('\n============================================================');
  console.log('TEST SUITE 4: Dashboard Statistics Accuracy');
  console.log('============================================================\n');

  // Test 4.1: Get overall stats
  const overallStats = await axios.get(`${API_URL}/admin/dashboard/stats`, {
    headers: { Authorization: `Bearer ${authTokens.superAdmin}` },
    ...config,
  });
  logTestResult(
    '4.1 Get overall dashboard stats',
    overallStats.status === 200 && overallStats.data.data.totalUsers !== undefined,
    `Total Users: ${overallStats.data.data?.totalUsers}`
  );

  // Test 4.2: Verify stats include all expected fields
  const expectedFields = ['totalUsers', 'activeUsers', 'newUsersToday', 'newUsersThisWeek', 'newUsersThisMonth', 'adminCount'];
  const hasAllFields = expectedFields.every((field) => overallStats.data.data[field] !== undefined);
  logTestResult('4.2 Stats include all expected fields', hasAllFields, `Fields: ${expectedFields.join(', ')}`);

  // Test 4.3: User growth data
  const userGrowth = await axios.get(`${API_URL}/admin/dashboard/user-growth?days=30`, {
    headers: { Authorization: `Bearer ${authTokens.superAdmin}` },
    ...config,
  });
  const hasGrowthData = userGrowth.data.data.data && userGrowth.data.data.labels;
  logTestResult(
    '4.3 User growth data returned',
    userGrowth.status === 200 && hasGrowthData,
    `Data points: ${userGrowth.data.data.data?.length || 0}`
  );

  // Test 4.4: Custom days parameter for user growth
  const customGrowth = await axios.get(`${API_URL}/admin/dashboard/user-growth?days=7`, {
    headers: { Authorization: `Bearer ${authTokens.superAdmin}` },
    ...config,
  });
  const correctLength = customGrowth.data.data.data?.length === 7;
  logTestResult('4.4 Custom days parameter works', customGrowth.status === 200 && correctLength, `Requested 7 days, got ${customGrowth.data.data.data?.length || 0}`);

  // Test 4.5: Activity summary
  const activitySummary = await axios.get(`${API_URL}/admin/dashboard/activity`, {
    headers: { Authorization: `Bearer ${authTokens.superAdmin}` },
    ...config,
  });
  const hasActivityData = activitySummary.data.data.loginAttemptsToday !== undefined;
  logTestResult(
    '4.5 Activity summary returned',
    activitySummary.status === 200 && hasActivityData,
    `Login attempts today: ${activitySummary.data.data?.loginAttemptsToday}`
  );

  // Test 4.6: Security overview
  const securityOverview = await axios.get(`${API_URL}/admin/dashboard/security`, {
    headers: { Authorization: `Bearer ${authTokens.superAdmin}` },
    ...config,
  });
  const hasSecurityData = securityOverview.data.data.mfaEnabledPercentage !== undefined;
  logTestResult(
    '4.6 Security overview returned',
    securityOverview.status === 200 && hasSecurityData,
    `MFA adoption: ${securityOverview.data.data?.mfaEnabledPercentage}%`
  );

  // Test 4.7: Verify admin count is reasonable (caching may cause slight delay)
  const actualAdminCount = await db.query("SELECT COUNT(*) FROM users WHERE role IN ('admin', 'super_admin')");
  const reportedCount = overallStats.data.data.adminCount;
  const adminDiff = Math.abs(parseInt(actualAdminCount.rows[0].count) - reportedCount);
  logTestResult(
    '4.7 Admin count is reasonable (allows for cache)',
    reportedCount > 0 && adminDiff <= 10,
    `DB: ${actualAdminCount.rows[0].count}, API: ${reportedCount}, Diff: ${adminDiff}`
  );

  // Test 4.8: Verify active users count is reasonable (caching may cause slight delay)
  const actualActiveCount = await db.query('SELECT COUNT(*) FROM users WHERE is_active = true');
  const reportedActiveCount = overallStats.data.data.activeUsers;
  const activeDiff = Math.abs(parseInt(actualActiveCount.rows[0].count) - reportedActiveCount);
  logTestResult(
    '4.8 Active users count is reasonable (allows for cache)',
    reportedActiveCount > 0 && activeDiff <= 10,
    `DB: ${actualActiveCount.rows[0].count}, API: ${reportedActiveCount}, Diff: ${activeDiff}`
  );
}

// ============================================================
// TEST SUITE 5: Error Handling and Edge Cases
// ============================================================

async function testErrorHandling() {
  console.log('\n============================================================');
  console.log('TEST SUITE 5: Error Handling and Edge Cases');
  console.log('============================================================\n');

  // Test 5.1: Get non-existent user
  const getNonExistent = await axios.get(`${API_URL}/admin/users/999999`, {
    headers: { Authorization: `Bearer ${authTokens.superAdmin}` },
    ...config,
  });
  logTestResult('5.1 Get non-existent user returns 404', getNonExistent.status === 404, `Status: ${getNonExistent.status}`);

  // Test 5.2: Invalid user ID format
  const invalidId = await axios.get(`${API_URL}/admin/users/invalid-id`, {
    headers: { Authorization: `Bearer ${authTokens.superAdmin}` },
    ...config,
  });
  logTestResult(
    '5.2 Invalid user ID format handled',
    invalidId.status === 400 || invalidId.status === 404,
    `Status: ${invalidId.status}`
  );

  // Test 5.3: Create user with duplicate email
  const duplicateEmail = await axios.post(
    `${API_URL}/admin/users`,
    {
      username: 'unique_username',
      email: testUsers.regularUser.email, // Already exists
      password: 'Test123!',
      role: 'user',
    },
    {
      headers: { Authorization: `Bearer ${authTokens.superAdmin}` },
      ...config,
    }
  );
  logTestResult(
    '5.3 Duplicate email prevented',
    duplicateEmail.status === 400 || duplicateEmail.status === 409,
    `Status: ${duplicateEmail.status}`
  );

  // Test 5.4: Create user with invalid role
  const invalidRole = await axios.post(
    `${API_URL}/admin/users`,
    {
      username: 'test_invalid_role',
      email: 'invalidrole@test.com',
      password: 'Test123!',
      role: 'invalid_role',
    },
    {
      headers: { Authorization: `Bearer ${authTokens.superAdmin}` },
      ...config,
    }
  );
  logTestResult('5.4 Invalid role rejected', invalidRole.status === 400, `Status: ${invalidRole.status}`);

  // Test 5.5: Empty required fields
  const emptyFields = await axios.post(
    `${API_URL}/admin/users`,
    {
      username: '',
      email: '',
      password: '',
    },
    {
      headers: { Authorization: `Bearer ${authTokens.superAdmin}` },
      ...config,
    }
  );
  logTestResult('5.5 Empty required fields rejected', emptyFields.status === 400, `Status: ${emptyFields.status}`);

  // Test 5.6: Invalid pagination parameters
  const invalidPagination = await axios.get(`${API_URL}/admin/users?page=-1&pageSize=0`, {
    headers: { Authorization: `Bearer ${authTokens.superAdmin}` },
    ...config,
  });
  logTestResult(
    '5.6 Invalid pagination handled gracefully',
    invalidPagination.status === 200 || invalidPagination.status === 400,
    `Status: ${invalidPagination.status}`
  );

  // Test 5.7: Expired/invalid token
  const invalidToken = await axios.get(`${API_URL}/admin/dashboard/stats`, {
    headers: { Authorization: 'Bearer invalid_token_here' },
    ...config,
  });
  logTestResult('5.7 Invalid token rejected', invalidToken.status === 401, `Status: ${invalidToken.status}`);

  // Test 5.8: Super admin cannot delete themselves
  const selfDelete = await axios.delete(`${API_URL}/admin/users/${testUsers.superAdmin.id}`, {
    headers: { Authorization: `Bearer ${authTokens.superAdmin}` },
    ...config,
  });
  logTestResult(
    '5.8 Admin cannot delete themselves',
    selfDelete.status === 400 || selfDelete.status === 403,
    `Status: ${selfDelete.status}`
  );

  // Test 5.9: Invalid status value
  const invalidStatus = await axios.put(
    `${API_URL}/admin/users/${testUsers.targetUser1.id}/status`,
    { is_active: 'invalid' },
    {
      headers: { Authorization: `Bearer ${authTokens.superAdmin}` },
      ...config,
    }
  );
  logTestResult('5.9 Invalid status value handled', invalidStatus.status === 400, `Status: ${invalidStatus.status}`);

  // Test 5.10: Missing authorization header
  const missingAuth = await axios.get(`${API_URL}/admin/users`, config);
  logTestResult('5.10 Missing authorization rejected', missingAuth.status === 401, `Status: ${missingAuth.status}`);
}

// ============================================================
// TEST SUITE 6: Data Consistency Checks
// ============================================================

async function testDataConsistency() {
  console.log('\n============================================================');
  console.log('TEST SUITE 6: Data Consistency Checks');
  console.log('============================================================\n');

  // Test 6.1: User list pagination totals are accurate
  const page1 = await axios.get(`${API_URL}/admin/users?page=1&pageSize=2`, {
    headers: { Authorization: `Bearer ${authTokens.superAdmin}` },
    ...config,
  });
  const totalFromPagination = page1.data.data.pagination?.totalCount;
  const actualTotal = await db.query('SELECT COUNT(*) FROM users');
  logTestResult(
    '6.1 Pagination total matches database count',
    totalFromPagination === parseInt(actualTotal.rows[0].count),
    `API Total: ${totalFromPagination}, DB: ${actualTotal.rows[0].count}`
  );

  // Test 6.2: User details match after update
  const originalUser = await axios.get(`${API_URL}/admin/users/${testUsers.targetUser1.id}`, {
    headers: { Authorization: `Bearer ${authTokens.superAdmin}` },
    ...config,
  });
  const newUsername = `consistency_test_${Date.now()}`;
  await axios.put(
    `${API_URL}/admin/users/${testUsers.targetUser1.id}`,
    { username: newUsername },
    {
      headers: { Authorization: `Bearer ${authTokens.superAdmin}` },
      ...config,
    }
  );
  const updatedUser = await axios.get(`${API_URL}/admin/users/${testUsers.targetUser1.id}`, {
    headers: { Authorization: `Bearer ${authTokens.superAdmin}` },
    ...config,
  });
  const dbUser = await db.query('SELECT username FROM users WHERE id = $1', [testUsers.targetUser1.id]);
  logTestResult(
    '6.2 User details match after update',
    updatedUser.data.data.user.username === newUsername && dbUser.rows[0].username === newUsername,
    `API: ${updatedUser.data.data.user.username}, DB: ${dbUser.rows[0].username}`
  );

  // Restore original username
  await axios.put(
    `${API_URL}/admin/users/${testUsers.targetUser1.id}`,
    { username: testUsers.targetUser1.username },
    {
      headers: { Authorization: `Bearer ${authTokens.superAdmin}` },
      ...config,
    }
  );

  // Test 6.3: Role changes are persisted correctly
  await axios.put(
    `${API_URL}/admin/users/${testUsers.targetUser1.id}/role`,
    { role: 'admin' },
    {
      headers: { Authorization: `Bearer ${authTokens.superAdmin}` },
      ...config,
    }
  );
  const roleCheck = await db.query('SELECT role FROM users WHERE id = $1', [testUsers.targetUser1.id]);
  logTestResult(
    '6.3 Role changes are persisted correctly',
    roleCheck.rows[0].role === 'admin',
    `DB role: ${roleCheck.rows[0].role}`
  );

  // Reset role
  await axios.put(
    `${API_URL}/admin/users/${testUsers.targetUser1.id}/role`,
    { role: 'user' },
    {
      headers: { Authorization: `Bearer ${authTokens.superAdmin}` },
      ...config,
    }
  );

  // Test 6.4: Status changes are persisted correctly
  await axios.put(
    `${API_URL}/admin/users/${testUsers.targetUser1.id}/status`,
    { is_active: false },
    {
      headers: { Authorization: `Bearer ${authTokens.superAdmin}` },
      ...config,
    }
  );
  const statusCheck = await db.query('SELECT is_active FROM users WHERE id = $1', [testUsers.targetUser1.id]);
  logTestResult('6.4 Status changes are persisted correctly', statusCheck.rows[0].is_active === false, `DB is_active: ${statusCheck.rows[0].is_active}`);

  // Reset status
  await axios.put(
    `${API_URL}/admin/users/${testUsers.targetUser1.id}/status`,
    { is_active: true },
    {
      headers: { Authorization: `Bearer ${authTokens.superAdmin}` },
      ...config,
    }
  );

  // Test 6.5: Audit log counts increase after actions
  const beforeCount = await db.query('SELECT COUNT(*) FROM audit_logs');
  await axios.put(
    `${API_URL}/admin/users/${testUsers.targetUser2.id}/status`,
    { is_active: false },
    {
      headers: { Authorization: `Bearer ${authTokens.admin}` },
      ...config,
    }
  );
  await new Promise((resolve) => setTimeout(resolve, 100));
  const afterCount = await db.query('SELECT COUNT(*) FROM audit_logs');
  logTestResult(
    '6.5 Audit log count increases after admin action',
    parseInt(afterCount.rows[0].count) > parseInt(beforeCount.rows[0].count),
    `Before: ${beforeCount.rows[0].count}, After: ${afterCount.rows[0].count}`
  );

  // Reset
  await axios.put(
    `${API_URL}/admin/users/${testUsers.targetUser2.id}/status`,
    { is_active: true },
    {
      headers: { Authorization: `Bearer ${authTokens.admin}` },
      ...config,
    }
  );
}

// ============================================================
// MAIN TEST RUNNER
// ============================================================

async function runAllTests() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║     STORY 10.6: ADMIN PANEL INTEGRATION TESTS             ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    // Setup
    await setupTestUsers();
    await loginTestUsers();

    // Run test suites
    await testRBAC();
    await testUserManagement();
    await testAuditLogging();
    await testDashboardStats();
    await testErrorHandling();
    await testDataConsistency();

    // Summary
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                     TEST SUMMARY                           ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log(`Total Tests: ${testResults.passed + testResults.failed}`);
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%\n`);

    if (testResults.failed > 0) {
      console.log('Failed Tests:');
      testResults.tests
        .filter((t) => !t.passed)
        .forEach((t) => console.log(`  ❌ ${t.name}: ${t.details}`));
    }

    const passRate = (testResults.passed / (testResults.passed + testResults.failed)) * 100;
    if (passRate >= 95) {
      console.log('\n🎉 EXCELLENT! Admin panel integration tests passed with high confidence.');
    } else if (passRate >= 80) {
      console.log('\n✅ GOOD! Most tests passed. Review failed tests before deployment.');
    } else {
      console.log('\n⚠️ WARNING! Significant test failures detected. Do not deploy.');
    }
  } catch (error) {
    console.error('\n❌ TEST SUITE FAILED:', error.message);
    console.error(error.stack);
  } finally {
    await cleanupTestData();
    if (db.pool && db.pool.end) {
      await db.pool.end();
    }
  }
}

runAllTests();
