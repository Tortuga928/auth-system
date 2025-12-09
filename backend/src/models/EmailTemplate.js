/**
 * EmailTemplate Model
 *
 * Database operations for email_templates table
 * Handles email template management for all system emails
 *
 * Features:
 * - Template CRUD operations by key
 * - Plain/Branded version management
 * - Template rendering with placeholder substitution
 * - Individual and bulk reset functionality
 */

const db = require('../db');

// Default template data for reset functionality
const DEFAULT_TEMPLATES = {
  initial_registration: {
    display_name: 'Initial Registration',
    description: 'Email sent when a user first registers, containing the email verification link.',
    plain_subject: 'Verify your email address',
    plain_body: `Hello {{username}},

Thank you for registering with {{app_name}}!

Please verify your email address by clicking the link below:

{{verification_link}}

This link will expire in {{expiry_hours}} hours.

If you did not create an account, please ignore this email.

Best regards,
The {{app_name}} Team`,
    branded_subject: 'Welcome to {{app_name}} - Verify Your Email',
    header_text: 'Welcome!',
    message_body: 'Thank you for registering. Please verify your email address to get started.',
    footer_text: 'This is an automated message. Please do not reply.',
  },
  resend_verification: {
    display_name: 'Resend Email Verification',
    description: 'Email sent when user requests a new verification email or changes their email address.',
    plain_subject: 'Email Verification - {{app_name}}',
    plain_body: `Hello {{username}},

You requested a new email verification link for your {{app_name}} account.

Please verify your email address by clicking the link below:

{{verification_link}}

This link will expire in {{expiry_hours}} hours.

If you did not request this, please ignore this email.

Best regards,
The {{app_name}} Team`,
    branded_subject: 'Verify Your Email - {{app_name}}',
    header_text: 'Email Verification',
    message_body: 'Click the button below to verify your email address.',
    footer_text: 'This is an automated message. Please do not reply.',
  },
  email_2fa_verification: {
    display_name: 'Email 2FA Verification Code',
    description: 'Email sent containing the 2FA verification code for email-based two-factor authentication.',
    plain_subject: 'Your verification code - {{app_name}}',
    plain_body: `Your verification code is: {{code}}

This code will expire in {{expiry_minutes}} minutes.

If you did not request this code, please ignore this email or contact support if you have concerns.

Best regards,
The {{app_name}} Team`,
    branded_subject: 'Your {{app_name}} Verification Code',
    header_text: 'Verification Code',
    message_body: 'Use the following code to complete your sign-in:',
    footer_text: 'This is an automated message. Please do not reply.',
  },
  password_reset_request: {
    display_name: 'Password Reset Request',
    description: 'Email sent when a user requests to reset their password.',
    plain_subject: 'Reset your password - {{app_name}}',
    plain_body: `Hello {{username}},

We received a request to reset your password for your {{app_name}} account.

Click the link below to reset your password:

{{reset_link}}

This link will expire in {{expiry_hours}} hours.

If you did not request a password reset, please ignore this email. Your password will remain unchanged.

Best regards,
The {{app_name}} Team`,
    branded_subject: 'Password Reset Request - {{app_name}}',
    header_text: 'Reset Your Password',
    message_body: 'Click the button below to reset your password.',
    footer_text: 'If you did not request this, you can safely ignore this email.',
  },
  password_changed: {
    display_name: 'Password Changed Confirmation',
    description: 'Email sent after a user successfully changes their password.',
    plain_subject: 'Your password has been changed - {{app_name}}',
    plain_body: `Hello {{username}},

Your password for {{app_name}} has been successfully changed.

Date: {{change_date}}
IP Address: {{ip_address}}

If you did not make this change, please contact support immediately and reset your password.

Best regards,
The {{app_name}} Team`,
    branded_subject: 'Password Changed - {{app_name}}',
    header_text: 'Password Changed',
    message_body: 'Your password has been successfully updated.',
    footer_text: 'If you did not make this change, please contact support immediately.',
  },
  new_device_login: {
    display_name: 'New Device Login Alert',
    description: 'Email sent when a login is detected from a new device or location.',
    plain_subject: 'New sign-in to your account - {{app_name}}',
    plain_body: `Hello {{username}},

We detected a new sign-in to your {{app_name}} account.

Device: {{device_info}}
Location: {{location}}
Date: {{login_date}}
IP Address: {{ip_address}}

If this was you, you can ignore this email.

If you did not sign in, please secure your account immediately by changing your password.

Best regards,
The {{app_name}} Team`,
    branded_subject: 'New Sign-in Alert - {{app_name}}',
    header_text: 'New Sign-in Detected',
    message_body: 'A new sign-in to your account was detected.',
    footer_text: 'If this was not you, please secure your account immediately.',
  },
  account_locked: {
    display_name: 'Account Locked Notification',
    description: 'Email sent when an account is locked due to too many failed login attempts.',
    plain_subject: 'Your account has been locked - {{app_name}}',
    plain_body: `Hello {{username}},

Your {{app_name}} account has been temporarily locked due to multiple failed login attempts.

Lock Time: {{lock_date}}
Unlock Time: {{unlock_date}}

If this was you, please wait until the lock expires and try again with the correct password.

If you did not attempt to log in, someone may be trying to access your account. We recommend changing your password once the lock expires.

Best regards,
The {{app_name}} Team`,
    branded_subject: 'Account Locked - {{app_name}}',
    header_text: 'Account Locked',
    message_body: 'Your account has been temporarily locked for security reasons.',
    footer_text: 'If you did not attempt these logins, please change your password.',
  },
  backup_codes_generated: {
    display_name: 'MFA Backup Codes Generated',
    description: 'Email sent when new MFA backup codes are generated.',
    plain_subject: 'New backup codes generated - {{app_name}}',
    plain_body: `Hello {{username}},

New backup codes have been generated for your {{app_name}} account.

Date: {{generation_date}}
IP Address: {{ip_address}}

Your previous backup codes are no longer valid. Please store your new codes in a safe place.

If you did not generate new backup codes, please contact support immediately.

Best regards,
The {{app_name}} Team`,
    branded_subject: 'New Backup Codes Generated - {{app_name}}',
    header_text: 'Backup Codes Updated',
    message_body: 'New backup codes have been generated for your account.',
    footer_text: 'Store your new codes securely. Previous codes are no longer valid.',
  },
  account_deactivation: {
    display_name: 'Account Deactivation Notice',
    description: 'Email sent when an admin deactivates a user account.',
    plain_subject: 'Your account has been deactivated - {{app_name}}',
    plain_body: `Hello {{username}},

Your {{app_name}} account has been deactivated.

If you believe this was done in error, please contact support.

Best regards,
The {{app_name}} Team`,
    branded_subject: 'Account Deactivated - {{app_name}}',
    header_text: 'Account Deactivated',
    message_body: 'Your account has been deactivated.',
    footer_text: 'Please contact support if you have any questions.',
  },
  welcome_email: {
    display_name: 'Welcome Email',
    description: 'Email sent after successful registration and email verification.',
    plain_subject: 'Welcome to {{app_name}}!',
    plain_body: `Hello {{username}},

Welcome to {{app_name}}! Your email has been verified and your account is now active.

You can now log in and start using all features.

Getting started:
- Complete your profile
- Enable two-factor authentication for added security
- Explore the dashboard

If you have any questions, feel free to contact our support team.

Best regards,
The {{app_name}} Team`,
    branded_subject: 'Welcome to {{app_name}}!',
    header_text: 'Welcome!',
    message_body: 'Your account is now active. Start exploring today!',
    footer_text: 'Thank you for joining us.',
  },
  test_email: {
    display_name: 'Test Email',
    description: 'Email template used for testing email delivery.',
    plain_subject: 'Test Email from {{app_name}}',
    plain_body: `Hello {{username}},

This is a test email from {{app_name}}.

If you received this email, your email configuration is working correctly.

Sent at: {{sent_date}}

Best regards,
The {{app_name}} Team`,
    branded_subject: 'Test Email - {{app_name}}',
    header_text: 'Test Email',
    message_body: 'This is a test email to verify your email configuration.',
    footer_text: 'If you received this, email delivery is working correctly.',
  },
};

