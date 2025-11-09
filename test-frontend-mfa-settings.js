/**
 * Comprehensive Frontend MFA Settings Page Test
 * Tests the actual frontend page loading and debugging
 */

const axios = require('axios');
const fs = require('fs');
const { execSync } = require('child_process');

const FRONTEND_URL = 'http://localhost:3000';
const BACKEND_URL = 'http://localhost:5000';

// Latest test user credentials
const testUser = {
  email: 'mfauser1762724305736@example.com',
  password: 'MFA123!@#Test',
  backupCode: '7FFC-5DBA', // Second code (first one was used)
};

async function testFrontendMFASettings() {
  console.log('\n' + '═'.repeat(80));
  console.log('🧪 FRONTEND MFA SETTINGS PAGE DIAGNOSTIC TEST');
  console.log('═'.repeat(80) + '\n');

  try {
    // Step 1: Check if frontend is running
    console.log('📡 Step 1: Checking if frontend is running...');
    try {
      const frontendResponse = await axios.get(FRONTEND_URL, { timeout: 5000 });
      console.log('✅ Frontend is running');
      console.log('   Status:', frontendResponse.status);
    } catch (err) {
      console.error('❌ Frontend is NOT running!');
      console.error('   Error:', err.message);
      console.error('   Make sure Docker containers are running: docker-compose ps');
      return;
    }

    // Step 2: Check if backend is running
    console.log('\n📡 Step 2: Checking if backend is running...');
    try {
      const backendResponse = await axios.get(`${BACKEND_URL}/health`, { timeout: 5000 });
      console.log('✅ Backend is running');
      console.log('   Status:', backendResponse.status);
    } catch (err) {
      console.error('❌ Backend is NOT running!');
      console.error('   Error:', err.message);
      return;
    }

    // Step 3: Login and get tokens
    console.log('\n🔐 Step 3: Logging in with MFA user...');
    const loginResponse = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      email: testUser.email,
      password: testUser.password,
    });
    console.log('✅ Login successful - MFA required');
    const mfaChallengeToken = loginResponse.data.data.mfaChallengeToken;

    // Step 4: Verify with backup code
    console.log('\n🔑 Step 4: Verifying with backup code...');
    const verifyResponse = await axios.post(`${BACKEND_URL}/api/auth/mfa/verify-backup`, {
      mfaChallengeToken,
      backupCode: testUser.backupCode,
    });
    console.log('✅ MFA verification successful');
    const accessToken = verifyResponse.data.data.tokens.accessToken;
    console.log('   Access token (first 30 chars):', accessToken.substring(0, 30) + '...');

    // Step 5: Test MFA status endpoint directly
    console.log('\n📊 Step 5: Testing MFA status endpoint...');
    const statusResponse = await axios.get(`${BACKEND_URL}/api/auth/mfa/status`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    console.log('✅ MFA Status endpoint works!');
    console.log('   Data:', JSON.stringify(statusResponse.data, null, 2));

    // Step 6: Check if MFA Settings route exists in frontend
    console.log('\n🔍 Step 6: Checking frontend MFA Settings page...');
    try {
      const mfaPageResponse = await axios.get(`${FRONTEND_URL}/mfa-settings`, {
        timeout: 5000,
        validateStatus: () => true, // Accept any status
      });
      console.log('✅ MFA Settings page responded');
      console.log('   Status:', mfaPageResponse.status);
      console.log('   Content-Type:', mfaPageResponse.headers['content-type']);

      // Check if it's HTML
      if (mfaPageResponse.headers['content-type']?.includes('text/html')) {
        console.log('   ✅ Returned HTML (as expected)');

        const html = mfaPageResponse.data;
        const hasRootDiv = html.includes('id="root"');
        const hasMainBundle = html.includes('main.') && html.includes('.js');

        console.log('   React root div exists:', hasRootDiv);
        console.log('   Has main bundle reference:', hasMainBundle);

        if (!hasMainBundle) {
          console.log('   ⚠️  No main bundle found!');
        }
      } else {
        console.log('   ❌ Did NOT return HTML!');
        console.log('   Response preview:', mfaPageResponse.data.substring(0, 200));
      }
    } catch (err) {
      console.error('❌ MFA Settings page error:', err.message);
    }

    // Step 7: Check for JavaScript errors by examining bundle
    console.log('\n🔍 Step 7: Checking if useMFA.js has debugging code...');
    try {
      const useMFAFile = fs.readFileSync(
        'C:/Users/MSTor/Projects/auth-system/frontend/src/hooks/useMFA.js',
        'utf8'
      );

      const hasHookInitLog = useMFAFile.includes('Hook initialized!');
      const hasUseEffectLog = useMFAFile.includes('useEffect triggered');
      const hasFetchLog = useMFAFile.includes('fetchMFAStatus called');

      console.log('   Hook initialization log:', hasHookInitLog ? '✅ Present' : '❌ Missing');
      console.log('   useEffect log:', hasUseEffectLog ? '✅ Present' : '❌ Missing');
      console.log('   fetchMFAStatus log:', hasFetchLog ? '✅ Present' : '❌ Missing');

      if (!hasHookInitLog || !hasUseEffectLog || !hasFetchLog) {
        console.log('   ❌ Debugging logs are MISSING from source file!');
      }
    } catch (err) {
      console.log('   ⚠️  Could not read source file:', err.message);
    }

    // Step 8: Check MFASettingsPage.jsx
    console.log('\n🔍 Step 8: Checking if MFASettingsPage.jsx has debugging code...');
    try {
      const mfaPageFile = fs.readFileSync(
        'C:/Users/MSTor/Projects/auth-system/frontend/src/pages/MFASettingsPage.jsx',
        'utf8'
      );

      const hasComponentLog = mfaPageFile.includes('Component rendering');
      const hasHookValuesLog = mfaPageFile.includes('Hook returned values');

      console.log('   Component rendering log:', hasComponentLog ? '✅ Present' : '❌ Missing');
      console.log('   Hook values log:', hasHookValuesLog ? '✅ Present' : '❌ Missing');

      if (!hasComponentLog || !hasHookValuesLog) {
        console.log('   ❌ Debugging logs are MISSING from source file!');
      }
    } catch (err) {
      console.log('   ⚠️  Could not read source file:', err.message);
    }

    // Step 9: Check Docker container status
    console.log('\n🐳 Step 9: Checking Docker container logs...');
    try {
      const dockerLogs = execSync('docker-compose logs frontend --tail 20', {
        cwd: 'C:/Users/MSTor/Projects/auth-system',
        encoding: 'utf8',
      });

      const hasCompiledSuccess = dockerLogs.includes('Compiled successfully');
      const hasError = dockerLogs.includes('ERROR') || dockerLogs.includes('Failed to compile');

      console.log('   Compiled successfully:', hasCompiledSuccess ? '✅ Yes' : '❌ No');
      console.log('   Has errors:', hasError ? '❌ Yes' : '✅ No');

      if (hasCompiledSuccess) {
        // Find the timestamp of last compilation
        const lines = dockerLogs.split('\n');
        const compiledLine = lines.find(line => line.includes('Compiled successfully'));
        if (compiledLine) {
          console.log('   Last compilation:', compiledLine.trim());
        }
      }

      if (hasError) {
        console.log('   ⚠️  Frontend has compilation errors!');
        console.log('\n   Last 20 log lines:');
        console.log(dockerLogs);
      }
    } catch (err) {
      console.log('   ⚠️  Could not check Docker logs:', err.message);
    }

    // Step 10: Check api.js interceptor
    console.log('\n🔍 Step 10: Checking api.js response interceptor...');
    try {
      const apiFile = fs.readFileSync(
        'C:/Users/MSTor/Projects/auth-system/frontend/src/services/api.js',
        'utf8'
      );

      const has401Handler = apiFile.includes('status === 401');
      const hasWindowLocationRedirect = apiFile.includes('window.location.href');

      console.log('   Has 401 handler:', has401Handler ? '✅ Present' : '❌ Missing');
      console.log('   Has window.location redirect:', hasWindowLocationRedirect ? '✅ Present' : '❌ Missing');

      if (has401Handler && hasWindowLocationRedirect) {
        console.log('   ⚠️  FOUND THE ISSUE!');
        console.log('   The api.js interceptor redirects to /login on 401 errors!');
        console.log('   This might be redirecting the user before the page loads.');
      }
    } catch (err) {
      console.log('   ⚠️  Could not read api.js:', err.message);
    }

    // Step 11: Summary
    console.log('\n' + '═'.repeat(80));
    console.log('📋 DIAGNOSTIC SUMMARY');
    console.log('═'.repeat(80));
    console.log('');
    console.log('✅ Backend API working correctly');
    console.log('✅ MFA authentication flow working');
    console.log('✅ MFA status endpoint returns correct data');
    console.log('');
    console.log('🔍 POSSIBLE ISSUES:');
    console.log('');
    console.log('1. BROWSER CACHE:');
    console.log('   - Browser is loading old JavaScript bundle without debugging logs');
    console.log('   - Solution: Hard refresh (Ctrl+Shift+R) or clear cache completely');
    console.log('');
    console.log('2. API INTERCEPTOR (401 REDIRECT):');
    console.log('   - api.js has a 401 interceptor that redirects to /login');
    console.log('   - If token is expired/invalid, page redirects before rendering');
    console.log('   - Solution: Make sure you login first, then navigate to /mfa-settings');
    console.log('');
    console.log('3. SERVICE WORKER CACHING:');
    console.log('   - Service worker might be serving old cached files');
    console.log('   - Solution: Disable service workers in DevTools or use incognito mode');
    console.log('');
    console.log('📝 MANUAL DEBUGGING STEPS:');
    console.log('1. Open browser DevTools (F12)');
    console.log('2. Go to Application tab → Service Workers → Unregister all');
    console.log('3. Go to Network tab → Check "Disable cache"');
    console.log('4. Login at: http://localhost:3000/login');
    console.log('   Email:', testUser.email);
    console.log('   Password:', testUser.password);
    console.log('   2FA Code:', testUser.backupCode);
    console.log('5. After login, navigate to: http://localhost:3000/mfa-settings');
    console.log('6. Check Console tab for debugging logs');
    console.log('7. If still no logs, go to Network tab, filter "JS", find main.*.js');
    console.log('8. Click on main.*.js, search for "Hook initialized" to verify it\'s in the bundle');
    console.log('');

  } catch (error) {
    console.log('\n' + '═'.repeat(80));
    console.error('❌ TEST FAILED');
    console.log('═'.repeat(80));
    console.error('\nError:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testFrontendMFASettings();
