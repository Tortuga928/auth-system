const axios = require('axios');

const API_URL = 'http://localhost:5000';

async function testAuth() {
  try {
    // Login
    console.log('1. Logging in...');
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'uitester@example.com',
      password: 'Test123!@#',
    });
    
    console.log('Login response:', JSON.stringify(loginResponse.data, null, 2));
    
    const token = loginResponse.data.data?.accessToken;
    if (!token) {
      console.log('❌ No access token in response');
      return;
    }
    
    console.log('✅ Login successful');
    console.log('Token:', token.substring(0, 50) + '...');
    
    // Try to access activity log
    console.log('\n2. Accessing activity log...');
    try {
      const activityResponse = await axios.get(`${API_URL}/api/user/activity?page=1&limit=25`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log('✅ Activity log access successful');
      console.log('Logs:', activityResponse.data.data.logs.length);
    } catch (error) {
      console.log('❌ Activity log access failed');
      console.log('Status:', error.response?.status);
      console.log('Error data:', JSON.stringify(error.response?.data, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Login failed:', error.message);
    if (error.response) {
      console.log('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testAuth();
