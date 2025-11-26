/**
 * Email Provider Factory
 *
 * Creates the appropriate email provider adapter based on provider type
 */

const SendGridAdapter = require('./SendGridAdapter');
const SESAdapter = require('./SESAdapter');
const SMTPAdapter = require('./SMTPAdapter');

const PROVIDER_TYPES = {
  SENDGRID: 'sendgrid',
  SES: 'ses',
  SMTP: 'smtp',
};

/**
 * Create an email provider adapter
 *
 * @param {string} providerType - Provider type (sendgrid, ses, smtp)
 * @param {Object} config - Non-sensitive configuration
 * @param {Object} credentials - Sensitive credentials (decrypted)
 * @returns {BaseEmailProvider} Email provider instance
 * @throws {Error} If provider type is unknown
 */
function createEmailProvider(providerType, config, credentials) {
  switch (providerType) {
    case PROVIDER_TYPES.SENDGRID:
      return new SendGridAdapter(config, credentials);

    case PROVIDER_TYPES.SES:
      return new SESAdapter(config, credentials);

    case PROVIDER_TYPES.SMTP:
      return new SMTPAdapter(config, credentials);

    default:
      throw new Error(`Unknown email provider type: ${providerType}`);
  }
}

/**
 * Get provider setup instructions
 *
 * @param {string} providerType - Provider type
 * @returns {Object} Setup instructions with steps and links
 */
function getProviderInstructions(providerType) {
  switch (providerType) {
    case PROVIDER_TYPES.SENDGRID:
      return {
        name: 'SendGrid',
        description: 'Cloud-based email delivery service by Twilio',
        steps: [
          'Create a SendGrid account at https://signup.sendgrid.com/',
          'Complete email sender verification',
          'Go to Settings → API Keys',
          'Create a new API Key with "Mail Send" permission',
          'Copy the API key (starts with "SG.")',
        ],
        links: {
          signup: 'https://signup.sendgrid.com/',
          apiKeys: 'https://app.sendgrid.com/settings/api_keys',
          docs: 'https://docs.sendgrid.com/for-developers/sending-email/api-getting-started',
        },
        requiredFields: {
          config: ['from_email', 'from_name'],
          credentials: ['api_key'],
        },
      };

    case PROVIDER_TYPES.SES:
      return {
        name: 'Amazon SES',
        description: 'Amazon Simple Email Service - cost-effective, scalable email',
        steps: [
          'Sign up for AWS at https://aws.amazon.com/',
          'Navigate to SES in AWS Console',
          'Verify your sender email address or domain',
          'Create IAM user with SES send permissions',
          'Generate Access Key ID and Secret Access Key',
          'Request production access if needed (sandbox mode has limits)',
        ],
        links: {
          console: 'https://console.aws.amazon.com/ses/',
          docs: 'https://docs.aws.amazon.com/ses/latest/dg/send-email.html',
          iam: 'https://console.aws.amazon.com/iam/',
        },
        requiredFields: {
          config: ['region', 'from_email', 'from_name'],
          credentials: ['access_key_id', 'secret_access_key'],
        },
        regions: [
          'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
          'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-central-1',
          'ap-south-1', 'ap-northeast-1', 'ap-northeast-2',
          'ap-southeast-1', 'ap-southeast-2', 'ca-central-1', 'sa-east-1',
        ],
      };

    case PROVIDER_TYPES.SMTP:
      return {
        name: 'Self-Hosted SMTP',
        description: 'Connect to any SMTP server (Gmail, Office 365, custom mail server)',
        steps: [
          'Obtain SMTP server hostname and port from your email provider',
          'Determine the security type (SSL/TLS/STARTTLS/None)',
          'Get your SMTP username (usually email address)',
          'Get your SMTP password or app-specific password',
          'For Gmail: Enable 2FA and create an App Password',
        ],
        links: {
          gmail: 'https://support.google.com/accounts/answer/185833',
          outlook: 'https://support.microsoft.com/en-us/office/pop-imap-and-smtp-settings-8361e398-8af4-4e97-b147-6c6c4ac95353',
        },
        requiredFields: {
          config: ['host', 'port', 'security', 'from_email', 'from_name'],
          credentials: ['username', 'password'],
        },
        securityOptions: [
          { value: 'none', label: 'None', description: 'No encryption (port 25)' },
          { value: 'ssl', label: 'SSL/TLS', description: 'Implicit SSL (port 465)' },
          { value: 'tls', label: 'TLS', description: 'Explicit TLS (port 465)' },
          { value: 'starttls', label: 'STARTTLS', description: 'Upgrade to TLS (port 587)' },
        ],
        commonPorts: [
          { port: 25, description: 'Standard SMTP (usually blocked by ISPs)' },
          { port: 465, description: 'SMTP over SSL/TLS' },
          { port: 587, description: 'SMTP with STARTTLS (recommended)' },
          { port: 2525, description: 'Alternative SMTP port' },
        ],
      };

    default:
      throw new Error(`Unknown provider type: ${providerType}`);
  }
}

module.exports = {
  createEmailProvider,
  getProviderInstructions,
  PROVIDER_TYPES,
  SendGridAdapter,
  SESAdapter,
  SMTPAdapter,
};
