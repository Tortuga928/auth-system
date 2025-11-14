/**
 * LoginAttempt Model
 *
 * Story 9.3: Login History & Security Events
 * Handles CRUD operations for login attempts (successful and failed)
 */

const db = require('../db');

class LoginAttempt {
  /**
   * Create a new login attempt record
   * @param {Object} attemptData - Login attempt data
   * @param {number|null} attemptData.user_id - User ID (null if user not found)
   * @param {string} attemptData.email - Email attempted
   * @param {boolean} attemptData.success - Whether login was successful
   * @param {string|null} attemptData.failure_reason - Reason for failure
   * @param {string} attemptData.ip_address - Client IP address
   * @param {string} attemptData.user_agent - User agent string
   * @param {string} attemptData.browser - Browser name
   * @param {string} attemptData.os - Operating system
   * @param {string} attemptData.device_type - Device type (desktop/mobile/tablet)
   * @param {string} attemptData.location - Approximate location
   * @returns {Promise<Object>} Created login attempt record
   */
  static async create(attemptData) {
    const query = `
      INSERT INTO login_attempts (
        user_id, email, success, failure_reason,
        ip_address, user_agent, browser, os,
        device_type, location, attempted_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      RETURNING *
    `;

    const values = [
      attemptData.user_id || null,
      attemptData.email,
      attemptData.success,
      attemptData.failure_reason || null,
      attemptData.ip_address || null,
      attemptData.user_agent || null,
      attemptData.browser || null,
      attemptData.os || null,
      attemptData.device_type || null,
      attemptData.location || null,
    ];

    const result = await db.query(query, values);
    return result.rows[0];
  }

  /**
   * Get login attempts for a specific user
   * @param {number} userId - User ID
   * @param {Object} options - Query options
   * @param {number} options.limit - Number of records to return
   * @param {number} options.offset - Number of records to skip
   * @param {boolean} options.successOnly - Only return successful attempts
   * @returns {Promise<Array>} Array of login attempts
   */
  static async findByUserId(userId, options = {}) {
    const { limit = 50, offset = 0, successOnly = false } = options;

    let query = `
      SELECT * FROM login_attempts
      WHERE user_id = $1
    `;

    if (successOnly) {
      query += ' AND success = true';
    }

    query += ' ORDER BY attempted_at DESC LIMIT $2 OFFSET $3';

    const result = await db.query(query, [userId, limit, offset]);
    return result.rows;
  }

  /**
   * Get login attempts by email (for brute force detection)
   * @param {string} email - Email address
   * @param {number} minutesAgo - Look back this many minutes
   * @returns {Promise<Array>} Array of login attempts
   */
  static async findRecentByEmail(email, minutesAgo = 15) {
    const query = `
      SELECT * FROM login_attempts
      WHERE email = $1
        AND attempted_at > NOW() - INTERVAL '${minutesAgo} minutes'
      ORDER BY attempted_at DESC
    `;

    const result = await db.query(query, [email]);
    return result.rows;
  }

  /**
   * Count failed login attempts for an email in a time window
   * @param {string} email - Email address
   * @param {number} minutesAgo - Look back this many minutes
   * @returns {Promise<number>} Count of failed attempts
   */
  static async countRecentFailures(email, minutesAgo = 15) {
    const query = `
      SELECT COUNT(*) as count
      FROM login_attempts
      WHERE email = $1
        AND success = false
        AND attempted_at > NOW() - INTERVAL '${minutesAgo} minutes'
    `;

    const result = await db.query(query, [email]);
    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Get paginated login history for a user
   * @param {number} userId - User ID
   * @param {number} page - Page number (1-based)
   * @param {number} pageSize - Number of records per page
   * @returns {Promise<Object>} Paginated results with metadata
   */
  static async getPaginated(userId, page = 1, pageSize = 20) {
    const offset = (page - 1) * pageSize;

    // Get total count
    const countQuery = 'SELECT COUNT(*) as total FROM login_attempts WHERE user_id = $1';
    const countResult = await db.query(countQuery, [userId]);
    const total = parseInt(countResult.rows[0].total, 10);

    // Get paginated data
    const dataQuery = `
      SELECT * FROM login_attempts
      WHERE user_id = $1
      ORDER BY attempted_at DESC
      LIMIT $2 OFFSET $3
    `;
    const dataResult = await db.query(dataQuery, [userId, pageSize, offset]);

    return {
      data: dataResult.rows,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        hasNext: page < Math.ceil(total / pageSize),
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get login statistics for a user
   * @param {number} userId - User ID
   * @param {number} daysAgo - Look back this many days
   * @returns {Promise<Object>} Statistics object
   */
  static async getStatistics(userId, daysAgo = 30) {
    const query = `
      SELECT
        COUNT(*) as total_attempts,
        COUNT(CASE WHEN success = true THEN 1 END) as successful_logins,
        COUNT(CASE WHEN success = false THEN 1 END) as failed_logins,
        COUNT(DISTINCT ip_address) as unique_ips,
        COUNT(DISTINCT device_type) as unique_devices
      FROM login_attempts
      WHERE user_id = $1
        AND attempted_at > NOW() - INTERVAL '${daysAgo} days'
    `;

    const result = await db.query(query, [userId]);
    return result.rows[0];
  }

  /**
   * Delete old login attempts (cleanup)
   * @param {number} daysToKeep - Keep records from last X days
   * @returns {Promise<number>} Number of deleted records
   */
  static async cleanup(daysToKeep = 90) {
    const query = `
      DELETE FROM login_attempts
      WHERE attempted_at < NOW() - INTERVAL '${daysToKeep} days'
    `;

    const result = await db.query(query);
    return result.rowCount;
  }
}

module.exports = LoginAttempt;
