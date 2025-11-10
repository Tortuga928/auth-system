/**
 * Create Fresh UI Test User
 * Creates a new user with MFA enabled and displays all credentials
 */

const axios = require('axios');
const speakeasy = require('speakeasy');

const API_BASE_URL = 'http://localhost:5000';
const timestamp = Date.now();
const email = `uitest${timestamp}@example.com`;
const username = `uitest${timestamp}`;
const password = 'UITest123!@#';

(async () => {
  try {
    console.log('🔐 Creating fresh MFA test user for UI testing...\n');

    // Register user
    const reg = await axios.post(`${API_BASE_URL}/api/auth/register`, {
      username,
      email,
      password,
      confirmPassword: password
    });

    const accessToken = reg.data.data.tokens.accessToken;
    console.log('✅ User registered successfully\n');

    // Setup MFA
    const setup = await axios.post(`${API_BASE_URL}/api/auth/mfa/setup`, {}, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const secret = setup.data.data.secret;
    const backupCodes = setup.data.data.backupCodes;

    console.log('✅ MFA setup completed\n');

    // Enable MFA
    const totp = speakeasy.totp({ secret, encoding: 'base32' });
    await axios.post(`${API_BASE_URL}/api/auth/mfa/enable`, {
      token: totp
    }, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    console.log('✅ MFA enabled\n');

    // Print credentials
    console.log('='.repeat(80));
    console.log('🎯 UI TEST CREDENTIALS - Ready to Use');
    console.log('='.repeat(80));
    console.log('');
    console.log('👤 Username: ', username);
    console.log('📧 Email:    ', email);
    console.log('🔑 Password: ', password);
    console.log('');
    console.log('🔐 TOTP Secret (for authenticator app):');
    console.log('   ', secret);
    console.log('');
    console.log('📱 Current TOTP Code (valid for ~30 seconds):');
    console.log('   ', speakeasy.totp({ secret, encoding: 'base32' }));
    console.log('');
    console.log('💾 Backup Codes (10 total):');
    backupCodes.forEach((code, i) => {
      console.log(`   ${String(i + 1).padStart(2, ' ')}. ${code}`);
    });
    console.log('');
    console.log('='.repeat(80));
    console.log('🧪 TESTING INSTRUCTIONS');
    console.log('='.repeat(80));
    console.log('');
    console.log('1. Navigate to: http://localhost:3000/login');
    console.log('2. Login with email and password above');
    console.log('3. Enter TOTP code when prompted (generate new one if expired)');
    console.log('4. After login, go to: http://localhost:3000/mfa-settings');
    console.log('5. Test all MFA management features');
    console.log('');
    console.log('📝 To generate new TOTP codes, run:');
    console.log(`   node -e "console.log(require('speakeasy').totp({secret:'${secret}',encoding:'base32'}))"`);
    console.log('');
    console.log('🔄 To test MFA Setup Wizard (new user flow):');
    console.log('   1. Click "Disable 2FA" first');
    console.log('   2. Then click "Enable Two-Factor Authentication"');
    console.log('   3. Follow the 4-step wizard');
    console.log('');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
})();
