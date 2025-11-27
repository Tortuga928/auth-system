/**
 * Email2FACode Model
 *
 * Database operations for email_2fa_codes table
 * Handles temporary email 2FA verification codes
 *
 * Features:
 * - Code generation (numeric and alphanumeric)
 * - Code hashing for secure storage
 * - Expiration management
 * - Attempt tracking and lockout
 * - Resend rate limiting
 */

const db = require('../db');
const crypto = require('crypto');

class Email2FACode {
  /**
   * Generate a random code based on format
   *
   * @param {string} format - Code format (numeric_6, numeric_8, alphanumeric_6)
   * @returns {string} Generated code
   */
  static generateCode(format = 'numeric_6') {
    switch (format) {
      case 'numeric_6':
        return Math.floor(100000 + Math.random() * 900000).toString();

      case 'numeric_8':
        return Math.floor(10000000 + Math.random() * 90000000).toString();

      case 'alphanumeric_6':
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding similar chars (0, O, 1, I)
        let code = '';
        for (let i = 0; i < 6; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;

      default:
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
  }

  /**
   * Hash a code for secure storage
   *
   * @param {string} code - Plain text code
   * @returns {string} Hashed code
   */
  static hashCode(code) {
    return crypto.createHash('sha256').update(code.toUpperCase()).digest('hex');
  }

  /**
   * Create a new email 2FA code for a user
   * Invalidates any existing unused codes for the user
   *
   * @param {number} userId - User ID
   * @param {string} code - Plain text code
   * @param {number} expirationMinutes - Minutes until expiration
   * @returns {Promise<Object>} Created code record (without hash)
   */
  static async create(userId, code, expirationMinutes = 5) {
    const codeHash = this.hashCode(code);
    const expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000);

    // Invalidate existing unused codes for this user
    await this.invalidateUserCodes(userId);

    const query = `
      INSERT INTO email_2fa_codes (user_id, code_hash, expires_at)
      VALUES ($1, $2, $3)
      RETURNING id, user_id, expires_at, attempts, resend_count, used, created_at
    `;

    const result = await db.query(query, [userId, codeHash, expiresAt]);
    return result.rows[0];
  }

  /**
   * Verify a code for a user
   *
   * @param {number} userId - User ID
   * @param {string} code - Code to verify
   * @returns {Promise<Object>} Verification result { valid, reason, codeRecord }
   */
  static async verify(userId, code) {
    const codeHash = this.hashCode(code);

    // Get the most recent unused code for the user
    const query = `
      SELECT * FROM email_2fa_codes
      WHERE user_id = $1 AND used = false
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const result = await db.query(query, [userId]);

    if (result.rows.length === 0) {
      return { valid: false, reason: 'no_code', codeRecord: null };
    }

    const codeRecord = result.rows[0];

    // Check if locked
    if (codeRecord.locked_until && new Date(codeRecord.locked_until) > new Date()) {
      return {
        valid: false,
        reason: 'locked',
        codeRecord,
        lockExpires: codeRecord.locked_until,
      };
    }

    // Check if expired
    if (new Date(codeRecord.expires_at) < new Date()) {
      return { valid: false, reason: 'expired', codeRecord };
    }

    // Check if code matches
    if (codeRecord.code_hash !== codeHash) {
      // Increment attempts
      await this.incrementAttempts(codeRecord.id);
      return { valid: false, reason: 'invalid_code', codeRecord };
    }

    // Code is valid - mark as used
    await this.markAsUsed(codeRecord.id);

    return { valid: true, reason: 'success', codeRecord };
  }

  /**
   * Increment failed attempts for a code
   *
   * @param {number} codeId - Code ID
   * @param {number} maxAttempts - Max attempts before lockout (from config)
   * @param {number} lockoutMinutes - Lockout duration in minutes (from config)
   * @returns {Promise<Object>} Updated code record
   */
  static async incrementAttempts(codeId, maxAttempts = 5, lockoutMinutes = 15) {
    const query = `
      UPDATE email_2fa_codes
      SET
        attempts = attempts + 1,
        locked_until = CASE
          WHEN attempts + 1 >= $2 THEN NOW() + INTERVAL '1 minute' * $3
          ELSE locked_until
        END
      WHERE id = $1
      RETURNING *
    `;

    const result = await db.query(query, [codeId, maxAttempts, lockoutMinutes]);
    return result.rows[0];
  }

  /**
   * Mark a code as used
   *
   * @param {number} codeId - Code ID
   * @returns {Promise<Object>} Updated code record
   */
  static async markAsUsed(codeId) {
    const query = `
      UPDATE email_2fa_codes
      SET used = true
      WHERE id = $1
      RETURNING *
    `;

    const result = await db.query(query, [codeId]);
    return result.rows[0];
  }

  /**
   * Invalidate all unused codes for a user
   *
   * @param {number} userId - User ID
   * @returns {Promise<number>} Number of codes invalidated
   */
  static async invalidateUserCodes(userId) {
    const query = `
      UPDATE email_2fa_codes
      SET used = true
      WHERE user_id = $1 AND used = false
      RETURNING id
    `;

    const result = await db.query(query, [userId]);
    return result.rowCount;
  }

  /**
   * Check if user can request a resend
   *
   * @param {number} userId - User ID
   * @param {number} rateLimit - Max resends allowed
   * @param {number} cooldownSeconds - Seconds between resends
   * @returns {Promise<Object>} { canResend, reason, waitSeconds }
   */
  static async canResend(userId, rateLimit = 3, cooldownSeconds = 60) {
    const query = `
      SELECT * FROM email_2fa_codes
      WHERE user_id = $1 AND used = false
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const result = await db.query(query, [userId]);

    if (result.rows.length === 0) {
      return { canResend: true, reason: 'no_active_code' };
    }

    const codeRecord = result.rows[0];

    // Check rate limit
    if (codeRecord.resend_count >= rateLimit) {
      return { canResend: false, reason: 'rate_limit_exceeded' };
    }

    // Check cooldown
    if (codeRecord.last_resend_at) {
      const lastResend = new Date(codeRecord.last_resend_at);
      const cooldownExpires = new Date(lastResend.getTime() + cooldownSeconds * 1000);
      const now = new Date();

      if (now < cooldownExpires) {
        const waitSeconds = Math.ceil((cooldownExpires - now) / 1000);
        return { canResend: false, reason: 'cooldown', waitSeconds };
      }
    }

    return { canResend: true, reason: 'allowed' };
  }

  /**
   * Record a resend for a code
   *
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Updated code record
   */
  static async recordResend(userId) {
    const query = `
      UPDATE email_2fa_codes
      SET
        resend_count = resend_count + 1,
        last_resend_at = NOW()
      WHERE user_id = $1 AND used = false
      RETURNING *
    `;

    const result = await db.query(query, [userId]);
    return result.rows[0];
  }

  /**
   * Get the current active code for a user (for admin/debugging)
   *
   * @param {number} userId - User ID
   * @returns {Promise<Object|null>} Active code record (without hash) or null
   */
  static async getActiveCode(userId) {
    const query = `
      SELECT id, user_id, expires_at, attempts, locked_until, resend_count, last_resend_at, used, created_at
      FROM email_2fa_codes
      WHERE user_id = $1 AND used = false AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const result = await db.query(query, [userId]);
    return result.rows[0] || null;
  }

  /**
   * Unlock a code (reset attempts and clear lockout)
   *
   * @param {number} userId - User ID
   * @returns {Promise<Object|null>} Updated code record or null
   */
  static async unlock(userId) {
    const query = `
      UPDATE email_2fa_codes
      SET attempts = 0, locked_until = NULL
      WHERE user_id = $1 AND used = false
      RETURNING *
    `;

    const result = await db.query(query, [userId]);
    return result.rows[0] || null;
  }

  /**
   * Clean up expired codes (maintenance task)
   *
   * @param {number} olderThanHours - Delete codes older than this many hours
   * @returns {Promise<number>} Number of codes deleted
   */
  static async cleanup(olderThanHours = 24) {
    const query = `
      DELETE FROM email_2fa_codes
      WHERE expires_at < NOW() - INTERVAL '1 hour' * $1
      RETURNING id
    `;

    const result = await db.query(query, [olderThanHours]);
    return result.rowCount;
  }
}

module.exports = Email2FACode;
