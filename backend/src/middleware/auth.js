/**
 * Authentication Middleware
 *
 * Verifies JWT tokens and protects routes
 */

const { verifyAccessToken, extractTokenFromHeader } = require('../utils/jwt');
const User = require('../models/User');

/**
 * Authentication middleware
 *
 * Checks for valid JWT token in Authorization header
 * Attaches user object to req.user if valid
 * Returns 401 if token is missing or invalid
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'No authorization header provided',
      });
    }

    // Extract token from "Bearer <token>" format
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'Invalid authorization header format',
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
        error: error.message,
      });
    }

    // Get user from database
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
        error: 'User associated with token does not exist',
      });
    }

    // Attach user to request object
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      email_verified: user.email_verified,
    };

    // Attach full decoded token for additional info if needed
    req.token = decoded;

    // Continue to next middleware
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: error.message,
    });
  }
};

/**
 * Optional authentication middleware
 *
 * Similar to authenticate() but doesn't return 401 if no token
 * Attaches user to req.user if token is valid, otherwise req.user is null
 * Useful for routes that work differently for authenticated vs unauthenticated users
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // No token - continue without user
    if (!authHeader) {
      req.user = null;
      return next();
    }

    const token = extractTokenFromHeader(authHeader);

    // Invalid format - continue without user
    if (!token) {
      req.user = null;
      return next();
    }

    // Try to verify token
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (error) {
      // Invalid token - continue without user
      req.user = null;
      return next();
    }

    // Get user from database
    const user = await User.findById(decoded.id);

    if (user) {
      req.user = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        email_verified: user.email_verified,
      };
      req.token = decoded;
    } else {
      req.user = null;
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    req.user = null;
    next();
  }
};

/**
 * Role-based authorization middleware
 *
 * Requires authenticate() middleware to be applied first
 * Checks if user has required role
 *
 * @param {string|string[]} roles - Required role(s)
 * @returns {Function} Express middleware function
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Convert single role to array
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    // Check if user has required role
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        error: `This action requires one of the following roles: ${allowedRoles.join(', ')}`,
      });
    }

    next();
  };
};

/**
 * Email verification middleware
 *
 * Requires authenticate() middleware to be applied first
 * Checks if user's email is verified
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const requireEmailVerified = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  if (!req.user.email_verified) {
    return res.status(403).json({
      success: false,
      message: 'Email verification required',
      error: 'Please verify your email address to access this resource',
    });
  }

  next();
};

module.exports = {
  authenticate,
  optionalAuth,
  requireRole,
  requireEmailVerified,
};
