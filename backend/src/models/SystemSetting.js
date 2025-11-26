/**
 * SystemSetting Model
 *
 * Database operations for system_settings table
 * Stores application-wide configuration settings
 */

const db = require('../db');

// Setting category constants
const CATEGORIES = {
  GENERAL: 'general',
  EMAIL: 'email',
  SECURITY: 'security',
  FEATURES: 'features',
};

// Known setting keys
const SETTING_KEYS = {
  EMAIL_VERIFICATION_ENABLED: 'email_verification_enabled',
  EMAIL_VERIFICATION_ENFORCED: 'email_verification_enforced',
  EMAIL_VERIFICATION_GRACE_PERIOD_DAYS: 'email_verification_grace_period_days',
  ACTIVE_EMAIL_SERVICE_ID: 'active_email_service_id',
};

class SystemSetting {
  /**
   * Get a setting by key
   *
   * @param {string} key - Setting key
   * @returns {Promise<any>} Setting value (parsed from JSON)
   */
  static async get(key) {
    const query = `
      SELECT value FROM system_settings WHERE key = $1
    `;

    const result = await db.query(query, [key]);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0].value;
  }

  /**
   * Set a setting value
   *
   * @param {string} key - Setting key
   * @param {any} value - Setting value (will be JSON stringified)
   * @param {Object} options - Optional settings
   * @param {string} options.description - Setting description
   * @param {string} options.category - Setting category
   * @returns {Promise<Object>} Updated setting
   */
  static async set(key, value, options = {}) {
    const { description, category } = options;

    const query = `
      INSERT INTO system_settings (key, value, description, category, updated_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (key)
      DO UPDATE SET
        value = EXCLUDED.value,
        description = COALESCE(EXCLUDED.description, system_settings.description),
        category = COALESCE(EXCLUDED.category, system_settings.category),
        updated_at = NOW()
      RETURNING id, key, value, description, category, created_at, updated_at
    `;

    const values = [
      key,
      JSON.stringify(value),
      description || null,
      category || CATEGORIES.GENERAL,
    ];

    const result = await db.query(query, values);
    return result.rows[0];
  }

  /**
   * Get multiple settings by keys
   *
   * @param {Array<string>} keys - Array of setting keys
   * @returns {Promise<Object>} Object with key-value pairs
   */
  static async getMultiple(keys) {
    const query = `
      SELECT key, value FROM system_settings
      WHERE key = ANY($1)
    `;

    const result = await db.query(query, [keys]);

    const settings = {};
    for (const row of result.rows) {
      settings[row.key] = row.value;
    }

    return settings;
  }

  /**
   * Get all settings in a category
   *
   * @param {string} category - Category name
   * @returns {Promise<Array>} Array of settings
   */
  static async getByCategory(category) {
    const query = `
      SELECT id, key, value, description, category, created_at, updated_at
      FROM system_settings
      WHERE category = $1
      ORDER BY key
    `;

    const result = await db.query(query, [category]);
    return result.rows;
  }

  /**
   * Get all settings
   *
   * @returns {Promise<Array>} Array of all settings
   */
  static async getAll() {
    const query = `
      SELECT id, key, value, description, category, created_at, updated_at
      FROM system_settings
      ORDER BY category, key
    `;

    const result = await db.query(query);
    return result.rows;
  }

  /**
   * Delete a setting
   *
   * @param {string} key - Setting key
   * @returns {Promise<boolean>} True if deleted
   */
  static async delete(key) {
    const query = `
      DELETE FROM system_settings WHERE key = $1
      RETURNING id
    `;

    const result = await db.query(query, [key]);
    return result.rows.length > 0;
  }

  /**
   * Get email verification settings
   *
   * @returns {Promise<Object>} Email verification settings
   */
  static async getEmailVerificationSettings() {
    const keys = [
      SETTING_KEYS.EMAIL_VERIFICATION_ENABLED,
      SETTING_KEYS.EMAIL_VERIFICATION_ENFORCED,
      SETTING_KEYS.EMAIL_VERIFICATION_GRACE_PERIOD_DAYS,
      SETTING_KEYS.ACTIVE_EMAIL_SERVICE_ID,
    ];

    const settings = await this.getMultiple(keys);

    return {
      enabled: settings[SETTING_KEYS.EMAIL_VERIFICATION_ENABLED] ?? false,
      enforced: settings[SETTING_KEYS.EMAIL_VERIFICATION_ENFORCED] ?? false,
      gracePeriodDays: settings[SETTING_KEYS.EMAIL_VERIFICATION_GRACE_PERIOD_DAYS] ?? 0,
      activeEmailServiceId: settings[SETTING_KEYS.ACTIVE_EMAIL_SERVICE_ID] ?? null,
    };
  }

  /**
   * Update email verification settings
   *
   * @param {Object} settings - Settings to update
   * @param {boolean} settings.enabled - Whether email verification is enabled
   * @param {boolean} settings.enforced - Whether email verification is enforced
   * @param {number} settings.gracePeriodDays - Grace period in days
   * @returns {Promise<Object>} Updated settings
   */
  static async updateEmailVerificationSettings(settings) {
    const { enabled, enforced, gracePeriodDays } = settings;

    const updates = [];

    if (typeof enabled === 'boolean') {
      updates.push(this.set(SETTING_KEYS.EMAIL_VERIFICATION_ENABLED, enabled, {
        description: 'Whether email verification is enabled for new registrations',
        category: CATEGORIES.EMAIL,
      }));
    }

    if (typeof enforced === 'boolean') {
      updates.push(this.set(SETTING_KEYS.EMAIL_VERIFICATION_ENFORCED, enforced, {
        description: 'Whether email verification is enforced (blocks unverified users)',
        category: CATEGORIES.EMAIL,
      }));
    }

    if (typeof gracePeriodDays === 'number') {
      updates.push(this.set(SETTING_KEYS.EMAIL_VERIFICATION_GRACE_PERIOD_DAYS, gracePeriodDays, {
        description: 'Days before unverified users are blocked (0 = immediate)',
        category: CATEGORIES.EMAIL,
      }));
    }

    await Promise.all(updates);

    return this.getEmailVerificationSettings();
  }

  /**
   * Set active email service ID
   *
   * @param {number|null} serviceId - Email service ID or null to disable
   * @returns {Promise<Object>} Updated setting
   */
  static async setActiveEmailService(serviceId) {
    return this.set(SETTING_KEYS.ACTIVE_EMAIL_SERVICE_ID, serviceId, {
      description: 'ID of the currently active email service configuration',
      category: CATEGORIES.EMAIL,
    });
  }
}

// Export class and constants
module.exports = SystemSetting;
module.exports.CATEGORIES = CATEGORIES;
module.exports.SETTING_KEYS = SETTING_KEYS;
