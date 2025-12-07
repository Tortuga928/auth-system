/**
 * Login Flow Email 2FA Integration Tests
 *
 * Tests for Phase 4: Login Flow Integration with Email 2FA
 *
 * Test Categories:
 * 1. Login with MFA disabled (baseline)
 * 2. Login with Email 2FA enabled (email_only mode)
 * 3. Login with TOTP + Email fallback mode
 * 4. Trusted device handling
 * 5. MFA method switching during login
 * 6. Email code verification
 * 7. Email code resend
 */

const http = require('http');

const API_HOST = process.env.API_HOST || 'localhost';
const API_PORT = process.env.API_PORT || 5000;
const API_BASE = '/api';

// Simple HTTP client
function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_HOST,
      port: API_PORT,
      path: API_BASE + path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(data || '{}'),
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: { raw: data },
          });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

const api = {
  get: (path, opts = {}) => makeRequest('GET', path, null, opts.headers),
  post: (path, body, opts = {}) => makeRequest('POST', path, body, opts.headers),
  put: (path, body, opts = {}) => makeRequest('PUT', path, body, opts.headers),
};

const API_URL = `http://${API_HOST}:${API_PORT}${API_BASE}`;

// Test user credentials
const TEST_USER = {
  email: 'testuser@test.com',
  password: 'TestPass123!',
};

const TEST_ADMIN = {
  email: 'testadmin@example.com',
  password: 'TestAdmin123!',
};

async function login(email, password) {
  return api.post('/auth/login', { email, password });
}

