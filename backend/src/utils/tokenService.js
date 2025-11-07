/**
 * Token Service
 *
 * Handles generation and validation of email verification and password reset tokens.
 * Uses cryptographically secure random tokens with expiration.
 */

const crypto = require('crypto');

/**
 * Generate cryptographically secure random token
 *
 * @param {number} byteLength - Number of random bytes (default: 32)
 * @returns {string} Hexadecimal token string
 */
function generateToken(byteLength = 32) {
  return crypto.randomBytes(byteLength).toString('hex');
}

/**
 * Generate email verification token with 24-hour expiration
 *
 * @returns {Object} Token object with token and expiration
 * @returns {string} token - Cryptographically secure random token
 * @returns {Date} expires - Expiration timestamp (24 hours from now)
 */
function generateEmailVerificationToken() {
  const token = generateToken();
  const expires = new Date();
  expires.setHours(expires.getHours() + 24); // 24 hours from now

  return {
    token,
    expires,
  };
}

/**
 * Generate password reset token with 1-hour expiration
 *
 * @returns {Object} Token object with token and expiration
 * @returns {string} token - Cryptographically secure random token
 * @returns {Date} expires - Expiration timestamp (1 hour from now)
 */
function generatePasswordResetToken() {
  const token = generateToken();
  const expires = new Date();
  expires.setHours(expires.getHours() + 1); // 1 hour from now

  return {
    token,
    expires,
  };
}

/**
 * Check if token has expired
 *
 * @param {Date|string} expiresAt - Token expiration timestamp
 * @returns {boolean} True if token has expired, false otherwise
 */
function isTokenExpired(expiresAt) {
  if (!expiresAt) {
    return true; // No expiration means expired
  }

  const now = new Date();
  const expires = new Date(expiresAt);

  return now > expires;
}

/**
 * Validate email verification token
 *
 * Checks if token matches and hasn't expired
 *
 * @param {string} providedToken - Token provided by user
 * @param {string} storedToken - Token stored in database
 * @param {Date|string} expiresAt - Token expiration timestamp
 * @returns {Object} Validation result
 * @returns {boolean} valid - True if token is valid
 * @returns {string} error - Error message if invalid
 */
function validateEmailVerificationToken(providedToken, storedToken, expiresAt) {
  // Check if token exists
  if (!providedToken || !storedToken) {
    return {
      valid: false,
      error: 'Token is missing',
    };
  }

  // Check if token matches
  if (providedToken !== storedToken) {
    return {
      valid: false,
      error: 'Invalid token',
    };
  }

  // Check if token has expired
  if (isTokenExpired(expiresAt)) {
    return {
      valid: false,
      error: 'Token has expired',
    };
  }

  return {
    valid: true,
    error: null,
  };
}

/**
 * Validate password reset token
 *
 * Checks if token matches and hasn't expired
 *
 * @param {string} providedToken - Token provided by user
 * @param {string} storedToken - Token stored in database
 * @param {Date|string} expiresAt - Token expiration timestamp
 * @returns {Object} Validation result
 * @returns {boolean} valid - True if token is valid
 * @returns {string} error - Error message if invalid
 */
function validatePasswordResetToken(providedToken, storedToken, expiresAt) {
  // Check if token exists
  if (!providedToken || !storedToken) {
    return {
      valid: false,
      error: 'Token is missing',
    };
  }

  // Check if token matches
  if (providedToken !== storedToken) {
    return {
      valid: false,
      error: 'Invalid token',
    };
  }

  // Check if token has expired
  if (isTokenExpired(expiresAt)) {
    return {
      valid: false,
      error: 'Token has expired',
    };
  }

  return {
    valid: true,
    error: null,
  };
}

/**
 * Hash token for secure storage (optional extra security layer)
 *
 * If you want to hash tokens before storing in database,
 * use this function. The provided token will need to be hashed
 * before comparison.
 *
 * @param {string} token - Token to hash
 * @returns {string} SHA256 hash of token
 */
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Clear verification token from user object
 *
 * Helper function to create update object for clearing tokens
 *
 * @returns {Object} Update object to clear email verification token
 */
function clearEmailVerificationToken() {
  return {
    email_verification_token: null,
    email_verification_expires: null,
  };
}

/**
 * Clear password reset token from user object
 *
 * Helper function to create update object for clearing tokens
 *
 * @returns {Object} Update object to clear password reset token
 */
function clearPasswordResetToken() {
  return {
    password_reset_token: null,
    password_reset_expires: null,
  };
}

module.exports = {
  generateToken,
  generateEmailVerificationToken,
  generatePasswordResetToken,
  isTokenExpired,
  validateEmailVerificationToken,
  validatePasswordResetToken,
  hashToken,
  clearEmailVerificationToken,
  clearPasswordResetToken,
};
