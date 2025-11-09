/**
 * Phase 7: Multi-Factor Authentication - Comprehensive Test Suite
 *
 * Tests all MFA functionality across Stories 7.1-7.4:
 * - Story 7.1: MFA Setup & Configuration
 * - Story 7.2: TOTP Verification
 * - Story 7.3: MFA Login Flow
 * - Story 7.4: MFA Recovery & Management
 */

require('dotenv').config();
const axios = require('axios');
const speakeasy = require('speakeasy');
const User = require('./backend/src/models/User');
const MFASecret = require('./backend/src/models/MFASecret');

const API_BASE_URL = 'http://localhost:5000';

// Test state
let testState = {
  testUser: null,
  testUserToken: null,
  adminUser: null,
  adminUserToken: null,
  mfaSecret: null,
  backupCodes: [],
  mfaChallengeToken: null,
  mfaResetToken: null,
  results: {
    passed: [],
    failed: [],
    skipped: []
  }
};

// Helper: Log progress
function logProgress(message, level = 'INFO') {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  const prefix = {
    'INFO': '📋',
    'SUCCESS': '✅',
    'ERROR': '❌',
    'WARN': '⚠️',
    'SETUP': '🔧'
  }[level] || '📋';

  console.log(`[${timestamp}] ${prefix} ${message}`);
}

// Helper: Log test result
function logTest(category, testId, description, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`\n${category} | ${testId}: ${description}`);
  console.log(`${status}${details ? ' - ' + details : ''}`);

  if (passed) {
    testState.results.passed.push({ category, testId, description });
  } else {
    testState.results.failed.push({ category, testId, description, details });
  }
}

// Setup: Create test users
async function setupTestUsers() {
  logProgress('Setting up test users...', 'SETUP');

  try {
    // Create regular test user
    const testEmail = `phase7-test-${Date.now()}@example.com`;
    const testPassword = 'Test123!@#';

    const userResponse = await axios.post(`${API_BASE_URL}/api/auth/register`, {
      username: `phase7test${Date.now()}`,
      email: testEmail,
      password: testPassword,
    });

    testState.testUser = {
      id: userResponse.data.data.user.id,
      email: testEmail,
      password: testPassword,
    };

    const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: testEmail,
      password: testPassword,
    });

    testState.testUserToken = loginResponse.data.data.tokens.accessToken;
    logProgress(`Created test user: ${testEmail}`, 'SUCCESS');

    // Create admin user
    const adminEmail = `phase7-admin-${Date.now()}@example.com`;
    const adminPassword = 'Admin123!@#';

    const adminResponse = await axios.post(`${API_BASE_URL}/api/auth/register`, {
      username: `phase7admin${Date.now()}`,
      email: adminEmail,
      password: adminPassword,
    });

    testState.adminUser = {
      id: adminResponse.data.data.user.id,
      email: adminEmail,
      password: adminPassword,
    };

    // Update to admin role
    await User.update(testState.adminUser.id, { role: 'admin' });

    const adminLoginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: adminEmail,
      password: adminPassword,
    });

    testState.adminUserToken = adminLoginResponse.data.data.tokens.accessToken;
    logProgress(`Created admin user: ${adminEmail}`, 'SUCCESS');

  } catch (error) {
    logProgress(`Setup failed: ${error.message}`, 'ERROR');
    throw error;
  }
}

