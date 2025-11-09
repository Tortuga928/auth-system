/**
 * Checkpoint 1 - MFA UI Backend Integration Test
 *
 * Tests all backend endpoints that the frontend components use:
 * - useMFA hook API calls
 * - MFA status fetching
 * - Backup codes regeneration
 * - MFA enable/disable flows
 */

require('dotenv').config();
const axios = require('axios');
const speakeasy = require('speakeasy');

const API_BASE_URL = process.env.API_URL || 'http://localhost:5000';

// Test state
const testState = {
  user: null,
  authToken: null,
  mfaSecret: null,
  backupCodes: [],
  mfaChallengeToken: null,
  results: {
    passed: [],
    failed: [],
  },
};

// Helper: Log with timestamp and emoji
function log(message, type = 'info') {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  const emoji = {
    info: 'ℹ️',
    success: '✅',
    error: '❌',
    warning: '⚠️',
    test: '🧪',
    progress: '⏳',
  }[type] || 'ℹ️';

  console.log(`[${timestamp}] ${emoji}  ${message}`);
}

// Helper: Log test result
function logTest(testId, description, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`\n${testId}: ${description}`);
  console.log(`${status}${details ? ' - ' + details : ''}`);

  if (passed) {
    testState.results.passed.push({ testId, description });
  } else {
    testState.results.failed.push({ testId, description, details });
  }
}

// Setup: Create test user and login
async function setupTestUser() {
  log('Setting up test user...', 'progress');

  try {
    const testEmail = `checkpoint1-test-${Date.now()}@example.com`;
    const testPassword = 'Test123!@#Checkpoint1';

    // Register user
    const registerResponse = await axios.post(`${API_BASE_URL}/api/auth/register`, {
      username: `checkpoint1user${Date.now()}`,
      email: testEmail,
      password: testPassword,
    });

    testState.user = {
      id: registerResponse.data.data.user.id,
      email: testEmail,
      password: testPassword,
    };

    // Login to get token
    const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: testEmail,
      password: testPassword,
    });

    testState.authToken = loginResponse.data.data.tokens.accessToken;

    log(`✅ Test user created: ${testEmail}`, 'success');
    return true;
  } catch (error) {
    log(`❌ Failed to create test user: ${error.message}`, 'error');
    return false;
  }
}

// Test 1: Fetch MFA Status (useMFA hook - initial load)
async function test1_FetchMFAStatus() {
  log('\n📋 TEST 1: Fetch MFA Status (GET /api/auth/mfa/status)', 'test');

  try {
    const response = await axios.get(`${API_BASE_URL}/api/auth/mfa/status`, {
      headers: { Authorization: `Bearer ${testState.authToken}` },
    });

    const passed = response.data.success === true &&
                   response.data.data.mfaEnabled === false &&
                   response.data.data.backupCodesRemaining === 0;

    logTest(
      'CP1-TEST-01',
      'Fetch MFA status for new user',
      passed,
      passed ? 'MFA disabled, 0 backup codes' : 'Unexpected response structure'
    );

    return passed;
  } catch (error) {
    logTest('CP1-TEST-01', 'Fetch MFA status', false, error.response?.data?.message || error.message);
    return false;
  }
}

