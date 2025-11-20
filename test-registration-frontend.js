/**
 * Frontend Registration UI Test
 * Tests the actual React registration form in the browser
 */

const puppeteer = require('puppeteer');

const FRONTEND_URL = 'http://localhost:3000';
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

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testFrontendRegistration() {
  console.log('🧪 FRONTEND REGISTRATION UI TEST');
  console.log('='.repeat(70));
  console.log(`Test started at: ${new Date().toISOString()}\n`);

  let browser;
  let page;

  try {
    // Launch browser
    console.log('🌐 Launching browser...\n');
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });

    // Track console messages and errors
    const consoleLogs = [];
    const errors = [];

    page.on('console', msg => {
      consoleLogs.push(`${msg.type()}: ${msg.text()}`);
    });

    page.on('pageerror', error => {
      errors.push(error.toString());
    });

    // Test 1: Page loads successfully
    console.log('📝 Test 1: Registration Page Load');
    console.log('-'.repeat(70));

    try {
      const response = await page.goto(FRONTEND_URL, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      logTest(
        'Registration page loads',
        response.status() === 200,
        `Page loaded with status ${response.status()}`
      );
    } catch (err) {
      logTest('Registration page loads', false, err.message);
      throw new Error('Cannot continue - page failed to load');
    }

    // Test 2: Find registration link/button
    console.log('📝 Test 2: Registration Form Access');
    console.log('-'.repeat(70));

    try {
      // Look for "Register" or "Sign Up" link/button
      const registerButton = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, a, [role="button"]'));
        return buttons.some(btn => {
          const text = btn.textContent.toLowerCase();
          return text.includes('register') || text.includes('sign up');
        });
      });

      logTest(
        'Registration button/link visible',
        registerButton,
        registerButton ? 'Found registration access' : 'Registration button not found'
      );

      if (registerButton) {
        // Click to open registration form
        await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button, a, [role="button"]'));
          const registerBtn = buttons.find(btn => {
            const text = btn.textContent.toLowerCase();
            return text.includes('register') || text.includes('sign up');
          });
          if (registerBtn) registerBtn.click();
        });

        await wait(1000); // Wait for modal/form to open
      }
    } catch (err) {
      logTest('Registration button/link visible', false, err.message);
    }

    // Test 3: Registration form elements present
    console.log('📝 Test 3: Registration Form Elements');
    console.log('-'.repeat(70));

    try {
      const formElements = await page.evaluate(() => {
        const inputs = {
          email: document.querySelector('input[type="email"], input[name="email"], input[placeholder*="email" i]'),
          password: document.querySelector('input[type="password"], input[name="password"]'),
          username: document.querySelector('input[name="username"], input[placeholder*="username" i]'),
          firstName: document.querySelector('input[name="firstName"], input[name="first_name"], input[placeholder*="first" i]'),
          lastName: document.querySelector('input[name="lastName"], input[name="last_name"], input[placeholder*="last" i]'),
          submitButton: document.querySelector('button[type="submit"], button:has-text("Register"), button:has-text("Sign Up")')
        };

        return {
          email: !!inputs.email,
          password: !!inputs.password,
          username: !!inputs.username,
          firstName: !!inputs.firstName,
          lastName: !!inputs.lastName,
          submitButton: !!inputs.submitButton
        };
      });

      logTest('Email input field', formElements.email, formElements.email ? 'Present' : 'Missing');
      logTest('Password input field', formElements.password, formElements.password ? 'Present' : 'Missing');
      logTest('Username input field', formElements.username, formElements.username ? 'Present' : 'Missing');
      logTest('First name input field', formElements.firstName, formElements.firstName ? 'Present' : 'Missing');
      logTest('Last name input field', formElements.lastName, formElements.lastName ? 'Present' : 'Missing');
      logTest('Submit button', formElements.submitButton, formElements.submitButton ? 'Present' : 'Missing');

    } catch (err) {
      logTest('Form elements check', false, err.message);
    }

    // Test 4: Valid registration submission
    console.log('📝 Test 4: Valid Registration Submission');
    console.log('-'.repeat(70));

    try {
      const testUser = {
        email: `frontend_test_${timestamp}@test.com`,
        password: 'FrontendTest123!@#',
        username: `frontend_test_${timestamp}`,
        firstName: 'Frontend',
        lastName: 'Test'
      };

      // Fill form
      await page.evaluate((user) => {
        const emailInput = document.querySelector('input[type="email"], input[name="email"], input[placeholder*="email" i]');
        const passwordInput = document.querySelector('input[type="password"], input[name="password"]');
        const usernameInput = document.querySelector('input[name="username"], input[placeholder*="username" i]');
        const firstNameInput = document.querySelector('input[name="firstName"], input[name="first_name"], input[placeholder*="first" i]');
        const lastNameInput = document.querySelector('input[name="lastName"], input[name="last_name"], input[placeholder*="last" i]');

        if (emailInput) emailInput.value = user.email;
        if (passwordInput) passwordInput.value = user.password;
        if (usernameInput) usernameInput.value = user.username;
        if (firstNameInput) firstNameInput.value = user.firstName;
        if (lastNameInput) lastNameInput.value = user.lastName;

        // Trigger input events
        [emailInput, passwordInput, usernameInput, firstNameInput, lastNameInput].forEach(input => {
          if (input) {
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
          }
        });
      }, testUser);

      await wait(500);

      // Take screenshot before submission
      await page.screenshot({ path: `registration-form-filled-${timestamp}.png` });
      console.log(`   📸 Screenshot saved: registration-form-filled-${timestamp}.png`);

      // Submit form
      await page.evaluate(() => {
        const submitButton = document.querySelector('button[type="submit"]');
        if (submitButton) submitButton.click();
      });

      // Wait for response
      await wait(3000);

      // Check for success message or redirect
      const result = await page.evaluate(() => {
        const bodyText = document.body.textContent.toLowerCase();
        return {
          hasSuccessMessage: bodyText.includes('success') ||
                           bodyText.includes('registered') ||
                           bodyText.includes('verification') ||
                           bodyText.includes('check your email'),
          hasErrorMessage: bodyText.includes('error') ||
                          bodyText.includes('failed') ||
                          bodyText.includes('invalid'),
          currentUrl: window.location.href
        };
      });

      // Take screenshot after submission
      await page.screenshot({ path: `registration-result-${timestamp}.png` });
      console.log(`   📸 Screenshot saved: registration-result-${timestamp}.png`);

      logTest(
        'Valid registration submission',
        result.hasSuccessMessage || result.currentUrl.includes('verify') || result.currentUrl.includes('login'),
        result.hasSuccessMessage ? 'Success message displayed' :
        result.currentUrl !== FRONTEND_URL ? 'Redirected after registration' :
        result.hasErrorMessage ? 'Error message shown' : 'No clear feedback',
        result
      );

    } catch (err) {
      logTest('Valid registration submission', false, err.message);
    }

    // Test 5: Required field validation
    console.log('📝 Test 5: Client-Side Validation (Empty Email)');
    console.log('-'.repeat(70));

    try {
      // Refresh or navigate back to registration form
      await page.goto(FRONTEND_URL, { waitUntil: 'networkidle2' });
      await wait(1000);

      // Open registration form again
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, a, [role="button"]'));
        const registerBtn = buttons.find(btn => {
          const text = btn.textContent.toLowerCase();
          return text.includes('register') || text.includes('sign up');
        });
        if (registerBtn) registerBtn.click();
      });

      await wait(1000);

      // Try to submit empty form
      await page.evaluate(() => {
        const submitButton = document.querySelector('button[type="submit"]');
        if (submitButton) submitButton.click();
      });

      await wait(1000);

      // Check for validation messages
      const validationResult = await page.evaluate(() => {
        const bodyText = document.body.textContent.toLowerCase();
        const hasValidationMessage = bodyText.includes('required') ||
                                     bodyText.includes('please') ||
                                     bodyText.includes('field');

        // Check HTML5 validation
        const emailInput = document.querySelector('input[type="email"], input[name="email"]');
        const hasHTML5Validation = emailInput ? !emailInput.validity.valid : false;

        return {
          hasValidationMessage,
          hasHTML5Validation,
          bodyText: bodyText.slice(0, 200) // First 200 chars for debugging
        };
      });

      logTest(
        'Empty field validation',
        validationResult.hasValidationMessage || validationResult.hasHTML5Validation,
        validationResult.hasValidationMessage ? 'Validation message shown' :
        validationResult.hasHTML5Validation ? 'HTML5 validation working' :
        'No validation detected',
        validationResult
      );

    } catch (err) {
      logTest('Empty field validation', false, err.message);
    }

    // Test 6: Invalid email format validation
    console.log('📝 Test 6: Invalid Email Format Validation');
    console.log('-'.repeat(70));

    try {
      // Fill with invalid email
      await page.evaluate(() => {
        const emailInput = document.querySelector('input[type="email"], input[name="email"]');
        const passwordInput = document.querySelector('input[type="password"]');
        const usernameInput = document.querySelector('input[name="username"]');

        if (emailInput) emailInput.value = 'notanemail';
        if (passwordInput) passwordInput.value = 'ValidPass123!';
        if (usernameInput) usernameInput.value = 'testuser';

        [emailInput, passwordInput, usernameInput].forEach(input => {
          if (input) {
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
          }
        });
      });

      await wait(500);

      // Try to submit
      await page.evaluate(() => {
        const submitButton = document.querySelector('button[type="submit"]');
        if (submitButton) submitButton.click();
      });

      await wait(1000);

      // Check for validation
      const emailValidation = await page.evaluate(() => {
        const emailInput = document.querySelector('input[type="email"], input[name="email"]');
        const bodyText = document.body.textContent.toLowerCase();

        return {
          html5Valid: emailInput ? emailInput.validity.valid : true,
          hasErrorMessage: bodyText.includes('valid email') ||
                          bodyText.includes('invalid') ||
                          bodyText.includes('format')
        };
      });

      logTest(
        'Invalid email format validation',
        !emailValidation.html5Valid || emailValidation.hasErrorMessage,
        !emailValidation.html5Valid ? 'HTML5 validation blocked invalid email' :
        emailValidation.hasErrorMessage ? 'Error message shown' :
        'Invalid email was accepted',
        emailValidation
      );

    } catch (err) {
      logTest('Invalid email format validation', false, err.message);
    }

    // Test 7: Page errors check
    console.log('📝 Test 7: JavaScript Errors Check');
    console.log('-'.repeat(70));

    logTest(
      'No JavaScript errors',
      errors.length === 0,
      errors.length === 0 ? 'Page loaded without errors' : `${errors.length} error(s) detected`,
      errors.length > 0 ? errors : null
    );

  } catch (error) {
    console.error('\n❌ Test suite encountered fatal error:');
    console.error(error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  // Print final report
  console.log('\n' + '='.repeat(70));
  console.log('📊 FINAL FRONTEND TEST REPORT');
  console.log('='.repeat(70));
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`✅ Passed: ${testResults.passed} (${((testResults.passed/testResults.total)*100).toFixed(1)}%)`);
  console.log(`❌ Failed: ${testResults.failed} (${((testResults.failed/testResults.total)*100).toFixed(1)}%)`);
  console.log('');

  // Group by category
  console.log('📋 Test Results by Category:');
  console.log('-'.repeat(70));

  const categories = {
    'Page Load': ['page loads'],
    'UI Elements': ['button', 'input', 'submit'],
    'Form Submission': ['submission', 'registration'],
    'Validation': ['validation', 'email'],
    'Error Handling': ['errors']
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
    console.log('✅ EXCELLENT - Frontend registration is working well');
  } else if (passRate >= 70) {
    console.log('⚠️  GOOD - Frontend registration works but has some issues');
  } else if (passRate >= 50) {
    console.log('⚠️  NEEDS ATTENTION - Frontend registration has significant issues');
  } else {
    console.log('❌ CRITICAL - Frontend registration has major problems');
  }

  console.log('\n');
  return testResults;
}

// Run the test
testFrontendRegistration().then(results => {
  process.exit(results.failed > 0 ? 1 : 0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