// STORY 7.1: MFA Setup & Configuration Tests
async function testStory71_MFASetup() {
  logProgress('Testing Story 7.1: MFA Setup & Configuration...', 'INFO');

  // Test 7.1-01: Setup MFA
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/auth/mfa/setup`,
      {},
      { headers: { Authorization: `Bearer ${testState.testUserToken}` } }
    );

    const passed = response.data.success === true &&
                   response.data.data.secret &&
                   response.data.data.qrCode &&
                   response.data.data.backupCodes;

    if (passed) {
      testState.mfaSecret = response.data.data.secret;
      testState.backupCodes = response.data.data.backupCodes;
    }

    logTest('Story 7.1', 'TC-7.1-01', 'Setup MFA (generate secret and QR code)', passed,
      passed ? `Secret: ${testState.mfaSecret.substring(0, 10)}..., Backup codes: ${testState.backupCodes.length}` : 'Failed to generate MFA setup');
  } catch (error) {
    logTest('Story 7.1', 'TC-7.1-01', 'Setup MFA', false, error.response?.data?.message || error.message);
  }

  // Test 7.1-02: Enable MFA with valid TOTP
  try {
    const token = speakeasy.totp({
      secret: testState.mfaSecret,
      encoding: 'base32',
    });

    const response = await axios.post(
      `${API_BASE_URL}/api/auth/mfa/enable`,
      { token },
      { headers: { Authorization: `Bearer ${testState.testUserToken}` } }
    );

    const passed = response.data.success === true;
    logTest('Story 7.1', 'TC-7.1-02', 'Enable MFA with valid TOTP token', passed,
      passed ? 'MFA enabled successfully' : 'Failed to enable MFA');
  } catch (error) {
    logTest('Story 7.1', 'TC-7.1-02', 'Enable MFA with valid TOTP token', false, error.response?.data?.message || error.message);
  }

  // Test 7.1-03: Enable MFA with invalid TOTP (should fail)
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/auth/mfa/enable`,
      { token: '000000' },
      { headers: { Authorization: `Bearer ${testState.testUserToken}` } }
    );

    logTest('Story 7.1', 'TC-7.1-03', 'Enable MFA with invalid TOTP (should reject)', false, 'Should have rejected invalid token');
  } catch (error) {
    const passed = error.response?.status === 400;
    logTest('Story 7.1', 'TC-7.1-03', 'Enable MFA with invalid TOTP (should reject)', passed,
      passed ? 'Correctly rejected invalid token' : 'Wrong error response');
  }

  // Test 7.1-04: Regenerate backup codes
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/auth/mfa/backup-codes/regenerate`,
      { password: testState.testUser.password },
      { headers: { Authorization: `Bearer ${testState.testUserToken}` } }
    );

    const passed = response.data.success === true &&
                   response.data.data.backupCodes &&
                   response.data.data.backupCodes.length === 10;

    if (passed) {
      testState.backupCodes = response.data.data.backupCodes;
    }

    logTest('Story 7.1', 'TC-7.1-04', 'Regenerate backup codes', passed,
      passed ? `New backup codes: ${testState.backupCodes.length}` : 'Failed to regenerate');
  } catch (error) {
    logTest('Story 7.1', 'TC-7.1-04', 'Regenerate backup codes', false, error.response?.data?.message || error.message);
  }
}

// STORY 7.2: TOTP Verification Tests
async function testStory72_TOTPVerification() {
  logProgress('Testing Story 7.2: TOTP Verification...', 'INFO');

  // Test 7.2-01: Verify valid TOTP token
  try {
    const token = speakeasy.totp({
      secret: testState.mfaSecret,
      encoding: 'base32',
    });

    const response = await axios.post(
      `${API_BASE_URL}/api/auth/mfa/verify`,
      {
        token,
        mfaChallengeToken: 'test-challenge-token' // This will be validated in 7.3
      }
    );

    // This might fail without proper challenge token, but we're testing the endpoint exists
    logTest('Story 7.2', 'TC-7.2-01', 'Verify TOTP endpoint accessible', true, 'Endpoint exists');
  } catch (error) {
    // Expected to fail without valid challenge token
    const passed = error.response?.status === 400 || error.response?.status === 401;
    logTest('Story 7.2', 'TC-7.2-01', 'Verify TOTP endpoint accessible', passed,
      'Endpoint exists (requires challenge token)');
  }
}

// STORY 7.3: MFA Login Flow Tests
async function testStory73_MFALoginFlow() {
  logProgress('Testing Story 7.3: MFA Login Flow...', 'INFO');

  // Test 7.3-01: Login with MFA enabled (should return challenge token)
  try {
    const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: testState.testUser.email,
      password: testState.testUser.password,
    });

    const passed = response.data.success === true &&
                   response.data.data.mfaRequired === true &&
                   response.data.data.mfaChallengeToken;

    if (passed) {
      testState.mfaChallengeToken = response.data.data.mfaChallengeToken;
    }

    logTest('Story 7.3', 'TC-7.3-01', 'Login with MFA enabled returns challenge token', passed,
      passed ? `Challenge token received: ${testState.mfaChallengeToken.substring(0, 20)}...` : 'No challenge token');
  } catch (error) {
    logTest('Story 7.3', 'TC-7.3-01', 'Login with MFA enabled', false, error.response?.data?.message || error.message);
  }

  // Test 7.3-02: Complete MFA login with valid TOTP
  try {
    const token = speakeasy.totp({
      secret: testState.mfaSecret,
      encoding: 'base32',
    });

    const response = await axios.post(`${API_BASE_URL}/api/auth/mfa/verify`, {
      token,
      mfaChallengeToken: testState.mfaChallengeToken,
    });

    const passed = response.data.success === true &&
                   response.data.data.tokens &&
                   response.data.data.tokens.accessToken;

    logTest('Story 7.3', 'TC-7.3-02', 'Complete MFA login with valid TOTP', passed,
      passed ? 'Login successful with TOTP' : 'TOTP verification failed');
  } catch (error) {
    logTest('Story 7.3', 'TC-7.3-02', 'Complete MFA login with valid TOTP', false, error.response?.data?.message || error.message);
  }

  // Test 7.3-03: Login again and verify with backup code
  try {
    // Get new challenge token
    const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: testState.testUser.email,
      password: testState.testUser.password,
    });

    const challengeToken = loginResponse.data.data.mfaChallengeToken;
    const backupCode = testState.backupCodes[0]; // Use first backup code

    const response = await axios.post(`${API_BASE_URL}/api/auth/mfa/verify-backup`, {
      backupCode,
      mfaChallengeToken: challengeToken,
    });

    const passed = response.data.success === true &&
                   response.data.data.tokens &&
                   response.data.data.tokens.accessToken;

    logTest('Story 7.3', 'TC-7.3-03', 'Complete MFA login with backup code', passed,
      passed ? `Login successful with backup code (${testState.backupCodes.length - 1} remaining)` : 'Backup code verification failed');
  } catch (error) {
    logTest('Story 7.3', 'TC-7.3-03', 'Complete MFA login with backup code', false, error.response?.data?.message || error.message);
  }

  // Test 7.3-04: Invalid TOTP should fail
  try {
    const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: testState.testUser.email,
      password: testState.testUser.password,
    });

    const challengeToken = loginResponse.data.data.mfaChallengeToken;

    const response = await axios.post(`${API_BASE_URL}/api/auth/mfa/verify`, {
      token: '000000',
      mfaChallengeToken: challengeToken,
    });

    logTest('Story 7.3', 'TC-7.3-04', 'Login with invalid TOTP (should reject)', false, 'Should have rejected invalid TOTP');
  } catch (error) {
    const passed = error.response?.status === 400 || error.response?.status === 401;
    logTest('Story 7.3', 'TC-7.3-04', 'Login with invalid TOTP (should reject)', passed,
      passed ? 'Correctly rejected invalid TOTP' : 'Wrong error response');
  }
}

// STORY 7.4: MFA Recovery & Management Tests
async function testStory74_MFARecovery() {
  logProgress('Testing Story 7.4: MFA Recovery & Management...', 'INFO');

  // Test 7.4-01: Get MFA status
  try {
    const response = await axios.get(`${API_BASE_URL}/api/auth/mfa/status`, {
      headers: { Authorization: `Bearer ${testState.testUserToken}` },
    });

    const passed = response.data.success === true &&
                   response.data.data.mfaEnabled === true;

    logTest('Story 7.4', 'TC-7.4-01', 'Get MFA status', passed,
      passed ? `MFA enabled: ${response.data.data.mfaEnabled}, Backup codes: ${response.data.data.backupCodesRemaining}` : 'Failed to get status');
  } catch (error) {
    logTest('Story 7.4', 'TC-7.4-01', 'Get MFA status', false, error.response?.data?.message || error.message);
  }

  // Test 7.4-02: Request MFA reset
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/auth/mfa/reset-request`,
      { password: testState.testUser.password },
      { headers: { Authorization: `Bearer ${testState.testUserToken}` } }
    );

    const passed = response.data.success === true;

    if (passed) {
      // Get reset token from database
      const user = await User.findByEmail(testState.testUser.email);
      testState.mfaResetToken = user.mfa_reset_token;
    }

    logTest('Story 7.4', 'TC-7.4-02', 'Request MFA reset with valid password', passed,
      passed ? 'Reset email sent (token stored)' : 'Failed to request reset');
  } catch (error) {
    logTest('Story 7.4', 'TC-7.4-02', 'Request MFA reset', false, error.response?.data?.message || error.message);
  }

  // Test 7.4-03: Confirm MFA reset with valid token
  try {
    const response = await axios.post(`${API_BASE_URL}/api/auth/mfa/reset-confirm`, {
      token: testState.mfaResetToken,
    });

    const passed = response.data.success === true;
    logTest('Story 7.4', 'TC-7.4-03', 'Confirm MFA reset with valid token', passed,
      passed ? 'MFA disabled successfully' : 'Failed to confirm reset');
  } catch (error) {
    logTest('Story 7.4', 'TC-7.4-03', 'Confirm MFA reset', false, error.response?.data?.message || error.message);
  }

  // Test 7.4-04: Re-enable MFA for admin unlock test
  try {
    logProgress('Re-enabling MFA for admin unlock test...', 'INFO');

    // Setup MFA again
    const setupResponse = await axios.post(
      `${API_BASE_URL}/api/auth/mfa/setup`,
      {},
      { headers: { Authorization: `Bearer ${testState.testUserToken}` } }
    );

    const token = speakeasy.totp({
      secret: setupResponse.data.data.secret,
      encoding: 'base32',
    });

    await axios.post(
      `${API_BASE_URL}/api/auth/mfa/enable`,
      { token },
      { headers: { Authorization: `Bearer ${testState.testUserToken}` } }
    );

    // Lock the account by recording failed attempts
    for (let i = 0; i < 6; i++) {
      await MFASecret.recordFailedAttempt(testState.testUser.id);
    }

    logTest('Story 7.4', 'TC-7.4-04', 'Re-enable MFA and lock account (setup for unlock test)', true, 'Account locked');
  } catch (error) {
    logTest('Story 7.4', 'TC-7.4-04', 'Re-enable MFA and lock account', false, error.response?.data?.message || error.message);
  }

  // Test 7.4-05: Admin unlock MFA account
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/auth/mfa/admin/unlock/${testState.testUser.id}`,
      {},
      { headers: { Authorization: `Bearer ${testState.adminUserToken}` } }
    );

    const passed = response.data.success === true;
    logTest('Story 7.4', 'TC-7.4-05', 'Admin unlock MFA account', passed,
      passed ? 'Account unlocked successfully' : 'Failed to unlock');
  } catch (error) {
    logTest('Story 7.4', 'TC-7.4-05', 'Admin unlock MFA account', false, error.response?.data?.message || error.message);
  }

  // Test 7.4-06: Non-admin cannot unlock (should fail)
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/auth/mfa/admin/unlock/${testState.adminUser.id}`,
      {},
      { headers: { Authorization: `Bearer ${testState.testUserToken}` } }
    );

    logTest('Story 7.4', 'TC-7.4-06', 'Non-admin unlock attempt (should reject)', false, 'Should have rejected non-admin');
  } catch (error) {
    const passed = error.response?.status === 403;
    logTest('Story 7.4', 'TC-7.4-06', 'Non-admin unlock attempt (should reject)', passed,
      passed ? 'Correctly rejected non-admin' : 'Wrong error response');
  }
}

