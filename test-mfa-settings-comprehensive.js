/**
 * Comprehensive MFA Settings Page Test Script
 *
 * Tests all API endpoints used by the Admin MFA Settings page
 *
 * Run: node test-mfa-settings-comprehensive.js
 */

const axios = require('axios');
const API_URL = 'http://localhost:5000';

let token = null;
let testResults = {
  passed: 0,
  failed: 0,
  skipped: 0,
  errors: []
};

// Helper function to run a test
async function runTest(name, testFn, options = {}) {
  const { skipOnError } = options;
  process.stdout.write(`  ${name}... `);
  try {
    await testFn();
    console.log('✅ PASS');
    testResults.passed++;
    return true;
  } catch (err) {
    const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message;
    const status = err.response?.status || 'N/A';
    const details = err.response?.data?.details || '';

    // Check for known skip conditions
    if (skipOnError && skipOnError.some(s => details.includes(s) || errorMsg.includes(s))) {
      console.log(`⏭️ SKIP (${errorMsg})`);
      testResults.skipped++;
      return 'skipped';
    }

    console.log(`❌ FAIL (${status}: ${errorMsg})`);
    testResults.failed++;
    testResults.errors.push({
      test: name,
      status,
      error: errorMsg,
      details,
    });
    return false;
  }
}

// Helper function for authenticated requests
function authHeaders() {
  return { Authorization: `Bearer ${token}` };
}

