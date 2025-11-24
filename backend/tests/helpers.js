/**
 * Test Helper Functions
 *
 * Reusable utilities for creating test data, cleaning up, etc.
 */

const bcrypt = require('bcrypt');
const { Pool } = require('pg');

// Test database pool
const pool = new Pool({
  host: process.env.TEST_DB_HOST || 'localhost',
  port: process.env.TEST_DB_PORT || 5433,  // Docker maps to 5433 on host
  database: process.env.TEST_DB_NAME || 'authdb_test',
  user: process.env.TEST_DB_USER || 'postgres',
  password: process.env.TEST_DB_PASSWORD || 'postgres'
});

/**
 * Create a test user in the database
 * @param {Object} userData - User data override
 * @returns {Object} Created user
 */
async function createTestUser(userData = {}) {
  const defaultUser = {
    username: `testuser_${Date.now()}`,
    email: `test_${Date.now()}@example.com`,
    password: 'TestPassword123!',
    first_name: 'Test',
    last_name: 'User',
    role: 'user',
    email_verified: true,
    is_active: true
  };

  const user = { ...defaultUser, ...userData };
  const passwordHash = await bcrypt.hash(user.password, 10);

  const result = await pool.query(
    `INSERT INTO users (
      username, email, password_hash, first_name, last_name,
      role, email_verified, is_active, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
    RETURNING id, username, email, role, email_verified, is_active, created_at`,
    [
      user.username,
      user.email,
      passwordHash,
      user.first_name,
      user.last_name,
      user.role,
      user.email_verified,
      user.is_active
    ]
  );

  return {
    ...result.rows[0],
    password: user.password // Return plain password for testing login
  };
}

/**
 * Create an admin test user
 * @returns {Object} Created admin user
 */
async function createTestAdmin() {
  return createTestUser({
    username: `admin_${Date.now()}`,
    email: `admin_${Date.now()}@example.com`,
    role: 'admin'
  });
}

/**
 * Create a super admin test user
 * @returns {Object} Created super admin user
 */
async function createTestSuperAdmin() {
  return createTestUser({
    username: `superadmin_${Date.now()}`,
    email: `superadmin_${Date.now()}@example.com`,
    role: 'super_admin'
  });
}

/**
 * Delete a test user by ID
 * @param {number} userId - User ID to delete
 */
async function deleteTestUser(userId) {
  await pool.query('DELETE FROM users WHERE id = $1', [userId]);
}

/**
 * Clean up all test users (users created in the last hour)
 */
async function cleanupTestUsers() {
  await pool.query(`
    DELETE FROM users
    WHERE created_at > NOW() - INTERVAL '1 hour'
    AND (email LIKE 'test_%@example.com' OR email LIKE 'admin_%@example.com')
  `);
}

/**
 * Clean up all test data from database
 */
async function cleanupTestData() {
  // Order matters due to foreign key constraints
  // Clean up all related tables before deleting users

  // Clean up user_activity_logs (foreign key to users)
  try {
    await pool.query('DELETE FROM user_activity_logs WHERE user_id IN (SELECT id FROM users WHERE email LIKE \'%@example.com\')');
  } catch (err) {
    // Ignore if table doesn't exist
    if (!err.message.includes('does not exist')) throw err;
  }

  // Clean up login_attempts (foreign key to users)
  try {
    await pool.query('DELETE FROM login_attempts WHERE user_id IN (SELECT id FROM users WHERE email LIKE \'%@example.com\')');
  } catch (err) {
    // Ignore if table doesn't exist
    if (!err.message.includes('does not exist')) throw err;
  }

  // Clean up audit_logs (foreign key to users)
  try {
    await pool.query('DELETE FROM audit_logs WHERE admin_id IN (SELECT id FROM users WHERE email LIKE \'%@example.com\')');
  } catch (err) {
    // Ignore if table doesn't exist
    if (!err.message.includes('does not exist')) throw err;
  }

  // Clean up sessions (foreign key to users)
  try {
    await pool.query('DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE email LIKE \'%@example.com\')');
  } catch (err) {
    // Ignore if table doesn't exist
    if (!err.message.includes('does not exist')) throw err;
  }

  // Clean up mfa_secrets (foreign key to users)
  try {
    await pool.query('DELETE FROM mfa_secrets WHERE user_id IN (SELECT id FROM users WHERE email LIKE \'%@example.com\')');
  } catch (err) {
    // Ignore if table doesn't exist
    if (!err.message.includes('does not exist')) throw err;
  }

  // Clean up oauth_providers (foreign key to users)
  try {
    await pool.query('DELETE FROM oauth_providers WHERE user_id IN (SELECT id FROM users WHERE email LIKE \'%@example.com\')');
  } catch (err) {
    // Ignore if table doesn't exist
    if (!err.message.includes('does not exist')) throw err;
  }

  // Delete users last due to foreign keys
  await pool.query('DELETE FROM users WHERE email LIKE \'%@example.com\'');
}

/**
 * Create a test session for a user
 * @param {number} userId - User ID
 * @param {string} token - Session token
 * @returns {Object} Created session
 */
async function createTestSession(userId, token = `test_token_${Date.now()}`) {
  const result = await pool.query(
    `INSERT INTO sessions (
      user_id, token, ip_address, user_agent, device_name, device_type,
      os, browser, is_mobile, location, expires_at, last_activity_at, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
    RETURNING *`,
    [
      userId,
      token,
      '127.0.0.1',
      'Jest Test Suite',
      'Test Device',
      'desktop',
      'Test OS',
      'Test Browser',
      false,
      'Test Location',
      new Date(Date.now() + 86400000) // 24 hours from now
    ]
  );

  return result.rows[0];
}

/**
 * Close database pool (call after all tests)
 */
async function closePool() {
  await pool.end();
}

module.exports = {
  createTestUser,
  createTestAdmin,
  createTestSuperAdmin,
  deleteTestUser,
  cleanupTestUsers,
  cleanupTestData,
  createTestSession,
  closePool,
  pool
};
