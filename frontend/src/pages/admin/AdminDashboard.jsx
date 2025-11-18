/**
 * Admin Dashboard Page
 *
 * Displays key metrics and statistics for system monitoring.
 * Story 10.5 - Admin Panel UI
 */

import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import adminApi from '../../services/adminApi';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [userGrowth, setUserGrowth] = useState(null);
  const [activity, setActivity] = useState(null);
  const [security, setSecurity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsRes, growthRes, activityRes, securityRes] = await Promise.all([
        adminApi.getDashboardStats(),
        adminApi.getUserGrowth(30),
        adminApi.getActivitySummary(),
        adminApi.getSecurityOverview(),
      ]);

      setStats(statsRes.data.data);
      setUserGrowth(growthRes.data.data);
      setActivity(activityRes.data.data);
      setSecurity(securityRes.data.data);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '20px',
      marginBottom: '30px',
    },
    card: {
      backgroundColor: '#fff',
      borderRadius: '8px',
      padding: '20px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    statCard: {
      backgroundColor: '#fff',
      borderRadius: '8px',
      padding: '20px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      textAlign: 'center',
    },
    statValue: {
      fontSize: '32px',
      fontWeight: 'bold',
      color: '#2c3e50',
      margin: '10px 0',
    },
    statLabel: {
      color: '#7f8c8d',
      fontSize: '14px',
      textTransform: 'uppercase',
    },
    cardTitle: {
      fontSize: '18px',
      fontWeight: 'bold',
      marginBottom: '15px',
      color: '#2c3e50',
    },
    chartContainer: {
      height: '200px',
      display: 'flex',
      alignItems: 'flex-end',
      gap: '2px',
      padding: '10px 0',
    },
    chartBar: {
      flex: 1,
      backgroundColor: '#3498db',
      minHeight: '5px',
      borderRadius: '2px 2px 0 0',
      transition: 'height 0.3s ease',
      position: 'relative',
    },
    chartLabel: {
      fontSize: '10px',
      color: '#7f8c8d',
      textAlign: 'center',
      marginTop: '5px',
    },
    alertBadge: {
      display: 'inline-block',
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: 'bold',
    },
    criticalBadge: {
      backgroundColor: '#e74c3c',
      color: '#fff',
    },
    warningBadge: {
      backgroundColor: '#f39c12',
      color: '#fff',
    },
    successBadge: {
      backgroundColor: '#27ae60',
      color: '#fff',
    },
    listItem: {
      padding: '10px 0',
      borderBottom: '1px solid #ecf0f1',
      fontSize: '14px',
    },
    listLabel: {
      color: '#7f8c8d',
      marginRight: '10px',
    },
    refreshBtn: {
      backgroundColor: '#3498db',
      color: '#fff',
      border: 'none',
      padding: '8px 16px',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px',
    },
    errorMsg: {
      backgroundColor: '#ffeaea',
      color: '#e74c3c',
      padding: '15px',
      borderRadius: '4px',
      marginBottom: '20px',
    },
    progressBar: {
      width: '100%',
      height: '20px',
      backgroundColor: '#ecf0f1',
      borderRadius: '10px',
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: '#27ae60',
      transition: 'width 0.5s ease',
    },
  };

  if (loading) {
    return (
      <AdminLayout title="Dashboard">
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <p>Loading dashboard data...</p>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Dashboard">
        <div style={styles.errorMsg}>
          <strong>Error:</strong> {error}
          <br />
          <button style={{ ...styles.refreshBtn, marginTop: '10px' }} onClick={fetchDashboardData}>
            Retry
          </button>
        </div>
      </AdminLayout>
    );
  }

  const maxGrowthValue = userGrowth ? Math.max(...userGrowth.data, 1) : 1;

  return (
    <AdminLayout title="Dashboard">
      <div style={{ marginBottom: '20px', textAlign: 'right' }}>
        <button style={styles.refreshBtn} onClick={fetchDashboardData}>
          🔄 Refresh Data
        </button>
      </div>

      {/* Stats Cards */}
      <div style={styles.grid}>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Total Users</div>
          <div style={styles.statValue}>{stats?.totalUsers || 0}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Active Users</div>
          <div style={styles.statValue}>{stats?.activeUsers || 0}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>New Today</div>
          <div style={{ ...styles.statValue, color: '#27ae60' }}>{stats?.newUsersToday || 0}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>New This Week</div>
          <div style={styles.statValue}>{stats?.newUsersThisWeek || 0}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>New This Month</div>
          <div style={styles.statValue}>{stats?.newUsersThisMonth || 0}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Admin Count</div>
          <div style={{ ...styles.statValue, color: '#9b59b6' }}>{stats?.adminCount || 0}</div>
        </div>
      </div>

      {/* User Growth Chart */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>📈 User Growth (Last 30 Days)</h3>
        <div style={styles.chartContainer}>
          {userGrowth?.data?.map((value, index) => (
            <div
              key={index}
              style={{
                ...styles.chartBar,
                height: `${(value / maxGrowthValue) * 100}%`,
              }}
              title={`${userGrowth.labels[index]}: ${value} users`}
            />
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#7f8c8d' }}>
          <span>{userGrowth?.labels?.[0]}</span>
          <span>{userGrowth?.labels?.[userGrowth.labels.length - 1]}</span>
        </div>
      </div>

      {/* Activity & Security Row */}
      <div style={{ ...styles.grid, gridTemplateColumns: '1fr 1fr', marginTop: '20px' }}>
        {/* Activity Summary */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>🔍 Today's Activity</h3>
          <div style={styles.listItem}>
            <span style={styles.listLabel}>Login Attempts:</span>
            <strong>{activity?.loginAttemptsToday || 0}</strong>
          </div>
          <div style={styles.listItem}>
            <span style={styles.listLabel}>Failed Logins:</span>
            <strong style={{ color: activity?.failedLoginsToday > 10 ? '#e74c3c' : '#2c3e50' }}>
              {activity?.failedLoginsToday || 0}
            </strong>
          </div>
          <div style={styles.listItem}>
            <span style={styles.listLabel}>Active Sessions:</span>
            <strong style={{ color: '#27ae60' }}>{activity?.activeSessionsNow || 0}</strong>
          </div>
          <div style={styles.listItem}>
            <span style={styles.listLabel}>Security Events:</span>
            <strong style={{ color: activity?.securityEventsToday > 0 ? '#f39c12' : '#2c3e50' }}>
              {activity?.securityEventsToday || 0}
            </strong>
          </div>
        </div>

        {/* Security Overview */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>🔒 Security Overview</h3>
          <div style={styles.listItem}>
            <span style={styles.listLabel}>Critical Alerts:</span>
            <span
              style={{
                ...styles.alertBadge,
                ...(security?.criticalAlertsCount > 0 ? styles.criticalBadge : styles.successBadge),
              }}
            >
              {security?.criticalAlertsCount || 0}
            </span>
          </div>
          <div style={{ ...styles.listItem, borderBottom: 'none' }}>
            <span style={styles.listLabel}>MFA Adoption:</span>
            <strong>{security?.mfaEnabledPercentage || 0}%</strong>
            <div style={{ ...styles.progressBar, marginTop: '8px' }}>
              <div
                style={{
                  ...styles.progressFill,
                  width: `${security?.mfaEnabledPercentage || 0}%`,
                }}
              />
            </div>
            <div style={{ fontSize: '12px', color: '#7f8c8d', marginTop: '5px' }}>
              {security?.mfaEnabledCount || 0} of {security?.totalActiveUsers || 0} users
            </div>
          </div>
        </div>
      </div>

      {/* Recent Failed Logins */}
      {security?.recentFailedLogins?.length > 0 && (
        <div style={{ ...styles.card, marginTop: '20px' }}>
          <h3 style={styles.cardTitle}>⚠️ Recent Failed Logins</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Email</th>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>IP Address</th>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Reason</th>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Time</th>
                </tr>
              </thead>
              <tbody>
                {security.recentFailedLogins.slice(0, 5).map((login, index) => (
                  <tr key={index}>
                    <td style={{ padding: '10px', borderBottom: '1px solid #dee2e6' }}>{login.email}</td>
                    <td style={{ padding: '10px', borderBottom: '1px solid #dee2e6' }}>{login.ip_address}</td>
                    <td style={{ padding: '10px', borderBottom: '1px solid #dee2e6' }}>
                      <span style={{ ...styles.alertBadge, ...styles.warningBadge }}>
                        {login.failure_reason?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '10px', borderBottom: '1px solid #dee2e6' }}>
                      {new Date(login.attempted_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminDashboard;
