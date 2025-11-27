/**
 * Email 2FA Service
 *
 * Core service for email-based two-factor authentication.
 * Handles code generation, storage, verification, and rate limiting.
 */

const Email2FACode = require('../models/Email2FACode');
const MFAConfig = require('../models/MFAConfig');
const MFARoleConfig = require('../models/MFARoleConfig');
const UserMFAPreferences = require('../models/UserMFAPreferences');
const AuditLog = require('../models/AuditLog');

class Email2FAService {
  /**
   * Generate and store a new 2FA code for a user
   *
   * @param {number} userId - User ID
   * @param {string} email - Email to send code to (user's primary or alternate)
   * @param {Object} options - Additional options
   * @param {string} options.ipAddress - Request IP address for logging
   * @param {string} options.userAgent - User agent for logging
   * @returns {Promise<Object>} { code, expiresAt, canResendAt }
   */
  async generateCode(userId, email, options = {}) {
    // Get current MFA configuration
    const config = await MFAConfig.get();

    // Check if user can request a new code (rate limiting)
    const canRequest = await Email2FACode.canRequestCode(userId);
    if (!canRequest.allowed) {
      const error = new Error(canRequest.reason);
      error.code = 'RATE_LIMITED';
      error.retryAfter = canRequest.retryAfter;
      throw error;
    }

    // Check if user is locked out
    const lockoutStatus = await Email2FACode.checkLockout(userId);
    if (lockoutStatus.isLocked) {
      const error = new Error('Account temporarily locked due to too many failed attempts');
      error.code = 'LOCKED_OUT';
      error.lockedUntil = lockoutStatus.lockedUntil;
      throw error;
    }

    // Generate the code based on configured format
    const code = Email2FACode.generateCode(config.code_format);

    // Calculate expiration
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + config.code_expiration_minutes);

    // Store the code (hashed)
    const storedCode = await Email2FACode.create({
      user_id: userId,
      email,
      code,
      expires_at: expiresAt,
    });

    // Calculate when user can resend
    const canResendAt = new Date();
    canResendAt.setSeconds(canResendAt.getSeconds() + config.resend_cooldown_seconds);

    // Log the code generation (if comprehensive logging enabled)
    if (config.logging_level === 'comprehensive') {
      await AuditLog.create({
        admin_id: userId, // User ID for user actions
        admin_email: email,
        action: AuditLog.ACTION_TYPES.MFA_CODE_SENT,
        target_type: 'user',
        target_id: userId,
        details: {
          method: 'email',
          email_masked: this._maskEmail(email),
        },
        ip_address: options.ipAddress,
        user_agent: options.userAgent,
      });
    }

