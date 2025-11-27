/**
 * SMTP Email Provider Adapter
 *
 * Implements email sending via self-hosted SMTP server
 */

const nodemailer = require('nodemailer');
const BaseEmailProvider = require('./BaseEmailProvider');

class SMTPAdapter extends BaseEmailProvider {
  constructor(config, credentials) {
    super(config, credentials);
    this.providerName = 'smtp';

    // Validate required fields
    this.validateConfig(['host', 'port', 'security', 'from_email', 'from_name']);
    this.validateCredentials(['username', 'password']);

    // Initialize transporter
    this.transporter = this.createTransporter();
  }

  /**
   * Create Nodemailer transporter with SMTP configuration
   *
   * @returns {Object} Nodemailer transporter
   */
  createTransporter() {
    const port = parseInt(this.config.port, 10);
    const security = this.config.security;

    // Determine secure and TLS settings based on security option
    let secure = false;
    let tls = {};

    switch (security) {
      case 'ssl':
        // Implicit SSL (usually port 465)
        secure = true;
        break;
      case 'tls':
        // Explicit TLS (usually port 465)
        secure = true;
        tls = { rejectUnauthorized: true };
        break;
      case 'starttls':
        // STARTTLS upgrade (usually port 587)
        secure = false;
        tls = { rejectUnauthorized: true };
        break;
      case 'none':
      default:
        // No encryption
        secure = false;
        tls = { rejectUnauthorized: false };
        break;
    }

    return nodemailer.createTransport({
      host: this.config.host,
      port,
      secure,
      auth: {
        user: this.credentials.username,
        pass: this.credentials.password,
      },
      tls,
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000,
      socketTimeout: 30000,
    });
  }

  /**
   * Test connection to SMTP server
   *
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async testConnection() {
    try {
      // Verify transporter configuration
      await this.transporter.verify();

      return {
        success: true,
        message: `SMTP connection successful to ${this.config.host}:${this.config.port}`,
      };
    } catch (error) {
      console.error('SMTP connection test error:', error);

      // Handle specific SMTP errors
      if (error.code === 'ECONNREFUSED') {
        return {
          success: false,
          message: `Cannot connect to SMTP server at ${this.config.host}:${this.config.port}. Server refused connection.`,
        };
      }

      if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKET') {
        return {
          success: false,
          message: `Connection timed out. Check host, port, and firewall settings.`,
        };
      }

      if (error.code === 'EAUTH' || error.responseCode === 535) {
        return {
          success: false,
          message: 'Authentication failed. Please check your username and password.',
        };
      }

      if (error.code === 'ENOTFOUND') {
        return {
          success: false,
          message: `SMTP host not found: ${this.config.host}. Check the hostname.`,
        };
      }

      if (error.code === 'ESOCKET' && error.message.includes('SSL')) {
        return {
          success: false,
          message: 'SSL/TLS error. Try changing the security setting (SSL, TLS, STARTTLS, or None).',
        };
      }

      return {
        success: false,
        message: `SMTP connection failed: ${error.message}`,
      };
    }
  }

  /**
   * Send an email via SMTP
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
      const info = await this.transporter.sendMail({
        from: this.getFormattedFrom(),
        to,
        subject,
        text,
        html,
      });

      return {
        success: true,
        messageId: info.messageId,
        details: {
          provider: 'smtp',
          host: this.config.host,
          response: info.response,
        },
      };
    } catch (error) {
      console.error('SMTP send error:', error);

      // Handle specific SMTP send errors
      if (error.responseCode >= 500) {
        throw new Error(`SMTP: Server error (${error.responseCode}) - ${error.response}`);
      }

      if (error.responseCode >= 400) {
        throw new Error(`SMTP: Request rejected (${error.responseCode}) - ${error.response}`);
      }

      throw new Error(`SMTP: ${error.message}`);
    }
  }

  /**
   * Close the transporter connection
   */
  close() {
    if (this.transporter) {
      this.transporter.close();
    }
  }
}

module.exports = SMTPAdapter;
