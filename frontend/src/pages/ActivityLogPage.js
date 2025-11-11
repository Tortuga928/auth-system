/**
 * Activity Log Page
 *
 * Story 8.4: Activity Log Page
 * Displays complete user activity history with pagination
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiService from '../services/api';

function ActivityLogPage() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 25,
    totalCount: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch activity logs
  useEffect(() => {
    fetchActivityLogs(pagination.page);
  }, []);

  const fetchActivityLogs = async (page) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.user.getActivity(page, pagination.pageSize);
      const data = response.data.data;

      setLogs(data.logs);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Failed to fetch activity logs:', err);
      setError(err.response?.data?.error || 'Failed to load activity history');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setPagination({ ...pagination, page: newPage });
    fetchActivityLogs(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Loading state
  if (loading && logs.length === 0) {
    return (
      <div className="container">
        <div className="card">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div className="spinner-border" role="status">
              <span className="sr-only">Loading...</span>
            </div>
            <p className="mt-3">Loading activity history...</p>
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
          <h4>Error Loading Activity History</h4>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => fetchActivityLogs(1)}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ marginTop: '2rem' }}>
      {/* Header with back link */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Link to="/dashboard" style={{ color: '#007bff', textDecoration: 'none', marginBottom: '0.5rem', display: 'inline-block' }}>
            ← Back to Dashboard
          </Link>
          <h1 style={{ margin: 0 }}>Activity History</h1>
          <p style={{ margin: '0.5rem 0 0 0', color: '#666' }}>
            Showing {logs.length > 0 ? ((pagination.page - 1) * pagination.pageSize + 1) : 0} - {Math.min(pagination.page * pagination.pageSize, pagination.totalCount)} of {pagination.totalCount} activities
          </p>
        </div>
      </div>

      {/* Activity logs table */}
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {logs.length === 0 ? (
            // Empty state
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
              <h3>No Activity Yet</h3>
              <p style={{ color: '#666' }}>Your activity history will appear here as you use the application.</p>
            </div>
          ) : (
            <>
              {/* Desktop table view */}
              <div className="table-responsive" style={{ display: 'none', '@media (min-width: 768px)': { display: 'block' } }}>
                <table className="table table-hover" style={{ marginBottom: 0 }}>
                  <thead style={{ backgroundColor: '#f8f9fa' }}>
                    <tr>
                      <th style={{ padding: '1rem', borderBottom: '2px solid #dee2e6' }}>Action</th>
                      <th style={{ padding: '1rem', borderBottom: '2px solid #dee2e6' }}>Description</th>
                      <th style={{ padding: '1rem', borderBottom: '2px solid #dee2e6' }}>Date & Time</th>
                      <th style={{ padding: '1rem', borderBottom: '2px solid #dee2e6' }}>IP Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                        <td style={{ padding: '1rem', verticalAlign: 'middle' }}>
                          <span
                            className="badge"
                            style={{
                              backgroundColor: getActionColor(log.action),
                              color: 'white',
                              padding: '0.35rem 0.65rem',
                              borderRadius: '4px',
                              fontSize: '0.8rem',
                              fontWeight: 'normal',
                            }}
                          >
                            {formatAction(log.action)}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', verticalAlign: 'middle' }}>
                          {log.description || '-'}
                        </td>
                        <td style={{ padding: '1rem', verticalAlign: 'middle', fontSize: '0.9rem', color: '#666' }}>
                          <div>{formatDate(log.timestamp)}</div>
                          <div style={{ fontSize: '0.75rem', color: '#999' }}>
                            {formatTime(log.timestamp)}
                          </div>
                        </td>
                        <td style={{ padding: '1rem', verticalAlign: 'middle', fontFamily: 'monospace', fontSize: '0.85rem', color: '#666' }}>
                          {log.ipAddress || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile card view */}
              <div style={{ display: 'block' }} className="mobile-view">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    style={{
                      padding: '1rem',
                      borderBottom: '1px solid #dee2e6',
                    }}
                  >
                    <div style={{ marginBottom: '0.5rem' }}>
                      <span
                        className="badge"
                        style={{
                          backgroundColor: getActionColor(log.action),
                          color: 'white',
                          padding: '0.35rem 0.65rem',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          fontWeight: 'normal',
                        }}
                      >
                        {formatAction(log.action)}
                      </span>
                    </div>
                    {log.description && (
                      <div style={{ marginBottom: '0.5rem', fontSize: '0.95rem' }}>
                        {log.description}
                      </div>
                    )}
                    <div style={{ fontSize: '0.85rem', color: '#666' }}>
                      <div>{formatDate(log.timestamp)} at {formatTime(log.timestamp)}</div>
                      {log.ipAddress && (
                        <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                          IP: {log.ipAddress}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
          <button
            className="btn btn-outline-primary"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1 || loading}
            style={{ minWidth: '100px' }}
          >
            ← Previous
          </button>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {/* First page */}
            {pagination.page > 3 && (
              <>
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => handlePageChange(1)}
                  disabled={loading}
                  style={{ minWidth: '40px' }}
                >
                  1
                </button>
                {pagination.page > 4 && <span>...</span>}
              </>
            )}

            {/* Pages around current */}
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter(page => {
                return Math.abs(page - pagination.page) <= 2;
              })
              .map(page => (
                <button
                  key={page}
                  className={`btn ${page === pagination.page ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => handlePageChange(page)}
                  disabled={loading}
                  style={{ minWidth: '40px' }}
                >
                  {page}
                </button>
              ))}

            {/* Last page */}
            {pagination.page < pagination.totalPages - 2 && (
              <>
                {pagination.page < pagination.totalPages - 3 && <span>...</span>}
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => handlePageChange(pagination.totalPages)}
                  disabled={loading}
                  style={{ minWidth: '40px' }}
                >
                  {pagination.totalPages}
                </button>
              </>
            )}
          </div>

          <button
            className="btn btn-outline-primary"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages || loading}
            style={{ minWidth: '100px' }}
          >
            Next →
          </button>
        </div>
      )}

      {/* Page info */}
      {pagination.totalPages > 1 && (
        <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.9rem', color: '#666' }}>
          Page {pagination.page} of {pagination.totalPages}
        </div>
      )}
    </div>
  );
}

// Helper function to get color for action types
function getActionColor(action) {
  const colors = {
    login: '#28a745',
    logout: '#6c757d',
    register: '#17a2b8',
    password_changed: '#ffc107',
    password_reset_requested: '#17a2b8',
    password_reset_completed: '#28a745',
    email_verified: '#28a745',
    email_verification_sent: '#17a2b8',
    mfa_enabled: '#007bff',
    mfa_disabled: '#dc3545',
    mfa_verified: '#28a745',
    oauth_linked: '#6f42c1',
    oauth_unlinked: '#6c757d',
    profile_updated: '#17a2b8',
    avatar_uploaded: '#20c997',
    avatar_deleted: '#6c757d',
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
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Helper function to format time
function formatTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

export default ActivityLogPage;
