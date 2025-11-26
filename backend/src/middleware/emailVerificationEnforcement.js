/**
 * Email Verification Enforcement Middleware
 *
 * Enforces email verification based on system settings:
 * - If enforcement is enabled and grace period is 0: Block unverified users immediately
 * - If enforcement is enabled with grace period > 0: Block after grace period expires
 * - If enforcement is disabled: Allow all users regardless of verification status
 */

const SystemSetting = require('../models/SystemSetting');
const User = require('../models/User');

/**
 * Check if user is within grace period
 *
 * @param {Date} userCreatedAt - User's account creation date
 * @param {number} gracePeriodDays - Grace period in days
 * @returns {Object} { isWithinGrace: boolean, daysRemaining: number }
 */
function checkGracePeriod(userCreatedAt, gracePeriodDays) {
  if (gracePeriodDays === 0) {
    return { isWithinGrace: false, daysRemaining: 0 };
  }

  const createdAt = new Date(userCreatedAt);
  const now = new Date();
  const graceEndDate = new Date(createdAt.getTime() + gracePeriodDays * 24 * 60 * 60 * 1000);
  const daysRemaining = Math.ceil((graceEndDate - now) / (24 * 60 * 60 * 1000));

  return {
    isWithinGrace: now < graceEndDate,
    daysRemaining: Math.max(0, daysRemaining),
  };
}

/**
 * Email verification enforcement middleware
 *
 * Checks if the authenticated user needs to verify their email based on:
 * 1. System settings (enabled, enforced, grace period)
 * 2. User's email_verified status
 * 3. User's account age (grace period)
 *
 * @param {Object} req - Express request object (must have req.user from authentication)
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const enforceEmailVerification = async (req, res, next) => {
  try {
    // If no user (not authenticated), skip enforcement
    if (!req.user) {
      return next();
    }

    // If user's email is already verified, no enforcement needed
    if (req.user.email_verified) {
      return next();
    }

    // Get system settings
    const settings = await SystemSetting.getEmailVerificationSettings();

    // If enforcement is disabled, allow access
    if (!settings.enforced) {
      return next();
    }

    // Get full user data for created_at
    const user = await User.findById(req.user.id);
    if (!user) {
      return next();
    }

    // Check grace period
    const graceCheck = checkGracePeriod(user.created_at, settings.gracePeriodDays);

    // If within grace period, allow access but add warning header
    if (graceCheck.isWithinGrace) {
      res.setHeader('X-Email-Verification-Warning', 'true');
      res.setHeader('X-Email-Verification-Days-Remaining', graceCheck.daysRemaining.toString());
      return next();
    }

    // Grace period expired (or is 0) - block access
    return res.status(403).json({
      success: false,
      message: 'Email verification required',
      error: settings.gracePeriodDays > 0
        ? 'Your grace period has expired. Please verify your email to continue.'
        : 'Please verify your email address before accessing this resource.',
      data: {
        email_verified: false,
        verification_required: true,
        grace_period_days: settings.gracePeriodDays,
        can_resend_verification: true,
      },
    });
  } catch (error) {
    console.error('Email verification enforcement error:', error);
    // On error, allow access (fail open) to avoid blocking users due to system issues
    next();
  }
};

/**
 * Check email verification status without blocking
 *
 * Use this middleware to add verification status info to the response
 * without blocking access. Useful for endpoints that should work
 * but need to warn about pending verification.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const checkEmailVerificationStatus = async (req, res, next) => {
  try {
    if (!req.user) {
      return next();
    }

    if (req.user.email_verified) {
      req.emailVerification = { verified: true };
      return next();
    }

    // Get system settings
    const settings = await SystemSetting.getEmailVerificationSettings();

    // Get full user data
    const user = await User.findById(req.user.id);

    if (!user) {
      req.emailVerification = { verified: false };
      return next();
    }

    // Check grace period
    const graceCheck = checkGracePeriod(user.created_at, settings.gracePeriodDays);

    req.emailVerification = {
      verified: false,
      enabled: settings.enabled,
      enforced: settings.enforced,
      gracePeriodDays: settings.gracePeriodDays,
      isWithinGrace: graceCheck.isWithinGrace,
      daysRemaining: graceCheck.daysRemaining,
    };

    next();
  } catch (error) {
    console.error('Email verification status check error:', error);
    req.emailVerification = { verified: false, error: true };
    next();
  }
};

/**
 * Get email verification settings (for use in registration/login responses)
 *
 * @returns {Promise<Object>} Email verification settings
 */
async function getVerificationSettings() {
  try {
    return await SystemSetting.getEmailVerificationSettings();
  } catch (error) {
    console.error('Error getting verification settings:', error);
    // Return safe defaults
    return {
      enabled: false,
      enforced: false,
      gracePeriodDays: 0,
      activeEmailServiceId: null,
    };
  }
}

module.exports = {
  enforceEmailVerification,
  checkEmailVerificationStatus,
  checkGracePeriod,
  getVerificationSettings,
};
