/**
 * Activity Log Service
 *
 * Helper functions for logging user activities throughout the application
 * Provides convenient methods for common activity types
 */

const ActivityLog = require('../models/ActivityLog');

/**
 * Extract IP address from request
 * Handles X-Forwarded-For header for proxied requests
 *
 * @param {Object} req - Express request object
 * @returns {string|null} IP address
 */
function getIpAddress(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    null
  );
}

/**
 * Extract user agent from request
 *
 * @param {Object} req - Express request object
 * @returns {string|null} User agent string
 */
function getUserAgent(req) {
  return req.headers['user-agent'] || null;
}

/**
 * Log a user activity
 *
 * @param {Object} params - Activity parameters
 * @param {number} params.userId - User ID
 * @param {string} params.action - Action type
 * @param {string} [params.description] - Human-readable description
 * @param {Object} [params.req] - Express request object (to extract IP and user agent)
 * @param {Object} [params.metadata] - Additional contextual data
 * @returns {Promise<Object>} Created activity log entry
 */
async function logActivity({ userId, action, description, req, metadata }) {
  return await ActivityLog.create({
    user_id: userId,
    action,
    description,
    ip_address: req ? getIpAddress(req) : null,
    user_agent: req ? getUserAgent(req) : null,
    metadata,
  });
}

/**
 * Log user login
 *
 * @param {number} userId - User ID
 * @param {Object} req - Express request object
 * @param {Object} [metadata] - Additional data (e.g., { method: 'password' })
 * @returns {Promise<Object>} Created activity log entry
 */
async function logLogin(userId, req, metadata = {}) {
  return await logActivity({
    userId,
    action: 'login',
    description: 'User logged in',
    req,
    metadata: { ...metadata, timestamp: new Date().toISOString() },
  });
}

/**
 * Log user logout
 *
 * @param {number} userId - User ID
 * @param {Object} req - Express request object
 * @returns {Promise<Object>} Created activity log entry
 */
async function logLogout(userId, req) {
  return await logActivity({
    userId,
    action: 'logout',
    description: 'User logged out',
    req,
  });
}

/**
 * Log password change
 *
 * @param {number} userId - User ID
 * @param {Object} req - Express request object
 * @returns {Promise<Object>} Created activity log entry
 */
async function logPasswordChange(userId, req) {
  return await logActivity({
    userId,
    action: 'password_changed',
    description: 'User changed password',
    req,
  });
}

/**
 * Log password reset request
 *
 * @param {number} userId - User ID
 * @param {Object} req - Express request object
 * @returns {Promise<Object>} Created activity log entry
 */
async function logPasswordResetRequest(userId, req) {
  return await logActivity({
    userId,
    action: 'password_reset_requested',
    description: 'User requested password reset',
    req,
  });
}

/**
 * Log password reset completion
 *
 * @param {number} userId - User ID
 * @param {Object} req - Express request object
 * @returns {Promise<Object>} Created activity log entry
 */
async function logPasswordReset(userId, req) {
  return await logActivity({
    userId,
    action: 'password_reset_completed',
    description: 'User reset password via email token',
    req,
  });
}

/**
 * Log email verification
 *
 * @param {number} userId - User ID
 * @param {Object} req - Express request object
 * @returns {Promise<Object>} Created activity log entry
 */
async function logEmailVerification(userId, req) {
  return await logActivity({
    userId,
    action: 'email_verified',
    description: 'User verified email address',
    req,
  });
}

/**
 * Log MFA setup
 *
 * @param {number} userId - User ID
 * @param {Object} req - Express request object
 * @returns {Promise<Object>} Created activity log entry
 */
async function logMFASetup(userId, req) {
  return await logActivity({
    userId,
    action: 'mfa_enabled',
    description: 'User enabled two-factor authentication',
    req,
  });
}

/**
 * Log MFA disable
 *
 * @param {number} userId - User ID
 * @param {Object} req - Express request object
 * @returns {Promise<Object>} Created activity log entry
 */
async function logMFADisable(userId, req) {
  return await logActivity({
    userId,
    action: 'mfa_disabled',
    description: 'User disabled two-factor authentication',
    req,
  });
}

/**
 * Log OAuth account linking
 *
 * @param {number} userId - User ID
 * @param {string} provider - OAuth provider name (e.g., 'google', 'github')
 * @param {Object} req - Express request object
 * @returns {Promise<Object>} Created activity log entry
 */
async function logOAuthLink(userId, provider, req) {
  return await logActivity({
    userId,
    action: 'oauth_linked',
    description: `User linked ${provider} account`,
    req,
    metadata: { provider },
  });
}

/**
 * Log OAuth account unlinking
 *
 * @param {number} userId - User ID
 * @param {string} provider - OAuth provider name
 * @param {Object} req - Express request object
 * @returns {Promise<Object>} Created activity log entry
 */
async function logOAuthUnlink(userId, provider, req) {
  return await logActivity({
    userId,
    action: 'oauth_unlinked',
    description: `User unlinked ${provider} account`,
    req,
    metadata: { provider },
  });
}

/**
 * Log profile update
 *
 * @param {number} userId - User ID
 * @param {Array<string>} fields - Updated fields
 * @param {Object} req - Express request object
 * @returns {Promise<Object>} Created activity log entry
 */
async function logProfileUpdate(userId, fields, req) {
  return await logActivity({
    userId,
    action: 'profile_updated',
    description: `User updated profile: ${fields.join(', ')}`,
    req,
    metadata: { fields },
  });
}

/**
 * Log account deletion
 *
 * @param {number} userId - User ID
 * @param {Object} req - Express request object
 * @returns {Promise<Object>} Created activity log entry
 */
async function logAccountDeletion(userId, req) {
  return await logActivity({
    userId,
    action: 'account_deleted',
    description: 'User deleted account',
    req,
  });
}

/**
 * Get recent activity for a user
 *
 * @param {number} userId - User ID
 * @param {number} [limit=10] - Maximum number of logs to return
 * @returns {Promise<Array>} Array of activity log entries
 */
async function getRecentActivity(userId, limit = 10) {
  return await ActivityLog.getRecentByUserId(userId, limit);
}

/**
 * Get activity with pagination
 *
 * @param {number} userId - User ID
 * @param {number} [page=1] - Page number
 * @param {number} [pageSize=25] - Logs per page
 * @returns {Promise<Object>} Object with logs and pagination info
 */
async function getActivity(userId, page = 1, pageSize = 25) {
  return await ActivityLog.getByUserId(userId, page, pageSize);
}

module.exports = {
  logActivity,
  logLogin,
  logLogout,
  logPasswordChange,
  logPasswordResetRequest,
  logPasswordReset,
  logEmailVerification,
  logMFASetup,
  logMFADisable,
  logOAuthLink,
  logOAuthUnlink,
  logProfileUpdate,
  logAccountDeletion,
  getRecentActivity,
  getActivity,
};
