/**
 * Session Timeout Middleware
 *
 * Story 9.4: Session Timeout & "Remember Me"
 * Checks if sessions have expired due to inactivity or absolute timeout
 */

const config = require('../config');
const Session = require('../models/Session');

/**
 * Check if session has expired due to inactivity or absolute timeout
 * This middleware runs after the auth middleware (requires req.user and req.session)
 *
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next function
 */
async function checkSessionTimeout(req, res, next) {
  try {
    // Skip if not authenticated (auth middleware will handle)
    if (!req.user || !req.session) {
      return next();
    }

    const now = new Date();
    const session = req.session;

    // Check absolute timeout
    if (session.absolute_expires_at) {
      const absoluteExpiry = new Date(session.absolute_expires_at);
      if (now > absoluteExpiry) {
        // Session has exceeded absolute timeout
        await Session.delete(session.id);
        return res.status(401).json({
          success: false,
          error: 'SESSION_TIMEOUT',
          message: 'Your session has expired. Please log in again.',
          reason: 'absolute_timeout',
        });
      }
    }

    // Check inactivity timeout
    if (session.last_activity_at) {
      const lastActivity = new Date(session.last_activity_at);
      const inactivityMs = now - lastActivity;
      const inactivityTimeout = config.session.timeout.inactivity;

      if (inactivityMs > inactivityTimeout) {
        // Session has been inactive too long
        await Session.delete(session.id);
        return res.status(401).json({
          success: false,
          error: 'SESSION_TIMEOUT',
          message: 'Your session has expired due to inactivity. Please log in again.',
          reason: 'inactivity_timeout',
        });
      }
    }

    // Session is still valid, continue
    next();
  } catch (error) {
    console.error('Session timeout check error:', error);
    // Don't block request on timeout check error
    next();
  }
}

module.exports = {
  checkSessionTimeout,
};
