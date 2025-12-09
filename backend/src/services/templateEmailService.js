/**
 * Template Email Service
 *
 * Handles sending emails using database-stored templates.
 * Uses the EmailTemplate model for template management and rendering.
 *
 * This service integrates with:
 * - EmailTemplate model for template storage and rendering
 * - emailService for actual email delivery via SMTP
 */

const EmailTemplate = require('../models/EmailTemplate');
const { sendEmail } = require('./emailService');

// App name from environment or default
const APP_NAME = process.env.FROM_NAME || 'Auth System';

/**
 * Send email using a database template
 *
 * @param {string} templateKey - Template key (e.g., 'initial_registration')
 * @param {string} to - Recipient email address
 * @param {Object} data - Data for placeholder substitution
 * @returns {Promise<Object>} Send result with messageId
 */
async function sendTemplatedEmail(templateKey, to, data) {
  // Get template from database
  const template = await EmailTemplate.getByKey(templateKey);

  if (!template) {
    console.error(`Template not found: ${templateKey}`);
    throw new Error(`Email template '${templateKey}' not found`);
  }

  // Add default app_name if not provided
  const renderData = {
    app_name: APP_NAME,
    ...data,
  };

  // Render template with data
  const rendered = EmailTemplate.render(template, renderData);

  // Send email
  return sendEmail({
    to,
    subject: rendered.subject,
    text: rendered.textBody,
    html: rendered.htmlBody,
  });
}

/**
 * Send verification email using database template
 *
 * @param {string} to - Recipient email address
 * @param {string} username - User's username
 * @param {string} verificationUrl - Verification link URL
 * @param {boolean} isResend - Whether this is a resend request
 * @returns {Promise<Object>} Send result
 */
async function sendVerificationEmail(to, username, verificationUrl, isResend = false) {
  const templateKey = isResend ? 'resend_verification' : 'initial_registration';

  return sendTemplatedEmail(templateKey, to, {
    username,
    verification_link: verificationUrl,
    expiry_hours: '24',
  });
}

/**
 * Send password reset email using database template
 *
 * @param {string} to - Recipient email address
 * @param {string} username - User's username
 * @param {string} resetUrl - Password reset link URL
 * @returns {Promise<Object>} Send result
 */
async function sendPasswordResetEmail(to, username, resetUrl) {
  return sendTemplatedEmail('password_reset_request', to, {
    username,
    reset_link: resetUrl,
    expiry_hours: '1',
  });
}

/**
 * Send password changed confirmation email using database template
 *
 * @param {string} to - Recipient email address
 * @param {string} username - User's username
 * @param {Object} options - Additional options
 * @param {string} options.ipAddress - IP address of the request
 * @returns {Promise<Object>} Send result
 */
async function sendPasswordChangedEmail(to, username, options = {}) {
  return sendTemplatedEmail('password_changed', to, {
    username,
    change_date: new Date().toLocaleString(),
    ip_address: options.ipAddress || 'Unknown',
  });
}

/**
 * Send 2FA verification code email using database template
 *
 * @param {string} to - Recipient email address
 * @param {string} code - Verification code
 * @param {number} expiryMinutes - Code expiry time in minutes
 * @returns {Promise<Object>} Send result
 */
async function send2FACodeEmail(to, code, expiryMinutes = 10) {
  return sendTemplatedEmail('email_2fa_verification', to, {
    code,
    expiry_minutes: String(expiryMinutes),
  });
}

/**
 * Send new device login alert email using database template
 *
 * @param {string} to - Recipient email address
 * @param {string} username - User's username
 * @param {Object} options - Device/login info
 * @param {string} options.deviceInfo - Device information
 * @param {string} options.location - Approximate location
 * @param {string} options.ipAddress - IP address
 * @returns {Promise<Object>} Send result
 */
async function sendNewDeviceLoginEmail(to, username, options = {}) {
  return sendTemplatedEmail('new_device_login', to, {
    username,
    device_info: options.deviceInfo || 'Unknown device',
    location: options.location || 'Unknown location',
    login_date: new Date().toLocaleString(),
    ip_address: options.ipAddress || 'Unknown',
  });
}

/**
 * Send account locked notification email using database template
 *
 * @param {string} to - Recipient email address
 * @param {string} username - User's username
 * @param {Date} unlockDate - When the account will unlock
 * @returns {Promise<Object>} Send result
 */
async function sendAccountLockedEmail(to, username, unlockDate) {
  return sendTemplatedEmail('account_locked', to, {
    username,
    lock_date: new Date().toLocaleString(),
    unlock_date: unlockDate ? unlockDate.toLocaleString() : 'Contact support',
  });
}

/**
 * Send backup codes generated notification email using database template
 *
 * @param {string} to - Recipient email address
 * @param {string} username - User's username
 * @param {Object} options - Additional options
 * @param {string} options.ipAddress - IP address
 * @returns {Promise<Object>} Send result
 */
