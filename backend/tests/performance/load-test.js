/**
 * Performance Load Testing Suite
 * Story 11.4: Performance Testing & Optimization
 *
 * Uses autocannon for HTTP load testing
 * Tests critical API endpoints under load
 */

const autocannon = require('autocannon');

const BASE_URL = process.env.TEST_URL || 'http://localhost:5000';

// Test configurations
const tests = {
  // Health check - baseline test
  health: {
    name: 'Health Check',
    url: `${BASE_URL}/health`,
    method: 'GET',
    duration: 10,
    connections: 10,
    pipelining: 1,
    expectations: {
      minRequests: 1000,
      maxLatency: 100,
      maxErrors: 0,
    },
  },

  // Public endpoints
  login: {
    name: 'Login Endpoint',
    url: `${BASE_URL}/api/auth/login`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'loadtest@example.com',
      password: 'TestPassword123!',
    }),
    duration: 10,
    connections: 10,
    pipelining: 1,
    expectations: {
      minRequests: 100,
      maxLatency: 500,
      maxErrorRate: 0.5, // Allow some 401s for invalid creds
    },
  },

  register: {
    name: 'Register Endpoint (Rate Limited)',
    url: `${BASE_URL}/api/auth/register`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    // Will hit rate limit quickly - expected behavior
    body: JSON.stringify({
      username: 'loadtest_user',
      email: 'loadtest@example.com',
      password: 'TestPassword123!',
    }),
    duration: 5,
    connections: 5,
    pipelining: 1,
    expectations: {
      minRequests: 5,
      maxLatency: 1000,
      // Expect rate limiting to kick in
    },
  },

  // OAuth status - lightweight endpoint
  oauthStatus: {
    name: 'OAuth Status',
    url: `${BASE_URL}/api/oauth/status`,
    method: 'GET',
    duration: 10,
    connections: 10,
    pipelining: 1,
    expectations: {
      minRequests: 500,
      maxLatency: 200,
      maxErrors: 0,
    },
  },

  // API root
  apiRoot: {
    name: 'API Root',
    url: `${BASE_URL}/`,
    method: 'GET',
    duration: 10,
    connections: 20,
    pipelining: 1,
    expectations: {
      minRequests: 2000,
      maxLatency: 50,
      maxErrors: 0,
    },
  },
};

// Test with authentication token
const authenticatedTests = {
  profile: {
    name: 'User Profile (Authenticated)',
    url: `${BASE_URL}/api/user/profile`,
    method: 'GET',
    duration: 10,
    connections: 10,
    pipelining: 1,
    expectations: {
      minRequests: 200,
      maxLatency: 300,
    },
  },

  sessions: {
    name: 'User Sessions (Authenticated)',
    url: `${BASE_URL}/api/sessions`,
    method: 'GET',
    duration: 10,
    connections: 10,
    pipelining: 1,
    expectations: {
      minRequests: 200,
      maxLatency: 300,
    },
  },

  activity: {
    name: 'User Activity (Authenticated)',
    url: `${BASE_URL}/api/user/activity`,
    method: 'GET',
    duration: 10,
    connections: 10,
    pipelining: 1,
    expectations: {
      minRequests: 150,
      maxLatency: 400,
    },
  },

  securityEvents: {
    name: 'Security Events (Authenticated)',
    url: `${BASE_URL}/api/security/events`,
    method: 'GET',
    duration: 10,
    connections: 10,
    pipelining: 1,
    expectations: {
      minRequests: 150,
      maxLatency: 400,
    },
  },

  loginHistory: {
    name: 'Login History (Authenticated)',
    url: `${BASE_URL}/api/security/login-history`,
    method: 'GET',
    duration: 10,
    connections: 10,
    pipelining: 1,
    expectations: {
      minRequests: 150,
      maxLatency: 400,
    },
  },
};

