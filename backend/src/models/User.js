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
      SELECT id, username, email, first_name, last_name, role, email_verified, is_active, avatar_url, created_at, updated_at
      FROM users
      WHERE id = $1
    `;

    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Find user by ID with password hash (for authentication)
   *
   * @param {number} id - User ID
   * @returns {Promise<Object|null>} User object with password_hash or null
   */
  static async findByIdWithPassword(id) {
    const query = `
      SELECT id, username, email, password_hash, first_name, last_name, role, email_verified, is_active, avatar_url, created_at, updated_at
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
      'first_name',
      'last_name',
      'role',
      'email_verified',
      'email_verification_token',
      'email_verification_expires',
      'password_reset_token',
      'password_reset_expires',
      'avatar_url',
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
      RETURNING id, username, email, first_name, last_name, role, email_verified, is_active, avatar_url, created_at, updated_at
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
   * @returns {Promise<boolean}> True if cleared
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

  /**
   * Find all users with pagination and filtering (Admin)
   *
   * @param {Object} options - Query options
   * @param {number} options.page - Page number (default: 1)
   * @param {number} options.pageSize - Items per page (default: 20)
   * @param {string} options.role - Filter by role
   * @param {boolean} options.is_active - Filter by active status
   * @param {string} options.search - Search in email/username
   * @param {string} options.sortBy - Sort field (default: 'created_at')
   * @param {string} options.sortOrder - Sort order 'ASC' or 'DESC' (default: 'DESC')
   * @returns {Promise<Object>} { users: [], pagination: {} }
   */
  static async findAll(options = {}) {
    const {
      page = 1,
      pageSize = 20,
      role,
      is_active,
      search,
      sortBy = 'created_at',
      sortOrder = 'DESC',
    } = options;

    const offset = (page - 1) * pageSize;
    const whereConditions = [];
    const values = [];
    let paramCount = 1;

    // Build WHERE clause
    if (role) {
      whereConditions.push(`role = $${paramCount}`);
      values.push(role);
      paramCount++;
    }

    if (is_active !== undefined) {
      whereConditions.push(`is_active = $${paramCount}`);
      values.push(is_active);
      paramCount++;
    }

    if (search) {
      whereConditions.push(`(email ILIKE $${paramCount} OR username ILIKE $${paramCount})`);
      values.push(`%${search}%`);
      paramCount++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Validate sortBy to prevent SQL injection
    const allowedSortFields = ['id', 'username', 'email', 'role', 'created_at', 'is_active'];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Get total count
    const countQuery = `SELECT COUNT(*) as count FROM users ${whereClause}`;
    const countResult = await db.query(countQuery, values);
    const totalCount = parseInt(countResult.rows[0].count, 10);

    // Get paginated users
    const dataQuery = `
      SELECT id, username, email, first_name, last_name, role, email_verified, is_active, avatar_url, created_at, updated_at
      FROM users
      ${whereClause}
      ORDER BY ${safeSortBy} ${safeSortOrder}
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    values.push(pageSize, offset);

    const dataResult = await db.query(dataQuery, values);

    return {
      users: dataResult.rows,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    };
  }

  /**
   * Search users by email or username (Admin)
   *
   * @param {string} searchTerm - Search term
   * @param {number} limit - Max results (default: 10)
   * @returns {Promise<Array>} Array of users
   */
  static async search(searchTerm, limit = 10) {
    const query = `
      SELECT id, username, email, role, email_verified, is_active, created_at
      FROM users
      WHERE email ILIKE $1 OR username ILIKE $1
      ORDER BY created_at DESC
      LIMIT $2
    `;

    const result = await db.query(query, [`%${searchTerm}%`, limit]);
    return result.rows;
  }

  /**
   * Get user with additional details (Admin)
   * Includes MFA status, OAuth accounts count, recent activity
   *
   * @param {number} id - User ID
   * @returns {Promise<Object|null>} User with details or null
   */
  static async findByIdWithDetails(id) {
    const query = `
      SELECT
        u.id, u.username, u.email, u.first_name, u.last_name,
        u.role, u.email_verified, u.is_active, u.avatar_url,
        u.last_login_at, u.created_at, u.updated_at,
        u.archived_at, u.anonymized_at,
        EXISTS(SELECT 1 FROM mfa_secrets WHERE user_id = u.id AND enabled = true) as mfa_enabled,
        (SELECT COUNT(*) FROM oauth_accounts WHERE user_id = u.id) as oauth_accounts_count,
        (SELECT COUNT(*) FROM sessions WHERE user_id = u.id AND is_active = true) as active_sessions_count
      FROM users u
      WHERE u.id = $1
    `;

    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Soft delete user (set is_active = false)
   *
   * @param {number} id - User ID
   * @returns {Promise<boolean>} True if deactivated
   */
  static async deactivate(id) {
    const query = `
      UPDATE users
      SET is_active = false, updated_at = NOW()
      WHERE id = $1
      RETURNING id
    `;
    const result = await db.query(query, [id]);
    return result.rows.length > 0;
  }

  /**
   * Reactivate user (set is_active = true)
   *
   * @param {number} id - User ID
   * @returns {Promise<boolean>} True if reactivated
   */
  static async activate(id) {
    const query = `
      UPDATE users
      SET is_active = true, updated_at = NOW()
      WHERE id = $1
      RETURNING id
    `;
    const result = await db.query(query, [id]);
    return result.rows.length > 0;
  }


  /**
   * Archive user (hide from default views)
   *
   * @param {number} id - User ID
   * @returns {Promise<Object|null>} Archived user or null
   */
  static async archive(id) {
    const query = `
      UPDATE users
      SET archived_at = NOW(), is_active = false, updated_at = NOW()
      WHERE id = $1
      RETURNING id, username, email, archived_at
    `;
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Restore user from archive
   *
   * @param {number} id - User ID
   * @returns {Promise<Object|null>} Restored user or null
   */
  static async restore(id) {
    const query = `
      UPDATE users
      SET archived_at = NULL, updated_at = NOW()
      WHERE id = $1
      RETURNING id, username, email, is_active, archived_at
    `;
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Anonymize user data for GDPR compliance
   * Only works on archived users
   *
   * @param {number} id - User ID
   * @returns {Promise<Object|null>} Anonymized user or null
   */
  static async anonymize(id) {
    // Generate random string for anonymization
    const anonymizedId = `anon_${id}_${Date.now()}`;

    const query = `
      UPDATE users
      SET
        username = $2,
        email = $3,
        first_name = NULL,
        last_name = NULL,
        avatar_url = NULL,
        password_hash = 'ANONYMIZED',
        anonymized_at = NOW(),
        updated_at = NOW()
      WHERE id = $1 AND archived_at IS NOT NULL
      RETURNING id, username, email, anonymized_at
    `;
    const result = await db.query(query, [
      id,
      anonymizedId,
      `${anonymizedId}@anonymized.local`
    ]);
    return result.rows[0] || null;
  }

  /**
   * Find all users with pagination, filtering, and archive status support
   *
   * @param {Object} options - Query options
   * @param {number} options.page - Page number (default: 1)
   * @param {number} options.pageSize - Items per page (default: 20)
   * @param {string} options.role - Filter by role
   * @param {string} options.status - Filter: 'active', 'inactive', 'archived', 'all'
   * @param {string} options.search - Search in email/username
   * @param {string} options.sortBy - Sort field (default: 'created_at')
   * @param {string} options.sortOrder - Sort order 'ASC' or 'DESC' (default: 'DESC')
   * @returns {Promise<Object>} { users: [], pagination: {} }
   */
  static async findAllWithArchive(options = {}) {
    const {
      page = 1,
      pageSize = 20,
      role,
      status = 'active',
      search,
      sortBy = 'created_at',
      sortOrder = 'DESC',
    } = options;

    const offset = (page - 1) * pageSize;
    const whereConditions = [];
    const values = [];
    let paramCount = 1;

    // Handle status filter
    if (status === 'active') {
      whereConditions.push(`is_active = true AND archived_at IS NULL`);
    } else if (status === 'inactive') {
      whereConditions.push(`is_active = false AND archived_at IS NULL`);
    } else if (status === 'archived') {
      whereConditions.push(`archived_at IS NOT NULL`);
    }
    // 'all' = no status filter

    // Build WHERE clause for other filters
    if (role) {
      whereConditions.push(`role = $${paramCount}`);
      values.push(role);
      paramCount++;
    }

    if (search) {
      whereConditions.push(`(email ILIKE $${paramCount} OR username ILIKE $${paramCount})`);
      values.push(`%${search}%`);
      paramCount++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Validate sortBy to prevent SQL injection
    const allowedSortFields = ['id', 'username', 'email', 'role', 'created_at', 'is_active', 'archived_at'];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Use case-insensitive sorting for text columns
    const textColumns = ['username', 'email', 'role'];
    const orderByColumn = textColumns.includes(safeSortBy)
      ? `LOWER(${safeSortBy})`
      : safeSortBy;

    // Get total count
    const countQuery = `SELECT COUNT(*) as count FROM users ${whereClause}`;
    const countResult = await db.query(countQuery, values);
    const totalCount = parseInt(countResult.rows[0].count, 10);

    // Get paginated users
    const dataQuery = `
      SELECT id, username, email, first_name, last_name, role, email_verified,
             is_active, avatar_url, archived_at, anonymized_at, created_at, updated_at
      FROM users
      ${whereClause}
      ORDER BY ${orderByColumn} ${safeSortOrder}
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    values.push(pageSize, offset);

    const dataResult = await db.query(dataQuery, values);

    return {
      users: dataResult.rows,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    };
  }
}

module.exports = User;
