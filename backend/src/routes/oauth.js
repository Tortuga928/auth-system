/**
 * OAuth Routes
 *
 * Routes for Google and GitHub OAuth2 authentication
 * Includes callback handling (Story 6.6)
 *
 * Note: Session middleware is applied ONLY to these OAuth routes
 * to avoid conflicts with JWT-based authentication
 */

const express = require('express');
const router = express.Router();
const { passport, createOAuthSessionMiddleware } = require('../config/passport');
const jwt = require('jsonwebtoken');
const config = require('../config');

// Apply session middleware ONLY to OAuth routes
const oauthSessionMiddleware = createOAuthSessionMiddleware();
router.use(oauthSessionMiddleware);
router.use(passport.session());

console.log('✅ OAuth routes configured with session support');

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
  passport.authenticate('google', { 
    failureRedirect: `${config.cors.origin}/login?error=oauth_failed` 
  }),
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

      // Redirect to frontend callback handler with tokens
      const frontendUrl = config.cors.origin || 'http://localhost:3000';
      const callbackUrl = `${frontendUrl}/oauth/callback?token=${accessToken}&refresh=${refreshToken}`;
      
      console.log(`✅ Google OAuth success - redirecting to frontend`);
      res.redirect(callbackUrl);
    } catch (error) {
      console.error('❌ OAuth callback error:', error);
      const frontendUrl = config.cors.origin || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/login?error=oauth_error`);
    }
  }
);

/**
 * @route   GET /api/oauth/github
 * @desc    Initiate GitHub OAuth2 flow
 * @access  Public
 */
router.get(
  '/github',
  passport.authenticate('github', {
    scope: ['user:email'],
  })
);

/**
 * @route   GET /api/oauth/github/callback
 * @desc    GitHub OAuth2 callback
 * @access  Public
 */
router.get(
  '/github/callback',
  passport.authenticate('github', { 
    failureRedirect: `${config.cors.origin}/login?error=oauth_failed` 
  }),
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

      // Redirect to frontend callback handler with tokens
      const frontendUrl = config.cors.origin || 'http://localhost:3000';
      const callbackUrl = `${frontendUrl}/oauth/callback?token=${accessToken}&refresh=${refreshToken}`;
      
      console.log(`✅ GitHub OAuth success - redirecting to frontend`);
      res.redirect(callbackUrl);
    } catch (error) {
      console.error('❌ OAuth callback error:', error);
      const frontendUrl = config.cors.origin || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/login?error=oauth_error`);
    }
  }
);

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
        status: googleConfigured ? 'Ready' : 'Not configured',
      },
      github: {
        configured: githubConfigured,
        status: githubConfigured ? 'Ready' : 'Not configured',
      },
      passportInitialized: true,
    },
  });
});

module.exports = router;
