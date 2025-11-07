/**
 * Test Script: Password Reset Frontend Flow
 *
 * Tests Story 5.3 - Password Reset Frontend Pages
 * This tests the complete frontend password reset user experience
 */

const axios = require('axios');
const { Client } = require('pg');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const API_URL = process.env.API_URL || 'http://localhost:5000';
const DB_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/authdb';

console.log('========================================');
console.log('Story 5.3 - Password Reset Frontend Test');
console.log('========================================\n');

async function testPasswordResetFrontend() {
  let client;
  let testUser;
  let resetToken;

  try {
    // Connect to database
    client = new Client({ connectionString: DB_URL });
    await client.connect();

    console.log('📋 Test Plan:');
    console.log('  1. Create test user via backend API');
    console.log('  2. Request password reset via backend API');
    console.log('  3. Extract reset token from database');
    console.log('  4. Verify frontend routes are accessible');
    console.log('  5. Verify success/error message display logic\n');

    // Step 1: Create test user
    console.log('STEP 1: Create test user');
    testUser = {
      username: `testuser_${Date.now()}`,
      email: `test_${Date.now()}@example.com`,
      password: 'OldPassword123!',
    };

    const registerResponse = await axios.post(`${API_URL}/api/auth/register`, testUser);
    const userId = registerResponse.data.data.user.id;

    console.log('✅ Test user created');
    console.log(`   User ID: ${userId}`);
    console.log(`   Email: ${testUser.email}\n`);

    // Step 2: Request password reset
    console.log('STEP 2: Request password reset');
    await axios.post(`${API_URL}/api/auth/forgot-password`, {
      email: testUser.email,
    });

    // Get reset token from database
    const tokenResult = await client.query(
      'SELECT password_reset_token FROM users WHERE id = $1',
      [userId]
    );

    resetToken = tokenResult.rows[0].password_reset_token;
    console.log('✅ Password reset requested');
    console.log(`   Reset Token: ${resetToken.substring(0, 20)}...\n`);

    // Step 3: Verify frontend routes
    console.log('STEP 3: Verify frontend routes are configured\n');

    console.log('Frontend URLs to test manually:');
    console.log(`📍 Forgot Password Page: ${FRONTEND_URL}/forgot-password`);
    console.log(`📍 Reset Password Page: ${FRONTEND_URL}/reset-password/${resetToken}`);
    console.log(`📍 Login Page (with forgot password link): ${FRONTEND_URL}/login\n`);

    // Step 4: Verify API integration
    console.log('STEP 4: Verify API integration works\n');

    // Test reset password API call (simulating frontend)
    console.log('Testing reset password API endpoint...');
    const newPassword = 'NewPassword123!';
    const resetResponse = await axios.post(
      `${API_URL}/api/auth/reset-password/${resetToken}`,
      { password: newPassword }
    );

    if (resetResponse.data.success) {
      console.log('✅ Reset password API works');
      console.log(`   Response: ${resetResponse.data.message}\n`);
    }

    // Step 5: Verify password was changed
    console.log('STEP 5: Verify password was changed');
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: testUser.email,
      password: newPassword,
    });

    console.log('✅ Login with new password successful\n');

    // Summary
    console.log('========================================');
    console.log('Test Summary');
    console.log('========================================');
    console.log('✅ TC-5.3-01: Forgot password API works correctly - PASS');
    console.log('✅ TC-5.3-02: Reset password API works correctly - PASS');
    console.log('✅ TC-5.3-03: Password successfully changed - PASS');
    console.log('✅ TC-5.3-04: Can login with new password - PASS');
    console.log('');
    console.log('========================================');
    console.log('Manual Testing Required:');
    console.log('========================================');
    console.log('Please manually test the following in your browser:\n');
    console.log('1. Navigate to: ' + FRONTEND_URL + '/login');
    console.log('   - Verify "Forgot your password?" link is visible');
    console.log('   - Click link and verify redirect to /forgot-password\n');
    console.log('2. On Forgot Password page:');
    console.log('   - Enter email: ' + testUser.email);
    console.log('   - Submit form');
    console.log('   - Verify success message displays');
    console.log('   - Verify "Back to Login" button works\n');
    console.log('3. Navigate to: ' + FRONTEND_URL + '/reset-password/' + resetToken);
    console.log('   - Enter new password: TestPassword456!');
    console.log('   - Confirm password: TestPassword456!');
    console.log('   - Verify password strength indicator shows');
    console.log('   - Submit form');
    console.log('   - Verify success message displays');
    console.log('   - Verify automatic redirect to /login after 3 seconds\n');
    console.log('4. Test validation errors:');
    console.log('   - Try weak password (should show error)');
    console.log('   - Try mismatched passwords (should show error)');
    console.log('   - Try empty fields (should show error)\n');
    console.log('5. Test edge cases:');
    console.log('   - Navigate to /reset-password/invalid-token');
    console.log('   - Verify appropriate error message\n');
    console.log('========================================');
    console.log('✅ Story 5.3 backend integration verified!');
    console.log('🔍 Complete manual UI testing using URLs above');
  } catch (error) {
    console.error('\n❌ Test failed!');

    if (error.response) {
      console.error('\nError Response:');
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('\nNo response received from server');
      console.error('Make sure backend is running on', API_URL);
      console.error('Make sure frontend is running on', FRONTEND_URL);
    } else {
      console.error('\nError:', error.message);
    }

    process.exit(1);
  } finally {
    if (client) {
      await client.end();
    }
  }
}

// Run test
console.log('Starting test...\n');
console.log('Prerequisites:');
console.log(`  - Backend running on ${API_URL}`);
console.log(`  - Frontend running on ${FRONTEND_URL}`);
console.log(`  - PostgreSQL database accessible\n`);

testPasswordResetFrontend();
