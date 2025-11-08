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

module.exports = router;
