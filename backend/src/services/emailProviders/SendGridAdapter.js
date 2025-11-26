/**
 * SendGrid Email Provider Adapter
 *
 * Implements email sending via SendGrid API
 */

const BaseEmailProvider = require('./BaseEmailProvider');

class SendGridAdapter extends BaseEmailProvider {
  constructor(config, credentials) {
    super(config, credentials);
    this.providerName = 'sendgrid';

    // Validate required fields
    this.validateConfig(['from_email', 'from_name']);
    this.validateCredentials(['api_key']);

    // Initialize SendGrid client
    this.sgMail = require('@sendgrid/mail');
    this.sgMail.setApiKey(this.credentials.api_key);
  }

  /**
   * Test connection to SendGrid
   *
   * SendGrid doesn't have a direct ping endpoint, so we validate the API key
   * by making a minimal API call.
   *
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async testConnection() {
    try {
      // Attempt to validate by checking API key format
      if (!this.credentials.api_key || !this.credentials.api_key.startsWith('SG.')) {
        return {
          success: false,
          message: 'Invalid SendGrid API key format. API keys should start with "SG."',
        };
      }

      // Make a test API call to validate the key
      // Using the sendgrid client library's internal validation
      const client = require('@sendgrid/client');
      client.setApiKey(this.credentials.api_key);

      // Get API key info (this validates the key without sending email)
      const [response] = await client.request({
        method: 'GET',
        url: '/v3/api_keys',
      });

      if (response.statusCode === 200) {
        return {
          success: true,
          message: 'SendGrid connection successful. API key is valid.',
        };
      }

      return {
        success: false,
        message: `SendGrid returned status ${response.statusCode}`,
      };
    } catch (error) {
      // Handle specific SendGrid errors
      if (error.code === 401 || error.response?.statusCode === 401) {
        return {
          success: false,
          message: 'Invalid SendGrid API key. Please check your credentials.',
        };
      }

      if (error.code === 403 || error.response?.statusCode === 403) {
        return {
          success: false,
          message: 'SendGrid API key lacks required permissions. Ensure "Mail Send" permission is enabled.',
        };
      }

      return {
        success: false,
        message: `SendGrid connection failed: ${error.message}`,
      };
    }
  }

  /**
   * Send an email via SendGrid
   *
   * @param {Object} options - Email options
   * @param {string} options.to - Recipient email address
   * @param {string} options.subject - Email subject
   * @param {string} options.text - Plain text content
   * @param {string} options.html - HTML content
   * @returns {Promise<{success: boolean, messageId: string, details?: any}>}
   */
  async sendEmail({ to, subject, text, html }) {
    try {
      const msg = {
        to,
        from: {
          email: this.getFromEmail(),
          name: this.getFromName(),
        },
        subject,
        text,
        html,
      };

      const [response] = await this.sgMail.send(msg);

      return {
        success: true,
        messageId: response.headers['x-message-id'] || 'sent',
        details: {
          statusCode: response.statusCode,
          provider: 'sendgrid',
        },
      };
    } catch (error) {
      console.error('SendGrid send error:', error);

      // Extract detailed error message
      let errorMessage = error.message;
      if (error.response?.body?.errors) {
        errorMessage = error.response.body.errors.map(e => e.message).join(', ');
      }

      throw new Error(`SendGrid: ${errorMessage}`);
    }
  }
}

module.exports = SendGridAdapter;
