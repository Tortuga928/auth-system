/**
 * Test MFA Status Endpoint with Fresh User
 */

const axios = require('axios');
const speakeasy = require('speakeasy');

const API_BASE_URL = 'http://localhost:5000';

// Latest fresh user credentials
const testUser = {
  email: 'mfauser1762722201253@example.com',
  password: 'MFA123!@#Test',
  backupCode: '9BA5-0C66', // First backup code
};

async function testMFAStatus() {
  console.log('\n🧪 Testing MFA Status Endpoint with Fresh User\n');

  try {
    // Step 1: Login
    console.log('🔐 Step 1: Logging in...');
    const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: testUser.email,
      password: testUser.password,
    });

    console.log('✅ Login response:', {
      mfaRequired: loginResponse.data.data.mfaRequired,
      hasChallengeToken: !!loginResponse.data.data.mfaChallengeToken,
    });

    const mfaChallengeToken = loginResponse.data.data.mfaChallengeToken;

    // Step 2: Verify with backup code
    console.log('\n🔑 Step 2: Verifying with backup code...');
    const verifyResponse = await axios.post(`${API_BASE_URL}/api/auth/mfa/verify-backup`, {
      mfaChallengeToken,
      backupCode: testUser.backupCode,
    });

    console.log('✅ Verification successful');
    const accessToken = verifyResponse.data.data.tokens.accessToken;
    console.log('📝 Access token (first 30 chars):', accessToken.substring(0, 30) + '...');

    // Step 3: Test MFA status endpoint
    console.log('\n📊 Step 3: Fetching MFA status...');
    const statusResponse = await axios.get(`${API_BASE_URL}/api/auth/mfa/status`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    console.log('✅ MFA Status Response:');
    console.log(JSON.stringify(statusResponse.data, null, 2));

    console.log('\n' + '═'.repeat(80));
    console.log('✅ ALL TESTS PASSED - Backend is working correctly!');
    console.log('═'.repeat(80));
    console.log('\n📝 CREDENTIALS FOR FRONTEND TESTING:\n');
    console.log(`   Email:    ${testUser.email}`);
    console.log(`   Password: ${testUser.password}`);
    console.log(`   Backup Code: ${testUser.backupCode} (or any other from list)\n`);

  } catch (error) {
    console.log('\n' + '═'.repeat(80));
    console.error('❌ TEST FAILED');
    console.log('═'.repeat(80));
    console.error('\nError:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
  }
}

testMFAStatus();
