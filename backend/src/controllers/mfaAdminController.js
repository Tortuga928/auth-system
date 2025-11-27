/**
 * MFA Admin Controller
 *
 * Handles administrative MFA configuration endpoints
 * All routes require admin or super_admin role
 *
 * Endpoints:
 * - GET/PUT /api/admin/mfa/config - System-wide MFA configuration
 * - GET/PUT /api/admin/mfa/roles/:role - Role-based MFA configuration
 * - GET/PUT/POST /api/admin/mfa/email-template - Email template management
 * - POST /api/admin/mfa/apply-change - Apply MFA method changes
 * - GET /api/admin/mfa/pending-transitions - View users in transition
 * - POST /api/admin/mfa/force-transition/:userId - Force user transition
 * - POST /api/admin/users/:id/unlock-mfa - Unlock MFA for user
 */

const MFAConfig = require('../models/MFAConfig');
const MFARoleConfig = require('../models/MFARoleConfig');
const MFAEmailTemplate = require('../models/MFAEmailTemplate');
const UserMFAPreferences = require('../models/UserMFAPreferences');
const Email2FACode = require('../models/Email2FACode');
const AuditLog = require('../models/AuditLog');

/**
 * Get current MFA configuration
 * GET /api/admin/mfa/config
 */
const getMFAConfig = async (req, res) => {
  try {
    const config = await MFAConfig.get();

    res.json({
      success: true,
      data: {
        config,
        availableModes: MFAConfig.MFA_MODES,
        availableLockoutBehaviors: MFAConfig.LOCKOUT_BEHAVIORS,
        availableCodeFormats: MFAConfig.CODE_FORMATS,
        availableUserControlModes: MFAConfig.USER_CONTROL_MODES,
        availableMethodChangeBehaviors: MFAConfig.METHOD_CHANGE_BEHAVIORS,
        availableTestModes: MFAConfig.TEST_MODES,
        availableLoggingLevels: MFAConfig.LOGGING_LEVELS,
        availableNotificationLevels: MFAConfig.NOTIFICATION_LEVELS,
      },
    });
  } catch (error) {
    console.error('Error getting MFA config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get MFA configuration',
      details: error.message,
    });
  }
};

/**
 * Update MFA configuration
 * PUT /api/admin/mfa/config
 */
const updateMFAConfig = async (req, res) => {
  try {
    const updates = req.body;

    // Validate that we have something to update
    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No configuration updates provided',
      });
    }

    const config = await MFAConfig.update(updates);

    // Log the configuration change
    await AuditLog.create({
      admin_id: req.user.id,
      action: 'MFA_CONFIG_UPDATE',
      target_type: 'system',
      target_id: null,
      details: {
        updates,
        previousMode: req.body._previousMode, // Optional: sent by frontend
      },
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
    });

    res.json({
      success: true,
      message: 'MFA configuration updated successfully',
      data: { config },
    });
  } catch (error) {
    console.error('Error updating MFA config:', error);
    res.status(400).json({
      success: false,
      error: 'Failed to update MFA configuration',
      details: error.message,
    });
  }
};

/**
 * Reset MFA configuration to defaults
 * POST /api/admin/mfa/config/reset
 */
const resetMFAConfig = async (req, res) => {
  try {
    const config = await MFAConfig.reset();

    // Log the reset
    await AuditLog.create({
      admin_id: req.user.id,
      action: 'MFA_CONFIG_RESET',
      target_type: 'system',
      target_id: null,
      details: { action: 'reset_to_defaults' },
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
    });

    res.json({
      success: true,
      message: 'MFA configuration reset to defaults',
      data: { config },
    });
  } catch (error) {
    console.error('Error resetting MFA config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset MFA configuration',
      details: error.message,
    });
  }
};

/**
 * Get all role-based MFA configurations
 * GET /api/admin/mfa/roles
 */
const getMFARoleConfigs = async (req, res) => {
  try {
    const roles = await MFARoleConfig.getAll();

    res.json({
      success: true,
      data: {
        roles,
        validRoles: MFARoleConfig.VALID_ROLES,
        validMethods: MFARoleConfig.VALID_METHODS,
      },
    });
  } catch (error) {
    console.error('Error getting MFA role configs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get role configurations',
      details: error.message,
    });
  }
};

