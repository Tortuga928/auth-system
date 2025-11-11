const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000';

async function testNameUpdate() {
  try {
    // Login
    console.log('→ Logging in...');
    const loginRes = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: 'testuser@example.com',
      password: 'Test123!@#'
    });
    
    const token = loginRes.data.data.tokens.accessToken;
    console.log('✅ Logged in');

    // Update names
    console.log('\n→ Updating first and last names...');
    const updateRes = await axios.put(`${API_BASE_URL}/api/user/profile`, {
      first_name: 'DebugFirst',
      last_name: 'DebugLast',
      password: 'Test123!@#'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Update Response:', JSON.stringify(updateRes.data, null, 2));
  } catch (error) {
    console.log('❌ Error:', error.response?.status, error.response?.data || error.message);
    console.log('Full error:', error.response?.data);
  }
}

testNameUpdate();
