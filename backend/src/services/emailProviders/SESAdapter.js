/**
 * Amazon SES Email Provider Adapter
 *
 * Implements email sending via AWS Simple Email Service (SES)
 */

const BaseEmailProvider = require('./BaseEmailProvider');

class SESAdapter extends BaseEmailProvider {
  constructor(config, credentials) {
    super(config, credentials);
    this.providerName = 'ses';

    // Validate required fields
    this.validateConfig(['region', 'from_email', 'from_name']);
    this.validateCredentials(['access_key_id', 'secret_access_key']);

    // Initialize AWS SES client
    const { SESClient } = require('@aws-sdk/client-ses');

    this.sesClient = new SESClient({
      region: this.config.region,
      credentials: {
        accessKeyId: this.credentials.access_key_id,
        secretAccessKey: this.credentials.secret_access_key,
      },
    });
  }

  /**
   * Test connection to Amazon SES
   *
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async testConnection() {
    try {
      const { GetAccountCommand } = require('@aws-sdk/client-ses');

      // Try to get account info to validate credentials
      const command = new GetAccountCommand({});
      const response = await this.sesClient.send(command);

      // Check if the account is in sandbox mode
      const sandboxMode = response.EnforcementStatus === 'SANDBOX';

      let message = 'Amazon SES connection successful.';
      if (sandboxMode) {
        message += ' Note: Account is in sandbox mode (can only send to verified emails).';
      }

      return {
        success: true,
        message,
        details: {
          enforcementStatus: response.EnforcementStatus,
          sendingEnabled: response.SendingEnabled,
        },
      };
    } catch (error) {
      console.error('SES connection test error:', error);

      // Handle specific AWS errors
      if (error.name === 'InvalidClientTokenId' || error.name === 'SignatureDoesNotMatch') {
        return {
          success: false,
          message: 'Invalid AWS credentials. Please check your Access Key ID and Secret Access Key.',
        };
      }

      if (error.name === 'UnrecognizedClientException') {
        return {
          success: false,
          message: 'AWS credentials not recognized. Please verify your Access Key ID.',
        };
      }

      if (error.name === 'AccessDeniedException') {
        return {
          success: false,
          message: 'Access denied. Ensure your IAM user has SES permissions.',
        };
      }

      return {
        success: false,
        message: `Amazon SES connection failed: ${error.message}`,
      };
    }
  }

  /**
   * Send an email via Amazon SES
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
      const { SendEmailCommand } = require('@aws-sdk/client-ses');

      const command = new SendEmailCommand({
        Source: this.getFormattedFrom(),
        Destination: {
          ToAddresses: [to],
        },
        Message: {
          Subject: {
            Data: subject,
            Charset: 'UTF-8',
          },
          Body: {
            Text: text ? {
              Data: text,
              Charset: 'UTF-8',
            } : undefined,
            Html: html ? {
              Data: html,
              Charset: 'UTF-8',
            } : undefined,
          },
        },
      });

      const response = await this.sesClient.send(command);

      return {
        success: true,
        messageId: response.MessageId,
        details: {
          provider: 'ses',
          region: this.config.region,
        },
      };
    } catch (error) {
      console.error('SES send error:', error);

      // Handle specific SES errors
      if (error.name === 'MessageRejected') {
        throw new Error(`SES: Email rejected - ${error.message}`);
      }

      if (error.name === 'MailFromDomainNotVerifiedException') {
        throw new Error(`SES: From email domain not verified. Verify ${this.getFromEmail()} in SES console.`);
      }

      throw new Error(`SES: ${error.message}`);
    }
  }
}

module.exports = SESAdapter;
