/**
 * Audit Logging Middleware
 *
 * Automatically logs admin actions for security and compliance
 */

const AuditLog = require('../models/AuditLog');
const { ACTION_TYPES, TARGET_TYPES } = AuditLog;

/**
 * Helper function to extract IP address from request
 */
function getIpAddress(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         req.headers['x-real-ip'] ||
         req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         null;
}

/**
 * Helper function to create audit log
 *
 * @param {Object} req - Express request object
 * @param {string} action - Action type
 * @param {string} targetType - Target type
 * @param {number} targetId - Target ID (optional)
 * @param {Object} details - Additional details (optional)
 * @returns {Promise<void>}
 */
async function logAdminAction(req, action, targetType, targetId = null, details = null) {
  try {
    await AuditLog.create({
      admin_id: req.user.id,
      admin_email: req.user.email,
      action,
      target_type: targetType,
      target_id: targetId,
      details,
      ip_address: getIpAddress(req),
      user_agent: req.headers['user-agent'] || null,
    });
  } catch (error) {
    // Log error but don't fail the request
    console.error('Audit logging error:', error);
  }
}

/**
 * Middleware to log admin actions
 * Should be used after authentication middleware
 *
 * Usage:
 * router.post('/users', authenticate, isAdmin, auditLog('USER_CREATE'), controller.createUser);
 */
function auditLog(action, getTargetInfo) {
  return async (req, res, next) => {
    // Store original res.json to intercept response
    const originalJson = res.json.bind(res);

    res.json = function(data) {
      // Only log if request was successful
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Get target info from function or use defaults
        let targetType = TARGET_TYPES.USER;
        let targetId = null;
        let details = null;

        if (typeof getTargetInfo === 'function') {
          const targetInfo = getTargetInfo(req, data);
          targetType = targetInfo.targetType || TARGET_TYPES.USER;
          targetId = targetInfo.targetId || null;
          details = targetInfo.details || null;
        } else if (getTargetInfo) {
          // getTargetInfo is an object with target info
          targetType = getTargetInfo.targetType || TARGET_TYPES.USER;
          targetId = getTargetInfo.targetId || null;
          details = getTargetInfo.details || null;
        }

        // Log the action (don't await to avoid delaying response)
        logAdminAction(req, action, targetType, targetId, details).catch(err => {
          console.error('Failed to log admin action:', err);
        });
      }

      // Call original res.json
      return originalJson(data);
    };

    next();
  };
}

// Export middleware and helper function
module.exports = auditLog;
module.exports.logAdminAction = logAdminAction;
module.exports.ACTION_TYPES = ACTION_TYPES;
module.exports.TARGET_TYPES = TARGET_TYPES;
