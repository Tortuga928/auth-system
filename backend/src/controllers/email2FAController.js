/**
 * Email 2FA Controller
 *
 * Handles user-facing email 2FA endpoints:
 * - Request verification code
 * - Verify code
 * - Resend code
 * - MFA status and preferences
 */

const email2FAService = require('../services/email2FAService');
const mfaEmailSender = require('../services/mfaEmailSender');
const MFAConfig = require('../models/MFAConfig');
const UserMFAPreferences = require('../models/UserMFAPreferences');
const TrustedDevice = require('../models/TrustedDevice');

/**
 * Request a new verification code
 * POST /api/auth/mfa/email/request
 *
 * Called during login when email 2FA is required
 */
const requestCode = async (req, res) => {
  try {
    const { userId, email } = req.body;

    // Validate required fields
    if (!userId || !email) {
      return res.status(400).json({
        success: false,
        error: 'User ID and email are required',
      });
    }

    // Generate the code
    const result = await email2FAService.generateCode(userId, email, {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    // Send the code via email
    await mfaEmailSender.sendVerificationCode({
      to: email,
      code: result.code,
      username: req.body.username,
    });

    res.json({
      success: true,
      message: 'Verification code sent',
      data: {
        expiresAt: result.expiresAt,
        expiresInMinutes: result.expiresInMinutes,
        canResendAt: result.canResendAt,
        resendCooldownSeconds: result.resendCooldownSeconds,
      },
    });
  } catch (error) {
    console.error('Error requesting MFA code:', error);

    if (error.code === 'RATE_LIMITED') {
      return res.status(429).json({
        success: false,
        error: 'Too many requests',
        message: error.message,
        retryAfter: error.retryAfter,
      });
    }

    if (error.code === 'LOCKED_OUT') {
      return res.status(423).json({
        success: false,
        error: 'Account locked',
        message: error.message,
        lockedUntil: error.lockedUntil,
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to send verification code',
      details: error.message,
    });
  }
};

/**
 * Verify a code
 * POST /api/auth/mfa/email/verify
 *
 * Called to verify the code during login
 */
const verifyCode = async (req, res) => {
  try {
    const { userId, code, email } = req.body;

    // Validate required fields
    if (!userId || !code) {
      return res.status(400).json({
        success: false,
        error: 'User ID and code are required',
      });
    }

    // Verify the code
    const result = await email2FAService.verifyCode(userId, code, {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      userEmail: email,
    });

    if (result.success) {
      return res.json({
        success: true,
        message: 'Code verified successfully',
      });
    }

    // Handle different error types
    if (result.error === 'LOCKED_OUT') {
      // Note: Lockout notification email is sent by email2FAService.verifyCode
      // using templateEmailService.sendAccountLockedEmail (database template)

      return res.status(423).json({
        success: false,
        error: 'Account locked',
        message: result.message,
        lockedUntil: result.lockedUntil,
      });
    }

    res.status(400).json({
      success: false,
      error: result.error,
      message: result.message,
      attemptsRemaining: result.attemptsRemaining,
    });
  } catch (error) {
    console.error('Error verifying MFA code:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify code',
      details: error.message,
    });
  }
};

/**
 * Resend verification code
 * POST /api/auth/mfa/email/resend
 */
const resendCode = async (req, res) => {
  try {
    const { userId, email, username } = req.body;

    if (!userId || !email) {
      return res.status(400).json({
        success: false,
        error: 'User ID and email are required',
      });
    }

    // Resend the code
    const result = await email2FAService.resendCode(userId, email, {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    // Send the new code via email
    await mfaEmailSender.sendVerificationCode({
      to: email,
      code: result.code,
      username,
    });

    res.json({
      success: true,
      message: 'New verification code sent',
      data: {
        expiresAt: result.expiresAt,
        expiresInMinutes: result.expiresInMinutes,
        canResendAt: result.canResendAt,
        resendCount: result.resendCount,
        maxResends: result.maxResends,
        resendsRemaining: result.resendsRemaining,
      },
    });
  } catch (error) {
    console.error('Error resending MFA code:', error);

    if (error.code === 'RESEND_RATE_LIMITED') {
      return res.status(429).json({
        success: false,
        error: 'Resend limit reached',
        message: error.message,
        retryAfter: error.retryAfter,
        resendsRemaining: error.resendsRemaining,
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to resend code',
      details: error.message,
    });
  }
};

/**
 * Get MFA status for authenticated user
 * GET /api/auth/mfa/status
 */
const getStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    const status = await email2FAService.getUserMFAStatus(userId);
    const required = await email2FAService.checkMFARequired(req.user);

    res.json({
      success: true,
      data: {
        ...status,
        mfaRequired: required.required,
        requiredReason: required.reason,
        requiredMethod: required.method,
        allowedMethods: required.allowedMethods,
      },
    });
  } catch (error) {
    console.error('Error getting MFA status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get MFA status',
      details: error.message,
    });
  }
};

/**
 * Enable email 2FA for authenticated user
 * POST /api/auth/mfa/email/enable
 */
const enableEmail2FA = async (req, res) => {
  try {
    const userId = req.user.id;
    const { setAsPreferred } = req.body;

    const prefs = await email2FAService.enableEmail2FA(userId, {
      setAsPreferred: setAsPreferred || false,
      userEmail: req.user.email,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    // Send confirmation email
    await mfaEmailSender.sendSetupConfirmation({
      to: req.user.email,
      username: req.user.username,
      method: 'email',
    });

    res.json({
      success: true,
      message: 'Email 2FA enabled successfully',
      data: { preferences: prefs },
    });
  } catch (error) {
    console.error('Error enabling email 2FA:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to enable email 2FA',
      details: error.message,
    });
  }
};

/**
 * Disable email 2FA for authenticated user
 * POST /api/auth/mfa/email/disable
 */
const disableEmail2FA = async (req, res) => {
  try {
    const userId = req.user.id;
    const config = await MFAConfig.get();

    // Check if disabling is allowed
    if (config.user_control_mode === 'admin_controlled') {
      return res.status(403).json({
        success: false,
        error: 'MFA settings are controlled by administrator',
      });
    }

    // Check if MFA is required for user's role
    const required = await email2FAService.checkMFARequired(req.user);
    if (required.required && required.method === 'email') {
      return res.status(403).json({
        success: false,
        error: 'Email 2FA is required for your role',
        reason: required.reason,
      });
    }

    const prefs = await email2FAService.disableEmail2FA(userId, {
      userEmail: req.user.email,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    // Send notification email
    await mfaEmailSender.sendDisabledNotification({
      to: req.user.email,
      username: req.user.username,
      method: 'email',
    });

    res.json({
      success: true,
      message: 'Email 2FA disabled',
      data: { preferences: prefs },
    });
  } catch (error) {
    console.error('Error disabling email 2FA:', error);

    if (error.code === 'NOT_ALLOWED') {
      return res.status(403).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to disable email 2FA',
      details: error.message,
    });
  }
};

/**
 * Set alternate email for 2FA
 * POST /api/auth/mfa/email/alternate
 */
const setAlternateEmail = async (req, res) => {
  try {
    const userId = req.user.id;
    const { alternateEmail } = req.body;

    if (!alternateEmail) {
      return res.status(400).json({
        success: false,
        error: 'Alternate email is required',
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(alternateEmail)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format',
      });
    }

    // Can't use primary email as alternate
    if (alternateEmail.toLowerCase() === req.user.email.toLowerCase()) {
      return res.status(400).json({
        success: false,
        error: 'Alternate email must be different from primary email',
      });
    }

    const result = await email2FAService.setAlternateEmail(userId, alternateEmail, {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    if (result.verificationRequired) {
      // Send verification code to alternate email
      const codeResult = await email2FAService.generateCode(userId, alternateEmail, {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      await mfaEmailSender.sendAlternateEmailVerification({
        to: alternateEmail,
        code: codeResult.code,
        primaryEmail: req.user.email,
      });

      return res.json({
        success: true,
        message: 'Verification code sent to alternate email',
        data: {
          verificationRequired: true,
          expiresAt: codeResult.expiresAt,
        },
      });
    }

    res.json({
      success: true,
      message: 'Alternate email set successfully',
      data: { verificationRequired: false },
    });
  } catch (error) {
    console.error('Error setting alternate email:', error);

    if (error.code === 'NOT_ALLOWED') {
      return res.status(403).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to set alternate email',
      details: error.message,
    });
  }
};

/**
 * Verify alternate email
 * POST /api/auth/mfa/email/alternate/verify
 */
const verifyAlternateEmail = async (req, res) => {
  try {
    const userId = req.user.id;
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Verification code is required',
      });
    }

    const result = await email2FAService.verifyAlternateEmail(userId, code, {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      userEmail: req.user.email,
    });

    if (result.success) {
      return res.json({
        success: true,
        message: 'Alternate email verified successfully',
      });
    }

    res.status(400).json({
      success: false,
      error: result.error,
      message: result.message,
      attemptsRemaining: result.attemptsRemaining,
    });
  } catch (error) {
    console.error('Error verifying alternate email:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify alternate email',
      details: error.message,
    });
  }
};

/**
 * Remove alternate email
 * DELETE /api/auth/mfa/email/alternate
 */
const removeAlternateEmail = async (req, res) => {
  try {
    const userId = req.user.id;

    await UserMFAPreferences.update(userId, {
      alternate_email: null,
      alternate_email_verified: false,
    });

    res.json({
      success: true,
      message: 'Alternate email removed',
    });
  } catch (error) {
    console.error('Error removing alternate email:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove alternate email',
      details: error.message,
    });
  }
};

/**
 * Get MFA config for frontend display
 * GET /api/auth/mfa/config
 *
 * Returns sanitized config for frontend (no sensitive data)
 */
const getPublicConfig = async (req, res) => {
  try {
    const config = await MFAConfig.get();

    res.json({
      success: true,
      data: {
        mfaMode: config.mfa_mode,
        codeExpirationMinutes: config.code_expiration_minutes,
        maxAttempts: config.max_attempts,
        resendCooldownSeconds: config.resend_cooldown_seconds,
        maxResendPerSession: config.max_resend_per_session,
        userControlMode: config.user_control_mode,
        allowMultipleEmails: config.allow_multiple_emails,
        deviceTrustEnabled: config.device_trust_enabled,
        deviceTrustDays: config.device_trust_days,
      },
    });
  } catch (error) {
    console.error('Error getting public MFA config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get MFA configuration',
    });
  }
};


/**
 * Get trusted devices for current user
 * GET /api/auth/mfa/trusted-devices
 */
const getTrustedDevices = async (req, res) => {
  try {
    const userId = req.user.id;
    const devices = await TrustedDevice.getByUserId(userId);

    res.json({
      success: true,
      data: {
        devices: devices.map(d => ({
          id: d.id,
          device_name: d.device_name,
          browser: d.browser,
          os: d.os,
          device_type: d.device_type,
          trusted_at: d.trusted_at,
          expires_at: d.expires_at,
          last_used: d.last_used,
        })),
      },
    });
  } catch (error) {
    console.error('Error getting trusted devices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get trusted devices',
      details: error.message,
    });
  }
};

