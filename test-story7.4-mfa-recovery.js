/**
 * Story 7.4: MFA Recovery & Management - Complete Test Suite
 *
 * Tests all endpoints for MFA recovery and management
 *
 * Test Coverage:
 * - TC-7.4-01: Get MFA status (enabled)
 * - TC-7.4-02: Get MFA status (disabled)
 * - TC-7.4-03: Request MFA reset with valid password
 * - TC-7.4-04: Request MFA reset with invalid password
 * - TC-7.4-05: Confirm MFA reset with valid token
 * - TC-7.4-06: Confirm MFA reset with invalid token
 * - TC-7.4-07: Confirm MFA reset with expired token
 * - TC-7.4-08: Admin unlock MFA account (as admin)
 * - TC-7.4-09: Admin unlock MFA account (as non-admin - should fail)
 * - TC-7.4-10: Admin unlock non-existent user (should fail)
 */

require('dotenv').config();
const axios = require('axios');
const speakeasy = require('speakeasy');
const User = require('./backend/src/models/User');
const MFASecret = require('./backend/src/models/MFASecret');

const API_BASE_URL = 'http://localhost:5000';

// Test state
let testState = {
  regularUser: null,
  regularUserToken: null,
  adminUser: null,
  adminUserToken: null,
  mfaResetToken: null,
  testResults: [],
};

// Helper: Log test result
function logTest(testId, description, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`\n${testId}: ${description}`);
  console.log(`${status}${details ? ' - ' + details : ''}`);
  testState.testResults.push({ testId, description, passed, details });
}

// Helper: Setup test users
async function setupTestUsers() {
  console.log('========================================');
  console.log('SETUP: Creating test users...');
  console.log('========================================\n');

  try {
    // Create regular user with MFA enabled
    const regularEmail = `mfa-recovery-test-${Date.now()}@example.com`;
    const regularPassword = 'Test123!@#';

    const regularResponse = await axios.post(`${API_BASE_URL}/api/auth/register`, {
      username: `mfarecovery${Date.now()}`,
      email: regularEmail,
      password: regularPassword,
    });

    testState.regularUser = {
      id: regularResponse.data.data.user.id,
      email: regularEmail,
      password: regularPassword,
    };

    // Login to get token
    const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: regularEmail,
      password: regularPassword,
    });
    testState.regularUserToken = loginResponse.data.data.tokens.accessToken;

    // Setup and enable MFA for regular user
    const setupResponse = await axios.post(
      `${API_BASE_URL}/api/auth/mfa/setup`,
      {},
      { headers: { Authorization: `Bearer ${testState.regularUserToken}` } }
    );

    // Generate valid TOTP token from the secret
    const token = speakeasy.totp({
      secret: setupResponse.data.data.secret,
      encoding: 'base32',
    });

    const enableResponse = await axios.post(
      `${API_BASE_URL}/api/auth/mfa/enable`,
      { token },
      { headers: { Authorization: `Bearer ${testState.regularUserToken}` } }
    );

    console.log(`✅ Created regular user with MFA enabled: ${regularEmail}`);

    // Create admin user
    const adminEmail = `admin-${Date.now()}@example.com`;
    const adminPassword = 'Admin123!@#';

    const adminResponse = await axios.post(`${API_BASE_URL}/api/auth/register`, {
      username: `admin${Date.now()}`,
      email: adminEmail,
      password: adminPassword,
    });

    testState.adminUser = {
      id: adminResponse.data.data.user.id,
      email: adminEmail,
      password: adminPassword,
    };

    // Update admin user role to 'admin'
    await User.update(testState.adminUser.id, { role: 'admin' });

    // Login admin to get token
    const adminLoginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: adminEmail,
      password: adminPassword,
    });
    testState.adminUserToken = adminLoginResponse.data.data.tokens.accessToken;

    console.log(`✅ Created admin user: ${adminEmail}\n`);

  } catch (error) {
    console.error('❌ Setup failed:', error.response?.data || error.message);
    throw error;
  }
}

