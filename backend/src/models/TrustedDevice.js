/**
 * TrustedDevice Model
 *
 * Database operations for trusted_devices table
 * Handles "Remember this device" functionality for MFA bypass
 *
 * Features:
 * - Device registration and trust management
 * - Device fingerprinting
 * - Trust period management
 * - Device limit enforcement
 */

const db = require('../db');
const crypto = require('crypto');

class TrustedDevice {
  /**
   * Generate a device fingerprint from request data
   *
   * @param {Object} deviceInfo - Device information
   * @param {string} deviceInfo.userAgent - User agent string
   * @param {string} deviceInfo.ipAddress - IP address
   * @param {string} deviceInfo.acceptLanguage - Accept-Language header
   * @returns {string} Device fingerprint hash
   */
  static generateFingerprint(deviceInfo) {
    const data = [
      deviceInfo.userAgent || '',
      deviceInfo.acceptLanguage || '',
      // Note: IP is not included as it changes frequently
    ].join('|');

    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Parse user agent to extract device info
   *
   * @param {string} userAgent - User agent string
   * @returns {Object} Parsed device info
   */
  static parseUserAgent(userAgent) {
    // Basic user agent parsing (could be enhanced with a library like ua-parser-js)
    const result = {
      browser: 'Unknown',
      browser_version: null,
      os: 'Unknown',
      os_version: null,
      device_type: 'desktop',
    };

    if (!userAgent) return result;

    // Detect browser
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
      result.browser = 'Chrome';
      const match = userAgent.match(/Chrome\/([\d.]+)/);
      if (match) result.browser_version = match[1];
    } else if (userAgent.includes('Firefox')) {
      result.browser = 'Firefox';
      const match = userAgent.match(/Firefox\/([\d.]+)/);
      if (match) result.browser_version = match[1];
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      result.browser = 'Safari';
      const match = userAgent.match(/Version\/([\d.]+)/);
      if (match) result.browser_version = match[1];
    } else if (userAgent.includes('Edg')) {
      result.browser = 'Edge';
      const match = userAgent.match(/Edg\/([\d.]+)/);
      if (match) result.browser_version = match[1];
    }

    // Detect OS
    if (userAgent.includes('Windows')) {
      result.os = 'Windows';
      if (userAgent.includes('Windows NT 10')) result.os_version = '10';
      else if (userAgent.includes('Windows NT 11')) result.os_version = '11';
    } else if (userAgent.includes('Mac OS X')) {
      result.os = 'macOS';
      const match = userAgent.match(/Mac OS X ([\d_]+)/);
      if (match) result.os_version = match[1].replace(/_/g, '.');
    } else if (userAgent.includes('Linux')) {
      result.os = 'Linux';
    } else if (userAgent.includes('Android')) {
      result.os = 'Android';
      const match = userAgent.match(/Android ([\d.]+)/);
      if (match) result.os_version = match[1];
    } else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) {
      result.os = 'iOS';
      const match = userAgent.match(/OS ([\d_]+)/);
      if (match) result.os_version = match[1].replace(/_/g, '.');
    }

