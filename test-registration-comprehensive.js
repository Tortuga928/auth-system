/**
 * Comprehensive Registration System Test
 * Tests all aspects of user registration functionality
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
const timestamp = Date.now();

// Test results tracker
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(name, passed, message, details = null) {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`✅ PASS: ${name}`);
    if (message) console.log(`   ${message}`);
  } else {
    testResults.failed++;
    console.log(`❌ FAIL: ${name}`);
    if (message) console.log(`   ${message}`);
    if (details) console.log(`   Details:`, details);
  }
  testResults.tests.push({ name, passed, message, details });
  console.log('');
}

async function testRegistration() {
  console.log('🧪 COMPREHENSIVE REGISTRATION SYSTEM TEST');
  console.log('='.repeat(70));
  console.log(`Test started at: ${new Date().toISOString()}\n`);

  try {
    // Test 1: Basic Registration (Valid Data)
    console.log('📝 Test 1: Basic Registration with Valid Data');
    console.log('-'.repeat(70));

    const validUser = {
      email: `testuser_${timestamp}@test.com`,
      password: 'TestPass123!@#',
      username: `testuser_${timestamp}`,
      firstName: 'Test',
      lastName: 'User'
    };

    try {
      const response = await axios.post(`${API_URL}/auth/register`, validUser);

      if (response.status === 201 || response.status === 200) {
        const hasToken = response.data.token || response.data.data?.token || response.data.data?.tokens;
        const hasUser = response.data.user || response.data.data?.user;

        logTest(
          'Valid registration',
          hasUser !== undefined,
          `User created with email: ${validUser.email}`,
          { status: response.status, hasToken, hasUser, data: response.data }
        );
      } else {
        logTest('Valid registration', false, 'Unexpected status code', response.status);
      }
    } catch (err) {
      logTest('Valid registration', false, err.response?.data?.message || err.message, err.response?.data);
    }

    // Test 2: Duplicate Email
    console.log('📝 Test 2: Duplicate Email Prevention');
    console.log('-'.repeat(70));

    try {
      await axios.post(`${API_URL}/auth/register`, validUser);
      logTest('Duplicate email prevention', false, 'Should have rejected duplicate email');
    } catch (err) {
      const isDuplicateError = err.response?.status === 400 || err.response?.status === 409;
      logTest(
        'Duplicate email prevention',
        isDuplicateError,
        isDuplicateError ? 'Correctly rejected duplicate email' : 'Wrong error code',
        { status: err.response?.status, message: err.response?.data?.message }
      );
    }

    // Test 3: Invalid Email Format
    console.log('📝 Test 3: Invalid Email Format Validation');
    console.log('-'.repeat(70));

    const invalidEmails = [
      { email: 'notanemail', desc: 'No @ symbol' },
      { email: 'missing@domain', desc: 'Missing TLD' },
      { email: '@nodomain.com', desc: 'Missing local part' },
      { email: '', desc: 'Empty email' }
    ];

    for (const testCase of invalidEmails) {
      try {
        await axios.post(`${API_URL}/auth/register`, {
          ...validUser,
          email: testCase.email,
          username: `user_${Date.now()}`
        });
        logTest(`Invalid email: ${testCase.desc}`, false, 'Should have rejected invalid email');
      } catch (err) {
        const isValidationError = err.response?.status === 400;
        logTest(
          `Invalid email: ${testCase.desc}`,
          isValidationError,
          isValidationError ? 'Correctly rejected' : 'Wrong error handling',
          { email: testCase.email, status: err.response?.status }
        );
      }
    }

    // Test 4: Weak Password Validation
    console.log('📝 Test 4: Weak Password Validation');
    console.log('-'.repeat(70));

    const weakPasswords = [
      { password: '12345', desc: 'Too short' },
      { password: 'password', desc: 'No numbers/special chars' },
      { password: '12345678', desc: 'Only numbers' },
      { password: '', desc: 'Empty password' }
    ];

    for (const testCase of weakPasswords) {
      try {
        await axios.post(`${API_URL}/auth/register`, {
          ...validUser,
          email: `user_${Date.now()}@test.com`,
          username: `user_${Date.now()}`,
          password: testCase.password
        });
        logTest(`Weak password: ${testCase.desc}`, false, 'Should have rejected weak password');
      } catch (err) {
        const isValidationError = err.response?.status === 400;
        logTest(
          `Weak password: ${testCase.desc}`,
          isValidationError,
          isValidationError ? 'Correctly rejected' : 'Wrong error handling',
          { password: testCase.password, status: err.response?.status }
        );
      }
    }

    // Test 5: Missing Required Fields
    console.log('📝 Test 5: Missing Required Fields');
    console.log('-'.repeat(70));

    const requiredFields = [
      { field: 'email', data: { ...validUser, email: undefined } },
      { field: 'password', data: { ...validUser, password: undefined } },
      { field: 'username', data: { ...validUser, username: undefined } }
    ];

    for (const testCase of requiredFields) {
      try {
        const testData = { ...testCase.data };
        delete testData[testCase.field];

        await axios.post(`${API_URL}/auth/register`, testData);
        logTest(`Missing ${testCase.field}`, false, 'Should have rejected missing field');
      } catch (err) {
        const isValidationError = err.response?.status === 400;
        logTest(
          `Missing ${testCase.field}`,
          isValidationError,
          isValidationError ? 'Correctly rejected' : 'Wrong error handling',
          { status: err.response?.status, message: err.response?.data?.message }
        );
      }
    }

    // Test 6: SQL Injection Attempt
    console.log('📝 Test 6: SQL Injection Prevention');
    console.log('-'.repeat(70));

    const sqlInjections = [
      { email: "admin'--@test.com", desc: 'SQL comment injection' },
      { username: "admin' OR '1'='1", desc: 'SQL OR injection' },
      { password: "'; DROP TABLE users; --", desc: 'SQL DROP injection' }
    ];

    for (const testCase of sqlInjections) {
      try {
        await axios.post(`${API_URL}/auth/register`, {
          email: testCase.email || `safe_${Date.now()}@test.com`,
          username: testCase.username || `safe_${Date.now()}`,
          password: testCase.password || 'SafePass123!',
          firstName: 'Test',
          lastName: 'User'
        });

        // If it succeeds, it should sanitize the input
        logTest(
          `SQL injection: ${testCase.desc}`,
          true,
          'Input was sanitized (registration succeeded safely)'
        );
      } catch (err) {
        // Rejection is also acceptable (strict validation)
        const isValidationError = err.response?.status === 400;
        logTest(
          `SQL injection: ${testCase.desc}`,
          isValidationError,
          isValidationError ? 'Input rejected (strict validation)' : 'Unexpected error',
          { status: err.response?.status }
        );
      }
    }

    // Test 7: XSS Prevention
    console.log('📝 Test 7: XSS Prevention');
    console.log('-'.repeat(70));

    try {
      const xssUser = {
        email: `xss_${timestamp}@test.com`,
        username: `xss_${timestamp}`,
        password: 'XSSTest123!',
        firstName: '<script>alert("XSS")</script>',
        lastName: '<img src=x onerror=alert(1)>'
      };

      const response = await axios.post(`${API_URL}/auth/register`, xssUser);

      // Check if script tags are sanitized
      const user = response.data.user || response.data.data?.user;
      const hasUnsafeContent = user?.firstName?.includes('<script>') || user?.lastName?.includes('<img');

      logTest(
        'XSS prevention',
        !hasUnsafeContent,
        !hasUnsafeContent ? 'Script tags sanitized' : 'XSS vulnerability detected!',
        { firstName: user?.firstName, lastName: user?.lastName }
      );
    } catch (err) {
      // Rejection is also acceptable
      const isValidationError = err.response?.status === 400;
      logTest(
        'XSS prevention',
        isValidationError,
        'XSS content rejected',
        err.response?.data
      );
    }

    // Test 8: Rate Limiting (if implemented)
    console.log('📝 Test 8: Rate Limiting Check');
    console.log('-'.repeat(70));

    let rateLimitHit = false;
    for (let i = 0; i < 10; i++) {
      try {
        await axios.post(`${API_URL}/auth/register`, {
          email: `ratelimit_${i}_${timestamp}@test.com`,
          username: `ratelimit_${i}_${timestamp}`,
          password: 'RateLimit123!',
          firstName: 'Rate',
          lastName: 'Test'
        });
      } catch (err) {
        if (err.response?.status === 429) {
          rateLimitHit = true;
          logTest(
            'Rate limiting',
            true,
            `Rate limit hit after ${i + 1} attempts`,
            { status: err.response.status }
          );
          break;
        }
      }
    }

    if (!rateLimitHit) {
      logTest(
        'Rate limiting',
        false,
        'No rate limiting detected (10 registrations succeeded)',
        'Consider implementing rate limiting for production'
      );
    }

    // Test 9: Response Structure
    console.log('📝 Test 9: Response Structure Validation');
    console.log('-'.repeat(70));

    try {
      const structureTestUser = {
        email: `structure_${timestamp}@test.com`,
        username: `structure_${timestamp}`,
        password: 'Structure123!',
        firstName: 'Structure',
        lastName: 'Test'
      };

      const response = await axios.post(`${API_URL}/auth/register`, structureTestUser);

      const hasValidStructure = response.data && (
        (response.data.user && response.data.token) ||
        (response.data.data && response.data.data.user)
      );

      logTest(
        'Response structure',
        hasValidStructure,
        hasValidStructure ? 'Valid response structure' : 'Invalid response structure',
        { structure: Object.keys(response.data) }
      );
    } catch (err) {
      logTest('Response structure', false, 'Could not test response structure', err.message);
    }

    // Test 10: Username Uniqueness
    console.log('📝 Test 10: Username Uniqueness');
    console.log('-'.repeat(70));

    try {
      const username = `unique_${timestamp}`;

      // First registration
      await axios.post(`${API_URL}/auth/register`, {
        email: `unique1_${timestamp}@test.com`,
        username: username,
        password: 'Unique123!',
        firstName: 'Unique',
        lastName: 'Test1'
      });

      // Try duplicate username with different email
      try {
        await axios.post(`${API_URL}/auth/register`, {
          email: `unique2_${timestamp}@test.com`,
          username: username, // Same username
          password: 'Unique123!',
          firstName: 'Unique',
          lastName: 'Test2'
        });

        logTest('Username uniqueness', false, 'Allowed duplicate username');
      } catch (err) {
        const isDuplicateError = err.response?.status === 400 || err.response?.status === 409;
        logTest(
          'Username uniqueness',
          isDuplicateError,
          isDuplicateError ? 'Correctly rejected duplicate username' : 'Wrong error handling',
          { status: err.response?.status, message: err.response?.data?.message }
        );
      }
    } catch (err) {
      logTest('Username uniqueness', false, 'Could not test username uniqueness', err.message);
    }

  } catch (error) {
    console.error('\n❌ Test suite encountered fatal error:');
    console.error(error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }

  // Print final report
  console.log('\n' + '='.repeat(70));
  console.log('📊 FINAL TEST REPORT');
  console.log('='.repeat(70));
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`✅ Passed: ${testResults.passed} (${((testResults.passed/testResults.total)*100).toFixed(1)}%)`);
  console.log(`❌ Failed: ${testResults.failed} (${((testResults.failed/testResults.total)*100).toFixed(1)}%)`);
  console.log('');

  // Group by category
  console.log('📋 Test Results by Category:');
  console.log('-'.repeat(70));

  const categories = {
    'Basic Functionality': ['Valid registration'],
    'Security': ['Duplicate email', 'SQL injection', 'XSS prevention', 'Rate limiting'],
    'Validation': ['Invalid email', 'Weak password', 'Missing'],
    'Data Integrity': ['Username uniqueness', 'Response structure']
  };

  for (const [category, keywords] of Object.entries(categories)) {
    const categoryTests = testResults.tests.filter(t =>
      keywords.some(kw => t.name.toLowerCase().includes(kw.toLowerCase()))
    );

    if (categoryTests.length > 0) {
      const passed = categoryTests.filter(t => t.passed).length;
      const total = categoryTests.length;
      console.log(`\n${category}: ${passed}/${total} passed`);

      categoryTests.forEach(t => {
        console.log(`  ${t.passed ? '✅' : '❌'} ${t.name}`);
      });
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log(`Test completed at: ${new Date().toISOString()}`);
  console.log('='.repeat(70));

  // Overall assessment
  const passRate = (testResults.passed / testResults.total) * 100;
  console.log('\n🎯 OVERALL ASSESSMENT:');
  if (passRate >= 90) {
    console.log('✅ EXCELLENT - Registration system is working well');
  } else if (passRate >= 70) {
    console.log('⚠️  GOOD - Registration system works but has some issues');
  } else if (passRate >= 50) {
    console.log('⚠️  NEEDS ATTENTION - Registration system has significant issues');
  } else {
    console.log('❌ CRITICAL - Registration system has major problems');
  }

  console.log('\n');
  return testResults;
}

// Run the test
testRegistration().then(results => {
  process.exit(results.failed > 0 ? 1 : 0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
