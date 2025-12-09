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
const EmailTemplate = require('../models/EmailTemplate');
const UserMFAPreferences = require('../models/UserMFAPreferences');
const Email2FACode = require('../models/Email2FACode');
const AuditLog = require('../models/AuditLog');
const db = require('../db');
const mfaEnforcementService = require('../services/mfaEnforcementService');

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
      admin_email: req.user.email,
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
      admin_email: req.user.email,
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
      admin_email: req.user.email,
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
    const templates = await EmailTemplate.getAll();
    // For MFA context, get the email_2fa_verification template
    const mfaTemplate = templates.find(t => t.template_key === 'email_2fa_verification');

    res.json({
      success: true,
      data: {
        activeTemplate: mfaTemplate,
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
 * PUT /api/admin/mfa/email-template/:key
 */
const updateEmailTemplate = async (req, res) => {
  try {
    const { id: key } = req.params; // key can be template_key or id
    const updates = req.body;

    // Try to update by key (new model uses key)
    const template = await EmailTemplate.updateByKey(key, updates);

    // Log the change
    await AuditLog.create({
      admin_id: req.user.id,
      admin_email: req.user.email,
      action: 'MFA_EMAIL_TEMPLATE_UPDATE',
      target_type: 'email_template',
      target_id: key,
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
 * Set active email template version
 * POST /api/admin/mfa/email-template/:key/activate
 */
const activateEmailTemplate = async (req, res) => {
  try {
    const { id: key } = req.params;
    const { version } = req.body; // 'plain' or 'branded'

    const template = await EmailTemplate.setActiveVersion(key, version || 'branded');

    // Log the change
    await AuditLog.create({
      admin_id: req.user.id,
      admin_email: req.user.email,
      action: 'MFA_EMAIL_TEMPLATE_ACTIVATE',
      target_type: 'email_template',
      target_id: key,
      details: { action: 'activate', version },
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
    });

    res.json({
      success: true,
      message: 'Email template version activated',
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
    const { templateKey, testEmail } = req.body;

    // Get the template - use email_2fa_verification as default for MFA
    const key = templateKey || 'email_2fa_verification';
    const template = await EmailTemplate.getByKey(key);

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
    const rendered = EmailTemplate.render(template, {
      code: testCode,
      expiry_minutes: config.code_expiration_minutes,
      app_name: template.app_name || 'Auth System',
      user_email: testEmail || req.user.email,
      username: req.user.username || req.user.email.split('@')[0],
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
    const { templateKey } = req.body;

    if (templateKey) {
      // Reset single template
      await EmailTemplate.resetSingle(templateKey);
    } else {
      // Reset all templates
      await EmailTemplate.resetAll();
    }

    // Log the reset
    await AuditLog.create({
      admin_id: req.user.id,
      admin_email: req.user.email,
      action: 'MFA_EMAIL_TEMPLATE_RESET',
      target_type: 'email_template',
      target_id: templateKey || 'all',
      details: { action: 'reset_to_defaults', templateKey },
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
    });

    const templates = await EmailTemplate.getAll();

    res.json({
      success: true,
      message: templateKey ? `Template '${templateKey}' reset to defaults` : 'All email templates reset to defaults',
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
      admin_email: req.user.email,
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
      admin_email: req.user.email,
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
      admin_email: req.user.email,
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


/**
 * Get MFA Summary with statistics
 * GET /api/admin/mfa/summary
 */
const getMFASummary = async (req, res) => {
  try {
    // Get current configuration
    const config = await MFAConfig.get();
    const roleConfigs = await MFARoleConfig.getAll();
    const templates = await EmailTemplate.getAll();
    // Get the email_2fa_verification template for MFA context
    const activeTemplate = templates.find(t => t.template_key === 'email_2fa_verification');

    // Get user statistics
    const userStatsQuery = `
      SELECT
        COUNT(*) as total_users,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_users
      FROM users
    `;
    const userStatsResult = await db.query(userStatsQuery);
    const totalUsers = parseInt(userStatsResult.rows[0].total_users) || 0;
    const activeUsers = parseInt(userStatsResult.rows[0].active_users) || 0;

    // Get MFA enabled users (TOTP)
    const mfaTotpQuery = `
      SELECT COUNT(DISTINCT ms.user_id) as count
      FROM mfa_secrets ms
      JOIN users u ON ms.user_id = u.id
      WHERE ms.enabled = true AND u.is_active = true
    `;
    const mfaTotpResult = await db.query(mfaTotpQuery);
    const totpUsers = parseInt(mfaTotpResult.rows[0].count) || 0;

    // Get Email 2FA enabled users
    const mfaEmailQuery = `
      SELECT COUNT(DISTINCT user_id) as count
      FROM user_mfa_preferences
      WHERE email_2fa_enabled = true
    `;
    const mfaEmailResult = await db.query(mfaEmailQuery);
    const email2faUsers = parseInt(mfaEmailResult.rows[0].count) || 0;

    // Get users with both MFA types
    const mfaBothQuery = `
      SELECT COUNT(DISTINCT ms.user_id) as count
      FROM mfa_secrets ms
      JOIN user_mfa_preferences ump ON ms.user_id = ump.user_id
      JOIN users u ON ms.user_id = u.id
      WHERE ms.enabled = true AND ump.email_2fa_enabled = true AND u.is_active = true
    `;
    const mfaBothResult = await db.query(mfaBothQuery);
    const bothMfaUsers = parseInt(mfaBothResult.rows[0].count) || 0;

    // Calculate total MFA users (either TOTP or Email, not double-counting)
    const totalMfaUsers = totpUsers + email2faUsers - bothMfaUsers;
    const mfaAdoptionRate = activeUsers > 0 ? Math.round((totalMfaUsers / activeUsers) * 100) : 0;

    // Get trusted devices count
    const devicesQuery = `
      SELECT COUNT(*) as count
      FROM trusted_devices
      WHERE trusted_until > NOW()
    `;
    const devicesResult = await db.query(devicesQuery);
    const trustedDevices = parseInt(devicesResult.rows[0].count) || 0;

    // Get backup codes statistics
    const backupCodesQuery = `
      SELECT
        COUNT(*) as users_with_codes,
        COUNT(CASE WHEN backup_codes IS NOT NULL AND backup_codes::text != '[]' THEN 1 END) as users_with_remaining
      FROM mfa_secrets
      WHERE enabled = true
    `;
    const backupCodesResult = await db.query(backupCodesQuery);
    const usersWithBackupCodes = parseInt(backupCodesResult.rows[0].users_with_codes) || 0;

    // Get activity statistics (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

    // Current period activity
    const activityCurrentQuery = `
      SELECT
        COUNT(CASE WHEN action IN ('MFA_CODE_SENT', 'MFA_SETUP_COMPLETE') THEN 1 END) as setups,
        COUNT(CASE WHEN action = 'MFA_CODE_VERIFIED' THEN 1 END) as verifications,
        COUNT(CASE WHEN action = 'MFA_CODE_FAILED' THEN 1 END) as failures
      FROM audit_logs
      WHERE created_at >= $1
    `;
    const activityCurrentResult = await db.query(activityCurrentQuery, [sevenDaysAgo]);
    const currentSetups = parseInt(activityCurrentResult.rows[0].setups) || 0;
    const currentVerifications = parseInt(activityCurrentResult.rows[0].verifications) || 0;
    const currentFailures = parseInt(activityCurrentResult.rows[0].failures) || 0;

    // Previous period activity (7-14 days ago)
    const activityPreviousQuery = `
      SELECT
        COUNT(CASE WHEN action IN ('MFA_CODE_SENT', 'MFA_SETUP_COMPLETE') THEN 1 END) as setups,
        COUNT(CASE WHEN action = 'MFA_CODE_VERIFIED' THEN 1 END) as verifications,
        COUNT(CASE WHEN action = 'MFA_CODE_FAILED' THEN 1 END) as failures
      FROM audit_logs
      WHERE created_at >= $1 AND created_at < $2
    `;
    const activityPreviousResult = await db.query(activityPreviousQuery, [fourteenDaysAgo, sevenDaysAgo]);
    const previousSetups = parseInt(activityPreviousResult.rows[0].setups) || 0;
    const previousVerifications = parseInt(activityPreviousResult.rows[0].verifications) || 0;
    const previousFailures = parseInt(activityPreviousResult.rows[0].failures) || 0;

    // Calculate trends
    const calculateTrend = (current, previous) => {
      if (previous === 0) return current > 0 ? 'up' : 'same';
      if (current > previous) return 'up';
      if (current < previous) return 'down';
      return 'same';
    };

    // Get role-based compliance
    const complianceQuery = `
      SELECT
        u.role,
        COUNT(*) as total,
        COUNT(CASE WHEN ms.enabled = true OR ump.email_2fa_enabled = true THEN 1 END) as mfa_enabled
      FROM users u
      LEFT JOIN mfa_secrets ms ON u.id = ms.user_id AND ms.enabled = true
      LEFT JOIN user_mfa_preferences ump ON u.id = ump.user_id AND ump.email_2fa_enabled = true
      WHERE u.is_active = true
      GROUP BY u.role
    `;
    const complianceResult = await db.query(complianceQuery);
    const compliance = complianceResult.rows.map(row => ({
      role: row.role,
      total: parseInt(row.total) || 0,
      mfaEnabled: parseInt(row.mfa_enabled) || 0,
      percentage: parseInt(row.total) > 0 ? Math.round((parseInt(row.mfa_enabled) / parseInt(row.total)) * 100) : 0,
    }));

    res.json({
      success: true,
      data: {
        // Current settings
        settings: {
          general: {
            mfaMode: config.mfa_mode,
            userControlMode: config.user_control_mode,
          },
          email2fa: {
            codeFormat: config.code_format,
            codeExpirationMinutes: config.code_expiration_minutes,
            resendRateLimit: config.resend_rate_limit,
            resendCooldownSeconds: config.resend_cooldown_seconds,
            maxFailedAttempts: config.max_failed_attempts,
            lockoutBehavior: config.lockout_behavior,
            lockoutDurationMinutes: config.lockout_duration_minutes,
            backupCodesEnabledTotp: config.backup_codes_enabled_totp,
            backupCodesEnabledEmail: config.backup_codes_enabled_email,
          },
          deviceTrust: {
            enabled: config.device_trust_enabled,
            durationDays: config.device_trust_duration_days,
            maxDevices: config.max_trusted_devices,
          },
          roles: {
            enabled: config.role_based_mfa_enabled,
            configs: roleConfigs,
          },
          templates: {
            activeTemplate: activeTemplate ? {
              id: activeTemplate.id,
              name: activeTemplate.template_name,
              subject: activeTemplate.subject_line,
            } : null,
            totalTemplates: templates.length,
          },
        },
        // Statistics
        statistics: {
          users: {
            total: activeUsers,
            withMfa: totalMfaUsers,
            adoptionRate: mfaAdoptionRate,
          },
          mfaByType: {
            totp: totpUsers,
            email2fa: email2faUsers,
            both: bothMfaUsers,
          },
          trustedDevices: trustedDevices,
          backupCodes: {
            usersGenerated: usersWithBackupCodes,
          },
        },
        // Activity (last 7 days)
        activity: {
          period: '7 days',
          setups: {
            count: currentSetups,
            trend: calculateTrend(currentSetups, previousSetups),
          },
          verifications: {
            count: currentVerifications,
            trend: calculateTrend(currentVerifications, previousVerifications),
          },
          failures: {
            count: currentFailures,
            trend: calculateTrend(currentFailures, previousFailures),
          },
        },
        // Role compliance
        compliance: compliance,
      },
    });
  } catch (error) {
    console.error('Error getting MFA summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get MFA summary',
      details: error.message,
    });
  }
};

/**
 * Enable MFA enforcement
 * POST /api/admin/mfa/enforcement/enable
 */
const enableEnforcement = async (req, res) => {
  try {
    const { gracePeriodDays } = req.body;

    // Validate grace period
    const days = parseInt(gracePeriodDays) || 14;
    if (days < 1 || days > 90) {
      return res.status(400).json({
        success: false,
        error: 'Grace period must be between 1 and 90 days',
      });
    }

    // Get current config to check if already enabled
    const currentConfig = await MFAConfig.get();
    if (currentConfig.mfa_enforcement_enabled) {
      return res.status(400).json({
        success: false,
        error: 'MFA enforcement is already enabled',
      });
    }

    // Update config to enable enforcement
    await MFAConfig.update({
      mfa_enforcement_enabled: true,
      enforcement_grace_period_days: days,
      enforcement_started_at: new Date().toISOString(),
    });

    // Apply grace period to all existing users who do not have MFA set up
    const affectedUsers = await mfaEnforcementService.applyGracePeriodToExistingUsers(days);

    // Log the action
    await AuditLog.create({
      admin_id: req.user.id,
      admin_email: req.user.email,
      action: 'MFA_ENFORCEMENT_ENABLED',
      target_type: 'system',
      target_id: null,
      details: {
        gracePeriodDays: days,
        affectedUsers: affectedUsers.length,
      },
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
    });

    res.json({
      success: true,
      message: 'MFA enforcement enabled successfully',
      data: {
        gracePeriodDays: days,
        enforcementStartedAt: new Date().toISOString(),
        affectedUsers: affectedUsers.length,
      },
    });
  } catch (error) {
    console.error('Error enabling MFA enforcement:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to enable MFA enforcement',
      details: error.message,
    });
  }
};

/**
 * Disable MFA enforcement
 * POST /api/admin/mfa/enforcement/disable
 */
const disableEnforcement = async (req, res) => {
  try {
    // Get current config
    const currentConfig = await MFAConfig.get();
    if (!currentConfig.mfa_enforcement_enabled) {
      return res.status(400).json({
        success: false,
        error: 'MFA enforcement is already disabled',
      });
    }

    // Update config to disable enforcement
    await MFAConfig.update({
      mfa_enforcement_enabled: false,
    });

    // Log the action
    await AuditLog.create({
      admin_id: req.user.id,
      admin_email: req.user.email,
      action: 'MFA_ENFORCEMENT_DISABLED',
      target_type: 'system',
      target_id: null,
      details: { action: 'disable_enforcement' },
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
    });

    res.json({
      success: true,
      message: 'MFA enforcement disabled successfully',
    });
  } catch (error) {
    console.error('Error disabling MFA enforcement:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to disable MFA enforcement',
      details: error.message,
    });
  }
};

/**
 * Update grace period for MFA enforcement
 * PUT /api/admin/mfa/enforcement/grace-period
 */
const updateGracePeriod = async (req, res) => {
  try {
    const { gracePeriodDays, applyToExisting } = req.body;

    // Validate grace period
    const days = parseInt(gracePeriodDays);
    if (!days || days < 1 || days > 90) {
      return res.status(400).json({
        success: false,
        error: 'Grace period must be between 1 and 90 days',
      });
    }

    // Update config
    await MFAConfig.update({
      enforcement_grace_period_days: days,
    });

    let affectedUsers = [];
    if (applyToExisting) {
      // Recalculate grace periods for users still in grace period
      affectedUsers = await mfaEnforcementService.applyGracePeriodToExistingUsers(days);
    }

    // Log the action
    await AuditLog.create({
      admin_id: req.user.id,
      admin_email: req.user.email,
      action: 'MFA_GRACE_PERIOD_UPDATE',
      target_type: 'system',
      target_id: null,
      details: {
        gracePeriodDays: days,
        applyToExisting: applyToExisting || false,
        affectedUsers: affectedUsers.length,
      },
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
    });

    res.json({
      success: true,
      message: 'Grace period updated successfully',
      data: {
        gracePeriodDays: days,
        affectedUsers: affectedUsers.length,
      },
    });
  } catch (error) {
    console.error('Error updating grace period:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update grace period',
      details: error.message,
    });
  }
};

/**
 * Get enforcement statistics
 * GET /api/admin/mfa/enforcement/stats
 */
const getEnforcementStats = async (req, res) => {
  try {
    const stats = await mfaEnforcementService.getEnforcementStatistics();
    const config = await MFAConfig.get();

    res.json({
      success: true,
      data: {
        enforcementEnabled: config.mfa_enforcement_enabled,
        gracePeriodDays: config.enforcement_grace_period_days,
        enforcementStartedAt: config.enforcement_started_at,
        ...stats,
      },
    });
  } catch (error) {
    console.error('Error getting enforcement stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get enforcement statistics',
      details: error.message,
    });
  }
};

/**
 * Update role exemption from MFA enforcement
 * PUT /api/admin/mfa/enforcement/role-exemption/:role
 */
const updateRoleExemption = async (req, res) => {
  try {
    const { role } = req.params;
    const { exempt } = req.body;

    // Validate role
    if (!MFARoleConfig.VALID_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        error: `Invalid role. Must be one of: ${MFARoleConfig.VALID_ROLES.join(', ')}`,
      });
    }

    // Update role config
    await MFARoleConfig.update(role, { exempt_from_mfa: exempt === true });

    // Log the action
    await AuditLog.create({
      admin_id: req.user.id,
      admin_email: req.user.email,
      action: 'MFA_ROLE_EXEMPTION_UPDATE',
      target_type: 'role',
      target_id: null,
      details: {
        role,
        exempt: exempt === true,
      },
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
    });

    res.json({
      success: true,
      message: `Role ${role} ${exempt ? 'exempted from' : 'no longer exempted from'} MFA enforcement`,
      data: {
        role,
        exempt: exempt === true,
      },
    });
  } catch (error) {
    console.error('Error updating role exemption:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update role exemption',
      details: error.message,
    });
  }
};

/**
 * Get users with pending MFA setup (enforcement view)
 * GET /api/admin/mfa/enforcement/pending-users
 */
const getPendingMFAUsers = async (req, res) => {
  try {
    const { status } = req.query; // 'all', 'grace_period', 'expired'

    let whereClause = 'WHERE u.mfa_setup_required = true AND u.mfa_setup_completed = false AND u.is_active = true';
    if (status === 'grace_period') {
      whereClause += ' AND u.mfa_grace_period_end > NOW()';
    } else if (status === 'expired') {
      whereClause += ' AND (u.mfa_grace_period_end IS NULL OR u.mfa_grace_period_end <= NOW())';
    }

    const query = `
      SELECT
        u.id,
        u.username,
        u.email,
        u.role,
        u.mfa_grace_period_start,
        u.mfa_grace_period_end,
        u.created_at,
        CASE
          WHEN u.mfa_grace_period_end IS NULL THEN 'no_grace_period'
          WHEN u.mfa_grace_period_end > NOW() THEN 'in_grace_period'
          ELSE 'grace_period_expired'
        END as grace_status,
        CASE
          WHEN u.mfa_grace_period_end > NOW()
          THEN EXTRACT(EPOCH FROM (u.mfa_grace_period_end - NOW())) / 86400
          ELSE 0
        END as days_remaining
      FROM users u
      ${whereClause}
      ORDER BY u.mfa_grace_period_end ASC NULLS FIRST
    `;

    const result = await db.query(query);

    res.json({
      success: true,
      data: {
        users: result.rows.map(row => ({
          id: row.id,
          username: row.username,
          email: row.email,
          role: row.role,
          gracePeriodStart: row.mfa_grace_period_start,
          gracePeriodEnd: row.mfa_grace_period_end,
          createdAt: row.created_at,
          graceStatus: row.grace_status,
          daysRemaining: Math.max(0, Math.ceil(parseFloat(row.days_remaining) || 0)),
        })),
        count: result.rows.length,
      },
    });
  } catch (error) {
    console.error('Error getting pending MFA users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get pending MFA users',
      details: error.message,
    });
  }
};

/**
 * Grant grace period extension to a user
 * POST /api/admin/mfa/enforcement/extend-grace/:userId
 */
const extendUserGracePeriod = async (req, res) => {
  try {
    const { userId } = req.params;
    const { additionalDays } = req.body;

    // Validate days
    const days = parseInt(additionalDays);
    if (!days || days < 1 || days > 30) {
      return res.status(400).json({
        success: false,
        error: 'Additional days must be between 1 and 30',
      });
    }

    // Get user
    const userQuery = 'SELECT * FROM users WHERE id = $1';
    const userResult = await db.query(userQuery, [userId]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const user = userResult.rows[0];

    // Calculate new grace period end
    const currentEnd = user.mfa_grace_period_end ? new Date(user.mfa_grace_period_end) : new Date();
    const baseDate = currentEnd > new Date() ? currentEnd : new Date();
    const newEnd = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);

    // Update user
    const updateQuery = `
      UPDATE users
      SET mfa_grace_period_end = $1
      WHERE id = $2
      RETURNING *
    `;
    await db.query(updateQuery, [newEnd.toISOString(), userId]);

    // Log the action
    await AuditLog.create({
      admin_id: req.user.id,
      admin_email: req.user.email,
      action: 'MFA_GRACE_PERIOD_EXTENDED',
      target_type: 'user',
      target_id: parseInt(userId),
      details: {
        additionalDays: days,
        newGracePeriodEnd: newEnd.toISOString(),
      },
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
    });

    res.json({
      success: true,
      message: `Grace period extended by ${days} days`,
      data: {
        userId: parseInt(userId),
        newGracePeriodEnd: newEnd.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error extending grace period:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to extend grace period',
      details: error.message,
    });
  }
};

module.exports = {
  // Summary endpoint
  getMFASummary,

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

  // MFA Enforcement endpoints
  enableEnforcement,
  disableEnforcement,
  updateGracePeriod,
  getEnforcementStats,
  updateRoleExemption,
  getPendingMFAUsers,
  extendUserGracePeriod,
};
