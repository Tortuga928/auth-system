/**
 * Test Frontend Login Flow
 * Simulates exactly what the frontend does
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000';

async function testLogin() {
  console.log('🧪 Testing Frontend Login Flow...\n');

  try {
    // Step 1: Create axios instance like frontend
    const api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('📤 Sending login request...');
    console.log('   Email: mfatest@example.com');
    console.log('   Password: Test123!@#MFA\n');

    const response = await api.post('/api/auth/login', {
      email: 'mfatest@example.com',
      password: 'Test123!@#MFA',
    });

    console.log('✅ Login Response Received:');
    console.log('   Status:', response.status);
    console.log('   Success:', response.data.success);
    console.log('   Message:', response.data.message);
    console.log('\n📊 Full Response Data:');
    console.log(JSON.stringify(response.data, null, 2));

    // Check what the frontend is checking
    console.log('\n🔍 Frontend Checks:');
    console.log('   response.data.data exists?', !!response.data.data);
    console.log('   response.data.data.mfaRequired:', response.data.data?.mfaRequired);
    console.log('   response.data.data.mfaChallengeToken:', response.data.data?.mfaChallengeToken?.substring(0, 20) + '...');

    if (response.data.data.mfaRequired) {
      console.log('\n✅ SUCCESS! MFA verification screen should show');
      console.log('   Challenge token received: YES');
    } else {
      console.log('\n⚠️  MFA not required - would redirect to dashboard');
    }

  } catch (error) {
    console.log('\n❌ ERROR CAUGHT:');
    console.log('   Error type:', error.name);
    console.log('   Error message:', error.message);

    if (error.response) {
      console.log('   Response status:', error.response.status);
      console.log('   Response data:', error.response.data);
    } else if (error.request) {
      console.log('   No response received from server');
    } else {
      console.log('   Request setup error:', error.message);
    }
  }
}

testLogin();
