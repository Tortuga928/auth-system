/**
 * Create Test User for Beta Environment
 *
 * Creates a simple test user without MFA for testing Phase 8 features
 * on https://auth-frontend-beta.onrender.com
 */

const axios = require('axios');

const BETA_API_URL = 'https://auth-backend-beta.onrender.com';

async function createTestUser() {
  console.log('='.repeat(60));
  console.log('Creating Test User for Beta Environment');
  console.log('='.repeat(60));
  console.log();

  const timestamp = Date.now();
  const testUser = {
    username: `betatest${timestamp}`,
    email: `betatest${timestamp}@example.com`,
    password: 'BetaTest123!',
  };

  try {
    console.log('Registering test user on beta...');
    console.log(`Username: ${testUser.username}`);
    console.log(`Email: ${testUser.email}`);
    console.log(`Password: ${testUser.password}`);
    console.log();

    const response = await axios.post(`${BETA_API_URL}/api/auth/register`, testUser);

    if (response.data.success) {
      console.log('✅ Test user created successfully!');
      console.log();
      console.log('='.repeat(60));
      console.log('TEST CREDENTIALS FOR BETA');
      console.log('='.repeat(60));
      console.log();
      console.log('🌐 Beta Frontend URL: https://auth-frontend-beta.onrender.com');
      console.log();
      console.log('👤 Username:', testUser.username);
      console.log('📧 Email:', testUser.email);
      console.log('🔑 Password:', testUser.password);
      console.log();
      console.log('✅ MFA Status: DISABLED (ready for testing)');
      console.log();
      console.log('='.repeat(60));
      console.log('FEATURES TO TEST');
      console.log('='.repeat(60));
      console.log('1. Dashboard - View profile summary and quick actions');
      console.log('2. Avatar Upload - Upload/delete profile picture');
      console.log('3. Profile Edit - Update username, email, names');
      console.log('4. Activity Log - View paginated activity history');
      console.log('5. Account Settings - Change password, delete account');
      console.log('='.repeat(60));
      console.log();
      console.log('🚀 You can now login and test Phase 8 features!');
      console.log();
    } else {
      console.log('❌ Failed to create test user');
      console.log('Response:', response.data);
    }

  } catch (error) {
    console.error('❌ Error creating test user:', error.message);

    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data?.error || 'Unknown error');

      if (error.response.status === 503) {
        console.log();
        console.log('⚠️  Beta backend may still be deploying...');
        console.log('   Wait 2-3 minutes and try again.');
      }
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      console.log();
      console.log('⚠️  Cannot reach beta backend.');
      console.log('   The beta deployment may still be in progress.');
      console.log('   Wait a few minutes and try again.');
    }

    console.log();
    console.log('If deployment is complete, you can also manually register at:');
    console.log('https://auth-frontend-beta.onrender.com/register');
  }
}

// Run the script
createTestUser().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
