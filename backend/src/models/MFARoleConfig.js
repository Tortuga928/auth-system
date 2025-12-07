/**
 * MFARoleConfig Model
 *
 * Database operations for mfa_role_config table
 * Handles role-specific MFA configuration settings
 *
 * Features:
 * - Per-role MFA requirements
 * - Allowed methods configuration
 * - Role-specific setting overrides
 */

const db = require('../db');

// Valid roles
const VALID_ROLES = ['user', 'admin', 'super_admin'];

// Valid MFA methods
const VALID_METHODS = ['totp', 'email'];

class MFARoleConfig {
  /**
   * Get MFA configuration for a specific role
   *
   * @param {string} role - Role name (user, admin, super_admin)
   * @returns {Promise<Object|null>} Role configuration or null
   */
  static async getByRole(role) {
    if (!VALID_ROLES.includes(role)) {
      throw new Error(`Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`);
    }

    const query = `
      SELECT * FROM mfa_role_config
      WHERE role = $1
    `;

    const result = await db.query(query, [role]);

    if (result.rows.length === 0) {
      return null;
    }

    // Parse allowed_methods if it's a string
    const config = result.rows[0];
    if (typeof config.allowed_methods === 'string') {
      config.allowed_methods = JSON.parse(config.allowed_methods);
    }

    return config;
  }

  /**
   * Get all role configurations
   *
   * @returns {Promise<Object[]>} Array of role configurations
   */
  static async getAll() {
    const query = `
      SELECT * FROM mfa_role_config
      ORDER BY
        CASE role
          WHEN 'user' THEN 1
          WHEN 'admin' THEN 2
          WHEN 'super_admin' THEN 3
        END
    `;

    const result = await db.query(query);

    // Parse allowed_methods for each config
    return result.rows.map(config => {
      if (typeof config.allowed_methods === 'string') {
        config.allowed_methods = JSON.parse(config.allowed_methods);
      }
      return config;
    });
  }

  /**
   * Update MFA configuration for a role
   *
   * @param {string} role - Role name
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated configuration
   */
  static async update(role, updates) {
    if (!VALID_ROLES.includes(role)) {
      throw new Error(`Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`);
    }

    const allowedFields = [
      'mfa_required',
      'allowed_methods',
      'code_expiration_minutes',
      'max_failed_attempts',
      'lockout_behavior',
      'lockout_duration_minutes',
      // MFA Enforcement field
      'exempt_from_mfa',
    ];

    // Validate allowed_methods if provided
    if (updates.allowed_methods) {
      if (!Array.isArray(updates.allowed_methods)) {
        throw new Error('allowed_methods must be an array');
      }

      for (const method of updates.allowed_methods) {
        if (!VALID_METHODS.includes(method)) {
          throw new Error(`Invalid method: ${method}. Must be one of: ${VALID_METHODS.join(', ')}`);
        }
      }

      // Ensure at least one method is allowed if MFA is required
      if (updates.mfa_required && updates.allowed_methods.length === 0) {
        throw new Error('At least one MFA method must be allowed when MFA is required');
      }

      // Convert to JSON string for storage
      updates.allowed_methods = JSON.stringify(updates.allowed_methods);
    }

    const fields = [];
    const values = [role];
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
      UPDATE mfa_role_config
      SET ${fields.join(', ')}
      WHERE role = $1
      RETURNING *
    `;

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      throw new Error(`Role configuration not found: ${role}`);
    }

    // Parse allowed_methods in response
    const config = result.rows[0];
    if (typeof config.allowed_methods === 'string') {
      config.allowed_methods = JSON.parse(config.allowed_methods);
    }

    return config;
  }

  /**
   * Check if MFA is required for a role
   *
   * @param {string} role - Role name
   * @returns {Promise<boolean>} True if MFA is required
   */
  static async isMFARequired(role) {
    const config = await this.getByRole(role);
    return config ? config.mfa_required : false;
  }

  /**
   * Get allowed MFA methods for a role
   *
   * @param {string} role - Role name
   * @returns {Promise<string[]>} Array of allowed methods
   */
  static async getAllowedMethods(role) {
    const config = await this.getByRole(role);
    return config ? config.allowed_methods : ['totp', 'email'];
  }

  /**
   * Check if a specific method is allowed for a role
   *
   * @param {string} role - Role name
   * @param {string} method - Method to check (totp, email)
   * @returns {Promise<boolean>} True if method is allowed
   */
  static async isMethodAllowed(role, method) {
    const allowedMethods = await this.getAllowedMethods(role);
    return allowedMethods.includes(method);
  }

  /**
   * Get effective settings for a role (merging with system defaults)
   *
   * @param {string} role - Role name
   * @param {Object} systemConfig - System MFA configuration
   * @returns {Promise<Object>} Effective settings for the role
   */
  static async getEffectiveSettings(role, systemConfig) {
    const roleConfig = await this.getByRole(role);

    if (!roleConfig) {
      return systemConfig;
    }

    // Role-specific settings override system settings if not null
    return {
      ...systemConfig,
      mfa_required: roleConfig.mfa_required,
      allowed_methods: roleConfig.allowed_methods,
      code_expiration_minutes: roleConfig.code_expiration_minutes ?? systemConfig.code_expiration_minutes,
      max_failed_attempts: roleConfig.max_failed_attempts ?? systemConfig.max_failed_attempts,
      lockout_behavior: roleConfig.lockout_behavior ?? systemConfig.lockout_behavior,
      lockout_duration_minutes: roleConfig.lockout_duration_minutes ?? systemConfig.lockout_duration_minutes,
    };
  }

  /**
   * Reset role configuration to defaults
   *
   * @param {string} role - Role name
   * @returns {Promise<Object>} Reset configuration
   */
  static async reset(role) {
    return this.update(role, {
      mfa_required: false,
      allowed_methods: ['totp', 'email'],
      code_expiration_minutes: null,
      max_failed_attempts: null,
      lockout_behavior: null,
      lockout_duration_minutes: null,
    });
  }

  /**
   * Reset all role configurations to defaults
   *
   * @returns {Promise<Object[]>} Reset configurations
   */
  static async resetAll() {
    const results = [];
    for (const role of VALID_ROLES) {
      const config = await this.reset(role);
      results.push(config);
    }
    return results;
  }
}

// Export constants
MFARoleConfig.VALID_ROLES = VALID_ROLES;
MFARoleConfig.VALID_METHODS = VALID_METHODS;

module.exports = MFARoleConfig;
