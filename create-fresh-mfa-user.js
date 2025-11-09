/**
 * Create Fresh MFA Test User with New Backup Codes
 */

require('dotenv').config();
const axios = require('axios');
const speakeasy = require('speakeasy');

const API_BASE_URL = 'http://localhost:5000';

async function createFreshUser() {
  console.log('\n🔧 Creating Fresh MFA Test User...\n');

  const timestamp = Date.now();
  const testUser = {
    username: `mfauser${timestamp}`,
    email: `mfauser${timestamp}@example.com`,
    password: 'MFA123!@#Test',
  };

  try {
    // Step 1: Register
    console.log('📝 Step 1: Registering new user...');
    await axios.post(`${API_BASE_URL}/api/auth/register`, testUser);
    console.log('✅ User registered');

    // Step 2: Login
    console.log('\n🔐 Step 2: Logging in...');
    const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: testUser.email,
      password: testUser.password,
    });

    const authToken = loginResponse.data.data.tokens.accessToken;
    console.log('✅ Login successful');

    // Step 3: Setup MFA
    console.log('\n🔑 Step 3: Setting up MFA...');
    const setupResponse = await axios.post(
      `${API_BASE_URL}/api/auth/mfa/setup`,
      {},
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    const mfaSecret = setupResponse.data.data.secret;
    const backupCodes = setupResponse.data.data.backupCodes;
    console.log('✅ MFA setup complete');

    // Step 4: Enable MFA
    console.log('\n✓ Step 4: Enabling MFA...');
    const token = speakeasy.totp({
      secret: mfaSecret,
      encoding: 'base32',
    });

    await axios.post(
      `${API_BASE_URL}/api/auth/mfa/enable`,
      { token },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    console.log('✅ MFA enabled successfully');

    // Print credentials
    console.log('\n' + '═'.repeat(80));
    console.log('🎉 FRESH MFA USER READY!');
    console.log('═'.repeat(80));
    console.log('\n📋 LOGIN CREDENTIALS:\n');
    console.log(`   Email:    ${testUser.email}`);
    console.log(`   Password: ${testUser.password}`);
    console.log(`\n💾 ALL 10 BACKUP CODES (UNUSED):\n`);
    backupCodes.forEach((code, i) => {
      console.log(`   ${i + 1}. ${code}`);
    });
    console.log(`\n🌐 TO TEST:\n`);
    console.log('   1. Go to: http://localhost:3000/login');
    console.log(`   2. Email: ${testUser.email}`);
    console.log(`   3. Password: ${testUser.password}`);
    console.log(`   4. Use ANY backup code from above`);
    console.log('   5. Navigate to: http://localhost:3000/mfa-settings');
    console.log('\n' + '═'.repeat(80) + '\n');

  } catch (error) {
    console.error('\n❌ Error:', error.response?.data?.message || error.message);
    process.exit(1);
  }
}

createFreshUser();
