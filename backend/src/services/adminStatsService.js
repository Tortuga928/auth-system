/**
 * Admin Statistics Service
 *
 * Provides dashboard statistics and metrics for the admin panel.
 * All methods use caching to optimize performance.
 */

const db = require('../db');
const cache = require('../utils/cache');

// Cache TTL in seconds (5 minutes for most stats)
const CACHE_TTL = {
  stats: 300, // 5 minutes
  userGrowth: 300, // 5 minutes
  activity: 60, // 1 minute (more real-time)
  security: 120, // 2 minutes
};

/**
 * Get overall system statistics
 *
 * Returns total users, active users, new users, admin count, etc.
 *
 * @returns {Promise<Object>} System statistics
 */
async function getOverallStats() {
  return cache.getOrSet('admin:stats:overall', async () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get all stats in parallel
    const [
      totalUsersResult,
      activeUsersResult,
      newUsersTodayResult,
      newUsersWeekResult,
      newUsersMonthResult,
      adminCountResult,
      suspendedCountResult,
    ] = await Promise.all([
      // Total users
      db.query('SELECT COUNT(*) as count FROM users'),

      // Active users (is_active = true)
      db.query('SELECT COUNT(*) as count FROM users WHERE is_active = true'),

      // New users today
      db.query('SELECT COUNT(*) as count FROM users WHERE created_at >= $1', [today]),

      // New users this week
      db.query('SELECT COUNT(*) as count FROM users WHERE created_at >= $1', [thisWeek]),

      // New users this month
      db.query('SELECT COUNT(*) as count FROM users WHERE created_at >= $1', [thisMonth]),

      // Admin count
      db.query("SELECT COUNT(*) as count FROM users WHERE role IN ('admin', 'super_admin')"),

      // Suspended/inactive users
      db.query('SELECT COUNT(*) as count FROM users WHERE is_active = false'),
    ]);

    return {
      totalUsers: parseInt(totalUsersResult.rows[0].count, 10),
      activeUsers: parseInt(activeUsersResult.rows[0].count, 10),
      newUsersToday: parseInt(newUsersTodayResult.rows[0].count, 10),
      newUsersThisWeek: parseInt(newUsersWeekResult.rows[0].count, 10),
      newUsersThisMonth: parseInt(newUsersMonthResult.rows[0].count, 10),
      adminCount: parseInt(adminCountResult.rows[0].count, 10),
      suspendedCount: parseInt(suspendedCountResult.rows[0].count, 10),
    };
  }, CACHE_TTL.stats);
}

/**
 * Get user growth data (last 30 days)
 *
 * Returns daily registration counts for charting.
 *
 * @param {number} days - Number of days to retrieve (default: 30)
 * @returns {Promise<Object>} User growth data with labels and counts
 */
async function getUserGrowth(days = 30) {
  return cache.getOrSet(`admin:stats:user-growth:${days}`, async () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Query for daily user counts
    const result = await db.query(
      `
      SELECT
        DATE(created_at) as date,
        COUNT(*) as count
      FROM users
      WHERE created_at >= $1
      GROUP BY DATE(created_at)
      ORDER BY date ASC
      `,
      [startDate]
    );

    // Fill in missing dates with 0 counts
    const labels = [];
    const data = [];
    const countMap = new Map();

    // Build map of existing data
    result.rows.forEach(row => {
      const dateStr = row.date.toISOString().split('T')[0];
      countMap.set(dateStr, parseInt(row.count, 10));
    });

    // Generate all dates in range
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      labels.push(label);
      data.push(countMap.get(dateStr) || 0);
    }

    return { labels, data };
  }, CACHE_TTL.userGrowth);
}

/**
 * Get activity summary
 *
 * Returns login attempts, failed logins, active sessions, security events.
 *
 * @returns {Promise<Object>} Activity statistics
 */
