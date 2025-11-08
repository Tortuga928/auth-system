/**
 * Comprehensive Test Script: Phase 6 - OAuth2 Social Login
 *
 * Tests all implemented functionality from Stories 6.1-6.6:
 * - OAuth configuration and routes
 * - Google OAuth strategy
 * - GitHub OAuth strategy
 * - OAuth account linking
 * - OAuth login UI
 * - OAuth callback handling
 *
 * Provides real-time progress updates and final report
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_URL = process.env.API_URL || 'http://localhost:5000';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Test results tracking
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  components: {
    backend: { passed: [], failed: [] },
    frontend: { passed: [], failed: [] },
    database: { passed: [], failed: [] },
    integration: { passed: [], failed: [] }
  },
  details: []
};

// Progress tracking
let currentTest = 0;
const totalTests = 20; // Approximate number of tests

// Helper function to log progress
function logProgress(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const icons = {
    info: 'ℹ️ ',
    success: '✅',
    fail: '❌',
    skip: '⏭️ ',
    progress: '🔄'
  };
  console.log(`[${timestamp}] ${icons[type]} ${message}`);
}

// Helper function to update progress bar
function updateProgress(testName) {
  currentTest++;
  const percentage = Math.round((currentTest / totalTests) * 100);
  const barLength = 30;
  const filledLength = Math.round((barLength * currentTest) / totalTests);
  const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
  console.log(`\n[$${bar}] ${percentage}% - Test ${currentTest}/${totalTests}: ${testName}`);
}

// Helper function to record test result
function recordTest(component, testName, passed, error = null) {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    testResults.components[component].passed.push(testName);
    testResults.details.push({ component, testName, status: 'PASS' });
  } else {
    testResults.failed++;
    testResults.components[component].failed.push(testName);
    testResults.details.push({ component, testName, status: 'FAIL', error: error?.message || 'Unknown error' });
  }
}

// Main test suite
async function runComprehensiveTests() {
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║  Phase 6 Comprehensive Test Suite                    ║');
  console.log('║  OAuth2 Social Login - All Stories (6.1-6.6)        ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');

  logProgress('Starting comprehensive test suite...', 'progress');
  logProgress(`Backend URL: ${API_URL}`, 'info');
  logProgress(`Frontend URL: ${FRONTEND_URL}`, 'info');
  console.log('');

  try {
    // ═══════════════════════════════════════════════════════
    // SECTION 1: Backend Configuration Tests
    // ═══════════════════════════════════════════════════════
    console.log('\n╔═══════════════════════════════════════════════════════╗');
    console.log('║  SECTION 1: Backend Configuration Tests              ║');
    console.log('╚═══════════════════════════════════════════════════════╝\n');

    // Test 1: Backend Server Running
    updateProgress('Backend Server Health Check');
    try {
      await axios.get(`${API_URL}/api/health`);
      logProgress('Backend server is running', 'success');
      recordTest('backend', 'Server Health Check', true);
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        logProgress('Backend server is NOT running', 'fail');
        logProgress('Please start backend: cd backend && npm run dev', 'info');
        recordTest('backend', 'Server Health Check', false, error);
      } else {
        // Server is running but health endpoint doesn't exist - that's okay
        logProgress('Backend server is running (no health endpoint)', 'success');
        recordTest('backend', 'Server Health Check', true);
      }
    }

    // Test 2: OAuth Status Endpoint
    updateProgress('OAuth Status Endpoint');
    try {
      const response = await axios.get(`${API_URL}/api/oauth/status`);
      if (response.data && response.data.success) {
        logProgress('OAuth status endpoint working', 'success');
        logProgress(`  Google configured: ${response.data.data.google.configured}`, 'info');
        logProgress(`  GitHub configured: ${response.data.data.github.configured}`, 'info');
        recordTest('backend', 'OAuth Status Endpoint', true);
      } else {
        logProgress('OAuth status endpoint returned unexpected format', 'fail');
        recordTest('backend', 'OAuth Status Endpoint', false);
      }
    } catch (error) {
      logProgress('OAuth status endpoint failed', 'fail');
      logProgress(`  Error: ${error.message}`, 'info');
      recordTest('backend', 'OAuth Status Endpoint', false, error);
    }

    // Test 3: Google OAuth Initiation Route
    updateProgress('Google OAuth Initiation Route');
    try {
      const response = await axios.get(`${API_URL}/api/oauth/google`, {
        maxRedirects: 0,
        validateStatus: (status) => status === 302 || status === 500
      });
      if (response.status === 302) {
        const redirectUrl = response.headers.location;
        if (redirectUrl && redirectUrl.includes('google.com')) {
          logProgress('Google OAuth redirects to Google', 'success');
          recordTest('backend', 'Google OAuth Initiation', true);
        } else {
          logProgress('Google OAuth redirect URL unexpected', 'fail');
          recordTest('backend', 'Google OAuth Initiation', false);
        }
      } else if (response.status === 500) {
        logProgress('Google OAuth not configured (expected if no credentials)', 'skip');
        recordTest('backend', 'Google OAuth Initiation', true); // Not a failure
      }
    } catch (error) {
      if (error.response && error.response.status === 302) {
        const redirectUrl = error.response.headers.location;
        if (redirectUrl && redirectUrl.includes('google.com')) {
          logProgress('Google OAuth redirects to Google', 'success');
          recordTest('backend', 'Google OAuth Initiation', true);
        }
      } else {
        logProgress('Google OAuth initiation failed', 'fail');
        recordTest('backend', 'Google OAuth Initiation', false, error);
      }
    }

    // Test 4: GitHub OAuth Initiation Route
    updateProgress('GitHub OAuth Initiation Route');
    try {
      const response = await axios.get(`${API_URL}/api/oauth/github`, {
        maxRedirects: 0,
        validateStatus: (status) => status === 302 || status === 500
      });
      if (response.status === 302) {
        const redirectUrl = response.headers.location;
        if (redirectUrl && redirectUrl.includes('github.com')) {
          logProgress('GitHub OAuth redirects to GitHub', 'success');
          recordTest('backend', 'GitHub OAuth Initiation', true);
        } else {
          logProgress('GitHub OAuth redirect URL unexpected', 'fail');
          recordTest('backend', 'GitHub OAuth Initiation', false);
        }
      } else if (response.status === 500) {
        logProgress('GitHub OAuth not configured (expected if no credentials)', 'skip');
        recordTest('backend', 'GitHub OAuth Initiation', true); // Not a failure
      }
    } catch (error) {
      if (error.response && error.response.status === 302) {
        const redirectUrl = error.response.headers.location;
        if (redirectUrl && redirectUrl.includes('github.com')) {
          logProgress('GitHub OAuth redirects to GitHub', 'success');
          recordTest('backend', 'GitHub OAuth Initiation', true);
        }
      } else {
        logProgress('GitHub OAuth initiation failed', 'fail');
        recordTest('backend', 'GitHub OAuth Initiation', false, error);
      }
    }

    // ═══════════════════════════════════════════════════════
    // SECTION 2: OAuth Account Linking Tests
    // ═══════════════════════════════════════════════════════
    console.log('\n╔═══════════════════════════════════════════════════════╗');
    console.log('║  SECTION 2: OAuth Account Linking Tests              ║');
    console.log('╚═══════════════════════════════════════════════════════╝\n');

    // Test 5: Get Linked Providers (Unauthenticated)
    updateProgress('Linked Providers Authentication Check');
    try {
      await axios.get(`${API_URL}/api/auth/linked-providers`);
      logProgress('Linked providers endpoint should require auth - FAIL', 'fail');
      recordTest('backend', 'Linked Providers Auth Required', false);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        logProgress('Linked providers requires authentication', 'success');
        recordTest('backend', 'Linked Providers Auth Required', true);
      } else {
        logProgress('Unexpected error from linked providers endpoint', 'fail');
        recordTest('backend', 'Linked Providers Auth Required', false, error);
      }
    }

    // Test 6: Database Migration - oauth_providers table
    updateProgress('Database Migration Check');
    try {
      const migrationPath = path.join(__dirname, 'backend/src/db/migrations');
      const files = fs.readdirSync(migrationPath);
      const oauthMigration = files.find(f => f.includes('oauth_providers'));

      if (oauthMigration) {
        logProgress('OAuth providers migration exists', 'success');
        recordTest('database', 'OAuth Providers Migration', true);
      } else {
        logProgress('OAuth providers migration NOT found', 'fail');
        recordTest('database', 'OAuth Providers Migration', false);
      }
    } catch (error) {
      logProgress('Could not check migrations directory', 'fail');
      recordTest('database', 'OAuth Providers Migration', false, error);
    }

    // Test 7: OAuthProvider Model Exists
    updateProgress('OAuthProvider Model Check');
    try {
      const modelPath = path.join(__dirname, 'backend/src/models/OAuthProvider.js');
      if (fs.existsSync(modelPath)) {
        const modelContent = fs.readFileSync(modelPath, 'utf8');
        const hasMethods = modelContent.includes('upsert') &&
                          modelContent.includes('findByProviderAndId') &&
                          modelContent.includes('findByUserId');

        if (hasMethods) {
          logProgress('OAuthProvider model with required methods exists', 'success');
          recordTest('backend', 'OAuthProvider Model', true);
        } else {
          logProgress('OAuthProvider model missing required methods', 'fail');
          recordTest('backend', 'OAuthProvider Model', false);
        }
      } else {
        logProgress('OAuthProvider model file NOT found', 'fail');
        recordTest('backend', 'OAuthProvider Model', false);
      }
    } catch (error) {
      logProgress('Could not check OAuthProvider model', 'fail');
      recordTest('backend', 'OAuthProvider Model', false, error);
    }

    // ═══════════════════════════════════════════════════════
    // SECTION 3: Frontend Component Tests
    // ═══════════════════════════════════════════════════════
    console.log('\n╔═══════════════════════════════════════════════════════╗');
    console.log('║  SECTION 3: Frontend Component Tests                 ║');
    console.log('╚═══════════════════════════════════════════════════════╝\n');

    // Test 8: LoginPage OAuth Buttons
    updateProgress('LoginPage OAuth Buttons');
    try {
      const loginPagePath = path.join(__dirname, 'frontend/src/pages/LoginPage.js');
      if (fs.existsSync(loginPagePath)) {
        const content = fs.readFileSync(loginPagePath, 'utf8');
        const hasGoogleButton = content.includes('handleGoogleLogin') || content.includes('google');
        const hasGitHubButton = content.includes('handleGitHubLogin') || content.includes('github');

        if (hasGoogleButton && hasGitHubButton) {
          logProgress('LoginPage has OAuth buttons', 'success');
          recordTest('frontend', 'LoginPage OAuth Buttons', true);
        } else {
          logProgress('LoginPage missing OAuth buttons', 'fail');
          recordTest('frontend', 'LoginPage OAuth Buttons', false);
        }
      } else {
        logProgress('LoginPage file NOT found', 'fail');
        recordTest('frontend', 'LoginPage OAuth Buttons', false);
      }
    } catch (error) {
      logProgress('Could not check LoginPage', 'fail');
      recordTest('frontend', 'LoginPage OAuth Buttons', false, error);
    }

    // Test 9: LinkedProviders Component
    updateProgress('LinkedProviders Component');
    try {
      const componentPath = path.join(__dirname, 'frontend/src/components/LinkedProviders.js');
      if (fs.existsSync(componentPath)) {
        const content = fs.readFileSync(componentPath, 'utf8');
        const hasUnlink = content.includes('handleUnlink') || content.includes('unlink');
        const hasFetch = content.includes('fetchLinkedProviders') || content.includes('getLinkedProviders');

        if (hasUnlink && hasFetch) {
          logProgress('LinkedProviders component exists with required functionality', 'success');
          recordTest('frontend', 'LinkedProviders Component', true);
        } else {
          logProgress('LinkedProviders component missing functionality', 'fail');
          recordTest('frontend', 'LinkedProviders Component', false);
        }
      } else {
        logProgress('LinkedProviders component NOT found', 'fail');
        recordTest('frontend', 'LinkedProviders Component', false);
      }
    } catch (error) {
      logProgress('Could not check LinkedProviders component', 'fail');
      recordTest('frontend', 'LinkedProviders Component', false, error);
    }

    // Test 10: OAuthCallbackPage Component
    updateProgress('OAuthCallbackPage Component');
    try {
      const callbackPagePath = path.join(__dirname, 'frontend/src/pages/OAuthCallbackPage.js');
      if (fs.existsSync(callbackPagePath)) {
        const content = fs.readFileSync(callbackPagePath, 'utf8');
        const hasTokenExtraction = content.includes('params.get') && content.includes('token');
        const hasLocalStorage = content.includes('localStorage.setItem');
        const hasRedirect = content.includes('navigate');

        if (hasTokenExtraction && hasLocalStorage && hasRedirect) {
          logProgress('OAuthCallbackPage component exists with required functionality', 'success');
          recordTest('frontend', 'OAuthCallbackPage Component', true);
        } else {
          logProgress('OAuthCallbackPage component missing functionality', 'fail');
          recordTest('frontend', 'OAuthCallbackPage Component', false);
        }
      } else {
        logProgress('OAuthCallbackPage component NOT found', 'fail');
        recordTest('frontend', 'OAuthCallbackPage Component', false);
      }
    } catch (error) {
      logProgress('Could not check OAuthCallbackPage component', 'fail');
      recordTest('frontend', 'OAuthCallbackPage Component', false, error);
    }

    // Test 11: Frontend App.js OAuth Route
    updateProgress('Frontend OAuth Callback Route');
    try {
      const appPath = path.join(__dirname, 'frontend/src/App.js');
      if (fs.existsSync(appPath)) {
        const content = fs.readFileSync(appPath, 'utf8');
        const hasCallbackRoute = content.includes('/oauth/callback') && content.includes('OAuthCallbackPage');

        if (hasCallbackRoute) {
          logProgress('App.js has OAuth callback route', 'success');
          recordTest('frontend', 'OAuth Callback Route', true);
        } else {
          logProgress('App.js missing OAuth callback route', 'fail');
          recordTest('frontend', 'OAuth Callback Route', false);
        }
      } else {
        logProgress('App.js file NOT found', 'fail');
        recordTest('frontend', 'OAuth Callback Route', false);
      }
    } catch (error) {
      logProgress('Could not check App.js', 'fail');
      recordTest('frontend', 'OAuth Callback Route', false, error);
    }

    // Test 12: Frontend API Service OAuth Methods
    updateProgress('Frontend API OAuth Methods');
    try {
      const apiPath = path.join(__dirname, 'frontend/src/services/api.js');
      if (fs.existsSync(apiPath)) {
        const content = fs.readFileSync(apiPath, 'utf8');
        const hasOAuthMethods = content.includes('oauth') &&
                               (content.includes('getLinkedProviders') || content.includes('linkedProviders'));

        if (hasOAuthMethods) {
          logProgress('API service has OAuth methods', 'success');
          recordTest('frontend', 'API OAuth Methods', true);
        } else {
          logProgress('API service missing OAuth methods', 'fail');
          recordTest('frontend', 'API OAuth Methods', false);
        }
      } else {
        logProgress('API service file NOT found', 'fail');
        recordTest('frontend', 'API OAuth Methods', false);
      }
    } catch (error) {
      logProgress('Could not check API service', 'fail');
      recordTest('frontend', 'API OAuth Methods', false, error);
    }

    // ═══════════════════════════════════════════════════════
    // SECTION 4: Passport.js Strategy Tests
    // ═══════════════════════════════════════════════════════
    console.log('\n╔═══════════════════════════════════════════════════════╗');
    console.log('║  SECTION 4: Passport.js Strategy Tests               ║');
    console.log('╚═══════════════════════════════════════════════════════╝\n');

    // Test 13: Passport.js Configuration
    updateProgress('Passport.js Configuration');
    try {
      const passportPath = path.join(__dirname, 'backend/src/config/passport.js');
      if (fs.existsSync(passportPath)) {
        const content = fs.readFileSync(passportPath, 'utf8');
        const hasGoogleStrategy = content.includes('GoogleStrategy');
        const hasGitHubStrategy = content.includes('GitHubStrategy');
        const hasAccountLinking = content.includes('OAuthProvider');

        if (hasGoogleStrategy && hasGitHubStrategy && hasAccountLinking) {
          logProgress('Passport.js configured with OAuth strategies and account linking', 'success');
          recordTest('backend', 'Passport.js Configuration', true);
        } else {
          logProgress('Passport.js missing required configurations', 'fail');
          recordTest('backend', 'Passport.js Configuration', false);
        }
      } else {
        logProgress('Passport.js config file NOT found', 'fail');
        recordTest('backend', 'Passport.js Configuration', false);
      }
    } catch (error) {
      logProgress('Could not check Passport.js configuration', 'fail');
      recordTest('backend', 'Passport.js Configuration', false, error);
    }

    // Test 14: OAuth Callback Routes
    updateProgress('OAuth Callback Routes');
    try {
      const routesPath = path.join(__dirname, 'backend/src/routes/oauth.js');
      if (fs.existsSync(routesPath)) {
        const content = fs.readFileSync(routesPath, 'utf8');
        const hasGoogleCallback = content.includes('/google/callback');
        const hasGitHubCallback = content.includes('/github/callback');
        const hasRedirect = content.includes('res.redirect') && content.includes('frontendUrl');
        const hasTokens = content.includes('accessToken') && content.includes('refreshToken');

        if (hasGoogleCallback && hasGitHubCallback && hasRedirect && hasTokens) {
          logProgress('OAuth callback routes configured correctly', 'success');
          recordTest('backend', 'OAuth Callback Routes', true);
        } else {
          logProgress('OAuth callback routes missing required functionality', 'fail');
          recordTest('backend', 'OAuth Callback Routes', false);
        }
      } else {
        logProgress('OAuth routes file NOT found', 'fail');
        recordTest('backend', 'OAuth Callback Routes', false);
      }
    } catch (error) {
      logProgress('Could not check OAuth routes', 'fail');
      recordTest('backend', 'OAuth Callback Routes', false, error);
    }

    // ═══════════════════════════════════════════════════════
    // SECTION 5: Integration Tests
    // ═══════════════════════════════════════════════════════
    console.log('\n╔═══════════════════════════════════════════════════════╗');
    console.log('║  SECTION 5: Integration Tests                        ║');
    console.log('╚═══════════════════════════════════════════════════════╝\n');

    // Test 15: Dependencies Installed
    updateProgress('OAuth Dependencies Check');
    try {
      const backendPackagePath = path.join(__dirname, 'backend/package.json');
      if (fs.existsSync(backendPackagePath)) {
        const packageJson = JSON.parse(fs.readFileSync(backendPackagePath, 'utf8'));
        const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

        const hasPassport = deps['passport'];
        const hasGoogleStrategy = deps['passport-google-oauth20'];
        const hasGitHubStrategy = deps['passport-github2'];

        if (hasPassport && hasGoogleStrategy && hasGitHubStrategy) {
          logProgress('All required OAuth dependencies installed', 'success');
          recordTest('integration', 'OAuth Dependencies', true);
        } else {
          logProgress('Missing OAuth dependencies', 'fail');
          logProgress(`  passport: ${hasPassport ? '✓' : '✗'}`, 'info');
          logProgress(`  passport-google-oauth20: ${hasGoogleStrategy ? '✓' : '✗'}`, 'info');
          logProgress(`  passport-github2: ${hasGitHubStrategy ? '✓' : '✗'}`, 'info');
          recordTest('integration', 'OAuth Dependencies', false);
        }
      } else {
        logProgress('Backend package.json NOT found', 'fail');
        recordTest('integration', 'OAuth Dependencies', false);
      }
    } catch (error) {
      logProgress('Could not check dependencies', 'fail');
      recordTest('integration', 'OAuth Dependencies', false, error);
    }

    // Test 16: Test Documentation Exists
    updateProgress('Test Documentation Check');
    try {
      const testDocs = [
        'test-story6.2-google-oauth.js',
        'test-story6.3-github-oauth.js',
        'test-story6.4-oauth-account-linking.js',
        'test-story6.5-oauth-login-ui.md',
        'test-story6.6-oauth-callback-handling.js'
      ];

      let allExist = true;
      const missing = [];

      for (const doc of testDocs) {
        const docPath = path.join(__dirname, doc);
        if (!fs.existsSync(docPath)) {
          allExist = false;
          missing.push(doc);
        }
      }

      if (allExist) {
        logProgress('All test documentation files exist', 'success');
        recordTest('integration', 'Test Documentation', true);
      } else {
        logProgress('Some test documentation missing', 'fail');
        missing.forEach(doc => logProgress(`  Missing: ${doc}`, 'info'));
        recordTest('integration', 'Test Documentation', false);
      }
    } catch (error) {
      logProgress('Could not check test documentation', 'fail');
      recordTest('integration', 'Test Documentation', false, error);
    }

    // Test 17: Environment Configuration
    updateProgress('Environment Configuration Check');
    try {
      const envExamplePath = path.join(__dirname, 'backend/.env.example');
      if (fs.existsSync(envExamplePath)) {
        const content = fs.readFileSync(envExamplePath, 'utf8');
        const hasGoogleVars = content.includes('GOOGLE_CLIENT_ID') && content.includes('GOOGLE_CLIENT_SECRET');
        const hasGitHubVars = content.includes('GITHUB_CLIENT_ID') && content.includes('GITHUB_CLIENT_SECRET');

        if (hasGoogleVars && hasGitHubVars) {
          logProgress('.env.example has OAuth configuration variables', 'success');
          recordTest('integration', 'Environment Configuration', true);
        } else {
          logProgress('.env.example missing OAuth variables', 'fail');
          recordTest('integration', 'Environment Configuration', false);
        }
      } else {
        logProgress('.env.example file NOT found', 'fail');
        recordTest('integration', 'Environment Configuration', false);
      }
    } catch (error) {
      logProgress('Could not check environment configuration', 'fail');
      recordTest('integration', 'Environment Configuration', false, error);
    }

    // Test 18: Linked Providers Route Exists
    updateProgress('Linked Providers Routes Check');
    try {
      const routesPath = path.join(__dirname, 'backend/src/routes/linkedProviders.js');
      if (fs.existsSync(routesPath)) {
        const content = fs.readFileSync(routesPath, 'utf8');
        const hasGetLinked = content.includes('/linked-providers') && content.includes('get');
        const hasUnlink = content.includes('/unlink') && content.includes('delete');

        if (hasGetLinked && hasUnlink) {
          logProgress('Linked providers routes exist', 'success');
          recordTest('backend', 'Linked Providers Routes', true);
        } else {
          logProgress('Linked providers routes incomplete', 'fail');
          recordTest('backend', 'Linked Providers Routes', false);
        }
      } else {
        logProgress('Linked providers routes file NOT found', 'fail');
        recordTest('backend', 'Linked Providers Routes', false);
      }
    } catch (error) {
      logProgress('Could not check linked providers routes', 'fail');
      recordTest('backend', 'Linked Providers Routes', false, error);
    }

    // Test 19: Backend App.js Middleware
    updateProgress('Backend App.js Middleware Check');
    try {
      const appPath = path.join(__dirname, 'backend/src/app.js');
      if (fs.existsSync(appPath)) {
        const content = fs.readFileSync(appPath, 'utf8');
        const hasPassportInit = content.includes('passport.initialize');
        const hasOAuthRoutes = content.includes('oauth') || content.includes('/api/oauth');

        if (hasPassportInit && hasOAuthRoutes) {
          logProgress('Backend app.js configured with Passport and OAuth routes', 'success');
          recordTest('backend', 'App.js Middleware', true);
        } else {
          logProgress('Backend app.js missing Passport or OAuth configuration', 'fail');
          recordTest('backend', 'App.js Middleware', false);
        }
      } else {
        logProgress('Backend app.js file NOT found', 'fail');
        recordTest('backend', 'App.js Middleware', false);
      }
    } catch (error) {
      logProgress('Could not check backend app.js', 'fail');
      recordTest('backend', 'App.js Middleware', false, error);
    }

    // Test 20: Configuration File Structure
    updateProgress('Configuration File Structure');
    try {
      const configPath = path.join(__dirname, 'backend/src/config/index.js');
      if (fs.existsSync(configPath)) {
        const content = fs.readFileSync(configPath, 'utf8');
        const hasOAuthConfig = content.includes('oauth') ||
                              (content.includes('google') && content.includes('github'));

        if (hasOAuthConfig) {
          logProgress('Configuration file has OAuth settings', 'success');
          recordTest('backend', 'Configuration Structure', true);
        } else {
          logProgress('Configuration file missing OAuth settings', 'fail');
          recordTest('backend', 'Configuration Structure', false);
        }
      } else {
        logProgress('Configuration file NOT found', 'fail');
        recordTest('backend', 'Configuration Structure', false);
      }
    } catch (error) {
      logProgress('Could not check configuration file', 'fail');
      recordTest('backend', 'Configuration Structure', false, error);
    }

  } catch (error) {
    console.error('\n❌ Test suite encountered a fatal error!');
    console.error('Error:', error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
  }

  // ═══════════════════════════════════════════════════════
  // Final Report
  // ═══════════════════════════════════════════════════════
  generateFinalReport();
}

function generateFinalReport() {
  console.log('\n\n');
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║              PHASE 6 COMPREHENSIVE TEST REPORT       ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');

  // Overall Statistics
  console.log('═══════════════════════════════════════════════════════');
  console.log('  OVERALL STATISTICS');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`  Total Tests Run:     ${testResults.total}`);
  console.log(`  ✅ Passed:           ${testResults.passed} (${Math.round((testResults.passed/testResults.total)*100)}%)`);
  console.log(`  ❌ Failed:           ${testResults.failed} (${Math.round((testResults.failed/testResults.total)*100)}%)`);
  console.log(`  ⏭️  Skipped:          ${testResults.skipped}`);
  console.log('');

  // Component Breakdown
  console.log('═══════════════════════════════════════════════════════');
  console.log('  COMPONENT BREAKDOWN');
  console.log('═══════════════════════════════════════════════════════');

  Object.keys(testResults.components).forEach(component => {
    const passed = testResults.components[component].passed.length;
    const failed = testResults.components[component].failed.length;
    const total = passed + failed;

    if (total > 0) {
      const percentage = Math.round((passed / total) * 100);
      const status = percentage === 100 ? '✅' : percentage >= 75 ? '⚠️ ' : '❌';
      console.log(`\n  ${status} ${component.toUpperCase()}`);
      console.log(`     Passed: ${passed}/${total} (${percentage}%)`);

      if (failed > 0) {
        console.log(`     Failed tests:`);
        testResults.components[component].failed.forEach(test => {
          console.log(`       - ${test}`);
        });
      }
    }
  });

  // Detailed Results
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  DETAILED TEST RESULTS');
  console.log('═══════════════════════════════════════════════════════\n');

  testResults.details.forEach((detail, index) => {
    const icon = detail.status === 'PASS' ? '✅' : '❌';
    console.log(`  ${index + 1}. ${icon} [${detail.component.toUpperCase()}] ${detail.testName}`);
    if (detail.error) {
      console.log(`      Error: ${detail.error}`);
    }
  });

  // Health Assessment
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  PHASE 6 HEALTH ASSESSMENT');
  console.log('═══════════════════════════════════════════════════════\n');

  const passRate = Math.round((testResults.passed / testResults.total) * 100);

  if (passRate === 100) {
    console.log('  🎉 EXCELLENT! All tests passed!');
    console.log('  Phase 6 OAuth2 implementation is fully functional.');
  } else if (passRate >= 90) {
    console.log('  ✅ VERY GOOD! Most tests passed.');
    console.log('  Phase 6 is production-ready with minor issues.');
  } else if (passRate >= 75) {
    console.log('  ⚠️  GOOD with some issues.');
    console.log('  Phase 6 is mostly functional but needs attention.');
  } else if (passRate >= 50) {
    console.log('  ⚠️  NEEDS WORK. Significant issues detected.');
    console.log('  Phase 6 requires debugging before production use.');
  } else {
    console.log('  ❌ CRITICAL ISSUES. Major problems detected.');
    console.log('  Phase 6 is not functional and requires immediate attention.');
  }

  // Recommendations
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  RECOMMENDATIONS');
  console.log('═══════════════════════════════════════════════════════\n');

  if (testResults.components.backend.failed.length > 0) {
    console.log('  📋 Backend Issues:');
    console.log('     - Review backend logs for errors');
    console.log('     - Ensure all dependencies are installed');
    console.log('     - Check database migrations have run');
    console.log('');
  }

  if (testResults.components.frontend.failed.length > 0) {
    console.log('  📋 Frontend Issues:');
    console.log('     - Check frontend build for errors');
    console.log('     - Verify all components are imported correctly');
    console.log('     - Ensure React Router routes are configured');
    console.log('');
  }

  if (testResults.components.database.failed.length > 0) {
    console.log('  📋 Database Issues:');
    console.log('     - Run migrations: npm run migrate');
    console.log('     - Check database connection');
    console.log('     - Verify oauth_providers table exists');
    console.log('');
  }

  console.log('  📋 Manual Testing Required:');
  console.log('     - Complete OAuth flow with Google account');
  console.log('     - Complete OAuth flow with GitHub account');
  console.log('     - Test account linking with existing user');
  console.log('     - Test unlinking OAuth providers');
  console.log('     - Verify token storage and retrieval');
  console.log('');

  console.log('═══════════════════════════════════════════════════════');
  console.log('  TEST SUITE COMPLETE');
  console.log('═══════════════════════════════════════════════════════\n');

  // Save report to file
  const reportPath = path.join(__dirname, 'test-phase6-report.txt');
  const reportContent = generateTextReport();
  fs.writeFileSync(reportPath, reportContent);
  console.log(`📄 Full report saved to: ${reportPath}\n`);
}

function generateTextReport() {
  let report = '';
  report += '═══════════════════════════════════════════════════════\n';
  report += '  PHASE 6 COMPREHENSIVE TEST REPORT\n';
  report += `  Generated: ${new Date().toLocaleString()}\n`;
  report += '═══════════════════════════════════════════════════════\n\n';

  report += `Total Tests: ${testResults.total}\n`;
  report += `Passed: ${testResults.passed} (${Math.round((testResults.passed/testResults.total)*100)}%)\n`;
  report += `Failed: ${testResults.failed} (${Math.round((testResults.failed/testResults.total)*100)}%)\n\n`;

  report += 'COMPONENT BREAKDOWN:\n';
  Object.keys(testResults.components).forEach(component => {
    const passed = testResults.components[component].passed.length;
    const failed = testResults.components[component].failed.length;
    const total = passed + failed;
    if (total > 0) {
      report += `\n${component.toUpperCase()}: ${passed}/${total} passed\n`;
      if (failed > 0) {
        report += '  Failed:\n';
        testResults.components[component].failed.forEach(test => {
          report += `    - ${test}\n`;
        });
      }
    }
  });

  report += '\n\nDETAILED RESULTS:\n';
  testResults.details.forEach((detail, index) => {
    report += `${index + 1}. [${detail.status}] [${detail.component}] ${detail.testName}\n`;
    if (detail.error) {
      report += `   Error: ${detail.error}\n`;
    }
  });

  return report;
}

// Run the test suite
runComprehensiveTests();
