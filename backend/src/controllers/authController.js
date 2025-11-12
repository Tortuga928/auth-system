/**
 * Authentication Controller
 *
 * Handles user registration, login, and token refresh
 */

const User = require('../models/User');
const MFASecret = require('../models/MFASecret');
const Session = require('../models/Session');
const LoginAttempt = require('../models/LoginAttempt');
const { hashPassword, comparePassword, validatePasswordStrength } = require('../utils/password');
const { generateTokenPair, verifyRefreshToken, generateAccessToken, generateMFAChallengeToken } = require('../utils/jwt');
const tokenService = require('../utils/tokenService');
const emailService = require('../services/emailService');
const { extractSessionMetadata } = require('../utils/sessionUtils');
const { checkLoginSecurity } = require('../utils/securityDetection');

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

    // Send email without waiting (async, non-blocking)
    emailService
      .sendVerificationEmail(user.email, user.username, verificationUrl)
      .then(() => {
        console.log(`✅ Verification email sent to ${user.email}`);
      })
      .catch((error) => {
        console.error('❌ Failed to send verification email:', error.message);
        // Don't fail registration if email fails - user can resend later
      });

    // Generate tokens
    const tokens = generateTokenPair({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Return success response
    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please check your email to verify your account.',
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
 * Login user
 *
 * POST /api/auth/login
 * Body: { email, password }
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

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

    // Check if MFA is enabled
    const mfaSecret = await MFASecret.findByUserId(user.id);

    if (mfaSecret && mfaSecret.enabled) {
      // MFA is enabled - return MFA challenge token
      const mfaChallengeToken = generateMFAChallengeToken({
        id: user.id,
        email: user.email,
      });

      // Log partial success (password correct, awaiting MFA)
      await LoginAttempt.create({
        user_id: user.id,
        email,
        success: false,
        failure_reason: 'mfa_required',
        ...sessionMetadata,
      });

      return res.status(200).json({
        success: true,
        message: 'MFA verification required',
        data: {
          mfaRequired: true,
          mfaChallengeToken,
          user: {
            id: user.id,
            email: user.email,
          },
        },
      });
    }

    // MFA not enabled - proceed with normal login

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

    // Create session record with metadata
    await Session.create({
      user_id: user.id,
      refresh_token: tokens.refreshToken,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      ...sessionMetadata,
    });

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
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
      },
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
      emailService
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
    emailService
      .sendPasswordResetConfirmationEmail(user.email, user.username)
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

module.exports = {
  register,
  login,
  getCurrentUser,
  refresh,
  verifyEmail,
  forgotPassword,
  resetPassword,
};
