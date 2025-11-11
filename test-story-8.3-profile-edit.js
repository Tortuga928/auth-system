/**
 * Story 8.3: Profile Edit Page - Comprehensive Test Suite
 *
 * Tests all profile edit functionality including:
 * - Password verification requirement
 * - Username updates
 * - Email updates with verification reset
 * - First/Last name updates
 * - Validation errors
 * - Duplicate username/email handling
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000';
const TEST_USER = {
  username: 'testuser',
  email: 'testuser@example.com',
  password: 'Test123!@#'
};

let authToken = null;
let testResults = [];

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logTest(testName, status, details = '') {
  const symbol = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  const color = status === 'PASS' ? colors.green : status === 'FAIL' ? colors.red : colors.yellow;
  log(`${symbol} ${testName}`, color);
  if (details) {
    log(`   ${details}`, colors.reset);
  }
  testResults.push({ testName, status, details });
}

function logSection(title) {
  log('\n' + '═'.repeat(70), colors.cyan);
  log(` ${title}`, colors.bright + colors.cyan);
  log('═'.repeat(70), colors.cyan);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Test 1: Login and get auth token
async function test1_Login() {
  logSection('TEST 1: Authentication Setup');
  try {
    log('→ Logging in as test user...', colors.blue);
    const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: TEST_USER.email,
      password: TEST_USER.password,
    });

    authToken = response.data.data.tokens.accessToken;

    if (authToken) {
      logTest('Test 1.1: User Login', 'PASS', `Token obtained: ${authToken.substring(0, 20)}...`);
      return true;
    } else {
      logTest('Test 1.1: User Login', 'FAIL', 'No token received');
      return false;
    }
  } catch (error) {
    logTest('Test 1.1: User Login', 'FAIL', error.response?.data?.error || error.message);
    return false;
  }
}

// Test 2: Get current profile data
async function test2_GetProfile() {
  logSection('TEST 2: Get Profile Data');
  try {
    log('→ Fetching current profile...', colors.blue);
    const response = await axios.get(`${API_BASE_URL}/api/user/profile`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    const user = response.data.data.user;

    if (user && user.username && user.email) {
      logTest('Test 2.1: Get Profile', 'PASS',
        `Username: ${user.username}, Email: ${user.email}, First: ${user.first_name || 'null'}, Last: ${user.last_name || 'null'}`
      );
      return user;
    } else {
      logTest('Test 2.1: Get Profile', 'FAIL', 'Invalid profile data structure');
      return null;
    }
  } catch (error) {
    logTest('Test 2.1: Get Profile', 'FAIL', error.response?.data?.error || error.message);
    return null;
  }
}

// Test 3: Update username only
async function test3_UpdateUsername() {
  logSection('TEST 3: Update Username');
  const newUsername = `testuser_${Date.now()}`;

  try {
    log(`→ Updating username to: ${newUsername}`, colors.blue);
    const response = await axios.put(`${API_BASE_URL}/api/user/profile`, {
      username: newUsername,
      password: TEST_USER.password,
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    const updatedUser = response.data.data.user;

    if (updatedUser.username === newUsername) {
      logTest('Test 3.1: Update Username', 'PASS', `Username changed to: ${newUsername}`);
      TEST_USER.username = newUsername; // Update for future tests
      return true;
    } else {
      logTest('Test 3.1: Update Username', 'FAIL', 'Username not updated in response');
      return false;
    }
  } catch (error) {
    logTest('Test 3.1: Update Username', 'FAIL', error.response?.data?.error || error.message);
    return false;
  }
}

// Test 4: Update first and last name
async function test4_UpdateNames() {
  logSection('TEST 4: Update First and Last Name');

  try {
    log('→ Updating first and last names...', colors.blue);
    const response = await axios.put(`${API_BASE_URL}/api/user/profile`, {
      first_name: 'Integration',
      last_name: 'Tester',
      password: TEST_USER.password,
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    const updatedUser = response.data.data.user;

    if (updatedUser.first_name === 'Integration' && updatedUser.last_name === 'Tester') {
      logTest('Test 4.1: Update First/Last Name', 'PASS', 'Names: Integration Tester');
      return true;
    } else {
      logTest('Test 4.1: Update First/Last Name', 'FAIL', 'Names not updated correctly');
      return false;
    }
  } catch (error) {
    logTest('Test 4.1: Update First/Last Name', 'FAIL', error.response?.data?.error || error.message);
    return false;
  }
}

// Test 5: Wrong password validation
async function test5_WrongPassword() {
  logSection('TEST 5: Password Verification');

  try {
    log('→ Attempting update with wrong password...', colors.blue);
    await axios.put(`${API_BASE_URL}/api/user/profile`, {
      username: 'shouldnotwork',
      password: 'WrongPassword123!',
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    logTest('Test 5.1: Wrong Password Rejected', 'FAIL', 'Request succeeded when it should have failed');
    return false;
  } catch (error) {
    if (error.response?.status === 401 && error.response?.data?.error === 'Invalid password') {
      logTest('Test 5.1: Wrong Password Rejected', 'PASS', '401 - Invalid password');
      return true;
    } else {
      logTest('Test 5.1: Wrong Password Rejected', 'FAIL',
        `Unexpected error: ${error.response?.data?.error || error.message}`
      );
      return false;
    }
  }
}

// Test 6: Missing password validation
async function test6_MissingPassword() {
  logSection('TEST 6: Missing Password Validation');

  try {
    log('→ Attempting update without password...', colors.blue);
    await axios.put(`${API_BASE_URL}/api/user/profile`, {
      username: 'shouldnotwork',
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    logTest('Test 6.1: Missing Password Rejected', 'FAIL', 'Request succeeded when it should have failed');
    return false;
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.error.includes('Password is required')) {
      logTest('Test 6.1: Missing Password Rejected', 'PASS', '400 - Password is required');
      return true;
    } else {
      logTest('Test 6.1: Missing Password Rejected', 'FAIL',
        `Unexpected error: ${error.response?.data?.error || error.message}`
      );
      return false;
    }
  }
}

// Test 7: Invalid username validation
async function test7_InvalidUsername() {
  logSection('TEST 7: Username Validation');

  // Test 7a: Too short
  try {
    log('→ Testing username too short (2 chars)...', colors.blue);
    await axios.put(`${API_BASE_URL}/api/user/profile`, {
      username: 'ab',
      password: TEST_USER.password,
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    logTest('Test 7.1: Short Username Rejected', 'FAIL', 'Request succeeded when it should have failed');
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.error.includes('3-30 characters')) {
      logTest('Test 7.1: Short Username Rejected', 'PASS', '400 - Username too short');
    } else {
      logTest('Test 7.1: Short Username Rejected', 'FAIL',
        `Unexpected error: ${error.response?.data?.error || error.message}`
      );
    }
  }

  // Test 7b: Invalid characters
  try {
    log('→ Testing username with invalid characters...', colors.blue);
    await axios.put(`${API_BASE_URL}/api/user/profile`, {
      username: 'test@user!',
      password: TEST_USER.password,
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    logTest('Test 7.2: Invalid Characters Rejected', 'FAIL', 'Request succeeded when it should have failed');
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.error.includes('letters, numbers, and underscores')) {
      logTest('Test 7.2: Invalid Characters Rejected', 'PASS', '400 - Invalid characters');
    } else {
      logTest('Test 7.2: Invalid Characters Rejected', 'FAIL',
        `Unexpected error: ${error.response?.data?.error || error.message}`
      );
    }
  }
}

// Test 8: Invalid email validation
async function test8_InvalidEmail() {
  logSection('TEST 8: Email Validation');

  try {
    log('→ Testing invalid email format...', colors.blue);
    await axios.put(`${API_BASE_URL}/api/user/profile`, {
      email: 'notanemail',
      password: TEST_USER.password,
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    logTest('Test 8.1: Invalid Email Rejected', 'FAIL', 'Request succeeded when it should have failed');
    return false;
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.error.includes('Invalid email format')) {
      logTest('Test 8.1: Invalid Email Rejected', 'PASS', '400 - Invalid email format');
      return true;
    } else {
      logTest('Test 8.1: Invalid Email Rejected', 'FAIL',
        `Unexpected error: ${error.response?.data?.error || error.message}`
      );
      return false;
    }
  }
}

// Test 9: Email change with verification reset
async function test9_EmailChange() {
  logSection('TEST 9: Email Change with Verification Reset');
  const newEmail = `testuser_${Date.now()}@example.com`;

  try {
    log(`→ Changing email to: ${newEmail}`, colors.blue);
    const response = await axios.put(`${API_BASE_URL}/api/user/profile`, {
      email: newEmail,
      password: TEST_USER.password,
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    const updatedUser = response.data.data.user;
    const emailChanged = response.data.data.emailChanged;

    if (updatedUser.email === newEmail && emailChanged === true && updatedUser.emailVerified === false) {
      logTest('Test 9.1: Email Change', 'PASS',
        `Email: ${newEmail}, Verified: false, emailChanged: true`
      );
      TEST_USER.email = newEmail; // Update for future tests
      return true;
    } else {
      logTest('Test 9.1: Email Change', 'FAIL',
        `Email: ${updatedUser.email}, Verified: ${updatedUser.emailVerified}, emailChanged: ${emailChanged}`
      );
      return false;
    }
  } catch (error) {
    logTest('Test 9.1: Email Change', 'FAIL', error.response?.data?.error || error.message);
    return false;
  }
}

// Test 10: Duplicate username check (requires second user)
async function test10_DuplicateUsername() {
  logSection('TEST 10: Duplicate Username Detection');

  // First, create a second test user
  const secondUser = {
    username: `duplicate_test_${Date.now()}`,
    email: `duplicate_${Date.now()}@example.com`,
    password: 'Test123!@#',
    confirmPassword: 'Test123!@#'
  };

  try {
    log('→ Creating second test user...', colors.blue);
    await axios.post(`${API_BASE_URL}/api/auth/register`, secondUser);
    log(`   Second user created: ${secondUser.username}`, colors.blue);

    // Now try to change our user's username to the duplicate
    log(`→ Attempting to use duplicate username: ${secondUser.username}`, colors.blue);
    await axios.put(`${API_BASE_URL}/api/user/profile`, {
      username: secondUser.username,
      password: TEST_USER.password,
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    logTest('Test 10.1: Duplicate Username Rejected', 'FAIL', 'Request succeeded when it should have failed');
    return false;
  } catch (error) {
    if (error.response?.status === 409 && error.response?.data?.error === 'Username already exists') {
      logTest('Test 10.1: Duplicate Username Rejected', 'PASS', '409 - Username already exists');
      return true;
    } else {
      logTest('Test 10.1: Duplicate Username Rejected', 'FAIL',
        `Unexpected error: ${error.response?.data?.error || error.message}`
      );
      return false;
    }
  }
}

// Test 11: Update all fields at once
async function test11_UpdateAllFields() {
  logSection('TEST 11: Update All Fields Simultaneously');
  const timestamp = Date.now();
  const allFieldsUpdate = {
    username: `allfields_${timestamp}`,
    email: `allfields_${timestamp}@example.com`,
    first_name: 'AllFields',
    last_name: 'Test',
    password: TEST_USER.password,
  };

  try {
    log('→ Updating all fields at once...', colors.blue);
    const response = await axios.put(`${API_BASE_URL}/api/user/profile`, allFieldsUpdate, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    const updatedUser = response.data.data.user;

    const allMatch =
      updatedUser.username === allFieldsUpdate.username &&
      updatedUser.email === allFieldsUpdate.email &&
      updatedUser.first_name === allFieldsUpdate.first_name &&
      updatedUser.last_name === allFieldsUpdate.last_name;

    if (allMatch) {
      logTest('Test 11.1: Update All Fields', 'PASS',
        `Username: ${updatedUser.username}, Email: ${updatedUser.email}, Name: ${updatedUser.first_name} ${updatedUser.last_name}`
      );
      TEST_USER.username = allFieldsUpdate.username;
      TEST_USER.email = allFieldsUpdate.email;
      return true;
    } else {
      logTest('Test 11.1: Update All Fields', 'FAIL', 'Not all fields updated correctly');
      return false;
    }
  } catch (error) {
    logTest('Test 11.1: Update All Fields', 'FAIL', error.response?.data?.error || error.message);
    return false;
  }
}

// Test 12: Activity logging verification
async function test12_ActivityLogging() {
  logSection('TEST 12: Activity Logging');

  try {
    log('→ Fetching activity logs...', colors.blue);
    const response = await axios.get(`${API_BASE_URL}/api/user/activity?limit=10`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    const logs = response.data.data.logs;
    const profileUpdateLogs = logs.filter(log => log.action === 'profile_updated');

    if (profileUpdateLogs.length > 0) {
      logTest('Test 12.1: Activity Logging', 'PASS',
        `Found ${profileUpdateLogs.length} profile_updated log entries`
      );
      return true;
    } else {
      logTest('Test 12.1: Activity Logging', 'FAIL', 'No profile_updated logs found');
      return false;
    }
  } catch (error) {
    logTest('Test 12.1: Activity Logging', 'FAIL', error.response?.data?.error || error.message);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  log('\n╔════════════════════════════════════════════════════════════════════╗', colors.bright + colors.cyan);
  log('║  Story 8.3: Profile Edit Page - Comprehensive Test Suite          ║', colors.bright + colors.cyan);
  log('╚════════════════════════════════════════════════════════════════════╝\n', colors.bright + colors.cyan);

  const startTime = Date.now();

  // Run all tests sequentially
  const test1Result = await test1_Login();
  if (!test1Result) {
    log('\n❌ Cannot proceed without authentication. Stopping tests.', colors.red);
    return;
  }

  await sleep(500);
  await test2_GetProfile();

  await sleep(500);
  await test3_UpdateUsername();

  await sleep(500);
  await test4_UpdateNames();

  await sleep(500);
  await test5_WrongPassword();

  await sleep(500);
  await test6_MissingPassword();

  await sleep(500);
  await test7_InvalidUsername();

  await sleep(500);
  await test8_InvalidEmail();

  await sleep(500);
  await test9_EmailChange();

  await sleep(500);
  await test10_DuplicateUsername();

  await sleep(500);
  await test11_UpdateAllFields();

  await sleep(500);
  await test12_ActivityLogging();

  // Generate final report
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  logSection('FINAL TEST REPORT');

  const passCount = testResults.filter(t => t.status === 'PASS').length;
  const failCount = testResults.filter(t => t.status === 'FAIL').length;
  const warnCount = testResults.filter(t => t.status === 'WARN').length;
  const totalTests = testResults.length;
  const passRate = ((passCount / totalTests) * 100).toFixed(1);

  log(`\n📊 Test Statistics:`, colors.bright);
  log(`   Total Tests:    ${totalTests}`, colors.bright);
  log(`   ✅ Passed:      ${passCount}`, colors.green);
  log(`   ❌ Failed:      ${failCount}`, failCount > 0 ? colors.red : colors.green);
  log(`   ⚠️  Warnings:    ${warnCount}`, colors.yellow);
  log(`   📈 Pass Rate:   ${passRate}%`, passRate >= 90 ? colors.green : colors.yellow);
  log(`   ⏱️  Duration:    ${duration}s`, colors.blue);

  log('\n📋 Detailed Results:', colors.bright);
  testResults.forEach((result, index) => {
    const symbol = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
    const color = result.status === 'PASS' ? colors.green : result.status === 'FAIL' ? colors.red : colors.yellow;
    log(`   ${index + 1}. ${symbol} ${result.testName}`, color);
    if (result.details) {
      log(`      ${result.details}`, colors.reset);
    }
  });

  log('\n' + '═'.repeat(70), colors.cyan);

  if (failCount === 0) {
    log('🎉 ALL TESTS PASSED! Story 8.3 is ready for commit.', colors.bright + colors.green);
  } else {
    log(`⚠️  ${failCount} TEST(S) FAILED. Please review and fix before committing.`, colors.bright + colors.red);
  }

  log('═'.repeat(70) + '\n', colors.cyan);
}

// Run tests
runAllTests().catch(error => {
  console.error('❌ Test suite crashed:', error);
  process.exit(1);
});
