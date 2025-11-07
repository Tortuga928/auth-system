/**
 * Passport.js Configuration
 *
 * Configures Passport.js for OAuth2 authentication
 * Strategies will be added in Stories 6.2 and 6.3
 */

const passport = require('passport');
const User = require('../models/User');

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
 * Initialize Passport with Express app
 *
 * @param {Object} app - Express application instance
 */
function initializePassport(app) {
  // Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());

  console.log('✅ Passport.js initialized');
  console.log('   Strategies: Will be configured in Stories 6.2 and 6.3');
}

module.exports = {
  passport,
  initializePassport,
};