// Test 2: Setup MFA (Generate Secret & QR Code)
async function test2_SetupMFA() {
  log('\n📋 TEST 2: Setup MFA (POST /api/auth/mfa/setup)', 'test');

  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/auth/mfa/setup`,
      {},
      { headers: { Authorization: `Bearer ${testState.authToken}` } }
    );

    const passed = response.data.success === true &&
                   response.data.data.secret &&
                   response.data.data.qrCode &&
                   response.data.data.backupCodes &&
                   response.data.data.backupCodes.length === 10;

    if (passed) {
      testState.mfaSecret = response.data.data.secret;
      testState.backupCodes = response.data.data.backupCodes;
    }

    logTest(
      'CP1-TEST-02',
      'Setup MFA and generate QR code',
      passed,
      passed ? `Secret: ${testState.mfaSecret.substring(0, 10)}..., ${testState.backupCodes.length} backup codes` : 'Missing secret, QR code, or backup codes'
    );

    return passed;
  } catch (error) {
    logTest('CP1-TEST-02', 'Setup MFA', false, error.response?.data?.message || error.message);
    return false;
  }
}

// Test 3: Enable MFA (with valid TOTP)
async function test3_EnableMFA() {
  log('\n📋 TEST 3: Enable MFA (POST /api/auth/mfa/enable)', 'test');

  if (!testState.mfaSecret) {
    logTest('CP1-TEST-03', 'Enable MFA', false, 'No MFA secret from previous test');
    return false;
  }

  try {
    // Generate valid TOTP token
    const token = speakeasy.totp({
      secret: testState.mfaSecret,
      encoding: 'base32',
    });

    const response = await axios.post(
      `${API_BASE_URL}/api/auth/mfa/enable`,
      { token },
      { headers: { Authorization: `Bearer ${testState.authToken}` } }
    );

    const passed = response.data.success === true &&
                   response.data.data.enabled === true;

    logTest(
      'CP1-TEST-03',
      'Enable MFA with valid TOTP',
      passed,
      passed ? 'MFA enabled successfully' : 'Failed to enable MFA'
    );

    return passed;
  } catch (error) {
    logTest('CP1-TEST-03', 'Enable MFA', false, error.response?.data?.message || error.message);
    return false;
  }
}

// Test 4: Verify MFA Status After Enable
async function test4_VerifyMFAEnabled() {
  log('\n📋 TEST 4: Verify MFA Enabled (GET /api/auth/mfa/status)', 'test');

  try {
    const response = await axios.get(`${API_BASE_URL}/api/auth/mfa/status`, {
      headers: { Authorization: `Bearer ${testState.authToken}` },
    });

    const passed = response.data.success === true &&
                   response.data.data.mfaEnabled === true &&
                   response.data.data.backupCodesRemaining === 10;

    logTest(
      'CP1-TEST-04',
      'Verify MFA is enabled with 10 backup codes',
      passed,
      passed ? 'MFA enabled, 10 backup codes available' : 'MFA not properly enabled'
    );

    return passed;
  } catch (error) {
    logTest('CP1-TEST-04', 'Verify MFA enabled', false, error.response?.data?.message || error.message);
    return false;
  }
}

// Test 5: Regenerate Backup Codes
async function test5_RegenerateBackupCodes() {
  log('\n📋 TEST 5: Regenerate Backup Codes (POST /api/auth/mfa/backup-codes/regenerate)', 'test');

  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/auth/mfa/backup-codes/regenerate`,
      { password: testState.user.password },
      { headers: { Authorization: `Bearer ${testState.authToken}` } }
    );

    const passed = response.data.success === true &&
                   response.data.data.backupCodes &&
                   response.data.data.backupCodes.length === 10;

    if (passed) {
      const newCodes = response.data.data.backupCodes;
      const allDifferent = newCodes.every(code => !testState.backupCodes.includes(code));

      logTest(
        'CP1-TEST-05',
        'Regenerate backup codes',
        passed && allDifferent,
        `Generated 10 new codes (all different: ${allDifferent})`
      );

      testState.backupCodes = newCodes;
      return passed && allDifferent;
    }

    logTest('CP1-TEST-05', 'Regenerate backup codes', false, 'Missing backup codes in response');
    return false;
  } catch (error) {
    logTest('CP1-TEST-05', 'Regenerate backup codes', false, error.response?.data?.message || error.message);
    return false;
  }
}

// Test 6: Test Login with MFA (Returns Challenge Token)
async function test6_LoginWithMFA() {
  log('\n📋 TEST 6: Login with MFA Enabled (POST /api/auth/login)', 'test');

  try {
    const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: testState.user.email,
      password: testState.user.password,
    });

    const passed = response.data.success === true &&
                   response.data.data.mfaRequired === true &&
                   response.data.data.mfaChallengeToken;

    if (passed) {
      testState.mfaChallengeToken = response.data.data.mfaChallengeToken;
    }

    logTest(
      'CP1-TEST-06',
      'Login returns MFA challenge token',
      passed,
      passed ? `Challenge token: ${testState.mfaChallengeToken.substring(0, 20)}...` : 'No challenge token'
    );

    return passed;
  } catch (error) {
    logTest('CP1-TEST-06', 'Login with MFA', false, error.response?.data?.message || error.message);
    return false;
  }
}

