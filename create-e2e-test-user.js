const axios = require('axios');

const BACKEND_URL = 'http://localhost:5000';
const timestamp = Date.now();
const username = `e2etest${timestamp}`;
const email = `${username}@example.com`;
const password = 'E2ETest123!@#';

(async () => {
  try {
    console.log('👤 Creating fresh user for end-to-end testing...\n');

    // Register user
    const registerResponse = await axios.post(`${BACKEND_URL}/api/auth/register`, {
      email,
      password,
      username,
      firstName: 'E2E',
      lastName: 'Test'
    });

    console.log('✅ User registered successfully\n');
    console.log('================================================================================');
    console.log('🎯 END-TO-END TEST CREDENTIALS');
    console.log('================================================================================\n');
    console.log('👤 Username:  ' + username);
    console.log('📧 Email:     ' + email);
    console.log('🔑 Password:  ' + password);
    console.log('\n📝 MFA Status: ❌ NOT ENABLED (fresh account)\n');
    console.log('================================================================================');
    console.log('🧪 COMPLETE TEST FLOW');
    console.log('================================================================================\n');
    console.log('1. LOGIN TEST:');
    console.log('   → Go to: http://localhost:3000/login');
    console.log('   → Email: ' + email);
    console.log('   → Password: ' + password);
    console.log('   → Should login successfully WITHOUT MFA prompt\n');
    console.log('2. MFA SETUP TEST:');
    console.log('   → Go to: http://localhost:3000/mfa-settings');
    console.log('   → Click "Enable Two-Factor Authentication"');
    console.log('   → Complete all 4 wizard steps\n');
    console.log('3. LOGOUT TEST:');
    console.log('   → Use console: localStorage.clear(); window.location.href="/login"\n');
    console.log('4. MFA LOGIN TEST:');
    console.log('   → Login with same credentials');
    console.log('   → Should prompt for MFA code');
    console.log('   → Enter TOTP code from authenticator app');
    console.log('   → Should successfully login\n');
    console.log('================================================================================\n');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
})();
