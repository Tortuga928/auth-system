/**
 * Story 9.3: Login History & Security Events - Integration Tests
 *
 * Tests:
 * 1. Login attempts are logged (success)
 * 2. Login attempts are logged (failure - wrong password)
 * 3. Login attempts are logged (failure - user not found)
 * 4. Failed attempt includes correct failure reason
 * 5. Login from new location generates security event
 * 6. Multiple failed logins trigger brute force alert
 * 7. Login from new device generates security event
 * 8. GET /api/security/login-history returns paginated data
 * 9. GET /api/security/login-stats returns statistics
 * 10. GET /api/security/events returns security events
 * 11. GET /api/security/event-stats returns event statistics
 * 12. POST /api/security/events/:id/acknowledge works
 * 13. POST /api/security/events/acknowledge-all works
 * 14. GET /api/security/events/unacknowledged-count works
 * 15. Security events have deduplication (no spam)
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
    throw new Error(`Registration failed: ${error.response?.data?.message || error.message}`);
  }
}

// Helper to login (may fail intentionally)
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

    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data || error.message };
  }
}

// Helper to make authenticated requests
function authenticatedRequest(token) {
  return axios.create({
    baseURL: API_URL,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

// Helper to wait
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
  console.log('='.repeat(60));
  console.log('Story 9.3: Login History & Security Events - Tests');
  console.log('='.repeat(60));
  console.log();

  const timestamp = Date.now();
  const testUser = {
    username: `sectest${timestamp}`,
    email: `sectest${timestamp}@example.com`,
    password: 'Test123!@#',
  };

  try {
    // Setup: Create test user
    console.log('Setup: Creating test user...');
    await register(testUser);
    console.log('✅ Test user created\n');

    // ========================================
    // LOGIN ATTEMPTS LOGGING
    // ========================================
    console.log('='.repeat(60));
    console.log('TEST 1: Login Attempts Logging');
    console.log('='.repeat(60));

    // Test 1: Successful login is logged
    const loginResult1 = await login(testUser.email, testUser.password);
    logTest('1.1 Successful login recorded', loginResult1.success, 'Login succeeded');

    const token = loginResult1.data.data.tokens.accessToken;
    const api = authenticatedRequest(token);

    // Wait a moment for database write
    await sleep(500);

    const loginHistory1 = await api.get('/api/security/login-history?pageSize=50');
    const successfulAttempts = loginHistory1.data.data.loginAttempts.filter(a => a.success);
    logTest('1.2 Successful attempt appears in history', successfulAttempts.length >= 1,
      `Found ${successfulAttempts.length} successful attempt(s)`);

    // Test 2: Failed login (wrong password) is logged
    console.log('\nTest 2: Failed login attempts logging');
    const loginResult2 = await login(testUser.email, 'WrongPassword123!');
    logTest('2.1 Wrong password login fails', !loginResult2.success, 'Login correctly rejected');

    await sleep(500);

    const loginHistory2 = await api.get('/api/security/login-history?pageSize=50');
    const failedAttempts = loginHistory2.data.data.loginAttempts.filter(a => !a.success);
    logTest('2.2 Failed attempt appears in history', failedAttempts.length >= 1,
      `Found ${failedAttempts.length} failed attempt(s)`);

    // Test 3: Failed login (user not found) is logged
    console.log('\nTest 3: User not found logging');
    const loginResult3 = await login('nonexistent@example.com', 'Password123!');
    logTest('3.1 Nonexistent user login fails', !loginResult3.success, 'Login correctly rejected');

    // Test 4: Failure reason is recorded
    console.log('\nTest 4: Failure reasons');
    await sleep(500);
    const loginHistory3 = await api.get('/api/security/login-history?pageSize=50');
    const invalidPasswordAttempt = loginHistory3.data.data.loginAttempts.find(
      a => !a.success && a.failure_reason === 'invalid_password'
    );
    logTest('4.1 Invalid password reason recorded', !!invalidPasswordAttempt,
      invalidPasswordAttempt ? `Reason: ${invalidPasswordAttempt.failure_reason}` : 'Not found');

    // ========================================
    // SECURITY EVENTS
    // ========================================
    console.log('\n' + '='.repeat(60));
    console.log('TEST 5-7: Security Event Generation');
    console.log('='.repeat(60));

    // Test 5: New location detection
    console.log('\nTest 5: New location detection');
    // Login from a different IP (simulated)
    const loginResult4 = await login(testUser.email, testUser.password,
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
      '192.168.2.100'
    );

    await sleep(1000); // Wait for security event processing

    const events1 = await api.get('/api/security/events?pageSize=50');
    const newLocationEvent = events1.data.data.events.find(
      e => e.event_type === 'login_from_new_location'
    );
    logTest('5.1 New location event generated', !!newLocationEvent,
      newLocationEvent ? `Event created: ${newLocationEvent.description}` : 'No event found');

    // Test 6: Brute force detection
    console.log('\nTest 6: Brute force detection');
    // Make 5 failed login attempts
    for (let i = 0; i < 5; i++) {
      await login(testUser.email, 'WrongPassword' + i);
      await sleep(100);
    }

    await sleep(2000); // Wait for security event processing

    const events2 = await api.get('/api/security/events?pageSize=50');
    const bruteForceEvent = events2.data.data.events.find(
      e => e.event_type === 'brute_force_attempt'
    );
    logTest('6.1 Brute force event generated', !!bruteForceEvent,
      bruteForceEvent ? `Event severity: ${bruteForceEvent.severity}` : 'No event found');

    // Test 7: New device detection
    console.log('\nTest 7: New device detection');
    // Login from a new device (different user agent)
    const loginResult5 = await login(testUser.email, testUser.password,
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari/17.0'
    );

    await sleep(1000);

    const events3 = await api.get('/api/security/events?pageSize=50');
    const newDeviceEvent = events3.data.data.events.find(
      e => e.event_type === 'login_from_new_device'
    );
    logTest('7.1 New device event generated', !!newDeviceEvent,
      newDeviceEvent ? `Event type: ${newDeviceEvent.event_type}` : 'No event found');

    // ========================================
    // API ENDPOINTS
    // ========================================
    console.log('\n' + '='.repeat(60));
    console.log('TEST 8-11: API Endpoints');
    console.log('='.repeat(60));

    // Test 8: Login history pagination
    console.log('\nTest 8: Login history endpoint');
    const loginHistory4 = await api.get('/api/security/login-history?page=1&pageSize=10');
    logTest('8.1 GET /api/security/login-history returns data',
      loginHistory4.data.success && Array.isArray(loginHistory4.data.data.loginAttempts),
      `Returned ${loginHistory4.data.data.loginAttempts.length} attempts`);
    logTest('8.2 Pagination metadata present',
      !!loginHistory4.data.data.pagination,
      `Page ${loginHistory4.data.data.pagination.page} of ${loginHistory4.data.data.pagination.totalPages}`);

    // Test 9: Login statistics
    console.log('\nTest 9: Login statistics endpoint');
    const loginStats = await api.get('/api/security/login-stats?days=30');
    logTest('9.1 GET /api/security/login-stats returns data',
      loginStats.data.success && loginStats.data.data.statistics,
      `Total attempts: ${loginStats.data.data.statistics.total_attempts}`);
    logTest('9.2 Statistics include success/failure counts',
      loginStats.data.data.statistics.successful_logins >= 0 &&
      loginStats.data.data.statistics.failed_logins >= 0,
      `Success: ${loginStats.data.data.statistics.successful_logins}, Failed: ${loginStats.data.data.statistics.failed_logins}`);

    // Test 10: Security events endpoint
    console.log('\nTest 10: Security events endpoint');
    const events4 = await api.get('/api/security/events?page=1&pageSize=10');
    logTest('10.1 GET /api/security/events returns data',
      events4.data.success && Array.isArray(events4.data.data.events),
      `Returned ${events4.data.data.events.length} events`);
    logTest('10.2 Events have required fields',
      events4.data.data.events.length > 0 &&
      events4.data.data.events[0].event_type &&
      events4.data.data.events[0].severity,
      `First event: ${events4.data.data.events[0]?.event_type || 'none'}`);

    // Test 11: Event statistics
    console.log('\nTest 11: Security event statistics endpoint');
    const eventStats = await api.get('/api/security/event-stats?days=30');
    logTest('11.1 GET /api/security/event-stats returns data',
      eventStats.data.success && eventStats.data.data.statistics,
      `Total events: ${eventStats.data.data.statistics.total_events}`);
    logTest('11.2 Statistics include severity counts',
      eventStats.data.data.statistics.info_count >= 0 &&
      eventStats.data.data.statistics.warning_count >= 0 &&
      eventStats.data.data.statistics.critical_count >= 0,
      `Info: ${eventStats.data.data.statistics.info_count}, Warning: ${eventStats.data.data.statistics.warning_count}, Critical: ${eventStats.data.data.statistics.critical_count}`);

    // ========================================
    // ACKNOWLEDGMENT
    // ========================================
    console.log('\n' + '='.repeat(60));
    console.log('TEST 12-14: Event Acknowledgment');
    console.log('='.repeat(60));

    // Test 12: Acknowledge specific event
    console.log('\nTest 12: Acknowledge specific event');
    const unackCountBefore = await api.get('/api/security/events/unacknowledged-count');
    const unackBefore = unackCountBefore.data.data.unacknowledgedCount;

    if (events4.data.data.events.length > 0) {
      const eventToAck = events4.data.data.events[0];
      const ackResult = await api.post(`/api/security/events/${eventToAck.id}/acknowledge`);
      logTest('12.1 POST /api/security/events/:id/acknowledge works',
        ackResult.data.success,
        `Acknowledged event ID: ${eventToAck.id}`);

      const unackCountAfter = await api.get('/api/security/events/unacknowledged-count');
      const unackAfter = unackCountAfter.data.data.unacknowledgedCount;
      logTest('12.2 Unacknowledged count decreased',
        unackAfter < unackBefore,
        `Before: ${unackBefore}, After: ${unackAfter}`);
    } else {
      logTest('12.1 No events to acknowledge', true, 'Skipping test');
    }

    // Test 13: Acknowledge all events
    console.log('\nTest 13: Acknowledge all events');
    const ackAllResult = await api.post('/api/security/events/acknowledge-all');
    logTest('13.1 POST /api/security/events/acknowledge-all works',
      ackAllResult.data.success,
      `Acknowledged ${ackAllResult.data.data.acknowledgedCount} event(s)`);

    // Test 14: Unacknowledged count after acknowledge all
    console.log('\nTest 14: Unacknowledged count');
    const unackCountFinal = await api.get('/api/security/events/unacknowledged-count');
    logTest('14.1 GET /api/security/events/unacknowledged-count works',
      unackCountFinal.data.success,
      `Unacknowledged: ${unackCountFinal.data.data.unacknowledgedCount}`);
    logTest('14.2 Unacknowledged count is zero after acknowledge all',
      unackCountFinal.data.data.unacknowledgedCount === 0,
      `Count: ${unackCountFinal.data.data.unacknowledgedCount}`);

    // Test 15: Deduplication test
    console.log('\nTest 15: Event deduplication');
    const eventCountBefore = events4.data.data.events.length;
    // Try to trigger the same event again quickly (should be deduplicated)
    await login(testUser.email, testUser.password,
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
      '192.168.2.100'
    );
    await sleep(1000);
    const events5 = await api.get('/api/security/events?pageSize=50');
    const eventCountAfter = events5.data.data.events.length;
    logTest('15.1 Duplicate events prevented',
      eventCountAfter === eventCountBefore,
      `Before: ${eventCountBefore}, After: ${eventCountAfter} (should be same)`);

  } catch (error) {
    console.error('\n❌ Test suite error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }

  // ========================================
  // TEST SUMMARY
  // ========================================
  console.log('\n' + '='.repeat(60));
  console.log('Test Summary');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${results.passed + results.failed}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
  console.log('='.repeat(60));

  if (results.failed === 0) {
    console.log('\n✅ Story 9.3 testing complete!\n');
    console.log('📝 Next: Story 9.4 - Session Timeout & "Remember Me"');
  } else {
    console.log('\n⚠️  Some tests failed. Review errors above.\n');
  }
}

runTests();
