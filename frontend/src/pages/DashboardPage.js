/**
 * Dashboard page component
 *
 * Story 8.1: User Dashboard Page
 * Displays user profile, account status, quick actions, and recent activity
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiService from '../services/api';

function DashboardPage() {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch profile data on mount
  useEffect(() => {
    fetchProfileData();
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
            {/* Avatar placeholder */}
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '2rem',
                fontWeight: 'bold',
              }}
            >
              {user.username.charAt(0).toUpperCase()}
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
