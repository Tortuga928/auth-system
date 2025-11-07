/**
 * Authentication Routes
 *
 * Routes for user registration, login, and token management
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

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
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private (requires auth middleware)
 */
// router.get('/me', authMiddleware, authController.getCurrentUser);

module.exports = router;