/**
 * Remove a trusted device
 * DELETE /api/auth/mfa/trusted-devices/:deviceId
 */
const removeTrustedDevice = async (req, res) => {
  try {
    const userId = req.user.id;
    const { deviceId } = req.params;

    const deleted = await TrustedDevice.removeById(deviceId, userId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Device not found',
      });
    }

    res.json({
      success: true,
      message: 'Device removed successfully',
    });
  } catch (error) {
    console.error('Error removing trusted device:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove trusted device',
      details: error.message,
    });
  }
};

/**
 * Remove all trusted devices for current user
 * DELETE /api/auth/mfa/trusted-devices
 */
const removeAllTrustedDevices = async (req, res) => {
  try {
    const userId = req.user.id;
    await TrustedDevice.removeAllByUserId(userId);

    res.json({
      success: true,
      message: 'All trusted devices removed successfully',
    });
  } catch (error) {
    console.error('Error removing all trusted devices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove trusted devices',
      details: error.message,
    });
  }
};

/**
 * Get MFA preferences for current user
 * GET /api/auth/mfa/preferences
 */
const getPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const prefs = await UserMFAPreferences.getByUserId(userId);

    res.json({
      success: true,
      data: {
        preferredMethod: prefs.preferred_method,
        email2faEnabled: prefs.email_2fa_enabled,
        alternateEmail: prefs.alternate_email,
        alternateEmailVerified: prefs.alternate_email_verified,
      },
    });
  } catch (error) {
    console.error('Error getting MFA preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get MFA preferences',
      details: error.message,
    });
  }
};

/**
 * Update MFA preferences for current user
 * PUT /api/auth/mfa/preferences
 */
const updatePreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const { preferredMethod } = req.body;

    if (preferredMethod && !['totp', 'email'].includes(preferredMethod)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid preferred method. Must be "totp" or "email"',
      });
    }

    const updates = {};
    if (preferredMethod) updates.preferred_method = preferredMethod;

    const prefs = await UserMFAPreferences.update(userId, updates);

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: {
        preferredMethod: prefs.preferred_method,
      },
    });
  } catch (error) {
    console.error('Error updating MFA preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update MFA preferences',
      details: error.message,
    });
  }
};

module.exports = {
  // Code verification
  requestCode,
  verifyCode,
  resendCode,

  // Status and preferences
  getStatus,
  getPublicConfig,

  // Enable/disable
  enableEmail2FA,
  disableEmail2FA,

  // Alternate email
  setAlternateEmail,
  verifyAlternateEmail,
  removeAlternateEmail,

  // Trusted devices
  getTrustedDevices,
  removeTrustedDevice,
  removeAllTrustedDevices,

  // Preferences
  getPreferences,
  updatePreferences,
};
