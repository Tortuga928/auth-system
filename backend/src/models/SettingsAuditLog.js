/**
 * SettingsAuditLog Model
 *
 * Database operations for settings_audit_log table
 * Tracks all settings configuration changes for audit purposes
 */

const db = require('../db');

// Setting type constants
const SETTING_TYPES = {
  EMAIL_SERVICE: 'email_service',
  SYSTEM_SETTING: 'system_setting',
};

// Action type constants
const ACTION_TYPES = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  ACTIVATE: 'activate',
  DEACTIVATE: 'deactivate',
  ENABLE: 'enable',
  DISABLE: 'disable',
  TEST_CONNECTION: 'test_connection',
  TEST_SEND: 'test_send',
};

class SettingsAuditLog {
  /**
   * Create an audit log entry
   *
   * @param {Object} logData - Log entry data
   * @param {number} logData.admin_id - Admin user ID
   * @param {string} logData.admin_email - Admin email
   * @param {string} logData.setting_type - Setting type (see SETTING_TYPES)
   * @param {string} logData.action - Action type (see ACTION_TYPES)
   * @param {number} logData.target_id - Target ID (for email_service)
   * @param {string} logData.setting_key - Setting key (for system_setting)
   * @param {Object} logData.old_value - Previous value (credentials redacted)
   * @param {Object} logData.new_value - New value (credentials redacted)
   * @param {string} logData.ip_address - IP address
   * @param {string} logData.user_agent - User agent
   * @param {string} logData.result_status - Result status (for test actions)
   * @param {string} logData.result_message - Result message (for test actions)
   * @returns {Promise<Object>} Created log entry
   */
  static async create(logData) {
    const {
      admin_id,
      admin_email,
      setting_type,
      action,
      target_id = null,
      setting_key = null,
      old_value = null,
      new_value = null,
      ip_address = null,
      user_agent = null,
      result_status = null,
      result_message = null,
    } = logData;

    const query = `
      INSERT INTO settings_audit_log (
        admin_id, admin_email, setting_type, action, target_id, setting_key,
        old_value, new_value, ip_address, user_agent, result_status, result_message
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id, admin_id, admin_email, setting_type, action, target_id, setting_key,
                old_value, new_value, ip_address, user_agent, result_status, result_message, created_at
    `;

    const values = [
      admin_id,
      admin_email,
      setting_type,
      action,
      target_id,
      setting_key,
      old_value ? JSON.stringify(old_value) : null,
      new_value ? JSON.stringify(new_value) : null,
      ip_address,
      user_agent,
      result_status,
      result_message,
    ];

    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating settings audit log:', error);
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
   * @param {string} options.setting_type - Filter by setting type
   * @param {string} options.action - Filter by action
   * @param {number} options.target_id - Filter by target ID
   * @param {string} options.setting_key - Filter by setting key
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
      setting_type,
      action,
      target_id,
      setting_key,
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

    if (setting_type) {
      whereConditions.push(`setting_type = $${paramCount}`);
      values.push(setting_type);
      paramCount++;
    }

    if (action) {
      whereConditions.push(`action = $${paramCount}`);
      values.push(action);
      paramCount++;
    }

    if (target_id) {
      whereConditions.push(`target_id = $${paramCount}`);
      values.push(target_id);
      paramCount++;
    }

    if (setting_key) {
      whereConditions.push(`setting_key = $${paramCount}`);
      values.push(setting_key);
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
    const countQuery = `SELECT COUNT(*) as count FROM settings_audit_log ${whereClause}`;
    const countResult = await db.query(countQuery, values);
    const totalCount = parseInt(countResult.rows[0].count, 10);

    // Get paginated logs
    const dataQuery = `
      SELECT id, admin_id, admin_email, setting_type, action, target_id, setting_key,
             old_value, new_value, ip_address, user_agent, result_status, result_message, created_at
      FROM settings_audit_log
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
   * Get audit logs for a specific email service
   *
   * @param {number} serviceId - Email service ID
   * @param {number} limit - Max results (default: 50)
   * @returns {Promise<Array>} Array of audit logs
   */
  static async findByEmailService(serviceId, limit = 50) {
    const query = `
      SELECT id, admin_id, admin_email, setting_type, action, target_id, setting_key,
             old_value, new_value, ip_address, user_agent, result_status, result_message, created_at
      FROM settings_audit_log
      WHERE setting_type = $1 AND target_id = $2
      ORDER BY created_at DESC
      LIMIT $3
    `;

    const result = await db.query(query, [SETTING_TYPES.EMAIL_SERVICE, serviceId, limit]);
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
      SELECT id, admin_id, admin_email, setting_type, action, target_id, setting_key,
             old_value, new_value, ip_address, user_agent, result_status, result_message, created_at
      FROM settings_audit_log
      ORDER BY created_at DESC
      LIMIT $1
    `;

    const result = await db.query(query, [limit]);
    return result.rows;
  }

  /**
   * Get audit log statistics
   *
   * @returns {Promise<Object>} Statistics about settings audit logs
   */
  static async getStatistics() {
    const query = `
      SELECT
        COUNT(*) as total_logs,
        COUNT(DISTINCT admin_id) as unique_admins,
        (SELECT COUNT(*) FROM settings_audit_log WHERE created_at >= NOW() - INTERVAL '24 hours') as logs_last_24h,
        (SELECT COUNT(*) FROM settings_audit_log WHERE created_at >= NOW() - INTERVAL '7 days') as logs_last_7d,
        (SELECT COUNT(*) FROM settings_audit_log WHERE action = 'test_connection') as connection_tests,
        (SELECT COUNT(*) FROM settings_audit_log WHERE action = 'test_send') as send_tests
      FROM settings_audit_log
    `;

    const result = await db.query(query);
    return result.rows[0];
  }

  /**
   * Delete old audit logs (for retention policy)
   * Note: Be careful with this - audit logs should generally be retained
   *
   * @param {number} days - Delete logs older than this many days
   * @returns {Promise<number>} Number of deleted logs
   */
  static async deleteOlderThan(days) {
    const query = `
      DELETE FROM settings_audit_log
      WHERE created_at < NOW() - INTERVAL '${days} days'
      RETURNING id
    `;

    const result = await db.query(query);
    return result.rows.length;
  }
}

// Export class and constants
module.exports = SettingsAuditLog;
module.exports.SETTING_TYPES = SETTING_TYPES;
module.exports.ACTION_TYPES = ACTION_TYPES;