async function sendBackupCodesGeneratedEmail(to, username, options = {}) {
  return sendTemplatedEmail('backup_codes_generated', to, {
    username,
    generation_date: new Date().toLocaleString(),
    ip_address: options.ipAddress || 'Unknown',
  });
}

/**
 * Send account deactivation notification email using database template
 *
 * @param {string} to - Recipient email address
 * @param {string} username - User's username
 * @returns {Promise<Object>} Send result
 */
async function sendAccountDeactivationEmail(to, username) {
  return sendTemplatedEmail('account_deactivation', to, {
    username,
  });
}

/**
 * Send welcome email using database template
 *
 * @param {string} to - Recipient email address
 * @param {string} username - User's username
 * @returns {Promise<Object>} Send result
 */
async function sendWelcomeEmail(to, username) {
  return sendTemplatedEmail('welcome_email', to, {
    username,
  });
}

/**
 * Send test email using database template
 *
 * @param {string} to - Recipient email address
 * @param {string} username - User's username (optional)
 * @returns {Promise<Object>} Send result
 */
async function sendTestEmail(to, username = 'Test User') {
  return sendTemplatedEmail('test_email', to, {
    username,
    sent_date: new Date().toLocaleString(),
  });
}

/**
 * Preview a template with sample data
 *
 * @param {string} templateKey - Template key
 * @param {string} version - 'plain' or 'branded'
 * @param {Object} sampleData - Sample data for preview
 * @returns {Promise<Object>} Preview result with subject and body
 */
async function previewTemplate(templateKey, version, sampleData = {}) {
  const template = await EmailTemplate.getByKey(templateKey);

  if (!template) {
    throw new Error(`Template '${templateKey}' not found`);
  }

  // Override version for preview
  const previewTemplate = {
    ...template,
    active_version: version,
  };

  const renderData = {
    app_name: APP_NAME,
    username: 'John Doe',
    code: '123456',
    verification_link: 'https://example.com/verify?token=abc123',
    reset_link: 'https://example.com/reset?token=xyz789',
    expiry_minutes: '10',
    expiry_hours: '24',
    change_date: new Date().toLocaleString(),
    login_date: new Date().toLocaleString(),
    lock_date: new Date().toLocaleString(),
    unlock_date: new Date(Date.now() + 15 * 60 * 1000).toLocaleString(),
    generation_date: new Date().toLocaleDateString(),
    sent_date: new Date().toLocaleString(),
    ip_address: '192.168.1.100',
    device_info: 'Chrome on Windows',
    location: 'New York, US',
    ...sampleData,
  };

  const rendered = EmailTemplate.render(previewTemplate, renderData);

  return {
    subject: rendered.subject,
    body: version === 'plain' ? rendered.textBody : rendered.htmlBody,
    text: rendered.textBody,
    html: rendered.htmlBody,
  };
}

/**
 * Send test email to verify template
 *
 * @param {string} templateKey - Template key
 * @param {string} version - 'plain' or 'branded'
 * @param {string} recipientEmail - Email address to send to
 * @param {Object} sampleData - Sample data for template
 * @returns {Promise<Object>} Send result
 */
async function sendTemplateTestEmail(templateKey, version, recipientEmail, sampleData = {}) {
  const template = await EmailTemplate.getByKey(templateKey);

  if (!template) {
    throw new Error(`Template '${templateKey}' not found`);
  }

  // Override version for test
  const testTemplate = {
    ...template,
    active_version: version,
  };

  const renderData = {
    app_name: APP_NAME,
    username: 'Test User',
    code: '123456',
    verification_link: 'https://example.com/verify?token=test123',
    reset_link: 'https://example.com/reset?token=test789',
    expiry_minutes: '10',
    expiry_hours: '24',
    change_date: new Date().toLocaleString(),
    login_date: new Date().toLocaleString(),
    lock_date: new Date().toLocaleString(),
    unlock_date: new Date(Date.now() + 15 * 60 * 1000).toLocaleString(),
    generation_date: new Date().toLocaleDateString(),
    sent_date: new Date().toLocaleString(),
    ip_address: '192.168.1.100',
    device_info: 'Chrome on Windows',
    location: 'New York, US',
    ...sampleData,
  };

  const rendered = EmailTemplate.render(testTemplate, renderData);

  return sendEmail({
    to: recipientEmail,
    subject: `[TEST] ${rendered.subject}`,
    text: rendered.textBody,
    html: rendered.htmlBody,
  });
}

module.exports = {
  sendTemplatedEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  send2FACodeEmail,
  sendNewDeviceLoginEmail,
  sendAccountLockedEmail,
  sendBackupCodesGeneratedEmail,
  sendAccountDeactivationEmail,
  sendWelcomeEmail,
  sendTestEmail,
  previewTemplate,
  sendTemplateTestEmail,
};