// Available placeholders for each template type
const TEMPLATE_PLACEHOLDERS = {
  initial_registration: [
    { name: '{{username}}', description: 'User\'s username' },
    { name: '{{app_name}}', description: 'Application name' },
    { name: '{{verification_link}}', description: 'Email verification link' },
    { name: '{{expiry_hours}}', description: 'Link expiry time in hours' },
  ],
  resend_verification: [
    { name: '{{username}}', description: 'User\'s username' },
    { name: '{{app_name}}', description: 'Application name' },
    { name: '{{verification_link}}', description: 'Email verification link' },
    { name: '{{expiry_hours}}', description: 'Link expiry time in hours' },
  ],
  email_2fa_verification: [
    { name: '{{code}}', description: '2FA verification code' },
    { name: '{{app_name}}', description: 'Application name' },
    { name: '{{expiry_minutes}}', description: 'Code expiry time in minutes' },
  ],
  password_reset_request: [
    { name: '{{username}}', description: 'User\'s username' },
    { name: '{{app_name}}', description: 'Application name' },
    { name: '{{reset_link}}', description: 'Password reset link' },
    { name: '{{expiry_hours}}', description: 'Link expiry time in hours' },
  ],
  password_changed: [
    { name: '{{username}}', description: 'User\'s username' },
    { name: '{{app_name}}', description: 'Application name' },
    { name: '{{change_date}}', description: 'Date and time of password change' },
    { name: '{{ip_address}}', description: 'IP address of the request' },
  ],
  new_device_login: [
    { name: '{{username}}', description: 'User\'s username' },
    { name: '{{app_name}}', description: 'Application name' },
    { name: '{{device_info}}', description: 'Device/browser information' },
    { name: '{{location}}', description: 'Approximate location' },
    { name: '{{login_date}}', description: 'Date and time of login' },
    { name: '{{ip_address}}', description: 'IP address' },
  ],
  account_locked: [
    { name: '{{username}}', description: 'User\'s username' },
    { name: '{{app_name}}', description: 'Application name' },
    { name: '{{lock_date}}', description: 'Date and time account was locked' },
    { name: '{{unlock_date}}', description: 'Date and time account will unlock' },
  ],
  backup_codes_generated: [
    { name: '{{username}}', description: 'User\'s username' },
    { name: '{{app_name}}', description: 'Application name' },
    { name: '{{generation_date}}', description: 'Date and time codes were generated' },
    { name: '{{ip_address}}', description: 'IP address' },
  ],
  account_deactivation: [
    { name: '{{username}}', description: 'User\'s username' },
    { name: '{{app_name}}', description: 'Application name' },
  ],
  welcome_email: [
    { name: '{{username}}', description: 'User\'s username' },
    { name: '{{app_name}}', description: 'Application name' },
  ],
  test_email: [
    { name: '{{username}}', description: 'User\'s username' },
    { name: '{{app_name}}', description: 'Application name' },
    { name: '{{sent_date}}', description: 'Date and time email was sent' },
  ],
};

