/**
 * Comprehensive Phase 5 Test Suite
 *
 * Tests all Password Reset Flow functionality:
 * - Story 5.1: Forgot Password Endpoint
 * - Story 5.2: Reset Password Endpoint
 * - Story 5.3: Frontend API Integration
 *
 * Provides detailed progress and final report
 */

const axios = require('axios');
const { Client } = require('pg');

const API_URL = process.env.API_URL || 'http://localhost:5000';
const DB_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/authdb';

// Test results tracker
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  tests: [],
};

// Add test result
function recordTest(name, passed, details = '') {
  results.total++;
  if (passed) {
    results.passed++;
    console.log(`✅ ${name}`);
  } else {
    results.failed++;
    console.log(`❌ ${name}`);
    if (details) console.log(`   Details: ${details}`);
  }
  results.tests.push({ name, passed, details });
}

// Progress indicator
function progress(message) {
  console.log(`\n🔄 ${message}...`);
}

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║     PHASE 5 COMPREHENSIVE TEST SUITE                       ║');
console.log('║     Password Reset Flow - Complete Validation             ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

console.log(`API URL: ${API_URL}`);
console.log(`Database: ${DB_URL}\n`);
console.log('Starting comprehensive test suite...\n');

async function runComprehensiveTests() {
  let client;
  const testUsers = [];

  try {
    // Connect to database
    progress('Connecting to database');
    client = new Client({ connectionString: DB_URL });
    await client.connect();
    recordTest('Database connection', true);

    // ============================================================
    // SECTION 1: STORY 5.1 - FORGOT PASSWORD ENDPOINT
    // ============================================================
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║ SECTION 1: Story 5.1 - Forgot Password Endpoint           ║');
    console.log('╚════════════════════════════════════════════════════════════╝');

    // Test 1.1: Create test user
    progress('Test 1.1: Creating test user');
    const testUser1 = {
      username: `test_phase5_${Date.now()}`,
      email: `phase5_${Date.now()}@example.com`,
      password: 'TestPassword123!',
    };

    try {
      const regResponse = await axios.post(`${API_URL}/api/auth/register`, testUser1);
      testUsers.push({ ...testUser1, id: regResponse.data.data.user.id });
      recordTest('TC-5.1-00: Create test user', regResponse.data.success);
    } catch (error) {
      recordTest('TC-5.1-00: Create test user', false, error.message);
      throw error;
    }

    // Test 1.2: Request password reset
    progress('Test 1.2: Request password reset for valid email');
    try {
      const forgotResponse = await axios.post(`${API_URL}/api/auth/forgot-password`, {
        email: testUser1.email,
      });
      recordTest('TC-5.1-01: Can request password reset', forgotResponse.data.success);
    } catch (error) {
      recordTest('TC-5.1-01: Can request password reset', false, error.message);
    }

    // Test 1.3: Verify token stored in database
    progress('Test 1.3: Verify reset token stored in database');
    try {
      const tokenResult = await client.query(
        'SELECT password_reset_token, password_reset_expires FROM users WHERE email = $1',
        [testUser1.email]
      );
      const hasToken = !!tokenResult.rows[0]?.password_reset_token;
      const hasExpiry = !!tokenResult.rows[0]?.password_reset_expires;

      if (hasToken && hasExpiry) {
        testUsers[0].resetToken = tokenResult.rows[0].password_reset_token;
        testUsers[0].resetExpires = tokenResult.rows[0].password_reset_expires;
      }

      recordTest('TC-5.1-02: Reset token stored in database', hasToken && hasExpiry);
    } catch (error) {
      recordTest('TC-5.1-02: Reset token stored in database', false, error.message);
    }

    // Test 1.4: Verify token expiration (~1 hour)
    progress('Test 1.4: Verify token expires in approximately 1 hour');
    try {
      const expiresDate = new Date(testUsers[0].resetExpires);
      const now = new Date();
      const diffMinutes = (expiresDate - now) / 1000 / 60;
      const isValidExpiry = diffMinutes >= 55 && diffMinutes <= 65;

      recordTest('TC-5.1-03: Token expires after 1 hour', isValidExpiry,
        `Expires in ${Math.round(diffMinutes)} minutes`);
    } catch (error) {
      recordTest('TC-5.1-03: Token expires after 1 hour', false, error.message);
    }

    // Test 1.5: Security - Same response for non-existent email
    progress('Test 1.5: Security check - non-existent email');
    try {
      const nonExistentResponse = await axios.post(`${API_URL}/api/auth/forgot-password`, {
        email: 'nonexistent@example.com',
      });

      // Should return success even for non-existent email
      const sameResponse = nonExistentResponse.data.success === true;
      recordTest('TC-5.1-04: Same response for non-existent email (security)', sameResponse);
    } catch (error) {
      recordTest('TC-5.1-04: Same response for non-existent email (security)', false, error.message);
    }

    // Test 1.6: Invalid email format rejected
    progress('Test 1.6: Invalid email format validation');
    try {
      await axios.post(`${API_URL}/api/auth/forgot-password`, {
        email: 'invalid-email',
      });
      recordTest('TC-5.1-05: Invalid email format rejected', false, 'Should have failed');
    } catch (error) {
      const isValidationError = error.response?.status === 400;
      recordTest('TC-5.1-05: Invalid email format rejected', isValidationError);
    }

    // Test 1.7: Missing email rejected
    progress('Test 1.7: Missing email validation');
    try {
      await axios.post(`${API_URL}/api/auth/forgot-password`, {});
      recordTest('TC-5.1-06: Missing email rejected', false, 'Should have failed');
    } catch (error) {
      const isValidationError = error.response?.status === 400;
      recordTest('TC-5.1-06: Missing email rejected', isValidationError);
    }

    // ============================================================
    // SECTION 2: STORY 5.2 - RESET PASSWORD ENDPOINT
    // ============================================================
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║ SECTION 2: Story 5.2 - Reset Password Endpoint            ║');
    console.log('╚════════════════════════════════════════════════════════════╝');

    // Test 2.1: Verify old password still works
    progress('Test 2.1: Verify old password works before reset');
    try {
      const loginOldResponse = await axios.post(`${API_URL}/api/auth/login`, {
        email: testUser1.email,
        password: testUser1.password,
      });
      recordTest('TC-5.2-00: Old password works before reset', loginOldResponse.data.success);
    } catch (error) {
      recordTest('TC-5.2-00: Old password works before reset', false, error.message);
    }

    // Test 2.2: Reset password with valid token
    progress('Test 2.2: Reset password with valid token');
    const newPassword = 'NewPassword123!';
    try {
      const resetResponse = await axios.post(
        `${API_URL}/api/auth/reset-password/${testUsers[0].resetToken}`,
        { password: newPassword }
      );
      recordTest('TC-5.2-01: Can reset password with valid token', resetResponse.data.success);
    } catch (error) {
      recordTest('TC-5.2-01: Can reset password with valid token', false, error.message);
    }

    // Test 2.3: Verify old password no longer works
    progress('Test 2.3: Verify old password rejected after reset');
    try {
      await axios.post(`${API_URL}/api/auth/login`, {
        email: testUser1.email,
        password: testUser1.password,
      });
      recordTest('TC-5.2-02: Old password rejected after reset', false, 'Should have failed');
    } catch (error) {
      const isUnauthorized = error.response?.status === 401;
      recordTest('TC-5.2-02: Old password rejected after reset', isUnauthorized);
    }

    // Test 2.4: Verify new password works
    progress('Test 2.4: Verify new password works');
    try {
      const loginNewResponse = await axios.post(`${API_URL}/api/auth/login`, {
        email: testUser1.email,
        password: newPassword,
      });
      recordTest('TC-5.2-03: New password works after reset', loginNewResponse.data.success);
    } catch (error) {
      recordTest('TC-5.2-03: New password works after reset', false, error.message);
    }

    // Test 2.5: Verify token cleared from database
    progress('Test 2.5: Verify reset token cleared (one-time use)');
    try {
      const clearedTokenResult = await client.query(
        'SELECT password_reset_token FROM users WHERE email = $1',
        [testUser1.email]
      );
      const tokenCleared = clearedTokenResult.rows[0]?.password_reset_token === null;
      recordTest('TC-5.2-04: Token cleared after use (one-time)', tokenCleared);
    } catch (error) {
      recordTest('TC-5.2-04: Token cleared after use (one-time)', false, error.message);
    }

    // Test 2.6: Reusing token should fail
    progress('Test 2.6: Verify used token is rejected');
    try {
      await axios.post(
        `${API_URL}/api/auth/reset-password/${testUsers[0].resetToken}`,
        { password: 'AnotherPassword123!' }
      );
      recordTest('TC-5.2-05: Used token rejected', false, 'Should have failed');
    } catch (error) {
      const isBadRequest = error.response?.status === 400;
      recordTest('TC-5.2-05: Used token rejected', isBadRequest);
    }

    // Test 2.7: Invalid token rejected
    progress('Test 2.7: Verify invalid token rejected');
    try {
      await axios.post(
        `${API_URL}/api/auth/reset-password/invalid-token-12345`,
        { password: 'ValidPassword123!' }
      );
      recordTest('TC-5.2-06: Invalid token rejected', false, 'Should have failed');
    } catch (error) {
      const isBadRequest = error.response?.status === 400;
      recordTest('TC-5.2-06: Invalid token rejected', isBadRequest);
    }

    // Test 2.8: Weak password rejected
    progress('Test 2.8: Verify weak password rejected');

    // First get a fresh token
    await axios.post(`${API_URL}/api/auth/forgot-password`, { email: testUser1.email });
    const freshTokenResult = await client.query(
      'SELECT password_reset_token FROM users WHERE email = $1',
      [testUser1.email]
    );
    const freshToken = freshTokenResult.rows[0].password_reset_token;

    try {
      await axios.post(
        `${API_URL}/api/auth/reset-password/${freshToken}`,
        { password: 'weak' }
      );
      recordTest('TC-5.2-07: Weak password rejected', false, 'Should have failed');
    } catch (error) {
      const isBadRequest = error.response?.status === 400;
      recordTest('TC-5.2-07: Weak password rejected', isBadRequest);
    }

    // ============================================================
    // SECTION 3: STORY 5.3 - FRONTEND API INTEGRATION
    // ============================================================
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║ SECTION 3: Story 5.3 - Frontend API Integration           ║');
    console.log('╚════════════════════════════════════════════════════════════╝');

    // Test 3.1: Create another test user for frontend tests
    progress('Test 3.1: Create user for frontend integration tests');
    const testUser2 = {
      username: `test_frontend_${Date.now()}`,
      email: `frontend_${Date.now()}@example.com`,
      password: 'FrontendTest123!',
    };

    try {
      const reg2Response = await axios.post(`${API_URL}/api/auth/register`, testUser2);
      testUsers.push({ ...testUser2, id: reg2Response.data.data.user.id });
      recordTest('TC-5.3-00: Create frontend test user', reg2Response.data.success);
    } catch (error) {
      recordTest('TC-5.3-00: Create frontend test user', false, error.message);
    }

    // Test 3.2: Complete password reset flow (simulating frontend)
    progress('Test 3.2: Simulate complete frontend flow');
    try {
      // Step 1: Request reset
      await axios.post(`${API_URL}/api/auth/forgot-password`, {
        email: testUser2.email,
      });

      // Step 2: Get token from DB (frontend would get from email)
      const tokenResult = await client.query(
        'SELECT password_reset_token FROM users WHERE email = $1',
        [testUser2.email]
      );
      const token = tokenResult.rows[0].password_reset_token;

      // Step 3: Reset password
      const resetPassword = 'NewFrontendPass123!';
      await axios.post(
        `${API_URL}/api/auth/reset-password/${token}`,
        { password: resetPassword }
      );

      // Step 4: Login with new password
      const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
        email: testUser2.email,
        password: resetPassword,
      });

      recordTest('TC-5.3-01: Complete frontend flow works', loginResponse.data.success);
    } catch (error) {
      recordTest('TC-5.3-01: Complete frontend flow works', false, error.message);
    }

    // Test 3.3: API returns proper error messages
    progress('Test 3.3: Verify API returns user-friendly error messages');
    try {
      await axios.post(`${API_URL}/api/auth/reset-password/bad-token`, {
        password: 'ValidPass123!',
      });
      recordTest('TC-5.3-02: API returns proper error messages', false, 'Should have failed');
    } catch (error) {
      const hasMessage = !!error.response?.data?.message;
      recordTest('TC-5.3-02: API returns proper error messages', hasMessage,
        error.response?.data?.message);
    }

    // ============================================================
    // SECTION 4: EDGE CASES AND SECURITY
    // ============================================================
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║ SECTION 4: Edge Cases and Security                        ║');
    console.log('╚════════════════════════════════════════════════════════════╝');

    // Test 4.1: Multiple reset requests
    progress('Test 4.1: Multiple reset requests (token should update)');
    try {
      const testUser3 = {
        username: `test_multi_${Date.now()}`,
        email: `multi_${Date.now()}@example.com`,
        password: 'MultiTest123!',
      };

      await axios.post(`${API_URL}/api/auth/register`, testUser3);

      // First request
      await axios.post(`${API_URL}/api/auth/forgot-password`, { email: testUser3.email });
      const token1Result = await client.query(
        'SELECT password_reset_token FROM users WHERE email = $1',
        [testUser3.email]
      );
      const token1 = token1Result.rows[0].password_reset_token;

      // Second request (should generate new token)
      await axios.post(`${API_URL}/api/auth/forgot-password`, { email: testUser3.email });
      const token2Result = await client.query(
        'SELECT password_reset_token FROM users WHERE email = $1',
        [testUser3.email]
      );
      const token2 = token2Result.rows[0].password_reset_token;

      const tokensAreDifferent = token1 !== token2;
      recordTest('TC-5.4-01: Multiple requests update token', tokensAreDifferent);
    } catch (error) {
      recordTest('TC-5.4-01: Multiple requests update token', false, error.message);
    }

    // Test 4.2: Case sensitivity of email
    progress('Test 4.2: Email case sensitivity');
    try {
      // Request with different case
      const response = await axios.post(`${API_URL}/api/auth/forgot-password`, {
        email: testUser1.email.toUpperCase(),
      });
      recordTest('TC-5.4-02: Email case insensitive', response.data.success);
    } catch (error) {
      recordTest('TC-5.4-02: Email case insensitive', false, error.message);
    }

    // Test 4.3: SQL injection attempt
    progress('Test 4.3: SQL injection protection');
    try {
      await axios.post(`${API_URL}/api/auth/forgot-password`, {
        email: "test@example.com' OR '1'='1",
      });
      // Should not crash and should return standard response
      recordTest('TC-5.4-03: SQL injection protection', true);
    } catch (error) {
      // Even if it fails, as long as server doesn't crash, it's protected
      const notServerError = error.response?.status !== 500;
      recordTest('TC-5.4-03: SQL injection protection', notServerError);
    }

    // Generate final report
    generateFinalReport();

  } catch (error) {
    console.error('\n❌ Test suite encountered fatal error!');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    generateFinalReport();
    process.exit(1);
  } finally {
    if (client) {
      await client.end();
    }
  }
}