// Admin tests (require admin token)
const adminTests = {
  dashboardStats: {
    name: 'Admin Dashboard Stats',
    url: `${BASE_URL}/api/admin/dashboard/stats`,
    method: 'GET',
    duration: 10,
    connections: 5,
    pipelining: 1,
    expectations: {
      minRequests: 50,
      maxLatency: 1000,
    },
  },

  usersList: {
    name: 'Admin Users List',
    url: `${BASE_URL}/api/admin/users`,
    method: 'GET',
    duration: 10,
    connections: 5,
    pipelining: 1,
    expectations: {
      minRequests: 100,
      maxLatency: 500,
    },
  },

  auditLogs: {
    name: 'Admin Audit Logs',
    url: `${BASE_URL}/api/admin/audit-logs`,
    method: 'GET',
    duration: 10,
    connections: 5,
    pipelining: 1,
    expectations: {
      minRequests: 100,
      maxLatency: 500,
    },
  },
};

/**
 * Run a single load test
 */
async function runTest(config, token = null) {
  const testConfig = {
    url: config.url,
    method: config.method,
    duration: config.duration,
    connections: config.connections,
    pipelining: config.pipelining,
    headers: config.headers || {},
  };

  if (token) {
    testConfig.headers['Authorization'] = `Bearer ${token}`;
  }

  if (config.body) {
    testConfig.body = config.body;
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`🧪 Running: ${config.name}`);
  console.log(`   URL: ${config.url}`);
  console.log(`   Duration: ${config.duration}s, Connections: ${config.connections}`);
  console.log('='.repeat(60));

  return new Promise((resolve, reject) => {
    const instance = autocannon(testConfig, (err, result) => {
      if (err) {
        reject(err);
        return;
      }
      resolve({ ...result, config });
    });

    // Track progress
    autocannon.track(instance, { renderProgressBar: true });
  });
}

/**
 * Analyze test results
 */
function analyzeResults(result) {
  const { config } = result;
  const expectations = config.expectations || {};

  const analysis = {
    name: config.name,
    passed: true,
    metrics: {
      totalRequests: result.requests.total,
      requestsPerSecond: Math.round(result.requests.average),
      latencyAvg: Math.round(result.latency.average),
      latencyP50: result.latency.p50,
      latencyP99: result.latency.p99,
      latencyMax: result.latency.max,
      throughput: Math.round(result.throughput.average / 1024) + ' KB/s',
      errors: result.errors,
      timeouts: result.timeouts,
      duration: result.duration,
    },
    issues: [],
  };

  // Check expectations
  if (expectations.minRequests && result.requests.total < expectations.minRequests) {
    analysis.passed = false;
    analysis.issues.push(
      `Total requests (${result.requests.total}) below minimum (${expectations.minRequests})`
    );
  }

  if (expectations.maxLatency && result.latency.average > expectations.maxLatency) {
    analysis.passed = false;
    analysis.issues.push(
      `Average latency (${Math.round(result.latency.average)}ms) exceeds maximum (${expectations.maxLatency}ms)`
    );
  }

  if (expectations.maxErrors !== undefined && result.errors > expectations.maxErrors) {
    analysis.passed = false;
    analysis.issues.push(
      `Errors (${result.errors}) exceed maximum (${expectations.maxErrors})`
    );
  }

  return analysis;
}

/**
 * Print results summary
 */
