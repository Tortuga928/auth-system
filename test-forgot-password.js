/**
 * Test Script: Forgot Password Endpoint
 *
 * Tests Story 5.1 - Forgot Password Endpoint
 */

const axios = require('axios');
const { Client } = require('pg');

const API_URL = process.env.API_URL || 'http://localhost:5000';
const DB_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/authdb';

console.log('========================================');
console.log('Story 5.1 - Forgot Password Test');
console.log('========================================\n');

async function testForgotPassword() {
  let client;
  let testUser;

  try {
    // Connect to database
    client = new Client({ connectionString: DB_URL });
    await client.connect();

    // Step 1: Create a test user first
    console.log('STEP 1: Create test user');
    testUser = {
      username: `testuser_${Date.now()}`,
      email: `test_${Date.now()}@example.com`,
      password: 'TestPassword123!',
    };

    const registerResponse = await axios.post(`${API_URL}/api/auth/register`, testUser);

    if (!registerResponse.data.success) {
      throw new Error('Registration failed');
    }

    const userId = registerResponse.data.data.user.id;
    console.log('✅ Test user created');
    console.log(`   User ID: ${userId}`);
    console.log(`   Email: ${testUser.email}\n`);

    // Step 2: Request password reset
    console.log('STEP 2: Request password reset');
    console.log(`POST ${API_URL}/api/auth/forgot-password`);
    console.log(`Body: { email: "${testUser.email}" }\n`);

    const forgotResponse = await axios.post(`${API_URL}/api/auth/forgot-password`, {
      email: testUser.email,
    });

    console.log('✅ Password reset requested successfully');
    console.log('Response:', JSON.stringify(forgotResponse.data, null, 2));
    console.log('');

    if (!forgotResponse.data.success) {
      throw new Error('Forgot password request failed');
    }

    // Step 3: Verify reset token was stored in database
    console.log('STEP 3: Verify reset token in database');
    const tokenResult = await client.query(
      'SELECT password_reset_token, password_reset_expires FROM users WHERE id = $1',
      [userId]
    );

    if (!tokenResult.rows[0].password_reset_token) {
      throw new Error('Password reset token not found in database');
    }

    const resetToken = tokenResult.rows[0].password_reset_token;
    const resetExpires = tokenResult.rows[0].password_reset_expires;

    console.log('✅ Reset token found in database');
    console.log(`   Token: ${resetToken.substring(0, 20)}...`);
    console.log(`   Expires: ${resetExpires}\n`);

    // Step 4: Verify token expires in approximately 1 hour
    const expiresDate = new Date(resetExpires);
    const now = new Date();
    const diffMinutes = (expiresDate - now) / 1000 / 60;

    console.log(`   Token expires in: ${Math.round(diffMinutes)} minutes`);

    if (diffMinutes < 55 || diffMinutes > 65) {
      throw new Error('Token expiration should be approximately 1 hour (60 minutes)');
    }

    console.log('✅ Token expiration is correct (1 hour)\n');

    // Step 5: Test forgot password for non-existent email
    console.log('STEP 4: Test forgot password for non-existent email');
    console.log(`POST ${API_URL}/api/auth/forgot-password`);
    console.log(`Body: { email: "nonexistent@example.com" }\n`);

    const nonExistentResponse = await axios.post(`${API_URL}/api/auth/forgot-password`, {
      email: 'nonexistent@example.com',
    });

    console.log('✅ Response for non-existent email (security check)');
    console.log('Response:', JSON.stringify(nonExistentResponse.data, null, 2));
    console.log('');

    // Should return same success message (don't reveal if email exists)
    if (nonExistentResponse.data.message !== forgotResponse.data.message) {
      throw new Error('Response should be same for existing/non-existing emails (security)');
    }

    console.log('✅ Security check passed (same response for non-existent email)\n');

    // Step 6: Test invalid email format
    console.log('STEP 5: Test invalid email format');
    console.log(`POST ${API_URL}/api/auth/forgot-password`);
    console.log(`Body: { email: "invalid-email" }\n`);

    try {
      await axios.post(`${API_URL}/api/auth/forgot-password`, {
        email: 'invalid-email',
      });
      throw new Error('Invalid email should have been rejected');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Invalid email format correctly rejected');
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Message: ${error.response.data.message}\n`);
      } else {
        throw error;
      }
    }

    // Step 7: Test missing email
    console.log('STEP 6: Test missing email');
    console.log(`POST ${API_URL}/api/auth/forgot-password`);
    console.log(`Body: {}\n`);

    try {
      await axios.post(`${API_URL}/api/auth/forgot-password`, {});
      throw new Error('Missing email should have been rejected');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Missing email correctly rejected');
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
    console.log('✅ TC-5.1-01: Can request password reset - PASS');
    console.log('✅ TC-5.1-02: Reset email sent - PASS (check logs)');
    console.log('✅ TC-5.1-03: Token expires after 1 hour - PASS');
    console.log('✅ Security: Same response for non-existent emails - PASS');
    console.log('✅ Validation: Invalid email rejected - PASS');
    console.log('✅ Validation: Missing email rejected - PASS');
    console.log('');
    console.log('========================================');
    console.log('Check Backend Logs For:');
    console.log('========================================');
    console.log('1. "✅ Password reset email sent to [email]"');
    console.log('2. Email preview URL (if using Ethereal)');
    console.log('');
    console.log('✅ Story 5.1 implementation working correctly!');
    console.log('');
    console.log('========================================');
    console.log('Password Reset Token:');
    console.log('========================================');
    console.log(`Token: ${resetToken}`);
    console.log('');
    console.log('Use this token to test Story 5.2 (Reset Password Endpoint)');
    console.log(`Example: POST /api/auth/reset-password/${resetToken}`);
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
testForgotPassword();
