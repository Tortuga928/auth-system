/**
 * User Controller
 *
 * Handles user profile and dashboard data requests
 */

const User = require('../models/User');
const MFASecret = require('../models/MFASecret');
const OAuthProvider = require('../models/OAuthProvider');
const { getRecentActivity } = require('../services/activityLogService');

/**
 * Get user profile and dashboard data
 *
 * GET /api/user/profile
 * Returns: user info, MFA status, OAuth accounts, recent activity
 */
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user basic info
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Get MFA status
    const mfaSecret = await MFASecret.findByUserId(userId);
    const mfaEnabled = !!mfaSecret;

    // Get linked OAuth providers
    const linkedProviders = await OAuthProvider.findByUserId(userId);
    const oauthAccounts = linkedProviders.map((p) => ({
      provider: p.provider,
      email: p.provider_email,
      linkedAt: p.created_at,
    }));

    // Get recent activity (last 5 entries)
    const recentActivity = await getRecentActivity(userId, 5);

    // Format response
    res.json({
      success: true,
      message: 'Profile retrieved successfully',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          emailVerified: user.email_verified,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
        },
        security: {
          mfaEnabled,
          oauthAccountsCount: oauthAccounts.length,
          oauthAccounts,
        },
        activity: recentActivity.map((log) => ({
          id: log.id,
          action: log.action,
          description: log.description,
          timestamp: log.created_at,
          ipAddress: log.ip_address,
        })),
      },
    });
  } catch (error) {
    console.error('❌ Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve profile',
      details: error.message,
    });
  }
};

/**
 * Get user activity history
 *
 * GET /api/user/activity?page=1&limit=25
 * Returns: paginated activity logs
 */
const getActivity = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.limit) || 25;

    // Validate pagination params
    if (page < 1 || pageSize < 1 || pageSize > 100) {
      return res.status(400).json({
        success: false,
        error: 'Invalid pagination parameters',
      });
    }

    const ActivityLog = require('../models/ActivityLog');
    const result = await ActivityLog.getByUserId(userId, page, pageSize);

    res.json({
      success: true,
      message: 'Activity history retrieved',
      data: {
        logs: result.logs.map((log) => ({
          id: log.id,
          action: log.action,
          description: log.description,
          timestamp: log.created_at,
          ipAddress: log.ip_address,
          userAgent: log.user_agent,
          metadata: log.metadata,
        })),
        pagination: result.pagination,
      },
    });
  } catch (error) {
    console.error('❌ Get activity error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve activity history',
      details: error.message,
    });
  }
};

/**
 * Update user profile
 *
 * PUT /api/user/profile
 * Body: { username, email }
 */
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { username, email } = req.body;

    // Validate at least one field provided
    if (!username && !email) {
      return res.status(400).json({
        success: false,
        error: 'At least one field (username or email) is required',
      });
    }

    const updates = {};

    // Validate username if provided
    if (username) {
      const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
      if (!usernameRegex.test(username)) {
        return res.status(400).json({
          success: false,
          error: 'Username must be 3-30 characters and contain only letters, numbers, and underscores',
        });
      }

      // Check if username already exists (for another user)
      const existingUser = await User.findByUsername(username);
      if (existingUser && existingUser.id !== userId) {
        return res.status(409).json({
          success: false,
          error: 'Username already exists',
        });
      }

      updates.username = username;
    }

    // Validate email if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid email format',
        });
      }

      // Check if email already exists (for another user)
      const existingEmail = await User.findByEmail(email);
      if (existingEmail && existingEmail.id !== userId) {
        return res.status(409).json({
          success: false,
          error: 'Email already exists',
        });
      }

      updates.email = email;
      // If email changed, mark as unverified
      updates.email_verified = false;
    }

    // Update user
    const updatedUser = await User.update(userId, updates);

    // Log activity
    const { logProfileUpdate } = require('../services/activityLogService');
    await logProfileUpdate(userId, Object.keys(updates), req);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          role: updatedUser.role,
          emailVerified: updatedUser.email_verified,
          updatedAt: updatedUser.updated_at,
        },
      },
    });
  } catch (error) {
    console.error('❌ Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile',
      details: error.message,
    });
  }
};

module.exports = {
  getProfile,
  getActivity,
  updateProfile,
};
