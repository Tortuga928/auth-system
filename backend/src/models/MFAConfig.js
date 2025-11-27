/**
 * MFAConfig Model
 *
 * Database operations for mfa_config table
 * Handles system-wide MFA configuration settings
 *
 * Features:
 * - Single configuration record (singleton pattern)
 * - All MFA mode and settings management
 * - Default values on first access
 */

const db = require('../db');

// Valid enum values
const MFA_MODES = ['disabled', 'totp_only', 'email_only', 'totp_email_required', 'totp_email_fallback'];
const LOCKOUT_BEHAVIORS = ['temporary_lockout', 'require_password', 'admin_intervention'];
const CODE_FORMATS = ['numeric_6', 'numeric_8', 'alphanumeric_6'];
const USER_CONTROL_MODES = ['user_managed', 'admin_controlled'];
const METHOD_CHANGE_BEHAVIORS = ['immediate', 'grace_period', 'grandfathered'];
const TEST_MODES = ['mandatory', 'optional', 'disabled'];
const LOGGING_LEVELS = ['comprehensive', 'security_only', 'none'];
const NOTIFICATION_LEVELS = ['security_events', 'all_changes', 'none'];

class MFAConfig {
  /**
   * Get the current MFA configuration
   * Creates default configuration if none exists
   *
   * @returns {Promise<Object>} MFA configuration object
   */
  static async get() {
    const query = `
      SELECT * FROM mfa_config
      ORDER BY id ASC
      LIMIT 1
    `;

    const result = await db.query(query);

    if (result.rows.length === 0) {
      // Create default configuration if none exists
      return this.createDefault();
    }

    return result.rows[0];
  }

  /**
   * Create default MFA configuration
   *
   * @returns {Promise<Object>} Created configuration
   */
  static async createDefault() {
    const query = `
      INSERT INTO mfa_config (mfa_mode)
      VALUES ('disabled')
      RETURNING *
    `;

    const result = await db.query(query);
    return result.rows[0];
  }

