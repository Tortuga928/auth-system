/**
 * Activity Log Model
 *
 * Database operations for user_activity_logs table
 * Used to track user actions for security and activity history
 */

const db = require('../db');

class ActivityLog {
  /**
   * Create a new activity log entry
   *
   * @param {Object} logData - Activity log data
   * @param {number} logData.user_id - User ID
   * @param {string} logData.action - Action type (e.g., 'login', 'logout', 'password_changed')
   * @param {string} [logData.description] - Human-readable description
   * @param {string} [logData.ip_address] - IP address (IPv4 or IPv6)
   * @param {string} [logData.user_agent] - Browser/device info
   * @param {Object} [logData.metadata] - Additional contextual data
   * @returns {Promise<Object>} Created activity log entry
   */
  static async create({ user_id, action, description, ip_address, user_agent, metadata }) {
    const query = `
      INSERT INTO user_activity_logs (user_id, action, description, ip_address, user_agent, metadata)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, user_id, action, description, ip_address, user_agent, metadata, created_at
    `;

    const values = [
      user_id,
      action,
      description || null,
      ip_address || null,
      user_agent || null,
      metadata ? JSON.stringify(metadata) : null,
    ];

    const result = await db.query(query, values);
    return result.rows[0];
  }

  /**
   * Get recent activity logs for a user
   *
   * @param {number} userId - User ID
   * @param {number} [limit=10] - Maximum number of logs to return
   * @returns {Promise<Array>} Array of activity log entries
   */
  static async getRecentByUserId(userId, limit = 10) {
    const query = `
      SELECT id, user_id, action, description, ip_address, user_agent, metadata, created_at
      FROM user_activity_logs
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;

    const result = await db.query(query, [userId, limit]);
    return result.rows;
  }

  /**
   * Get activity logs for a user with pagination
   *
   * @param {number} userId - User ID
   * @param {number} [page=1] - Page number (1-indexed)
   * @param {number} [pageSize=25] - Number of logs per page
   * @returns {Promise<Object>} Object with logs array and pagination info
   */
  static async getByUserId(userId, page = 1, pageSize = 25) {
    const offset = (page - 1) * pageSize;

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as count
      FROM user_activity_logs
      WHERE user_id = $1
    `;
    const countResult = await db.query(countQuery, [userId]);
    const totalCount = parseInt(countResult.rows[0].count, 10);

    // Get paginated logs
    const query = `
      SELECT id, user_id, action, description, ip_address, user_agent, metadata, created_at
      FROM user_activity_logs
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await db.query(query, [userId, pageSize, offset]);

    return {
      logs: result.rows,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    };
  }

  /**
   * Get activity logs by action type for a user
   *
   * @param {number} userId - User ID
   * @param {string} action - Action type
   * @param {number} [limit=50] - Maximum number of logs to return
   * @returns {Promise<Array>} Array of activity log entries
   */
  static async getByUserIdAndAction(userId, action, limit = 50) {
    const query = `
      SELECT id, user_id, action, description, ip_address, user_agent, metadata, created_at
      FROM user_activity_logs
      WHERE user_id = $1 AND action = $2
      ORDER BY created_at DESC
      LIMIT $3
    `;

    const result = await db.query(query, [userId, action, limit]);
    return result.rows;
  }

  /**
   * Delete old activity logs
   *
   * @param {number} daysToKeep - Number of days of logs to keep
   * @returns {Promise<number>} Number of deleted logs
   */
  static async deleteOldLogs(daysToKeep = 90) {
    const query = `
      DELETE FROM user_activity_logs
      WHERE created_at < NOW() - INTERVAL '${daysToKeep} days'
      RETURNING id
    `;

    const result = await db.query(query);
    return result.rows.length;
  }

  /**
   * Get activity log by ID
   *
   * @param {number} id - Activity log ID
   * @returns {Promise<Object|null>} Activity log entry or null
   */
  static async findById(id) {
    const query = `
      SELECT id, user_id, action, description, ip_address, user_agent, metadata, created_at
      FROM user_activity_logs
      WHERE id = $1
    `;

    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Get activity logs count for a user
   *
   * @param {number} userId - User ID
   * @returns {Promise<number>} Total number of activity logs
   */
  static async countByUserId(userId) {
    const query = `
      SELECT COUNT(*) as count
      FROM user_activity_logs
      WHERE user_id = $1
    `;

    const result = await db.query(query, [userId]);
    return parseInt(result.rows[0].count, 10);
  }
}

module.exports = ActivityLog;