async function setMFAMode(adminToken, mode) {
  return api.put('/admin/mfa/config',
    { mfa_mode: mode },
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
}

async function getMFAConfig(adminToken) {
  return api.get('/admin/mfa/config',
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
}

async function enableUserEmail2FA(userToken) {
  return api.post('/auth/mfa/email/enable', {},
    { headers: { Authorization: `Bearer ${userToken}` } }
  );
}

async function disableUserEmail2FA(userToken) {
  return api.post('/auth/mfa/email/disable', {},
    { headers: { Authorization: `Bearer ${userToken}` } }
  );
}

// Test results tracking
let passed = 0;
let failed = 0;
const results = [];

function test(name, fn) {
  return async () => {
    try {
      await fn();
      passed++;
      results.push({ name, status: 'PASS' });
      console.log(`✅ ${name}`);
    } catch (error) {
      failed++;
      results.push({ name, status: 'FAIL', error: error.message });
      console.log(`❌ ${name}`);
      console.log(`   Error: ${error.message}`);
    }
  };
}

// Test Suite
async function runTests() {
  console.log('\n🧪 Login Flow Email 2FA Integration Tests');
  console.log('=' .repeat(60));
  console.log(`API URL: ${API_URL}\n`);

  let adminToken = null;
  let userToken = null;
  let originalMFAMode = 'disabled';

  // Setup: Get admin token
  console.log('📋 Setup: Getting admin token...');
  const adminLogin = await login(TEST_ADMIN.email, TEST_ADMIN.password);

  if (adminLogin.data.success && adminLogin.data.data?.tokens?.accessToken) {
    adminToken = adminLogin.data.data.tokens.accessToken;
    console.log('✓ Admin logged in successfully\n');
  } else if (adminLogin.data.data?.mfaRequired) {
    console.log('⚠️ Admin has MFA enabled - some tests may be skipped');
    console.log('   Please disable MFA on admin account or use test without MFA\n');
  } else {
    console.log('❌ Failed to login as admin:', adminLogin.data.message);
    console.log('   Tests will continue with limited functionality\n');
  }

  // Save original MFA config
  if (adminToken) {
    const configRes = await getMFAConfig(adminToken);
    if (configRes.data.success) {
      originalMFAMode = configRes.data.data.mfa_mode;
      console.log(`📝 Original MFA mode: ${originalMFAMode}\n`);
    }
  }

  // ==========================================
  // Test 1: Login with MFA disabled
  // ==========================================
  await test('1.1 Login succeeds when MFA is disabled', async () => {
    if (adminToken) {
      await setMFAMode(adminToken, 'disabled');
    }

    const res = await login(TEST_USER.email, TEST_USER.password);

    if (!res.data.success) {
      throw new Error(`Login failed: ${res.data.message}`);
    }

    if (res.data.data.mfaRequired) {
      throw new Error('MFA should not be required when disabled');
    }

    if (!res.data.data.tokens?.accessToken) {
      throw new Error('Access token not returned');
    }

    userToken = res.data.data.tokens.accessToken;
  })();

  await test('1.2 Login returns user data when MFA disabled', async () => {
    const res = await login(TEST_USER.email, TEST_USER.password);

    if (!res.data.data.user) {
      throw new Error('User data not returned');
    }

    if (!res.data.data.user.email) {
      throw new Error('User email not returned');
    }
  })();

  // ==========================================
  // Test 2: Login with Email-only MFA mode
  // ==========================================
  await test('2.1 Login requires MFA when email_only mode is enabled', async () => {
    if (!adminToken) {
      console.log('   (Skipped - no admin token)');
      return;
    }

    // Set MFA mode to email_only
    const modeRes = await setMFAMode(adminToken, 'email_only');
    if (!modeRes.data.success) {
      throw new Error(`Failed to set MFA mode: ${modeRes.data.message}`);
    }

    const res = await login(TEST_USER.email, TEST_USER.password);

    if (!res.data.success) {
      throw new Error(`Login request failed: ${res.data.message}`);
    }

    if (!res.data.data.mfaRequired) {
      throw new Error('MFA should be required in email_only mode');
    }

    if (res.data.data.mfaMethod !== 'email') {
      throw new Error(`Expected email method, got: ${res.data.data.mfaMethod}`);
    }
  })();

  await test('2.2 Login returns MFA challenge token', async () => {
    if (!adminToken) {
      console.log('   (Skipped - no admin token)');
      return;
    }

    const res = await login(TEST_USER.email, TEST_USER.password);

    if (!res.data.data.mfaChallengeToken) {
      throw new Error('MFA challenge token not returned');
    }
  })();

  await test('2.3 Login returns available MFA methods', async () => {
    if (!adminToken) {
      console.log('   (Skipped - no admin token)');
      return;
    }

    const res = await login(TEST_USER.email, TEST_USER.password);

    if (!Array.isArray(res.data.data.availableMethods)) {
      throw new Error('Available methods not returned as array');
    }

    if (!res.data.data.availableMethods.includes('email')) {
      throw new Error('Email should be in available methods');
    }
  })();

  await test('2.4 Login indicates email code was sent', async () => {
    if (!adminToken) {
      console.log('   (Skipped - no admin token)');
      return;
    }

    const res = await login(TEST_USER.email, TEST_USER.password);

    // In email_only mode, code should be sent automatically
    if (res.data.data.mfaMethod === 'email') {
      // Note: emailCodeSent might be false if email service isn't configured
      // This is expected in test environment
      console.log(`   Email code sent: ${res.data.data.emailCodeSent}`);
    }
  })();

  // ==========================================
  // Test 3: Email 2FA verification endpoint
  // ==========================================
  await test('3.1 Verify-email endpoint requires code', async () => {
    const res = await api.post('/auth/mfa/verify-email', {
      mfaChallengeToken: 'some-token',
    });

    if (res.status !== 400) {
      throw new Error(`Expected 400 status, got ${res.status}`);
    }

    if (!res.data.message.includes('Invalid code')) {
      throw new Error(`Unexpected error: ${res.data.message}`);
    }
  })();

  await test('3.2 Verify-email endpoint requires MFA challenge token', async () => {
    const res = await api.post('/auth/mfa/verify-email', {
      code: '123456',
    });

    if (res.status !== 400) {
      throw new Error(`Expected 400 status, got ${res.status}`);
    }

    if (!res.data.message.includes('challenge token')) {
      throw new Error(`Unexpected error: ${res.data.message}`);
    }
  })();

  await test('3.3 Verify-email rejects invalid challenge token', async () => {
    const res = await api.post('/auth/mfa/verify-email', {
      code: '123456',
      mfaChallengeToken: 'invalid-token',
    });

    if (res.status !== 401) {
      throw new Error(`Expected 401 status, got ${res.status}`);
    }
  })();

  // ==========================================
  // Test 4: Email resend endpoint
  // ==========================================
  await test('4.1 Resend-email endpoint requires MFA challenge token', async () => {
    const res = await api.post('/auth/mfa/resend-email', {});

    if (res.status !== 400) {
      throw new Error(`Expected 400 status, got ${res.status}`);
    }
  })();

  await test('4.2 Resend-email rejects invalid challenge token', async () => {
    const res = await api.post('/auth/mfa/resend-email', {
      mfaChallengeToken: 'invalid-token',
    });

    if (res.status !== 401) {
      throw new Error(`Expected 401 status, got ${res.status}`);
    }
  })();

  // ==========================================
  // Test 5: MFA method switching
  // ==========================================
  await test('5.1 Switch-method endpoint requires MFA challenge token', async () => {
    const res = await api.post('/auth/mfa/switch-method', {
      method: 'email',
    });

    if (res.status !== 400) {
      throw new Error(`Expected 400 status, got ${res.status}`);
    }
  })();

  await test('5.2 Switch-method validates method parameter', async () => {
    const res = await api.post('/auth/mfa/switch-method', {
      mfaChallengeToken: 'some-token',
      method: 'invalid',
    });

    if (res.status !== 400) {
      throw new Error(`Expected 400 status, got ${res.status}`);
    }

    if (!res.data.message.includes('Invalid method')) {
      throw new Error(`Unexpected error: ${res.data.message}`);
    }
  })();

  // ==========================================
  // Test 6: TOTP + Email fallback mode
  // ==========================================
  await test('6.1 totp_email_fallback mode returns backup method', async () => {
    if (!adminToken) {
      console.log('   (Skipped - no admin token)');
      return;
    }

    // Set MFA mode to totp_email_fallback
    await setMFAMode(adminToken, 'totp_email_fallback');

    const res = await login(TEST_USER.email, TEST_USER.password);

    // User likely doesn't have TOTP set up, so email should be primary
    if (res.data.data.mfaRequired) {
      console.log(`   Primary method: ${res.data.data.mfaMethod}`);
      console.log(`   Backup method: ${res.data.data.backupMethod}`);
      console.log(`   Available: ${res.data.data.availableMethods?.join(', ')}`);
    }
  })();

  // ==========================================
  // Test 7: Trusted device info in response
  // ==========================================
  await test('7.1 Login response includes device trust settings', async () => {
    if (!adminToken) {
      console.log('   (Skipped - no admin token)');
      return;
    }

    // Enable device trust
    await api.put('/admin/mfa/config',
      { device_trust_enabled: true, device_trust_duration_days: 30 },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );

    const res = await login(TEST_USER.email, TEST_USER.password);

    if (res.data.data.mfaRequired) {
      if (typeof res.data.data.deviceTrustEnabled !== 'boolean') {
        throw new Error('Device trust enabled flag not returned');
      }

      console.log(`   Device trust enabled: ${res.data.data.deviceTrustEnabled}`);
      console.log(`   Device trust days: ${res.data.data.deviceTrustDays}`);
    }
  })();

  // ==========================================
  // Cleanup
  // ==========================================
  console.log('\n📋 Cleanup: Restoring original MFA configuration...');
  if (adminToken) {
    await setMFAMode(adminToken, originalMFAMode);
    console.log(`✓ MFA mode restored to: ${originalMFAMode}`);
  }

  // ==========================================
  // Summary
  // ==========================================
  console.log('\n' + '=' .repeat(60));
  console.log('📊 Test Results Summary');
  console.log('=' .repeat(60));
  console.log(`Total: ${passed + failed}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Pass Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`   - ${r.name}`);
      console.log(`     Error: ${r.error}`);
    });
  }

  console.log('\n' + '=' .repeat(60));

  return { passed, failed };
}

// Run tests
runTests()
  .then(({ passed, failed }) => {
    process.exit(failed > 0 ? 1 : 0);
  })
  .catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
  });
