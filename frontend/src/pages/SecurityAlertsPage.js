/**
 * Security Alerts Page
 *
 * Story 9.5: Device Management UI
 * View and acknowledge security events
 */

import React, { useState, useEffect } from 'react';
import apiService from '../services/api';

function SecurityAlertsPage() {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'unacknowledged'
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [acknowledgingId, setAcknowledgingId] = useState(null);
  const [acknowledgingAll, setAcknowledgingAll] = useState(false);
  const pageSize = 25;

  useEffect(() => {
    fetchSecurityEvents();
    fetchEventStats();
  }, [page, filter]);

  const fetchSecurityEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.security.getSecurityEvents(page, pageSize);
      let eventData = response.data.data.events;

      // Apply filter
      if (filter === 'unacknowledged') {
        eventData = eventData.filter((event) => !event.acknowledged_at);
      }

      setEvents(eventData);
      setTotalPages(response.data.data.pagination.totalPages);
    } catch (err) {
      console.error('Failed to fetch security events:', err);
      setError(err.response?.data?.error || 'Failed to load security events');
    } finally {
      setLoading(false);
    }
  };

  const fetchEventStats = async () => {
    try {
      const response = await apiService.security.getEventStats(30);
      setStats(response.data.data);
    } catch (err) {
      console.error('Failed to fetch event stats:', err);
    }
  };

  const handleAcknowledgeEvent = async (eventId) => {
    try {
      setAcknowledgingId(eventId);
      await apiService.security.acknowledgeEvent(eventId);
      // Update local state
      setEvents((prev) =>
        prev.map((event) =>
          event.id === eventId ? { ...event, acknowledged_at: new Date().toISOString() } : event
        )
      );
      // Refresh stats
      await fetchEventStats();
    } catch (err) {
      console.error('Failed to acknowledge event:', err);
      alert(err.response?.data?.error || 'Failed to acknowledge event');
    } finally {
      setAcknowledgingId(null);
    }
  };

  const handleAcknowledgeAll = async () => {
    if (!window.confirm('Are you sure you want to acknowledge all unacknowledged security events?')) {
      return;
    }

    try {
      setAcknowledgingAll(true);
      const response = await apiService.security.acknowledgeAllEvents();
      const acknowledgedCount = response.data.data.acknowledgedCount;

      // Refresh events and stats
      await fetchSecurityEvents();
      await fetchEventStats();

      alert(`Successfully acknowledged ${acknowledgedCount} security event(s)`);
    } catch (err) {
      console.error('Failed to acknowledge all events:', err);
      alert(err.response?.data?.error || 'Failed to acknowledge all events');
    } finally {
      setAcknowledgingAll(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getEventTypeLabel = (eventType) => {
    const labels = {
      NEW_LOCATION: 'New Location',
      NEW_DEVICE: 'New Device',
      BRUTE_FORCE: 'Brute Force Detected',
      SUSPICIOUS_ACTIVITY: 'Suspicious Activity',
      MFA_ENABLED: 'MFA Enabled',
      MFA_DISABLED: 'MFA Disabled',
      PASSWORD_CHANGED: 'Password Changed',
      ACCOUNT_DELETED: 'Account Deleted',
    };
    return labels[eventType] || eventType;
  };

  const getEventTypeBadgeClass = (eventType) => {
    const classes = {
      NEW_LOCATION: 'badge bg-info',
      NEW_DEVICE: 'badge bg-info',
      BRUTE_FORCE: 'badge bg-danger',
      SUSPICIOUS_ACTIVITY: 'badge bg-warning text-dark',
      MFA_ENABLED: 'badge bg-success',
      MFA_DISABLED: 'badge bg-warning text-dark',
      PASSWORD_CHANGED: 'badge bg-primary',
      ACCOUNT_DELETED: 'badge bg-danger',
    };
    return classes[eventType] || 'badge bg-secondary';
  };

  const getEventIcon = (eventType) => {
    const icons = {
      NEW_LOCATION: '📍',
      NEW_DEVICE: '📱',
      BRUTE_FORCE: '🚨',
      SUSPICIOUS_ACTIVITY: '⚠️',
      MFA_ENABLED: '🔐',
      MFA_DISABLED: '🔓',
      PASSWORD_CHANGED: '🔑',
      ACCOUNT_DELETED: '🗑️',
    };
    return icons[eventType] || '📋';
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const unacknowledgedCount = events.filter((e) => !e.acknowledged_at).length;

  if (loading && !events.length) {
    return (
      <div className="container">
        <div className="card">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div className="spinner-border" role="status">
              <span className="sr-only">Loading...</span>
            </div>
            <p className="mt-3">Loading security events...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="alert alert-danger">
          <h4>Error Loading Security Events</h4>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={fetchSecurityEvents}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Security Alerts</h1>
        {unacknowledgedCount > 0 && (
          <button
            className="btn btn-primary"
            onClick={handleAcknowledgeAll}
            disabled={acknowledgingAll}
          >
            {acknowledgingAll ? 'Acknowledging...' : `Acknowledge All (${unacknowledgedCount})`}
          </button>
        )}
      </div>

      {/* Stats Summary */}
      {stats && (
        <div className="row mb-4">
          <div className="col-md-3">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Total Events</h5>
                <p className="display-4">{stats.totalEvents}</p>
                <small className="text-muted">Last 30 days</small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card border-info">
              <div className="card-body">
                <h5 className="card-title">New Location</h5>
                <p className="display-4 text-info">{stats.byType?.NEW_LOCATION || 0}</p>
                <small className="text-muted">Logins from new places</small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card border-info">
              <div className="card-body">
                <h5 className="card-title">New Device</h5>
                <p className="display-4 text-info">{stats.byType?.NEW_DEVICE || 0}</p>
                <small className="text-muted">New device detected</small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card border-danger">
              <div className="card-body">
                <h5 className="card-title">Brute Force</h5>
                <p className="display-4 text-danger">{stats.byType?.BRUTE_FORCE || 0}</p>
                <small className="text-muted">Attack attempts</small>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Buttons */}
      <div className="btn-group mb-4" role="group">
        <button
          type="button"
          className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
          onClick={() => handleFilterChange('all')}
        >
          All Events
        </button>
        <button
          type="button"
          className={`btn ${filter === 'unacknowledged' ? 'btn-warning' : 'btn-outline-warning'}`}
          onClick={() => handleFilterChange('unacknowledged')}
        >
          Unacknowledged
          {unacknowledgedCount > 0 && (
            <span className="badge bg-danger ms-2">{unacknowledgedCount}</span>
          )}
        </button>
      </div>

      {/* Security Events List */}
      {events.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-5">
            <h4>No Security Events</h4>
            <p className="text-muted">
              {filter === 'unacknowledged'
                ? 'All security events have been acknowledged.'
                : 'No security events found.'}
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="row">
            {events.map((event) => (
              <div key={event.id} className="col-md-6 mb-4">
                <div
                  className={`card h-100 ${!event.acknowledged_at ? 'border-warning' : ''}`}
                  style={{ borderWidth: !event.acknowledged_at ? '2px' : '1px' }}
                >
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div className="d-flex align-items-center">
                        <span style={{ fontSize: '2rem', marginRight: '1rem' }}>
                          {getEventIcon(event.event_type)}
                        </span>
                        <div>
                          <h5 className="mb-0">{getEventTypeLabel(event.event_type)}</h5>
                          <small className="text-muted">
                            {formatTimestamp(event.created_at)}
                          </small>
                        </div>
                      </div>
                      <span className={getEventTypeBadgeClass(event.event_type)}>
                        {event.severity || 'Info'}
                      </span>
                    </div>

                    {event.description && (
                      <p className="mb-3">{event.description}</p>
                    )}

                    {event.details && (
                      <div className="mb-3">
                        <strong>Details:</strong>
                        <div style={{ fontSize: '0.9rem', color: '#666' }}>
                          {Object.entries(JSON.parse(event.details) || {}).map(
                            ([key, value]) => (
                              <div key={key}>
                                <strong>{key}:</strong> {String(value)}
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        {event.acknowledged_at ? (
                          <span className="badge bg-success">
                            ✓ Acknowledged
                          </span>
                        ) : (
                          <span className="badge bg-warning text-dark">
                            ⚠️ Needs Review
                          </span>
                        )}
                      </div>
                      {!event.acknowledged_at && (
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleAcknowledgeEvent(event.id)}
                          disabled={acknowledgingId === event.id}
                        >
                          {acknowledgingId === event.id
                            ? 'Acknowledging...'
                            : 'Acknowledge'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <nav>
                <ul className="pagination">
                  <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1}
                    >
                      Previous
                    </button>
                  </li>
                  {[...Array(totalPages)].map((_, idx) => {
                    const pageNum = idx + 1;
                    if (
                      pageNum === 1 ||
                      pageNum === totalPages ||
                      Math.abs(pageNum - page) <= 1
                    ) {
                      return (
                        <li
                          key={pageNum}
                          className={`page-item ${page === pageNum ? 'active' : ''}`}
                        >
                          <button
                            className="page-link"
                            onClick={() => handlePageChange(pageNum)}
                          >
                            {pageNum}
                          </button>
                        </li>
                      );
                    } else if (Math.abs(pageNum - page) === 2) {
                      return (
                        <li key={pageNum} className="page-item disabled">
                          <span className="page-link">...</span>
                        </li>
                      );
                    }
                    return null;
                  })}
                  <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page === totalPages}
                    >
                      Next
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default SecurityAlertsPage;