// Test 7: Verify TOTP During Login
async function test7_VerifyTOTP() {
  log('\n📋 TEST 7: Verify TOTP Code (POST /api/auth/mfa/verify)', 'test');

  if (!testState.mfaChallengeToken) {
    logTest('CP1-TEST-07', 'Verify TOTP', false, 'No challenge token from previous test');
    return false;
  }

  try {
    // Generate valid TOTP token
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

    if (passed) {
      testState.authToken = response.data.data.tokens.accessToken;
    }

    logTest(
      'CP1-TEST-07',
      'Verify TOTP and receive access tokens',
      passed,
      passed ? 'TOTP verified, tokens received' : 'Token verification failed'
    );

    return passed;
  } catch (error) {
    logTest('CP1-TEST-07', 'Verify TOTP', false, error.response?.data?.message || error.message);
    return false;
  }
}

// Test 8: Verify Backup Code During Login
async function test8_VerifyBackupCode() {
  log('\n📋 TEST 8: Verify Backup Code (POST /api/auth/mfa/verify-backup)', 'test');

  // Login again to get a new challenge token
  try {
    const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: testState.user.email,
      password: testState.user.password,
    });

    testState.mfaChallengeToken = loginResponse.data.data.mfaChallengeToken;

    // Use first backup code
    const backupCode = testState.backupCodes[0];

    const response = await axios.post(`${API_BASE_URL}/api/auth/mfa/verify-backup`, {
      backupCode,
      mfaChallengeToken: testState.mfaChallengeToken,
    });

    const passed = response.data.success === true &&
                   response.data.data.tokens &&
                   response.data.data.tokens.accessToken;

    logTest(
      'CP1-TEST-08',
      'Verify backup code and receive tokens',
      passed,
      passed ? 'Backup code verified, tokens received' : 'Backup code verification failed'
    );

    if (passed) {
      testState.authToken = response.data.data.tokens.accessToken;
    }

    return passed;
  } catch (error) {
    const errorDetail = error.response?.data?.message || error.response?.data?.error || error.message;
    console.log('Test 8 Error Details:', {
      backupCode,
      error: errorDetail,
      status: error.response?.status,
    });
    logTest('CP1-TEST-08', 'Verify backup code', false, errorDetail);
    return false;
  }
}

