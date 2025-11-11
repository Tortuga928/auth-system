/**
 * Story 9.2: Device Management Endpoints - Integration Tests
 *
 * Tests:
 * 1. GET /api/sessions - List all active sessions
 * 2. Current session marked with is_current: true
 * 3. Session metadata displayed correctly
 * 4. DELETE /api/sessions/:id - Revoke specific session
 * 5. Cannot revoke current session
 * 6. Cannot revoke another user's session
 * 7. POST /api/sessions/revoke-others - Revoke all except current
 * 8. Activity logging for revocations
 * 9. Session count after revocations
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000';

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  tests: [],
};

function logTest(name, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${name}`);
  if (details) console.log(`   ${details}`);

  results.tests.push({ name, passed, details });
  if (passed) results.passed++;
  else results.failed++;
}

// Helper to register a new user
async function register(userData) {
  try {
    const response = await axios.post(`${API_URL}/api/auth/register`, userData);
    return response.data;
  } catch (error) {
    throw new Error(`Registration failed: ${error.response?.data?.error || error.message}`);
  }
}

// Helper to login and get token
async function login(email, password, userAgent = null, ipHeader = null) {
  try {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (userAgent) {
      headers['User-Agent'] = userAgent;
    }

    if (ipHeader) {
      headers['X-Forwarded-For'] = ipHeader;
    }

    const response = await axios.post(
      `${API_URL}/api/auth/login`,
      { email, password },
      { headers }
    );

    if (response.data.data.mfaRequired) {
      throw new Error('MFA is enabled - use account without MFA');
    }

    return response.data.data.tokens.accessToken;
  } catch (error) {
    throw new Error(`Login failed: ${error.response?.data?.error || error.message}`);
  }
}

// Helper to make authenticated requests
function authenticatedRequest(token, userAgent = null) {
  const headers = {
    Authorization: `Bearer ${token}`,
  };

  if (userAgent) {
    headers['User-Agent'] = userAgent;
  }

  return axios.create({
    baseURL: API_URL,
    headers,
  });
}

async function runTests() {
  console.log('='.repeat(60));
  console.log('Story 9.2: Device Management - Integration Tests');
  console.log('='.repeat(60));
  console.log();

  // Create test users
  const timestamp = Date.now();
  const testUser1 = {
    username: `device${timestamp}`,
    email: `device${timestamp}@example.com`,
    password: 'Test123!@#',
  };

  const testUser2 = {
    username: `device2${timestamp}`,
    email: `device2${timestamp}@example.com`,
    password: 'Test123!@#',
  };

  try {
    // Setup: Register test users
    console.log('Setup: Creating test users...');
    try {
      await register(testUser1);
      logTest('0.1 Test user 1 created', true, 'Created device management test user 1');
      await register(testUser2);
      logTest('0.2 Test user 2 created', true, 'Created device management test user 2');
    } catch (error) {
      logTest('0.1 Test user 1 created', false, error.message);
      return;
    }

    // ========================================
    // SESSION LISTING TESTS
    // ========================================

    console.log('\n' + '='.repeat(60));
    console.log('SESSION LISTING');
    console.log('='.repeat(60));

    // Test 1: Get sessions for user with single session
    console.log('\nTest 1: Get sessions for user with single session');
    let token1, sessionsList;
    try {
      const chromeUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0';
      token1 = await login(testUser1.email, testUser1.password, chromeUA);

      const api = authenticatedRequest(token1, chromeUA);
      const response = await api.get('/api/sessions');

      logTest('1.1 GET /api/sessions successful', response.data.success, 'Got session list');

      sessionsList = response.data.data.sessions;
      logTest('1.2 Single session returned', sessionsList.length === 1, `Found ${sessionsList.length} session(s)`);

      if (sessionsList.length > 0) {
        const session = sessionsList[0];
        logTest('1.3 Session has all required fields',
          session.id && session.device_name && session.browser && session.os,
          'All metadata present'
        );
        logTest('1.4 Current session marked correctly',
          session.is_current === true,
          `is_current: ${session.is_current}`
        );
      } else {
        logTest('1.3 Session has all required fields', false, 'No sessions to check');
        logTest('1.4 Current session marked correctly', false, 'No sessions to check');
      }
    } catch (error) {
      logTest('1.1 GET /api/sessions successful', false, error.message);
      logTest('1.2 Single session returned', false, 'Skipped');
      logTest('1.3 Session has all required fields', false, 'Skipped');
      logTest('1.4 Current session marked correctly', false, 'Skipped');
    }

    // Test 2: Create multiple sessions from different devices
    console.log('\nTest 2: Create multiple sessions from different devices');
    let token2, token3;
    try {
      const safariUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) AppleWebKit/605.1.15 Safari/604.1';
      const firefoxUA = 'Mozilla/5.0 (X11; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0';

      // Login from Safari
      token2 = await login(testUser1.email, testUser1.password, safariUA);
      logTest('2.1 Login from Safari successful', !!token2, 'Got Safari token');

      // Login from Firefox
      token3 = await login(testUser1.email, testUser1.password, firefoxUA);
      logTest('2.2 Login from Firefox successful', !!token3, 'Got Firefox token');

      // Get sessions (should have 3 total now)
      const api = authenticatedRequest(token1);
      const response = await api.get('/api/sessions');

      const sessions = response.data.data.sessions;
      logTest('2.3 Multiple sessions returned', sessions.length === 3, `Found ${sessions.length} session(s)`);

      // Verify different device types are detected
      const deviceTypes = sessions.map(s => s.device_type);
      const hasDesktop = deviceTypes.includes('desktop');
      const hasMobile = deviceTypes.includes('mobile');

      logTest('2.4 Different device types detected',
        hasDesktop && hasMobile,
        `Device types: ${[...new Set(deviceTypes)].join(', ')}`
      );
    } catch (error) {
      logTest('2.1 Login from Safari successful', false, error.message);
      logTest('2.2 Login from Firefox successful', false, 'Skipped');
      logTest('2.3 Multiple sessions returned', false, 'Skipped');
      logTest('2.4 Different device types detected', false, 'Skipped');
    }

    // ========================================
    // SESSION REVOCATION TESTS
    // ========================================

    console.log('\n' + '='.repeat(60));
    console.log('SESSION REVOCATION');
    console.log('='.repeat(60));

    // Test 3: Revoke specific session
    console.log('\nTest 3: Revoke specific session');
    try {
      const api = authenticatedRequest(token1);
      const sessionsResponse = await api.get('/api/sessions');
      const sessions = sessionsResponse.data.data.sessions;

      // Find a non-current session to revoke
      const sessionToRevoke = sessions.find(s => !s.is_current);

      if (sessionToRevoke) {
        const deleteResponse = await api.delete(`/api/sessions/${sessionToRevoke.id}`);

        logTest('3.1 DELETE /api/sessions/:id successful',
          deleteResponse.data.success,
          `Revoked session ${sessionToRevoke.id}`
        );

        // Verify session was removed
        const afterResponse = await api.get('/api/sessions');
        const afterSessions = afterResponse.data.data.sessions;
        const stillExists = afterSessions.find(s => s.id === sessionToRevoke.id);

        logTest('3.2 Session removed from list',
          !stillExists,
          `${afterSessions.length} sessions remaining`
        );
      } else {
        logTest('3.1 DELETE /api/sessions/:id successful', false, 'No non-current session to revoke');
        logTest('3.2 Session removed from list', false, 'Skipped');
      }
    } catch (error) {
      logTest('3.1 DELETE /api/sessions/:id successful', false, error.message);
      logTest('3.2 Session removed from list', false, 'Skipped');
    }

    // Test 4: Cannot revoke current session
    console.log('\nTest 4: Cannot revoke current session');
    try {
      const chromeUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0';
      const api = authenticatedRequest(token1, chromeUA);

      const sessionsResponse = await api.get('/api/sessions');
      const sessions = sessionsResponse.data.data.sessions;
      const currentSession = sessions.find(s => s.is_current);

      if (currentSession) {
        try {
          await api.delete(`/api/sessions/${currentSession.id}`);
          logTest('4.1 Prevented revoking current session', false, 'Should have been blocked');
        } catch (error) {
          const blocked = error.response?.status === 400 &&
                         error.response?.data?.message?.includes('Cannot revoke current session');
          logTest('4.1 Prevented revoking current session', blocked, 'Got 400 error as expected');
        }
      } else {
        logTest('4.1 Prevented revoking current session', false, 'No current session found');
      }
    } catch (error) {
      logTest('4.1 Prevented revoking current session', false, error.message);
    }

    // Test 5: Cannot revoke another user's session
    console.log('\nTest 5: Cannot revoke another user\'s session');
    try {
      // Login as user 2
      const user2Token = await login(testUser2.email, testUser2.password);
      const user2Api = authenticatedRequest(user2Token);

      // Get user 2's sessions
      const user2SessionsResponse = await user2Api.get('/api/sessions');
      const user2Session = user2SessionsResponse.data.data.sessions[0];

      // Try to revoke user 2's session using user 1's token
      const user1Api = authenticatedRequest(token1);

      try {
        await user1Api.delete(`/api/sessions/${user2Session.id}`);
        logTest('5.1 Prevented cross-user session revocation', false, 'Should have been blocked');
      } catch (error) {
        const blocked = error.response?.status === 403 &&
                       error.response?.data?.message?.includes('Unauthorized');
        logTest('5.1 Prevented cross-user session revocation', blocked, 'Got 403 error as expected');
      }
    } catch (error) {
      logTest('5.1 Prevented cross-user session revocation', false, error.message);
    }

    // Test 6: Invalid session ID
    console.log('\nTest 6: Invalid session ID');
    try {
      const api = authenticatedRequest(token1);

      try {
        await api.delete('/api/sessions/99999');
        logTest('6.1 Invalid session ID rejected', false, 'Should have returned 404');
      } catch (error) {
        const notFound = error.response?.status === 404;
        logTest('6.1 Invalid session ID rejected', notFound, 'Got 404 as expected');
      }
    } catch (error) {
      logTest('6.1 Invalid session ID rejected', false, error.message);
    }

    // ========================================
    // REVOKE ALL OTHER SESSIONS TESTS
    // ========================================

    console.log('\n' + '='.repeat(60));
    console.log('REVOKE ALL OTHER SESSIONS');
    console.log('='.repeat(60));

    // Test 7: Revoke all other sessions
    console.log('\nTest 7: Revoke all other sessions');
    try {
      // Login from multiple devices to have multiple sessions
      const chromeUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0';
      const safariUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) AppleWebKit/605.1.15 Safari/604.1';
      const firefoxUA = 'Mozilla/5.0 (X11; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0';

      // Create the "current" session that we want to keep
      const currentToken = await login(testUser1.email, testUser1.password, chromeUA);

      // Create other sessions
      await login(testUser1.email, testUser1.password, safariUA);
      await login(testUser1.email, testUser1.password, firefoxUA);

      // Now revoke all except current (using same UA as current token)
      const api = authenticatedRequest(currentToken, chromeUA);
      const beforeResponse = await api.get('/api/sessions');
      const sessionCountBefore = beforeResponse.data.data.sessions.length;

      logTest('7.1 Multiple sessions exist before revoke',
        sessionCountBefore >= 2,
        `${sessionCountBefore} sessions before revoke`
      );

      const revokeResponse = await api.post('/api/sessions/revoke-others');

      logTest('7.2 POST /api/sessions/revoke-others successful',
        revokeResponse.data.success,
        `Revoked ${revokeResponse.data.data.revokedCount} sessions`
      );

      // Verify only 1 session remains
      const afterResponse = await api.get('/api/sessions');
      const sessionsAfter = afterResponse.data.data.sessions;

      logTest('7.3 Only current session remains',
        sessionsAfter.length === 1,
        `${sessionsAfter.length} session(s) remaining`
      );

      if (sessionsAfter.length === 1) {
        logTest('7.4 Remaining session is current',
          sessionsAfter[0].is_current === true,
          'Current session preserved'
        );
      } else {
        logTest('7.4 Remaining session is current', false, 'Wrong number of sessions');
      }
    } catch (error) {
      logTest('7.1 Multiple sessions exist before revoke', false, error.message);
      logTest('7.2 POST /api/sessions/revoke-others successful', false, 'Skipped');
      logTest('7.3 Only current session remains', false, 'Skipped');
      logTest('7.4 Remaining session is current', false, 'Skipped');
    }

    // Test 8: Revoke all when only one session exists
    console.log('\nTest 8: Revoke all when only one session exists');
    try {
      const api = authenticatedRequest(token1);
      const response = await api.post('/api/sessions/revoke-others');

      logTest('8.1 Handles single session gracefully',
        response.data.success && response.data.data.revokedCount === 0,
        `Revoked ${response.data.data.revokedCount} sessions (expected 0)`
      );
    } catch (error) {
      logTest('8.1 Handles single session gracefully', false, error.message);
    }

    // ========================================
    // ACTIVITY LOGGING TESTS
    // ========================================

    console.log('\n' + '='.repeat(60));
    console.log('ACTIVITY LOGGING');
    console.log('='.repeat(60));

    // Test 9: Session revocation is logged
    console.log('\nTest 9: Session revocation is logged');
    try {
      // Create a session to revoke
      const safariUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) AppleWebKit/605.1.15 Safari/604.1';
      await login(testUser1.email, testUser1.password, safariUA);

      // Get activity before revocation
      const api = authenticatedRequest(token1);
      const beforeActivity = await api.get('/api/user/activity');
      const activityCountBefore = beforeActivity.data.data.logs.length;

      // Revoke the session
      const sessionsResponse = await api.get('/api/sessions');
      const sessionToRevoke = sessionsResponse.data.data.sessions.find(s => !s.is_current);

      if (sessionToRevoke) {
        await api.delete(`/api/sessions/${sessionToRevoke.id}`);

        // Check activity log
        const afterActivity = await api.get('/api/user/activity');
        const activities = afterActivity.data.data.logs;
        const activityCountAfter = activities.length;

        logTest('9.1 Activity log entry created',
          activityCountAfter > activityCountBefore,
          `${activityCountAfter - activityCountBefore} new entry`
        );

        // Find the session_revoked entry
        const revokeEntry = activities.find(a => a.action === 'session_revoked');
        logTest('9.2 Revocation action logged',
          !!revokeEntry,
          revokeEntry ? 'Found session_revoked action' : 'Not found'
        );
      } else {
        logTest('9.1 Activity log entry created', false, 'No session to revoke');
        logTest('9.2 Revocation action logged', false, 'Skipped');
      }
    } catch (error) {
      logTest('9.1 Activity log entry created', false, error.message);
      logTest('9.2 Revocation action logged', false, 'Skipped');
    }

    // Test 10: Revoke-all is logged
    console.log('\nTest 10: Revoke-all is logged');
    try {
      // Create multiple sessions
      const safariUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) AppleWebKit/605.1.15 Safari/604.1';
      const firefoxUA = 'Mozilla/5.0 (X11; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0';

      await login(testUser1.email, testUser1.password, safariUA);
      await login(testUser1.email, testUser1.password, firefoxUA);

      const api = authenticatedRequest(token1);

      // Revoke all others
      await api.post('/api/sessions/revoke-others');

      // Check activity log
      const activityResponse = await api.get('/api/user/activity');
      const activities = activityResponse.data.data.logs;

      const revokeAllEntry = activities.find(a => a.action === 'all_other_sessions_revoked');
      logTest('10.1 Revoke-all action logged',
        !!revokeAllEntry,
        revokeAllEntry ? 'Found all_other_sessions_revoked action' : 'Not found'
      );

      if (revokeAllEntry && revokeAllEntry.metadata) {
        const hasCount = 'revoked_count' in revokeAllEntry.metadata;
        logTest('10.2 Revocation count included',
          hasCount,
          hasCount ? `Count: ${revokeAllEntry.metadata.revoked_count}` : 'Count missing'
        );
      } else {
        logTest('10.2 Revocation count included', false, 'No metadata');
      }
    } catch (error) {
      logTest('10.1 Revoke-all action logged', false, error.message);
      logTest('10.2 Revocation count included', false, 'Skipped');
    }

  } catch (error) {
    console.error('\n❌ Unexpected error:', error.message);
  }

  // Final report
  console.log('\n' + '='.repeat(60));
  console.log('Test Summary');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${results.passed + results.failed}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(
    `Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`
  );
  console.log('='.repeat(60));

  if (results.failed > 0) {
    console.log('\nFailed Tests:');
    results.tests
      .filter((t) => !t.passed)
      .forEach((t) => console.log(`  - ${t.name}: ${t.details}`));
  }

  console.log('\n✅ Story 9.2 testing complete!');
  console.log('\n📝 Next: Story 9.3 - Login History & Security Events');

  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
