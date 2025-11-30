/**
 * Rate limiting middleware for sensitive endpoints
 * Prevents abuse and brute force attacks
 */

const rateLimit = require('express-rate-limit');

// Disable rate limiting in test environment
const isTestEnv = process.env.NODE_ENV === 'test';
const skipRateLimit = (req, res, next) => next();

/**
 * Registration rate limiter
 * Limits: 5 registration attempts per hour per IP
 * Prevents automated account creation and spam
 */
const registrationLimiter = isTestEnv ? skipRateLimit : rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 requests per hour
  message: {
    error: 'Too many registration attempts from this IP. Please try again later.',
    retryAfter: '1 hour',
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  // Store in memory (for production, consider Redis)
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many registration attempts',
      message: 'You have exceeded the registration limit. Please try again in 1 hour.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000), // Seconds until reset
    });
  },
});

/**
 * Login rate limiter
 * Limits: 10 login attempts per 15 minutes per IP
 * Prevents brute force password attacks
 */
const loginLimiter = isTestEnv ? skipRateLimit : rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per 15 minutes
  message: {
    error: 'Too many login attempts from this IP. Please try again later.',
    retryAfter: '15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many login attempts',
      message: 'You have exceeded the login attempt limit. Please try again in 15 minutes.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
    });
  },
});

/**
 * Password reset rate limiter
 * Limits: 3 password reset requests per hour per IP
 * Prevents email flooding and abuse
 */
const passwordResetLimiter = isTestEnv ? skipRateLimit : rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per hour
  message: {
    error: 'Too many password reset requests from this IP. Please try again later.',
    retryAfter: '1 hour',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many password reset requests',
      message: 'You have exceeded the password reset limit. Please try again in 1 hour.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
    });
  },
});

/**
 * Email verification rate limiter
 * Limits: 5 verification requests per hour per IP
 * Prevents email flooding
 */
const emailVerificationLimiter = isTestEnv ? skipRateLimit : rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 requests per hour
  message: {
    error: 'Too many email verification requests from this IP. Please try again later.',
    retryAfter: '1 hour',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many verification requests',
      message: 'You have exceeded the email verification limit. Please try again in 1 hour.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
    });
  },
});

/**
 * MFA verification rate limiter
 * Limits: 5 MFA attempts per 15 minutes per IP
 * Prevents brute force MFA code attacks
 */
const mfaVerificationLimiter = isTestEnv ? skipRateLimit : rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per 15 minutes
  message: {
    error: 'Too many MFA verification attempts from this IP. Please try again later.',
    retryAfter: '15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many MFA verification attempts',
      message: 'You have exceeded the MFA verification limit. Please try again in 15 minutes.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
    });
  },
});

/**
 * General API rate limiter (for public endpoints)
 * Limits: 100 requests per 15 minutes per IP
 * Prevents API abuse
 */
const apiLimiter = isTestEnv ? skipRateLimit : rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  message: {
    error: 'Too many requests from this IP. Please try again later.',
    retryAfter: '15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'You have made too many requests. Please try again in 15 minutes.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
    });
  },
});


/**
 * Test email rate limiter (daily limit)
 * Limits: 25 test emails per 24 hours per user
 * Prevents email abuse
 */
const testEmailDailyLimiter = isTestEnv ? skipRateLimit : rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 25, // 25 requests per day
  message: {
    error: 'Daily test email limit reached',
    message: 'You have reached the daily limit for test emails. Please try again tomorrow.',
    retryAfter: 'tomorrow',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => 'test_email_daily:' + (req.user?.id || req.ip),
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Daily limit reached',
      message: 'You have reached the daily limit for test emails (25 per day). Please try again tomorrow.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
    });
  },
});

/**
 * Test email cooldown limiter
 * Limits: 1 request per 30 seconds per user
 * Prevents rapid repeated requests
 */
const testEmailCooldownLimiter = isTestEnv ? skipRateLimit : rateLimit({
  windowMs: 30 * 1000, // 30 seconds
  max: 1, // 1 request per 30 seconds
  message: {
    error: 'Please wait before sending another test email',
    retryAfter: '30 seconds',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => 'test_email_cooldown:' + (req.user?.id || req.ip),
  handler: (req, res) => {
    const remainingSeconds = Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000);
    res.status(429).json({
      success: false,
      error: 'Cooldown active',
      message: 'Please wait ' + remainingSeconds + ' seconds before sending another test email.',
      cooldownRemaining: remainingSeconds,
      retryAfter: remainingSeconds,
    });
  },
});

module.exports = {
  registrationLimiter,
  loginLimiter,
  passwordResetLimiter,
  emailVerificationLimiter,
  mfaVerificationLimiter,
  apiLimiter,
  testEmailDailyLimiter,
  testEmailCooldownLimiter,
};
