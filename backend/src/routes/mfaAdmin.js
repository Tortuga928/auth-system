/**
 * MFA Admin Routes
 *
 * Routes for MFA configuration management
 * All routes require admin or super_admin role
 */

const express = require('express');
const router = express.Router();
const { authenticate, isAdmin, isSuperAdmin } = require('../middleware/auth');
const mfaAdminController = require('../controllers/mfaAdminController');

// Apply authentication to all MFA admin routes
router.use(authenticate);

// ============================================
// MFA SUMMARY
// ============================================

/**
 * @route   GET /api/admin/mfa/summary
 * @desc    Get MFA summary with all settings and statistics
 * @access  Admin
 *
 * Returns current settings overview, user statistics, activity trends, and compliance data
 */
router.get('/summary', isAdmin, mfaAdminController.getMFASummary);


// ============================================
// SYSTEM-WIDE MFA CONFIGURATION
// ============================================

/**
 * @route   GET /api/admin/mfa/config
 * @desc    Get current system-wide MFA configuration
 * @access  Admin
 *
 * Returns MFA mode, code settings, lockout settings, and all configurable options
 */
router.get('/config', isAdmin, mfaAdminController.getMFAConfig);

/**
 * @route   PUT /api/admin/mfa/config
 * @desc    Update system-wide MFA configuration
 * @body    Any valid MFA config fields (mfa_mode, code_expiration_minutes, etc.)
 * @access  Admin
 *
 * Updates MFA configuration and logs the change
 */
router.put('/config', isAdmin, mfaAdminController.updateMFAConfig);

/**
 * @route   POST /api/admin/mfa/config/reset
 * @desc    Reset MFA configuration to defaults
 * @access  Super Admin
 *
 * Resets all MFA configuration to factory defaults (MFA disabled)
 */
router.post('/config/reset', isSuperAdmin, mfaAdminController.resetMFAConfig);

// ============================================
// ROLE-BASED MFA CONFIGURATION
// ============================================

/**
 * @route   GET /api/admin/mfa/roles
 * @desc    Get all role-based MFA configurations
 * @access  Admin
 *
 * Returns MFA settings for user, admin, and super_admin roles
 */
router.get('/roles', isAdmin, mfaAdminController.getMFARoleConfigs);

/**
 * @route   PUT /api/admin/mfa/roles/:role
 * @desc    Update MFA configuration for a specific role
 * @param   role - Role name (user, admin, super_admin)
 * @body    { mfa_required, allowed_methods, code_expiration_minutes, etc. }
 * @access  Admin (super_admin for changing super_admin role config)
 *
 * Updates role-specific MFA requirements and settings
 */
router.put('/roles/:role', isAdmin, mfaAdminController.updateMFARoleConfig);

// ============================================
// EMAIL TEMPLATE MANAGEMENT
// ============================================

/**
 * @route   GET /api/admin/mfa/email-template
 * @desc    Get all email templates
 * @access  Admin
 *
 * Returns active template and all available templates
 */
router.get('/email-template', isAdmin, mfaAdminController.getEmailTemplate);

/**
 * @route   PUT /api/admin/mfa/email-template/:id
 * @desc    Update an email template
 * @param   id - Template ID
 * @body    Template fields (subject_line, message_body, custom_html, etc.)
 * @access  Admin
 *
 * Updates template content and styling
 */
router.put('/email-template/:id', isAdmin, mfaAdminController.updateEmailTemplate);

/**
 * @route   POST /api/admin/mfa/email-template/:id/activate
 * @desc    Set a template as the active template
 * @param   id - Template ID
 * @access  Admin
 *
 * Activates specified template, deactivates all others
 */
router.post('/email-template/:id/activate', isAdmin, mfaAdminController.activateEmailTemplate);

/**
 * @route   POST /api/admin/mfa/email-template/preview
 * @desc    Generate preview of email template
 * @body    { templateId (optional), testEmail (optional) }
 * @access  Admin
 *
 * Returns rendered subject, HTML body, and text body
 */
router.post('/email-template/preview', isAdmin, mfaAdminController.previewEmailTemplate);

/**
 * @route   POST /api/admin/mfa/email-template/reset
 * @desc    Reset email templates to defaults
 * @access  Super Admin
 *
 * Deletes all custom templates and restores default plain/branded templates
 */