/**
 * Update MFA configuration for a specific role
 * PUT /api/admin/mfa/roles/:role
 */
const updateMFARoleConfig = async (req, res) => {
  try {
    const { role } = req.params;
    const updates = req.body;

    if (!MFARoleConfig.VALID_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        error: `Invalid role. Must be one of: ${MFARoleConfig.VALID_ROLES.join(', ')}`,
      });
    }

    const config = await MFARoleConfig.update(role, updates);

    // Log the change
    await AuditLog.create({
      admin_id: req.user.id,
      action: 'MFA_ROLE_CONFIG_UPDATE',
      target_type: 'role',
      target_id: null,
      details: { role, updates },
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
    });

    res.json({
      success: true,
      message: `MFA configuration for ${role} role updated successfully`,
      data: { config },
    });
  } catch (error) {
    console.error('Error updating MFA role config:', error);
    res.status(400).json({
      success: false,
      error: 'Failed to update role configuration',
      details: error.message,
    });
  }
};

/**
 * Get active email template
 * GET /api/admin/mfa/email-template
 */
const getEmailTemplate = async (req, res) => {
  try {
    const templates = await MFAEmailTemplate.getAll();
    const activeTemplate = templates.find(t => t.is_active);

    res.json({
      success: true,
      data: {
        activeTemplate,
        templates,
      },
    });
  } catch (error) {
    console.error('Error getting email template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get email template',
      details: error.message,
    });
  }
};

/**
 * Update email template
 * PUT /api/admin/mfa/email-template/:id
 */
const updateEmailTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const template = await MFAEmailTemplate.update(parseInt(id), updates);

    // Log the change
    await AuditLog.create({
      admin_id: req.user.id,
      action: 'MFA_EMAIL_TEMPLATE_UPDATE',
      target_type: 'email_template',
      target_id: parseInt(id),
      details: { updates },
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
    });

    res.json({
      success: true,
      message: 'Email template updated successfully',
      data: { template },
    });
  } catch (error) {
    console.error('Error updating email template:', error);
    res.status(400).json({
      success: false,
      error: 'Failed to update email template',
      details: error.message,
    });
  }
};

/**
 * Set active email template
 * POST /api/admin/mfa/email-template/:id/activate
 */
const activateEmailTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    const template = await MFAEmailTemplate.setActive(parseInt(id));

    // Log the change
    await AuditLog.create({
      admin_id: req.user.id,
      action: 'MFA_EMAIL_TEMPLATE_ACTIVATE',
      target_type: 'email_template',
      target_id: parseInt(id),
      details: { action: 'activate' },
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
    });

    res.json({
      success: true,
      message: 'Email template activated',
      data: { template },
    });
  } catch (error) {
    console.error('Error activating email template:', error);
    res.status(400).json({
      success: false,
      error: 'Failed to activate email template',
      details: error.message,
    });
  }
};

/**
 * Send preview email to admin
 * POST /api/admin/mfa/email-template/preview
 */
const previewEmailTemplate = async (req, res) => {
  try {
    const { templateId, testEmail } = req.body;

    // Get the template
    const template = templateId
      ? await MFAEmailTemplate.getById(templateId)
      : await MFAEmailTemplate.getActive();

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found',
      });
    }

    // Get MFA config for expiry time
    const config = await MFAConfig.get();

    // Generate test code
    const testCode = Email2FACode.generateCode(config.code_format);

    // Render the template
    const rendered = MFAEmailTemplate.render(template, {
      code: testCode,
      expiry_minutes: config.code_expiration_minutes,
      app_name: template.app_name || 'Auth System',
      user_email: testEmail || req.user.email,
    });

    // TODO: Actually send the email using EmailService when integrated
    // For now, just return the rendered preview

    res.json({
      success: true,
      message: 'Preview generated (email sending not yet implemented)',
      data: {
        subject: rendered.subject,
        htmlBody: rendered.htmlBody,
        textBody: rendered.textBody,
        testCode, // Include test code so admin can see what it looks like
      },
    });
  } catch (error) {
    console.error('Error previewing email template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate preview',
      details: error.message,
    });
  }
};

/**
 * Reset email templates to defaults
 * POST /api/admin/mfa/email-template/reset
 */