    return {
      code, // Plain code to send via email
      codeId: storedCode.id,
      expiresAt,
      expiresInMinutes: config.code_expiration_minutes,
      canResendAt,
      resendCooldownSeconds: config.resend_cooldown_seconds,
    };
  }

  /**
   * Verify a 2FA code
   *
   * @param {number} userId - User ID
   * @param {string} code - Code to verify
   * @param {Object} options - Additional options
   * @param {string} options.ipAddress - Request IP address
   * @param {string} options.userAgent - User agent
   * @returns {Promise<Object>} { success, message }
   */
  async verifyCode(userId, code, options = {}) {
    const config = await MFAConfig.get();

    // Check lockout status first
    const lockoutStatus = await Email2FACode.checkLockout(userId);
    if (lockoutStatus.isLocked) {
      // Log the lockout attempt
      if (config.logging_level !== 'none') {
        await AuditLog.create({
          admin_id: userId,
          admin_email: options.userEmail || 'unknown',
          action: AuditLog.ACTION_TYPES.MFA_LOCKOUT,
          target_type: 'user',
          target_id: userId,
          details: {
            reason: 'attempted_verification_while_locked',
            locked_until: lockoutStatus.lockedUntil,
          },
          ip_address: options.ipAddress,
          user_agent: options.userAgent,
        });
      }

      return {
        success: false,
        error: 'LOCKED_OUT',
        message: 'Account temporarily locked due to too many failed attempts',
        lockedUntil: lockoutStatus.lockedUntil,
      };
    }

    // Attempt verification
    const result = await Email2FACode.verify(userId, code);

    if (result.success) {
      // Log successful verification
      if (config.logging_level !== 'none') {
        await AuditLog.create({
          admin_id: userId,
          admin_email: options.userEmail || 'unknown',
          action: AuditLog.ACTION_TYPES.MFA_CODE_VERIFIED,
          target_type: 'user',
          target_id: userId,
          details: { method: 'email' },
          ip_address: options.ipAddress,
          user_agent: options.userAgent,
        });
      }

      return {
        success: true,
        message: 'Code verified successfully',
      };
    }

    // Log failed attempt
    if (config.logging_level !== 'none') {
      await AuditLog.create({
        admin_id: userId,
        admin_email: options.userEmail || 'unknown',
        action: AuditLog.ACTION_TYPES.MFA_CODE_FAILED,
        target_type: 'user',
        target_id: userId,
        details: {
          reason: result.reason,
          attempts_remaining: result.attemptsRemaining,
        },
        ip_address: options.ipAddress,
        user_agent: options.userAgent,
      });
    }

    // Check if this failure triggered a lockout
    if (result.isLocked) {
      await AuditLog.create({
        admin_id: userId,
        admin_email: options.userEmail || 'unknown',
        action: AuditLog.ACTION_TYPES.MFA_LOCKOUT,
        target_type: 'user',
        target_id: userId,
        details: {
          reason: 'max_attempts_exceeded',
          locked_until: result.lockedUntil,
          lockout_behavior: config.lockout_behavior,
        },
        ip_address: options.ipAddress,
        user_agent: options.userAgent,
      });
    }

    return {
      success: false,
      error: result.isLocked ? 'LOCKED_OUT' : 'INVALID_CODE',
      message: result.reason,
      attemptsRemaining: result.attemptsRemaining,
      lockedUntil: result.lockedUntil,
    };
  }

  /**
   * Resend a 2FA code
   *
   * @param {number} userId - User ID
   * @param {string} email - Email to send code to
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} { code, expiresAt, canResendAt, resendCount }
   */
  async resendCode(userId, email, options = {}) {
    const config = await MFAConfig.get();

    // Check resend rate limit
    const canResend = await Email2FACode.canResend(userId);
    if (!canResend.allowed) {
      const error = new Error(canResend.reason);
      error.code = 'RESEND_RATE_LIMITED';
      error.retryAfter = canResend.retryAfter;
      error.resendsRemaining = canResend.resendsRemaining;
      throw error;
    }

    // Invalidate existing codes
    await Email2FACode.invalidateExisting(userId);

    // Generate new code
    const result = await this.generateCode(userId, email, options);

    // Track resend
    await Email2FACode.trackResend(userId);

    return {
      ...result,
      resendCount: canResend.currentResendCount + 1,
      maxResends: config.max_resend_per_session,
      resendsRemaining: config.max_resend_per_session - (canResend.currentResendCount + 1),
    };
  }

  /**
   * Check if MFA is required for a user
   *
   * @param {Object} user - User object with id, email, role
   * @returns {Promise<Object>} { required, method, reason }
   */
  async checkMFARequired(user) {
    const config = await MFAConfig.get();

    // If MFA is globally disabled, not required
    if (config.mfa_mode === 'disabled') {
      return { required: false, reason: 'MFA is disabled system-wide' };
    }

    // Check role-based requirements if enabled
    if (config.role_based_mfa_enabled) {
      const roleConfig = await MFARoleConfig.getByRole(user.role);
      if (roleConfig && roleConfig.mfa_required) {
        return {
          required: true,
          method: this._determineMethod(config, roleConfig),
          reason: `MFA required for ${user.role} role`,
          allowedMethods: roleConfig.allowed_methods,
        };
      }
    }

    // Check user-specific preferences
    const userPrefs = await UserMFAPreferences.getByUserId(user.id);
    if (userPrefs && userPrefs.email_2fa_enabled) {
      return {
        required: true,
        method: 'email',
        reason: 'User has enabled email 2FA',
      };
    }

    // Check global MFA mode
    if (config.mfa_mode === 'email_primary') {
      return {
        required: true,
        method: 'email',
        reason: 'Email MFA is required system-wide',
      };
    }

    if (config.mfa_mode === 'totp_primary_email_fallback') {
      // Check if user has TOTP set up
      const hasTotp = await this._userHasTOTP(user.id);
      return {
        required: true,
        method: hasTotp ? 'totp' : 'email',
        reason: hasTotp ? 'TOTP is primary method' : 'Email fallback (no TOTP setup)',
        fallbackAvailable: hasTotp,
      };
    }

    if (config.mfa_mode === 'totp_required_email_backup') {
      return {
        required: true,
        method: 'totp',
        backupMethod: 'email',
        reason: 'TOTP required with email backup',
      };
    }

    return { required: false, reason: 'MFA not required' };
  }

  /**
   * Get MFA status for a user
   *
   * @param {number} userId - User ID
   * @returns {Promise<Object>} User's MFA status
   */
  async getUserMFAStatus(userId) {
    const config = await MFAConfig.get();
    const userPrefs = await UserMFAPreferences.getByUserId(userId);
    const hasTotp = await this._userHasTOTP(userId);

    return {
      email2faEnabled: userPrefs?.email_2fa_enabled || false,
      totpEnabled: hasTotp,
      preferredMethod: userPrefs?.preferred_method || 'email',
      alternateEmail: userPrefs?.alternate_email || null,
      alternateEmailVerified: userPrefs?.alternate_email_verified || false,
      systemMfaMode: config.mfa_mode,
      hasPendingTransition: userPrefs?.pending_method_change || false,
      gracePeriodEnds: userPrefs?.grace_period_ends_at || null,
    };
  }

  /**
   * Enable email 2FA for a user
   *
   * @param {number} userId - User ID
   * @param {Object} options - Options
   * @returns {Promise<Object>} Updated preferences
   */
  async enableEmail2FA(userId, options = {}) {
    let prefs = await UserMFAPreferences.getByUserId(userId);

    if (!prefs) {
      prefs = await UserMFAPreferences.create({
        user_id: userId,
        preferred_method: 'email',
        email_2fa_enabled: true,
      });
    } else {
      prefs = await UserMFAPreferences.update(userId, {
        email_2fa_enabled: true,
        preferred_method: options.setAsPreferred ? 'email' : prefs.preferred_method,
      });
    }

    // Log the change
    const config = await MFAConfig.get();
    if (config.logging_level !== 'none') {
      await AuditLog.create({
        admin_id: userId,
        admin_email: options.userEmail || 'unknown',
        action: AuditLog.ACTION_TYPES.MFA_METHOD_CHANGED,
        target_type: 'user',
        target_id: userId,
        details: {
          action: 'enable',
          method: 'email',
          set_as_preferred: options.setAsPreferred || false,
        },
        ip_address: options.ipAddress,
        user_agent: options.userAgent,
      });
    }

    return prefs;
  }

  /**
   * Disable email 2FA for a user
   *
   * @param {number} userId - User ID
   * @param {Object} options - Options
   * @returns {Promise<Object>} Updated preferences
   */
  async disableEmail2FA(userId, options = {}) {
    const config = await MFAConfig.get();

    // Check if user is allowed to disable
    if (config.user_control_mode === 'admin_controlled') {
      const error = new Error('MFA settings are controlled by administrator');
      error.code = 'NOT_ALLOWED';
      throw error;
    }

    const prefs = await UserMFAPreferences.update(userId, {
      email_2fa_enabled: false,
    });

    // Log the change
    if (config.logging_level !== 'none') {
      await AuditLog.create({
        admin_id: userId,
        admin_email: options.userEmail || 'unknown',
        action: AuditLog.ACTION_TYPES.MFA_METHOD_CHANGED,
        target_type: 'user',
        target_id: userId,
        details: {
          action: 'disable',
          method: 'email',
        },
        ip_address: options.ipAddress,
        user_agent: options.userAgent,
      });
    }

    return prefs;
  }

  /**
   * Set alternate email for 2FA
   *
   * @param {number} userId - User ID
   * @param {string} alternateEmail - Alternate email address
   * @param {Object} options - Options
   * @returns {Promise<Object>} { success, verificationRequired }
   */
  async setAlternateEmail(userId, alternateEmail, options = {}) {
    const config = await MFAConfig.get();

    // Check if alternate emails are allowed
    if (!config.allow_multiple_emails) {
      const error = new Error('Alternate emails are not enabled');
      error.code = 'NOT_ALLOWED';
      throw error;
    }

    // Update user preferences
    await UserMFAPreferences.update(userId, {
      alternate_email: alternateEmail,
      alternate_email_verified: false,
    });

    // If verification is required, generate verification code
    if (config.require_email_verification) {
      const verificationResult = await this.generateCode(userId, alternateEmail, options);
      return {
        success: true,
        verificationRequired: true,
        verificationCodeSent: true,
        expiresAt: verificationResult.expiresAt,
      };
    }

    return {
      success: true,
      verificationRequired: false,
    };
  }

  /**
   * Verify alternate email
   *
   * @param {number} userId - User ID
   * @param {string} code - Verification code
   * @param {Object} options - Options
   * @returns {Promise<Object>} Verification result
   */
  async verifyAlternateEmail(userId, code, options = {}) {
    const result = await this.verifyCode(userId, code, options);

    if (result.success) {
      await UserMFAPreferences.update(userId, {
        alternate_email_verified: true,
      });
      return {
        success: true,
        message: 'Alternate email verified successfully',
      };
    }

    return result;
  }

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  /**
   * Mask email for logging (show first 2 chars and domain)
   * @private
   */
  _maskEmail(email) {
    const [localPart, domain] = email.split('@');
    const masked = localPart.substring(0, 2) + '***';
    return `${masked}@${domain}`;
  }

  /**
   * Check if user has TOTP set up
   * @private
   */
  async _userHasTOTP(userId) {
    // This would check the existing mfa_secrets table
    const db = require('../db');
    const result = await db.query(
      'SELECT id FROM mfa_secrets WHERE user_id = $1 AND is_verified = true',
      [userId]
    );
    return result.rows.length > 0;
  }

  /**
   * Determine which MFA method to use based on config and role
   * @private
   */
  _determineMethod(config, roleConfig) {
    if (roleConfig.allowed_methods && roleConfig.allowed_methods.length > 0) {
      // Return the first allowed method as primary
      return roleConfig.allowed_methods[0];
    }

    // Fall back to system config
    if (config.mfa_mode === 'email_primary') return 'email';
    if (config.mfa_mode.includes('totp')) return 'totp';
    return 'email';
  }
}

// Export singleton instance
module.exports = new Email2FAService();
