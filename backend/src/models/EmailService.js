/**
 * EmailService Model
 *
 * Database operations for email_services table
 * Stores email service provider configurations with encrypted credentials
 */

const db = require('../db');
const { encrypt, decrypt, redactCredentials } = require('../services/encryptionService');

// Provider type constants
const PROVIDER_TYPES = {
  SENDGRID: 'sendgrid',
  SES: 'ses',
  SMTP: 'smtp',
};

// Test status constants
const TEST_STATUS = {
  SUCCESS: 'success',
  FAILED: 'failed',
  NEVER_TESTED: 'never_tested',
};

// Required fields per provider type
const PROVIDER_CONFIG_FIELDS = {
  [PROVIDER_TYPES.SENDGRID]: {
    config: ['from_email', 'from_name'],
    credentials: ['api_key'],
  },
  [PROVIDER_TYPES.SES]: {
    config: ['region', 'from_email', 'from_name'],
    credentials: ['access_key_id', 'secret_access_key'],
  },
  [PROVIDER_TYPES.SMTP]: {
    config: ['host', 'port', 'security', 'from_email', 'from_name'],
    credentials: ['username', 'password'],
  },
};

// AWS SES regions
const SES_REGIONS = [
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'eu-central-1',
  'ap-south-1',
  'ap-northeast-1',
  'ap-northeast-2',
  'ap-southeast-1',
  'ap-southeast-2',
  'ca-central-1',
  'sa-east-1',
];

// SMTP security options
const SMTP_SECURITY_OPTIONS = ['none', 'ssl', 'tls', 'starttls'];

class EmailService {
  /**
   * Create a new email service configuration
   *
   * @param {Object} data - Service data
   * @param {string} data.name - Display name
   * @param {string} data.provider_type - Provider type (sendgrid, ses, smtp)
   * @param {Object} data.config - Non-sensitive configuration
   * @param {Object} data.credentials - Sensitive credentials (will be encrypted)
   * @param {number} data.created_by - Admin user ID
   * @returns {Promise<Object>} Created service (credentials redacted)
   */
  static async create(data) {
    const {
      name,
      provider_type,
      config,
      credentials,
      created_by,
    } = data;

    // Validate provider type
    if (!Object.values(PROVIDER_TYPES).includes(provider_type)) {
      throw new Error(`Invalid provider type: ${provider_type}`);
    }

    // Validate required fields
    this.validateProviderFields(provider_type, config, credentials);

    // Encrypt credentials
    const encryptedCredentials = encrypt(credentials);

    const query = `
      INSERT INTO email_services (
        name, provider_type, config, credentials_encrypted,
        is_active, is_enabled, last_test_status, created_by, updated_by
      )
      VALUES ($1, $2, $3, $4, false, true, 'never_tested', $5, $5)
      RETURNING id, name, provider_type, config, is_active, is_enabled,
                last_test_status, last_test_at, last_test_error,
                created_by, updated_by, created_at, updated_at
    `;

    const values = [name, provider_type, JSON.stringify(config), encryptedCredentials, created_by];
    const result = await db.query(query, values);

    // Return with redacted credentials
    return {
      ...result.rows[0],
      credentials: redactCredentials(credentials),
    };
  }

  /**
   * Find email service by ID
   *
   * @param {number} id - Service ID
   * @param {boolean} includeCredentials - Whether to decrypt and include credentials
   * @returns {Promise<Object|null>} Service or null
   */
  static async findById(id, includeCredentials = false) {
    const query = `
      SELECT id, name, provider_type, config, credentials_encrypted,
             is_active, is_enabled, last_test_status, last_test_at, last_test_error,
             created_by, updated_by, created_at, updated_at
      FROM email_services
      WHERE id = $1
    `;

    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    const service = result.rows[0];

    // Decrypt credentials if requested
    if (includeCredentials) {
      service.credentials = decrypt(service.credentials_encrypted);
    } else {
      // Return redacted credentials
      const decrypted = decrypt(service.credentials_encrypted);
      service.credentials = redactCredentials(decrypted);
    }

    // Remove encrypted field from response
    delete service.credentials_encrypted;

    return service;
  }

  /**
   * Find all email services
   *
   * @param {Object} options - Query options
   * @param {boolean} options.enabledOnly - Only return enabled services
   * @returns {Promise<Array>} Array of services (credentials redacted)
   */
  static async findAll(options = {}) {
    const { enabledOnly = false } = options;

    let query = `
      SELECT id, name, provider_type, config, credentials_encrypted,
             is_active, is_enabled, last_test_status, last_test_at, last_test_error,
             created_by, updated_by, created_at, updated_at
      FROM email_services
    `;

    if (enabledOnly) {
      query += ' WHERE is_enabled = true';
    }

    query += ' ORDER BY is_active DESC, name ASC';

    const result = await db.query(query);

    // Redact credentials for all services
    return result.rows.map(service => {
      const decrypted = decrypt(service.credentials_encrypted);
      return {
        ...service,
        credentials: redactCredentials(decrypted),
        credentials_encrypted: undefined,
      };
    });
  }