// Test 9: Disable MFA
async function test9_DisableMFA() {
  log('\n📋 TEST 9: Disable MFA (POST /api/auth/mfa/disable)', 'test');

  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/auth/mfa/disable`,
      { password: testState.user.password },
      { headers: { Authorization: `Bearer ${testState.authToken}` } }
    );

    const passed = response.data.success === true;

    logTest(
      'CP1-TEST-09',
      'Disable MFA with valid password',
      passed,
      passed ? 'MFA disabled successfully' : 'Failed to disable MFA'
    );

    return passed;
  } catch (error) {
    logTest('CP1-TEST-09', 'Disable MFA', false, error.response?.data?.message || error.message);
    return false;
  }
}

// Test 10: Verify MFA Disabled
async function test10_VerifyMFADisabled() {
  log('\n📋 TEST 10: Verify MFA Disabled (GET /api/auth/mfa/status)', 'test');

  try {
    const response = await axios.get(`${API_BASE_URL}/api/auth/mfa/status`, {
      headers: { Authorization: `Bearer ${testState.authToken}` },
    });

    const passed = response.data.success === true &&
                   response.data.data.mfaEnabled === false;

    logTest(
      'CP1-TEST-10',
      'Verify MFA is disabled',
      passed,
      passed ? `MFA disabled (${response.data.data.backupCodesRemaining} codes in DB)` : 'MFA still enabled'
    );

    return passed;
  } catch (error) {
    logTest('CP1-TEST-10', 'Verify MFA disabled', false, error.response?.data?.message || error.message);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('═'.repeat(80));
  console.log('🧪  CHECKPOINT 1 - MFA UI BACKEND INTEGRATION TESTS');
  console.log('═'.repeat(80));
  console.log('');
  console.log('Testing all backend endpoints used by Checkpoint 1 components:');
  console.log('- useMFA hook API calls');
  console.log('- MFASettings page functionality');
  console.log('- BackupCodesDisplay component data');
  console.log('');
  console.log('═'.repeat(80));

  // Setup
  const setupSuccess = await setupTestUser();
  if (!setupSuccess) {
    console.log('\n❌ Setup failed. Cannot continue tests.');
    process.exit(1);
  }

  console.log('');
  log('Starting tests...', 'progress');

  // Run all tests
  await test1_FetchMFAStatus();
  await test2_SetupMFA();
  await test3_EnableMFA();
  await test4_VerifyMFAEnabled();
  await test5_RegenerateBackupCodes();
  await test6_LoginWithMFA();
  await test7_VerifyTOTP();
  await test8_VerifyBackupCode();
  await test9_DisableMFA();
  await test10_VerifyMFADisabled();

  // Generate report
  console.log('\n');
  console.log('═'.repeat(80));
  console.log('📊  TEST SUMMARY');
  console.log('═'.repeat(80));
  console.log('');

  const totalTests = testState.results.passed.length + testState.results.failed.length;
  const passRate = ((testState.results.passed.length / totalTests) * 100).toFixed(1);

  console.log(`Total Tests:    ${totalTests}`);
  console.log(`Passed:         ${testState.results.passed.length} ✅`);
  console.log(`Failed:         ${testState.results.failed.length} ❌`);
  console.log(`Pass Rate:      ${passRate}%`);
  console.log('');

  if (testState.results.passed.length > 0) {
    console.log('✅ PASSED TESTS:');
    testState.results.passed.forEach(test => {
      console.log(`   ${test.testId}: ${test.description}`);
    });
    console.log('');
  }

  if (testState.results.failed.length > 0) {
    console.log('❌ FAILED TESTS:');
    testState.results.failed.forEach(test => {
      console.log(`   ${test.testId}: ${test.description}`);
      console.log(`      Reason: ${test.details}`);
    });
    console.log('');
  }

  console.log('═'.repeat(80));
  console.log('🎯  COMPONENT STATUS');
  console.log('═'.repeat(80));
  console.log('');

  // Component status based on test results
  const components = {
    'useMFA Hook - fetchMFAStatus()': ['CP1-TEST-01', 'CP1-TEST-04', 'CP1-TEST-10'],
    'useMFA Hook - setupMFA()': ['CP1-TEST-02'],
    'useMFA Hook - enableMFA()': ['CP1-TEST-03'],
    'useMFA Hook - disableMFA()': ['CP1-TEST-09'],
    'useMFA Hook - regenerateBackupCodes()': ['CP1-TEST-05'],
    'useMFA Hook - verifyTOTP()': ['CP1-TEST-07'],
    'useMFA Hook - verifyBackupCode()': ['CP1-TEST-08'],
    'MFASettings Page - Status Display': ['CP1-TEST-01', 'CP1-TEST-04'],
    'MFASettings Page - Regenerate Codes': ['CP1-TEST-05'],
    'MFASettings Page - Disable MFA': ['CP1-TEST-09'],
    'BackupCodesDisplay - Data Source': ['CP1-TEST-03', 'CP1-TEST-05'],
    'Login Flow - MFA Detection': ['CP1-TEST-06'],
  };

  Object.entries(components).forEach(([component, testIds]) => {
    const allPassed = testIds.every(id =>
      testState.results.passed.some(test => test.testId === id)
    );
    const status = allPassed ? '✅ WORKING' : '❌ ISSUES';
    console.log(`${status}  ${component}`);
  });

  console.log('');
  console.log('═'.repeat(80));
  console.log('📝  NOTES');
  console.log('═'.repeat(80));
  console.log('');
  console.log('Backend endpoints tested: All endpoints used by Checkpoint 1 components');
  console.log('Frontend components: Not directly tested (requires browser)');
  console.log('UI features tested: Data flow, API integration, state management');
  console.log('');
  console.log('Frontend manual testing still required for:');
  console.log('  - BackupCodesDisplay copy/download buttons');
  console.log('  - Modal UI and interactions');
  console.log('  - Help section FAQs');
  console.log('  - Responsive design');
  console.log('');
  console.log('═'.repeat(80));

  if (testState.results.failed.length === 0) {
    console.log('');
    console.log('🎉  ALL TESTS PASSED! Checkpoint 1 backend is fully functional.');
    console.log('');
    console.log('✅ useMFA hook functions are working correctly');
    console.log('✅ MFASettings page can fetch and update MFA status');
    console.log('✅ BackupCodesDisplay component will receive proper data');
    console.log('✅ Ready to test frontend UI in browser');
    console.log('');
  } else {
    console.log('');
    console.log('⚠️  Some tests failed. Review the failures above.');
    console.log('');
  }

  console.log('═'.repeat(80));
}

// Run tests
runTests().catch(error => {
  console.error('\n💥 Test suite crashed:', error);
  process.exit(1);
});
