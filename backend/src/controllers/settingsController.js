/**
 * Settings Controller
 *
 * Handles system settings and email service configuration
 * All endpoints require Super Admin access
 */

const SystemSetting = require('../models/SystemSetting');
const EmailService = require('../models/EmailService');
const SettingsAuditLog = require('../models/SettingsAuditLog');
const { createEmailProvider, getProviderInstructions, PROVIDER_TYPES } = require('../services/emailProviders');
const { redactCredentials } = require('../services/encryptionService');

/**
 * Get email verification settings
 *
 * GET /api/admin/settings/email
 */
async function getEmailSettings(req, res) {
  try {
    const settings = await SystemSetting.getEmailVerificationSettings();

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Error getting email settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get email settings',
      error: error.message,
    });
  }
}

/**
 * Update email verification settings
 *
 * PUT /api/admin/settings/email
 */
async function updateEmailSettings(req, res) {
  try {
    const { enabled, enforced, gracePeriodDays } = req.body;

    // Get current settings for audit log
    const oldSettings = await SystemSetting.getEmailVerificationSettings();

    // Update settings
    const newSettings = await SystemSetting.updateEmailVerificationSettings({
      enabled,
      enforced,
      gracePeriodDays,
    });

    // Create audit log
    await SettingsAuditLog.create({
      admin_id: req.user.id,
      admin_email: req.user.email,
      setting_type: SettingsAuditLog.SETTING_TYPES.SYSTEM_SETTING,
      action: SettingsAuditLog.ACTION_TYPES.UPDATE,
      setting_key: 'email_verification',
      old_value: oldSettings,
      new_value: newSettings,
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
    });

    res.json({
      success: true,
      message: 'Email verification settings updated',
      data: newSettings,
    });
  } catch (error) {
    console.error('Error updating email settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update email settings',
      error: error.message,
    });
  }
}

/**
 * Get all email service configurations
 *
 * GET /api/admin/settings/email-services
 */
async function getEmailServices(req, res) {
  try {
    const services = await EmailService.findAll();

    res.json({
      success: true,
      data: services,
    });
  } catch (error) {
    console.error('Error getting email services:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get email services',
      error: error.message,
    });
  }
}

/**
 * Get a single email service configuration
 *
 * GET /api/admin/settings/email-services/:id
 */
async function getEmailService(req, res) {
  try {
    const { id } = req.params;
    const service = await EmailService.findById(id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Email service not found',
      });
    }

    res.json({
      success: true,
      data: service,
    });
  } catch (error) {
    console.error('Error getting email service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get email service',
      error: error.message,
    });
  }
}

/**
 * Create a new email service configuration
 *
 * POST /api/admin/settings/email-services
 */