class EmailTemplate {
  /**
   * Get all email templates
   *
   * @returns {Promise<Object[]>} Array of templates
   */
  static async getAll() {
    const query = `
      SELECT * FROM email_templates
      ORDER BY id ASC
    `;

    const result = await db.query(query);
    return result.rows;
  }

  /**
   * Get template by key
   *
   * @param {string} key - Template key (e.g., 'initial_registration')
   * @returns {Promise<Object|null>} Template or null
   */
  static async getByKey(key) {
    const query = `
      SELECT * FROM email_templates
      WHERE template_key = $1
    `;

    const result = await db.query(query, [key]);
    return result.rows[0] || null;
  }

  /**
   * Get template by ID
   *
   * @param {number} id - Template ID
   * @returns {Promise<Object|null>} Template or null
   */
  static async getById(id) {
    const query = `
      SELECT * FROM email_templates
      WHERE id = $1
    `;

    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Update a template by key
   *
   * @param {string} key - Template key
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated template
   */
  static async updateByKey(key, updates) {
    const allowedFields = [
      'active_version',
      'plain_subject',
      'plain_body',
      'branded_subject',
      'logo_url',
      'app_name',
      'primary_color',
      'secondary_color',
      'header_text',
      'message_body',
      'footer_text',
      'support_email',
      'support_url',
      'background_color',
      'button_color',
      'button_text_color',
      'font_family',
      'social_facebook',
      'social_twitter',
      'social_linkedin',
      'company_address',
      'branded_custom_html',
    ];

    const fields = [];
    const values = [key];
    let paramCount = 2;

    Object.keys(updates).forEach(fieldKey => {
      if (allowedFields.includes(fieldKey)) {
        fields.push(`${fieldKey} = $${paramCount}`);
        values.push(updates[fieldKey]);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    // Add updated_at
    fields.push(`updated_at = NOW()`);

    const query = `
      UPDATE email_templates
      SET ${fields.join(', ')}
      WHERE template_key = $1
      RETURNING *
    `;

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      throw new Error('Template not found');
    }

    return result.rows[0];
  }

  /**
   * Set active version for a template
   *
   * @param {string} key - Template key
   * @param {string} version - 'plain' or 'branded'
   * @returns {Promise<Object>} Updated template
   */
  static async setActiveVersion(key, version) {
    if (!['plain', 'branded'].includes(version)) {
      throw new Error('Invalid version. Must be "plain" or "branded".');
    }

    return this.updateByKey(key, { active_version: version });
  }

  /**
   * Reset a single template to defaults
   *
   * @param {string} key - Template key
   * @returns {Promise<Object>} Reset template
   */
  static async resetSingle(key) {
    const defaults = DEFAULT_TEMPLATES[key];
    if (!defaults) {
      throw new Error('Unknown template key');
    }

    const resetData = {
      ...defaults,
      active_version: 'plain',
      app_name: 'Auth System',
      primary_color: '#007bff',
      secondary_color: '#6c757d',
      background_color: '#f4f4f4',
      button_color: '#007bff',
      button_text_color: '#ffffff',
      font_family: 'Arial, sans-serif',
      logo_url: null,
      support_email: null,
      support_url: null,
      social_facebook: null,
      social_twitter: null,
      social_linkedin: null,
      company_address: null,
      branded_custom_html: null,
    };

    return this.updateByKey(key, resetData);
  }

  /**
   * Reset all templates to defaults
   *
   * @returns {Promise<void>}
   */
  static async resetAll() {
    for (const key of Object.keys(DEFAULT_TEMPLATES)) {
      await this.resetSingle(key);
    }
  }

  /**
   * Get available placeholders for a template
   *
   * @param {string} key - Template key
   * @returns {Object[]} Array of placeholder objects
   */
  static getPlaceholders(key) {
    return TEMPLATE_PLACEHOLDERS[key] || [];
  }

  /**
   * Get all template keys
   *
   * @returns {string[]} Array of template keys
   */
  static getTemplateKeys() {
    return Object.keys(DEFAULT_TEMPLATES);
  }

  /**
   * Render template with placeholder substitution
   *
   * @param {Object} template - Template object from database
   * @param {Object} data - Data for placeholders
   * @returns {Object} Rendered subject and body
   */
  static render(template, data) {
    const version = template.active_version || 'plain';
    const appName = template.app_name || data.app_name || 'Auth System';

    // Build placeholder mapping
    const placeholders = {
      '{{app_name}}': appName,
      '{{username}}': data.username || 'User',
      '{{code}}': data.code || '',
      '{{verification_link}}': data.verification_link || '',
      '{{reset_link}}': data.reset_link || '',
      '{{expiry_minutes}}': data.expiry_minutes || '10',
      '{{expiry_hours}}': data.expiry_hours || '24',
      '{{change_date}}': data.change_date || new Date().toLocaleString(),
      '{{login_date}}': data.login_date || new Date().toLocaleString(),
      '{{lock_date}}': data.lock_date || new Date().toLocaleString(),
      '{{unlock_date}}': data.unlock_date || '',
      '{{generation_date}}': data.generation_date || new Date().toLocaleString(),
      '{{sent_date}}': data.sent_date || new Date().toLocaleString(),
      '{{ip_address}}': data.ip_address || 'Unknown',
      '{{device_info}}': data.device_info || 'Unknown device',
      '{{location}}': data.location || 'Unknown location',
      '{{primary_color}}': template.primary_color || '#007bff',
      '{{secondary_color}}': template.secondary_color || '#6c757d',
      '{{background_color}}': template.background_color || '#f4f4f4',
      '{{button_color}}': template.button_color || '#007bff',
      '{{button_text_color}}': template.button_text_color || '#ffffff',
      '{{logo_url}}': template.logo_url || '',
      '{{header_text}}': template.header_text || '',
      '{{message_body}}': template.message_body || '',
      '{{footer_text}}': template.footer_text || '',
      '{{support_email}}': template.support_email || '',
      '{{support_url}}': template.support_url || '',
    };

    // Helper function to replace placeholders
    const replacePlaceholders = (text) => {
      if (!text) return '';
      let result = text;
      Object.keys(placeholders).forEach(key => {
        result = result.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), placeholders[key]);
      });
      return result;
    };

    let subject, htmlBody, textBody;

    if (version === 'plain') {
      subject = replacePlaceholders(template.plain_subject);
      textBody = replacePlaceholders(template.plain_body);
      htmlBody = null;
    } else {
      // Branded version
      subject = replacePlaceholders(template.branded_subject);

      // Check for custom HTML
      if (template.branded_custom_html) {
        htmlBody = replacePlaceholders(template.branded_custom_html);

        // Handle conditional blocks
        htmlBody = htmlBody.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, varName, content) => {
          return placeholders[`{{${varName}}}`] ? content : '';
        });
      } else {
        // Generate default branded HTML
        htmlBody = this.generateBrandedHtml(template, placeholders, data);
      }

      // Plain text fallback
      textBody = `${template.header_text || ''}\n\n${template.message_body || ''}\n\n${template.footer_text || ''}`;
      textBody = replacePlaceholders(textBody);
    }

