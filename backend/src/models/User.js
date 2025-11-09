/**
 * User Model
 *
 * Database operations for users table
 */

const db = require('../db');

class User {
  /**
   * Create a new user
   *
   * @param {Object} userData - User data
   * @param {string} userData.username - Username
   * @param {string} userData.email - User email
   * @param {string} userData.password_hash - Hashed password
   * @param {string} userData.role - User role (default: 'user')
   * @returns {Promise<Object>} Created user (without password_hash)
   */
  static async create({ username, email, password_hash, role = 'user' }) {
    const query = `
      INSERT INTO users (username, email, password_hash, role, email_verified)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, username, email, role, email_verified, created_at, updated_at
    `;

    const values = [username, email, password_hash, role, false];

    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      // Handle unique constraint violations
      if (error.code === '23505') {
        if (error.constraint === 'users_email_unique') {
          throw new Error('Email already exists');
        }
        if (error.constraint === 'users_username_unique') {
          throw new Error('Username already exists');
        }
      }
      throw error;
    }
  }

  /**
   * Find user by email
   *
   * @param {string} email - User email
   * @returns {Promise<Object|null>} User object or null if not found
   */
  static async findByEmail(email) {
    const query = `
      SELECT id, username, email, password_hash, role, email_verified,
             mfa_reset_token, mfa_reset_token_expires, created_at, updated_at
      FROM users
      WHERE email = $1
    `;

    const result = await db.query(query, [email]);
    return result.rows[0] || null;
  }

  /**
   * Find user by ID
   *
   * @param {number} id - User ID
   * @returns {Promise<Object|null>} User object (without password_hash) or null
   */
  static async findById(id) {
    const query = `
      SELECT id, username, email, role, email_verified, created_at, updated_at
      FROM users
      WHERE id = $1
    `;

    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Find user by username
   *
   * @param {string} username - Username
   * @returns {Promise<Object|null>} User object or null if not found
   */
  static async findByUsername(username) {
    const query = `
      SELECT id, username, email, password_hash, role, email_verified, created_at, updated_at
      FROM users
      WHERE username = $1
    `;

    const result = await db.query(query, [username]);
    return result.rows[0] || null;
  }

  /**
   * Find user by email verification token
   *
   * @param {string} token - Email verification token
   * @returns {Promise<Object|null>} User object (with token fields) or null
   */
  static async findByVerificationToken(token) {
    const query = `
      SELECT id, username, email, role, email_verified,
             email_verification_token, email_verification_expires,
             created_at, updated_at
      FROM users
      WHERE email_verification_token = $1
    `;

    const result = await db.query(query, [token]);
    return result.rows[0] || null;
  }

  /**
   * Find user by password reset token
   *
   * @param {string} token - Password reset token
   * @returns {Promise<Object|null>} User object (with token fields) or null
   */
  static async findByPasswordResetToken(token) {
    const query = `
      SELECT id, username, email, role, email_verified,
             password_reset_token, password_reset_expires,
             created_at, updated_at
      FROM users
      WHERE password_reset_token = $1
    `;

    const result = await db.query(query, [token]);
    return result.rows[0] || null;
  }

  /**
   * Update user
   *
   * @param {number} id - User ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated user (without password_hash)
   */
  static async update(id, updates) {
    const allowedFields = [
      'username',
      'email',
      'password_hash',
      'role',
      'email_verified',
      'email_verification_token',
      'email_verification_expires',
      'password_reset_token',
      'password_reset_expires',
    ];
    const fields = [];
    const values = [];
    let paramCount = 1;

    // Build dynamic UPDATE query
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = $${paramCount}`);
        values.push(updates[key]);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    // Add updated_at
    fields.push(`updated_at = NOW()`);

    // Add user ID as last parameter
    values.push(id);

    const query = `
      UPDATE users
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, username, email, role, email_verified, created_at, updated_at
    `;

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    return result.rows[0];
  }

  /**
   * Delete user
   *
   * @param {number} id - User ID
   * @returns {Promise<boolean>} True if deleted
   */
  static async delete(id) {
    const query = 'DELETE FROM users WHERE id = $1 RETURNING id';
    const result = await db.query(query, [id]);
    return result.rows.length > 0;
  }

  /**
   * Check if email exists
   *
   * @param {string} email - Email to check
   * @returns {Promise<boolean>} True if email exists
   */
  static async emailExists(email) {
    const query = 'SELECT 1 FROM users WHERE email = $1';
    const result = await db.query(query, [email]);
    return result.rows.length > 0;
  }

  /**
   * Check if username exists
   *
   * @param {string} username - Username to check
   * @returns {Promise<boolean>} True if username exists
   */
  static async usernameExists(username) {
    const query = 'SELECT 1 FROM users WHERE username = $1';
    const result = await db.query(query, [username]);
    return result.rows.length > 0;
  }

  /**
   * Get user count
   *
   * @returns {Promise<number>} Total number of users
   */
  static async count() {
    const query = 'SELECT COUNT(*) as count FROM users';
    const result = await db.query(query);
    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Update MFA reset token
   *
   * @param {number} userId - User ID
   * @param {string} token - Reset token
   * @param {Date} expires - Token expiration date
   * @returns {Promise<Object>} Updated user
   */
  static async updateMFAResetToken(userId, token, expires) {
    const query = `
      UPDATE users
      SET mfa_reset_token = $2, mfa_reset_token_expires = $3, updated_at = NOW()
      WHERE id = $1
      RETURNING id, username, email
    `;
    const result = await db.query(query, [userId, token, expires]);
    return result.rows[0];
  }

  /**
   * Find user by MFA reset token
   *
   * @param {string} token - Reset token
   * @returns {Promise<Object|null>} User object or null
   */
  static async findByMFAResetToken(token) {
    const query = `
      SELECT id, username, email, password_hash, role, email_verified,
             mfa_reset_token, mfa_reset_token_expires, created_at, updated_at
      FROM users
      WHERE mfa_reset_token = $1
    `;
    const result = await db.query(query, [token]);
    return result.rows[0] || null;
  }

  /**
   * Clear MFA reset token
   *
   * @param {number} userId - User ID
   * @returns {Promise<boolean>} True if cleared
   */
  static async clearMFAResetToken(userId) {
    const query = `
      UPDATE users
      SET mfa_reset_token = NULL, mfa_reset_token_expires = NULL, updated_at = NOW()
      WHERE id = $1
      RETURNING id
    `;
    const result = await db.query(query, [userId]);
    return result.rows.length > 0;
  }
}

module.exports = User;
