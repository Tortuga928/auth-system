/**
 * Story 8.5: Account Settings - Integration Tests
 *
 * Tests:
 * 1. Password change validation
 * 2. Password change with correct credentials
 * 3. Password change with incorrect current password
 * 4. Password change with weak new password
 * 5. Password change with same password
 * 6. Account deletion validation
 * 7. Account deletion with correct password
 * 8. Account deletion with incorrect password
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000';

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  tests: [],
};

function logTest(name, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${name}`);
  if (details) console.log(`   ${details}`);

  results.tests.push({ name, passed, details });
  if (passed) results.passed++;
  else results.failed++;
}

// Helper to register a new user
async function register(userData) {
  try {
    const response = await axios.post(`${API_URL}/api/auth/register`, userData);
    return response.data;
  } catch (error) {
    throw new Error(`Registration failed: ${error.response?.data?.error || error.message}`);
  }
}

// Helper to login and get token
async function login(email, password) {
  try {
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      email,
      password,
    });

    if (response.data.data.mfaRequired) {
      throw new Error('MFA is enabled - use account without MFA');
    }

    return response.data.data.tokens.accessToken;
  } catch (error) {
    throw new Error(`Login failed: ${error.response?.data?.error || error.message}`);
  }
}

// Helper to make authenticated requests
function authenticatedRequest(token) {
  return axios.create({
    baseURL: API_URL,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

async function runTests() {
  console.log('='.repeat(60));
  console.log('Story 8.5: Account Settings - Integration Tests');
  console.log('='.repeat(60));
  console.log();

  let token;
  let api;
  const testPassword = 'Test123!@&';  // Only use allowed special chars
  const newPassword = 'NewPass456!@&';  // Only use allowed special chars

  // Create two test users - one for password change, one for deletion
  const timestamp = Date.now();
  const passwordTestUser = {
    username: `pwdtest${timestamp}`,
    email: `pwdtest${timestamp}@example.com`,
    password: testPassword,
  };

  const deleteTestUser = {
    username: `deltest${timestamp}`,
    email: `deltest${timestamp}@example.com`,
    password: testPassword,
  };

  try {
    // Setup: Register test users
    console.log('Setup: Creating test users...');
    try {
      await register(passwordTestUser);
      await register(deleteTestUser);
      logTest('0.1 Test users created', true, 'Created password and delete test users');
    } catch (error) {
      logTest('0.1 Test users created', false, error.message);
      return;
    }

    // ========================================
    // PASSWORD CHANGE TESTS
    // ========================================

    console.log('\n' + '='.repeat(60));
    console.log('PASSWORD CHANGE TESTS');
    console.log('='.repeat(60));

    // Login as password test user
    console.log('\nTest 1: Login as password test user');
    try {
      token = await login(passwordTestUser.email, passwordTestUser.password);
      api = authenticatedRequest(token);
      logTest('1.1 Login successful', true, 'Got access token');
    } catch (error) {
      logTest('1.1 Login successful', false, error.message);
      return;
    }

    // Test 2: Validation - Missing fields
    console.log('\nTest 2: Password change validation');
    try {
      await api.post('/api/user/change-password', {
        currentPassword: testPassword,
        // Missing newPassword
      });
      logTest('2.1 Reject missing new password', false, 'Should have returned 400');
    } catch (error) {
      const is400 = error.response?.status === 400;
      logTest('2.1 Reject missing new password', is400,
              `Status ${error.response?.status}: ${error.response?.data?.error}`);
    }

    // Test 3: Weak password rejection
    console.log('\nTest 3: Password strength validation');
    try {
      await api.post('/api/user/change-password', {
        currentPassword: testPassword,
        newPassword: 'weak',
      });
      logTest('3.1 Reject weak password', false, 'Should have returned 400');
    } catch (error) {
      const is400 = error.response?.status === 400;
      const hasStrengthError = error.response?.data?.error?.includes('8 characters');
      logTest('3.1 Reject weak password', is400 && hasStrengthError,
              `Status ${error.response?.status}`);
    }

    // Test 4: Same password rejection
    console.log('\nTest 4: Same password validation');
    try {
      await api.post('/api/user/change-password', {
        currentPassword: testPassword,
        newPassword: testPassword,
      });
      logTest('4.1 Reject same password', false, 'Should have returned 400');
    } catch (error) {
      const is400 = error.response?.status === 400;
      const hasSameError = error.response?.data?.error?.toLowerCase().includes('different');
      logTest('4.1 Reject same password', is400 && hasSameError,
              `Status ${error.response?.status}: ${error.response?.data?.error}`);
    }

    // Test 5: Wrong current password
    console.log('\nTest 5: Wrong current password');
    try {
      await api.post('/api/user/change-password', {
        currentPassword: 'WrongPass123!@&',
        newPassword: newPassword,
      });
      logTest('5.1 Reject wrong current password', false, 'Should have returned 401');
    } catch (error) {
      const is401 = error.response?.status === 401;
      const hasIncorrectError = error.response?.data?.error?.toLowerCase().includes('incorrect');
      logTest('5.1 Reject wrong current password', is401 && hasIncorrectError,
              `Status ${error.response?.status}: ${error.response?.data?.error}`);
    }

    // Test 6: Successful password change
    console.log('\nTest 6: Successful password change');
    try {
      const response = await api.post('/api/user/change-password', {
        currentPassword: testPassword,
        newPassword: newPassword,
      });

      const isSuccess = response.data.success === true;
      const hasMessage = response.data.message?.includes('successfully');

      logTest('6.1 Password changed successfully', isSuccess && hasMessage,
              response.data.message);

      // Try logging in with new password
      const newToken = await login(passwordTestUser.email, newPassword);
      logTest('6.2 Can login with new password', !!newToken,
              'Successfully logged in with new password');

      // Try logging in with old password (should fail)
      try {
        await login(passwordTestUser.email, testPassword);
        logTest('6.3 Old password no longer works', false,
                'Should not be able to login with old password');
      } catch (error) {
        logTest('6.3 Old password no longer works', true,
                'Correctly rejected old password');
      }

    } catch (error) {
      logTest('6.1 Password changed successfully', false,
              error.response?.data?.error || error.message);
      logTest('6.2 Can login with new password', false, 'Skipped');
      logTest('6.3 Old password no longer works', false, 'Skipped');
    }

    // ========================================
    // ACCOUNT DELETION TESTS
    // ========================================

    console.log('\n' + '='.repeat(60));
    console.log('ACCOUNT DELETION TESTS');
    console.log('='.repeat(60));

    // Login as delete test user
    console.log('\nTest 7: Login as delete test user');
    try {
      token = await login(deleteTestUser.email, deleteTestUser.password);
      api = authenticatedRequest(token);
      logTest('7.1 Login successful', true, 'Got access token');
    } catch (error) {
      logTest('7.1 Login successful', false, error.message);
      return;
    }

    // Test 8: Deletion validation - Missing password
    console.log('\nTest 8: Account deletion validation');
    try {
      await api.delete('/api/user/account', {
        data: {},
      });
      logTest('8.1 Reject missing password', false, 'Should have returned 400');
    } catch (error) {
      const is400 = error.response?.status === 400;
      logTest('8.1 Reject missing password', is400,
              `Status ${error.response?.status}: ${error.response?.data?.error}`);
    }

    // Test 9: Wrong password for deletion
    console.log('\nTest 9: Wrong password for deletion');
    try {
      await api.delete('/api/user/account', {
        data: { password: 'WrongPass123!@#' },
      });
      logTest('9.1 Reject wrong password', false, 'Should have returned 401');
    } catch (error) {
      const is401 = error.response?.status === 401;
      logTest('9.1 Reject wrong password', is401,
              `Status ${error.response?.status}`);
    }

    // Test 10: Successful account deletion
    console.log('\nTest 10: Successful account deletion');
    try {
      const response = await api.delete('/api/user/account', {
        data: { password: deleteTestUser.password },
      });

      const isSuccess = response.data.success === true;
      const hasMessage = response.data.message?.includes('deleted');

      logTest('10.1 Account deleted successfully', isSuccess && hasMessage,
              response.data.message);

      // Try logging in (should fail - user deleted)
      try {
        await login(deleteTestUser.email, deleteTestUser.password);
        logTest('10.2 Cannot login after deletion', false,
                'Should not be able to login after deletion');
      } catch (error) {
        logTest('10.2 Cannot login after deletion', true,
                'Correctly rejected login for deleted user');
      }

      // Try accessing protected route with old token (should fail)
      try {
        await api.get('/api/user/profile');
        logTest('10.3 Old token invalid after deletion', false,
                'Should not work with deleted user token');
      } catch (error) {
        const is401 = error.response?.status === 401;
        logTest('10.3 Old token invalid after deletion', is401,
                'Token correctly invalidated');
      }

    } catch (error) {
      logTest('10.1 Account deleted successfully', false,
              error.response?.data?.error || error.message);
      logTest('10.2 Cannot login after deletion', false, 'Skipped');
      logTest('10.3 Old token invalid after deletion', false, 'Skipped');
    }

  } catch (error) {
    console.error('\n❌ Unexpected error:', error.message);
  }

  // Final report
  console.log('\n' + '='.repeat(60));
  console.log('Test Summary');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${results.passed + results.failed}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
  console.log('='.repeat(60));

  if (results.failed > 0) {
    console.log('\nFailed Tests:');
    results.tests
      .filter(t => !t.passed)
      .forEach(t => console.log(`  - ${t.name}: ${t.details}`));
  }

  console.log('\n✅ Story 8.5 testing complete!');
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
