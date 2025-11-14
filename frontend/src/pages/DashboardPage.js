/**
 * Dashboard page component
 *
 * Story 8.1: User Dashboard Page
 * Displays user profile, account status, quick actions, and recent activity
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiService from '../services/api';
import AvatarUpload from '../components/AvatarUpload';

function DashboardPage() {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [securityData, setSecurityData] = useState({
    activeSessions: 0,
    unacknowledgedEvents: 0,
    recentLoginAttempts: { total: 0, successful: 0, failed: 0 },
  });

  // Fetch profile data on mount
  useEffect(() => {
    fetchProfileData();
    fetchSecurityData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.user.getProfile();
      setProfileData(response.data.data);
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      setError(err.response?.data?.error || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSecurityData = async () => {
    try {
      // Fetch sessions count
      const sessionsResponse = await apiService.security.getSessions();
      const sessions = sessionsResponse.data.data.sessions || [];
      const activeSessions = sessions.length;

      // Fetch unacknowledged events count
      const unacknowledgedResponse = await apiService.security.getUnacknowledgedCount();
      const unacknowledgedEvents = unacknowledgedResponse.data.data.count || 0;

      // Fetch recent login stats (last 7 days)
      const loginStatsResponse = await apiService.security.getLoginStats(7);
      const loginStats = loginStatsResponse.data.data;

      setSecurityData({
        activeSessions,
        unacknowledgedEvents,
        recentLoginAttempts: {
          total: loginStats.totalLogins || 0,
          successful: loginStats.successfulLogins || 0,
          failed: loginStats.failedLogins || 0,
        },
      });
    } catch (err) {
      console.error('Failed to fetch security data:', err);
      // Don't set error state - this is non-critical data
    }
  };

  // Handle avatar upload success
  const handleAvatarUploadSuccess = (newAvatarUrl) => {
    setProfileData((prev) => ({
      ...prev,
      user: {
        ...prev.user,
        avatarUrl: newAvatarUrl,
      },
    }));
  };

  // Loading state
  if (loading) {
    return (
      <div className="container">
        <div className="card">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div className="spinner-border" role="status">
              <span className="sr-only">Loading...</span>
            </div>
            <p className="mt-3">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container">
        <div className="alert alert-danger">
          <h4>Error Loading Dashboard</h4>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={fetchProfileData}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { user, security, activity } = profileData;

  return (
    <div className="container">
      <h1 className="mb-4">Dashboard</h1>

      {/* User Profile Card */}
      <div className="card mb-4">
        <div className="card-body">
          <h2 className="card-title">Profile</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            {/* Avatar */}
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: user.avatarUrl
                  ? 'transparent'
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '2rem',
                fontWeight: 'bold',
                overflow: 'hidden',
                border: '2px solid #ddd',
              }}
            >
              {user.avatarUrl ? (
                <img
                  src={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${user.avatarUrl}`}
                  alt={`${user.username}'s avatar`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                user.username.charAt(0).toUpperCase()
              )}
            </div>

            {/* User info */}
            <div style={{ flex: 1 }}>
              <h3 style={{ marginBottom: '0.5rem' }}>{user.username}</h3>
              <p style={{ margin: 0, color: '#666' }}>{user.email}</p>
              <div style={{ marginTop: '0.5rem' }}>
                <span
                  className="badge"
                  style={{
                    backgroundColor: user.role === 'admin' ? '#dc3545' : '#6c757d',
                    color: 'white',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px',
                    fontSize: '0.875rem',
                  }}
                >
                  {user.role}
                </span>
              </div>
            </div>

            {/* Quick edit link */}
            <div>
              <Link to="/profile" className="btn btn-outline-primary">
                Edit Profile
              </Link>
            </div>
          </div>

          {/* Avatar Upload Section */}
          <AvatarUpload
            currentAvatarUrl={user.avatarUrl}
            onUploadSuccess={handleAvatarUploadSuccess}
          />
        </div>
      </div>

      {/* Account Status */}
      <div className="card mb-4">
        <div className="card-body">
          <h2 className="card-title mb-3">Account Status</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
            {/* Email Verification */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span
                  style={{
                    fontSize: '1.5rem',
                    color: user.emailVerified ? '#28a745' : '#ffc107',
                  }}
                >
                  {user.emailVerified ? '✓' : '⚠'}
                </span>
                <div>
                  <strong>Email Status</strong>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>
                    {user.emailVerified ? 'Verified' : 'Not Verified'}
                  </p>
                </div>
              </div>
            </div>

            {/* MFA Status */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span
                  style={{
                    fontSize: '1.5rem',
                    color: security.mfaEnabled ? '#28a745' : '#6c757d',
                  }}
                >
                  {security.mfaEnabled ? '🔐' : '🔓'}
                </span>
                <div>
                  <strong>Two-Factor Auth</strong>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>
                    {security.mfaEnabled ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
              </div>
            </div>

            {/* OAuth Accounts */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.5rem' }}>🔗</span>
                <div>
                  <strong>Connected Accounts</strong>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>
                    {security.oauthAccountsCount} provider{security.oauthAccountsCount !== 1 ? 's' : ''} linked
                  </p>
                  {security.oauthAccounts.length > 0 && (
                    <div style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#999' }}>
                      {security.oauthAccounts.map((acc) => acc.provider).join(', ')}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Account Age */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.5rem' }}>📅</span>
                <div>
                  <strong>Member Since</strong>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card mb-4">
        <div className="card-body">
          <h2 className="card-title mb-3">Quick Actions</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <Link to="/profile" className="btn btn-primary" style={{ padding: '1rem' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>👤</div>
              <div>Edit Profile</div>
            </Link>

            <Link to="/settings" className="btn btn-primary" style={{ padding: '1rem' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⚙️</div>
              <div>Settings</div>
            </Link>

            <Link to="/mfa-settings" className="btn btn-primary" style={{ padding: '1rem' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🔐</div>
              <div>2FA Settings</div>
            </Link>

            <Link to="/activity-log" className="btn btn-primary" style={{ padding: '1rem' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📊</div>
              <div>View Activity Log</div>
            </Link>
          </div>
        </div>
      </div>

      {/* Security Overview - Story 9.5 */}
      <div className="card mb-4">
        <div className="card-body">
          <h2 className="card-title mb-3">Security Overview</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
            {/* Active Sessions */}
            <Link to="/devices" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div
                className="card h-100"
                style={{
                  border: '1px solid #dee2e6',
                  transition: 'box-shadow 0.2s',
                  cursor: 'pointer',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div className="card-body text-center">
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💻</div>
                  <h3 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>
                    {securityData.activeSessions}
                  </h3>
                  <p style={{ margin: 0, color: '#666', fontSize: '0.875rem' }}>Active Sessions</p>
                  <small style={{ color: '#999', fontSize: '0.75rem' }}>Click to manage devices</small>
                </div>
              </div>
            </Link>

            {/* Security Alerts */}
            <Link to="/security-alerts" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div
                className="card h-100"
                style={{
                  border: securityData.unacknowledgedEvents > 0 ? '2px solid #ffc107' : '1px solid #dee2e6',
                  transition: 'box-shadow 0.2s',
                  cursor: 'pointer',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div className="card-body text-center">
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                    {securityData.unacknowledgedEvents > 0 ? '🚨' : '✓'}
                  </div>
                  <h3
                    style={{
                      fontSize: '2rem',
                      marginBottom: '0.25rem',
                      color: securityData.unacknowledgedEvents > 0 ? '#ffc107' : '#28a745',
                    }}
                  >
                    {securityData.unacknowledgedEvents}
                  </h3>
                  <p style={{ margin: 0, color: '#666', fontSize: '0.875rem' }}>
                    {securityData.unacknowledgedEvents === 1 ? 'Security Alert' : 'Security Alerts'}
                  </p>
                  <small style={{ color: '#999', fontSize: '0.75rem' }}>
                    {securityData.unacknowledgedEvents > 0 ? 'Needs review' : 'All clear'}
                  </small>
                </div>
              </div>
            </Link>

            {/* Recent Login Attempts */}
            <Link to="/login-history" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div
                className="card h-100"
                style={{
                  border: '1px solid #dee2e6',
                  transition: 'box-shadow 0.2s',
                  cursor: 'pointer',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div className="card-body text-center">
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔐</div>
                  <h3 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>
                    {securityData.recentLoginAttempts.total}
                  </h3>
                  <p style={{ margin: 0, color: '#666', fontSize: '0.875rem' }}>Login Attempts</p>
                  <div style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}>
                    <span style={{ color: '#28a745', marginRight: '0.5rem' }}>
                      ✓ {securityData.recentLoginAttempts.successful}
                    </span>
                    <span style={{ color: '#dc3545' }}>
                      ✗ {securityData.recentLoginAttempts.failed}
                    </span>
                  </div>
                  <small style={{ color: '#999', fontSize: '0.75rem' }}>Last 7 days</small>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card mb-4">
        <div className="card-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 className="card-title" style={{ marginBottom: 0 }}>Recent Activity</h2>
            <Link to="/activity-log" className="btn btn-sm btn-outline-primary">
              View All
            </Link>
          </div>

          {activity.length === 0 ? (
            <div className="alert alert-info">
              <p style={{ margin: 0 }}>No activity logged yet.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>Description</th>
                    <th>Date & Time</th>
                    <th>IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {activity.map((log) => (
                    <tr key={log.id}>
                      <td>
                        <span
                          className="badge"
                          style={{
                            backgroundColor: getActionColor(log.action),
                            color: 'white',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                          }}
                        >
                          {formatAction(log.action)}
                        </span>
                      </td>
                      <td>{log.description || '-'}</td>
                      <td style={{ fontSize: '0.875rem', color: '#666' }}>
                        {formatDate(log.timestamp)}
                      </td>
                      <td style={{ fontSize: '0.875rem', color: '#666', fontFamily: 'monospace' }}>
                        {log.ipAddress || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper function to get color for action types
function getActionColor(action) {
  const colors = {
    login: '#28a745',
    logout: '#6c757d',
    password_changed: '#ffc107',
    password_reset_requested: '#17a2b8',
    password_reset_completed: '#28a745',
    email_verified: '#28a745',
    mfa_enabled: '#007bff',
    mfa_disabled: '#dc3545',
    oauth_linked: '#6f42c1',
    oauth_unlinked: '#6c757d',
    profile_updated: '#17a2b8',
  };
  return colors[action] || '#6c757d';
}

// Helper function to format action names
function formatAction(action) {
  return action
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Helper function to format dates
function formatDate(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default DashboardPage;
