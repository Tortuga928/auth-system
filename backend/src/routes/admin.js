/**
 * Admin Routes
 *
 * Routes for admin panel - user management, system monitoring, configuration
 * All routes require admin or super_admin role
 */

const express = require('express');
const router = express.Router();
const { authenticate, isAdmin, isSuperAdmin } = require('../middleware/auth');
const adminController = require('../controllers/adminController');
const auditLog = require('../middleware/auditLog');

// Apply authentication to all admin routes
router.use(authenticate);

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with pagination and filtering
 * @query   page (default: 1), pageSize (default: 20), role, status, search
 * @access  Admin
 *
 * Returns paginated list of users with filtering options
 */
router.get('/users', isAdmin, adminController.getUsers);

/**
 * @route   GET /api/admin/users/search
 * @desc    Search users by email or username
 * @query   q - Search query
 * @access  Admin
 *
 * Searches users by email or username (partial match)
 * NOTE: Must come BEFORE /users/:id route to avoid matching "search" as an ID
 */
router.get('/users/search', isAdmin, adminController.searchUsers);

/**
 * @route   GET /api/admin/users/:id
 * @desc    Get user details by ID
 * @param   id - User ID
 * @access  Admin
 *
 * Returns full user details including profile, sessions, activity
 */
router.get('/users/:id', isAdmin, adminController.getUserById);

/**
 * @route   POST /api/admin/users
 * @desc    Create new user
 * @body    { username, email, password, role }
 * @access  Admin
 *
 * Creates new user with specified role
 * Email verification can be bypassed by admin
 */
router.post('/users', isAdmin, auditLog(auditLog.ACTION_TYPES.USER_CREATE, (req, data) => ({ targetId: data.data.user.id, details: { username: data.data.user.username, email: data.data.user.email, role: data.data.user.role } })), adminController.createUser);

/**
 * @route   PUT /api/admin/users/:id
 * @desc    Update user
 * @param   id - User ID
 * @body    { username?, email?, role?, status? }
 * @access  Admin
 *
 * Updates user profile, role, or status
 */
router.put('/users/:id', isAdmin, auditLog(auditLog.ACTION_TYPES.USER_UPDATE, (req, data) => ({ targetId: parseInt(req.params.id), details: req.body })), adminController.updateUser);

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Delete/deactivate user
 * @param   id - User ID
 * @access  Admin
 *
 * Soft delete (sets is_active = false)
 * Hard delete available for super_admin only
 */
router.delete('/users/:id', isAdmin, auditLog(auditLog.ACTION_TYPES.USER_DELETE, (req, data) => ({ targetId: parseInt(req.params.id) })), adminController.deleteUser);

/**
 * @route   PUT /api/admin/users/:id/role
 * @desc    Update user role
 * @param   id - User ID
 * @body    { role: 'user'|'admin'|'super_admin' }
 * @access  Admin (super_admin for granting super_admin)
 *
 * Changes user role
 * Only super_admin can grant super_admin role
 */
router.put('/users/:id/role', isAdmin, auditLog(auditLog.ACTION_TYPES.USER_ROLE_CHANGE, (req, data) => ({ targetId: parseInt(req.params.id), details: { newRole: req.body.role } })), adminController.updateUserRole);

/**
 * @route   PUT /api/admin/users/:id/status
 * @desc    Update user status (active/inactive/suspended)
 * @param   id - User ID
 * @body    { is_active: boolean }
 * @access  Admin
 *
 * Activate or deactivate user account
 */
router.put('/users/:id/status', isAdmin, auditLog(auditLog.ACTION_TYPES.USER_STATUS_CHANGE, (req, data) => ({ targetId: parseInt(req.params.id), details: { is_active: req.body.is_active } })), adminController.updateUserStatus);

/**
 * @route   PUT /api/admin/users/:id/reactivate
 * @desc    Reactivate an inactive user account
 * @param   id - User ID
 * @access  Admin
 *
 * Sets is_active = true for a deactivated user
 */
router.put('/users/:id/reactivate', isAdmin, auditLog(auditLog.ACTION_TYPES.USER_STATUS_CHANGE, (req, data) => ({ targetId: parseInt(req.params.id), details: { is_active: true, action: 'reactivate' } })), adminController.reactivateUser);

/**
 * @route   POST /api/admin/users/:id/test-email
 * @desc    Send test email to a user (for admin verification)
 * @param   id - User ID
 * @access  Admin (no rate limiting)
 *
 * Sends a branded test email to the target user's email address.
 * Returns technical error details for debugging.
 * Logs action to audit log.
 */
