/**
 * Configuration management
 * Loads and validates environment variables
 */

require('dotenv').config();

const config = {
  // Server
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,

  // Database
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/authdb',
  },

  // Redis
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  },

  // CORS
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  },

  // Email
  email: {
    from: process.env.EMAIL_FROM || 'noreply@auth-system.com',
    service: process.env.EMAIL_SERVICE || 'gmail',
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },

  // Session
  session: {
    secret: process.env.SESSION_SECRET || 'dev-session-secret-change-in-production',
    name: 'sessionId',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
    // Session timeout settings
    timeout: {
      // Inactivity timeout - session expires if no activity for this duration
      inactivity: parseInt(process.env.SESSION_INACTIVITY_TIMEOUT, 10) || 30 * 60 * 1000, // 30 minutes
      // Absolute timeout - session expires after this duration regardless of activity
      absolute: parseInt(process.env.SESSION_ABSOLUTE_TIMEOUT, 10) || 7 * 24 * 60 * 60 * 1000, // 7 days
      // Remember me duration - extended session duration when "remember me" is checked
      rememberMe: parseInt(process.env.SESSION_REMEMBER_ME_DURATION, 10) || 30 * 24 * 60 * 60 * 1000, // 30 days
      // Cleanup interval - how often to run session cleanup job
      cleanupInterval: parseInt(process.env.SESSION_CLEANUP_INTERVAL, 10) || 60 * 60 * 1000, // 1 hour
    },
  },

  // OAuth
  oauth: {
    google: {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
    },
    github: {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:5000/api/auth/github/callback',
    },
  },
};

// Validate required environment variables in production
if (config.env === 'production') {
  const required = ['JWT_SECRET', 'DATABASE_URL', 'EMAIL_USER', 'EMAIL_PASSWORD'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

module.exports = config;
