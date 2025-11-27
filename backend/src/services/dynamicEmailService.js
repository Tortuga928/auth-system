/**
 * Dynamic Email Service
 *
 * Uses the configured email service provider from the database.
 * Falls back to the legacy emailService if no provider is configured.
 */

const EmailServiceModel = require('../models/EmailService');
const SystemSetting = require('../models/SystemSetting');
const { createEmailProvider } = require('./emailProviders');
const legacyEmailService = require('./emailService');

/**
 * Get the active email provider instance
 *
 * @returns {Promise<Object|null>} Provider instance or null if none configured
 */
async function getActiveProvider() {
  try {
    // Get settings
    const settings = await SystemSetting.getEmailVerificationSettings();

    // If email verification is not enabled, return null
    if (!settings.enabled) {
      return null;
    }

    // Get active email service
    const service = await EmailServiceModel.getActive(true); // include decrypted credentials

    if (!service) {
      console.warn('⚠️ No active email service configured');
      return null;
    }

    // Create provider instance
    const provider = createEmailProvider(
      service.provider_type,
      service.config,
      service.credentials
    );

    return provider;
  } catch (error) {
    console.error('Error getting active email provider:', error);
    return null;
  }
}

/**
 * Check if email service is configured and enabled
 *
 * @returns {Promise<boolean>} True if email sending is available
 */
async function isEmailEnabled() {
  try {
    const settings = await SystemSetting.getEmailVerificationSettings();

    if (!settings.enabled) {
      return false;
    }

    const service = await EmailServiceModel.getActive();
    return !!service;
  } catch (error) {
    console.error('Error checking email enabled status:', error);
    return false;
  }
}

/**
 * Send verification email using configured provider
 *
 * Falls back to legacy service if no provider is configured.
 *
 * @param {string} to - Recipient email address
 * @param {string} username - User's username
 * @param {string} verificationUrl - Verification link URL
 * @returns {Promise<Object>} Send result
 */
async function sendVerificationEmail(to, username, verificationUrl) {
  const provider = await getActiveProvider();

  if (!provider) {
    // Fallback to legacy service
    console.log('📧 Using legacy email service (no configured provider)');
    return legacyEmailService.sendVerificationEmail(to, username, verificationUrl);
  }

  const subject = 'Verify Your Email Address';

  const text = `
Hello ${username},

Thank you for registering! Please verify your email address by clicking the link below:

${verificationUrl}

This link will expire in 24 hours.

If you didn't create an account, please ignore this email.

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
          .button {
            display: inline-block;
            background-color: #007bff;
            color: #ffffff;
            text-decoration: none;
            padding: 12px 30px;
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
          <h2>Welcome to Auth System!</h2>
          <p>Hello ${username},</p>
          <p>Thank you for registering! Please verify your email address by clicking the button below:</p>
          <p style="text-align: center;">
            <a href="${verificationUrl}" class="button">Verify Email Address</a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #007bff;">${verificationUrl}</p>
          <p class="footer">
            This link will expire in 24 hours.<br>
            If you didn't create an account, please ignore this email.
          </p>
        </div>
      </body>
    </html>
  `.trim();

  console.log(`📧 Sending verification email via ${provider.providerName}`);
  return provider.sendEmail({ to, subject, text, html });
}

/**
 * Send password reset email using configured provider
 *
 * Falls back to legacy service if no provider is configured.
 *
 * @param {string} to - Recipient email address
 * @param {string} username - User's username
 * @param {string} resetUrl - Password reset link URL
 * @returns {Promise<Object>} Send result
 */