async function main() {
  console.log('='.repeat(60));
  console.log('MFA SETTINGS PAGE - COMPREHENSIVE TEST SUITE');
  console.log('='.repeat(60));
  console.log(`API URL: ${API_URL}`);
  console.log(`Time: ${new Date().toISOString()}`);
  console.log('='.repeat(60));

  // ============================================
  // AUTHENTICATION
  // ============================================
  console.log('\n📋 SECTION 1: Authentication\n');

  await runTest('Login as Super Admin', async () => {
    const res = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'testsuperadmin@example.com',
      password: 'TestAdmin123!'
    });
    if (!res.data.data.tokens.accessToken) throw new Error('No access token returned');
    token = res.data.data.tokens.accessToken;
  });

  if (!token) {
    console.log('\n❌ Cannot continue without authentication. Exiting.');
    process.exit(1);
  }

  // ============================================
  // MFA CONFIG ENDPOINTS
  // ============================================
  console.log('\n📋 SECTION 2: MFA Config Endpoints (/api/admin/mfa/config)\n');

  let originalConfig = null;

  await runTest('GET /api/admin/mfa/config', async () => {
    const res = await axios.get(`${API_URL}/api/admin/mfa/config`, { headers: authHeaders() });
    if (!res.data.success) throw new Error('Response not successful');
    if (!res.data.data) throw new Error('No data in response');
    originalConfig = res.data.data;
  });

  await runTest('GET /api/admin/mfa/config - has expected fields', async () => {
    const res = await axios.get(`${API_URL}/api/admin/mfa/config`, { headers: authHeaders() });
    const config = res.data.data.config || res.data.data;
    const requiredFields = ['mfa_mode', 'code_expiration_minutes', 'max_failed_attempts'];
    for (const field of requiredFields) {
      if (config[field] === undefined) throw new Error(`Missing field: ${field}`);
    }
  });

  await runTest('PUT /api/admin/mfa/config - update code_expiration_minutes', async () => {
    const res = await axios.put(`${API_URL}/api/admin/mfa/config`,
      { code_expiration_minutes: 10 },
      { headers: authHeaders() }
    );
    if (!res.data.success) throw new Error('Update failed');
  });

  await runTest('PUT /api/admin/mfa/config - restore original value', async () => {
    const original = originalConfig?.config?.code_expiration_minutes || 5;
    const res = await axios.put(`${API_URL}/api/admin/mfa/config`,
      { code_expiration_minutes: original },
      { headers: authHeaders() }
    );
    if (!res.data.success) throw new Error('Restore failed');
  });

  await runTest('PUT /api/admin/mfa/config - update mfa_mode', async () => {
    const res = await axios.put(`${API_URL}/api/admin/mfa/config`,
      { mfa_mode: 'totp_only' },
      { headers: authHeaders() }
    );
    if (!res.data.success) throw new Error('Update failed');
  });

  await runTest('PUT /api/admin/mfa/config - restore mfa_mode to disabled', async () => {
    const res = await axios.put(`${API_URL}/api/admin/mfa/config`,
      { mfa_mode: 'disabled' },
      { headers: authHeaders() }
    );
    if (!res.data.success) throw new Error('Restore failed');
  });

  await runTest('POST /api/admin/mfa/config/reset - reset to defaults', async () => {
    const res = await axios.post(`${API_URL}/api/admin/mfa/config/reset`, {}, { headers: authHeaders() });
    if (!res.data.success) throw new Error('Reset failed');
  });

  // ============================================
  // MFA ROLE CONFIG ENDPOINTS
  // ============================================
  console.log('\n📋 SECTION 3: MFA Role Config Endpoints (/api/admin/mfa/roles)\n');

  await runTest('GET /api/admin/mfa/roles', async () => {
    const res = await axios.get(`${API_URL}/api/admin/mfa/roles`, { headers: authHeaders() });
    if (!res.data.success) throw new Error('Response not successful');
  });

  await runTest('GET /api/admin/mfa/roles - returns array or object', async () => {
    const res = await axios.get(`${API_URL}/api/admin/mfa/roles`, { headers: authHeaders() });
    if (!res.data.data) throw new Error('No data returned');
  });

  await runTest('PUT /api/admin/mfa/roles/user - update user role config', async () => {
    const res = await axios.put(`${API_URL}/api/admin/mfa/roles/user`,
      { mfa_required: false },
      { headers: authHeaders() }
    );
    if (!res.data.success) throw new Error('Update failed');
  });

  await runTest('PUT /api/admin/mfa/roles/admin - update admin role config', async () => {
    const res = await axios.put(`${API_URL}/api/admin/mfa/roles/admin`,
      { mfa_required: false },
      { headers: authHeaders() }
    );
    if (!res.data.success) throw new Error('Update failed');
  });

  await runTest('PUT /api/admin/mfa/roles/super_admin - update super_admin role config', async () => {
    const res = await axios.put(`${API_URL}/api/admin/mfa/roles/super_admin`,
      { mfa_required: false },
      { headers: authHeaders() }
    );
    if (!res.data.success) throw new Error('Update failed');
  });

  // ============================================
  // MFA EMAIL TEMPLATE ENDPOINTS
  // ============================================
  console.log('\n📋 SECTION 4: MFA Email Template Endpoints (/api/admin/mfa/email-template)\n');

  await runTest('GET /api/admin/mfa/email-template', async () => {
    const res = await axios.get(`${API_URL}/api/admin/mfa/email-template`, { headers: authHeaders() });
    if (!res.data.success) throw new Error('Response not successful');
  });

  await runTest('GET /api/admin/mfa/email-template - has templates data', async () => {
    const res = await axios.get(`${API_URL}/api/admin/mfa/email-template`, { headers: authHeaders() });
    if (!res.data.data) throw new Error('No data in response');
  });

  // These may fail if no templates exist - skip gracefully
  await runTest('PUT /api/admin/mfa/email-template/1 - update template', async () => {
    const res = await axios.put(`${API_URL}/api/admin/mfa/email-template/1`,
      { subject_line: 'Your MFA Verification Code' },
      { headers: authHeaders() }
    );
    if (!res.data.success) throw new Error('Update failed');
  }, { skipOnError: ['Template not found', 'not found'] });

  await runTest('POST /api/admin/mfa/email-template/1/activate - activate template', async () => {
    const res = await axios.post(`${API_URL}/api/admin/mfa/email-template/1/activate`, {}, { headers: authHeaders() });
    if (!res.data.success) throw new Error('Activate failed');
  }, { skipOnError: ['Template not found', 'not found'] });

  await runTest('POST /api/admin/mfa/email-template/preview - preview template', async () => {
    const res = await axios.post(`${API_URL}/api/admin/mfa/email-template/preview`,
      { templateId: 1 },
      { headers: authHeaders() }
    );
    if (!res.data.success) throw new Error('Preview failed');
  }, { skipOnError: ['Template not found', 'not found'] });

  await runTest('POST /api/admin/mfa/email-template/reset - reset templates (super admin)', async () => {
    const res = await axios.post(`${API_URL}/api/admin/mfa/email-template/reset`, {}, { headers: authHeaders() });
    if (!res.data.success) throw new Error('Reset failed');
  });

  // ============================================
  // MFA USER MANAGEMENT ENDPOINTS
  // ============================================
  console.log('\n📋 SECTION 5: MFA User Management Endpoints\n');

  await runTest('GET /api/admin/mfa/pending-transitions', async () => {
    const res = await axios.get(`${API_URL}/api/admin/mfa/pending-transitions`, { headers: authHeaders() });
    if (!res.data.success) throw new Error('Response not successful');
  });

  await runTest('POST /api/admin/mfa/apply-change - apply method change', async () => {
    const res = await axios.post(`${API_URL}/api/admin/mfa/apply-change`,
      { behavior: 'immediate' },
      { headers: authHeaders() }
    );
    if (!res.data.success) throw new Error('Apply change failed');
  });

  await runTest('POST /api/admin/mfa/users/1/unlock - unlock user MFA', async () => {
    const res = await axios.post(`${API_URL}/api/admin/mfa/users/1/unlock`, {}, { headers: authHeaders() });
    if (!res.data.success) throw new Error('Unlock failed');
  });

  // ============================================
  // USER MFA STATUS ENDPOINTS
  // ============================================
  console.log('\n📋 SECTION 6: User MFA Status Endpoints (/api/auth/mfa)\n');

  await runTest('GET /api/auth/mfa/status - user MFA status', async () => {
    const res = await axios.get(`${API_URL}/api/auth/mfa/status`, { headers: authHeaders() });
    if (!res.data.success) throw new Error('Response not successful');
  });

  await runTest('GET /api/auth/mfa/status - has expected fields', async () => {
    const res = await axios.get(`${API_URL}/api/auth/mfa/status`, { headers: authHeaders() });
    const data = res.data.data;
    if (data.mfaEnabled === undefined) throw new Error('Missing mfaEnabled field');
    if (data.backupCodesRemaining === undefined) throw new Error('Missing backupCodesRemaining field');
  });

  await runTest('GET /api/auth/mfa/config - public MFA config', async () => {
    const res = await axios.get(`${API_URL}/api/auth/mfa/config`, { headers: authHeaders() });
    if (!res.data.success) throw new Error('Response not successful');
  });

  await runTest('GET /api/auth/mfa/trusted-devices - get trusted devices', async () => {
    const res = await axios.get(`${API_URL}/api/auth/mfa/trusted-devices`, { headers: authHeaders() });
    if (!res.data.success) throw new Error('Response not successful');
  });

  await runTest('GET /api/auth/mfa/preferences - get MFA preferences', async () => {
    const res = await axios.get(`${API_URL}/api/auth/mfa/preferences`, { headers: authHeaders() });
    if (!res.data.success) throw new Error('Response not successful');
  });

  await runTest('PUT /api/auth/mfa/preferences - update MFA preferences', async () => {
    const res = await axios.put(`${API_URL}/api/auth/mfa/preferences`,
      { preferredMethod: 'totp' },
      { headers: authHeaders() }
    );
    if (!res.data.success) throw new Error('Update failed');
  });

  // ============================================
  // EMAIL 2FA ENDPOINTS
  // ============================================
  console.log('\n📋 SECTION 7: Email 2FA Endpoints (/api/auth/mfa/email)\n');

  // Skip if email not verified (SES sandbox mode)
  await runTest('POST /api/auth/mfa/email/enable - enable email 2FA', async () => {
    const res = await axios.post(`${API_URL}/api/auth/mfa/email/enable`, {}, { headers: authHeaders() });
    if (!res.data.success) throw new Error('Enable failed');
  }, { skipOnError: ['Email address is not verified', 'Message rejected', 'SES'] });

  await runTest('POST /api/auth/mfa/email/disable - disable email 2FA', async () => {
    const res = await axios.post(`${API_URL}/api/auth/mfa/email/disable`,
      { password: 'TestAdmin123!' },
      { headers: authHeaders() }
    );
    if (!res.data.success) throw new Error('Disable failed');
  }, { skipOnError: ['Email address is not verified', 'Message rejected', 'SES', 'Email 2FA is not enabled'] });

  // ============================================
  // PERMISSION/ACCESS TESTS
  // ============================================
  console.log('\n📋 SECTION 8: Permission Tests\n');

  await runTest('GET /api/admin/mfa/config without auth - should fail 401', async () => {
    try {
      await axios.get(`${API_URL}/api/admin/mfa/config`);
      throw new Error('Should have returned 401');
    } catch (err) {
      if (err.response?.status !== 401) throw err;
    }
  });

  // ============================================
  // SUMMARY
  // ============================================
  console.log('\n' + '='.repeat(60));
  console.log('TEST RESULTS SUMMARY');
  console.log('='.repeat(60));
  const total = testResults.passed + testResults.failed + testResults.skipped;
  console.log(`Total Tests: ${total}`);
  console.log(`Passed: ${testResults.passed} ✅`);
  console.log(`Skipped: ${testResults.skipped} ⏭️ (infrastructure/data issues)`);
  console.log(`Failed: ${testResults.failed} ❌`);
  const effectiveTotal = testResults.passed + testResults.failed;
  console.log(`Pass Rate: ${effectiveTotal > 0 ? ((testResults.passed / effectiveTotal) * 100).toFixed(1) : 0}% (excluding skipped)`);

  if (testResults.errors.length > 0) {
    console.log('\n' + '='.repeat(60));
    console.log('FAILED TESTS DETAILS');
    console.log('='.repeat(60));
    testResults.errors.forEach((err, i) => {
      console.log(`\n${i + 1}. ${err.test}`);
      console.log(`   Status: ${err.status}`);
      console.log(`   Error: ${err.error}`);
      if (err.details) console.log(`   Details: ${err.details.substring(0, 100)}`);
    });
  }

  console.log('\n' + '='.repeat(60));
  console.log(testResults.failed === 0 ? '✅ ALL TESTS PASSED!' : `❌ ${testResults.failed} test(s) failed`);
  console.log('='.repeat(60));

  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
