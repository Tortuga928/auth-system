/**
 * OAuth Routes
 *
 * Routes for Google and GitHub OAuth2 authentication
 * Strategies will be implemented in Stories 6.2 and 6.3
 */

const express = require('express');
const router = express.Router();
const { passport } = require('../config/passport');
const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * @route   GET /api/oauth/google
 * @desc    Initiate Google OAuth2 flow
 * @access  Public
 */
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  })
);

/**
 * @route   GET /api/oauth/google/callback
 * @desc    Google OAuth2 callback
 * @access  Public
 */
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/login?error=oauth_failed' }),
  (req, res) => {
    try {
      // User is authenticated - generate JWT tokens
      const user = req.user;

      // Generate access token
      const accessToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      // Generate refresh token
      const refreshToken = jwt.sign(
        { id: user.id },
        config.jwt.secret,
        { expiresIn: config.jwt.refreshExpiresIn }
      );

      // TODO: In production, redirect to frontend with token
      // For now, return JSON response for testing
      res.json({
        success: true,
        message: 'Google OAuth login successful',
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            email_verified: user.email_verified,
          },
          accessToken,
          refreshToken,
        },
      });
    } catch (error) {
      console.error('❌ OAuth callback error:', error);
      res.status(500).json({
        success: false,
        error: 'OAuth authentication failed',
        details: error.message,
      });
    }
  }
);

/**
 * @route   GET /api/oauth/github
 * @desc    Initiate GitHub OAuth2 flow
 * @access  Public
 *
 * Implementation: Story 6.3 - GitHub OAuth Strategy
 */
router.get('/github', (req, res) => {
  res.status(501).json({
    success: false,
    message: 'GitHub OAuth not yet implemented (Story 6.3)',
  });
});

/**
 * @route   GET /api/oauth/github/callback
 * @desc    GitHub OAuth2 callback
 * @access  Public
 *
 * Implementation: Story 6.3 - GitHub OAuth Strategy
 */
router.get('/github/callback', (req, res) => {
  res.status(501).json({
    success: false,
    message: 'GitHub OAuth callback not yet implemented (Story 6.3)',
  });
});

/**
 * @route   GET /api/oauth/status
 * @desc    Check OAuth configuration status
 * @access  Public
 */
router.get('/status', (req, res) => {
  const config = require('../config');

  const googleConfigured = !!(config.oauth.google.clientID && config.oauth.google.clientSecret);
  const githubConfigured = !!(config.oauth.github.clientID && config.oauth.github.clientSecret);

  res.json({
    success: true,
    message: 'OAuth configuration status',
    data: {
      google: {
        configured: googleConfigured,
        status: googleConfigured ? 'Ready (Story 6.2)' : 'Not configured',
      },
      github: {
        configured: githubConfigured,
        status: githubConfigured ? 'Ready (Story 6.3)' : 'Not configured',
      },
      passportInitialized: true,
    },
  });
});

module.exports = router;
