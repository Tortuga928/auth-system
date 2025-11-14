const axios = require('axios');

async function testActivityEndpoint() {
  try {
    // Register a test user
    const timestamp = Date.now();
    const testUser = {
      username: `acttest${timestamp}`,
      email: `acttest${timestamp}@example.com`,
      password: 'Test123!@#',
    };
    
    const regResponse = await axios.post('http://localhost:5000/api/auth/register', testUser);
    console.log('✅ User registered');
    
    // Login
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: testUser.email,
      password: testUser.password,
    });
    
    const token = loginResponse.data.data.tokens.accessToken;
    console.log('✅ User logged in');
    
    // Get activity
    const activityResponse = await axios.get('http://localhost:5000/api/user/activity', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('\n📊 Activity Response Structure:');
    console.log(JSON.stringify(activityResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testActivityEndpoint();
