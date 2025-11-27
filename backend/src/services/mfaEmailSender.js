/**
 * MFA Email Sender Service
 *
 * Handles sending MFA verification code emails using configurable templates.
 * Integrates with the existing email service and MFA template system.
 */

const emailService = require('./emailService');
const MFAEmailTemplate = require('../models/MFAEmailTemplate');
const MFAConfig = require('../models/MFAConfig');

class MFAEmailSender {
  /**
   * Send MFA verification code email
   *
   * @param {Object} options - Email options
   * @param {string} options.to - Recipient email address
   * @param {string} options.code - Verification code
   * @param {string} options.username - User's name/username (optional)
   * @returns {Promise<Object>} Send result
   */
  async sendVerificationCode({ to, code, username }) {
    try {
      // Get active email template
      const template = await MFAEmailTemplate.getActive();
      if (!template) {
        throw new Error('No active MFA email template found');
      }

      // Get MFA config for expiry time
      const config = await MFAConfig.get();

      // Render the template with variables
      const rendered = MFAEmailTemplate.render(template, {
        code,
        expiry_minutes: config.code_expiration_minutes,
        app_name: template.app_name || 'Auth System',
        user_email: to,
        user_name: username || to.split('@')[0],
      });

      // Send the email using existing email service
      const result = await emailService.sendEmail({
        to,
        subject: rendered.subject,
        text: rendered.textBody,
        html: rendered.htmlBody,
      });

      return {
        success: true,
        messageId: result.messageId,
        previewUrl: result.previewUrl,
        template: template.template_name,
      };
    } catch (error) {
      console.error('Failed to send MFA verification email:', error);
      throw new Error(`Failed to send MFA code: ${error.message}`);
    }
  }

  /**
   * Send MFA setup confirmation email
   *
   * @param {Object} options - Email options
   * @param {string} options.to - Recipient email address
   * @param {string} options.username - User's name/username
   * @param {string} options.method - MFA method enabled (email, totp)
   * @returns {Promise<Object>} Send result
   */
  async sendSetupConfirmation({ to, username, method }) {
    const methodDisplayName = method === 'email' ? 'Email' : 'Authenticator App';

    const subject = 'Two-Factor Authentication Enabled';
    const text = `
Hello ${username || 'there'},

Two-factor authentication has been successfully enabled on your account using ${methodDisplayName}.

From now on, you'll need to verify your identity when logging in.

If you didn't enable this feature, please contact support immediately.

Best regards,
Auth System Team
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
  <head>
    <style>
      body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
      }
      .container {
        background-color: #f9f9f9;
        border-radius: 8px;
        padding: 30px;
      }
      .success {
        background-color: #d4edda;
        border: 1px solid #c3e6cb;
        color: #155724;
        padding: 15px;
        border-radius: 4px;
        margin: 20px 0;
      }
      .footer {
        margin-top: 30px;
        font-size: 0.9em;
        color: #666;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h2>🔒 Two-Factor Authentication Enabled</h2>
      <p>Hello ${username || 'there'},</p>
      <div class="success">
        ✅ Two-factor authentication has been successfully enabled using <strong>${methodDisplayName}</strong>.
      </div>
      <p>From now on, you'll need to verify your identity when logging in. This adds an extra layer of security to your account.</p>
      <p class="footer">
        If you didn't enable this feature, please contact support immediately.
      </p>
    </div>
  </body>
</html>
    `.trim();

    return emailService.sendEmail({ to, subject, text, html });
  }

