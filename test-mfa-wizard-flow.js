/**
 * Create a test user and test MFA Setup Wizard flow
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000';

// Create a unique test user
const timestamp = Date.now();
const testUser = {
  username: `wizardtest${timestamp}`,
  email: `wizardtest${timestamp}@example.com`,
  password: 'WizardTest123!@#',
};

async function setupTestUser() {
  console.log('\n🧪 Creating Test User for MFA Wizard Testing\n');

  try {
    // Step 1: Register the user
    console.log('📝 Step 1: Registering new user...');
    const registerResponse = await axios.post(`${API_BASE_URL}/api/auth/register`, testUser);
    
    console.log('✅ User registered successfully!');
    console.log('   User ID:', registerResponse.data.data.user.id);

    // Step 2: Login to get access token
    console.log('\n🔐 Step 2: Logging in...');
    const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: testUser.email,
      password: testUser.password,
    });

    console.log('✅ Login successful!');
    const accessToken = loginResponse.data.data.tokens.accessToken;

    // Step 3: Verify MFA is NOT enabled
    console.log('\n📊 Step 3: Checking MFA status...');
    const statusResponse = await axios.get(`${API_BASE_URL}/api/auth/mfa/status`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    console.log('✅ MFA Status retrieved:');
    console.log('   MFA Enabled:', statusResponse.data.data.mfaEnabled);
    console.log('   Backup Codes:', statusResponse.data.data.backupCodesRemaining);

    console.log('\n' + '═'.repeat(80));
    console.log('✅ TEST USER READY FOR MFA WIZARD TESTING');
    console.log('═'.repeat(80));
    console.log('\n📝 TEST CREDENTIALS:\n');
    console.log(`   Email:    ${testUser.email}`);
    console.log(`   Password: ${testUser.password}`);
    console.log('\n📍 TESTING STEPS:\n');
    console.log('1. Open your browser to: http://localhost:3000/login');
    console.log('2. Login with the credentials above');
    console.log('3. Navigate to: http://localhost:3000/mfa-settings');
    console.log('4. Click "🔒 Enable Two-Factor Authentication" button');
    console.log('5. The MFA Setup Wizard modal should appear');
    console.log('6. Follow the 4-step wizard:');
    console.log('   - Step 1: Read introduction and click "Get Started"');
    console.log('   - Step 2: Scan QR code with authenticator app (or copy manual code)');
    console.log('   - Step 3: Enter the 6-digit code from your app');
    console.log('   - Step 4: Save your backup codes (copy or download)');
    console.log('7. After completion, verify MFA status shows "Enabled"');
    console.log('8. Logout and login again to test MFA verification');
    console.log('\n💡 TIP: Use Google Authenticator, Authy, or similar app on your phone\n');

  } catch (error) {
    console.error('\n❌ Error creating test user:');
    console.error('   Message:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('   Details:', error.response.data);
    }
  }
}

setupTestUser();
