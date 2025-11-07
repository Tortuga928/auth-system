/**
 * Test Script: Email Verification Endpoint (Automated)
 *
 * Tests Story 4.4 - Email Verification Endpoint
 * This version automatically queries the database for the verification token
 */

const axios = require('axios');
const { Client } = require('pg');

const API_URL = process.env.API_URL || 'http://localhost:5000';
const DB_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/authdb';

// Test data
const testUser = {
  username: `testuser_${Date.now()}`,
  email: `test_${Date.now()}@example.com`,
  password: 'TestPassword123!',
};

console.log('========================================');
console.log('Story 4.4 - Email Verification Test');
console.log('========================================\n');

async function testEmailVerification() {
  let client;
  let verificationToken = null;
  let userId = null;

  try {
    // Connect to database
    client = new Client({ connectionString: DB_URL });
    await client.connect();

    // Step 1: Register a new user
    console.log('STEP 1: Register new user');
    console.log(`POST ${API_URL}/api/auth/register`);
    console.log(`Username: ${testUser.username}`);
    console.log(`Email: ${testUser.email}\n`);

    const registerResponse = await axios.post(`${API_URL}/api/auth/register`, testUser);

    if (!registerResponse.data.success) {
      throw new Error('Registration failed');
    }

    userId = registerResponse.data.data.user.id;
    console.log('✅ User registered successfully');
    console.log(`   User ID: ${userId}`);
    console.log(`   email_verified: ${registerResponse.data.data.user.email_verified}\n`);

    if (registerResponse.data.data.user.email_verified === true) {
      throw new Error('User should not be verified immediately after registration');
    }

    // Step 2: Get verification token from database
    console.log('STEP 2: Get verification token from database');
    const tokenResult = await client.query(
      'SELECT email_verification_token FROM users WHERE id = $1',
      [userId]
    );

    verificationToken = tokenResult.rows[0].email_verification_token;
    console.log(`✅ Retrieved token: ${verificationToken.substring(0, 20)}...\n`);

    // Step 3: Verify email with token
    console.log('STEP 3: Test email verification endpoint');
    console.log(`GET ${API_URL}/api/auth/verify-email/${verificationToken}\n`);

    const verifyResponse = await axios.get(
      `${API_URL}/api/auth/verify-email/${verificationToken}`
    );

    console.log('✅ Verification successful!');
    console.log('Response:', JSON.stringify(verifyResponse.data, null, 2));
    console.log('');

    // Step 4: Verify user is marked as verified
    console.log('STEP 4: Confirm user is marked as verified');
    console.log('Logging in to check email_verified status...\n');

    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: testUser.email,
      password: testUser.password,
    });

    if (!loginResponse.data.success) {
      throw new Error('Login failed after verification');
    }

    console.log('✅ Login successful');
    console.log(`   email_verified: ${loginResponse.data.data.user.email_verified}\n`);

    if (loginResponse.data.data.user.email_verified !== true) {
      throw new Error('User should be verified after verification endpoint');
    }

    // Step 5: Test using token again (should be invalid - token cleared after use)
    console.log('STEP 5: Test using token again (should be invalid)');
    console.log(`GET ${API_URL}/api/auth/verify-email/${verificationToken}\n`);

    try {
      await axios.get(`${API_URL}/api/auth/verify-email/${verificationToken}`);
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

    // Test invalid token
    console.log('STEP 6: Test invalid verification token');
    console.log(`GET ${API_URL}/api/auth/verify-email/invalid-token-12345\n`);

    try {
      await axios.get(`${API_URL}/api/auth/verify-email/invalid-token-12345`);
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

    // Summary
    console.log('========================================');
    console.log('Test Summary');
    console.log('========================================');
    console.log('✅ TC-4.4-01: Valid token verifies email - PASS');
    console.log('✅ TC-4.4-02: Invalid token returns error - PASS');
    console.log('✅ TC-4.4-04: Token can only be used once - PASS');
    console.log('✅ TC-4.4-05: User marked as verified in database - PASS');
    console.log('');
    console.log('✅ Story 4.4 implementation working correctly!');
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
testEmailVerification();
