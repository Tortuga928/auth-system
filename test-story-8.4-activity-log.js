/**
 * Story 8.4: Activity Log Page - Integration Tests
 *
 * Tests:
 * 1. Login and profile retrieval
 * 2. Activity log retrieval with pagination
 * 3. Activity log after various actions
 * 4. Pagination functionality
 * 5. Empty activity log handling
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000';

// Test user credentials
// Using a unique email for Story 8.4 testing (no MFA)
const testUser = {
  email: `story84-${Date.now()}@example.com`,
  password: 'Test123!@#',
  username: `story84user${Date.now()}`,
  first_name: 'Story',
  last_name: 'Eight-Four',
};

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
async function login(email, password) {
  try {
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      email,
      password,
    });

    // Check if MFA is required
    if (response.data.data.mfaRequired) {
      throw new Error('MFA is enabled for this account - use account without MFA for testing');
    }

    // Access token is at data.tokens.accessToken
    return response.data.data.tokens.accessToken;
  } catch (error) {
    throw new Error(`Login failed: ${error.response?.data?.error || error.message}`);
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

async function runTests() {
  console.log('='.repeat(60));
  console.log('Story 8.4: Activity Log Page - Integration Tests');
  console.log('='.repeat(60));
  console.log();

  let token;
  let api;

  try {
    // Test 0: Register new test user
    console.log('Test 0: User registration (setup)');
    try {
      await register({
        username: testUser.username,
        email: testUser.email,
        password: testUser.password,
        first_name: testUser.first_name,
        last_name: testUser.last_name,
      });
      logTest('0.1 User registration', true, `Created user: ${testUser.email}`);
    } catch (error) {
      // Ignore if user already exists
      if (error.message.includes('already exists')) {
        logTest('0.1 User registration', true, 'User already exists (continuing with existing user)');
      } else {
        logTest('0.1 User registration', false, error.message);
        console.log('\n❌ Cannot proceed without user account');
        return;
      }
    }

    // Test 1: Login and get token
    console.log('\nTest 1: User login and authentication');
    try {
      token = await login(testUser.email, testUser.password);
      api = authenticatedRequest(token);
      logTest('1.1 User login', true, 'Successfully obtained access token');
    } catch (error) {
      logTest('1.1 User login', false, error.message);
      console.log('\n❌ Cannot proceed without authentication');
      return;
    }

    // Test 2: Get activity logs (first page)
    console.log('\nTest 2: Activity log retrieval');
    let activityData;
    try {
      const response = await api.get('/api/user/activity?page=1&limit=25');
      activityData = response.data.data;

      const hasLogs = activityData.logs && Array.isArray(activityData.logs);
      const hasPagination = activityData.pagination &&
                           typeof activityData.pagination.page === 'number' &&
                           typeof activityData.pagination.pageSize === 'number' &&
                           typeof activityData.pagination.totalCount === 'number';

      logTest('2.1 Get activity logs', hasLogs && hasPagination,
              `Retrieved ${activityData.logs.length} logs, total: ${activityData.pagination.totalCount}`);

      // Check log structure
      if (activityData.logs.length > 0) {
        const log = activityData.logs[0];
        const hasRequiredFields = log.id && log.action && log.timestamp;
        logTest('2.2 Activity log structure', hasRequiredFields,
                `Sample log: ${log.action} at ${log.timestamp}`);
      } else {
        logTest('2.2 Activity log structure', true, 'No logs yet (expected for new user)');
      }
    } catch (error) {
      logTest('2.1 Get activity logs', false, error.response?.data?.error || error.message);
      logTest('2.2 Activity log structure', false, 'Skipped due to previous failure');
    }

    // Test 3: Generate activity by performing actions
    console.log('\nTest 3: Activity logging for user actions');
    try {
      // Perform profile update to generate activity
      await api.put('/api/user/profile', {
        first_name: 'Activity',
        last_name: 'Test',
        password: testUser.password,
      });

      // Wait a moment for activity log to be created
      await new Promise(resolve => setTimeout(resolve, 500));

      // Fetch activity logs again
      const response = await api.get('/api/user/activity?page=1&limit=25');
      const newActivityData = response.data.data;

      // Check if new activity was logged
      const hasProfileUpdate = newActivityData.logs.some(log =>
        log.action === 'profile_updated' || log.description?.includes('profile')
      );

      logTest('3.1 Activity logged for profile update', hasProfileUpdate,
              `Found profile_updated in recent logs`);

      // Check activity count increased
      const countIncreased = newActivityData.pagination.totalCount > (activityData?.pagination?.totalCount || 0);
      logTest('3.2 Activity count increased', countIncreased,
              `Total logs: ${newActivityData.pagination.totalCount}`);

      activityData = newActivityData; // Update for next tests
    } catch (error) {
      logTest('3.1 Activity logged for profile update', false, error.response?.data?.error || error.message);
      logTest('3.2 Activity count increased', false, 'Skipped due to previous failure');
    }

    // Test 4: Pagination functionality
    console.log('\nTest 4: Pagination functionality');
    try {
      // Request with small page size to test pagination
      const response1 = await api.get('/api/user/activity?page=1&limit=2');
      const page1Data = response1.data.data;

      const correctPageSize = page1Data.pagination.pageSize === 2;
      const correctPage = page1Data.pagination.page === 1;
      const logsMatchPageSize = page1Data.logs.length <= 2;

      logTest('4.1 Pagination parameters', correctPageSize && correctPage && logsMatchPageSize,
              `Page ${page1Data.pagination.page}, Size ${page1Data.pagination.pageSize}, Logs: ${page1Data.logs.length}`);

      // Test page 2 if we have enough logs
      if (page1Data.pagination.totalPages > 1) {
        const response2 = await api.get('/api/user/activity?page=2&limit=2');
        const page2Data = response2.data.data;

        const page2Correct = page2Data.pagination.page === 2;
        const differentLogs = page1Data.logs[0].id !== page2Data.logs[0].id;

        logTest('4.2 Second page retrieval', page2Correct && differentLogs,
                `Page 2 has different logs than page 1`);
      } else {
        logTest('4.2 Second page retrieval', true, 'Only one page of logs (expected)');
      }

      // Test page calculation
      const calculatedPages = Math.ceil(page1Data.pagination.totalCount / 2);
      const pagesMatch = page1Data.pagination.totalPages === calculatedPages;
      logTest('4.3 Page count calculation', pagesMatch,
              `Total pages: ${page1Data.pagination.totalPages}, Expected: ${calculatedPages}`);
    } catch (error) {
      logTest('4.1 Pagination parameters', false, error.response?.data?.error || error.message);
      logTest('4.2 Second page retrieval', false, 'Skipped due to previous failure');
      logTest('4.3 Page count calculation', false, 'Skipped due to previous failure');
    }

    // Test 5: Invalid pagination parameters
    console.log('\nTest 5: Pagination validation');
    try {
      // Test invalid page number (0) - backend defaults to 1
      try {
        const response = await api.get('/api/user/activity?page=0&limit=25');
        const defaultedTo1 = response.data.data.pagination.page === 1;
        logTest('5.1 Default invalid page (0) to 1', defaultedTo1,
                `Page ${response.data.data.pagination.page} (defaults to 1)`);
      } catch (error) {
        logTest('5.1 Default invalid page (0) to 1', false, error.response?.data?.error || error.message);
      }

      // Test invalid page size (0) - backend defaults to 25
      try {
        const response = await api.get('/api/user/activity?page=1&limit=0');
        const defaultedTo25 = response.data.data.pagination.pageSize === 25;
        logTest('5.2 Default invalid limit (0) to 25', defaultedTo25,
                `Limit ${response.data.data.pagination.pageSize} (defaults to 25)`);
      } catch (error) {
        logTest('5.2 Default invalid limit (0) to 25', false, error.response?.data?.error || error.message);
      }

      // Test limit exceeding maximum (>100)
      try {
        await api.get('/api/user/activity?page=1&limit=200');
        logTest('5.3 Reject limit > 100', false, 'Should have returned 400 error');
      } catch (error) {
        const is400 = error.response?.status === 400;
        logTest('5.3 Reject limit > 100', is400,
                `Correctly rejected with status ${error.response?.status}`);
      }
    } catch (error) {
      logTest('5.x Pagination validation', false, error.message);
    }

    // Test 6: Activity log data integrity
    console.log('\nTest 6: Activity log data integrity');
    try {
      const response = await api.get('/api/user/activity?page=1&limit=25');
      const logs = response.data.data.logs;

      if (logs.length > 0) {
        // Check all logs have required fields
        const allHaveRequiredFields = logs.every(log =>
          log.id && log.action && log.timestamp
        );
        logTest('6.1 All logs have required fields', allHaveRequiredFields,
                `Checked ${logs.length} logs`);

        // Check logs are sorted by timestamp (newest first)
        const sortedCorrectly = logs.every((log, i) => {
          if (i === 0) return true;
          const current = new Date(log.timestamp);
          const previous = new Date(logs[i - 1].timestamp);
          return current <= previous;
        });
        logTest('6.2 Logs sorted by timestamp (newest first)', sortedCorrectly,
                `Verified ${logs.length} log entries`);

        // Check timestamp format is valid
        const validTimestamps = logs.every(log => {
          const date = new Date(log.timestamp);
          return !isNaN(date.getTime());
        });
        logTest('6.3 Valid timestamp format', validTimestamps,
                `All ${logs.length} timestamps are valid dates`);
      } else {
        logTest('6.1 All logs have required fields', true, 'No logs to check (skipped)');
        logTest('6.2 Logs sorted by timestamp', true, 'No logs to check (skipped)');
        logTest('6.3 Valid timestamp format', true, 'No logs to check (skipped)');
      }
    } catch (error) {
      logTest('6.1 Activity log data integrity', false, error.response?.data?.error || error.message);
    }

    // Test 7: Activity log includes various action types
    console.log('\nTest 7: Activity log action types');
    try {
      const response = await api.get('/api/user/activity?page=1&limit=100');
      const logs = response.data.data.logs;

      // Common action types we expect
      const foundActions = new Set(logs.map(log => log.action));

      const hasProfileUpdate = foundActions.has('profile_updated');

      logTest('7.1 Profile update action logged', hasProfileUpdate,
              hasProfileUpdate ? 'Found in activity history' : 'Not found (should exist)');

      // List all unique actions found
      const actionsList = Array.from(foundActions).join(', ') || 'none';
      logTest('7.2 Activity contains valid action types', foundActions.size > 0,
              `Found actions: ${actionsList}`);

      // Note: Login actions are only logged for specific login scenarios (e.g., after MFA)
      // Registration creates a new user without logging login action
      logTest('7.3 Activity log system working', logs.length > 0,
              `Recorded ${logs.length} activity entries`);
    } catch (error) {
      logTest('7.1 Activity log action types', false, error.response?.data?.error || error.message);
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
  console.log(`Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
  console.log('='.repeat(60));

  if (results.failed > 0) {
    console.log('\nFailed Tests:');
    results.tests
      .filter(t => !t.passed)
      .forEach(t => console.log(`  - ${t.name}: ${t.details}`));
  }

  console.log('\n✅ Story 8.4 testing complete!');
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
