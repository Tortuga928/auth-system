const axios = require('axios');

async function testMFAStatus() {
  try {
    // Login
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'mfatest@example.com',
      password: 'Test123!@#MFA'
    });

    const challengeToken = loginRes.data.data.mfaChallengeToken;

    // Verify with backup code
    const verifyRes = await axios.post('http://localhost:5000/api/auth/mfa/verify-backup', {
      mfaChallengeToken: challengeToken,
      backupCode: '1E23-5C02'
    });

    const accessToken = verifyRes.data.data.tokens.accessToken;
    console.log('✅ Got access token\n');

    // Test MFA status endpoint
    const statusRes = await axios.get('http://localhost:5000/api/auth/mfa/status', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    console.log('✅ MFA Status Response:');
    console.log(JSON.stringify(statusRes.data, null, 2));

  } catch (err) {
    console.log('❌ Error:', err.response?.data || err.message);
  }
}

testMFAStatus();
