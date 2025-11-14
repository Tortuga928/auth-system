/**
 * Story 10.2: User Management API - Integration Tests
 *
 * Tests all 8 user management endpoints with various scenarios
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000';

// Configure axios to not throw on any HTTP status
axios.defaults.validateStatus = () => true;

// Test users
let regularUser = null;
let adminUser = null;
let superAdminUser = null;
let testUser = null;

// Tokens
let regularToken = null;
let adminToken = null;
let superAdminToken = null;

// Test state
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  tests: [],
};

/**
 * Log test result
 */
function logTest(name, passed, message) {
  results.total++;
  if (passed) {
    results.passed++;
    console.log(`✅ ${name}`);
  } else {
    results.failed++;
    console.log(`❌ ${name}`);
    console.log(`   ${message}`);
  }
  results.tests.push({ name, passed, message });
}

/**
 * Setup: Create test users with different roles
 */
async function setup() {
  console.log('\n📝 Setting up test users...\n');

  try {
    const db = require('./backend/src/db');

    // 1. Create regular user
    const regularEmail = `regular_${Date.now()}@test.com`;
    const regularResponse = await axios.post(`${API_URL}/api/auth/register`, {
      username: `regular_${Date.now()}`,
      email: regularEmail,
      password: 'Test123!@#',
    });
    regularUser = regularResponse.data.data.user;

    // Verify email manually
    await db.query('UPDATE users SET email_verified = true WHERE id = $1', [regularUser.id]);

    // Login to get token
    const regularLoginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: regularEmail,
      password: 'Test123!@#',
    });
    regularToken = regularLoginResponse.data.data.tokens.accessToken;

    // 2. Create admin user
    const adminEmail = `admin_${Date.now()}@test.com`;
    const adminResponse = await axios.post(`${API_URL}/api/auth/register`, {
      username: `admin_${Date.now()}`,
      email: adminEmail,
      password: 'Test123!@#',
    });
    adminUser = adminResponse.data.data.user;

    // Update role to admin and verify email
    await db.query('UPDATE users SET role = $1, email_verified = true WHERE id = $2', ['admin', adminUser.id]);

    // Login to get token
    const adminLoginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: adminEmail,
      password: 'Test123!@#',
    });
    adminToken = adminLoginResponse.data.data.tokens.accessToken;

    // 3. Create super_admin user
    const superAdminEmail = `superadmin_${Date.now()}@test.com`;
    const superAdminResponse = await axios.post(`${API_URL}/api/auth/register`, {
      username: `superadmin_${Date.now()}`,
      email: superAdminEmail,
      password: 'Test123!@#',
    });
    superAdminUser = superAdminResponse.data.data.user;

    // Update role to super_admin and verify email
    await db.query('UPDATE users SET role = $1, email_verified = true WHERE id = $2', ['super_admin', superAdminUser.id]);

    // Login to get token
    const superAdminLoginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: superAdminEmail,
      password: 'Test123!@#',
    });
    superAdminToken = superAdminLoginResponse.data.data.tokens.accessToken;

    console.log('✓ Regular user created and logged in');
    console.log('✓ Admin user created and logged in');
    console.log('✓ Super admin user created and logged in\n');

    return true;
  } catch (error) {
    console.error('Setup failed:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('\n' + '='.repeat(70));
  console.log('Story 10.2: User Management API - Integration Tests');
  console.log('='.repeat(70));

  // Setup test users
  const setupSuccess = await setup();
  if (!setupSuccess) {
    console.log('\n❌ Setup failed. Cannot run tests.\n');
    return;
  }

  // Test Group 1: List Users
  console.log('--- Test Group 1: List Users (GET /api/admin/users) ---\n');

  try {
    const response = await axios.get(`${API_URL}/api/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    logTest('Admin can list all users', response.status === 200, response.status);
  } catch (error) {
    logTest('Admin can list all users', false, error.message);
  }

  try {
    const response = await axios.get(`${API_URL}/api/admin/users?page=1&pageSize=5`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    logTest(
      'List users with pagination',
      response.status === 200 && response.data.data.pagination.pageSize === 5,
      response.status
    );
  } catch (error) {
    logTest('List users with pagination', false, error.message);
  }

  try {
    const response = await axios.get(`${API_URL}/api/admin/users`, {
      headers: { Authorization: `Bearer ${regularToken}` },
    });
    logTest('Regular user cannot list users (403)', response.status === 403, response.status);
  } catch (error) {
    logTest('Regular user cannot list users (403)', error.response?.status === 403, error.message);
  }

  console.log('');

  // Test Group 2: Get User by ID
  console.log('--- Test Group 2: Get User by ID (GET /api/admin/users/:id) ---\n');

  try {
    const response = await axios.get(`${API_URL}/api/admin/users/${regularUser.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    logTest('Admin can get user by ID', response.status === 200, response.status);
  } catch (error) {
    logTest('Admin can get user by ID', false, error.message);
  }

  try {
    const response = await axios.get(`${API_URL}/api/admin/users/999999`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    logTest('Get non-existent user returns 404', response.status === 404, response.status);
  } catch (error) {
    logTest('Get non-existent user returns 404', error.response?.status === 404, error.message);
  }

  console.log('');

  // Test Group 3: Create User
  console.log('--- Test Group 3: Create User (POST /api/admin/users) ---\n');

  try {
    const timestamp = Date.now();
    const response = await axios.post(
      `${API_URL}/api/admin/users`,
      {
        username: `testuser${timestamp}`,
        email: `testuser${timestamp}@test.com`,
        password: 'Password123!',
        role: 'user',
      },
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    logTest('Admin can create regular user', response.status === 201, response.status);
    if (response.status === 201) {
      testUser = response.data.data.user;
    }
  } catch (error) {
    logTest('Admin can create regular user', false, error.message);
  }

  try {
    const timestamp = Date.now();
    const response = await axios.post(
      `${API_URL}/api/admin/users`,
      {
        username: `testsuperadmin${timestamp}`,
        email: `testsuperadmin${timestamp}@test.com`,
        password: 'Password123!',
        role: 'super_admin',
      },
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    logTest('Admin cannot create super_admin user (403)', response.status === 403, response.status);
  } catch (error) {
    logTest('Admin cannot create super_admin user (403)', error.response?.status === 403, error.message);
  }

  try {
    const timestamp = Date.now();
    const response = await axios.post(
      `${API_URL}/api/admin/users`,
      {
        username: `testsuperadmin${timestamp}`,
        email: `testsuperadmin${timestamp}@test.com`,
        password: 'Password123!',
        role: 'super_admin',
      },
      {
        headers: { Authorization: `Bearer ${superAdminToken}` },
      }
    );
    logTest('Super admin can create super_admin user', response.status === 201, response.status);
  } catch (error) {
    logTest('Super admin can create super_admin user', false, error.message);
  }

  try {
    const response = await axios.post(
      `${API_URL}/api/admin/users`,
      {
        username: 'testuser',
        // Missing email and password
      },
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    logTest('Create user with missing fields returns 400', response.status === 400, response.status);
  } catch (error) {
    logTest('Create user with missing fields returns 400', error.response?.status === 400, error.message);
  }

  console.log('');

  // Test Group 4: Update User
  console.log('--- Test Group 4: Update User (PUT /api/admin/users/:id) ---\n');

  if (testUser) {
    try {
      const response = await axios.put(
        `${API_URL}/api/admin/users/${testUser.id}`,
        {
          first_name: 'Updated',
          last_name: 'Name',
        },
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );
      logTest('Admin can update user profile', response.status === 200, response.status);
    } catch (error) {
      logTest('Admin can update user profile', false, error.message);
    }

    try {
      const response = await axios.put(
        `${API_URL}/api/admin/users/${adminUser.id}`,
        {
          role: 'super_admin',
        },
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );
      logTest('Admin cannot update own role (403)', response.status === 403, response.status);
    } catch (error) {
      logTest('Admin cannot update own role (403)', error.response?.status === 403, error.message);
    }
  }

  console.log('');

  // Test Group 5: Update User Role
  console.log('--- Test Group 5: Update User Role (PUT /api/admin/users/:id/role) ---\n');

  if (testUser) {
    try {
      const response = await axios.put(
        `${API_URL}/api/admin/users/${testUser.id}/role`,
        {
          role: 'admin',
        },
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );
      logTest('Admin can change user role to admin', response.status === 200, response.status);
    } catch (error) {
      logTest('Admin can change user role to admin', false, error.message);
    }

    try {
      const response = await axios.put(
        `${API_URL}/api/admin/users/${testUser.id}/role`,
        {
          role: 'super_admin',
        },
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );
      logTest('Admin cannot grant super_admin role (403)', response.status === 403, response.status);
    } catch (error) {
      logTest('Admin cannot grant super_admin role (403)', error.response?.status === 403, error.message);
    }

    try {
      const response = await axios.put(
        `${API_URL}/api/admin/users/${testUser.id}/role`,
        {
          role: 'super_admin',
        },
        {
          headers: { Authorization: `Bearer ${superAdminToken}` },
        }
      );
      logTest('Super admin can grant super_admin role', response.status === 200, response.status);

      // Change back to user
      if (response.status === 200) {
        await axios.put(
          `${API_URL}/api/admin/users/${testUser.id}/role`,
          { role: 'user' },
          {
            headers: { Authorization: `Bearer ${superAdminToken}` },
          }
        );
      }
    } catch (error) {
      logTest('Super admin can grant super_admin role', false, error.message);
    }

    try {
      const response = await axios.put(
        `${API_URL}/api/admin/users/${testUser.id}/role`,
        {},
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );
      logTest('Update role without role field returns 400', response.status === 400, response.status);
    } catch (error) {
      logTest('Update role without role field returns 400', error.response?.status === 400, error.message);
    }
  }

  console.log('');

  // Test Group 6: Update User Status
  console.log('--- Test Group 6: Update User Status (PUT /api/admin/users/:id/status) ---\n');

  if (testUser) {
    try {
      const response = await axios.put(
        `${API_URL}/api/admin/users/${testUser.id}/status`,
        {
          is_active: false,
        },
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );
      logTest('Admin can deactivate user', response.status === 200, response.status);
    } catch (error) {
      logTest('Admin can deactivate user', false, error.message);
    }

    try {
      const response = await axios.put(
        `${API_URL}/api/admin/users/${testUser.id}/status`,
        {
          is_active: true,
        },
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );
      logTest('Admin can reactivate user', response.status === 200, response.status);
    } catch (error) {
      logTest('Admin can reactivate user', false, error.message);
    }

    try {
      const response = await axios.put(
        `${API_URL}/api/admin/users/${adminUser.id}/status`,
        {
          is_active: false,
        },
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );
      logTest('Admin cannot change own status (403)', response.status === 403, response.status);
    } catch (error) {
      logTest('Admin cannot change own status (403)', error.response?.status === 403, error.message);
    }

    try {
      const response = await axios.put(
        `${API_URL}/api/admin/users/${testUser.id}/status`,
        {},
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );
      logTest('Update status without is_active field returns 400', response.status === 400, response.status);
    } catch (error) {
      logTest('Update status without is_active field returns 400', error.response?.status === 400, error.message);
    }
  }

  console.log('');

  // Test Group 7: Delete User
  console.log('--- Test Group 7: Delete User (DELETE /api/admin/users/:id) ---\n');

  if (testUser) {
    try {
      const response = await axios.delete(`${API_URL}/api/admin/users/${testUser.id}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      logTest('Admin can delete/deactivate user', response.status === 200, response.status);

      // Verify soft delete
      const checkResponse = await axios.get(`${API_URL}/api/admin/users/${testUser.id}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      logTest(
        'Delete is soft delete (user still exists)',
        checkResponse.status === 200 && checkResponse.data.data.user.is_active === false,
        `User exists: ${checkResponse.status === 200}, is_active: ${checkResponse.data.data.user?.is_active}`
      );
    } catch (error) {
      logTest('Admin can delete/deactivate user', false, error.message);
    }

    try {
      const response = await axios.delete(`${API_URL}/api/admin/users/${adminUser.id}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      logTest('Admin cannot delete own account (403)', response.status === 403, response.status);
    } catch (error) {
      logTest('Admin cannot delete own account (403)', error.response?.status === 403, error.message);
    }
  }

  console.log('');

  // Test Group 8: Search Users
  console.log('--- Test Group 8: Search Users (GET /api/admin/users/search) ---\n');

  try {
    const response = await axios.get(`${API_URL}/api/admin/users/search?q=test.com`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    logTest('Search users by email', response.status === 200, response.status);
  } catch (error) {
    logTest('Search users by email', false, error.message);
  }

  try {
    const response = await axios.get(`${API_URL}/api/admin/users/search`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    logTest('Search without query parameter returns 400', response.status === 400, response.status);
  } catch (error) {
    logTest('Search without query parameter returns 400', error.response?.status === 400, error.message);
  }

  try {
    const response = await axios.get(`${API_URL}/api/admin/users/search?q=test&limit=200`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    logTest('Search with invalid limit returns 400', response.status === 400, response.status);
  } catch (error) {
    logTest('Search with invalid limit returns 400', error.response?.status === 400, error.message);
  }

  // Print summary
  console.log('');
  console.log('='.repeat(70));
  console.log('Test Summary');
  console.log('='.repeat(70));
  console.log(`Total Tests: ${results.total}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
  console.log('='.repeat(70));
  console.log('');

  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
