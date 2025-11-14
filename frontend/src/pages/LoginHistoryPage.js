/**
 * Login History Page
 *
 * Story 9.5: Device Management UI
 * View paginated login history with filtering
 */

import React, { useState, useEffect } from 'react';
import apiService from '../services/api';

function LoginHistoryPage() {
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'success', 'failure'
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 25;

  useEffect(() => {
    fetchLoginHistory();
    fetchLoginStats();
  }, [page, filter]);

  const fetchLoginHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.security.getLoginHistory(page, pageSize);
      let loginData = response.data.data.history;

      // Apply filter
      if (filter === 'success') {
        loginData = loginData.filter((item) => item.success);
      } else if (filter === 'failure') {
        loginData = loginData.filter((item) => !item.success);
      }

      setHistory(loginData);
      setTotalPages(response.data.data.pagination.totalPages);
    } catch (err) {
      console.error('Failed to fetch login history:', err);
      setError(err.response?.data?.error || 'Failed to load login history');
    } finally {
      setLoading(false);
    }
  };

  const fetchLoginStats = async () => {
    try {
      const response = await apiService.security.getLoginStats(30);
      setStats(response.data.data);
    } catch (err) {
      console.error('Failed to fetch login stats:', err);
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

  const getSuccessIcon = (success) => {
    return success ? '✓' : '✗';
  };

  const getSuccessBadgeClass = (success) => {
    return success ? 'badge bg-success' : 'badge bg-danger';
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setPage(1); // Reset to first page when filter changes
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  if (loading && !history.length) {
    return (
      <div className="container">
        <div className="card">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div className="spinner-border" role="status">
              <span className="sr-only">Loading...</span>
            </div>
            <p className="mt-3">Loading login history...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="alert alert-danger">
          <h4>Error Loading Login History</h4>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={fetchLoginHistory}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <h1 className="mb-4">Login History</h1>

      {/* Stats Summary */}
      {stats && (
        <div className="row mb-4">
          <div className="col-md-4">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Total Logins</h5>
                <p className="display-4">{stats.totalLogins}</p>
                <small className="text-muted">Last 30 days</small>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Successful Logins</h5>
                <p className="display-4 text-success">{stats.successfulLogins}</p>
                <small className="text-muted">
                  {stats.totalLogins > 0
                    ? `${((stats.successfulLogins / stats.totalLogins) * 100).toFixed(1)}% success rate`
                    : 'No data'}
                </small>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Failed Logins</h5>
                <p className="display-4 text-danger">{stats.failedLogins}</p>
                <small className="text-muted">
                  {stats.totalLogins > 0
                    ? `${((stats.failedLogins / stats.totalLogins) * 100).toFixed(1)}% failure rate`
                    : 'No data'}
                </small>
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
          All Logins
        </button>
        <button
          type="button"
          className={`btn ${filter === 'success' ? 'btn-success' : 'btn-outline-success'}`}
          onClick={() => handleFilterChange('success')}
        >
          Successful
        </button>
        <button
          type="button"
          className={`btn ${filter === 'failure' ? 'btn-danger' : 'btn-outline-danger'}`}
          onClick={() => handleFilterChange('failure')}
        >
          Failed
        </button>
      </div>

      {/* Login History Table */}
      {history.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-5">
            <h4>No Login History</h4>
            <p className="text-muted">No login attempts found for the selected filter.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="card">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Timestamp</th>
                    <th>Device</th>
                    <th>Location</th>
                    <th>IP Address</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <span className={getSuccessBadgeClass(item.success)}>
                          {getSuccessIcon(item.success)}{' '}
                          {item.success ? 'Success' : 'Failed'}
                        </span>
                      </td>
                      <td>{formatTimestamp(item.created_at)}</td>
                      <td>
                        <div>
                          <strong>{item.device_name}</strong>
                          <br />
                          <small className="text-muted">
                            {item.browser} on {item.os}
                          </small>
                        </div>
                      </td>
                      <td>{item.location || 'Unknown'}</td>
                      <td>
                        <code>{item.ip_address}</code>
                      </td>
                      <td>
                        {!item.success && item.failure_reason && (
                          <span className="badge bg-warning text-dark">
                            {item.failure_reason}
                          </span>
                        )}
                        {item.mfa_used && (
                          <span className="badge bg-info ms-1">MFA</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
                    // Show first, last, current, and adjacent pages
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
                      // Show ellipsis for gaps
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

export default LoginHistoryPage;