    return {
      subject,
      htmlBody,
      textBody,
    };
  }

  /**
   * Generate branded HTML from template builder fields
   *
   * @param {Object} template - Template object
   * @param {Object} placeholders - Placeholder values
   * @param {Object} data - Original data object
   * @returns {string} Generated HTML
   */
  static generateBrandedHtml(template, placeholders, data) {
    const primaryColor = template.primary_color || '#007bff';
    const backgroundColor = template.background_color || '#f4f4f4';
    const fontFamily = template.font_family || 'Arial, sans-serif';

    // Determine main content based on template type
    let mainContent = '';
    if (data.code) {
      mainContent = `
        <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: ${primaryColor};">${data.code}</span>
        </div>
        <p style="color: #666666; font-size: 14px; margin: 20px 0 0 0;">
          This code will expire in <strong>${data.expiry_minutes || '10'} minutes</strong>.
        </p>`;
    } else if (data.verification_link) {
      mainContent = `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.verification_link}" style="background-color: ${template.button_color || primaryColor}; color: ${template.button_text_color || '#ffffff'}; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Verify Email</a>
        </div>
        <p style="color: #666666; font-size: 12px; margin: 20px 0 0 0; word-break: break-all;">
          Or copy this link: ${data.verification_link}
        </p>`;
    } else if (data.reset_link) {
      mainContent = `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.reset_link}" style="background-color: ${template.button_color || primaryColor}; color: ${template.button_text_color || '#ffffff'}; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p style="color: #666666; font-size: 12px; margin: 20px 0 0 0; word-break: break-all;">
          Or copy this link: ${data.reset_link}
        </p>`;
    }

    // Social links section
    let socialLinks = '';
    if (template.social_facebook || template.social_twitter || template.social_linkedin) {
      const links = [];
      if (template.social_facebook) links.push(`<a href="${template.social_facebook}" style="color: ${primaryColor}; margin: 0 10px;">Facebook</a>`);
      if (template.social_twitter) links.push(`<a href="${template.social_twitter}" style="color: ${primaryColor}; margin: 0 10px;">Twitter</a>`);
      if (template.social_linkedin) links.push(`<a href="${template.social_linkedin}" style="color: ${primaryColor}; margin: 0 10px;">LinkedIn</a>`);
      socialLinks = `<p style="margin: 15px 0 0 0;">${links.join(' | ')}</p>`;
    }

    // Company address
    const companyAddress = template.company_address
      ? `<p style="color: #999999; font-size: 11px; margin: 10px 0 0 0;">${template.company_address}</p>`
      : '';

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${template.header_text || 'Email'}</title>
</head>
<body style="margin: 0; padding: 0; font-family: ${fontFamily}; background-color: ${backgroundColor};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${backgroundColor}; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: ${primaryColor}; padding: 30px; text-align: center;">
              ${template.logo_url ? `<img src="${template.logo_url}" alt="${template.app_name || 'Logo'}" style="max-height: 50px; margin-bottom: 10px;">` : ''}
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">${template.header_text || ''}</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #333333; font-size: 16px; line-height: 1.5; margin: 0 0 20px 0;">
                ${template.message_body || ''}
              </p>
              ${mainContent}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="color: #999999; font-size: 12px; margin: 0;">
                ${template.footer_text || ''}
              </p>
              ${template.support_email ? `<p style="color: #999999; font-size: 12px; margin: 10px 0 0 0;">Need help? <a href="mailto:${template.support_email}" style="color: ${primaryColor};">${template.support_email}</a></p>` : ''}
              ${socialLinks}
              ${companyAddress}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }
}

module.exports = EmailTemplate;
