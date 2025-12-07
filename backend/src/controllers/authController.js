/**
 * Authentication Controller
 *
 * Handles user registration, login, and token refresh
 */

const config = require('../config');
const User = require('../models/User');
const MFASecret = require('../models/MFASecret');
const Session = require('../models/Session');
const LoginAttempt = require('../models/LoginAttempt');
const { hashPassword, comparePassword, validatePasswordStrength } = require('../utils/password');
const { generateTokenPair, verifyRefreshToken, generateAccessToken, generateMFAChallengeToken } = require('../utils/jwt');
const tokenService = require('../utils/tokenService');
const dynamicEmailService = require('../services/dynamicEmailService');
const { getVerificationSettings, checkGracePeriod } = require('../middleware/emailVerificationEnforcement');
const { extractSessionMetadata } = require('../utils/sessionUtils');
const { checkLoginSecurity } = require('../utils/securityDetection');

// Email 2FA imports (Phase 4)
const MFAConfig = require('../models/MFAConfig');
const UserMFAPreferences = require('../models/UserMFAPreferences');
const TrustedDevice = require('../models/TrustedDevice');
const email2FAService = require('../services/email2FAService');
const mfaEmailSender = require('../services/mfaEmailSender');

// MFA Enforcement imports
const mfaEnforcementService = require('../services/mfaEnforcementService');
const templateEmailService = require('../services/templateEmailService');

/**
 * Register a new user
 *
 * POST /api/auth/register
 * Body: { username, email, password }
 */
const register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, and password are required',
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
      });
    }

    // Validate username format (alphanumeric, 3-30 characters)
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({
        success: false,
        message: 'Username must be 3-30 characters and contain only letters, numbers, and underscores',
      });
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Password does not meet requirements',
        errors: passwordValidation.errors,
      });
    }

    // Check if email already exists
    const emailExists = await User.emailExists(email);
    if (emailExists) {
      return res.status(409).json({
        success: false,
        message: 'Email already exists',
      });
    }

    // Check if username already exists
    const usernameExists = await User.usernameExists(username);
    if (usernameExists) {
      return res.status(409).json({
        success: false,
        message: 'Username already exists',
      });
    }

    // Hash password
    const password_hash = await hashPassword(password);

    // Create user
    const user = await User.create({
      username,
      email,
      password_hash,
      role: 'user',
    });

    // Generate email verification token
    const { token: verificationToken, expires: verificationExpires } =
      tokenService.generateEmailVerificationToken();

    // Update user with verification token
    await User.update(user.id, {
      email_verification_token: verificationToken,
      email_verification_expires: verificationExpires,
    });

    // Send verification email asynchronously (non-blocking)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const verificationUrl = `${frontendUrl}/verify-email/${verificationToken}`;

    // Check if email verification is enabled before sending
    const verificationSettings = await getVerificationSettings();

    if (verificationSettings.enabled) {
      // Send email without waiting (async, non-blocking)
      templateEmailService
        .sendVerificationEmail(user.email, user.username, verificationUrl)
        .then(() => {
          console.log(`✅ Verification email sent to ${user.email}`);
        })
        .catch((error) => {
          console.error('❌ Failed to send verification email:', error.message);
          // Don't fail registration if email fails - user can resend later
        });
    } else {
      console.log('📧 Email verification disabled - skipping verification email');
    }

    // Send welcome email (non-blocking)
    templateEmailService
      .sendWelcomeEmail(user.email, user.username)
      .then(() => {
        console.log(`✅ Welcome email sent to ${user.email}`);
      })
      .catch((error) => {
        console.error('❌ Failed to send welcome email:', error.message);
      });

    // Check if MFA enforcement is enabled
    const mfaConfig = await MFAConfig.get();
    const mfaEnforcementEnabled = mfaConfig.mfa_enforcement_enabled && mfaConfig.mfa_mode !== 'disabled';

    // If MFA enforcement is enabled, mark new user as requiring MFA setup
    if (mfaEnforcementEnabled) {
      await mfaEnforcementService.markUserRequiresMFASetup(user.id);
    }

    // Return success response with appropriate message
    const successMessage = verificationSettings.enabled
      ? 'User registered successfully. Please check your email to verify your account.'
      : 'User registered successfully.';

    // If email verification is enabled, don't issue tokens yet - user must verify email first
    if (verificationSettings.enabled) {
      return res.status(201).json({
        success: true,
        message: successMessage,
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            email_verified: false,
          },
          emailVerificationRequired: true,
          mfaSetupRequired: mfaEnforcementEnabled,
          emailVerification: {
            enabled: verificationSettings.enabled,
            enforced: verificationSettings.enforced,
            gracePeriodDays: verificationSettings.gracePeriodDays,
          },
        },
      });
    }

    // Email verification not required - generate tokens
    const tokens = generateTokenPair({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    res.status(201).json({
      success: true,
      message: successMessage,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          email_verified: user.email_verified,
        },
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        },
        mfaSetupRequired: mfaEnforcementEnabled,
        emailVerification: {
          enabled: verificationSettings.enabled,
          enforced: verificationSettings.enforced,
          gracePeriodDays: verificationSettings.gracePeriodDays,
        },
      },
    });
  } catch (error) {
    // Handle database errors
    if (error.message === 'Email already exists' || error.message === 'Username already exists') {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    console.error('Registration error:', error);
    next(error);
  }
};

