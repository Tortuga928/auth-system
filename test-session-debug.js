/**
 * Simple test to debug session identification
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000';

async function testSessionDebug() {
  try {
    console.log('='.repeat(60));
    console.log('Session Identification Debug Test');
    console.log('='.repeat(60));

    const timestamp = Date.now();
    const testUser = {
      username: `test${timestamp}`,
      email: `test${timestamp}@example.com`,
      password: 'Test123!@#',
    };

    // Register user
    console.log('\n1. Registering test user...');
    await axios.post(`${API_URL}/api/auth/register`, testUser);
    console.log('✅ User registered');

    // Login
    console.log('\n2. Logging in...');
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: testUser.email,
      password: testUser.password,
    });
    const token = loginResponse.data.data.tokens.accessToken;
    console.log('✅ Logged in, got token');

    // Get sessions (this should trigger debug logging)
    console.log('\n3. Getting sessions (check backend logs for debug output)...');
    const sessionsResponse = await axios.get(`${API_URL}/api/sessions`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log('\n4. Response from GET /api/sessions:');
    console.log(JSON.stringify(sessionsResponse.data, null, 2));

    const sessions = sessionsResponse.data.data.sessions;
    console.log('\n5. Session Details:');
    sessions.forEach((session, index) => {
      console.log(`\nSession ${index + 1}:`);
      console.log(`  IP: ${session.ip_address}`);
      console.log(`  User Agent: ${session.user_agent}`);
      console.log(`  Is Current: ${session.is_current}`);
      console.log(`  Device: ${session.device_name}`);
    });

    console.log('\n='.repeat(60));
    console.log('✅ Test complete - Check backend logs above for debug output');
    console.log('='.repeat(60));
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testSessionDebug();
