/**
 * Session Model
 *
 * Story 9.1: Enhanced Session Tracking & Metadata
 * Handles CRUD operations for user sessions with device and location tracking
 */

const db = require('../db');

class Session {
  /**
   * Create a new session
   * @param {Object} sessionData - Session data
   * @param {number} sessionData.user_id - User ID
   * @param {string} sessionData.refresh_token - Refresh token
   * @param {Date} sessionData.expires_at - Expiration timestamp
   * @param {string} sessionData.ip_address - Client IP address
   * @param {string} sessionData.user_agent - User agent string
   * @param {string} sessionData.device_name - Friendly device name
   * @param {string} sessionData.browser - Browser name
   * @param {string} sessionData.os - Operating system
   * @param {string} sessionData.device_type - Device type (desktop/mobile/tablet)
   * @param {string} sessionData.location - Approximate location
   * @returns {Promise<Object>} Created session
   */
  static async create(sessionData) {
    const query = `
      INSERT INTO sessions (
        user_id, refresh_token, expires_at,
        ip_address, user_agent, device_name,
        browser, os, device_type, location,
        last_activity_at, is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const values = [
      sessionData.user_id,
      sessionData.refresh_token,
      sessionData.expires_at,
      sessionData.ip_address || null,
      sessionData.user_agent || null,
      sessionData.device_name || null,
      sessionData.browser || null,
      sessionData.os || null,
      sessionData.device_type || null,
      sessionData.location || null,
      new Date(), // last_activity_at
      true, // is_active
    ];

    const result = await db.query(query, values);
    return result.rows[0];
  }

  /**
   * Find session by ID
   * @param {number} id - Session ID
   * @returns {Promise<Object|null>} Session object or null
   */
  static async findById(id) {
    const query = 'SELECT * FROM sessions WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Find session by refresh token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object|null>} Session object or null
   */
  static async findByRefreshToken(refreshToken) {
    const query = 'SELECT * FROM sessions WHERE refresh_token = $1';
    const result = await db.query(query, [refreshToken]);
    return result.rows[0] || null;
  }

  /**
   * Find all sessions for a user
   * @param {number} userId - User ID
   * @param {boolean} activeOnly - Only return active sessions (default: true)
   * @returns {Promise<Array>} Array of session objects
   */
  static async findByUserId(userId, activeOnly = true) {
    let query = 'SELECT * FROM sessions WHERE user_id = $1';

    if (activeOnly) {
      query += ' AND is_active = true';
    }

    query += ' ORDER BY last_activity_at DESC';

    const result = await db.query(query, [userId]);
    return result.rows;
  }

  /**
   * Update session (typically last_activity_at)
   * @param {number} id - Session ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object|null>} Updated session or null
   */
  static async update(id, updates) {
    // Build dynamic SET clause
    const setClauses = [];
    const values = [];
    let paramIndex = 1;

    // Always update updated_at
    updates.updated_at = new Date();

    Object.keys(updates).forEach((key) => {
      setClauses.push(`${key} = $${paramIndex}`);
      values.push(updates[key]);
      paramIndex++;
    });

    values.push(id); // Last parameter for WHERE clause

    const query = `
      UPDATE sessions
      SET ${setClauses.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await db.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Update last activity timestamp
   * @param {number} id - Session ID
   * @returns {Promise<Object|null>} Updated session or null
   */
  static async updateLastActivity(id) {
    return this.update(id, { last_activity_at: new Date() });
  }

  /**
   * Delete/revoke a session
   * @param {number} id - Session ID
   * @returns {Promise<boolean>} True if deleted
   */
  static async delete(id) {
    const query = 'DELETE FROM sessions WHERE id = $1 RETURNING id';
    const result = await db.query(query, [id]);
    return result.rowCount > 0;
  }

  /**
   * Mark session as inactive (soft delete)
   * @param {number} id - Session ID
   * @returns {Promise<Object|null>} Updated session or null
   */
  static async markInactive(id) {
    return this.update(id, { is_active: false });
  }

  /**
   * Delete all sessions for a user except one (typically current session)
   * @param {number} userId - User ID
   * @param {number} exceptSessionId - Session ID to keep
   * @returns {Promise<number>} Number of sessions deleted
   */
  static async deleteAllForUserExcept(userId, exceptSessionId) {
    const query = `
      DELETE FROM sessions
      WHERE user_id = $1 AND id != $2
      RETURNING id
    `;

    const result = await db.query(query, [userId, exceptSessionId]);
    return result.rowCount;
  }

  /**
   * Delete all sessions for a user
   * @param {number} userId - User ID
   * @returns {Promise<number>} Number of sessions deleted
   */
  static async deleteAllForUser(userId) {
    const query = 'DELETE FROM sessions WHERE user_id = $1 RETURNING id';
    const result = await db.query(query, [userId]);
    return result.rowCount;
  }

  /**
   * Cleanup expired sessions
   * Removes sessions where expires_at is in the past
   * @returns {Promise<number>} Number of sessions deleted
   */
  static async cleanupExpired() {
    const query = `
      DELETE FROM sessions
      WHERE expires_at < NOW()
      RETURNING id
    `;

    const result = await db.query(query);
    return result.rowCount;
  }

  /**
   * Cleanup inactive sessions
   * Removes sessions that haven't been active for a specified duration
   * @param {number} inactivityThreshold - Milliseconds of inactivity (default: 30 days)
   * @returns {Promise<number>} Number of sessions deleted
   */
  static async cleanupInactive(inactivityThreshold = 30 * 24 * 60 * 60 * 1000) {
    const cutoffDate = new Date(Date.now() - inactivityThreshold);

    const query = `
      DELETE FROM sessions
      WHERE last_activity_at < $1
      RETURNING id
    `;

    const result = await db.query(query, [cutoffDate]);
    return result.rowCount;
  }

  /**
   * Get session count for user
   * @param {number} userId - User ID
   * @param {boolean} activeOnly - Only count active sessions (default: true)
   * @returns {Promise<number>} Session count
   */
  static async countByUserId(userId, activeOnly = true) {
    let query = 'SELECT COUNT(*) FROM sessions WHERE user_id = $1';

    if (activeOnly) {
      query += ' AND is_active = true';
    }

    const result = await db.query(query, [userId]);
    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Update last activity for user sessions matching IP and user agent
   * If no matching session found, updates the most recently active session
   * @param {number} userId - User ID
   * @param {string} ipAddress - Client IP address
   * @param {string} userAgent - User agent string
   * @returns {Promise<number>} Number of sessions updated
   */
  static async updateActivity(userId, ipAddress, userAgent) {
    // Try to find session matching IP and user agent
    const matchQuery = `
      UPDATE sessions
      SET last_activity_at = NOW(), updated_at = NOW()
      WHERE user_id = $1
        AND ip_address = $2
        AND user_agent = $3
        AND is_active = true
      RETURNING id
    `;

    const matchResult = await db.query(matchQuery, [userId, ipAddress, userAgent]);

    // If found matching session, we're done
    if (matchResult.rowCount > 0) {
      return matchResult.rowCount;
    }

    // No exact match - update the most recently active session for this user
    const fallbackQuery = `
      UPDATE sessions
      SET last_activity_at = NOW(), updated_at = NOW()
      WHERE id = (
        SELECT id FROM sessions
        WHERE user_id = $1 AND is_active = true
        ORDER BY last_activity_at DESC
        LIMIT 1
      )
      RETURNING id
    `;

    const fallbackResult = await db.query(fallbackQuery, [userId]);
    return fallbackResult.rowCount;
  }
}

module.exports = Session;