router.post('/email-template/reset', isSuperAdmin, mfaAdminController.resetEmailTemplates);

// ============================================
// METHOD CHANGE MANAGEMENT
// ============================================

/**
 * @route   POST /api/admin/mfa/apply-change
 * @desc    Apply MFA method change configuration
 * @body    { behavior: 'immediate'|'grace_period'|'grandfathered', gracePeriodDays }
 * @access  Admin
 *
 * Sets how existing users are handled when MFA method changes
 */
router.post('/apply-change', isAdmin, mfaAdminController.applyMethodChange);

/**
 * @route   GET /api/admin/mfa/pending-transitions
 * @desc    Get users with pending MFA method transitions
 * @access  Admin
 *
 * Returns list of users who need to set up new MFA method
 */
router.get('/pending-transitions', isAdmin, mfaAdminController.getPendingTransitions);

/**
 * @route   POST /api/admin/mfa/force-transition/:userId
 * @desc    Force a user to complete MFA transition immediately
 * @param   userId - User ID
 * @access  Admin
 *
 * Clears grace period for specific user, requires immediate setup
 */
router.post('/force-transition/:userId', isAdmin, mfaAdminController.forceTransition);

// ============================================
// USER MFA MANAGEMENT
// ============================================

/**
 * @route   POST /api/admin/mfa/users/:id/unlock
 * @desc    Unlock MFA for a user (reset failed attempts)
 * @param   id - User ID
 * @access  Admin
 *
 * Resets failed attempt count and clears any lockout
 */
router.post('/users/:id/unlock', isAdmin, mfaAdminController.unlockUserMFA);

// ============================================
// MFA ENFORCEMENT MANAGEMENT
// ============================================

/**
 * @route   POST /api/admin/mfa/enforcement/enable
 * @desc    Enable MFA enforcement for all users
 * @body    { gracePeriodDays: number (1-90) }
 * @access  Super Admin
 *
 * Enables mandatory MFA setup with grace period for existing users
 */
router.post('/enforcement/enable', isSuperAdmin, mfaAdminController.enableEnforcement);

/**
 * @route   POST /api/admin/mfa/enforcement/disable
 * @desc    Disable MFA enforcement
 * @access  Super Admin
 *
 * Disables mandatory MFA requirement (users can still opt-in)
 */
router.post('/enforcement/disable', isSuperAdmin, mfaAdminController.disableEnforcement);

/**
 * @route   PUT /api/admin/mfa/enforcement/grace-period
 * @desc    Update grace period settings
 * @body    { gracePeriodDays: number (1-90), applyToExisting: boolean }
 * @access  Super Admin
 *
 * Updates grace period duration, optionally applies to existing users
 */
router.put('/enforcement/grace-period', isSuperAdmin, mfaAdminController.updateGracePeriod);

/**
 * @route   GET /api/admin/mfa/enforcement/stats
 * @desc    Get MFA enforcement statistics
 * @access  Admin
 *
 * Returns enforcement status and user compliance statistics
 */
router.get('/enforcement/stats', isAdmin, mfaAdminController.getEnforcementStats);

/**
 * @route   PUT /api/admin/mfa/enforcement/role-exemption/:role
 * @desc    Update role exemption from MFA enforcement
 * @param   role - Role name (user, admin, super_admin)
 * @body    { exempt: boolean }
 * @access  Super Admin
 *
 * Exempts or includes role from MFA enforcement requirement
 */
router.put('/enforcement/role-exemption/:role', isSuperAdmin, mfaAdminController.updateRoleExemption);

/**
 * @route   GET /api/admin/mfa/enforcement/pending-users
 * @desc    Get users with pending MFA setup
 * @query   status - Filter: 'all' | 'grace_period' | 'expired'
 * @access  Admin
 *
 * Returns list of users who need to complete MFA setup
 */
router.get('/enforcement/pending-users', isAdmin, mfaAdminController.getPendingMFAUsers);

/**
 * @route   POST /api/admin/mfa/enforcement/extend-grace/:userId
 * @desc    Extend grace period for a specific user
 * @param   userId - User ID
 * @body    { additionalDays: number (1-30) }
 * @access  Admin
 *
 * Grants additional time for user to complete MFA setup
 */
router.post('/enforcement/extend-grace/:userId', isAdmin, mfaAdminController.extendUserGracePeriod);

module.exports = router;
