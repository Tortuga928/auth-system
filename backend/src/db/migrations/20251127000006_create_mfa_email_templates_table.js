/**
 * Migration: Create mfa_email_templates table
 *
 * Purpose: Store customizable email templates for MFA codes
 * Supports plain text (quick option) and branded HTML with tiered customization
 *
 * This is part of the Email 2FA Enhancement feature (Phase 1, Commit 1.6)
 */

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.createTable('mfa_email_templates', (table) => {
    // Primary key
    table.increments('id').primary();

    // Template type: plain, branded
    table.string('template_type', 20).notNullable().defaultTo('plain');

    // Basic customization (for branded templates)
    table.string('logo_url', 500).nullable();
    table.string('app_name', 100).nullable();
    table.string('primary_color', 7).nullable(); // Hex color code
    table.string('secondary_color', 7).nullable();
    table.text('footer_text').nullable();

    // Moderate customization
    table.text('header_text').nullable();
    table.text('message_body').nullable(); // Supports placeholders: {{code}}, {{expiry_minutes}}, {{app_name}}
    table.string('support_email', 255).nullable();
    table.string('support_url', 500).nullable();

    // Advanced customization (raw HTML)
    table.text('custom_html').nullable(); // Full HTML template with placeholders

    // Email subject line (supports placeholders)
    table.string('subject_line', 255).nullable();

    // Active flag (only one template should be active)
    table.boolean('is_active').notNullable().defaultTo(false);

    // Timestamps
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    // Indexes
    table.index('template_type');
    table.index('is_active');
  });

  // Insert default plain text template
  await knex('mfa_email_templates').insert({
    template_type: 'plain',
    app_name: 'Auth System',
    subject_line: 'Your verification code',
    message_body: 'Your verification code is: {{code}}\n\nThis code will expire in {{expiry_minutes}} minutes.\n\nIf you did not request this code, please ignore this email.',
    is_active: true,
  });

  // Insert default branded template (inactive)
  await knex('mfa_email_templates').insert({
    template_type: 'branded',
    app_name: 'Auth System',
    primary_color: '#007bff',
    secondary_color: '#6c757d',
    subject_line: 'Your {{app_name}} verification code',
    header_text: 'Verification Code',
    message_body: 'Use the following code to complete your sign-in:',
    footer_text: 'This is an automated message. Please do not reply.',
    custom_html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verification Code</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: {{primary_color}}; padding: 30px; text-align: center;">
              {{#if logo_url}}
              <img src="{{logo_url}}" alt="{{app_name}}" style="max-height: 50px; margin-bottom: 10px;">
              {{/if}}
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">{{header_text}}</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #333333; font-size: 16px; line-height: 1.5; margin: 0 0 20px 0;">
                {{message_body}}
              </p>
              <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: {{primary_color}};">{{code}}</span>
              </div>
              <p style="color: #666666; font-size: 14px; line-height: 1.5; margin: 20px 0 0 0;">
                This code will expire in <strong>{{expiry_minutes}} minutes</strong>.
              </p>
              <p style="color: #999999; font-size: 12px; line-height: 1.5; margin: 20px 0 0 0;">
                If you did not request this code, please ignore this email or contact support if you have concerns.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="color: #999999; font-size: 12px; margin: 0;">
                {{footer_text}}
              </p>
              {{#if support_email}}
              <p style="color: #999999; font-size: 12px; margin: 10px 0 0 0;">
                Need help? Contact us at <a href="mailto:{{support_email}}" style="color: {{primary_color}};">{{support_email}}</a>
              </p>
              {{/if}}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    is_active: false,
  });

  console.log('✅ Created mfa_email_templates table with default templates');
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('mfa_email_templates');
  console.log('✅ Dropped mfa_email_templates table');
};