/**
 * Determine MFA requirements for a user
 * Checks system config, role config, and user preferences
 *
 * @param {Object} user - User object with id, email, role
 * @param {Object} deviceInfo - Device info for trusted device check
 * @returns {Promise<Object>} MFA requirements
 */
const determineMFARequirements = async (user, deviceInfo = null) => {
  // Get system MFA configuration
  const mfaConfig = await MFAConfig.get();

  // If MFA is globally disabled, no MFA required
  if (mfaConfig.mfa_mode === 'disabled') {
    return {
      required: false,
      reason: 'MFA is disabled system-wide',
    };
  }

  // Check trusted device (if device trust is enabled)
  if (mfaConfig.device_trust_enabled && deviceInfo) {
    const isTrusted = await TrustedDevice.isTrusted(user.id, deviceInfo);
    if (isTrusted) {
      return {
        required: false,
        reason: 'Device is trusted',
        deviceTrusted: true,
      };
    }
  }

  // Check existing TOTP MFA setup
  const mfaSecret = await MFASecret.findByUserId(user.id);
  const hasTotpEnabled = mfaSecret && mfaSecret.enabled;

  // Get user MFA preferences
  const userPrefs = await UserMFAPreferences.getByUserId(user.id);
  const hasEmail2FAEnabled = userPrefs?.email_2fa_enabled || false;

  // Determine available methods based on system mode and user setup
  const availableMethods = [];
  let primaryMethod = null;
  let backupMethod = null;

  switch (mfaConfig.mfa_mode) {
    case 'totp_only':
      // Only TOTP allowed - legacy mode
      if (hasTotpEnabled) {
        availableMethods.push('totp');
        primaryMethod = 'totp';
      }
      break;

    case 'email_only':
      // Only Email 2FA allowed
      availableMethods.push('email');
      primaryMethod = 'email';
      break;

    case 'totp_email_required':
      // Both required - user must verify with both
      if (hasTotpEnabled) availableMethods.push('totp');
      availableMethods.push('email');
      primaryMethod = hasTotpEnabled ? 'totp' : 'email';
      break;

    case 'totp_email_fallback':
      // TOTP primary, email as fallback
      if (hasTotpEnabled) {
        availableMethods.push('totp');
        availableMethods.push('email');
        primaryMethod = 'totp';
        backupMethod = 'email';
      } else if (hasEmail2FAEnabled) {
        availableMethods.push('email');
        primaryMethod = 'email';
      }
      break;

    default:
      // Check if user has any MFA enabled (legacy behavior)
      if (hasTotpEnabled) {
        availableMethods.push('totp');
        primaryMethod = 'totp';
      }
      if (hasEmail2FAEnabled) {
        availableMethods.push('email');
        if (!primaryMethod) primaryMethod = 'email';
      }
  }

  // If no methods available, MFA not required
  if (availableMethods.length === 0) {
    return {
      required: false,
      reason: 'No MFA method configured',
      mfaMode: mfaConfig.mfa_mode,
    };
  }

  // Determine the email to use for Email 2FA
  let email2faTarget = user.email;
  if (userPrefs?.alternate_email && userPrefs?.alternate_email_verified) {
    email2faTarget = userPrefs.alternate_email;
  }

  return {
    required: true,
    primaryMethod,
    backupMethod,
    availableMethods,
    mfaMode: mfaConfig.mfa_mode,
    hasTotpEnabled,
    hasEmail2FAEnabled,
    email2faTarget,
    deviceTrustEnabled: mfaConfig.device_trust_enabled,
    deviceTrustDays: mfaConfig.device_trust_duration_days,
  };
};

