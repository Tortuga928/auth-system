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

module.exports = router;
