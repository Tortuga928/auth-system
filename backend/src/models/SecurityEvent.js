/**
 * SecurityEvent Model
 *
 * Story 9.3: Login History & Security Events
 * Handles CRUD operations for security events and alerts
 */

const db = require('../db');

class SecurityEvent {
  /**
   * Create a new security event
   * @param {Object} eventData - Security event data
   * @param {number} eventData.user_id - User ID
   * @param {string} eventData.event_type - Type of event
   * @param {string} eventData.description - Human-readable description
   * @param {string} eventData.severity - Severity level (info, warning, critical)
   * @param {Object} eventData.metadata - Additional data as object
   * @param {string} eventData.ip_address - IP address
   * @returns {Promise<Object>} Created security event
   */
  static async create(eventData) {
    const query = `
      INSERT INTO security_events (
        user_id, event_type, description, severity,
        metadata, ip_address, created_at, acknowledged
      )
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), false)
      RETURNING *
    `;

    const values = [
      eventData.user_id,
      eventData.event_type,
      eventData.description || null,
      eventData.severity || 'info',
      eventData.metadata ? JSON.stringify(eventData.metadata) : null,
      eventData.ip_address || null,
    ];

    const result = await db.query(query, values);
    return result.rows[0];
  }

  /**
   * Find security event by ID
   * @param {number} id - Event ID
   * @returns {Promise<Object|null>} Security event or null
   */
  static async findById(id) {
    const query = 'SELECT * FROM security_events WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Get security events for a user
   * @param {number} userId - User ID
   * @param {Object} options - Query options
   * @param {number} options.limit - Number of records to return
   * @param {number} options.offset - Number of records to skip
   * @param {string} options.severity - Filter by severity
   * @param {boolean} options.unacknowledgedOnly - Only unacknowledged events
   * @returns {Promise<Array>} Array of security events
   */
  static async findByUserId(userId, options = {}) {
    const {
      limit = 50,
      offset = 0,
      severity = null,
      unacknowledgedOnly = false,
    } = options;

    let query = 'SELECT * FROM security_events WHERE user_id = $1';
    const params = [userId];
    let paramIndex = 2;

    if (severity) {
      query += ` AND severity = $${paramIndex}`;
      params.push(severity);
      paramIndex++;
    }

    if (unacknowledgedOnly) {
      query += ' AND acknowledged = false';
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);
    return result.rows;
  }

  /**
   * Get paginated security events for a user
   * @param {number} userId - User ID
   * @param {number} page - Page number (1-based)
   * @param {number} pageSize - Number of records per page
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Paginated results with metadata
   */
  static async getPaginated(userId, page = 1, pageSize = 20, filters = {}) {
    const offset = (page - 1) * pageSize;
    const { severity = null, unacknowledgedOnly = false } = filters;

    // Build WHERE clause
    let whereClause = 'WHERE user_id = $1';
    const countParams = [userId];
    const dataParams = [userId];
    let paramIndex = 2;

    if (severity) {
      whereClause += ` AND severity = $${paramIndex}`;
      countParams.push(severity);
      dataParams.push(severity);
      paramIndex++;
    }

    if (unacknowledgedOnly) {
      whereClause += ' AND acknowledged = false';
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM security_events ${whereClause}`;
    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total, 10);

    // Get paginated data
    const dataQuery = `
      SELECT * FROM security_events
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    dataParams.push(pageSize, offset);
    const dataResult = await db.query(dataQuery, dataParams);

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
   * Acknowledge a security event
   * @param {number} eventId - Event ID
   * @param {number} userId - User ID (for verification)
   * @returns {Promise<Object|null>} Updated event or null
   */
  static async acknowledge(eventId, userId) {
    const query = `
      UPDATE security_events
      SET acknowledged = true, acknowledged_at = NOW()
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;

    const result = await db.query(query, [eventId, userId]);
    return result.rows[0] || null;
  }

  /**
   * Acknowledge all events for a user
   * @param {number} userId - User ID
   * @returns {Promise<number>} Number of acknowledged events
   */
  static async acknowledgeAll(userId) {
    const query = `
      UPDATE security_events
      SET acknowledged = true, acknowledged_at = NOW()
      WHERE user_id = $1 AND acknowledged = false
    `;

    const result = await db.query(query, [userId]);
    return result.rowCount;
  }

  /**
   * Count unacknowledged events for a user
   * @param {number} userId - User ID
   * @returns {Promise<number>} Count of unacknowledged events
   */
  static async countUnacknowledged(userId) {
    const query = `
      SELECT COUNT(*) as count
      FROM security_events
      WHERE user_id = $1 AND acknowledged = false
    `;

    const result = await db.query(query, [userId]);
    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Get event statistics for a user
   * @param {number} userId - User ID
   * @param {number} daysAgo - Look back this many days
   * @returns {Promise<Object>} Statistics object
   */
  static async getStatistics(userId, daysAgo = 30) {
    const query = `
      SELECT
        COUNT(*) as total_events,
        COUNT(CASE WHEN severity = 'info' THEN 1 END) as info_count,
        COUNT(CASE WHEN severity = 'warning' THEN 1 END) as warning_count,
        COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical_count,
        COUNT(CASE WHEN acknowledged = false THEN 1 END) as unacknowledged_count
      FROM security_events
      WHERE user_id = $1
        AND created_at > NOW() - INTERVAL '${daysAgo} days'
    `;

    const result = await db.query(query, [userId]);
    return result.rows[0];
  }

  /**
   * Check if similar event exists recently (prevent duplicates)
   * @param {number} userId - User ID
   * @param {string} eventType - Event type
   * @param {number} minutesAgo - Look back this many minutes
   * @returns {Promise<boolean>} True if similar event exists
   */
  static async hasRecentSimilarEvent(userId, eventType, minutesAgo = 60) {
    const query = `
      SELECT COUNT(*) as count
      FROM security_events
      WHERE user_id = $1
        AND event_type = $2
        AND created_at > NOW() - INTERVAL '${minutesAgo} minutes'
    `;

    const result = await db.query(query, [userId, eventType]);
    return parseInt(result.rows[0].count, 10) > 0;
  }

  /**
   * Delete old security events (cleanup)
   * @param {number} daysToKeep - Keep records from last X days
   * @returns {Promise<number>} Number of deleted records
   */
  static async cleanup(daysToKeep = 180) {
    const query = `
      DELETE FROM security_events
      WHERE created_at < NOW() - INTERVAL '${daysToKeep} days'
    `;

    const result = await db.query(query);
    return result.rowCount;
  }
}

module.exports = SecurityEvent;