/**
 * Login user
 *
 * POST /api/auth/login
 * Body: { email, password }
 */
const login = async (req, res, next) => {
  try {
    const { email, password, rememberMe } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // Extract session metadata from request (needed for logging)
    const sessionMetadata = extractSessionMetadata(req);

    // Find user by email
    const user = await User.findByEmail(email);

    if (!user) {
      // Log failed login attempt - user not found
      await LoginAttempt.create({
        user_id: null,
        email,
        success: false,
        failure_reason: 'user_not_found',
        ...sessionMetadata,
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Compare password
    const isPasswordValid = await comparePassword(password, user.password_hash);

    if (!isPasswordValid) {
      // Log failed login attempt - invalid password
      await LoginAttempt.create({
        user_id: user.id,
        email,
        success: false,
        failure_reason: 'invalid_password',
        ...sessionMetadata,
      });

      // Check for security events (brute force)
      await checkLoginSecurity({
        userId: user.id,
        email,
        success: false,
        ...sessionMetadata,
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Build device info for trusted device check
    const deviceInfo = {
      userAgent: sessionMetadata.user_agent,
      ipAddress: sessionMetadata.ip_address,
      acceptLanguage: req.headers['accept-language'],
    };

    // Check MFA requirements (unified check for TOTP and Email 2FA)
    const mfaRequirements = await determineMFARequirements(user, deviceInfo);

    if (mfaRequirements.required) {
      // MFA is required - return MFA challenge token
      const mfaChallengeToken = generateMFAChallengeToken({
        id: user.id,
        email: user.email,
        mfaMethod: mfaRequirements.primaryMethod,
      });

      // Log partial success (password correct, awaiting MFA)
      await LoginAttempt.create({
        user_id: user.id,
        email,
        success: false,
        failure_reason: 'mfa_required',
        ...sessionMetadata,
      });

      // If primary method is email, send the code now
      let emailCodeSent = false;
      let emailCodeExpiresAt = null;
      if (mfaRequirements.primaryMethod === 'email') {
        try {
          const codeResult = await email2FAService.generateCode(
            user.id,
            mfaRequirements.email2faTarget,
            { ipAddress: sessionMetadata.ip_address, userAgent: sessionMetadata.user_agent }
          );

          // Send the code via email using database template
          await mfaEmailSender.sendVerificationCode({
            to: mfaRequirements.email2faTarget,
            code: codeResult.code,
            username: user.username || user.email,
            expiryMinutes: codeResult.expiresInMinutes
          });

          emailCodeSent = true;
          emailCodeExpiresAt = codeResult.expiresAt;
        } catch (emailError) {
          console.error('Failed to send Email 2FA code:', emailError.message);
          // Don't fail the login - user can request resend
        }
      }

      return res.status(200).json({
        success: true,
        message: 'MFA verification required',
        data: {
          mfaRequired: true,
          mfaChallengeToken,
          mfaMethod: mfaRequirements.primaryMethod,
          availableMethods: mfaRequirements.availableMethods,
          backupMethod: mfaRequirements.backupMethod,
          emailCodeSent,
          emailCodeExpiresAt,
          deviceTrustEnabled: mfaRequirements.deviceTrustEnabled,
          deviceTrustDays: mfaRequirements.deviceTrustDays,
          user: {
            id: user.id,
            email: user.email,
          },
        },
      });
    }

    // MFA not required - check email verification enforcement

    // Get verification settings
    const verificationSettings = await getVerificationSettings();

    // Check if email verification is enforced and user is not verified
    if (verificationSettings.enforced && !user.email_verified) {
      // Check grace period
      const graceResult = checkGracePeriod(user.created_at, verificationSettings.gracePeriodDays);

      if (!graceResult.isWithinGrace) {
        // Grace period expired - block login
        return res.status(403).json({
          success: false,
          message: 'Email verification required',
          error: verificationSettings.gracePeriodDays > 0
            ? 'Your grace period has expired. Please verify your email to continue.'
            : 'Please verify your email address before logging in.',
          data: {
            emailVerificationRequired: true,
            email_verified: false,
            can_resend_verification: true,
            grace_period_days: verificationSettings.gracePeriodDays,
          },
        });
      }
    }

    // Check MFA enforcement status
    const enforcementStatus = await mfaEnforcementService.getEnforcementStatus(user);

    if (enforcementStatus.mfaSetupRequired) {
      // User must set up MFA before accessing the app
      // Generate a temporary token for MFA setup
      const mfaSetupToken = generateMFAChallengeToken({
        id: user.id,
        email: user.email,
        purpose: 'mfa_setup',
      });

      return res.status(200).json({
        success: true,
        message: 'MFA setup required',
        data: {
          mfaSetupRequired: true,
          mfaSetupToken,
          mfaMode: enforcementStatus.mfaMode,
          mfaStatus: enforcementStatus.mfaStatus,
          gracePeriodExpired: enforcementStatus.gracePeriodExpired || false,
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
          },
        },
      });
    }

    // Check if user is in grace period (show warning but allow login)
    let gracePeriodWarning = null;
    if (enforcementStatus.gracePeriodActive) {
      gracePeriodWarning = {
        active: true,
        daysRemaining: enforcementStatus.daysRemaining,
        gracePeriodEnd: enforcementStatus.gracePeriodEnd,
        message: `You have ${enforcementStatus.daysRemaining} day${enforcementStatus.daysRemaining !== 1 ? 's' : ''} remaining to set up MFA.`,
      };
    }

    // Log successful login attempt
    await LoginAttempt.create({
      user_id: user.id,
      email,
      success: true,
      failure_reason: null,
      ...sessionMetadata,
    });

    // Check for security events (new location, new device)
    await checkLoginSecurity({
      userId: user.id,
      email,
      success: true,
      ...sessionMetadata,
    });

    // Generate tokens
    const tokens = generateTokenPair({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Calculate session expiration based on rememberMe flag
    const now = Date.now();
    const sessionDuration = rememberMe
      ? config.session.timeout.rememberMe  // 30 days if "remember me"
      : config.session.timeout.absolute;   // 7 days default

    const expiresAt = new Date(now + sessionDuration);
    const absoluteExpiresAt = new Date(now + sessionDuration);

    // Create session record with metadata
    await Session.create({
      user_id: user.id,
      refresh_token: tokens.refreshToken,
      expires_at: expiresAt,
      remember_me: rememberMe || false,
      absolute_expires_at: absoluteExpiresAt,
      ...sessionMetadata,
    });

    // Build response data
    const responseData = {
      mfaRequired: false,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        email_verified: user.email_verified,
      },
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    };

    // Add email verification warning if user is in grace period
    if (verificationSettings.enforced && !user.email_verified) {
      const graceResult = checkGracePeriod(user.created_at, verificationSettings.gracePeriodDays);
      if (graceResult.isWithinGrace) {
        responseData.emailVerificationWarning = {
          message: `Please verify your email. ${graceResult.daysRemaining} days remaining.`,
          daysRemaining: graceResult.daysRemaining,
          gracePeriodDays: verificationSettings.gracePeriodDays,
        };
      }
    }

    // Add MFA grace period warning if applicable
    if (gracePeriodWarning) {
      responseData.mfaGracePeriodWarning = gracePeriodWarning;
    }

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: responseData,
    });
  } catch (error) {
    console.error('Login error:', error);
    next(error);
  }
};

/**
 * Get current user
 *
 * GET /api/auth/me
 * Requires authentication middleware
 */
const getCurrentUser = async (req, res, next) => {
  try {
    // req.user is set by auth middleware
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    console.error('Get current user error:', error);
    next(error);
  }
};

/**
 * Refresh access token
 *
 * POST /api/auth/refresh
 * Body: { refreshToken }
 */
const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    // Validate required field
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
      });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token',
        error: error.message,
      });
    }

    // Get user from database
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
        error: 'User associated with refresh token does not exist',
      });
    }

    // Generate new access token
    const newAccessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Return new access token
    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: newAccessToken,
      },
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    next(error);
  }
};

