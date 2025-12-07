/**
 * User Controller
 *
 * Handles user profile and dashboard data requests
 */

const User = require('../models/User');
const MFASecret = require('../models/MFASecret');
const OAuthProvider = require('../models/OAuthProvider');
const { getRecentActivity } = require('../services/activityLogService');
const templateEmailService = require('../services/templateEmailService');

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
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          emailVerified: user.email_verified,
          avatarUrl: user.avatar_url,
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
 * Body: { username, email, first_name, last_name, password }
 */
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { username, email, first_name, last_name, password } = req.body;

    // Password is required for security
    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'Password is required to update your profile',
      });
    }

    // Verify password before allowing changes
    const bcrypt = require('bcrypt');
    const user = await User.findByIdWithPassword(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid password',
      });
    }

    // Validate at least one field provided (excluding password)
    if (!username && !email && first_name === undefined && last_name === undefined) {
      return res.status(400).json({
        success: false,
        error: 'At least one field (username, email, first_name, or last_name) must be provided',
      });
    }

    const updates = {};
    const originalEmail = user.email;

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
      if (email !== originalEmail) {
        updates.email_verified = false;
      }
    }

    // Update first_name if provided (can be empty string to clear)
    if (first_name !== undefined) {
      updates.first_name = first_name;
    }

    // Update last_name if provided (can be empty string to clear)
    if (last_name !== undefined) {
      updates.last_name = last_name;
    }

    // Update user
    const updatedUser = await User.update(userId, updates);

    // Log activity
    const { logProfileUpdate } = require('../services/activityLogService');
    await logProfileUpdate(userId, Object.keys(updates), req);

    // Send email verification if email changed
    const emailChanged = email && email !== originalEmail;
    if (emailChanged) {
      // TODO: Send verification email to new address
      // This will be implemented when email service is available
      console.log('📧 Email changed - verification email should be sent to:', email);
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          first_name: updatedUser.first_name,
          last_name: updatedUser.last_name,
          role: updatedUser.role,
          emailVerified: updatedUser.email_verified,
          updatedAt: updatedUser.updated_at,
        },
        emailChanged,
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

/**
 * Upload user avatar
 *
 * POST /api/user/avatar
 * Body: multipart/form-data with 'avatar' file
 */
const uploadAvatar = async (req, res) => {
  try {
    const userId = req.user.id;

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    const sharp = require('sharp');
    const path = require('path');
    const fs = require('fs');

    // Process image with sharp
    const filename = req.file.filename;
    const filepath = req.file.path;
    const processedFilename = `processed-${filename}`;
    const processedPath = path.join(path.dirname(filepath), processedFilename);

    // Resize and optimize image (300x300, square)
    await sharp(filepath)
      .resize(300, 300, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality: 85 })
      .toFile(processedPath);

    // Delete original file
    fs.unlinkSync(filepath);

    // Generate avatar URL
    const avatarUrl = `/uploads/avatars/${processedFilename}`;

    // Get user's current avatar for deletion
    const user = await User.findById(userId);
    const oldAvatarUrl = user.avatar_url;

    // Update user avatar_url in database
    await User.update(userId, { avatar_url: avatarUrl });

    // Delete old avatar file if it exists
    if (oldAvatarUrl && oldAvatarUrl.startsWith('/uploads/avatars/')) {
      const oldFilename = oldAvatarUrl.split('/').pop();
      const oldFilepath = path.join(path.dirname(filepath), oldFilename);
      if (fs.existsSync(oldFilepath)) {
        fs.unlinkSync(oldFilepath);
      }
    }

    // Log activity
    const { logActivity } = require('../services/activityLogService');
    await logActivity({
      userId,
      action: 'avatar_uploaded',
      description: 'User uploaded new avatar',
      req,
    });

    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: {
        avatarUrl,
      },
    });
  } catch (error) {
    console.error('❌ Upload avatar error:', error);

    // Delete uploaded file if processing failed
    if (req.file && req.file.path) {
      const fs = require('fs');
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    }

    res.status(500).json({
      success: false,
      error: 'Failed to upload avatar',
      details: error.message,
    });
  }
};

/**
 * Delete user avatar
 *
 * DELETE /api/user/avatar
 */
const deleteAvatar = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's current avatar
    const user = await User.findById(userId);

    if (!user.avatar_url) {
      return res.status(404).json({
        success: false,
        error: 'No avatar to delete',
      });
    }

    const avatarUrl = user.avatar_url;

    // Remove avatar from database
    await User.update(userId, { avatar_url: null });

    // Delete avatar file
    if (avatarUrl.startsWith('/uploads/avatars/')) {
      const path = require('path');
      const fs = require('fs');
      const { uploadsDir } = require('../middleware/upload');
      const filename = avatarUrl.split('/').pop();
      const filepath = path.join(uploadsDir, filename);

      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
    }

    // Log activity
    const { logActivity } = require('../services/activityLogService');
    await logActivity({
      userId,
      action: 'avatar_deleted',
      description: 'User deleted avatar',
      req,
    });

    res.json({
      success: true,
      message: 'Avatar deleted successfully',
    });
  } catch (error) {
    console.error('❌ Delete avatar error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete avatar',
      details: error.message,
    });
  }
};

/**
 * Change user password
 *
 * POST /api/user/change-password
 * Body: { currentPassword, newPassword }
 */
const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required',
      });
    }

    // Validate new password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
      });
    }

    // Check if new password is same as current
    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        error: 'New password must be different from current password',
      });
    }

    // Get user with password hash
    const bcrypt = require('bcrypt');
    const user = await User.findByIdWithPassword(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect',
      });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await User.update(userId, { password_hash: newPasswordHash });

    // Log activity
    const { logActivity } = require('../services/activityLogService');
    await logActivity({
      userId,
      action: 'password_changed',
      description: 'User changed password',
      req,
    });

    // Send password changed confirmation email (non-blocking)
    try {
      const ipAddress = req.ip || req.headers["x-forwarded-for"] || "Unknown";
      await templateEmailService.sendPasswordChangedEmail(user.email, user.username || user.email, { ipAddress });
    } catch (emailError) {
      console.error("Failed to send password changed email:", emailError.message);
    }

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('❌ Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change password',
      details: error.message,
    });
  }
};

/**
 * Delete user account
 *
 * DELETE /api/user/account
 * Body: { password }
 */
const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    const { password } = req.body;

    // Password is required for account deletion
    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'Password is required to delete your account',
      });
    }

    // Get user with password hash
    const bcrypt = require('bcrypt');
    const user = await User.findByIdWithPassword(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid password',
      });
    }

    // Log activity before deletion
    const { logActivity } = require('../services/activityLogService');
    await logActivity({
      userId,
      action: 'account_deleted',
      description: 'User deleted their account',
      req,
    });

    // Delete user avatar if exists
    if (user.avatar_url && user.avatar_url.startsWith('/uploads/avatars/')) {
      const path = require('path');
      const fs = require('fs');
      const { uploadsDir } = require('../middleware/upload');
      const filename = user.avatar_url.split('/').pop();
      const filepath = path.join(uploadsDir, filename);

      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
    }

    // Delete user from database
    await User.delete(userId);

    // Send account deactivation email (non-blocking)
    templateEmailService.sendAccountDeactivationEmail(user.email, user.username || user.email)
      .catch(err => console.error('Failed to send account deactivation email:', err.message));

    res.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    console.error('❌ Delete account error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete account',
      details: error.message,
    });
  }
};

module.exports = {
  getProfile,
  getActivity,
  updateProfile,
  uploadAvatar,
  deleteAvatar,
  changePassword,
  deleteAccount,
};
