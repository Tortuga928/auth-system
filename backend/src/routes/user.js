/**
 * User Routes
 *
 * Routes for user profile and dashboard data
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const userController = require('../controllers/userController');

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

module.exports = router;
