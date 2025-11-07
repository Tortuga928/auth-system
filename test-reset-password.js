/**
 * Test Script: Reset Password Endpoint
 *
 * Tests Story 5.2 - Reset Password Endpoint
 * This tests the complete password reset flow
 */

const axios = require('axios');
const { Client } = require('pg');

const API_URL = process.env.API_URL || 'http://localhost:5000';
const DB_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/authdb';

console.log('========================================');
console.log('Story 5.2 - Reset Password Test');
console.log('========================================\n');

async function testResetPassword() {
  let client;
  let testUser;
  let resetToken;

  try {
    // Connect to database
    client = new Client({ connectionString: DB_URL });
    await client.connect();

    // Step 1: Create and verify a test user
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
    console.log(`   Email: ${testUser.email}`);
    console.log(`   Original Password: ${testUser.password}\n`);

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

    // Step 3: Verify old password still works
    console.log('STEP 3: Verify old password still works');
    const loginOldResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: testUser.email,
      password: testUser.password,
    });

    console.log('✅ Login with old password successful\n');

    // Step 4: Reset password with new password
    console.log('STEP 4: Reset password with valid token');
    const newPassword = 'NewPassword123!';
    console.log(`   New Password: ${newPassword}`);
    console.log(`POST ${API_URL}/api/auth/reset-password/${resetToken}\n`);

    const resetResponse = await axios.post(
      `${API_URL}/api/auth/reset-password/${resetToken}`,
      { password: newPassword }
    );

    console.log('✅ Password reset successful!');
    console.log('Response:', JSON.stringify(resetResponse.data, null, 2));
    console.log('');

    // Step 5: Verify old password no longer works
    console.log('STEP 5: Verify old password no longer works');
    try {
      await axios.post(`${API_URL}/api/auth/login`, {
        email: testUser.email,
        password: testUser.password,
      });
      throw new Error('Old password should not work after reset');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Old password correctly rejected');
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Message: ${error.response.data.message}\n`);
      } else {
        throw error;
      }
    }

    // Step 6: Verify new password works
    console.log('STEP 6: Verify new password works');
    const loginNewResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: testUser.email,
      password: newPassword,
    });

    console.log('✅ Login with new password successful');
    console.log(`   User ID: ${loginNewResponse.data.data.user.id}`);
    console.log(`   Email: ${loginNewResponse.data.data.user.email}\n`);

    // Step 7: Verify reset token was cleared
    console.log('STEP 7: Verify reset token was cleared from database');
    const clearedTokenResult = await client.query(
      'SELECT password_reset_token FROM users WHERE id = $1',
      [userId]
    );

    if (clearedTokenResult.rows[0].password_reset_token !== null) {
      throw new Error('Reset token should be cleared after use');
    }

    console.log('✅ Reset token cleared (one-time use)\n');

    // Step 8: Test using token again (should fail)
    console.log('STEP 8: Test reusing token (should fail)');
    try {
      await axios.post(
        `${API_URL}/api/auth/reset-password/${resetToken}`,
        { password: 'AnotherPassword123!' }
      );
      throw new Error('Used token should have failed');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Used token correctly rejected');
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Message: ${error.response.data.message}\n`);
      } else {
        throw error;
      }
    }

    // Step 9: Test invalid token
    console.log('STEP 9: Test invalid token');
    try {
      await axios.post(
        `${API_URL}/api/auth/reset-password/invalid-token-12345`,
        { password: 'TestPassword123!' }
      );
      throw new Error('Invalid token should have failed');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Invalid token correctly rejected');
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Message: ${error.response.data.message}\n`);
      } else {
        throw error;
      }
    }

    // Step 10: Test weak password
    console.log('STEP 10: Test weak password rejection');

    // Request a new reset token
    await axios.post(`${API_URL}/api/auth/forgot-password`, {
      email: testUser.email,
    });

    const newTokenResult = await client.query(
      'SELECT password_reset_token FROM users WHERE id = $1',
      [userId]
    );
    const newResetToken = newTokenResult.rows[0].password_reset_token;

    try {
      await axios.post(
        `${API_URL}/api/auth/reset-password/${newResetToken}`,
        { password: 'weak' }
      );
      throw new Error('Weak password should have been rejected');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Weak password correctly rejected');
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Message: ${error.response.data.message}\n`);
      } else {
        throw error;
      }
    }

    // Summary
    console.log('========================================');
    console.log('Test Summary');
    console.log('========================================');
    console.log('✅ TC-5.2-01: Can reset password with valid token - PASS');
    console.log('✅ TC-5.2-02: Invalid token rejected - PASS');
    console.log('✅ TC-5.2-03: Used token rejected (one-time use) - PASS');
    console.log('✅ TC-5.2-04: Weak password rejected - PASS');
    console.log('✅ TC-5.2-05: Old password no longer works - PASS');
    console.log('✅ TC-5.2-06: New password works - PASS');
    console.log('✅ TC-5.2-07: Token cleared after use - PASS');
    console.log('');
    console.log('========================================');
    console.log('Check Backend Logs For:');
    console.log('========================================');
    console.log('1. "✅ Password reset confirmation email sent to [email]"');
    console.log('2. Email preview URL (if using Ethereal)');
    console.log('');
    console.log('✅ Story 5.2 implementation working correctly!');
  } catch (error) {
    console.error('\n❌ Test failed!');

    if (error.response) {
      console.error('\nError Response:');
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('\nNo response received from server');
      console.error('Make sure backend is running on', API_URL);
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
testResetPassword();