async function createEmailService(req, res) {
  try {
    const { name, provider_type, config, credentials } = req.body;

    // Validate provider type
    if (!Object.values(PROVIDER_TYPES).includes(provider_type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid provider type. Must be one of: ${Object.values(PROVIDER_TYPES).join(', ')}`,
      });
    }

    // Create service
    const service = await EmailService.create({
      name,
      provider_type,
      config,
      credentials,
      created_by: req.user.id,
    });

    // Create audit log
    await SettingsAuditLog.create({
      admin_id: req.user.id,
      admin_email: req.user.email,
      setting_type: SettingsAuditLog.SETTING_TYPES.EMAIL_SERVICE,
      action: SettingsAuditLog.ACTION_TYPES.CREATE,
      target_id: service.id,
      new_value: {
        name: service.name,
        provider_type: service.provider_type,
        config: service.config,
        credentials: redactCredentials(credentials),
      },
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
    });

    res.status(201).json({
      success: true,
      message: 'Email service created successfully',
      data: service,
    });
  } catch (error) {
    console.error('Error creating email service:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to create email service',
      error: error.message,
    });
  }
}

/**
 * Update an email service configuration
 *
 * PUT /api/admin/settings/email-services/:id
 */
async function updateEmailService(req, res) {
  try {
    const { id } = req.params;
    const { name, config, credentials, is_enabled } = req.body;

    // Get current service for audit log
    const oldService = await EmailService.findById(id);
    if (!oldService) {
      return res.status(404).json({
        success: false,
        message: 'Email service not found',
      });
    }

    // Update service
    const service = await EmailService.update(id, {
      name,
      config,
      credentials,
      is_enabled,
    }, req.user.id);

    // Create audit log
    await SettingsAuditLog.create({
      admin_id: req.user.id,
      admin_email: req.user.email,
      setting_type: SettingsAuditLog.SETTING_TYPES.EMAIL_SERVICE,
      action: SettingsAuditLog.ACTION_TYPES.UPDATE,
      target_id: parseInt(id, 10),
      old_value: {
        name: oldService.name,
        config: oldService.config,
        is_enabled: oldService.is_enabled,
      },
      new_value: {
        name: service.name,
        config: service.config,
        is_enabled: service.is_enabled,
        credentials: credentials ? redactCredentials(credentials) : undefined,
      },
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
    });

    res.json({
      success: true,
      message: 'Email service updated successfully',
      data: service,
    });
  } catch (error) {
    console.error('Error updating email service:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to update email service',
      error: error.message,
    });
  }
}

/**
 * Delete an email service configuration
 *
 * DELETE /api/admin/settings/email-services/:id
 */
async function deleteEmailService(req, res) {
  try {
    const { id } = req.params;

    // Get service for audit log
    const service = await EmailService.findById(id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Email service not found',
      });
    }

    // Delete service
    await EmailService.delete(id);

    // Create audit log
    await SettingsAuditLog.create({
      admin_id: req.user.id,
      admin_email: req.user.email,
      setting_type: SettingsAuditLog.SETTING_TYPES.EMAIL_SERVICE,
      action: SettingsAuditLog.ACTION_TYPES.DELETE,
      target_id: parseInt(id, 10),
      old_value: {
        name: service.name,
        provider_type: service.provider_type,
        config: service.config,
      },
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
    });

    res.json({
      success: true,
      message: 'Email service deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting email service:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to delete email service',
      error: error.message,
    });
  }
}

/**
 * Activate an email service (set as the active provider)
 *
 * POST /api/admin/settings/email-services/:id/activate
 */
async function activateEmailService(req, res) {
  try {
    const { id } = req.params;

    // Get previously active service for audit log
    const previousActive = await EmailService.getActive();

    // Activate new service
    const service = await EmailService.activate(id, req.user.id);

    if (!service) {
      return res.status(400).json({
        success: false,
        message: 'Could not activate email service. Ensure it exists and is enabled.',
      });
    }

    // Update system setting
    await SystemSetting.setActiveEmailService(parseInt(id, 10));

    // Create audit log
    await SettingsAuditLog.create({
      admin_id: req.user.id,
      admin_email: req.user.email,
      setting_type: SettingsAuditLog.SETTING_TYPES.EMAIL_SERVICE,
      action: SettingsAuditLog.ACTION_TYPES.ACTIVATE,
      target_id: parseInt(id, 10),
      old_value: previousActive ? { id: previousActive.id, name: previousActive.name } : null,
      new_value: { id: service.id, name: service.name },
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
    });

    res.json({
      success: true,
      message: `Email service "${service.name}" is now active`,
      data: service,
    });
  } catch (error) {
    console.error('Error activating email service:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to activate email service',
      error: error.message,
    });
  }
}

/**
 * Deactivate an email service
 *
 * POST /api/admin/settings/email-services/:id/deactivate
 */
async function deactivateEmailService(req, res) {
  try {
    const { id } = req.params;

    const service = await EmailService.deactivate(id, req.user.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Email service not found',
      });
    }

    // Clear system setting if this was the active service
    await SystemSetting.setActiveEmailService(null);

    // Create audit log
    await SettingsAuditLog.create({
      admin_id: req.user.id,
      admin_email: req.user.email,
      setting_type: SettingsAuditLog.SETTING_TYPES.EMAIL_SERVICE,
      action: SettingsAuditLog.ACTION_TYPES.DEACTIVATE,
      target_id: parseInt(id, 10),
      old_value: { is_active: true },
      new_value: { is_active: false },
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
    });

    res.json({
      success: true,
      message: `Email service "${service.name}" has been deactivated`,
      data: service,
    });
  } catch (error) {
    console.error('Error deactivating email service:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to deactivate email service',
      error: error.message,
    });
  }
}

/**
 * Test email service connection
 *
 * POST /api/admin/settings/email-services/:id/test-connection
 */
async function testEmailConnection(req, res) {
  try {
    const { id } = req.params;

    // Get service with decrypted credentials
    const service = await EmailService.findById(id, true);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Email service not found',
      });
    }

    // Create provider adapter
    const provider = createEmailProvider(
      service.provider_type,
      service.config,
      service.credentials
    );

    // Test connection
    const result = await provider.testConnection();

    // Update test result in database
    await EmailService.updateTestResult(
      id,
      result.success ? 'success' : 'failed',
      result.success ? null : result.message
    );

    // Create audit log
    await SettingsAuditLog.create({
      admin_id: req.user.id,
      admin_email: req.user.email,
      setting_type: SettingsAuditLog.SETTING_TYPES.EMAIL_SERVICE,
      action: SettingsAuditLog.ACTION_TYPES.TEST_CONNECTION,
      target_id: parseInt(id, 10),
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
      result_status: result.success ? 'success' : 'failed',
      result_message: result.message,
    });

    res.json({
      success: result.success,
      message: result.message,
      data: result.details || null,
    });
  } catch (error) {
    console.error('Error testing email connection:', error);

    // Update test result in database
    await EmailService.updateTestResult(req.params.id, 'failed', error.message);

    res.status(500).json({
      success: false,
      message: 'Connection test failed',
      error: error.message,
    });
  }
}

/**
 * Send a test email
 *
 * POST /api/admin/settings/email-services/:id/test-send
 */
async function testSendEmail(req, res) {
  try {
    const { id } = req.params;
    const { recipient_email } = req.body;

    if (!recipient_email) {
      return res.status(400).json({
        success: false,
        message: 'Recipient email is required',
      });
    }

    // Get service with decrypted credentials
    const service = await EmailService.findById(id, true);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Email service not found',
      });
    }

    // Create provider adapter
    const provider = createEmailProvider(
      service.provider_type,
      service.config,
      service.credentials
    );

    // Send test email
    const result = await provider.sendEmail({
      to: recipient_email,
      subject: 'Test Email from Auth System',
      text: 'This is a test email to verify your email configuration is working correctly.',
      html: `
        <!DOCTYPE html>
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>✅ Email Configuration Test</h2>
            <p>This is a test email to verify your email configuration is working correctly.</p>
            <p><strong>Service:</strong> ${service.name}</p>
            <p><strong>Provider:</strong> ${service.provider_type}</p>
            <p>If you received this email, your settings are configured properly!</p>
          </body>
        </html>
      `,
    });

    // Create audit log
    await SettingsAuditLog.create({
      admin_id: req.user.id,
      admin_email: req.user.email,
      setting_type: SettingsAuditLog.SETTING_TYPES.EMAIL_SERVICE,
      action: SettingsAuditLog.ACTION_TYPES.TEST_SEND,
      target_id: parseInt(id, 10),
      new_value: { recipient_email },
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
      result_status: 'success',
      result_message: `Test email sent to ${recipient_email}`,
    });

    res.json({
      success: true,
      message: `Test email sent to ${recipient_email}`,
      data: {
        messageId: result.messageId,
        provider: service.provider_type,
      },
    });
  } catch (error) {
    console.error('Error sending test email:', error);

    // Create audit log for failure
    await SettingsAuditLog.create({
      admin_id: req.user.id,
      admin_email: req.user.email,
      setting_type: SettingsAuditLog.SETTING_TYPES.EMAIL_SERVICE,
      action: SettingsAuditLog.ACTION_TYPES.TEST_SEND,
      target_id: parseInt(req.params.id, 10),
      new_value: { recipient_email: req.body.recipient_email },
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
      result_status: 'failed',
      result_message: error.message,
    });

    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: error.message,
    });
  }
}

/**
 * Preview verification email template
 *
 * GET /api/admin/settings/email-services/:id/preview-template
 */
async function previewEmailTemplate(req, res) {
  try {
    const { id } = req.params;

    // Get service config
    const service = await EmailService.findById(id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Email service not found',
      });
    }

    // Generate preview HTML (same template as sendVerificationEmail)
    const previewUsername = 'Test User';
    const previewUrl = 'https://example.com/verify?token=preview-token-example';

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
            .preview-notice {
              background-color: #fff3cd;
              border: 1px solid #ffc107;
              color: #856404;
              padding: 10px;
              border-radius: 4px;
              margin-bottom: 20px;
              font-size: 0.9em;
            }
          </style>
        </head>
        <body>
          <div class="preview-notice">
            ⚠️ <strong>Preview Mode</strong> - This is how the verification email will appear to users.
          </div>
          <div class="container">
            <h2>Welcome to Auth System!</h2>
            <p>Hello ${previewUsername},</p>
            <p>Thank you for registering! Please verify your email address by clicking the button below:</p>
            <p style="text-align: center;">
              <a href="${previewUrl}" class="button">Verify Email Address</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #007bff;">${previewUrl}</p>
            <p class="footer">
              This link will expire in 24 hours.<br>
              If you didn't create an account, please ignore this email.
            </p>
          </div>
        </body>
      </html>
    `.trim();

    res.json({
      success: true,
      data: {
        subject: 'Verify Your Email Address',
        html,
        from: {
          email: service.config.from_email,
          name: service.config.from_name,
        },
      },
    });
  } catch (error) {
    console.error('Error generating email preview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate email preview',
      error: error.message,
    });
  }
}

/**
 * Get provider setup instructions
 *
 * GET /api/admin/settings/email-providers/:type/instructions
 */
async function getProviderSetupInstructions(req, res) {
  try {
    const { type } = req.params;

    if (!Object.values(PROVIDER_TYPES).includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid provider type. Must be one of: ${Object.values(PROVIDER_TYPES).join(', ')}`,
      });
    }

    const instructions = getProviderInstructions(type);

    res.json({
      success: true,
      data: instructions,
    });
  } catch (error) {
    console.error('Error getting provider instructions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get provider instructions',
      error: error.message,
    });
  }
}

/**
 * Get settings audit log
 *
 * GET /api/admin/settings/audit-log
 */
async function getSettingsAuditLog(req, res) {
  try {
    const {
      page = 1,
      pageSize = 20,
      admin_id,
      setting_type,
      action,
      target_id,
      start_date,
      end_date,
    } = req.query;

    const result = await SettingsAuditLog.findAll({
      page: parseInt(page, 10),
      pageSize: parseInt(pageSize, 10),
      admin_id: admin_id ? parseInt(admin_id, 10) : undefined,
      setting_type,
      action,
      target_id: target_id ? parseInt(target_id, 10) : undefined,
      start_date: start_date ? new Date(start_date) : undefined,
      end_date: end_date ? new Date(end_date) : undefined,
    });

    res.json({
      success: true,
      data: result.logs,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Error getting settings audit log:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get settings audit log',
      error: error.message,
    });
  }
}

module.exports = {
  getEmailSettings,
  updateEmailSettings,
  getEmailServices,
  getEmailService,
  createEmailService,
  updateEmailService,
  deleteEmailService,
  activateEmailService,
  deactivateEmailService,
  testEmailConnection,
  testSendEmail,
  previewEmailTemplate,
  getProviderSetupInstructions,
  getSettingsAuditLog,
};
