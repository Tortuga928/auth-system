/**
 * AuditLog Model
 *
 * Database operations for audit_logs table
 * Tracks all admin actions for security and compliance
 */

const db = require('../db');

// Action type constants
const ACTION_TYPES = {
  USER_CREATE: 'USER_CREATE',
  USER_UPDATE: 'USER_UPDATE',
  USER_DELETE: 'USER_DELETE',
  USER_ROLE_CHANGE: 'USER_ROLE_CHANGE',
  USER_STATUS_CHANGE: 'USER_STATUS_CHANGE',
  USER_PASSWORD_RESET: 'USER_PASSWORD_RESET',
  SYSTEM_CONFIG_UPDATE: 'SYSTEM_CONFIG_UPDATE',
  ADMIN_LOGIN: 'ADMIN_LOGIN',
};

// Target type constants
const TARGET_TYPES = {
  USER: 'user',
  SYSTEM: 'system',
  CONFIG: 'config',
};

class AuditLog {
  /**
   * Create an audit log entry
   *
   * @param {Object} logData - Log entry data
   * @param {number} logData.admin_id - Admin user ID
   * @param {string} logData.admin_email - Admin email
   * @param {string} logData.action - Action type (see ACTION_TYPES)
   * @param {string} logData.target_type - Target type (see TARGET_TYPES)
   * @param {number} logData.target_id - Target ID (optional for system actions)
   * @param {Object} logData.details - Additional details (optional)
   * @param {string} logData.ip_address - IP address (optional)
   * @param {string} logData.user_agent - User agent (optional)
   * @returns {Promise<Object>} Created log entry
   */
  static async create(logData) {
    const {
      admin_id,
      admin_email,
      action,
      target_type,
      target_id = null,
      details = null,
      ip_address = null,
      user_agent = null,
    } = logData;

    const query = `
      INSERT INTO audit_logs (
        admin_id, admin_email, action, target_type, target_id,
        details, ip_address, user_agent
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, admin_id, admin_email, action, target_type, target_id,
                details, ip_address, user_agent, created_at
    `;

    const values = [
      admin_id,
      admin_email,
      action,
      target_type,
      target_id,
      details ? JSON.stringify(details) : null,
      ip_address,
      user_agent,
    ];

    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating audit log:', error);
      throw error;
    }
  }

  /**
   * Find all audit logs with pagination and filtering
   *
   * @param {Object} options - Query options
   * @param {number} options.page - Page number (default: 1)
   * @param {number} options.pageSize - Items per page (default: 20)
   * @param {number} options.admin_id - Filter by admin user ID
   * @param {string} options.action - Filter by action type
   * @param {string} options.target_type - Filter by target type
   * @param {number} options.target_id - Filter by target ID
   * @param {Date} options.start_date - Filter by start date
   * @param {Date} options.end_date - Filter by end date
   * @param {string} options.sortOrder - Sort order 'ASC' or 'DESC' (default: 'DESC')
   * @returns {Promise<Object>} { logs: [], pagination: {} }
   */
  static async findAll(options = {}) {
    const {
      page = 1,
      pageSize = 20,
      admin_id,
      action,
      target_type,
      target_id,
      start_date,
      end_date,
      sortOrder = 'DESC',
    } = options;

    const offset = (page - 1) * pageSize;
    const whereConditions = [];
    const values = [];
    let paramCount = 1;

    // Build WHERE clause
    if (admin_id) {
      whereConditions.push(`admin_id = $${paramCount}`);
      values.push(admin_id);
      paramCount++;
    }

    if (action) {
      whereConditions.push(`action = $${paramCount}`);
      values.push(action);
      paramCount++;
    }

    if (target_type) {
      whereConditions.push(`target_type = $${paramCount}`);
      values.push(target_type);
      paramCount++;
    }

    if (target_id) {
      whereConditions.push(`target_id = $${paramCount}`);
      values.push(target_id);
      paramCount++;
    }

    if (start_date) {
      whereConditions.push(`created_at >= $${paramCount}`);
      values.push(start_date);
      paramCount++;
    }

    if (end_date) {
      whereConditions.push(`created_at <= $${paramCount}`);
      values.push(end_date);
      paramCount++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Validate sort order
    const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Get total count
    const countQuery = `SELECT COUNT(*) as count FROM audit_logs ${whereClause}`;
    const countResult = await db.query(countQuery, values);
    const totalCount = parseInt(countResult.rows[0].count, 10);

    // Get paginated logs
    const dataQuery = `
      SELECT id, admin_id, admin_email, action, target_type, target_id,
             details, ip_address, user_agent, created_at
      FROM audit_logs
      ${whereClause}
      ORDER BY created_at ${safeSortOrder}
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    values.push(pageSize, offset);

    const dataResult = await db.query(dataQuery, values);

    return {
      logs: dataResult.rows,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    };
  }

  /**
   * Get audit logs for a specific admin user
   *
   * @param {number} adminId - Admin user ID
   * @param {number} limit - Max results (default: 50)
   * @returns {Promise<Array>} Array of audit logs
   */
  static async findByAdmin(adminId, limit = 50) {
    const query = `
      SELECT id, admin_id, admin_email, action, target_type, target_id,
             details, ip_address, user_agent, created_at
      FROM audit_logs
      WHERE admin_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;

    const result = await db.query(query, [adminId, limit]);
    return result.rows;
  }

  /**
   * Get audit logs for a specific target
   *
   * @param {string} targetType - Target type (user, system, config)
   * @param {number} targetId - Target ID
   * @param {number} limit - Max results (default: 50)
   * @returns {Promise<Array>} Array of audit logs
   */
  static async findByTarget(targetType, targetId, limit = 50) {
    const query = `
      SELECT id, admin_id, admin_email, action, target_type, target_id,
             details, ip_address, user_agent, created_at
      FROM audit_logs
      WHERE target_type = $1 AND target_id = $2
      ORDER BY created_at DESC
      LIMIT $3
    `;

    const result = await db.query(query, [targetType, targetId, limit]);
    return result.rows;
  }

  /**
   * Get audit logs by action type
   *
   * @param {string} action - Action type
   * @param {number} limit - Max results (default: 50)
   * @returns {Promise<Array>} Array of audit logs
   */
  static async findByAction(action, limit = 50) {
    const query = `
      SELECT id, admin_id, admin_email, action, target_type, target_id,
             details, ip_address, user_agent, created_at
      FROM audit_logs
      WHERE action = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;

    const result = await db.query(query, [action, limit]);
    return result.rows;
  }

  /**
   * Get recent audit logs
   *
   * @param {number} limit - Max results (default: 100)
   * @returns {Promise<Array>} Array of recent audit logs
   */
  static async getRecent(limit = 100) {
    const query = `
      SELECT id, admin_id, admin_email, action, target_type, target_id,
             details, ip_address, user_agent, created_at
      FROM audit_logs
      ORDER BY created_at DESC
      LIMIT $1
    `;

    const result = await db.query(query, [limit]);
    return result.rows;
  }

  /**
   * Get audit log statistics
   *
   * @returns {Promise<Object>} Statistics about audit logs
   */
  static async getStatistics() {
    const query = `
      SELECT
        COUNT(*) as total_logs,
        COUNT(DISTINCT admin_id) as unique_admins,
        COUNT(DISTINCT DATE(created_at)) as days_with_activity,
        (SELECT COUNT(*) FROM audit_logs WHERE created_at >= NOW() - INTERVAL '24 hours') as logs_last_24h,
        (SELECT COUNT(*) FROM audit_logs WHERE created_at >= NOW() - INTERVAL '7 days') as logs_last_7d,
        (SELECT COUNT(*) FROM audit_logs WHERE created_at >= NOW() - INTERVAL '30 days') as logs_last_30d
      FROM audit_logs
    `;

    const result = await db.query(query);
    return result.rows[0];
  }

  /**
   * Delete old audit logs (for retention policy)
   *
   * @param {number} days - Delete logs older than this many days
   * @returns {Promise<number>} Number of deleted logs
   */
  static async deleteOlderThan(days) {
    const query = `
      DELETE FROM audit_logs
      WHERE created_at < NOW() - INTERVAL '${days} days'
      RETURNING id
    `;

    const result = await db.query(query);
    return result.rows.length;
  }
}

// Export class and constants
module.exports = AuditLog;
module.exports.ACTION_TYPES = ACTION_TYPES;
module.exports.TARGET_TYPES = TARGET_TYPES;
