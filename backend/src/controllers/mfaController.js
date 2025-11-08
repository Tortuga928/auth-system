/**
 * MFA Controller
 *
 * Handles Multi-Factor Authentication setup and management endpoints
 */

const MFASecret = require('../models/MFASecret');
const User = require('../models/User');
const bcrypt = require('bcrypt');

/**
 * POST /api/auth/mfa/setup
 *
 * Generate TOTP secret and QR code for MFA setup
 * User must be authenticated
 *
 * @returns {Object} Secret, QR code, and backup codes
 */
const setupMFA = async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;

    // Check if MFA is already set up
    const existingMFA = await MFASecret.findByUserId(userId);

    if (existingMFA && existingMFA.enabled) {
      return res.status(400).json({
        success: false,
        message: 'MFA is already enabled',
        error: 'To set up MFA again, please disable it first',
      });
    }

    // Generate TOTP secret
    const { secret, otpauthUrl } = MFASecret.generateTOTPSecret(userEmail);

    // Generate QR code
    const qrCode = await MFASecret.generateQRCode(otpauthUrl);

    // Generate backup codes
    const backupCodes = MFASecret.generateBackupCodes(10);

    // Save to database (disabled by default until user verifies)
    if (existingMFA) {
      // Update existing record
      await MFASecret.update(userId, {
        secret,
        backup_codes: backupCodes,
        enabled: false,
        enabled_at: null,
        failed_attempts: 0,
        locked_until: null,
      });
    } else {
      // Create new record
      await MFASecret.create(userId, secret, backupCodes);
    }

    return res.status(200).json({
      success: true,
      message: 'MFA setup initiated',
      data: {
        secret,
        qrCode,
        backupCodes,
        instruction: 'Scan the QR code with your authenticator app, then verify with a TOTP code to enable MFA',
      },
    });
  } catch (error) {
    console.error('MFA setup error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to set up MFA',
      error: error.message,
    });
  }
};

/**
 * POST /api/auth/mfa/enable
 *
 * Verify TOTP token and enable MFA
 * User must be authenticated
 *
 * @body {string} token - 6-digit TOTP token from authenticator app
 * @returns {Object} Success message
 */
const enableMFA = async (req, res) => {
  try {
    const userId = req.user.id;
    const { token } = req.body;

    // Validate input
    if (!token || !/^\d{6}$/.test(token)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid token format',
        error: 'Token must be a 6-digit number',
      });
    }

    // Get MFA secret
    const mfaSecret = await MFASecret.findByUserId(userId);

    if (!mfaSecret) {
      return res.status(400).json({
        success: false,
        message: 'MFA not set up',
        error: 'Please complete MFA setup first',
      });
    }

    if (mfaSecret.enabled) {
      return res.status(400).json({
        success: false,
        message: 'MFA is already enabled',
      });
    }

    // Verify TOTP token
    const isValid = MFASecret.verifyTOTP(token, mfaSecret.secret);

    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid verification code',
        error: 'The code you entered is incorrect or expired',
      });
    }

    // Enable MFA
    await MFASecret.enable(userId);

    return res.status(200).json({
      success: true,
      message: 'MFA enabled successfully',
      data: {
        enabled: true,
        enabled_at: new Date(),
      },
    });
  } catch (error) {
    console.error('MFA enable error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to enable MFA',
      error: error.message,
    });
  }
};

/**
 * POST /api/auth/mfa/disable
 *
 * Disable MFA (requires password verification)
 * User must be authenticated
 *
 * @body {string} password - User's current password
 * @returns {Object} Success message
 */
const disableMFA = async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;
    const { password } = req.body;

    // Validate input
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password required',
        error: 'Please provide your password to disable MFA',
      });
    }

    // Get user with password hash
    const user = await User.findByEmail(userEmail);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password',
        error: 'The password you entered is incorrect',
      });
    }

    // Get MFA secret
    const mfaSecret = await MFASecret.findByUserId(userId);

    if (!mfaSecret) {
      return res.status(400).json({
        success: false,
        message: 'MFA not set up',
      });
    }

    if (!mfaSecret.enabled) {
      return res.status(400).json({
        success: false,
        message: 'MFA is not enabled',
      });
    }

    // Disable MFA
    await MFASecret.disable(userId);

    return res.status(200).json({
      success: true,
      message: 'MFA disabled successfully',
      data: {
        enabled: false,
      },
    });
  } catch (error) {
    console.error('MFA disable error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to disable MFA',
      error: error.message,
    });
  }
};

/**
 * POST /api/auth/mfa/backup-codes/regenerate
 *
 * Generate new backup codes (invalidates old ones)
 * User must be authenticated and have MFA enabled
 *
 * @body {string} password - User's current password (for security)
 * @returns {Object} New backup codes
 */
const regenerateBackupCodes = async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;
    const { password } = req.body;

    // Validate input
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password required',
        error: 'Please provide your password to regenerate backup codes',
      });
    }

    // Get user with password hash
    const user = await User.findByEmail(userEmail);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password',
        error: 'The password you entered is incorrect',
      });
    }

    // Get MFA secret
    const mfaSecret = await MFASecret.findByUserId(userId);

    if (!mfaSecret) {
      return res.status(400).json({
        success: false,
        message: 'MFA not set up',
      });
    }

    if (!mfaSecret.enabled) {
      return res.status(400).json({
        success: false,
        message: 'MFA must be enabled to regenerate backup codes',
      });
    }

    // Generate new backup codes
    const newBackupCodes = MFASecret.generateBackupCodes(10);

    // Update database
    await MFASecret.update(userId, {
      backup_codes: newBackupCodes,
    });

    return res.status(200).json({
      success: true,
      message: 'Backup codes regenerated successfully',
      data: {
        backupCodes: newBackupCodes,
        warning: 'Your old backup codes are now invalid. Please save these new codes in a secure location.',
      },
    });
  } catch (error) {
    console.error('Backup code regeneration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to regenerate backup codes',
      error: error.message,
    });
  }
};

module.exports = {
  setupMFA,
  enableMFA,
  disableMFA,
  regenerateBackupCodes,
};
