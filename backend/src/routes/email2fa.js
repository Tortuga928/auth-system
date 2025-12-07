/**
 * Email 2FA Routes
 *
 * Routes for email-based two-factor authentication.
 * Some routes require authentication, others are used during login flow.
 */

const express = require('express');
const router = express.Router();
const { authenticate, optionalAuth } = require('../middleware/auth');
const email2FAController = require('../controllers/email2FAController');

// ============================================
// PUBLIC/LOGIN FLOW ROUTES
// (Used during login when user isn't fully authenticated yet)
// ============================================

/**
 * @route   POST /api/auth/mfa/email/request
 * @desc    Request a verification code (during login)
 * @body    { userId, email, username? }
 * @access  Public (used during login flow)
 *
 * Called when email MFA is required during login.
 * User provides userId from partial login state.
 */
router.post('/email/request', email2FAController.requestCode);

/**
 * @route   POST /api/auth/mfa/email/verify
 * @desc    Verify a code (during login)
 * @body    { userId, code, email? }
 * @access  Public (used during login flow)
 *
 * Called to verify the code and complete login.
 */
router.post('/email/verify', email2FAController.verifyCode);

/**
 * @route   POST /api/auth/mfa/email/resend
 * @desc    Resend verification code
 * @body    { userId, email, username? }
 * @access  Public (used during login flow)
 *
 * Called when user needs a new code sent.
 */
router.post('/email/resend', email2FAController.resendCode);

/**
 * @route   GET /api/auth/mfa/config
 * @desc    Get public MFA configuration
 * @access  Public
 *
 * Returns sanitized MFA config for frontend display.
 */
router.get('/config', email2FAController.getPublicConfig);

// ============================================
// AUTHENTICATED ROUTES
// (Used for user MFA preference management)
// ============================================

/**
 * @route   GET /api/auth/mfa/status
 * @desc    Get MFA status for current user
 * @access  Authenticated
 *
 * Returns user's MFA settings and requirements.
 */
router.get('/status', authenticate, email2FAController.getStatus);

/**
 * @route   POST /api/auth/mfa/email/enable
 * @desc    Enable email 2FA for current user
 * @body    { setAsPreferred? }
 * @access  Authenticated
 *
 * Enables email 2FA and optionally sets it as preferred method.
 */
router.post('/email/enable', authenticate, email2FAController.enableEmail2FA);

/**
 * @route   POST /api/auth/mfa/email/disable
 * @desc    Disable email 2FA for current user
 * @access  Authenticated
 *
 * Disables email 2FA (if allowed by admin config).
 */
router.post('/email/disable', authenticate, email2FAController.disableEmail2FA);

/**
 * @route   POST /api/auth/mfa/email/alternate
 * @desc    Set alternate email for 2FA
 * @body    { alternateEmail }
 * @access  Authenticated
 *
 * Sets a backup email address for receiving codes.
 */
router.post('/email/alternate', authenticate, email2FAController.setAlternateEmail);

/**
 * @route   POST /api/auth/mfa/email/alternate/verify
 * @desc    Verify alternate email
 * @body    { code }
 * @access  Authenticated
 *
 * Verifies the alternate email with the sent code.
 */
router.post('/email/alternate/verify', authenticate, email2FAController.verifyAlternateEmail);

/**
 * @route   DELETE /api/auth/mfa/email/alternate
 * @desc    Remove alternate email
 * @access  Authenticated
 *
 * Removes the alternate email from user preferences.
 */
router.delete('/email/alternate', authenticate, email2FAController.removeAlternateEmail);


// ============================================
// TRUSTED DEVICES ROUTES
// ============================================

/**
 * @route   GET /api/auth/mfa/trusted-devices
 * @desc    Get all trusted devices for current user
 * @access  Authenticated
 */
router.get('/trusted-devices', authenticate, email2FAController.getTrustedDevices);

/**
 * @route   DELETE /api/auth/mfa/trusted-devices/:deviceId
 * @desc    Remove a specific trusted device
 * @access  Authenticated
 */
router.delete('/trusted-devices/:deviceId', authenticate, email2FAController.removeTrustedDevice);

/**
 * @route   DELETE /api/auth/mfa/trusted-devices
 * @desc    Remove all trusted devices
 * @access  Authenticated
 */
router.delete('/trusted-devices', authenticate, email2FAController.removeAllTrustedDevices);

// ============================================
// MFA PREFERENCES ROUTES
// ============================================

/**
 * @route   GET /api/auth/mfa/preferences
 * @desc    Get MFA preferences for current user
 * @access  Authenticated
 */
router.get('/preferences', authenticate, email2FAController.getPreferences);

/**
 * @route   PUT /api/auth/mfa/preferences
 * @desc    Update MFA preferences for current user
 * @access  Authenticated
 */
router.put('/preferences', authenticate, email2FAController.updatePreferences);

module.exports = router;
