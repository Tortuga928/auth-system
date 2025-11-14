/**
 * Device Management Page
 *
 * Story 9.5: Device Management UI
 * View and manage active sessions/devices
 */

import React, { useState, useEffect } from 'react';
import apiService from '../services/api';

function DeviceManagementPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [revoking, setRevoking] = useState(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.security.getSessions();
      setSessions(response.data.data.sessions);
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
      setError(err.response?.data?.error || 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId) => {
    if (!window.confirm('Are you sure you want to revoke this session? The device will be logged out.')) {
      return;
    }

    try {
      setRevoking(sessionId);
      await apiService.security.revokeSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      alert('Session revoked successfully');
    } catch (err) {
      console.error('Failed to revoke session:', err);
      alert(err.response?.data?.error || 'Failed to revoke session');
    } finally {
      setRevoking(null);
    }
  };

  const handleRevokeAllOthers = async () => {
    if (!window.confirm('Are you sure you want to log out all other devices? Only this device will remain logged in.')) {
      return;
    }

    try {
      setRevoking('all');
      const response = await apiService.security.revokeAllOthers();
      const revokedCount = response.data.data.revokedCount;
      await fetchSessions();
      alert(`Successfully logged out ${revokedCount} other device(s)`);
    } catch (err) {
      console.error('Failed to revoke sessions:', err);
      alert(err.response?.data?.error || 'Failed to revoke sessions');
    } finally {
      setRevoking(null);
    }
  };

  const getDeviceIcon = (deviceType) => {
    switch (deviceType) {
      case 'mobile':
        return '📱';
      case 'tablet':
        return '📱';
      case 'desktop':
      default:
        return '💻';
    }
  };

  const getRelativeTime = (timestamp) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  if (loading) {
    return (
      <div className="container">
        <div className="card">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div className="spinner-border" role="status">
              <span className="sr-only">Loading...</span>
            </div>
            <p className="mt-3">Loading devices...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="alert alert-danger">
          <h4>Error Loading Devices</h4>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={fetchSessions}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const currentSession = sessions.find((s) => s.is_current);
  const otherSessions = sessions.filter((s) => !s.is_current);

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Devices & Sessions</h1>
        {otherSessions.length > 0 && (
          <button
            className="btn btn-danger"
            onClick={handleRevokeAllOthers}
            disabled={revoking === 'all'}
          >
            {revoking === 'all' ? 'Logging out...' : 'Log Out Everywhere Else'}
          </button>
        )}
      </div>

      <p className="text-muted mb-4">
        Manage your active sessions. You can revoke access from devices you don't recognize.
      </p>

      {sessions.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-5">
            <h4>No Active Sessions</h4>
            <p className="text-muted">You don't have any active sessions.</p>
          </div>
        </div>
      ) : (
        <div className="row">
          {sessions.map((session) => (
            <div key={session.id} className="col-md-6 mb-4">
              <div className="card h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="d-flex align-items-center">
                      <span style={{ fontSize: '2rem', marginRight: '1rem' }}>
                        {getDeviceIcon(session.device_type)}
                      </span>
                      <div>
                        <h5 className="mb-0">
                          {session.device_name}
                          {session.is_current && (
                            <span className="badge bg-success ms-2">Current Device</span>
                          )}
                        </h5>
                        <small className="text-muted">{session.browser}</small>
                      </div>
                    </div>
                  </div>

                  <div className="mb-2">
                    <strong>OS:</strong> {session.os}
                  </div>
                  <div className="mb-2">
                    <strong>Location:</strong> {session.location}
                  </div>
                  <div className="mb-2">
                    <strong>IP Address:</strong> {session.ip_address}
                  </div>
                  <div className="mb-3">
                    <strong>Last Active:</strong>{' '}
                    <span className="text-muted">
                      {getRelativeTime(session.last_activity_at)}
                    </span>
                  </div>

                  {!session.is_current && (
                    <button
                      className="btn btn-outline-danger btn-sm w-100"
                      onClick={() => handleRevokeSession(session.id)}
                      disabled={revoking === session.id}
                    >
                      {revoking === session.id ? 'Revoking...' : 'Revoke Access'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DeviceManagementPage;
