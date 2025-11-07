/**
 * OAuth Routes
 *
 * Routes for Google and GitHub OAuth2 authentication
 * Strategies will be implemented in Stories 6.2 and 6.3
 */

const express = require('express');
const router = express.Router();

/**
 * @route   GET /api/oauth/google
 * @desc    Initiate Google OAuth2 flow
 * @access  Public
 *
 * Implementation: Story 6.2 - Google OAuth Strategy
 */
router.get('/google', (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Google OAuth not yet implemented (Story 6.2)',
  });
});

/**
 * @route   GET /api/oauth/google/callback
 * @desc    Google OAuth2 callback
 * @access  Public
 *
 * Implementation: Story 6.2 - Google OAuth Strategy
 */
router.get('/google/callback', (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Google OAuth callback not yet implemented (Story 6.2)',
  });
});

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
