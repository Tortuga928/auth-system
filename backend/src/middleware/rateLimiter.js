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

module.exports = {
  registrationLimiter,
  loginLimiter,
  passwordResetLimiter,
  emailVerificationLimiter,
  mfaVerificationLimiter,
  apiLimiter,
};
