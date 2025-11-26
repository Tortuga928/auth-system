/**
 * Settings Routes
 *
 * System settings and email service configuration endpoints
 * All routes require Super Admin access
 */

const express = require('express');
const router = express.Router();
const { authenticate, isSuperAdmin } = require('../middleware/auth');
const settingsController = require('../controllers/settingsController');

// All settings routes require authentication and super admin role
router.use(authenticate);
router.use(isSuperAdmin);

// ====================
// Email Settings
// ====================

/**
 * @route GET /api/admin/settings/email
 * @desc Get email verification settings
 * @access Super Admin
 */
router.get('/email', settingsController.getEmailSettings);

/**
 * @route PUT /api/admin/settings/email
 * @desc Update email verification settings
 * @access Super Admin
 */
router.put('/email', settingsController.updateEmailSettings);

// ====================
// Email Services CRUD
// ====================

/**
 * @route GET /api/admin/settings/email-services
 * @desc Get all email service configurations
 * @access Super Admin
 */
router.get('/email-services', settingsController.getEmailServices);

/**
 * @route POST /api/admin/settings/email-services
 * @desc Create a new email service configuration
 * @access Super Admin
 */
router.post('/email-services', settingsController.createEmailService);

/**
 * @route GET /api/admin/settings/email-services/:id
 * @desc Get a single email service configuration
 * @access Super Admin
 */
router.get('/email-services/:id', settingsController.getEmailService);

/**
 * @route PUT /api/admin/settings/email-services/:id
 * @desc Update an email service configuration
 * @access Super Admin
 */
router.put('/email-services/:id', settingsController.updateEmailService);

/**
 * @route DELETE /api/admin/settings/email-services/:id
 * @desc Delete an email service configuration
 * @access Super Admin
 */
router.delete('/email-services/:id', settingsController.deleteEmailService);

// ====================
// Email Service Actions
// ====================

/**
 * @route POST /api/admin/settings/email-services/:id/activate
 * @desc Activate an email service (set as active provider)
 * @access Super Admin
 */
router.post('/email-services/:id/activate', settingsController.activateEmailService);

/**
 * @route POST /api/admin/settings/email-services/:id/deactivate
 * @desc Deactivate an email service
 * @access Super Admin
 */
router.post('/email-services/:id/deactivate', settingsController.deactivateEmailService);

/**
 * @route POST /api/admin/settings/email-services/:id/test-connection
 * @desc Test email service connection
 * @access Super Admin
 */
router.post('/email-services/:id/test-connection', settingsController.testEmailConnection);

/**
 * @route POST /api/admin/settings/email-services/:id/test-send
 * @desc Send a test email
 * @access Super Admin
 */
router.post('/email-services/:id/test-send', settingsController.testSendEmail);

/**
 * @route GET /api/admin/settings/email-services/:id/preview-template
 * @desc Preview verification email template
 * @access Super Admin
 */
router.get('/email-services/:id/preview-template', settingsController.previewEmailTemplate);

// ====================
// Provider Instructions
// ====================

/**
 * @route GET /api/admin/settings/email-providers/:type/instructions
 * @desc Get provider setup instructions
 * @access Super Admin
 */
router.get('/email-providers/:type/instructions', settingsController.getProviderSetupInstructions);

// ====================
// Audit Log
// ====================

/**
 * @route GET /api/admin/settings/audit-log
 * @desc Get settings audit log
 * @access Super Admin
 */
router.get('/audit-log', settingsController.getSettingsAuditLog);

module.exports = router;
