/**
 * Session Controller
 *
 * Story 9.2: Device Management Endpoints
 * Handles session/device management operations
 */

const Session = require('../models/Session');
const { getClientIP, normalizeIPAddress } = require('../utils/sessionUtils');

/**
 * Helper function to log activity
 * @param {Object} params - Activity log parameters
 */
async function logActivity({ userId, action, description, req, metadata = {} }) {
  try {
    const db = require('../db');
    const ipAddress = getClientIP(req);
    const userAgent = req.headers['user-agent'] || '';

    await db.query(
      `INSERT INTO user_activity_logs (user_id, action, description, ip_address, user_agent, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, action, description, ipAddress, userAgent, JSON.stringify(metadata)]
    );
  } catch (error) {
    console.error('Failed to log activity:', error);
    // Don't throw - logging failure shouldn't fail the request
  }
}

/**
 * Get all sessions for current user
 *
 * GET /api/sessions
 * Requires authentication
 *
 * Returns all active sessions with device metadata
 * Marks current session with isCurrent: true
 */
const getUserSessions = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all active sessions for user
    const sessions = await Session.findByUserId(userId, true);

    if (!sessions || sessions.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          sessions: [],
        },
      });
    }

    // Get current request metadata to identify current session
    const currentIP = getClientIP(req);
    const currentUA = req.headers['user-agent'] || '';

    // Format sessions for response and mark current session
    const formattedSessions = sessions.map((session) => {
      // Determine if this is the current session
      // Match by IP and user agent (normalize IPs for Docker compatibility)
      const isCurrent =
        normalizeIPAddress(session.ip_address) === normalizeIPAddress(currentIP) &&
        session.user_agent === currentUA;

      return {
        id: session.id,
        device_name: session.device_name || 'Unknown Device',
        browser: session.browser || 'Unknown',
        os: session.os || 'Unknown',
        device_type: session.device_type || 'unknown',
        ip_address: session.ip_address || 'Unknown',
        location: session.location || 'Unknown',
        last_activity_at: session.last_activity_at || session.created_at,
        created_at: session.created_at,
        is_current: isCurrent,
      };
    });

    // Sort by last activity (most recent first)
    formattedSessions.sort(
      (a, b) => new Date(b.last_activity_at) - new Date(a.last_activity_at)
    );

    return res.status(200).json({
      success: true,
      data: {
        sessions: formattedSessions,
      },
    });
  } catch (error) {
    console.error('Get user sessions error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve sessions',
      error: error.message,
    });
  }
};

/**
 * Revoke a specific session
 *
 * DELETE /api/sessions/:sessionId
 * Requires authentication
 *
 * Prevents revoking current session (use logout instead)
 * Logs revocation to activity log
 */
const revokeSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const sessionId = parseInt(req.params.sessionId, 10);

    // Validate session ID
    if (!sessionId || isNaN(sessionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid session ID',
      });
    }

    // Get session to verify ownership and check if it's current
    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    // Verify session belongs to user
    if (session.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
        error: 'You can only revoke your own sessions',
      });
    }

    // Check if this is the current session (prevent accidental logout)
    const currentIP = getClientIP(req);
    const currentUA = req.headers['user-agent'] || '';
    const isCurrent =
      normalizeIPAddress(session.ip_address) === normalizeIPAddress(currentIP) &&
      session.user_agent === currentUA;

    if (isCurrent) {
      return res.status(400).json({
        success: false,
        message: 'Cannot revoke current session',
        error: 'Use the logout endpoint to end your current session',
      });
    }

    // Revoke (delete) the session
    await Session.delete(sessionId);

    // Log the revocation
    await logActivity({
      userId,
      action: 'session_revoked',
      description: `Revoked session from ${session.device_name || 'Unknown Device'}`,
      req,
      metadata: {
        session_id: sessionId,
        device_name: session.device_name,
        ip_address: session.ip_address,
        location: session.location,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Session revoked successfully',
      data: {
        sessionId,
      },
    });
  } catch (error) {
    console.error('Revoke session error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to revoke session',
      error: error.message,
    });
  }
};

/**
 * Revoke all other sessions (keep current)
 *
 * POST /api/sessions/revoke-others
 * Requires authentication
 *
 * Useful for "Log out everywhere else" functionality
 * Keeps current session active
 * Logs revocation to activity log
 */
const revokeAllOtherSessions = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all sessions to find current one
    const sessions = await Session.findByUserId(userId, true);

    if (!sessions || sessions.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No sessions to revoke',
        data: {
          revokedCount: 0,
        },
      });
    }

    // Find current session by IP and user agent
    const currentIP = getClientIP(req);
    const currentUA = req.headers['user-agent'] || '';

    const currentSession = sessions.find(
      (s) => normalizeIPAddress(s.ip_address) === normalizeIPAddress(currentIP) &&
           s.user_agent === currentUA
    );

    if (!currentSession) {
      // Fallback: use most recent session as current
      const sortedSessions = sessions.sort(
        (a, b) => new Date(b.last_activity_at) - new Date(a.last_activity_at)
      );
      const fallbackSession = sortedSessions[0];

      // Delete all except most recent
      const count = await Session.deleteAllForUserExcept(userId, fallbackSession.id);

      await logActivity({
        userId,
        action: 'all_other_sessions_revoked',
        description: `Revoked all other sessions (${count} sessions)`,
        req,
        metadata: {
          revoked_count: count,
          method: 'fallback',
        },
      });

      return res.status(200).json({
        success: true,
        message: 'All other sessions revoked successfully',
        data: {
          revokedCount: count,
        },
      });
    }

    // Delete all except current session
    const count = await Session.deleteAllForUserExcept(userId, currentSession.id);

    // Log the revocation
    await logActivity({
      userId,
      action: 'all_other_sessions_revoked',
      description: `Revoked all other sessions (${count} sessions)`,
      req,
      metadata: {
        revoked_count: count,
        kept_session_id: currentSession.id,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'All other sessions revoked successfully',
      data: {
        revokedCount: count,
      },
    });
  } catch (error) {
    console.error('Revoke all other sessions error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to revoke sessions',
      error: error.message,
    });
  }
};

module.exports = {
  getUserSessions,
  revokeSession,
  revokeAllOtherSessions,
};