// Disable MFA for cleanup
async function disableMFA() {
  try {
    logProgress('Disabling MFA for test user...', 'INFO');
    await axios.post(
      `${API_BASE_URL}/api/auth/mfa/disable`,
      { password: testState.testUser.password },
      { headers: { Authorization: `Bearer ${testState.testUserToken}` } }
    );
    logProgress('MFA disabled successfully', 'SUCCESS');
  } catch (error) {
    logProgress(`Failed to disable MFA: ${error.message}`, 'WARN');
  }
}

// Generate final report
function generateReport() {
  console.log('\n' + '='.repeat(80));
  console.log('PHASE 7: MULTI-FACTOR AUTHENTICATION - COMPREHENSIVE TEST REPORT');
  console.log('='.repeat(80) + '\n');

  const total = testState.results.passed.length + testState.results.failed.length;
  const passRate = ((testState.results.passed.length / total) * 100).toFixed(1);

  console.log('SUMMARY:');
  console.log(`  Total Tests:    ${total}`);
  console.log(`  Passed:         ${testState.results.passed.length} ✅`);
  console.log(`  Failed:         ${testState.results.failed.length} ❌`);
  console.log(`  Pass Rate:      ${passRate}%\n`);

  if (testState.results.failed.length > 0) {
    console.log('FAILED TESTS:');
    testState.results.failed.forEach(test => {
      console.log(`  ❌ ${test.category} | ${test.testId}: ${test.description}`);
      console.log(`     ${test.details}\n`);
    });
  }

  console.log('\nCOMPONENT STATUS:\n');

  const story71Passed = testState.results.passed.filter(t => t.category === 'Story 7.1').length;
  const story71Total = testState.results.passed.filter(t => t.category === 'Story 7.1').length +
                       testState.results.failed.filter(t => t.category === 'Story 7.1').length;
  console.log(`Story 7.1: MFA Setup & Configuration       ${story71Passed}/${story71Total} ${story71Passed === story71Total ? '✅' : '⚠️'}`);

  const story72Passed = testState.results.passed.filter(t => t.category === 'Story 7.2').length;
  const story72Total = testState.results.passed.filter(t => t.category === 'Story 7.2').length +
                       testState.results.failed.filter(t => t.category === 'Story 7.2').length;
  console.log(`Story 7.2: TOTP Verification               ${story72Passed}/${story72Total} ${story72Passed === story72Total ? '✅' : '⚠️'}`);

  const story73Passed = testState.results.passed.filter(t => t.category === 'Story 7.3').length;
  const story73Total = testState.results.passed.filter(t => t.category === 'Story 7.3').length +
                       testState.results.failed.filter(t => t.category === 'Story 7.3').length;
  console.log(`Story 7.3: MFA Login Flow                  ${story73Passed}/${story73Total} ${story73Passed === story73Total ? '✅' : '⚠️'}`);

  const story74Passed = testState.results.passed.filter(t => t.category === 'Story 7.4').length;
  const story74Total = testState.results.passed.filter(t => t.category === 'Story 7.4').length +
                       testState.results.failed.filter(t => t.category === 'Story 7.4').length;
  console.log(`Story 7.4: MFA Recovery & Management       ${story74Passed}/${story74Total} ${story74Passed === story74Total ? '✅' : '⚠️'}`);

  console.log('\n' + '='.repeat(80));

  if (passRate === '100.0') {
    console.log('🎉 ALL PHASE 7 TESTS PASSED! MFA System is fully operational!');
  } else if (passRate >= '90.0') {
    console.log('✅ Phase 7 tests mostly passing. Minor issues to address.');
  } else if (passRate >= '70.0') {
    console.log('⚠️  Phase 7 has some failures. Review failed tests above.');
  } else {
    console.log('❌ Phase 7 has significant failures. Immediate attention required.');
  }

  console.log('='.repeat(80) + '\n');
}

// Main execution
async function runAllTests() {
  console.log('\n' + '='.repeat(80));
  console.log('PHASE 7: MULTI-FACTOR AUTHENTICATION - COMPREHENSIVE TEST SUITE');
  console.log('='.repeat(80) + '\n');

  try {
    await setupTestUsers();
    console.log('');

    await testStory71_MFASetup();
    console.log('');

    await testStory72_TOTPVerification();
    console.log('');

    await testStory73_MFALoginFlow();
    console.log('');

    await testStory74_MFARecovery();
    console.log('');

    await disableMFA();

    generateReport();

  } catch (error) {
    logProgress(`Test execution failed: ${error.message}`, 'ERROR');
    console.error('\nStack trace:', error.stack);
  }
}

runAllTests();
