/**
 * Test Frontend MFA Disable Flow
 * Simulates the exact flow a user experiences in the browser
 */

const axios = require('axios');
const speakeasy = require('speakeasy');

const BACKEND_URL = 'http://localhost:5000';
const email = 'uitest1762733788868@example.com';
const password = 'UITest123!@#';
const secret = 'KU5HSULQNN3DWTKFLVDGKKSNNUXVUJCTHZTEM4SJORBCSSJBJE3Q';

// Create axios instance that mimics frontend api.js
const api = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let accessToken = null;

// Add request interceptor to include auth token (like frontend)
api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

async function testFrontendDisableFlow() {
  console.log('🧪 Testing Frontend MFA Disable Flow\n');

  try {
    // Step 1: Login (simulating user login)
    console.log('📍 Step 1: User logs in...');
    const loginResponse = await api.post('/api/auth/login', {
      email,
      password
    });

    if (loginResponse.data.data.mfaRequired) {
      console.log('✅ MFA required - challenge token received');
      const mfaChallengeToken = loginResponse.data.data.mfaChallengeToken;

      // Step 2: Verify MFA (simulating user entering TOTP)
      console.log('\n📍 Step 2: User enters TOTP code...');
      const totp = speakeasy.totp({ secret, encoding: 'base32' });
      console.log(`   Generated TOTP: ${totp}`);

      const verifyResponse = await api.post('/api/auth/mfa/verify', {
        mfaChallengeToken,
        token: totp
      });

      accessToken = verifyResponse.data.data.tokens.accessToken;
      // Store in localStorage (simulating browser)
      console.log('✅ Tokens received and stored');
    }

    // Step 3: Navigate to MFA Settings page
    console.log('\n📍 Step 3: User navigates to /mfa-settings...');

    // Fetch MFA status (like useMFA hook does)
    const statusResponse = await api.get('/api/auth/mfa/status');
    console.log('✅ MFA Status:', {
      enabled: statusResponse.data.data.mfaEnabled,
      backupCodes: statusResponse.data.data.backupCodesRemaining
    });

    // Step 4: User clicks "Disable 2FA" button
    console.log('\n📍 Step 4: User clicks "Disable 2FA" button...');
    console.log('   Password prompt appears (simulating prompt())');
    console.log(`   User enters password: ${password}`);

    // Call disableMFA (exactly like the frontend hook)
    try {
      const disableResponse = await api.post('/api/auth/mfa/disable', { password });
      console.log('\n✅ SUCCESS - MFA Disabled!');
      console.log('   Backend Response:', disableResponse.data);

      // Verify MFA is actually disabled
      const newStatus = await api.get('/api/auth/mfa/status');
      console.log('\n✅ Verification - MFA Status After Disable:');
      console.log('   Enabled:', newStatus.data.data.mfaEnabled);
      console.log('   Backup Codes:', newStatus.data.data.backupCodesRemaining);

    } catch (disableError) {
      console.log('\n❌ DISABLE FAILED');
      console.log('   Status:', disableError.response?.status);
      console.log('   Message:', disableError.response?.data?.message);
      console.log('   Error:', disableError.response?.data?.error);
      console.log('\n   This is the error the user is seeing!');

      // Check if it's an auth issue
      if (disableError.response?.status === 401) {
        console.log('\n⚠️  ISSUE: Authorization failed');
        console.log('   The access token might be invalid or expired');
        console.log('   Headers sent:', disableError.config?.headers?.Authorization?.substring(0, 30) + '...');
      }

      // Check if it's a password issue
      if (disableError.response?.status === 400) {
        console.log('\n⚠️  ISSUE: Bad request');
        console.log('   Password might be incorrect or missing');
      }

      throw disableError;
    }

  } catch (error) {
    console.log('\n' + '='.repeat(80));
    console.error('❌ TEST FAILED');
    console.log('='.repeat(80));
    console.error('\nError:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

console.log('🔧 Simulating exact frontend user flow...\n');
testFrontendDisableFlow();
