/**
 * Audit Logs Page
 *
 * View and filter admin action logs.
 * Story 10.5 - Admin Panel UI
 */

import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import adminApi from '../../services/adminApi';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 25, totalPages: 1, total: 0 });
  const [filters, setFilters] = useState({ action: '', admin_id: '', start_date: '', end_date: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: pagination.page,
        pageSize: pagination.pageSize,
        ...filters,
        sortOrder: 'DESC',
      };

      const response = await adminApi.getAuditLogs(params);
      const data = response.data.data;

      setLogs(data.logs || []);
      setPagination((prev) => ({
        ...prev,
        totalPages: data.pagination?.totalPages || 1,
        total: data.pagination?.total || 0,
      }));
    } catch (err) {
      console.error('Fetch audit logs error:', err);
      setError(err.response?.data?.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, filters]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, page: newPage }));
    }
  };

  const actionTypes = [
    'USER_CREATE',
    'USER_UPDATE',
    'USER_DELETE',
    'USER_ROLE_CHANGE',
    'USER_STATUS_CHANGE',
    'USER_PASSWORD_RESET',
    'SYSTEM_CONFIG_UPDATE',
    'ADMIN_LOGIN',
  ];

  const getActionBadgeColor = (action) => {
    const colors = {
      USER_CREATE: '#27ae60',
      USER_UPDATE: '#3498db',
      USER_DELETE: '#e74c3c',
      USER_ROLE_CHANGE: '#9b59b6',
      USER_STATUS_CHANGE: '#f39c12',
      USER_PASSWORD_RESET: '#e67e22',
      SYSTEM_CONFIG_UPDATE: '#1abc9c',
      ADMIN_LOGIN: '#34495e',
    };
    return colors[action] || '#95a5a6';
  };

  const styles = {
    controls: {
      display: 'flex',
      gap: '15px',
      marginBottom: '20px',
      flexWrap: 'wrap',
      alignItems: 'center',
    },
    select: {
      padding: '8px 12px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      fontSize: '14px',
      minWidth: '150px',
    },
    dateInput: {
      padding: '8px 12px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      fontSize: '14px',
    },
    btn: {
      padding: '8px 16px',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
    },
    primaryBtn: {
      backgroundColor: '#3498db',
      color: '#fff',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      backgroundColor: '#fff',
      borderRadius: '8px',
      overflow: 'hidden',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    th: {
      padding: '12px 15px',
      textAlign: 'left',
      backgroundColor: '#f8f9fa',
      borderBottom: '2px solid #dee2e6',
      fontSize: '13px',
      fontWeight: 'bold',
    },
    td: {
      padding: '12px 15px',
      borderBottom: '1px solid #dee2e6',
      fontSize: '13px',
    },
    badge: {
      display: 'inline-block',
      padding: '4px 10px',
      borderRadius: '20px',
      fontSize: '11px',
      fontWeight: 'bold',
      color: '#fff',
    },
    pagination: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: '20px',
      padding: '15px',
      backgroundColor: '#fff',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    pageBtn: {
      padding: '6px 12px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      backgroundColor: '#fff',
      cursor: 'pointer',
      margin: '0 2px',
    },
    activePageBtn: {
      backgroundColor: '#3498db',
      color: '#fff',
      borderColor: '#3498db',
    },
    detailsBtn: {
      padding: '4px 8px',
      fontSize: '12px',
      backgroundColor: '#3498db',
      color: '#fff',
      border: 'none',
      borderRadius: '3px',
      cursor: 'pointer',
    },
    errorMsg: {
      backgroundColor: '#ffeaea',
      color: '#e74c3c',
      padding: '15px',
      borderRadius: '4px',
      marginBottom: '20px',
    },
  };

  return (
    <AdminLayout title="Audit Logs">
      {error && (
        <div style={styles.errorMsg}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Filters */}
      <div style={styles.controls}>
        <select
          style={styles.select}
          value={filters.action}
          onChange={(e) => handleFilterChange('action', e.target.value)}
        >
          <option value="">All Actions</option>
          {actionTypes.map((action) => (
            <option key={action} value={action}>
              {action.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
        <input
          type="date"
          style={styles.dateInput}
          value={filters.start_date}
          onChange={(e) => handleFilterChange('start_date', e.target.value)}
          placeholder="Start Date"
        />
        <input
          type="date"
          style={styles.dateInput}
          value={filters.end_date}
          onChange={(e) => handleFilterChange('end_date', e.target.value)}
          placeholder="End Date"
        />
        <button
          style={{ ...styles.btn, ...styles.primaryBtn }}
          onClick={() => {
            setFilters({ action: '', admin_id: '', start_date: '', end_date: '' });
            setPagination((prev) => ({ ...prev, page: 1 }));
          }}
        >
          Clear Filters
        </button>
        <div style={{ marginLeft: 'auto', fontSize: '14px', color: '#7f8c8d' }}>
          Total: {pagination.total} logs
        </div>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>Loading audit logs...</div>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>Admin</th>
                  <th style={styles.th}>Action</th>
                  <th style={styles.th}>Target</th>
                  <th style={styles.th}>IP Address</th>
                  <th style={styles.th}>Timestamp</th>
                  <th style={styles.th}>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ ...styles.td, textAlign: 'center' }}>
                      No audit logs found
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id}>
                      <td style={styles.td}>{log.id}</td>
                      <td style={styles.td}>
                        <div>{log.admin_email || `ID: ${log.admin_id}`}</div>
                      </td>
                      <td style={styles.td}>
                        <span style={{ ...styles.badge, backgroundColor: getActionBadgeColor(log.action) }}>
                          {log.action.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td style={styles.td}>
                        {log.target_type && (
                          <span>
                            {log.target_type} #{log.target_id}
                          </span>
                        )}
                      </td>
                      <td style={styles.td}>{log.ip_address}</td>
                      <td style={styles.td}>{new Date(log.created_at).toLocaleString()}</td>
                      <td style={styles.td}>
                        <button style={styles.detailsBtn} onClick={() => setSelectedLog(log)}>
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={styles.pagination}>
            <div>
              Page {pagination.page} of {pagination.totalPages}
            </div>
            <div>
              <button
                style={styles.pageBtn}
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                Prev
              </button>
              <button
                style={styles.pageBtn}
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {/* Details Modal */}
      {selectedLog && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
          }}
          onClick={() => setSelectedLog(null)}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              padding: '30px',
              width: '600px',
              maxWidth: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0 }}>Audit Log Details</h3>
            <table style={{ width: '100%', fontSize: '14px' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '8px 0', fontWeight: 'bold' }}>ID:</td>
                  <td>{selectedLog.id}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Admin ID:</td>
                  <td>{selectedLog.admin_id}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Admin Email:</td>
                  <td>{selectedLog.admin_email}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Action:</td>
                  <td>{selectedLog.action}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Target Type:</td>
                  <td>{selectedLog.target_type}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Target ID:</td>
                  <td>{selectedLog.target_id}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 0', fontWeight: 'bold' }}>IP Address:</td>
                  <td>{selectedLog.ip_address}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 0', fontWeight: 'bold' }}>User Agent:</td>
                  <td style={{ wordBreak: 'break-all' }}>{selectedLog.user_agent}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Timestamp:</td>
                  <td>{new Date(selectedLog.created_at).toLocaleString()}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 0', fontWeight: 'bold', verticalAlign: 'top' }}>Details:</td>
                  <td>
                    <pre
                      style={{
                        backgroundColor: '#f8f9fa',
                        padding: '10px',
                        borderRadius: '4px',
                        overflow: 'auto',
                        fontSize: '12px',
                      }}
                    >
                      {JSON.stringify(selectedLog.details, null, 2)}
                    </pre>
                  </td>
                </tr>
              </tbody>
            </table>
            <button
              style={{
                marginTop: '20px',
                padding: '10px 20px',
                backgroundColor: '#3498db',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
              onClick={() => setSelectedLog(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AuditLogs;
