/**
 * Get Valid TOTP Code for Test User
 * Uses backend's encryption to decrypt and generate valid code
 */

const axios = require('axios');
const speakeasy = require('speakeasy');

const BACKEND_URL = 'http://localhost:5000';
const email = 'uitest1762734925843@example.com';
const password = 'UITest123!@#';

(async () => {
  try {
    console.log('🔐 Getting valid TOTP code for:', email);

    // Login to get mfaChallengeToken
    const loginResponse = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      email,
      password
    });

    if (!loginResponse.data.data.mfaRequired) {
      console.log('❌ MFA not enabled for this user');
      return;
    }

    const mfaChallengeToken = loginResponse.data.data.mfaChallengeToken;
    console.log('✅ Got MFA challenge token');

    // Now we need to use the backend to get the decrypted secret
    // Let's check if there's a way to get the QR code again which includes the secret

    // For now, let's just test all possible codes in the current time window
    console.log('\n📱 Testing TOTP codes...\n');

    // Try the secret that was printed during user creation
    const secret = 'NE3HWOJFKB3CUY3LFI7VUMJYOE2WGMDBLZRFK3J6PJ5FWSKJONKA';

    // Generate code for current time window
    const currentCode = speakeasy.totp({
      secret,
      encoding: 'base32'
    });

    console.log(`Current TOTP (now):     ${currentCode}`);

    // Try code for previous window (in case of clock skew)
    const prevCode = speakeasy.totp({
      secret,
      encoding: 'base32',
      time: Math.floor(Date.now() / 1000) - 30
    });

    console.log(`Previous TOTP (-30s):   ${prevCode}`);

    // Try code for next window
    const nextCode = speakeasy.totp({
      secret,
      encoding: 'base32',
      time: Math.floor(Date.now() / 1000) + 30
    });

    console.log(`Next TOTP (+30s):       ${nextCode}`);

    console.log('\n🧪 Testing each code against backend...\n');

    const codes = [
      { name: 'Current', code: currentCode },
      { name: 'Previous', code: prevCode },
      { name: 'Next', code: nextCode }
    ];

    for (const { name, code } of codes) {
      try {
        const verifyResponse = await axios.post(`${BACKEND_URL}/api/auth/mfa/verify`, {
          mfaChallengeToken,
          token: code
        });

        console.log(`✅ ${name} code WORKS: ${code}`);
        console.log('   Access token received!');
        return;
      } catch (error) {
        console.log(`❌ ${name} code FAILED: ${code}`);
        if (error.response?.data?.message) {
          console.log(`   Error: ${error.response.data.message}`);
        }
      }
    }

    console.log('\n❌ None of the codes worked. There may be an issue with the secret storage or encryption.');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
})();
