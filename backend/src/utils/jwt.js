/**
 * JWT Token Utilities
 *
 * Provides JWT token generation and validation for authentication.
 *
 * Features:
 * - Access token generation (short-lived, 15 minutes)
 * - Refresh token generation (long-lived, 7 days)
 * - Token validation and decoding
 * - Automatic expiration handling
 */

const jwt = require('jsonwebtoken');

// Configuration from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-change-in-production';
const JWT_ACCESS_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

/**
 * Generates an access token for a user
 *
 * Access tokens are short-lived (15 minutes) and used for API authentication
 *
 * @param {Object} user - User object
 * @param {number} user.id - User ID
 * @param {string} user.email - User email
 * @param {string} user.role - User role
 * @returns {string} - JWT access token
 */
function generateAccessToken(user) {
  if (!user || !user.id) {
    throw new Error('User ID is required to generate access token');
  }

  const payload = {
    id: user.id,
    email: user.email,
    role: user.role || 'user',
    type: 'access',
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_ACCESS_EXPIRES_IN,
    issuer: 'auth-system',
    audience: 'auth-system-api',
  });
}

/**
 * Generates a refresh token for a user
 *
 * Refresh tokens are long-lived (7 days) and used to obtain new access tokens
 *
 * @param {Object} user - User object
 * @param {number} user.id - User ID
 * @returns {string} - JWT refresh token
 */
function generateRefreshToken(user) {
  if (!user || !user.id) {
    throw new Error('User ID is required to generate refresh token');
  }

  const payload = {
    id: user.id,
    type: 'refresh',
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
    issuer: 'auth-system',
    audience: 'auth-system-api',
  });
}

/**
 * Generates both access and refresh tokens
 *
 * @param {Object} user - User object
 * @param {number} user.id - User ID
 * @param {string} user.email - User email
 * @param {string} user.role - User role
 * @returns {Object} - { accessToken, refreshToken }
 */
function generateTokenPair(user) {
  return {
    accessToken: generateAccessToken(user),
    refreshToken: generateRefreshToken(user),
  };
}

/**
 * Verifies and decodes a JWT token
 *
 * @param {string} token - JWT token to verify
 * @param {string} expectedType - Expected token type ('access' or 'refresh')
 * @returns {Object} - Decoded token payload
 * @throws {Error} - If token is invalid, expired, or wrong type
 */
function verifyToken(token, expectedType = null) {
  if (!token) {
    throw new Error('Token is required');
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'auth-system',
      audience: 'auth-system-api',
    });

    // Check token type if specified
    if (expectedType && decoded.type !== expectedType) {
      throw new Error(`Invalid token type. Expected ${expectedType}, got ${decoded.type}`);
    }

    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    } else if (error.name === 'NotBeforeError') {
      throw new Error('Token not yet valid');
    } else {
      throw error;
    }
  }
}

/**
 * Verifies an access token
 *
 * @param {string} token - JWT access token to verify
 * @returns {Object} - Decoded token payload
 * @throws {Error} - If token is invalid or not an access token
 */
function verifyAccessToken(token) {
  return verifyToken(token, 'access');
}

/**
 * Verifies a refresh token
 *
 * @param {string} token - JWT refresh token to verify
 * @returns {Object} - Decoded token payload
 * @throws {Error} - If token is invalid or not a refresh token
 */
function verifyRefreshToken(token) {
  return verifyToken(token, 'refresh');
}

/**
 * Decodes a token without verification (for debugging only)
 *
 * WARNING: This does not verify the token signature!
 * Only use for debugging or when verification is not needed.
 *
 * @param {string} token - JWT token to decode
 * @returns {Object|null} - Decoded token payload or null if invalid
 */
function decodeToken(token) {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
}

/**
 * Extracts the token from an Authorization header
 *
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} - Extracted token or null if invalid format
 */
function extractTokenFromHeader(authHeader) {
  if (!authHeader) {
    return null;
  }

  // Expected format: "Bearer <token>"
  const parts = authHeader.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyToken,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  extractTokenFromHeader,
  // Export for testing
  JWT_SECRET,
  JWT_ACCESS_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN,
};
