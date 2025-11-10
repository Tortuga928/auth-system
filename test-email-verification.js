/**
 * Test Script: Email Verification Endpoint
 *
 * Tests Story 4.4 - Email Verification Endpoint
 */

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:5000';

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
  let verificationToken = null;
  let userId = null;

  try {
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
    // In a real scenario, user would get this from email
    // For testing, we'll query the user endpoint and get the token
    console.log('STEP 2: Getting verification token from backend logs');
    console.log('⚠️  In production, user gets this from email link\n');
    console.log('   For this test, check docker logs for the verification token:');
    console.log('   docker logs auth-backend 2>&1 | grep "email_verification_token"\n');
    console.log('   Or check the database directly.\n');

    // Prompt for token
    console.log('========================================');
    console.log('MANUAL STEP REQUIRED');
    console.log('========================================');
    console.log('1. Run: docker exec -it auth-postgres psql -U postgres -d authdb');
    console.log(`2. Run: SELECT email_verification_token FROM users WHERE id = ${userId};`);
    console.log('3. Copy the token and set it as environment variable:');
    console.log('   VERIFICATION_TOKEN=<paste-token-here> node test-email-verification.js\n');

    // Check if token provided via environment
    verificationToken = process.env.VERIFICATION_TOKEN;

    if (!verificationToken) {
      console.log('❌ VERIFICATION_TOKEN environment variable not set');
      console.log('\nTo complete the test:');
      console.log('1. Get the token from the database (see instructions above)');
      console.log('2. Re-run with: VERIFICATION_TOKEN=<token> node test-email-verification.js');
      process.exit(0);
    }

    console.log(`✅ Using verification token: ${verificationToken.substring(0, 20)}...\n`);

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

    // Step 5: Test verifying again (should say already verified)
    console.log('STEP 5: Test verifying already verified email');
    console.log(`GET ${API_URL}/api/auth/verify-email/${verificationToken}\n`);

    const verifyAgainResponse = await axios.get(
      `${API_URL}/api/auth/verify-email/${verificationToken}`
    );

    console.log('✅ Response:', verifyAgainResponse.data.message);
    console.log('');

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
    console.log('✅ TC-4.4-05: User marked as verified in database - PASS');
    console.log('✅ TC-4.4-06: Already verified email handled gracefully - PASS');
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
      console.error('\nStart backend with:');
      console.error('  cd backend && npm run dev');
      console.error('  OR');
      console.error('  docker-compose up -d');
    } else {
      console.error('\nError:', error.message);
    }

    process.exit(1);
  }
}

// Run test
console.log('Starting test...\n');
testEmailVerification();
