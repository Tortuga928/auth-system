/**
 * Passport.js Configuration
 *
 * Configures Passport.js for OAuth2 authentication
 * Includes Google & GitHub OAuth2 strategies (Stories 6.2, 6.3, 6.4)
 */

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User');
const OAuthProvider = require('../models/OAuthProvider');
const config = require('./index');

/**
 * Serialize user for session
 * Stores user ID in session
 */
passport.serializeUser((user, done) => {
  done(null, user.id);
});

/**
 * Deserialize user from session
 * Retrieves full user object from database using stored ID
 */
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    if (!user) {
      return done(null, false);
    }
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

/**
 * Configure Google OAuth2 Strategy
 */
if (config.oauth.google.clientID && config.oauth.google.clientSecret) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: config.oauth.google.clientID,
        clientSecret: config.oauth.google.clientSecret,
        callbackURL: config.oauth.google.callbackURL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Extract user info from Google profile
          const googleId = profile.id;
          const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
          const displayName = profile.displayName;

          if (!email) {
            return done(new Error('No email found in Google profile'), null);
          }

          // STEP 1: Check if this Google account is already linked to a user
          const oauthLink = await OAuthProvider.findByProviderAndId('google', googleId);

          if (oauthLink) {
            // OAuth account already linked - get the user
            const user = await User.findById(oauthLink.user_id);
            console.log(`✅ Google OAuth: Linked account logged in (${email})`);
            return done(null, user);
          }

          // STEP 2: Check if user with this email already exists
          let user = await User.findByEmail(email);

          if (user) {
            // User exists - link this Google account to the user
            await OAuthProvider.upsert({
              user_id: user.id,
              provider: 'google',
              provider_user_id: googleId,
              provider_email: email,
            });
            console.log(`✅ Google OAuth: Account linked to existing user (${email})`);
            return done(null, user);
          }

          // STEP 3: No user exists - create new user and link Google account
          const username = email.split('@')[0] + '_google_' + Date.now();
          const randomPassword = require('crypto').randomBytes(32).toString('hex');
          const bcrypt = require('bcrypt');
          const password_hash = await bcrypt.hash(randomPassword, 10);

          user = await User.create({
            username,
            email,
            password_hash,
            role: 'user',
          });

          // Mark email as verified (Google verified it)
          await User.update(user.id, { email_verified: true });

          // Link Google account to new user
          await OAuthProvider.upsert({
            user_id: user.id,
            provider: 'google',
            provider_user_id: googleId,
            provider_email: email,
          });

          console.log(`✅ Google OAuth: New user created and linked (${email})`);
          return done(null, user);
        } catch (error) {
          console.error('❌ Google OAuth error:', error);
          return done(error, null);
        }
      }
    )
  );
  console.log('✅ Google OAuth strategy configured');
} else {
  console.log('⚠️  Google OAuth not configured (missing credentials)');
}

/**
 * Configure GitHub OAuth2 Strategy
 */
if (config.oauth.github.clientID && config.oauth.github.clientSecret) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: config.oauth.github.clientID,
        clientSecret: config.oauth.github.clientSecret,
        callbackURL: config.oauth.github.callbackURL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Extract user info from GitHub profile
          const githubId = profile.id;
          const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
          const displayName = profile.displayName || profile.username;

          if (!email) {
            return done(new Error('No email found in GitHub profile'), null);
          }

          // STEP 1: Check if this GitHub account is already linked to a user
          const oauthLink = await OAuthProvider.findByProviderAndId('github', githubId);

          if (oauthLink) {
            // OAuth account already linked - get the user
            const user = await User.findById(oauthLink.user_id);
            console.log(`✅ GitHub OAuth: Linked account logged in (${email})`);
            return done(null, user);
          }

          // STEP 2: Check if user with this email already exists
          let user = await User.findByEmail(email);

          if (user) {
            // User exists - link this GitHub account to the user
            await OAuthProvider.upsert({
              user_id: user.id,
              provider: 'github',
              provider_user_id: githubId,
              provider_email: email,
            });
            console.log(`✅ GitHub OAuth: Account linked to existing user (${email})`);
            return done(null, user);
          }

          // STEP 3: No user exists - create new user and link GitHub account
          const username = (email.split('@')[0] || profile.username) + '_github_' + Date.now();
          const randomPassword = require('crypto').randomBytes(32).toString('hex');
          const bcrypt = require('bcrypt');
          const password_hash = await bcrypt.hash(randomPassword, 10);

          user = await User.create({
            username,
            email,
            password_hash,
            role: 'user',
          });

          // Mark email as verified (GitHub verified it)
          await User.update(user.id, { email_verified: true });

          // Link GitHub account to new user
          await OAuthProvider.upsert({
            user_id: user.id,
            provider: 'github',
            provider_user_id: githubId,
            provider_email: email,
          });

          console.log(`✅ GitHub OAuth: New user created and linked (${email})`);
          return done(null, user);
        } catch (error) {
          console.error('❌ GitHub OAuth error:', error);
          return done(error, null);
        }
      }
    )
  );
  console.log('✅ GitHub OAuth strategy configured');
} else {
  console.log('⚠️  GitHub OAuth not configured (missing credentials)');
}

/**
 * Initialize Passport with Express app
 * Note: Does NOT initialize session support globally
 * Session support is applied only to OAuth routes
 *
 * @param {Object} app - Express application instance
 */
function initializePassport(app) {
  // Initialize Passport (without session support)
  app.use(passport.initialize());

  console.log('✅ Passport.js initialized (without global session)');
}

/**
 * Create session middleware for OAuth routes
 * This middleware must be applied before passport.session()
 *
 * @returns {Function} Express session middleware
 */
function createOAuthSessionMiddleware() {
  const session = require('express-session');
  const config = require('./index');

  return session({
    secret: config.expressSession.secret,
    name: config.expressSession.name,
    resave: config.expressSession.resave,
    saveUninitialized: false, // Don't create session until something stored
    cookie: config.expressSession.cookie,
  });
}

module.exports = {
  passport,
  initializePassport,
  createOAuthSessionMiddleware,
};
