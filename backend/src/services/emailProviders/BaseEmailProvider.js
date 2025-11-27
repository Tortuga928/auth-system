/**
 * Base Email Provider
 *
 * Abstract base class for email provider adapters.
 * All email providers must implement these methods.
 */

class BaseEmailProvider {
  constructor(config, credentials) {
    this.config = config;
    this.credentials = credentials;
    this.providerName = 'base';
  }

  /**
   * Test connection to the email service
   *
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async testConnection() {
    throw new Error('testConnection() must be implemented by subclass');
  }

  /**
   * Send an email
   *
   * @param {Object} options - Email options
   * @param {string} options.to - Recipient email address
   * @param {string} options.subject - Email subject
   * @param {string} options.text - Plain text content
   * @param {string} options.html - HTML content
   * @returns {Promise<{success: boolean, messageId: string, details?: any}>}
   */
  async sendEmail(options) {
    throw new Error('sendEmail() must be implemented by subclass');
  }

  /**
   * Get the from email address
   *
   * @returns {string}
   */
  getFromEmail() {
    return this.config.from_email;
  }

  /**
   * Get the from name
   *
   * @returns {string}
   */
  getFromName() {
    return this.config.from_name || 'Auth System';
  }

  /**
   * Format the from field for email
   *
   * @returns {string}
   */
  getFormattedFrom() {
    return `"${this.getFromName()}" <${this.getFromEmail()}>`;
  }

  /**
   * Validate that required config fields are present
   *
   * @param {string[]} requiredFields - Array of required field names
   * @throws {Error} If any required field is missing
   */
  validateConfig(requiredFields) {
    for (const field of requiredFields) {
      if (!this.config[field]) {
        throw new Error(`Missing required config field: ${field}`);
      }
    }
  }

  /**
   * Validate that required credential fields are present
   *
   * @param {string[]} requiredFields - Array of required field names
   * @throws {Error} If any required field is missing
   */
  validateCredentials(requiredFields) {
    for (const field of requiredFields) {
      if (!this.credentials[field]) {
        throw new Error(`Missing required credential field: ${field}`);
      }
    }
  }
}

module.exports = BaseEmailProvider;
