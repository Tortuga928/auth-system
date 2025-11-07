/**
 * Passport.js Configuration
 *
 * Configures Passport.js for OAuth2 authentication
 * Includes Google OAuth2 strategy (Story 6.2)
 */

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
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

          // Check if user already exists with this email
          let user = await User.findByEmail(email);

          if (user) {
            // User exists - could update OAuth info here if needed
            console.log(`✅ Google OAuth: Existing user logged in (${email})`);
            return done(null, user);
          }

          // Create new user from Google profile
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

          console.log(`✅ Google OAuth: New user created (${email})`);
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
 * Initialize Passport with Express app
 *
 * @param {Object} app - Express application instance
 */
function initializePassport(app) {
  // Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());

  console.log('✅ Passport.js initialized');
}

module.exports = {
  passport,
  initializePassport,
};