async function getActivitySummary() {
  return cache.getOrSet('admin:stats:activity', async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      loginAttemptsResult,
      failedLoginsResult,
      activeSessionsResult,
      securityEventsResult,
    ] = await Promise.all([
      // Login attempts today (from login_attempts)
      db.query(
        'SELECT COUNT(*) as count FROM login_attempts WHERE attempted_at >= $1',
        [today]
      ),

      // Failed logins today
      db.query(
        "SELECT COUNT(*) as count FROM login_attempts WHERE attempted_at >= $1 AND success = false",
        [today]
      ),

      // Active sessions now
      db.query(
        'SELECT COUNT(*) as count FROM sessions WHERE is_active = true AND expires_at > NOW()'
      ),

      // Security events today
      db.query(
        'SELECT COUNT(*) as count FROM security_events WHERE created_at >= $1',
        [today]
      ),
    ]);

    return {
      loginAttemptsToday: parseInt(loginAttemptsResult.rows[0].count, 10),
      failedLoginsToday: parseInt(failedLoginsResult.rows[0].count, 10),
      activeSessionsNow: parseInt(activeSessionsResult.rows[0].count, 10),
      securityEventsToday: parseInt(securityEventsResult.rows[0].count, 10),
    };
  }, CACHE_TTL.activity);
}

/**
 * Get security overview
 *
 * Returns critical alerts, MFA adoption, recent failed logins, suspicious activity.
 *
 * @returns {Promise<Object>} Security statistics
 */
async function getSecurityOverview() {
  return cache.getOrSet('admin:stats:security', async () => {
    const [
      criticalAlertsResult,
      mfaStatsResult,
      recentFailedLoginsResult,
      suspiciousActivityResult,
    ] = await Promise.all([
      // Critical security alerts (unacknowledged high-severity events)
      db.query(
        "SELECT COUNT(*) as count FROM security_events WHERE severity = 'high' AND acknowledged = false"
      ),

      // MFA enabled percentage (join with mfa_secrets table)
      db.query(
        `
        SELECT
          COUNT(*) FILTER (WHERE ms.enabled = true) as enabled_count,
          COUNT(*) as total_count
        FROM users u
        LEFT JOIN mfa_secrets ms ON u.id = ms.user_id
        WHERE u.is_active = true
        `
      ),

      // Recent failed login attempts (last 10)
      db.query(
        `
        SELECT
          lh.id,
          lh.email,
          lh.ip_address,
          lh.user_agent,
          lh.failure_reason,
          lh.attempted_at
        FROM login_attempts lh
        WHERE lh.success = false
        ORDER BY lh.attempted_at DESC
        LIMIT 10
        `
      ),

      // Suspicious activity (high-severity security events, last 10)
      db.query(
        `
        SELECT
          se.id,
          se.event_type,
          se.severity,
          se.user_id,
          se.ip_address,
          se.metadata,
          se.created_at,
          u.email
        FROM security_events se
        LEFT JOIN users u ON se.user_id = u.id
        WHERE se.severity IN ('high', 'critical')
        ORDER BY se.created_at DESC
        LIMIT 10
        `
      ),
    ]);

    // Calculate MFA percentage
    const mfaStats = mfaStatsResult.rows[0];
    const mfaEnabledCount = parseInt(mfaStats.enabled_count || 0, 10);
    const totalActiveUsers = parseInt(mfaStats.total_count || 0, 10);
    const mfaEnabledPercentage = totalActiveUsers > 0
      ? ((mfaEnabledCount / totalActiveUsers) * 100).toFixed(1)
      : 0;

    return {
      criticalAlertsCount: parseInt(criticalAlertsResult.rows[0].count, 10),
      mfaEnabledPercentage: parseFloat(mfaEnabledPercentage),
      mfaEnabledCount,
      totalActiveUsers,
      recentFailedLogins: recentFailedLoginsResult.rows,
      suspiciousActivity: suspiciousActivityResult.rows.map(row => ({
        ...row,
        details: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
      })),
    };
  }, CACHE_TTL.security);
}

/**
 * Clear all dashboard caches
 *
 * Useful when data changes and cache needs to be invalidated.
 *
 * @returns {Promise<number>} Number of cache keys cleared
 */
async function clearDashboardCache() {
  return cache.clearPattern('admin:stats:*');
}

module.exports = {
  getOverallStats,
  getUserGrowth,
  getActivitySummary,
  getSecurityOverview,
  clearDashboardCache,
};