/**
 * Verify email address
 *
 * GET /api/auth/verify-email/:token
 * Public endpoint - no authentication required
 */
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;

    // Validate token parameter
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required',
      });
    }

    // Find user with this verification token
    const user = await User.findByVerificationToken(token);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification token',
      });
    }

    // Validate token using tokenService
    const validation = tokenService.validateEmailVerificationToken(
      token,
      user.email_verification_token,
      user.email_verification_expires
    );

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.error,
      });
    }

    // Check if already verified
    if (user.email_verified) {
      return res.status(200).json({
        success: true,
        message: 'Email already verified',
        data: {
          email_verified: true,
        },
      });
    }

    // Mark user as verified and clear token
    await User.update(user.id, {
      email_verified: true,
      ...tokenService.clearEmailVerificationToken(),
    });

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      data: {
        email_verified: true,
      },
    });
  } catch (error) {
    console.error('Email verification error:', error);
    next(error);
  }
};

/**
 * Forgot password - Request password reset
 *
 * POST /api/auth/forgot-password
 * Body: { email }
 * Public endpoint - no authentication required
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Validate email parameter
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required',
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
      });
    }

    // Find user by email
    const user = await User.findByEmail(email);

    // If user exists, generate and send reset token
    if (user) {
      // Generate password reset token (1 hour expiration)
      const { token: resetToken, expires: resetExpires } =
        tokenService.generatePasswordResetToken();

      // Update user with reset token
      await User.update(user.id, {
        password_reset_token: resetToken,
        password_reset_expires: resetExpires,
      });

      // Send password reset email asynchronously (non-blocking)
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

      // Send email without waiting (async, non-blocking)
      templateEmailService
        .sendPasswordResetEmail(user.email, user.username, resetUrl)
        .then(() => {
          console.log(`✅ Password reset email sent to ${user.email}`);
        })
        .catch((error) => {
          console.error('❌ Failed to send password reset email:', error.message);
          // Don't fail the request if email fails - user can retry
        });
    } else {
      // User doesn't exist, but don't reveal this for security
      console.log(`⚠️  Password reset requested for non-existent email: ${email}`);
    }

    // Always return success to prevent email enumeration
    res.status(200).json({
      success: true,
      message: 'If an account exists with that email, a password reset link has been sent.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    next(error);
  }
};

/**
 * Reset password - Set new password using reset token
 *
 * POST /api/auth/reset-password/:token
 * Body: { password }
 * Public endpoint - no authentication required
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Validate token parameter
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Reset token is required',
      });
    }

    // Validate password parameter
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'New password is required',
      });
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Password does not meet requirements',
        errors: passwordValidation.errors,
      });
    }

    // Find user with this reset token
    const user = await User.findByPasswordResetToken(token);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
      });
    }

    // Validate token using tokenService
    const validation = tokenService.validatePasswordResetToken(
      token,
      user.password_reset_token,
      user.password_reset_expires
    );

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.error,
      });
    }

    // Hash new password
    const password_hash = await hashPassword(password);

    // Update password and clear reset token
    await User.update(user.id, {
      password_hash,
      ...tokenService.clearPasswordResetToken(),
    });

    // Send confirmation email asynchronously (non-blocking)
    templateEmailService
      .sendPasswordChangedEmail(user.email, user.username || user.email, { ipAddress: req.ip || req.headers["x-forwarded-for"] || "Unknown" })
      .then(() => {
        console.log(`✅ Password reset confirmation email sent to ${user.email}`);
      })
      .catch((error) => {
        console.error('❌ Failed to send confirmation email:', error.message);
        // Don't fail the request if email fails
      });

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    next(error);
  }
};

/**
 * Logout current user
 *
 * POST /api/auth/logout
 * Requires authentication (access token in Authorization header)
 */