// TC-7.4-01: Get MFA status (enabled)
async function testGetMFAStatusEnabled() {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/auth/mfa/status`, {
      headers: { Authorization: `Bearer ${testState.regularUserToken}` },
    });

    const { mfaEnabled, backupCodesRemaining } = response.data.data;

    const passed = mfaEnabled === true && backupCodesRemaining === 10;
    logTest(
      'TC-7.4-01',
      'Get MFA status (enabled)',
      passed,
      `MFA enabled: ${mfaEnabled}, Backup codes: ${backupCodesRemaining}`
    );
  } catch (error) {
    logTest('TC-7.4-01', 'Get MFA status (enabled)', false, error.response?.data?.message || error.message);
  }
}

// TC-7.4-02: Get MFA status (disabled)
async function testGetMFAStatusDisabled() {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/auth/mfa/status`, {
      headers: { Authorization: `Bearer ${testState.adminUserToken}` },
    });

    const { mfaEnabled, backupCodesRemaining } = response.data.data;

    const passed = mfaEnabled === false && backupCodesRemaining === 0;
    logTest(
      'TC-7.4-02',
      'Get MFA status (disabled)',
      passed,
      `MFA enabled: ${mfaEnabled}, Backup codes: ${backupCodesRemaining}`
    );
  } catch (error) {
    logTest('TC-7.4-02', 'Get MFA status (disabled)', false, error.response?.data?.message || error.message);
  }
}

// TC-7.4-03: Request MFA reset with valid password
async function testRequestMFAResetValid() {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/auth/mfa/reset-request`,
      { password: testState.regularUser.password },
      { headers: { Authorization: `Bearer ${testState.regularUserToken}` } }
    );

    const passed = response.data.success === true;

    // Get reset token from database for later tests
    const user = await User.findByEmail(testState.regularUser.email);
    testState.mfaResetToken = user.mfa_reset_token;

    logTest(
      'TC-7.4-03',
      'Request MFA reset with valid password',
      passed,
      response.data.message
    );
  } catch (error) {
    logTest('TC-7.4-03', 'Request MFA reset with valid password', false, error.response?.data?.message || error.message);
  }
}

// TC-7.4-04: Request MFA reset with invalid password
async function testRequestMFAResetInvalid() {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/auth/mfa/reset-request`,
      { password: 'WrongPassword123!' },
      { headers: { Authorization: `Bearer ${testState.regularUserToken}` } }
    );

    logTest('TC-7.4-04', 'Request MFA reset with invalid password', false, 'Should have rejected invalid password');
  } catch (error) {
    const passed = error.response?.status === 401;
    logTest(
      'TC-7.4-04',
      'Request MFA reset with invalid password',
      passed,
      error.response?.data?.message || 'Correctly rejected'
    );
  }
}

// TC-7.4-05: Confirm MFA reset with valid token
async function testConfirmMFAResetValid() {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/auth/mfa/reset-confirm`, {
      token: testState.mfaResetToken,
    });

    const passed = response.data.success === true;
    logTest(
      'TC-7.4-05',
      'Confirm MFA reset with valid token',
      passed,
      response.data.message
    );

    // Re-enable MFA for remaining tests
    const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: testState.regularUser.email,
      password: testState.regularUser.password,
    });
    testState.regularUserToken = loginResponse.data.data.tokens.accessToken;

    const setupResponse = await axios.post(
      `${API_BASE_URL}/api/auth/mfa/setup`,
      {},
      { headers: { Authorization: `Bearer ${testState.regularUserToken}` } }
    );

    // Generate valid TOTP token from the secret
    const token2 = speakeasy.totp({
      secret: setupResponse.data.data.secret,
      encoding: 'base32',
    });

    await axios.post(
      `${API_BASE_URL}/api/auth/mfa/enable`,
      { token: token2 },
      { headers: { Authorization: `Bearer ${testState.regularUserToken}` } }
    );

  } catch (error) {
    logTest('TC-7.4-05', 'Confirm MFA reset with valid token', false, error.response?.data?.message || error.message);
  }
}

// TC-7.4-06: Confirm MFA reset with invalid token
async function testConfirmMFAResetInvalid() {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/auth/mfa/reset-confirm`, {
      token: 'invalid-token-12345',
    });

    logTest('TC-7.4-06', 'Confirm MFA reset with invalid token', false, 'Should have rejected invalid token');
  } catch (error) {
    const passed = error.response?.status === 400;
    logTest(
      'TC-7.4-06',
      'Confirm MFA reset with invalid token',
      passed,
      error.response?.data?.message || 'Correctly rejected'
    );
  }
}

// TC-7.4-07: Confirm MFA reset with expired token
async function testConfirmMFAResetExpired() {
  try {
    // Create expired token
    const expiredDate = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
    await User.updateMFAResetToken(testState.regularUser.id, 'expired-token-test', expiredDate);

    const response = await axios.post(`${API_BASE_URL}/api/auth/mfa/reset-confirm`, {
      token: 'expired-token-test',
    });

    logTest('TC-7.4-07', 'Confirm MFA reset with expired token', false, 'Should have rejected expired token');
  } catch (error) {
    const passed = error.response?.status === 400 && error.response?.data?.message.includes('expired');
    logTest(
      'TC-7.4-07',
      'Confirm MFA reset with expired token',
      passed,
      error.response?.data?.message || 'Correctly rejected'
    );
  }
}