  /**
   * Send MFA disabled notification email
   *
   * @param {Object} options - Email options
   * @param {string} options.to - Recipient email address
   * @param {string} options.username - User's name/username
   * @param {string} options.method - MFA method disabled
   * @returns {Promise<Object>} Send result
   */
  async sendDisabledNotification({ to, username, method }) {
    const methodDisplayName = method === 'email' ? 'Email' : 'Authenticator App';

    const subject = 'Two-Factor Authentication Disabled';
    const text = `
Hello ${username || 'there'},

Two-factor authentication (${methodDisplayName}) has been disabled on your account.

Your account is now protected by password only. We recommend re-enabling two-factor authentication for better security.

If you didn't make this change, please contact support immediately and consider changing your password.

Best regards,
Auth System Team
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
  <head>
    <style>
      body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
      }
      .container {
        background-color: #f9f9f9;
        border-radius: 8px;
        padding: 30px;
      }
      .warning {
        background-color: #fff3cd;
        border: 1px solid #ffc107;
        color: #856404;
        padding: 15px;
        border-radius: 4px;
        margin: 20px 0;
      }
      .footer {
        margin-top: 30px;
        font-size: 0.9em;
        color: #666;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h2>⚠️ Two-Factor Authentication Disabled</h2>
      <p>Hello ${username || 'there'},</p>
      <div class="warning">
        Two-factor authentication (${methodDisplayName}) has been disabled on your account.
      </div>
      <p>Your account is now protected by password only. We recommend re-enabling two-factor authentication for better security.</p>
      <p class="footer">
        If you didn't make this change, please contact support immediately and consider changing your password.
      </p>
    </div>
  </body>
</html>
    `.trim();

    return emailService.sendEmail({ to, subject, text, html });
  }

  /**
   * Send lockout notification email
   *
   * @param {Object} options - Email options
   * @param {string} options.to - Recipient email address
   * @param {string} options.username - User's name/username
   * @param {Date} options.lockedUntil - When lockout expires
   * @param {number} options.attemptCount - Number of failed attempts
   * @returns {Promise<Object>} Send result
   */
  async sendLockoutNotification({ to, username, lockedUntil, attemptCount }) {
    const lockoutMinutes = Math.ceil((new Date(lockedUntil) - new Date()) / 60000);

    const subject = 'Account Temporarily Locked - Too Many Failed Attempts';
    const text = `
Hello ${username || 'there'},

Your account has been temporarily locked due to ${attemptCount} failed two-factor authentication attempts.

You can try again in approximately ${lockoutMinutes} minutes.

If you didn't attempt these logins, someone may be trying to access your account. Please ensure your password is secure and consider changing it.

Best regards,
Auth System Team
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
  <head>
    <style>
      body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
      }
      .container {
        background-color: #f9f9f9;
        border-radius: 8px;
        padding: 30px;
      }
      .danger {
        background-color: #f8d7da;
        border: 1px solid #f5c6cb;
        color: #721c24;
        padding: 15px;
        border-radius: 4px;
        margin: 20px 0;
      }
      .info {
        background-color: #e7f1ff;
        border: 1px solid #b6d4fe;
        color: #084298;
        padding: 15px;
        border-radius: 4px;
        margin: 20px 0;
      }
      .footer {
        margin-top: 30px;
        font-size: 0.9em;
        color: #666;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h2>🔒 Account Temporarily Locked</h2>
      <p>Hello ${username || 'there'},</p>
      <div class="danger">
        Your account has been temporarily locked due to <strong>${attemptCount} failed</strong> two-factor authentication attempts.
      </div>
      <div class="info">
        You can try again in approximately <strong>${lockoutMinutes} minutes</strong>.
      </div>
      <p>If you didn't attempt these logins, someone may be trying to access your account. Please ensure your password is secure and consider changing it.</p>
      <p class="footer">
        If you continue to have trouble, please contact support for assistance.
      </p>
    </div>
  </body>
</html>
    `.trim();

    return emailService.sendEmail({ to, subject, text, html });
  }

