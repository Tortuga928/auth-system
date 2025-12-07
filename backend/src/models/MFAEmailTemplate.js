/**
 * MFAEmailTemplate Model
 *
 * Database operations for mfa_email_templates table
 * Handles email template management for MFA codes
 *
 * Features:
 * - Template CRUD operations
 * - Active template management
 * - Template rendering with placeholder substitution
 */

const db = require('../db');

class MFAEmailTemplate {
  /**
   * Get the active email template
   *
   * @returns {Promise<Object|null>} Active template or null
   */
  static async getActive() {
    const query = `
      SELECT * FROM mfa_email_templates
      WHERE is_active = true
      LIMIT 1
    `;

    const result = await db.query(query);
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
      SELECT * FROM mfa_email_templates
      WHERE id = $1
    `;

    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Get all templates
   *
   * @returns {Promise<Object[]>} Array of templates
   */
  static async getAll() {
    const query = `
      SELECT * FROM mfa_email_templates
      ORDER BY is_active DESC, created_at DESC
    `;

    const result = await db.query(query);
    return result.rows;
  }

  /**
   * Create a new template
   *
   * @param {Object} templateData - Template data
   * @returns {Promise<Object>} Created template
   */
  static async create(templateData) {
    const {
      template_type = 'plain',
      logo_url = null,
      app_name = null,
      primary_color = null,
      secondary_color = null,
      footer_text = null,
      header_text = null,
      message_body = null,
      support_email = null,
      support_url = null,
      custom_html = null,
      subject_line = null,
      is_active = false,
    } = templateData;

    const query = `
      INSERT INTO mfa_email_templates (
        template_type, logo_url, app_name, primary_color, secondary_color,
        footer_text, header_text, message_body, support_email, support_url,
        custom_html, subject_line, is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const values = [
      template_type, logo_url, app_name, primary_color, secondary_color,
      footer_text, header_text, message_body, support_email, support_url,
      custom_html, subject_line, is_active,
    ];

    const result = await db.query(query, values);
    return result.rows[0];
  }

  /**
   * Update a template
   *
   * @param {number} id - Template ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated template
   */
  static async update(id, updates) {
    const allowedFields = [
      'template_type',
      'logo_url',
      'app_name',
      'primary_color',
      'secondary_color',
      'footer_text',
      'header_text',
      'message_body',
      'support_email',
      'support_url',
      'custom_html',
      'subject_line',
      'is_active',
    ];

    const fields = [];
    const values = [id];
    let paramCount = 2;

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = $${paramCount}`);
        values.push(updates[key]);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    // Add updated_at
    fields.push(`updated_at = NOW()`);

    const query = `
      UPDATE mfa_email_templates
      SET ${fields.join(', ')}
      WHERE id = $1
      RETURNING *
    `;

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      throw new Error('Template not found');
    }

    return result.rows[0];
  }

  /**
   * Set a template as active (deactivates others)
   *
   * @param {number} id - Template ID to activate
   * @returns {Promise<Object>} Activated template
   */
  static async setActive(id) {
    // Deactivate all templates
    await db.query(`
      UPDATE mfa_email_templates
      SET is_active = false, updated_at = NOW()
    `);

    // Activate the specified template
    return this.update(id, { is_active: true });
  }

  /**
   * Delete a template
   *
   * @param {number} id - Template ID
   * @returns {Promise<boolean>} True if deleted
   */
  static async delete(id) {
    // Don't allow deleting the active template
    const template = await this.getById(id);
    if (template && template.is_active) {
      throw new Error('Cannot delete active template. Activate another template first.');
    }

    const query = `
      DELETE FROM mfa_email_templates
      WHERE id = $1
      RETURNING id
    `;

    const result = await db.query(query, [id]);
    return result.rowCount > 0;
  }

  /**
   * Render template with placeholder substitution
   *
   * @param {Object} template - Template object
   * @param {Object} data - Data for placeholders
   * @returns {Object} Rendered subject and body
   */
  static render(template, data) {
    const {
      code,
      expiry_minutes,
      app_name = template.app_name || 'Auth System',
      user_email,
    } = data;

    // Placeholder mapping
    const placeholders = {
      '{{code}}': code,
      '{{expiry_minutes}}': expiry_minutes,
      '{{app_name}}': app_name,
      '{{user_email}}': user_email,
      '{{primary_color}}': template.primary_color || '#007bff',
      '{{secondary_color}}': template.secondary_color || '#6c757d',
      '{{logo_url}}': template.logo_url || '',
      '{{header_text}}': template.header_text || 'Verification Code',
      '{{message_body}}': template.message_body || '',
      '{{footer_text}}': template.footer_text || '',
      '{{support_email}}': template.support_email || '',
      '{{support_url}}': template.support_url || '',
    };

    // Replace placeholders in subject
    let subject = template.subject_line || 'Your verification code';
    Object.keys(placeholders).forEach(key => {
      subject = subject.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), placeholders[key]);
    });

    // Determine body based on template type
    let htmlBody = null;
    let textBody = null;

    if (template.template_type === 'plain') {
      // Plain text only
      textBody = template.message_body || `Your verification code is: ${code}\n\nThis code will expire in ${expiry_minutes} minutes.`;
      Object.keys(placeholders).forEach(key => {
        textBody = textBody.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), placeholders[key]);
      });
    } else if (template.template_type === 'branded') {
      // HTML template
      if (template.custom_html) {
        htmlBody = template.custom_html;
        Object.keys(placeholders).forEach(key => {
          htmlBody = htmlBody.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), placeholders[key]);
        });

        // Handle conditional blocks (simple if/endif)
        htmlBody = htmlBody.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, varName, content) => {
          return placeholders[`{{${varName}}}`] ? content : '';
        });
      }

      // Also generate plain text fallback
      textBody = `${template.header_text || 'Verification Code'}\n\n${template.message_body || 'Your verification code is:'}\n\n${code}\n\nThis code will expire in ${expiry_minutes} minutes.\n\n${template.footer_text || ''}`;
    }

    return {
      subject,
      htmlBody,
      textBody,
    };
  }

  /**
   * Reset to default templates
   *
   * @returns {Promise<void>}
   */
  static async resetToDefaults() {
    // Delete all existing templates
    await db.query('DELETE FROM mfa_email_templates');

    // Re-insert defaults (same as migration)
    await db.query(`
      INSERT INTO mfa_email_templates (template_type, app_name, subject_line, message_body, is_active)
      VALUES ('plain', 'Auth System', 'Your verification code', 'Your verification code is: {{code}}\n\nThis code will expire in {{expiry_minutes}} minutes.\n\nIf you did not request this code, please ignore this email.', true)
    `);

    await db.query(`
      INSERT INTO mfa_email_templates (template_type, app_name, primary_color, secondary_color, subject_line, header_text, message_body, footer_text, custom_html, is_active)
      VALUES ('branded', 'Auth System', '#007bff', '#6c757d', 'Your {{app_name}} verification code', 'Verification Code', 'Use the following code to complete your sign-in:', 'This is an automated message. Please do not reply.', NULL, false)
    `);
  }
}

module.exports = MFAEmailTemplate;
