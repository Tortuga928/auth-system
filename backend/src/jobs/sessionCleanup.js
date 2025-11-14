/**
 * Session Cleanup Cron Job
 *
 * Story 9.4: Session Timeout & "Remember Me"
 * Periodically cleans up expired sessions from the database
 */

const cron = require('node-cron');
const config = require('../config');
const Session = require('../models/Session');

/**
 * Clean up expired sessions
 * Removes sessions that have expired due to:
 * - Absolute timeout (exceeded absolute_expires_at)
 * - Inactivity timeout (exceeded last_activity_at + inactivity_timeout)
 * - Refresh token expiration (exceeded expires_at)
 */
async function cleanupExpiredSessions() {
  try {
    // Delete sessions past absolute timeout
    const absoluteExpiredCount = await Session.cleanupAbsoluteExpired();

    // Delete sessions past inactivity timeout
    const inactiveExpiredCount = await Session.cleanupInactive(
      config.session.timeout.inactivity
    );

    // Delete sessions past refresh token expiration
    const refreshExpiredCount = await Session.cleanupExpired();

    const totalCleaned = absoluteExpiredCount + inactiveExpiredCount + refreshExpiredCount;

    if (totalCleaned > 0) {
      console.log(`[Session Cleanup] Cleaned up ${totalCleaned} expired sessions`);
      console.log(`  - Absolute timeout: ${absoluteExpiredCount}`);
      console.log(`  - Inactivity timeout: ${inactiveExpiredCount}`);
      console.log(`  - Refresh token expired: ${refreshExpiredCount}`);
    }
  } catch (error) {
    console.error('[Session Cleanup] Error cleaning up sessions:', error);
  }
}

/**
 * Start the session cleanup cron job
 * Runs based on the cleanup interval in config (default: every hour)
 */
function startSessionCleanupJob() {
  // Convert milliseconds to cron expression
  // For hourly cleanup: '0 * * * *' (at minute 0 of every hour)
  const intervalMs = config.session.timeout.cleanupInterval;
  const intervalMinutes = Math.floor(intervalMs / (60 * 1000));

  let cronExpression;
  if (intervalMinutes >= 60) {
    // Hourly or more
    const hours = Math.floor(intervalMinutes / 60);
    if (hours === 1) {
      cronExpression = '0 * * * *'; // Every hour
    } else if (hours === 24) {
      cronExpression = '0 0 * * *'; // Daily at midnight
    } else {
      cronExpression = `0 */${hours} * * *`; // Every N hours
    }
  } else {
    // Minutes
    cronExpression = `*/${intervalMinutes} * * * *`; // Every N minutes
  }

  console.log(`[Session Cleanup] Starting cleanup job with interval: ${intervalMinutes} minutes (${cronExpression})`);

  // Schedule the cron job
  const job = cron.schedule(cronExpression, async () => {
    await cleanupExpiredSessions();
  });

  // Run immediately on startup
  cleanupExpiredSessions();

  return job;
}

/**
 * Stop the session cleanup cron job
 * @param {Object} job - Cron job instance
 */
function stopSessionCleanupJob(job) {
  if (job) {
    job.stop();
    console.log('[Session Cleanup] Cleanup job stopped');
  }
}

module.exports = {
  startSessionCleanupJob,
  stopSessionCleanupJob,
  cleanupExpiredSessions, // Export for manual testing
};