    // Detect device type
    if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
      result.device_type = 'mobile';
    } else if (userAgent.includes('iPad') || userAgent.includes('Tablet')) {
      result.device_type = 'tablet';
    }

    return result;
  }

  /**
   * Create or update a trusted device
   *
   * @param {number} userId - User ID
   * @param {Object} deviceInfo - Device information
   * @param {number} trustDurationDays - Days until trust expires
   * @returns {Promise<Object>} Created/updated trusted device
   */
  static async trust(userId, deviceInfo, trustDurationDays = 30) {
    const fingerprint = this.generateFingerprint(deviceInfo);
    const parsedUA = this.parseUserAgent(deviceInfo.userAgent);
    const trustedUntil = new Date(Date.now() + trustDurationDays * 24 * 60 * 60 * 1000);

    // Generate a friendly device name
    const deviceName = `${parsedUA.browser} on ${parsedUA.os}`;

    // Use upsert to handle existing devices
    const query = `
      INSERT INTO trusted_devices (
        user_id, device_fingerprint, device_name,
        browser, browser_version, os, os_version, device_type,
        ip_address, location, trusted_until, last_used_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      ON CONFLICT (user_id, device_fingerprint)
      DO UPDATE SET
        device_name = EXCLUDED.device_name,
        browser = EXCLUDED.browser,
        browser_version = EXCLUDED.browser_version,
        os = EXCLUDED.os,
        os_version = EXCLUDED.os_version,
        device_type = EXCLUDED.device_type,
        ip_address = EXCLUDED.ip_address,
        location = EXCLUDED.location,
        trusted_until = EXCLUDED.trusted_until,
        last_used_at = NOW(),
        updated_at = NOW()
      RETURNING *
    `;

    const values = [
      userId,
      fingerprint,
      deviceName,
      parsedUA.browser,
      parsedUA.browser_version,
      parsedUA.os,
      parsedUA.os_version,
      parsedUA.device_type,
      deviceInfo.ipAddress,
      deviceInfo.location || null,
      trustedUntil,
    ];

    const result = await db.query(query, values);
    return result.rows[0];
  }

  /**
   * Check if a device is trusted for a user
   *
   * @param {number} userId - User ID
   * @param {Object} deviceInfo - Device information
   * @returns {Promise<boolean>} True if device is trusted
   */
  static async isTrusted(userId, deviceInfo) {
    const fingerprint = this.generateFingerprint(deviceInfo);

    const query = `
      SELECT id FROM trusted_devices
      WHERE user_id = $1
        AND device_fingerprint = $2
        AND trusted_until > NOW()
    `;

    const result = await db.query(query, [userId, fingerprint]);

    if (result.rows.length > 0) {
      // Update last_used_at
      await this.updateLastUsed(result.rows[0].id);
      return true;
    }

    return false;
  }

  /**
   * Update last used timestamp for a device
   *
   * @param {number} deviceId - Device ID
   * @returns {Promise<void>}
   */
  static async updateLastUsed(deviceId) {
    const query = `
      UPDATE trusted_devices
      SET last_used_at = NOW(), updated_at = NOW()
      WHERE id = $1
    `;

    await db.query(query, [deviceId]);
  }

  /**
   * Get all trusted devices for a user
   *
   * @param {number} userId - User ID
   * @returns {Promise<Object[]>} Array of trusted devices
   */
  static async getByUserId(userId) {
    const query = `
      SELECT id, device_name, browser, browser_version, os, os_version,
             device_type, ip_address, location, trusted_until, last_used_at, created_at
      FROM trusted_devices
      WHERE user_id = $1
      ORDER BY last_used_at DESC NULLS LAST
    `;

    const result = await db.query(query, [userId]);
    return result.rows;
  }

  /**
   * Get trusted device count for a user
   *
   * @param {number} userId - User ID
   * @returns {Promise<number>} Number of trusted devices
   */
  static async countByUserId(userId) {
    const query = `
      SELECT COUNT(*) as count
      FROM trusted_devices
      WHERE user_id = $1 AND trusted_until > NOW()
    `;

    const result = await db.query(query, [userId]);
    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Remove a trusted device
   *
   * @param {number} userId - User ID
   * @param {number} deviceId - Device ID
   * @returns {Promise<boolean>} True if device was removed
   */
  static async remove(userId, deviceId) {
    const query = `
      DELETE FROM trusted_devices
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `;

    const result = await db.query(query, [deviceId, userId]);
    return result.rowCount > 0;
  }

  /**
   * Remove all trusted devices for a user
   *
   * @param {number} userId - User ID
   * @returns {Promise<number>} Number of devices removed
   */
  static async removeAll(userId) {
    const query = `
      DELETE FROM trusted_devices
      WHERE user_id = $1
      RETURNING id
    `;

    const result = await db.query(query, [userId]);
    return result.rowCount;
  }

  /**
   * Enforce device limit for a user (remove oldest if over limit)
   *
   * @param {number} userId - User ID
   * @param {number} maxDevices - Maximum allowed devices
   * @returns {Promise<number>} Number of devices removed
   */
  static async enforceLimit(userId, maxDevices = 5) {
    // Get count of devices
    const count = await this.countByUserId(userId);

    if (count <= maxDevices) {
      return 0;
    }

    // Remove oldest devices over the limit
    const toRemove = count - maxDevices;

    const query = `
      DELETE FROM trusted_devices
      WHERE id IN (
        SELECT id FROM trusted_devices
        WHERE user_id = $1
        ORDER BY last_used_at ASC NULLS FIRST
        LIMIT $2
      )
      RETURNING id
    `;

    const result = await db.query(query, [userId, toRemove]);
    return result.rowCount;
  }

  /**
   * Clean up expired trusted devices (maintenance task)
   *
   * @returns {Promise<number>} Number of devices removed
   */
  static async cleanup() {
    const query = `
      DELETE FROM trusted_devices
      WHERE trusted_until < NOW()
      RETURNING id
    `;

    const result = await db.query(query);
    return result.rowCount;
  }
}

module.exports = TrustedDevice;
