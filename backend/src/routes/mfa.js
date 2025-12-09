/**
 * MFA Routes
 *
 * Routes for Multi-Factor Authentication setup and management
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  setupMFA,
  enableMFA,
  disableMFA,
  regenerateBackupCodes,
  verifyTOTP,
  verifyBackupCode,
  verifyEmailCode,
  resendEmailCode,
  switchMFAMethod,
  getMFAStatus,
  requestMFAReset,
  confirmMFAReset,
  unlockMFAAccount,
  completeRequiredMFASetup,
  getEnforcementStatus,
} = require('../controllers/mfaController');

/**
 * @route   POST /api/auth/mfa/setup
 * @desc    Generate TOTP secret and QR code for MFA setup
 * @access  Private (requires authentication)
 */
router.post('/setup', authenticate, setupMFA);

/**
 * @route   POST /api/auth/mfa/enable
 * @desc    Verify TOTP token and enable MFA
 * @access  Private (requires authentication)
 */
router.post('/enable', authenticate, enableMFA);

/**
 * @route   POST /api/auth/mfa/disable
 * @desc    Disable MFA (requires password)
 * @access  Private (requires authentication)
 */
router.post('/disable', authenticate, disableMFA);

/**
 * @route   POST /api/auth/mfa/backup-codes/regenerate
 * @desc    Generate new backup codes
 * @access  Private (requires authentication)
 */
router.post('/backup-codes/regenerate', authenticate, regenerateBackupCodes);

/**
 * @route   POST /api/auth/mfa/verify
 * @desc    Verify TOTP token during login (uses MFA challenge token)
 * @access  Public (requires MFA challenge token from login)
 */
router.post('/verify', verifyTOTP);

/**
 * @route   POST /api/auth/mfa/verify-backup
 * @desc    Verify backup code during login (uses MFA challenge token)
 * @access  Public (requires MFA challenge token from login)
 */
router.post('/verify-backup', verifyBackupCode);

/**
 * @route   POST /api/auth/mfa/verify-email
 * @desc    Verify Email 2FA code during login (Phase 4)
 * @access  Public (requires MFA challenge token from login)
 */
router.post('/verify-email', verifyEmailCode);

/**
 * @route   POST /api/auth/mfa/resend-email
 * @desc    Resend Email 2FA code during login (Phase 4)
 * @access  Public (requires MFA challenge token from login)
 */
router.post('/resend-email', resendEmailCode);

/**
 * @route   POST /api/auth/mfa/switch-method
 * @desc    Switch MFA method during login (e.g., TOTP to Email) (Phase 4)
 * @access  Public (requires MFA challenge token from login)
 */
router.post('/switch-method', switchMFAMethod);

/**
 * @route   GET /api/auth/mfa/status
 * @desc    Get MFA status for authenticated user
 * @access  Private (requires authentication)
 */
router.get('/status', authenticate, getMFAStatus);

/**
 * @route   POST /api/auth/mfa/reset-request
 * @desc    Request MFA reset via email
 * @access  Private (requires authentication + password)
 */
router.post('/reset-request', authenticate, requestMFAReset);

/**
 * @route   POST /api/auth/mfa/reset-confirm
 * @desc    Confirm MFA reset with token from email
 * @access  Public
 */
router.post('/reset-confirm', confirmMFAReset);

/**
 * @route   POST /api/admin/mfa/unlock/:userId
 * @desc    Admin endpoint to unlock a user's MFA account
 * @access  Private (admin only)
 */
router.post('/admin/unlock/:userId', authenticate, unlockMFAAccount);



/**
 * @route   POST /api/auth/mfa/complete-required-setup
 * @desc    Complete required MFA setup for new users or users with expired grace period
 * @access  Public (requires MFA setup token from login)
 */
router.post('/complete-required-setup', completeRequiredMFASetup);

/**
 * @route   GET /api/auth/mfa/enforcement-status
 * @desc    Get MFA enforcement status for user during setup flow
 * @access  Public (requires MFA setup token in query or header)
 */
router.get('/enforcement-status', getEnforcementStatus);

module.exports = router;
