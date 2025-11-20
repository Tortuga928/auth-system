/**
 * Comprehensive Delete User Test
 * Tests all aspects of the delete functionality
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function runComprehensiveTest() {
  console.log('🧪 Comprehensive Delete User Test\n');
  console.log('='.repeat(60));

  try {
    // Step 1: Login as testsuperadmin
    console.log('\n📝 Step 1: Login as testsuperadmin');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'testsuperadmin@example.com',
      password: 'SuperAdmin123!@#'
    });

    const token = loginRes.data.data?.tokens?.accessToken;
    const loggedInUser = loginRes.data.data?.user;

    if (!token) {
      console.error('❌ Login failed');
      return;
    }

    console.log('✅ Logged in as:', loggedInUser.email);
    console.log('   User ID:', loggedInUser.id);
    console.log('   Role:', loggedInUser.role);

    // Step 2: Get all users
    console.log('\n📝 Step 2: Fetch all users');
    const usersRes = await axios.get(`${API_URL}/admin/users?pageSize=100`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const users = usersRes.data.data?.users || [];
    console.log(`✅ Found ${users.length} users total`);

    // Find testadmin
    const testadmin = users.find(u => u.email === 'testadmin@example.com');
    if (!testadmin) {
      console.log('⚠️  testadmin not found');
      return;
    }

    console.log('\n📋 Target user (testadmin):');
    console.log('   ID:', testadmin.id);
    console.log('   Username:', testadmin.username);
    console.log('   Email:', testadmin.email);
    console.log('   Role:', testadmin.role);
    console.log('   Active:', testadmin.is_active);

    // Step 3: Verify we're not deleting ourselves
    console.log('\n📝 Step 3: Verify not deleting self');
    if (testadmin.id === loggedInUser.id) {
      console.log('❌ Cannot delete yourself! Test failed.');
      return;
    }
    console.log('✅ Target user is different from logged-in user');

    // Step 4: Test delete permission
    console.log('\n📝 Step 4: Attempt to delete testadmin');
    console.log(`   DELETE ${API_URL}/admin/users/${testadmin.id}`);

    try {
      const deleteRes = await axios.delete(`${API_URL}/admin/users/${testadmin.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('✅ Delete request successful!');
      console.log('   Status:', deleteRes.status);
      console.log('   Response:', JSON.stringify(deleteRes.data, null, 2));

      // Step 5: Verify deletion
      console.log('\n📝 Step 5: Verify user was deactivated');
      const verifyRes = await axios.get(`${API_URL}/admin/users/${testadmin.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const updatedUser = verifyRes.data.data?.user || verifyRes.data.data;
      console.log('   User active status:', updatedUser.is_active);

      if (updatedUser.is_active === false) {
        console.log('✅ User successfully deactivated!');
      } else {
        console.log('❌ User is still active - delete may have failed');
      }

      // Step 6: Test reactivation
      console.log('\n📝 Step 6: Test reactivation (optional)');
      const reactivateRes = await axios.put(
        `${API_URL}/admin/users/${testadmin.id}/status`,
        { is_active: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('✅ User reactivated for future tests');

    } catch (deleteErr) {
      console.error('\n❌ Delete request failed!');
      console.error('   Status:', deleteErr.response?.status);
      console.error('   Error:', deleteErr.response?.data?.message || deleteErr.message);
      console.error('   Full response:', deleteErr.response?.data);

      if (deleteErr.response?.status === 401) {
        console.log('\n💡 401 Unauthorized - Token may be invalid or expired');
        console.log('   Try logging out and back in');
      } else if (deleteErr.response?.status === 403) {
        console.log('\n💡 403 Forbidden - Permission issue');
        console.log('   Logged in as:', loggedInUser.role);
        console.log('   Required role: admin or super_admin');
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Test completed!\n');

  } catch (error) {
    console.error('\n❌ Test failed with error:');
    console.error('   Message:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

// Run the test
runComprehensiveTest();
