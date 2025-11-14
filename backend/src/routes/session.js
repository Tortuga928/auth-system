/**
 * Session Routes
 *
 * Story 9.2: Device Management Endpoints
 * Routes for viewing and managing user sessions/devices
 */

const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const { authenticate } = require('../middleware/auth');

/**
 * GET /api/sessions
 * Get all active sessions for current user
 * Requires authentication
 */
router.get('/', authenticate, sessionController.getUserSessions);

/**
 * DELETE /api/sessions/:sessionId
 * Revoke a specific session
 * Requires authentication
 */
router.delete('/:sessionId', authenticate, sessionController.revokeSession);

/**
 * POST /api/sessions/revoke-others
 * Revoke all other sessions (keep current)
 * Requires authentication
 */
router.post('/revoke-others', authenticate, sessionController.revokeAllOtherSessions);

module.exports = router;
