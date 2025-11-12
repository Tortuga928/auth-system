/**
 * Security Controller
 *
 * Story 9.3: Login History & Security Events
 * Handles login history, security events, and security monitoring endpoints
 */

const LoginAttempt = require('../models/LoginAttempt');
const SecurityEvent = require('../models/SecurityEvent');

/**
 * Get login history for current user
 *
 * GET /api/security/login-history
 * Query params: page, pageSize
 * Requires authentication
 */
const getLoginHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = parseInt(req.query.pageSize, 10) || 20;

    // Validate pagination parameters
    if (page < 1 || pageSize < 1 || pageSize > 100) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pagination parameters',
      });
    }

    // Get paginated login history
    const result = await LoginAttempt.getPaginated(userId, page, pageSize);

    return res.status(200).json({
      success: true,
      data: {
        loginAttempts: result.data,
        pagination: result.pagination,
      },
    });
  } catch (error) {
    console.error('Get login history error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve login history',
      error: error.message,
    });
  }
};

/**
 * Get login statistics for current user
 *
 * GET /api/security/login-stats
 * Query params: days (optional, default 30)
 * Requires authentication
 */
const getLoginStatistics = async (req, res) => {
  try {
    const userId = req.user.id;
    const days = parseInt(req.query.days, 10) || 30;

    // Validate days parameter
    if (days < 1 || days > 365) {
      return res.status(400).json({
        success: false,
        message: 'Days must be between 1 and 365',
      });
    }

    // Get statistics
    const stats = await LoginAttempt.getStatistics(userId, days);

    return res.status(200).json({
      success: true,
      data: {
        statistics: {
          total_attempts: parseInt(stats.total_attempts, 10),
          successful_logins: parseInt(stats.successful_logins, 10),
          failed_logins: parseInt(stats.failed_logins, 10),
          unique_ips: parseInt(stats.unique_ips, 10),
          unique_devices: parseInt(stats.unique_devices, 10),
          days_analyzed: days,
        },
      },
    });
  } catch (error) {
    console.error('Get login statistics error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve login statistics',
      error: error.message,
    });
  }
};

/**
 * Get security events for current user
 *
 * GET /api/security/events
 * Query params: page, pageSize, severity, unacknowledgedOnly
 * Requires authentication
 */
const getSecurityEvents = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = parseInt(req.query.pageSize, 10) || 20;
    const severity = req.query.severity || null;
    const unacknowledgedOnly = req.query.unacknowledgedOnly === 'true';

    // Validate pagination parameters
    if (page < 1 || pageSize < 1 || pageSize > 100) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pagination parameters',
      });
    }

    // Validate severity if provided
    const validSeverities = ['info', 'warning', 'critical'];
    if (severity && !validSeverities.includes(severity)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid severity value. Must be: info, warning, or critical',
      });
    }

    // Get paginated security events with filters
    const result = await SecurityEvent.getPaginated(userId, page, pageSize, {
      severity,
      unacknowledgedOnly,
    });

    return res.status(200).json({
      success: true,
      data: {
        events: result.data,
        pagination: result.pagination,
      },
    });
  } catch (error) {
    console.error('Get security events error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve security events',
      error: error.message,
    });
  }
};

/**
 * Get security event statistics
 *
 * GET /api/security/event-stats
 * Query params: days (optional, default 30)
 * Requires authentication
 */
const getSecurityEventStatistics = async (req, res) => {
  try {
    const userId = req.user.id;
    const days = parseInt(req.query.days, 10) || 30;

    // Validate days parameter
    if (days < 1 || days > 365) {
      return res.status(400).json({
        success: false,
        message: 'Days must be between 1 and 365',
      });
    }

    // Get statistics
    const stats = await SecurityEvent.getStatistics(userId, days);

    return res.status(200).json({
      success: true,
      data: {
        statistics: {
          total_events: parseInt(stats.total_events, 10),
          info_count: parseInt(stats.info_count, 10),
          warning_count: parseInt(stats.warning_count, 10),
          critical_count: parseInt(stats.critical_count, 10),
          unacknowledged_count: parseInt(stats.unacknowledged_count, 10),
          days_analyzed: days,
        },
      },
    });
  } catch (error) {
    console.error('Get security event statistics error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve security event statistics',
      error: error.message,
    });
  }
};

/**
 * Acknowledge a specific security event
 *
 * POST /api/security/events/:eventId/acknowledge
 * Requires authentication
 */
const acknowledgeSecurityEvent = async (req, res) => {
  try {
    const userId = req.user.id;
    const eventId = parseInt(req.params.eventId, 10);

    // Validate event ID
    if (!eventId || isNaN(eventId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID',
      });
    }

    // Acknowledge the event (includes ownership check)
    const event = await SecurityEvent.acknowledge(eventId, userId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Security event not found or does not belong to you',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Security event acknowledged successfully',
      data: {
        event,
      },
    });
  } catch (error) {
    console.error('Acknowledge security event error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to acknowledge security event',
      error: error.message,
    });
  }
};

/**
 * Acknowledge all security events for current user
 *
 * POST /api/security/events/acknowledge-all
 * Requires authentication
 */
const acknowledgeAllSecurityEvents = async (req, res) => {
  try {
    const userId = req.user.id;

    // Acknowledge all events
    const count = await SecurityEvent.acknowledgeAll(userId);

    return res.status(200).json({
      success: true,
      message: `Successfully acknowledged ${count} security event(s)`,
      data: {
        acknowledgedCount: count,
      },
    });
  } catch (error) {
    console.error('Acknowledge all security events error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to acknowledge security events',
      error: error.message,
    });
  }
};

/**
 * Get count of unacknowledged security events
 *
 * GET /api/security/events/unacknowledged-count
 * Requires authentication
 */
const getUnacknowledgedCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const count = await SecurityEvent.countUnacknowledged(userId);

    return res.status(200).json({
      success: true,
      data: {
        unacknowledgedCount: count,
      },
    });
  } catch (error) {
    console.error('Get unacknowledged count error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve unacknowledged count',
      error: error.message,
    });
  }
};

module.exports = {
  getLoginHistory,
  getLoginStatistics,
  getSecurityEvents,
  getSecurityEventStatistics,
  acknowledgeSecurityEvent,
  acknowledgeAllSecurityEvents,
  getUnacknowledgedCount,
};
