const axios = require('axios');
const API_URL = 'http://localhost:5000';

async function testAuth() {
  try {
    const timestamp = Date.now();
    const testEmail = `debuguser${timestamp}@example.com`;
    const testPassword = 'Test123!@#';

    // Register
    console.log('1. Registering user...');
    await axios.post(`${API_URL}/api/auth/register`, {
      username: `debuguser${timestamp}`,
      email: testEmail,
      password: testPassword,
    });
    console.log('✅ Registration successful');

    // Login
    console.log('\n2. Logging in...');
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: testEmail,
      password: testPassword,
    });

    console.log('Login response:', JSON.stringify(loginResponse.data, null, 2));

    const token = loginResponse.data.data?.accessToken;
    if (!token) {
      console.log('❌ No access token in response');
      return;
    }

    console.log('✅ Login successful');
    console.log('Token (first 80 chars):', token.substring(0, 80) + '...');

    // Decode token to see what's inside
    const tokenParts = token.split('.');
    const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
    console.log('Token payload:', JSON.stringify(payload, null, 2));

    // Try to access activity log
    console.log('\n3. Accessing activity log...');
    try {
      const activityResponse = await axios.get(`${API_URL}/api/user/activity?page=1&limit=25`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log('✅ Activity log access successful');
      console.log('Response:', JSON.stringify(activityResponse.data, null, 2));
    } catch (error) {
      console.log('❌ Activity log access failed');
      console.log('Status:', error.response?.status);
      console.log('Error data:', JSON.stringify(error.response?.data, null, 2));
      console.log('Request headers:', error.config?.headers);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.log('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testAuth();
