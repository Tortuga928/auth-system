/**
 * Phase 9: Session Management & Security - Comprehensive Test Suite
 *
 * Tests Stories 9.1, 9.2, and 9.3 together
 * Provides real-time progress and final report
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000';

// Test categories
const categories = {
  sessionMetadata: { name: 'Session Metadata (9.1)', tests: [], passed: 0, failed: 0 },
  deviceManagement: { name: 'Device Management (9.2)', tests: [], passed: 0, failed: 0 },
  loginHistory: { name: 'Login History (9.3)', tests: [], passed: 0, failed: 0 },
  securityEvents: { name: 'Security Events (9.3)', tests: [], passed: 0, failed: 0 },
};

// Overall results
const results = {
  totalTests: 0,
  totalPassed: 0,
  totalFailed: 0,
  startTime: null,
  endTime: null,
};

function logProgress(message, type = 'info') {
  const icons = {
    info: '📋',
    success: '✅',
    error: '❌',
    warning: '⚠️',
    test: '🧪',
    stats: '📊',
  };
  console.log(`${icons[type] || '📋'} ${message}`);
}

function logTest(category, name, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`   ${status}: ${name}`);
  if (details) console.log(`      ${details}`);

  categories[category].tests.push({ name, passed, details });
  if (passed) {
    categories[category].passed++;
    results.totalPassed++;
  } else {
    categories[category].failed++;
    results.totalFailed++;
  }
  results.totalTests++;
}

// Helper functions
async function register(userData) {
  const response = await axios.post(`${API_URL}/api/auth/register`, userData);
  return response.data;
}

async function login(email, password, userAgent = null, ipHeader = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (userAgent) headers['User-Agent'] = userAgent;
  if (ipHeader) headers['X-Forwarded-For'] = ipHeader;

  try {
    const response = await axios.post(
      `${API_URL}/api/auth/login`,
      { email, password },
      { headers }
    );
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data };
  }
}

function authenticatedRequest(token, userAgent = null) {
  const headers = { Authorization: `Bearer ${token}` };
  if (userAgent) {
    headers['User-Agent'] = userAgent;
  }
  return axios.create({
    baseURL: API_URL,
    headers,
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
  results.startTime = new Date();

  console.log('\n' + '═'.repeat(70));
  console.log('🚀 PHASE 9: SESSION MANAGEMENT & SECURITY - COMPREHENSIVE TEST');
  console.log('═'.repeat(70));
  console.log(`📅 Started: ${results.startTime.toLocaleString()}`);
  console.log('═'.repeat(70));
  console.log();

  const timestamp = Date.now();
  const testUser = {
    username: `phase9test${timestamp}`,
    email: `phase9test${timestamp}@example.com`,
    password: 'Test123!@#Phase9',
  };

  let token = null;
  let api = null;

  try {
    // ============================================
    // SETUP
    // ============================================
    logProgress('Setting up test environment...', 'info');
    await register(testUser);
    logProgress('Test user created successfully', 'success');
    console.log();

    // ============================================
    // STORY 9.1: SESSION METADATA TRACKING
    // ============================================
    console.log('═'.repeat(70));
    logProgress('Testing Story 9.1: Session Metadata Tracking', 'test');
    console.log('═'.repeat(70));

    // Test 1: Login creates session with metadata
    logProgress('Test 1: Login with metadata capture...', 'info');
    const initialUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0';
    const login1 = await login(testUser.email, testUser.password, initialUserAgent);

    logTest('sessionMetadata', '1.1 Login successful', login1.success);

    if (login1.success) {
      token = login1.data.data.tokens.accessToken;
      api = authenticatedRequest(token, initialUserAgent);
    }

    await sleep(500);

    // Test 2: Session metadata fields
    logProgress('Test 2: Verifying session metadata...', 'info');
    const sessions1 = await api.get('/api/sessions');
    const session = sessions1.data.data.sessions[0];

    logTest('sessionMetadata', '2.1 Session has device_name', !!session.device_name,
      `Device: ${session.device_name}`);
    logTest('sessionMetadata', '2.2 Session has browser', !!session.browser,
      `Browser: ${session.browser}`);
    logTest('sessionMetadata', '2.3 Session has OS', !!session.os,
      `OS: ${session.os}`);
    logTest('sessionMetadata', '2.4 Session has device_type', !!session.device_type,
      `Type: ${session.device_type}`);
    logTest('sessionMetadata', '2.5 Session has location', !!session.location,
      `Location: ${session.location}`);
    logTest('sessionMetadata', '2.6 Session has IP address', !!session.ip_address,
      `IP: ${session.ip_address}`);
    logTest('sessionMetadata', '2.7 Session has last_activity_at', !!session.last_activity_at,
      `Activity: ${session.last_activity_at}`);

    // Test 3: Current session identification
    logProgress('Test 3: Current session identification...', 'info');
    logTest('sessionMetadata', '3.1 Current session marked correctly', session.is_current === true);

    console.log();

    // ============================================
    // STORY 9.2: DEVICE MANAGEMENT
    // ============================================
    console.log('═'.repeat(70));
    logProgress('Testing Story 9.2: Device Management', 'test');
    console.log('═'.repeat(70));

    // Test 4: List all sessions
    logProgress('Test 4: Session listing...', 'info');
    const sessions2 = await api.get('/api/sessions');
    logTest('deviceManagement', '4.1 GET /api/sessions returns data',
      sessions2.data.success && Array.isArray(sessions2.data.data.sessions),
      `Found ${sessions2.data.data.sessions.length} session(s)`);

    // Test 5: Create multiple sessions
    logProgress('Test 5: Creating multiple sessions from different devices...', 'info');
    const login2 = await login(testUser.email, testUser.password,
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari/17.0');
    logTest('deviceManagement', '5.1 Mobile login successful', login2.success);

    const login3 = await login(testUser.email, testUser.password,
      'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) Safari/17.0');
    logTest('deviceManagement', '5.2 Tablet login successful', login3.success);

    await sleep(500);

    const sessions3 = await api.get('/api/sessions');
    logTest('deviceManagement', '5.3 Multiple sessions created',
      sessions3.data.data.sessions.length >= 3,
      `Total sessions: ${sessions3.data.data.sessions.length}`);

    // Test 6: Device type detection
    logProgress('Test 6: Device type detection...', 'info');
    const deviceTypes = sessions3.data.data.sessions.map(s => s.device_type);
    const hasDesktop = deviceTypes.includes('desktop');
    const hasMobile = deviceTypes.includes('mobile');
    logTest('deviceManagement', '6.1 Desktop device detected', hasDesktop);
    logTest('deviceManagement', '6.2 Mobile device detected', hasMobile);

    // Test 7: Revoke specific session
    logProgress('Test 7: Revoking specific session...', 'info');
    const sessionToRevoke = sessions3.data.data.sessions.find(s => !s.is_current);
    if (sessionToRevoke) {
      try {
        await api.delete(`/api/sessions/${sessionToRevoke.id}`);
        logTest('deviceManagement', '7.1 DELETE /api/sessions/:id successful', true,
          `Revoked session ID: ${sessionToRevoke.id}`);

        await sleep(500);
        const sessions4 = await api.get('/api/sessions');
        logTest('deviceManagement', '7.2 Session removed from list',
          sessions4.data.data.sessions.length < sessions3.data.data.sessions.length,
          `Before: ${sessions3.data.data.sessions.length}, After: ${sessions4.data.data.sessions.length}`);
      } catch (error) {
        logTest('deviceManagement', '7.1 DELETE /api/sessions/:id failed', false, error.message);
      }
    }

    // Test 8: Cannot revoke current session
    logProgress('Test 8: Attempting to revoke current session (should fail)...', 'info');
    const currentSession = sessions3.data.data.sessions.find(s => s.is_current);
    try {
      await api.delete(`/api/sessions/${currentSession.id}`);
      logTest('deviceManagement', '8.1 Current session revoke prevented', false,
        'Should have returned error but succeeded');
    } catch (error) {
      logTest('deviceManagement', '8.1 Current session revoke prevented',
        error.response?.status === 400,
        'Correctly rejected with 400');
    }

    // Test 9: Revoke all other sessions
    logProgress('Test 9: Revoking all other sessions...', 'info');
    const sessions5 = await api.get('/api/sessions');
    const countBefore = sessions5.data.data.sessions.length;

    const revokeAllResult = await api.post('/api/sessions/revoke-others');
    logTest('deviceManagement', '9.1 POST /api/sessions/revoke-others successful',
      revokeAllResult.data.success,
      `Revoked ${revokeAllResult.data.data.revokedCount} session(s)`);

    await sleep(500);
    const sessions6 = await api.get('/api/sessions');
    logTest('deviceManagement', '9.2 Only current session remains',
      sessions6.data.data.sessions.length === 1,
      `Sessions remaining: ${sessions6.data.data.sessions.length}`);
    logTest('deviceManagement', '9.3 Remaining session is current',
      sessions6.data.data.sessions[0].is_current === true);

    console.log();

    // ============================================
    // STORY 9.3: LOGIN HISTORY
    // ============================================
    console.log('═'.repeat(70));
    logProgress('Testing Story 9.3: Login History', 'test');
    console.log('═'.repeat(70));

    // Test 10: Login attempts are logged
    logProgress('Test 10: Login attempt logging...', 'info');
    const loginHistory1 = await api.get('/api/security/login-history?pageSize=50');
    logTest('loginHistory', '10.1 GET /api/security/login-history successful',
      loginHistory1.data.success && Array.isArray(loginHistory1.data.data.loginAttempts),
      `Found ${loginHistory1.data.data.loginAttempts.length} login attempts`);

    const successfulLogins = loginHistory1.data.data.loginAttempts.filter(a => a.success);
    logTest('loginHistory', '10.2 Successful logins recorded',
      successfulLogins.length >= 3,
      `${successfulLogins.length} successful logins`);

    // Test 11: Failed login attempts
    logProgress('Test 11: Testing failed login logging...', 'info');
    await login(testUser.email, 'WrongPassword123!');
    await login(testUser.email, 'AnotherWrong123!');
    await sleep(500);

    const loginHistory2 = await api.get('/api/security/login-history?pageSize=50');
    const failedLogins = loginHistory2.data.data.loginAttempts.filter(a => !a.success);
    logTest('loginHistory', '11.1 Failed logins recorded',
      failedLogins.length >= 2,
      `${failedLogins.length} failed logins`);

    const withReason = failedLogins.filter(a => a.failure_reason);
    logTest('loginHistory', '11.2 Failure reasons recorded',
      withReason.length > 0,
      `Reasons: ${[...new Set(withReason.map(a => a.failure_reason))].join(', ')}`);

    // Test 12: Pagination
    logProgress('Test 12: Testing pagination...', 'info');
    logTest('loginHistory', '12.1 Pagination metadata present',
      !!loginHistory2.data.data.pagination,
      `Page ${loginHistory2.data.data.pagination.page} of ${loginHistory2.data.data.pagination.totalPages}`);

    // Test 13: Login statistics
    logProgress('Test 13: Login statistics...', 'info');
    const loginStats = await api.get('/api/security/login-stats?days=30');
    logTest('loginHistory', '13.1 GET /api/security/login-stats successful',
      loginStats.data.success,
      `Total attempts: ${loginStats.data.data.statistics.total_attempts}`);
    logTest('loginHistory', '13.2 Statistics breakdown',
      loginStats.data.data.statistics.successful_logins > 0 &&
      loginStats.data.data.statistics.failed_logins > 0,
      `Success: ${loginStats.data.data.statistics.successful_logins}, Failed: ${loginStats.data.data.statistics.failed_logins}`);

    console.log();

    // ============================================
    // STORY 9.3: SECURITY EVENTS
    // ============================================
    console.log('═'.repeat(70));
    logProgress('Testing Story 9.3: Security Events', 'test');
    console.log('═'.repeat(70));

    // Test 14: Brute force detection
    logProgress('Test 14: Triggering brute force detection...', 'info');
    for (let i = 0; i < 5; i++) {
      await login(testUser.email, `BruteForce${i}!`);
      await sleep(100);
    }
    await sleep(2000);

    const events1 = await api.get('/api/security/events?pageSize=50');
    const bruteForceEvent = events1.data.data.events.find(
      e => e.event_type === 'brute_force_attempt'
    );
    logTest('securityEvents', '14.1 Brute force event generated',
      !!bruteForceEvent,
      bruteForceEvent ? `Severity: ${bruteForceEvent.severity}` : 'Not found');

    // Test 15: New device detection
    logProgress('Test 15: New device detection...', 'info');
    await login(testUser.email, testUser.password,
      'Mozilla/5.0 (X11; Linux x86_64) Firefox/121.0');
    await sleep(1000);

    const events2 = await api.get('/api/security/events?pageSize=50');
    const newDeviceEvent = events2.data.data.events.find(
      e => e.event_type === 'login_from_new_device'
    );
    logTest('securityEvents', '15.1 New device event generated',
      !!newDeviceEvent,
      newDeviceEvent ? `Device: ${newDeviceEvent.description}` : 'Not found');

    // Test 16: Security event API
    logProgress('Test 16: Security events API...', 'info');
    logTest('securityEvents', '16.1 GET /api/security/events successful',
      events2.data.success && Array.isArray(events2.data.data.events),
      `Found ${events2.data.data.events.length} events`);

    if (events2.data.data.events.length > 0) {
      const event = events2.data.data.events[0];
      logTest('securityEvents', '16.2 Events have required fields',
        !!event.event_type && !!event.severity && !!event.description,
        `Type: ${event.event_type}, Severity: ${event.severity}`);
    }

    // Test 17: Event statistics
    logProgress('Test 17: Security event statistics...', 'info');
    const eventStats = await api.get('/api/security/event-stats?days=30');
    logTest('securityEvents', '17.1 GET /api/security/event-stats successful',
      eventStats.data.success,
      `Total events: ${eventStats.data.data.statistics.total_events}`);
    logTest('securityEvents', '17.2 Severity breakdown available',
      eventStats.data.data.statistics.info_count >= 0 &&
      eventStats.data.data.statistics.warning_count >= 0 &&
      eventStats.data.data.statistics.critical_count >= 0,
      `Info: ${eventStats.data.data.statistics.info_count}, Warning: ${eventStats.data.data.statistics.warning_count}, Critical: ${eventStats.data.data.statistics.critical_count}`);

    // Test 18: Unacknowledged count
    logProgress('Test 18: Unacknowledged events...', 'info');
    const unackCount1 = await api.get('/api/security/events/unacknowledged-count');
    logTest('securityEvents', '18.1 GET /api/security/events/unacknowledged-count works',
      unackCount1.data.success,
      `Unacknowledged: ${unackCount1.data.data.unacknowledgedCount}`);

    // Test 19: Acknowledge event
    logProgress('Test 19: Acknowledging events...', 'info');
    if (events2.data.data.events.length > 0) {
      const eventToAck = events2.data.data.events[0];
      const ackResult = await api.post(`/api/security/events/${eventToAck.id}/acknowledge`);
      logTest('securityEvents', '19.1 POST /api/security/events/:id/acknowledge works',
        ackResult.data.success,
        `Acknowledged event ID: ${eventToAck.id}`);
    }

    // Test 20: Acknowledge all
    logProgress('Test 20: Acknowledging all events...', 'info');
    const ackAllResult = await api.post('/api/security/events/acknowledge-all');
    logTest('securityEvents', '20.1 POST /api/security/events/acknowledge-all works',
      ackAllResult.data.success,
      `Acknowledged ${ackAllResult.data.data.acknowledgedCount} event(s)`);

    const unackCount2 = await api.get('/api/security/events/unacknowledged-count');
    logTest('securityEvents', '20.2 All events acknowledged',
      unackCount2.data.data.unacknowledgedCount === 0,
      `Remaining: ${unackCount2.data.data.unacknowledgedCount}`);

    console.log();

  } catch (error) {
    console.error('\n❌ Test suite error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }

  results.endTime = new Date();

  // ============================================
  // FINAL REPORT
  // ============================================
  printFinalReport();
}

function printFinalReport() {
  const duration = ((results.endTime - results.startTime) / 1000).toFixed(2);

  console.log('\n');
  console.log('═'.repeat(70));
  console.log('📊 PHASE 9 COMPREHENSIVE TEST REPORT');
  console.log('═'.repeat(70));
  console.log(`📅 Started:  ${results.startTime.toLocaleTimeString()}`);
  console.log(`📅 Finished: ${results.endTime.toLocaleTimeString()}`);
  console.log(`⏱️  Duration: ${duration} seconds`);
  console.log('═'.repeat(70));
  console.log();

  // Category breakdown
  console.log('📋 TEST CATEGORIES:\n');

  Object.entries(categories).forEach(([key, category]) => {
    const percentage = category.tests.length > 0
      ? ((category.passed / category.tests.length) * 100).toFixed(1)
      : 0;

    const status = category.failed === 0 ? '✅' : '⚠️';
    console.log(`${status} ${category.name}`);
    console.log(`   Tests: ${category.tests.length} | Passed: ${category.passed} | Failed: ${category.failed} | Success Rate: ${percentage}%`);

    if (category.failed > 0) {
      const failedTests = category.tests.filter(t => !t.passed);
      console.log(`   Failed tests:`);
      failedTests.forEach(t => {
        console.log(`      ❌ ${t.name}`);
        if (t.details) console.log(`         ${t.details}`);
      });
    }
    console.log();
  });

  console.log('═'.repeat(70));
  console.log('📊 OVERALL RESULTS:');
  console.log('═'.repeat(70));
  console.log(`Total Tests:    ${results.totalTests}`);
  console.log(`✅ Passed:      ${results.totalPassed}`);
  console.log(`❌ Failed:      ${results.totalFailed}`);

  const overallPercentage = ((results.totalPassed / results.totalTests) * 100).toFixed(1);
  console.log(`Success Rate:   ${overallPercentage}%`);
  console.log('═'.repeat(70));
  console.log();

  // Component status summary
  console.log('🔧 COMPONENT STATUS SUMMARY:\n');

  const components = [
    { name: 'Session Metadata Tracking', status: categories.sessionMetadata.failed === 0 ? '✅ WORKING' : '❌ ISSUES', story: '9.1' },
    { name: 'Session Creation with Metadata', status: categories.sessionMetadata.failed === 0 ? '✅ WORKING' : '❌ ISSUES', story: '9.1' },
    { name: 'Device Type Detection', status: categories.deviceManagement.tests.find(t => t.name.includes('6.'))?.passed ? '✅ WORKING' : '❌ ISSUES', story: '9.1' },
    { name: 'Session Listing API', status: categories.deviceManagement.tests.find(t => t.name.includes('4.'))?.passed ? '✅ WORKING' : '❌ ISSUES', story: '9.2' },
    { name: 'Session Revocation', status: categories.deviceManagement.tests.find(t => t.name.includes('7.'))?.passed ? '✅ WORKING' : '❌ ISSUES', story: '9.2' },
    { name: 'Revoke All Other Sessions', status: categories.deviceManagement.tests.find(t => t.name.includes('9.'))?.passed ? '✅ WORKING' : '❌ ISSUES', story: '9.2' },
    { name: 'Current Session Protection', status: categories.deviceManagement.tests.find(t => t.name.includes('8.'))?.passed ? '✅ WORKING' : '❌ ISSUES', story: '9.2' },
    { name: 'Login Attempt Logging', status: categories.loginHistory.tests.find(t => t.name.includes('10.'))?.passed ? '✅ WORKING' : '❌ ISSUES', story: '9.3' },
    { name: 'Failed Login Logging', status: categories.loginHistory.tests.find(t => t.name.includes('11.'))?.passed ? '✅ WORKING' : '❌ ISSUES', story: '9.3' },
    { name: 'Login Statistics', status: categories.loginHistory.tests.find(t => t.name.includes('13.'))?.passed ? '✅ WORKING' : '❌ ISSUES', story: '9.3' },
    { name: 'Brute Force Detection', status: categories.securityEvents.tests.find(t => t.name.includes('14.'))?.passed ? '✅ WORKING' : '❌ ISSUES', story: '9.3' },
    { name: 'New Device Detection', status: categories.securityEvents.tests.find(t => t.name.includes('15.'))?.passed ? '✅ WORKING' : '❌ ISSUES', story: '9.3' },
    { name: 'Security Events API', status: categories.securityEvents.tests.find(t => t.name.includes('16.'))?.passed ? '✅ WORKING' : '❌ ISSUES', story: '9.3' },
    { name: 'Event Acknowledgment', status: categories.securityEvents.tests.find(t => t.name.includes('19.'))?.passed ? '✅ WORKING' : '❌ ISSUES', story: '9.3' },
    { name: 'Event Statistics', status: categories.securityEvents.tests.find(t => t.name.includes('17.'))?.passed ? '✅ WORKING' : '❌ ISSUES', story: '9.3' },
  ];

  components.forEach(comp => {
    console.log(`${comp.status.padEnd(15)} ${comp.name.padEnd(35)} [Story ${comp.story}]`);
  });

  console.log();
  console.log('═'.repeat(70));

  if (results.totalFailed === 0) {
    console.log('🎉 ALL TESTS PASSED! Phase 9 is fully functional!');
  } else if (overallPercentage >= 90) {
    console.log('✅ Phase 9 is mostly functional with minor issues.');
  } else if (overallPercentage >= 75) {
    console.log('⚠️  Phase 9 has some issues that need attention.');
  } else {
    console.log('❌ Phase 9 has significant issues that need to be fixed.');
  }

  console.log('═'.repeat(70));
  console.log();

  // Recommendations
  if (results.totalFailed > 0) {
    console.log('💡 RECOMMENDATIONS:\n');
    console.log('1. Review failed test details above');
    console.log('2. Check Docker logs for backend errors: docker-compose logs backend --tail 50');
    console.log('3. Verify database migrations ran successfully');
    console.log('4. Check that all routes are properly mounted in app.js');
    console.log();
  } else {
    console.log('✅ NEXT STEPS:\n');
    console.log('1. Commit and push Story 9.3 to GitHub');
    console.log('2. Merge to staging branch');
    console.log('3. Consider deploying to beta for production testing');
    console.log('4. Continue with Story 9.4 (Session Timeout) when ready');
    console.log();
  }
}

// Run the tests
runTests();