  /**
   * Send new device login notification
   *
   * @param {Object} options - Email options
   * @param {string} options.to - Recipient email address
   * @param {string} options.username - User's name/username
   * @param {Object} options.device - Device information
   * @param {string} options.device.browser - Browser name
   * @param {string} options.device.os - Operating system
   * @param {string} options.device.location - Approximate location
   * @param {Date} options.loginTime - Time of login
   * @returns {Promise<Object>} Send result
   */
  async sendNewDeviceNotification({ to, username, device, loginTime }) {
    const loginTimeStr = new Date(loginTime).toLocaleString();

    const subject = 'New Device Login Detected';
    const text = `
Hello ${username || 'there'},

A new device was used to log into your account:

Device: ${device.browser || 'Unknown'} on ${device.os || 'Unknown'}
Location: ${device.location || 'Unknown'}
Time: ${loginTimeStr}

If this was you, you can ignore this email.

If you didn't log in from this device, please:
1. Change your password immediately
2. Review your account activity
3. Contact support if needed

Best regards,
Auth System Team
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
  <head>
    <style>
      body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
      }
      .container {
        background-color: #f9f9f9;
        border-radius: 8px;
        padding: 30px;
      }
      .device-info {
        background-color: #e7f1ff;
        border: 1px solid #b6d4fe;
        color: #084298;
        padding: 15px;
        border-radius: 4px;
        margin: 20px 0;
      }
      .device-info table {
        width: 100%;
      }
      .device-info td {
        padding: 5px 0;
      }
      .device-info td:first-child {
        font-weight: bold;
        width: 100px;
      }
      .footer {
        margin-top: 30px;
        font-size: 0.9em;
        color: #666;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h2>🖥️ New Device Login Detected</h2>
      <p>Hello ${username || 'there'},</p>
      <p>A new device was used to log into your account:</p>
      <div class="device-info">
        <table>
          <tr>
            <td>Device:</td>
            <td>${device.browser || 'Unknown'} on ${device.os || 'Unknown'}</td>
          </tr>
          <tr>
            <td>Location:</td>
            <td>${device.location || 'Unknown'}</td>
          </tr>
          <tr>
            <td>Time:</td>
            <td>${loginTimeStr}</td>
          </tr>
        </table>
      </div>
      <p>If this was you, you can ignore this email.</p>
      <p>If you didn't log in from this device, please:</p>
      <ol>
        <li>Change your password immediately</li>
        <li>Review your account activity</li>
        <li>Contact support if needed</li>
      </ol>
      <p class="footer">
        This notification was sent to help keep your account secure.
      </p>
    </div>
  </body>
</html>
    `.trim();

    return emailService.sendEmail({ to, subject, text, html });
  }

  /**
   * Send alternate email verification code
   *
   * @param {Object} options - Email options
   * @param {string} options.to - Alternate email address
   * @param {string} options.code - Verification code
   * @param {string} options.primaryEmail - User's primary email
   * @returns {Promise<Object>} Send result
   */
  async sendAlternateEmailVerification({ to, code, primaryEmail }) {
    const config = await MFAConfig.get();

    const subject = 'Verify Your Backup Email Address';
    const text = `
Hello,

A request was made to add this email as a backup email for two-factor authentication on the account: ${primaryEmail}

Your verification code is: ${code}

This code will expire in ${config.code_expiration_minutes} minutes.

If you didn't request this, please ignore this email.

Best regards,
Auth System Team
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
  <head>
    <style>
      body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
      }
      .container {
        background-color: #f9f9f9;
        border-radius: 8px;
        padding: 30px;
      }
      .code-box {
        background-color: #f0f0f0;
        border: 2px dashed #ccc;
        padding: 20px;
        text-align: center;
        margin: 20px 0;
        border-radius: 8px;
      }
      .code {
        font-size: 32px;
        font-weight: bold;
        letter-spacing: 8px;
        color: #333;
        font-family: monospace;
      }
      .expiry {
        font-size: 14px;
        color: #666;
        margin-top: 10px;
      }
      .footer {
        margin-top: 30px;
        font-size: 0.9em;
        color: #666;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h2>📧 Verify Your Backup Email</h2>
      <p>Hello,</p>
      <p>A request was made to add this email as a backup email for two-factor authentication on the account: <strong>${primaryEmail}</strong></p>
      <div class="code-box">
        <div class="code">${code}</div>
        <div class="expiry">Expires in ${config.code_expiration_minutes} minutes</div>
      </div>
      <p>Enter this code in the verification form to confirm this email address.</p>
      <p class="footer">
        If you didn't request this, please ignore this email.
      </p>
    </div>
  </body>
</html>
    `.trim();

    return emailService.sendEmail({ to, subject, text, html });
  }
}

// Export singleton instance
module.exports = new MFAEmailSender();
