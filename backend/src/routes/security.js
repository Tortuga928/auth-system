/**
 * Security Routes
 *
 * Story 9.3: Login History & Security Events
 * Routes for login history, security events, and security monitoring
 */

const express = require('express');
const router = express.Router();
const securityController = require('../controllers/securityController');
const { authenticate } = require('../middleware/auth');

/**
 * GET /api/security/login-history
 * Get paginated login history for current user
 * Requires authentication
 */
router.get('/login-history', authenticate, securityController.getLoginHistory);

/**
 * GET /api/security/login-stats
 * Get login statistics for current user
 * Requires authentication
 */
router.get('/login-stats', authenticate, securityController.getLoginStatistics);

/**
 * GET /api/security/events
 * Get paginated security events for current user
 * Requires authentication
 */
router.get('/events', authenticate, securityController.getSecurityEvents);

/**
 * GET /api/security/event-stats
 * Get security event statistics
 * Requires authentication
 */
router.get('/event-stats', authenticate, securityController.getSecurityEventStatistics);

/**
 * GET /api/security/events/unacknowledged-count
 * Get count of unacknowledged security events
 * Requires authentication
 * NOTE: This must be before /:eventId route to avoid conflict
 */
router.get('/events/unacknowledged-count', authenticate, securityController.getUnacknowledgedCount);

/**
 * POST /api/security/events/acknowledge-all
 * Acknowledge all security events for current user
 * Requires authentication
 * NOTE: This must be before /:eventId route to avoid conflict
 */
router.post('/events/acknowledge-all', authenticate, securityController.acknowledgeAllSecurityEvents);

/**
 * POST /api/security/events/:eventId/acknowledge
 * Acknowledge a specific security event
 * Requires authentication
 */
router.post('/events/:eventId/acknowledge', authenticate, securityController.acknowledgeSecurityEvent);

module.exports = router;