async function sendPasswordResetEmail(to, username, resetUrl) {
  const provider = await getActiveProvider();

  if (!provider) {
    console.log('📧 Using legacy email service (no configured provider)');
    return legacyEmailService.sendPasswordResetEmail(to, username, resetUrl);
  }

  const subject = 'Reset Your Password';

  const text = `
Hello ${username},

We received a request to reset your password. Click the link below to create a new password:

${resetUrl}

This link will expire in 1 hour.

If you didn't request a password reset, please ignore this email and your password will remain unchanged.

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
          .button {
            display: inline-block;
            background-color: #dc3545;
            color: #ffffff;
            text-decoration: none;
            padding: 12px 30px;
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
          <h2>Password Reset Request</h2>
          <p>Hello ${username},</p>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <p style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #dc3545;">${resetUrl}</p>
          <p class="footer">
            This link will expire in 1 hour.<br>
            If you didn't request a password reset, please ignore this email.
          </p>
        </div>
      </body>
    </html>
  `.trim();

  console.log(`📧 Sending password reset email via ${provider.providerName}`);
  return provider.sendEmail({ to, subject, text, html });
}

/**
 * Send password reset confirmation email
 *
 * @param {string} to - Recipient email address
 * @param {string} username - User's username
 * @returns {Promise<Object>} Send result
 */
async function sendPasswordResetConfirmationEmail(to, username) {
  const provider = await getActiveProvider();

  if (!provider) {
    return legacyEmailService.sendPasswordResetConfirmationEmail(to, username);
  }

  const subject = 'Password Reset Successful';

  const text = `
Hello ${username},

Your password has been successfully reset.

If you did not make this change, please contact support immediately.

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
          <h2>Password Reset Successful</h2>
          <p>Hello ${username},</p>
          <div class="success">
            ✅ Your password has been successfully reset.
          </div>
          <p>You can now log in with your new password.</p>
          <p class="footer">
            If you did not make this change, please contact support immediately.
          </p>
        </div>
      </body>
    </html>
  `.trim();

  console.log(`📧 Sending password reset confirmation via ${provider.providerName}`);
  return provider.sendEmail({ to, subject, text, html });
}

/**
 * Send MFA reset email
 *
 * @param {string} to - Recipient email address
 * @param {string} username - User's username
 * @param {string} resetUrl - MFA reset link URL
 * @returns {Promise<Object>} Send result
 */
async function sendMFAResetEmail(to, username, resetUrl) {
  const provider = await getActiveProvider();

  if (!provider) {
    return legacyEmailService.sendMFAResetEmail(to, username, resetUrl);
  }

  const subject = 'Reset Your Two-Factor Authentication';

  const text = `
Hello ${username},

We received a request to reset your two-factor authentication (MFA) settings. Click the link below to reset your MFA:

${resetUrl}

This link will expire in 1 hour.

If you didn't request an MFA reset, please ignore this email and your MFA settings will remain unchanged.

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
          .button {
            display: inline-block;
            background-color: #ffc107;
            color: #000;
            text-decoration: none;
            padding: 12px 30px;
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
          <h2>MFA Reset Request</h2>
          <p>Hello ${username},</p>
          <p>We received a request to reset your two-factor authentication settings. Click the button below to reset your MFA:</p>
          <p style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset MFA</a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #ffc107;">${resetUrl}</p>
          <p class="footer">
            This link will expire in 1 hour.<br>
            If you didn't request an MFA reset, please ignore this email.
          </p>
        </div>
      </body>
    </html>
  `.trim();

  console.log(`📧 Sending MFA reset email via ${provider.providerName}`);
  return provider.sendEmail({ to, subject, text, html });
}

/**
 * Send test email
 *
 * @param {string} to - Test recipient email address
 * @returns {Promise<Object>} Send result
 */
async function sendTestEmail(to) {
  const provider = await getActiveProvider();

  if (!provider) {
    return legacyEmailService.sendTestEmail(to);
  }

  const subject = 'Test Email from Auth System';
  const text = 'This is a test email to verify your email configuration is working correctly.';
  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>✅ Email Configuration Test</h2>
        <p>This is a test email to verify your email configuration is working correctly.</p>
        <p>If you received this email, your settings are configured properly!</p>
        <p><strong>Provider:</strong> ${provider.providerName}</p>
      </body>
    </html>
  `;

  return provider.sendEmail({ to, subject, text, html });
}

module.exports = {
  isEmailEnabled,
  getActiveProvider,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendPasswordResetConfirmationEmail,
  sendMFAResetEmail,
  sendTestEmail,
};