const resetEmailTemplates = async (req, res) => {
  try {
    await MFAEmailTemplate.resetToDefaults();

    // Log the reset
    await AuditLog.create({
      admin_id: req.user.id,
      action: 'MFA_EMAIL_TEMPLATE_RESET',
      target_type: 'email_template',
      target_id: null,
      details: { action: 'reset_to_defaults' },
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
    });

    const templates = await MFAEmailTemplate.getAll();

    res.json({
      success: true,
      message: 'Email templates reset to defaults',
      data: { templates },
    });
  } catch (error) {
    console.error('Error resetting email templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset email templates',
      details: error.message,
    });
  }
};

/**
 * Get users with pending MFA method transitions
 * GET /api/admin/mfa/pending-transitions
 */
const getPendingTransitions = async (req, res) => {
  try {
    const users = await UserMFAPreferences.getUsersWithPendingChanges();

    res.json({
      success: true,
      data: {
        users,
        count: users.length,
      },
    });
  } catch (error) {
    console.error('Error getting pending transitions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get pending transitions',
      details: error.message,
    });
  }
};

/**
 * Force a user to transition to new MFA method
 * POST /api/admin/mfa/force-transition/:userId
 */
const forceTransition = async (req, res) => {
  try {
    const { userId } = req.params;

    // Clear any pending change - user must set up new method on next login
    await UserMFAPreferences.clearPendingMethodChange(parseInt(userId));

    // Log the action
    await AuditLog.create({
      admin_id: req.user.id,
      action: 'MFA_FORCE_TRANSITION',
      target_type: 'user',
      target_id: parseInt(userId),
      details: { action: 'force_transition' },
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
    });

    res.json({
      success: true,
      message: 'User transition forced. User must set up new MFA method on next login.',
    });
  } catch (error) {
    console.error('Error forcing transition:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to force transition',
      details: error.message,
    });
  }
};

/**
 * Unlock MFA for a user (reset failed attempts and lockout)
 * POST /api/admin/users/:id/unlock-mfa
 */
const unlockUserMFA = async (req, res) => {
  try {
    const { id } = req.params;

    // Unlock email 2FA codes
    await Email2FACode.unlock(parseInt(id));

    // Log the action
    await AuditLog.create({
      admin_id: req.user.id,
      action: 'MFA_UNLOCK_USER',
      target_type: 'user',
      target_id: parseInt(id),
      details: { action: 'unlock_mfa' },
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
    });

    res.json({
      success: true,
      message: 'User MFA unlocked successfully',
    });
  } catch (error) {
    console.error('Error unlocking user MFA:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unlock user MFA',
      details: error.message,
    });
  }
};

/**
 * Apply MFA method change to all users
 * POST /api/admin/mfa/apply-change
 */
const applyMethodChange = async (req, res) => {
  try {
    const { behavior, gracePeriodDays } = req.body;
    const config = await MFAConfig.get();

    if (!['immediate', 'grace_period', 'grandfathered'].includes(behavior)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid behavior. Must be: immediate, grace_period, or grandfathered',
      });
    }

    // Update config with the behavior
    await MFAConfig.update({
      method_change_behavior: behavior,
      grace_period_days: gracePeriodDays || config.grace_period_days,
    });

    // Log the change
    await AuditLog.create({
      admin_id: req.user.id,
      action: 'MFA_APPLY_METHOD_CHANGE',
      target_type: 'system',
      target_id: null,
      details: { behavior, gracePeriodDays },
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
    });

    // TODO: Implement actual user transition logic based on behavior
    // For now, just acknowledge the configuration update

    res.json({
      success: true,
      message: `Method change behavior set to: ${behavior}`,
      data: {
        behavior,
        gracePeriodDays: behavior === 'grace_period' ? (gracePeriodDays || config.grace_period_days) : null,
      },
    });
  } catch (error) {
    console.error('Error applying method change:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to apply method change',
      details: error.message,
    });
  }
};

module.exports = {
  // Config endpoints
  getMFAConfig,
  updateMFAConfig,
  resetMFAConfig,

  // Role config endpoints
  getMFARoleConfigs,
  updateMFARoleConfig,

  // Email template endpoints
  getEmailTemplate,
  updateEmailTemplate,
  activateEmailTemplate,
  previewEmailTemplate,
  resetEmailTemplates,

  // Transition management
  getPendingTransitions,
  forceTransition,
  applyMethodChange,

  // User MFA management
  unlockUserMFA,
};