const logout = async (req, res, next) => {
  try {
    // User is already verified by auth middleware and attached to req.user
    const userId = req.user.id;

    // Mark all active sessions for this user as inactive
    // This effectively logs out the user from all devices
    const sessions = await Session.findByUserId(userId, true);

    for (const session of sessions) {
      await Session.markInactive(session.id);
    }

    res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    console.error('Logout error:', error);
    next(error);
  }
};

/**
 * Resend verification email
 *
 * POST /api/auth/resend-verification
 * Requires authentication
 */
const resendVerificationEmail = async (req, res, next) => {
  try {
    // Check if email verification is enabled
    const verificationSettings = await getVerificationSettings();

    if (!verificationSettings.enabled) {
      return res.status(400).json({
        success: false,
        message: 'Email verification is not enabled',
      });
    }

    // Get current user
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if already verified
    if (user.email_verified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified',
      });
    }

    // Generate new verification token
    const { token: verificationToken, expires: verificationExpires } =
      tokenService.generateEmailVerificationToken();

    // Update user with new verification token
    await User.update(user.id, {
      email_verification_token: verificationToken,
      email_verification_expires: verificationExpires,
    });

    // Send verification email
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const verificationUrl = `${frontendUrl}/verify-email/${verificationToken}`;

    try {
      await dynamicEmailService.sendVerificationEmail(user.email, user.username, verificationUrl);
      console.log(`✅ Verification email resent to ${user.email}`);

      res.status(200).json({
        success: true,
        message: 'Verification email sent successfully',
      });
    } catch (emailError) {
      console.error('❌ Failed to send verification email:', emailError.message);
      res.status(500).json({
        success: false,
        message: 'Failed to send verification email. Please try again later.',
        error: emailError.message,
      });
    }
  } catch (error) {
    console.error('Resend verification error:', error);
    next(error);
  }
};

/**
 * Get email verification settings (public endpoint for frontend)
 *
 * GET /api/auth/verification-settings
 * Public endpoint
 */
const getEmailVerificationSettings = async (req, res, next) => {
  try {
    const settings = await getVerificationSettings();

    res.status(200).json({
      success: true,
      data: {
        enabled: settings.enabled,
        enforced: settings.enforced,
        gracePeriodDays: settings.gracePeriodDays,
      },
    });
  } catch (error) {
    console.error('Get verification settings error:', error);
    next(error);
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
  refresh,
  verifyEmail,
  forgotPassword,
  resetPassword,
  logout,
  resendVerificationEmail,
  getEmailVerificationSettings,
};
