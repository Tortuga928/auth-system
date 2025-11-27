/**
 * UserMFAPreferences Model
 *
 * Database operations for user_mfa_preferences table
 * Handles user-specific MFA settings and alternate email
 *
 * Features:
 * - Preferred MFA method selection
 * - Email 2FA enable/disable
 * - Alternate email management with verification
 * - Method change transition tracking
 */

const db = require('../db');
const crypto = require('crypto');

class UserMFAPreferences {
  /**
   * Get MFA preferences for a user
   * Creates default preferences if none exist
   *
   * @param {number} userId - User ID
   * @returns {Promise<Object>} User MFA preferences
   */
  static async getByUserId(userId) {
    const query = `
      SELECT * FROM user_mfa_preferences
      WHERE user_id = $1
    `;

    const result = await db.query(query, [userId]);

    if (result.rows.length === 0) {
      // Create default preferences
      return this.create(userId);
    }

    return result.rows[0];
  }

  /**
   * Create default MFA preferences for a user
   *
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Created preferences
   */
  static async create(userId) {
    const query = `
      INSERT INTO user_mfa_preferences (user_id)
      VALUES ($1)
      ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW()
      RETURNING *
    `;

    const result = await db.query(query, [userId]);
    return result.rows[0];
  }

  /**
   * Update MFA preferences for a user
   *
   * @param {number} userId - User ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated preferences
   */
  static async update(userId, updates) {
    const allowedFields = [
      'preferred_method',
      'email_2fa_enabled',
      'email_2fa_enabled_at',
      'alternate_email',
      'alternate_email_verified',
      'alternate_email_verification_token',
      'alternate_email_verification_expires',
      'pending_method_change',
      'method_change_deadline',
      'grandfathered',
    ];

    const fields = [];
    const values = [userId];
    let paramCount = 2;

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

    const query = `
      UPDATE user_mfa_preferences
      SET ${fields.join(', ')}
      WHERE user_id = $1
      RETURNING *
    `;

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      // Preferences don't exist, create then update
      await this.create(userId);
      return this.update(userId, updates);
    }

    return result.rows[0];
  }

  /**
   * Enable Email 2FA for a user
   *
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Updated preferences
   */
  static async enableEmail2FA(userId) {
    return this.update(userId, {
      email_2fa_enabled: true,
      email_2fa_enabled_at: new Date(),
    });
  }

  /**
   * Disable Email 2FA for a user
   *
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Updated preferences
   */
  static async disableEmail2FA(userId) {
    return this.update(userId, {
      email_2fa_enabled: false,
      email_2fa_enabled_at: null,
    });
  }

  /**
   * Set preferred MFA method
   *
   * @param {number} userId - User ID
   * @param {string} method - Preferred method (totp, email)
   * @returns {Promise<Object>} Updated preferences
   */
  static async setPreferredMethod(userId, method) {
    if (method !== 'totp' && method !== 'email' && method !== null) {
      throw new Error('Invalid method. Must be totp, email, or null');
    }

    return this.update(userId, { preferred_method: method });
  }

  /**
   * Set alternate email and generate verification token
   *
   * @param {number} userId - User ID
   * @param {string} email - Alternate email address
   * @returns {Promise<Object>} Result with verification token
   */
  static async setAlternateEmail(userId, email) {
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const preferences = await this.update(userId, {
      alternate_email: email,
      alternate_email_verified: false,
      alternate_email_verification_token: token,
      alternate_email_verification_expires: expires,
    });

    return { preferences, verificationToken: token };
  }

  /**
   * Verify alternate email with token
   *
   * @param {string} token - Verification token
   * @returns {Promise<Object|null>} Updated preferences or null if invalid
   */
  static async verifyAlternateEmail(token) {
    const query = `
      SELECT user_id FROM user_mfa_preferences
      WHERE alternate_email_verification_token = $1
        AND alternate_email_verification_expires > NOW()
    `;

    const result = await db.query(query, [token]);

    if (result.rows.length === 0) {
      return null;
    }

    const userId = result.rows[0].user_id;

    return this.update(userId, {
      alternate_email_verified: true,
      alternate_email_verification_token: null,
      alternate_email_verification_expires: null,
    });
  }

  /**
   * Remove alternate email
   *
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Updated preferences
   */
  static async removeAlternateEmail(userId) {
    return this.update(userId, {
      alternate_email: null,
      alternate_email_verified: false,
      alternate_email_verification_token: null,
      alternate_email_verification_expires: null,
    });
  }

  /**
   * Get the email to use for 2FA (alternate if verified, otherwise primary)
   *
   * @param {number} userId - User ID
   * @param {string} primaryEmail - User's primary email
   * @returns {Promise<string>} Email to use for 2FA
   */
  static async get2FAEmail(userId, primaryEmail) {
    const prefs = await this.getByUserId(userId);

    if (prefs.alternate_email && prefs.alternate_email_verified) {
      return prefs.alternate_email;
    }

    return primaryEmail;
  }

  /**
   * Set pending method change (for grace period transitions)
   *
   * @param {number} userId - User ID
   * @param {string} pendingMethod - Method user needs to set up
   * @param {number} graceDays - Days until deadline
   * @returns {Promise<Object>} Updated preferences
   */
  static async setPendingMethodChange(userId, pendingMethod, graceDays) {
    const deadline = new Date(Date.now() + graceDays * 24 * 60 * 60 * 1000);

    return this.update(userId, {
      pending_method_change: pendingMethod,
      method_change_deadline: deadline,
    });
  }

  /**
   * Clear pending method change
   *
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Updated preferences
   */
  static async clearPendingMethodChange(userId) {
    return this.update(userId, {
      pending_method_change: null,
      method_change_deadline: null,
    });
  }

  /**
   * Mark user as grandfathered (exempt from new MFA requirements)
   *
   * @param {number} userId - User ID
   * @param {boolean} grandfathered - Whether to grandfather the user
   * @returns {Promise<Object>} Updated preferences
   */
  static async setGrandfathered(userId, grandfathered) {
    return this.update(userId, { grandfathered });
  }

  /**
   * Check if user has pending method change past deadline
   *
   * @param {number} userId - User ID
   * @returns {Promise<Object|null>} Pending change info or null
   */
  static async getPendingChangeStatus(userId) {
    const prefs = await this.getByUserId(userId);

    if (!prefs.pending_method_change) {
      return null;
    }

    const isPastDeadline = prefs.method_change_deadline && new Date(prefs.method_change_deadline) < new Date();

    return {
      pendingMethod: prefs.pending_method_change,
      deadline: prefs.method_change_deadline,
      isPastDeadline,
      isGrandfathered: prefs.grandfathered,
    };
  }

  /**
   * Get users with pending method changes (for admin view)
   *
   * @returns {Promise<Object[]>} Users with pending changes
   */
  static async getUsersWithPendingChanges() {
    const query = `
      SELECT ump.*, u.email, u.username
      FROM user_mfa_preferences ump
      JOIN users u ON u.id = ump.user_id
      WHERE ump.pending_method_change IS NOT NULL
      ORDER BY ump.method_change_deadline ASC
    `;

    const result = await db.query(query);
    return result.rows;
  }

  /**
   * Delete preferences for a user
   *
   * @param {number} userId - User ID
   * @returns {Promise<boolean>} True if deleted
   */
  static async delete(userId) {
    const query = `
      DELETE FROM user_mfa_preferences
      WHERE user_id = $1
      RETURNING id
    `;

    const result = await db.query(query, [userId]);
    return result.rowCount > 0;
  }
}

module.exports = UserMFAPreferences;