// TC-7.4-08: Admin unlock MFA account (as admin)
async function testAdminUnlockAsAdmin() {
  try {
    // Lock the regular user's MFA account first
    await MFASecret.recordFailedAttempt(testState.regularUser.id);
    await MFASecret.recordFailedAttempt(testState.regularUser.id);
    await MFASecret.recordFailedAttempt(testState.regularUser.id);
    await MFASecret.recordFailedAttempt(testState.regularUser.id);
    await MFASecret.recordFailedAttempt(testState.regularUser.id);
    await MFASecret.recordFailedAttempt(testState.regularUser.id); // Locks at 5 attempts

    const response = await axios.post(
      `${API_BASE_URL}/api/auth/mfa/admin/unlock/${testState.regularUser.id}`,
      {},
      { headers: { Authorization: `Bearer ${testState.adminUserToken}` } }
    );

    const passed = response.data.success === true;
    logTest(
      'TC-7.4-08',
      'Admin unlock MFA account (as admin)',
      passed,
      response.data.message
    );
  } catch (error) {
    logTest('TC-7.4-08', 'Admin unlock MFA account (as admin)', false, error.response?.data?.message || error.message);
  }
}

// TC-7.4-09: Admin unlock MFA account (as non-admin - should fail)
async function testAdminUnlockAsNonAdmin() {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/auth/mfa/admin/unlock/${testState.adminUser.id}`,
      {},
      { headers: { Authorization: `Bearer ${testState.regularUserToken}` } }
    );

    logTest('TC-7.4-09', 'Admin unlock MFA account (as non-admin)', false, 'Should have rejected non-admin');
  } catch (error) {
    const passed = error.response?.status === 403;
    logTest(
      'TC-7.4-09',
      'Admin unlock MFA account (as non-admin)',
      passed,
      error.response?.data?.message || 'Correctly rejected'
    );
  }
}

// TC-7.4-10: Admin unlock non-existent user (should fail)
async function testAdminUnlockNonExistentUser() {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/auth/mfa/admin/unlock/99999`,
      {},
      { headers: { Authorization: `Bearer ${testState.adminUserToken}` } }
    );

    logTest('TC-7.4-10', 'Admin unlock non-existent user', false, 'Should have rejected non-existent user');
  } catch (error) {
    const passed = error.response?.status === 404;
    logTest(
      'TC-7.4-10',
      'Admin unlock non-existent user',
      passed,
      error.response?.data?.message || 'Correctly rejected'
    );
  }
}

// Main test execution
async function runAllTests() {
  console.log('========================================');
  console.log('Story 7.4: MFA Recovery & Management');
  console.log('Complete Test Suite');
  console.log('========================================\n');

  try {
    await setupTestUsers();

    console.log('========================================');
    console.log('RUNNING TESTS...');
    console.log('========================================');

    await testGetMFAStatusEnabled();
    await testGetMFAStatusDisabled();
    await testRequestMFAResetValid();
    await testRequestMFAResetInvalid();
    await testConfirmMFAResetValid();
    await testConfirmMFAResetInvalid();
    await testConfirmMFAResetExpired();
    await testAdminUnlockAsAdmin();
    await testAdminUnlockAsNonAdmin();
    await testAdminUnlockNonExistentUser();

    // Print summary
    console.log('\n========================================');
    console.log('TEST SUMMARY');
    console.log('========================================');

    const totalTests = testState.testResults.length;
    const passedTests = testState.testResults.filter(t => t.passed).length;
    const failedTests = totalTests - passedTests;
    const passRate = ((passedTests / totalTests) * 100).toFixed(1);

    console.log(`\nTotal Tests:  ${totalTests}`);
    console.log(`Passed:       ${passedTests} ✅`);
    console.log(`Failed:       ${failedTests} ❌`);
    console.log(`Pass Rate:    ${passRate}%`);

    if (passRate === '100.0') {
      console.log('\n🎉 ALL TESTS PASSED! Story 7.4 is complete!');
    } else {
      console.log('\n⚠️  Some tests failed. Review failures above.');
    }

    console.log('\n========================================\n');

  } catch (error) {
    console.error('\n❌ Test execution failed:', error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
  }
}

runAllTests();
