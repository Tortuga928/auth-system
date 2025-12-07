/**
 * User Routes
 *
 * Routes for user profile and dashboard data
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { uploadAvatar } = require('../middleware/upload');
const userController = require('../controllers/userController');
const { testEmailDailyLimiter, testEmailCooldownLimiter } = require('../middleware/rateLimiter');
const emailTestService = require('../services/emailTestService');
const { logActivity } = require('../services/activityLogService');
const User = require('../models/User');

/**
 * @route   GET /api/user/profile
 * @desc    Get user profile and dashboard data
 * @access  Private
 *
 * Returns:
 * - User basic info (id, username, email, role, emailVerified, dates)
 * - Security info (MFA status, OAuth accounts)
 * - Recent activity (last 5 logs)
 */
router.get('/profile', authenticate, userController.getProfile);

/**
 * @route   GET /api/user/activity
 * @desc    Get user activity history with pagination
 * @query   page (default: 1), limit (default: 25, max: 100)
 * @access  Private
 *
 * Returns:
 * - logs: Array of activity log entries
 * - pagination: { page, pageSize, totalCount, totalPages }
 */
router.get('/activity', authenticate, userController.getActivity);

/**
 * @route   PUT /api/user/profile
 * @desc    Update user profile
 * @body    { username?, email? }
 * @access  Private
 *
 * Updates username and/or email
 * If email changes, email_verified is set to false
 */
router.put('/profile', authenticate, userController.updateProfile);

/**
 * @route   POST /api/user/avatar
 * @desc    Upload user avatar
 * @body    multipart/form-data with 'avatar' file
 * @access  Private
 *
 * Accepts: JPEG, PNG, GIF, WebP (max 5MB)
 * Processing: Resized to 300x300, optimized
 */
router.post('/avatar', authenticate, uploadAvatar, userController.uploadAvatar);

/**
 * @route   DELETE /api/user/avatar
 * @desc    Delete user avatar
 * @access  Private
 *
 * Removes avatar from database and deletes file
 */
router.delete('/avatar', authenticate, userController.deleteAvatar);

/**
 * @route   POST /api/user/change-password
 * @desc    Change user password
 * @body    { currentPassword, newPassword }
 * @access  Private
 *
 * Requires current password for verification
 * New password must meet strength requirements
 */
router.post('/change-password', authenticate, userController.changePassword);

/**
 * @route   DELETE /api/user/account
 * @desc    Delete user account permanently
 * @body    { password }
 * @access  Private
 *
 * Requires password confirmation
 * Deletes all user data including avatar
 * This action cannot be undone
 */
router.delete('/account', authenticate, userController.deleteAccount);


/**
 * @route   POST /api/user/test-email
 * @desc    Send test email to verify email delivery
 * @access  Private (rate limited: 30s cooldown, 25/day)
 *
 * Sends a branded test email to the authenticated user's email address.
 * Rate limited to prevent abuse:
 * - 30 second cooldown between requests
 * - Maximum 25 emails per day
 */
router.post('/test-email', authenticate, testEmailCooldownLimiter, testEmailDailyLimiter, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's email
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Send test email
    const result = await emailTestService.sendBrandedTestEmail(user.email);

    // Log activity
    await logActivity({
      userId,
      action: 'test_email_sent',
      description: 'User sent test email to verify delivery',
      metadata: { recipient: user.email, timestamp: result.timestamp },
      req,
    });

    res.json({
      success: true,
      message: 'Test email sent successfully',
      email: user.email,
      timestamp: result.timestamp,
    });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to send test email. Please try again later.',
    });
  }
});
module.exports = router;