  /**
   * Update MFA configuration
   *
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated configuration
   */
  static async update(updates) {
    const allowedFields = [
      'mfa_mode',
      'code_expiration_minutes',
      'max_failed_attempts',
      'lockout_behavior',
      'lockout_duration_minutes',
      'resend_rate_limit',
      'resend_cooldown_seconds',
      'code_format',
      'fallback_totp_attempts_threshold',
      'backup_codes_enabled_totp',
      'backup_codes_enabled_email',
      'email_verification_required',
      'user_control_mode',
      'method_change_behavior',
      'grace_period_days',
      'role_based_mfa_enabled',
      'device_trust_enabled',
      'device_trust_duration_days',
      'max_trusted_devices',
      'test_mode',
      'logging_level',
      'notification_level',
    ];

    // Validate enum fields
    if (updates.mfa_mode && !MFA_MODES.includes(updates.mfa_mode)) {
      throw new Error(`Invalid mfa_mode. Must be one of: ${MFA_MODES.join(', ')}`);
    }
    if (updates.lockout_behavior && !LOCKOUT_BEHAVIORS.includes(updates.lockout_behavior)) {
      throw new Error(`Invalid lockout_behavior. Must be one of: ${LOCKOUT_BEHAVIORS.join(', ')}`);
    }
    if (updates.code_format && !CODE_FORMATS.includes(updates.code_format)) {
      throw new Error(`Invalid code_format. Must be one of: ${CODE_FORMATS.join(', ')}`);
    }
    if (updates.user_control_mode && !USER_CONTROL_MODES.includes(updates.user_control_mode)) {
      throw new Error(`Invalid user_control_mode. Must be one of: ${USER_CONTROL_MODES.join(', ')}`);
    }
    if (updates.method_change_behavior && !METHOD_CHANGE_BEHAVIORS.includes(updates.method_change_behavior)) {
      throw new Error(`Invalid method_change_behavior. Must be one of: ${METHOD_CHANGE_BEHAVIORS.join(', ')}`);
    }
    if (updates.test_mode && !TEST_MODES.includes(updates.test_mode)) {
      throw new Error(`Invalid test_mode. Must be one of: ${TEST_MODES.join(', ')}`);
    }
    if (updates.logging_level && !LOGGING_LEVELS.includes(updates.logging_level)) {
      throw new Error(`Invalid logging_level. Must be one of: ${LOGGING_LEVELS.join(', ')}`);
    }
    if (updates.notification_level && !NOTIFICATION_LEVELS.includes(updates.notification_level)) {
      throw new Error(`Invalid notification_level. Must be one of: ${NOTIFICATION_LEVELS.join(', ')}`);
    }

    const fields = [];
    const values = [];
    let paramCount = 1;

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
      UPDATE mfa_config
      SET ${fields.join(', ')}
      WHERE id = (SELECT id FROM mfa_config ORDER BY id ASC LIMIT 1)
      RETURNING *
    `;

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      // No config exists, create default then update
      await this.createDefault();
      return this.update(updates);
    }

    return result.rows[0];
  }

  /**
   * Reset configuration to defaults
   *
   * @returns {Promise<Object>} Reset configuration
   */
  static async reset() {
    const defaults = {
      mfa_mode: 'disabled',
      code_expiration_minutes: 5,
      max_failed_attempts: 5,
      lockout_behavior: 'temporary_lockout',
      lockout_duration_minutes: 15,
      resend_rate_limit: 3,
      resend_cooldown_seconds: 60,
      code_format: 'numeric_6',
      fallback_totp_attempts_threshold: 3,
      backup_codes_enabled_totp: true,
      backup_codes_enabled_email: false,
      email_verification_required: true,
      user_control_mode: 'user_managed',
      method_change_behavior: 'immediate',
      grace_period_days: 7,
      role_based_mfa_enabled: false,
      device_trust_enabled: false,
      device_trust_duration_days: 30,
      max_trusted_devices: 5,
      test_mode: 'optional',
      logging_level: 'comprehensive',
      notification_level: 'security_events',
    };

    return this.update(defaults);
  }

  /**
   * Check if MFA is enabled (any mode except disabled)
   *
   * @returns {Promise<boolean>} True if MFA is enabled
   */
  static async isEnabled() {
    const config = await this.get();
    return config.mfa_mode !== 'disabled';
  }

  /**
   * Check if a specific MFA method is available
   *
   * @param {string} method - 'totp' or 'email'
   * @returns {Promise<boolean>} True if method is available
   */
  static async isMethodAvailable(method) {
    const config = await this.get();

    switch (config.mfa_mode) {
      case 'disabled':
        return false;
      case 'totp_only':
        return method === 'totp';
      case 'email_only':
        return method === 'email';
      case 'totp_email_required':
      case 'totp_email_fallback':
        return method === 'totp' || method === 'email';
      default:
        return false;
    }
  }

  /**
   * Get available methods based on current mode
   *
   * @returns {Promise<string[]>} Array of available methods
   */
  static async getAvailableMethods() {
    const config = await this.get();

    switch (config.mfa_mode) {
      case 'disabled':
        return [];
      case 'totp_only':
        return ['totp'];
      case 'email_only':
        return ['email'];
      case 'totp_email_required':
      case 'totp_email_fallback':
        return ['totp', 'email'];
      default:
        return [];
    }
  }
}

// Export enum values for validation elsewhere
MFAConfig.MFA_MODES = MFA_MODES;
MFAConfig.LOCKOUT_BEHAVIORS = LOCKOUT_BEHAVIORS;
MFAConfig.CODE_FORMATS = CODE_FORMATS;
MFAConfig.USER_CONTROL_MODES = USER_CONTROL_MODES;
MFAConfig.METHOD_CHANGE_BEHAVIORS = METHOD_CHANGE_BEHAVIORS;
MFAConfig.TEST_MODES = TEST_MODES;
MFAConfig.LOGGING_LEVELS = LOGGING_LEVELS;
MFAConfig.NOTIFICATION_LEVELS = NOTIFICATION_LEVELS;

module.exports = MFAConfig;