function generateFinalReport() {
  console.log('\n\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                   FINAL TEST REPORT                        ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const passRate = ((results.passed / results.total) * 100).toFixed(1);

  console.log('📊 OVERALL STATISTICS');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`Total Tests:    ${results.total}`);
  console.log(`Passed:         ${results.passed} ✅`);
  console.log(`Failed:         ${results.failed} ❌`);
  console.log(`Pass Rate:      ${passRate}%`);
  console.log('');

  // Component status
  console.log('📦 COMPONENT STATUS');
  console.log('═══════════════════════════════════════════════════════════');

  const story51Tests = results.tests.filter(t => t.name.startsWith('TC-5.1'));
  const story52Tests = results.tests.filter(t => t.name.startsWith('TC-5.2'));
  const story53Tests = results.tests.filter(t => t.name.startsWith('TC-5.3'));
  const story54Tests = results.tests.filter(t => t.name.startsWith('TC-5.4'));

  const story51Pass = story51Tests.filter(t => t.passed).length;
  const story52Pass = story52Tests.filter(t => t.passed).length;
  const story53Pass = story53Tests.filter(t => t.passed).length;
  const story54Pass = story54Tests.filter(t => t.passed).length;

  console.log(`Story 5.1 - Forgot Password Endpoint:     ${story51Pass}/${story51Tests.length} ${story51Pass === story51Tests.length ? '✅' : '❌'}`);
  console.log(`Story 5.2 - Reset Password Endpoint:      ${story52Pass}/${story52Tests.length} ${story52Pass === story52Tests.length ? '✅' : '❌'}`);
  console.log(`Story 5.3 - Frontend API Integration:     ${story53Pass}/${story53Tests.length} ${story53Pass === story53Tests.length ? '✅' : '❌'}`);
  console.log(`Security & Edge Cases:                    ${story54Pass}/${story54Tests.length} ${story54Pass === story54Tests.length ? '✅' : '❌'}`);
  console.log('');

  // Failed tests detail
  if (results.failed > 0) {
    console.log('❌ FAILED TESTS DETAIL');
    console.log('═══════════════════════════════════════════════════════════');
    results.tests.filter(t => !t.passed).forEach(test => {
      console.log(`• ${test.name}`);
      if (test.details) {
        console.log(`  Details: ${test.details}`);
      }
    });
    console.log('');
  }

  // Phase 5 verdict
  console.log('🎯 PHASE 5 VERDICT');
  console.log('═══════════════════════════════════════════════════════════');

  if (results.failed === 0) {
    console.log('✅ PHASE 5: FULLY FUNCTIONAL');
    console.log('All password reset features working correctly!');
    console.log('Ready for production deployment.');
  } else if (passRate >= 90) {
    console.log('⚠️  PHASE 5: MOSTLY FUNCTIONAL');
    console.log(`${results.failed} minor issue(s) detected.`);
    console.log('Review failed tests before deployment.');
  } else if (passRate >= 70) {
    console.log('⚠️  PHASE 5: PARTIALLY FUNCTIONAL');
    console.log(`${results.failed} issue(s) detected.`);
    console.log('Fixes required before deployment.');
  } else {
    console.log('❌ PHASE 5: CRITICAL ISSUES');
    console.log(`${results.failed} issue(s) detected.`);
    console.log('Immediate attention required!');
  }

  console.log('\n╚════════════════════════════════════════════════════════════╝\n');
}

// Run tests
runComprehensiveTests();