function printSummary(results) {
  console.log('\n' + '='.repeat(80));
  console.log('📊 PERFORMANCE TEST RESULTS SUMMARY');
  console.log('='.repeat(80));

  const passed = results.filter((r) => r.passed);
  const failed = results.filter((r) => !r.passed);

  console.log(`\nTotal Tests: ${results.length}`);
  console.log(`✅ Passed: ${passed.length}`);
  console.log(`❌ Failed: ${failed.length}`);

  console.log('\n' + '-'.repeat(80));
  console.log('DETAILED RESULTS:');
  console.log('-'.repeat(80));

  for (const result of results) {
    const status = result.passed ? '✅' : '❌';
    console.log(`\n${status} ${result.name}`);
    console.log(`   Requests: ${result.metrics.totalRequests} (${result.metrics.requestsPerSecond} req/s)`);
    console.log(`   Latency: avg=${result.metrics.latencyAvg}ms, p50=${result.metrics.latencyP50}ms, p99=${result.metrics.latencyP99}ms, max=${result.metrics.latencyMax}ms`);
    console.log(`   Throughput: ${result.metrics.throughput}`);
    console.log(`   Errors: ${result.metrics.errors}, Timeouts: ${result.metrics.timeouts}`);

    if (result.issues.length > 0) {
      console.log('   Issues:');
      for (const issue of result.issues) {
        console.log(`      ⚠️  ${issue}`);
      }
    }
  }

  console.log('\n' + '='.repeat(80));

  // Performance recommendations
  if (failed.length > 0) {
    console.log('\n📋 RECOMMENDATIONS:');
    console.log('-'.repeat(40));

    for (const result of failed) {
      if (result.metrics.latencyAvg > 500) {
        console.log(`• ${result.name}: Consider adding caching or optimizing database queries`);
      }
      if (result.metrics.errors > 0) {
        console.log(`• ${result.name}: Investigate error causes (check server logs)`);
      }
      if (result.metrics.requestsPerSecond < 50) {
        console.log(`• ${result.name}: Low throughput - check for blocking operations`);
      }
    }
  }

  return failed.length === 0;
}

/**
 * Get auth token for authenticated tests
 */
async function getAuthToken(email, password) {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    return data.data?.accessToken || null;
  } catch (error) {
    console.error('Failed to get auth token:', error.message);
    return null;
  }
}

/**
 * Main test runner
 */
async function main() {
  const args = process.argv.slice(2);
  const testType = args[0] || 'public'; // public, auth, admin, all

  console.log('🚀 Authentication System Performance Tests');
  console.log(`   Base URL: ${BASE_URL}`);
  console.log(`   Test Type: ${testType}`);
  console.log(`   Started: ${new Date().toISOString()}`);

  const results = [];

  try {
    // Run public endpoint tests
    if (testType === 'public' || testType === 'all') {
      console.log('\n📌 PUBLIC ENDPOINT TESTS');
      for (const [key, config] of Object.entries(tests)) {
        const result = await runTest(config);
        results.push(analyzeResults(result));
      }
    }

    // Run authenticated tests
    if (testType === 'auth' || testType === 'all') {
      console.log('\n📌 AUTHENTICATED ENDPOINT TESTS');

      // Try to get a test user token
      const testEmail = process.env.TEST_USER_EMAIL || 'testuser@example.com';
      const testPassword = process.env.TEST_USER_PASSWORD || 'TestPassword123!';
      const token = await getAuthToken(testEmail, testPassword);

      if (token) {
        for (const [key, config] of Object.entries(authenticatedTests)) {
          const result = await runTest(config, token);
          results.push(analyzeResults(result));
        }
      } else {
        console.log('⚠️  Skipping authenticated tests - could not obtain auth token');
        console.log('   Set TEST_USER_EMAIL and TEST_USER_PASSWORD environment variables');
      }
    }

    // Run admin tests
    if (testType === 'admin' || testType === 'all') {
      console.log('\n📌 ADMIN ENDPOINT TESTS');

      // Try to get an admin token
      const adminEmail = process.env.ADMIN_EMAIL || 'testadmin@example.com';
      const adminPassword = process.env.ADMIN_PASSWORD || 'TestPassword123!';
      const adminToken = await getAuthToken(adminEmail, adminPassword);

      if (adminToken) {
        for (const [key, config] of Object.entries(adminTests)) {
          const result = await runTest(config, adminToken);
          results.push(analyzeResults(result));
        }
      } else {
        console.log('⚠️  Skipping admin tests - could not obtain admin token');
        console.log('   Set ADMIN_EMAIL and ADMIN_PASSWORD environment variables');
      }
    }

    // Print summary
    const allPassed = printSummary(results);

    console.log(`\nCompleted: ${new Date().toISOString()}`);

    process.exit(allPassed ? 0 : 1);
  } catch (error) {
    console.error('\n❌ Test execution failed:', error);
    process.exit(1);
  }
}

// Export for programmatic use
module.exports = { runTest, analyzeResults, tests, authenticatedTests, adminTests };

// Run if called directly
if (require.main === module) {
  main();
}