  /**
   * Update an email service
   *
   * @param {number} id - Service ID
   * @param {Object} data - Update data
   * @param {number} updated_by - Admin user ID
   * @returns {Promise<Object|null>} Updated service or null
   */
  static async update(id, data, updated_by) {
    const {
      name,
      config,
      credentials,
      is_enabled,
    } = data;

    // Get current service to check provider type
    const current = await this.findById(id, true);
    if (!current) {
      return null;
    }

    // If credentials are provided, validate and encrypt
    let encryptedCredentials = null;
    if (credentials) {
      const mergedConfig = { ...current.config, ...config };
      this.validateProviderFields(current.provider_type, mergedConfig, credentials);
      encryptedCredentials = encrypt(credentials);
    }

    // Build update query dynamically
    const updates = ['updated_by = $1', 'updated_at = NOW()'];
    const values = [updated_by];
    let paramCount = 2;

    if (name !== undefined) {
      updates.push(`name = $${paramCount}`);
      values.push(name);
      paramCount++;
    }

    if (config !== undefined) {
      updates.push(`config = $${paramCount}`);
      values.push(JSON.stringify({ ...current.config, ...config }));
      paramCount++;
    }

    if (encryptedCredentials) {
      updates.push(`credentials_encrypted = $${paramCount}`);
      values.push(encryptedCredentials);
      paramCount++;
    }

    if (is_enabled !== undefined) {
      updates.push(`is_enabled = $${paramCount}`);
      values.push(is_enabled);
      paramCount++;
    }

    values.push(id);

    const query = `
      UPDATE email_services
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id
    `;

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      return null;
    }

    return this.findById(id);
  }

  /**
   * Delete an email service
   *
   * @param {number} id - Service ID
   * @returns {Promise<boolean>} True if deleted
   */
  static async delete(id) {
    // First check if it's the active service
    const service = await this.findById(id);
    if (service && service.is_active) {
      throw new Error('Cannot delete the active email service. Deactivate it first.');
    }

    const query = `
      DELETE FROM email_services WHERE id = $1
      RETURNING id
    `;

    const result = await db.query(query, [id]);
    return result.rows.length > 0;
  }

  /**
   * Activate an email service (deactivates all others)
   *
   * @param {number} id - Service ID
   * @param {number} updated_by - Admin user ID
   * @returns {Promise<Object|null>} Activated service or null
   */
  static async activate(id, updated_by) {
    const client = await db.getClient();

    try {
      await client.query('BEGIN');

      // Deactivate all services
      await client.query(`
        UPDATE email_services
        SET is_active = false, updated_by = $1, updated_at = NOW()
        WHERE is_active = true
      `, [updated_by]);

      // Activate the selected service
      const result = await client.query(`
        UPDATE email_services
        SET is_active = true, updated_by = $1, updated_at = NOW()
        WHERE id = $2 AND is_enabled = true
        RETURNING id
      `, [updated_by, id]);

      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return null;
      }

      await client.query('COMMIT');
      client.release();

      return this.findById(id);
    } catch (error) {
      await client.query('ROLLBACK');
      client.release();
      throw error;
    }
  }

  /**
   * Deactivate an email service
   *
   * @param {number} id - Service ID
   * @param {number} updated_by - Admin user ID
   * @returns {Promise<Object|null>} Deactivated service or null
   */
  static async deactivate(id, updated_by) {
    const query = `
      UPDATE email_services
      SET is_active = false, updated_by = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id
    `;

    const result = await db.query(query, [updated_by, id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.findById(id);
  }

  /**
   * Get the currently active email service
   *
   * @param {boolean} includeCredentials - Whether to include decrypted credentials
   * @returns {Promise<Object|null>} Active service or null
   */
  static async getActive(includeCredentials = false) {
    const query = `
      SELECT id FROM email_services
      WHERE is_active = true AND is_enabled = true
      LIMIT 1
    `;

    const result = await db.query(query);

    if (result.rows.length === 0) {
      return null;
    }

    return this.findById(result.rows[0].id, includeCredentials);
  }

  /**
   * Update test result for a service
   *
   * @param {number} id - Service ID
   * @param {string} status - Test status (success, failed)
   * @param {string} error - Error message if failed
   * @returns {Promise<void>}
   */
  static async updateTestResult(id, status, error = null) {
    const query = `
      UPDATE email_services
      SET last_test_status = $1, last_test_at = NOW(), last_test_error = $2
      WHERE id = $3
    `;

    await db.query(query, [status, error, id]);
  }

  /**
   * Validate provider-specific fields
   *
   * @param {string} providerType - Provider type
   * @param {Object} config - Configuration object
   * @param {Object} credentials - Credentials object
   * @throws {Error} If validation fails
   */
  static validateProviderFields(providerType, config, credentials) {
    const fields = PROVIDER_CONFIG_FIELDS[providerType];
    if (!fields) {
      throw new Error(`Unknown provider type: ${providerType}`);
    }

    // Check config fields
    for (const field of fields.config) {
      if (!config || !config[field]) {
        throw new Error(`Missing required config field: ${field}`);
      }
    }

    // Check credential fields
    for (const field of fields.credentials) {
      if (!credentials || !credentials[field]) {
        throw new Error(`Missing required credential field: ${field}`);
      }
    }

    // Provider-specific validation
    if (providerType === PROVIDER_TYPES.SES) {
      if (!SES_REGIONS.includes(config.region)) {
        throw new Error(`Invalid AWS SES region: ${config.region}`);
      }
    }

    if (providerType === PROVIDER_TYPES.SMTP) {
      if (!SMTP_SECURITY_OPTIONS.includes(config.security)) {
        throw new Error(`Invalid SMTP security option: ${config.security}`);
      }
      if (config.port && (config.port < 1 || config.port > 65535)) {
        throw new Error(`Invalid SMTP port: ${config.port}`);
      }
    }
  }
}

// Export class and constants
module.exports = EmailService;
module.exports.PROVIDER_TYPES = PROVIDER_TYPES;
module.exports.TEST_STATUS = TEST_STATUS;
module.exports.SES_REGIONS = SES_REGIONS;
module.exports.SMTP_SECURITY_OPTIONS = SMTP_SECURITY_OPTIONS;
module.exports.PROVIDER_CONFIG_FIELDS = PROVIDER_CONFIG_FIELDS;
