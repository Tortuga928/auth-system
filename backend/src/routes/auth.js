/**
 * Authentication Routes
 *
 * Routes for user registration, login, and token management
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 * @body    { username, email, password }
 */
router.post('/register', authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 * @body    { email, password }
 */
router.post('/login', authController.login);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 * @body    { refreshToken }
 */
router.post('/refresh', authController.refresh);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 * @body    { email }
 */
router.post('/forgot-password', authController.forgotPassword);

/**
 * @route   GET /api/auth/verify-email/:token
 * @desc    Verify user email address
 * @access  Public
 * @params  token - Email verification token
 */
router.get('/verify-email/:token', authController.verifyEmail);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private (requires authentication)
 */
router.get('/me', authenticate, authController.getCurrentUser);

module.exports = router;