router.post('/users/:id/test-email', isAdmin, async (req, res) => {
  const User = require('../models/User');
  const emailTestService = require('../services/emailTestService');
  const { logAdminAction, ACTION_TYPES, TARGET_TYPES } = require('../middleware/auditLog');

  try {
    const targetUserId = parseInt(req.params.id);

    // Get target user
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: `No user found with ID ${targetUserId}`,
      });
    }

    // Send test email
    const result = await emailTestService.sendBrandedTestEmail(targetUser.email);

    // Log to audit log
    await logAdminAction(
      req,
      ACTION_TYPES.USER_UPDATE || 'TEST_EMAIL_SENT',
      TARGET_TYPES.USER || 'USER',
      targetUserId,
      {
        action: 'test_email_sent',
        recipient: targetUser.email,
        messageId: result.messageId,
        timestamp: result.timestamp,
      }
    );

    res.json({
      success: true,
      message: 'Test email sent successfully',
      email: targetUser.email,
      timestamp: result.timestamp,
      messageId: result.messageId,
    });
  } catch (error) {
    console.error('Admin test email error:', error);

    // Return technical details for admins
    res.status(500).json({
      success: false,
      error: 'Failed to send test email',
      message: error.message,
      details: {
        code: error.code,
        command: error.command,
        response: error.response,
      },
    });
  }
});

/**
 * @route   GET /api/admin/audit-logs
 * @desc    Get audit logs of admin actions
 * @query   page, pageSize, admin_id, action, start_date, end_date
 * @access  Admin
 *
 * Returns paginated audit logs with filtering
 */
router.get('/audit-logs', isAdmin, adminController.getAuditLogs);

/**
 * @route   GET /api/admin/dashboard/stats
 * @desc    Get dashboard statistics
 * @access  Admin
 *
 * Returns:
 * - Total users, active users, new users (today/week/month)
 * - Admin count, suspended count
 * - Recent activity summary
 */
router.get('/dashboard/stats', isAdmin, adminController.getDashboardStats);

/**
 * @route   GET /api/admin/dashboard/user-growth
 * @desc    Get user growth statistics
 * @query   days (default: 30)
 * @access  Admin
 *
 * Returns user registration trends over specified period
 */
router.get('/dashboard/user-growth', isAdmin, adminController.getUserGrowth);

/**
 * @route   GET /api/admin/dashboard/activity
 * @desc    Get recent activity summary
 * @access  Admin
 *
 * Returns:
 * - Login attempts today
 * - Failed logins today
 * - Active sessions now
 * - Security events today
 */
router.get('/dashboard/activity', isAdmin, adminController.getActivitySummary);

/**
 * @route   GET /api/admin/dashboard/security
 * @desc    Get security overview
 * @access  Admin
 *
 * Returns:
 * - Critical alerts count
 * - MFA enabled percentage
 * - Recent failed logins
 * - Suspicious activity
 */
router.get('/dashboard/security', isAdmin, adminController.getSecurityOverview);


/**
 * @route   GET /api/admin/users-v2
 * @desc    Get all users with archive status support
 * @query   page, pageSize, role, status (active|inactive|archived|all), search
 * @access  Admin
 *
 * Returns paginated list with archive filtering
 * Default status = 'active' (shows only active, non-archived users)
 */
router.get('/users-v2', isAdmin, adminController.getUsersWithArchive);

/**
 * @route   POST /api/admin/users/:id/archive
 * @desc    Archive a user (hide from default views)
 * @param   id - User ID
 * @access  Admin
 *
 * Archives user - sets archived_at timestamp, deactivates account
 */
router.post('/users/:id/archive', isAdmin, auditLog(auditLog.ACTION_TYPES.USER_ARCHIVE, (req, data) => ({ targetId: parseInt(req.params.id), details: { action: 'archive' } })), adminController.archiveUser);

/**
 * @route   POST /api/admin/users/:id/restore
 * @desc    Restore a user from archive
 * @param   id - User ID
 * @access  Admin
 *
 * Restores user - clears archived_at timestamp
 * Note: User will still be inactive after restore
 */
router.post('/users/:id/restore', isAdmin, auditLog(auditLog.ACTION_TYPES.USER_RESTORE, (req, data) => ({ targetId: parseInt(req.params.id), details: { action: 'restore' } })), adminController.restoreUser);

/**
 * @route   POST /api/admin/users/:id/anonymize
 * @desc    Anonymize user data for GDPR compliance
 * @param   id - User ID
 * @access  Super Admin only
 *
 * Anonymizes PII - requires user to be archived first
 * Irreversible action - requires type confirmation on frontend
 */
router.post('/users/:id/anonymize', isSuperAdmin, auditLog(auditLog.ACTION_TYPES.USER_ANONYMIZE, (req, data) => ({ targetId: parseInt(req.params.id), details: { action: 'anonymize' } })), adminController.anonymizeUser);

module.exports = router;
