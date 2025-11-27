/**
 * User Detail Page
 *
 * Detailed view of a single user with all information and management options.
 * Story 10.5 - Admin Panel UI
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import adminApi from '../../services/adminApi';

const UserDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showAnonymizeConfirm, setShowAnonymizeConfirm] = useState(false);
  const [anonymizeInput, setAnonymizeInput] = useState('');

  useEffect(() => {
    fetchUserDetail();
  }, [id]);

  const fetchUserDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminApi.getUserById(id);
      setUser(response.data.data.user);
    } catch (err) {
      console.error('Fetch user detail error:', err);
      setError(err.response?.data?.message || 'Failed to load user details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async () => {
    if (!window.confirm(`Are you sure you want to ${user.is_active ? 'deactivate' : 'activate'} this user?`)) {
      return;
    }

    try {
      setActionLoading(true);
      await adminApi.updateUserStatus(user.id, !user.is_active);
      fetchUserDetail();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRoleChange = async (newRole) => {
    if (!window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      return;
    }

    try {
      setActionLoading(true);
      await adminApi.updateUserRole(user.id, newRole);
      fetchUserDetail();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user role');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      setActionLoading(true);
      await adminApi.deleteUser(user.id);
      alert('User deleted successfully');
      navigate('/admin/users');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user');
      setActionLoading(false);
    }
  };

  const styles = {
    container: {
      maxWidth: '900px',
      margin: '0 auto',
    },
    backBtn: {
      padding: '8px 16px',
      backgroundColor: '#95a5a6',
      color: '#fff',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      marginBottom: '20px',
      fontSize: '14px',
    },
    card: {
      backgroundColor: '#fff',
      borderRadius: '8px',
      padding: '30px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      marginBottom: '20px',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '25px',
      paddingBottom: '20px',
      borderBottom: '2px solid #ecf0f1',
    },
    title: {
      fontSize: '24px',
      color: '#2c3e50',
      margin: 0,
    },
    section: {
      marginBottom: '30px',
    },
    sectionTitle: {
      fontSize: '18px',
      color: '#34495e',
      marginBottom: '15px',
      fontWeight: 'bold',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
      gap: '20px',
    },
    field: {
      marginBottom: '15px',
    },
    label: {
      display: 'block',
      fontSize: '12px',
      color: '#7f8c8d',
      textTransform: 'uppercase',
      marginBottom: '5px',
      fontWeight: 'bold',
    },
    value: {
      fontSize: '16px',
      color: '#2c3e50',
    },
    badge: {
      display: 'inline-block',
      padding: '6px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: 'bold',
      textTransform: 'uppercase',
    },
    roleBadge: {
      user: { backgroundColor: '#3498db', color: '#fff' },
      admin: { backgroundColor: '#9b59b6', color: '#fff' },
      super_admin: { backgroundColor: '#e74c3c', color: '#fff' },
    },
    statusBadge: {
      true: { backgroundColor: '#27ae60', color: '#fff' },
      false: { backgroundColor: '#95a5a6', color: '#fff' },
    },
    actions: {
      display: 'flex',
      gap: '10px',
      marginTop: '20px',
      paddingTop: '20px',
      borderTop: '1px solid #ecf0f1',
    },
    btn: {
      padding: '10px 20px',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: 'bold',
      flex: 1,
    },
    primaryBtn: {
      backgroundColor: '#3498db',
      color: '#fff',
    },
    successBtn: {
      backgroundColor: '#27ae60',
      color: '#fff',
    },
    dangerBtn: {
      backgroundColor: '#e74c3c',
      color: '#fff',
    },
    warningBtn: {
      backgroundColor: '#f39c12',
      color: '#fff',
    },
    errorMsg: {
      backgroundColor: '#ffeaea',
      color: '#e74c3c',
      padding: '15px',
      borderRadius: '4px',
      marginBottom: '20px',
    },
    select: {
      padding: '8px 12px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      fontSize: '14px',
      backgroundColor: '#fff',
    },
  };

  if (loading) {
    return (
      <AdminLayout title="User Details">
        <div style={{ textAlign: 'center', padding: '50px' }}>Loading user details...</div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="User Details">
        <div style={styles.errorMsg}>
          <strong>Error:</strong> {error}
        </div>
        <button style={styles.backBtn} onClick={() => navigate('/admin/users')}>
          ← Back to Users
        </button>
      </AdminLayout>
    );
  }

  if (!user) {
    return (
      <AdminLayout title="User Details">
        <div style={{ textAlign: 'center', padding: '50px' }}>User not found</div>
        <button style={styles.backBtn} onClick={() => navigate('/admin/users')}>
          ← Back to Users
        </button>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="User Details">
      <div style={styles.container}>
        <button style={styles.backBtn} onClick={() => navigate('/admin/users')}>
          ← Back to Users
        </button>

        {/* User Info Card */}
        <div style={styles.card}>
          <div style={styles.header}>
            <h2 style={styles.title}>{user.username}</h2>
            <div>
              <span style={{ ...styles.badge, ...styles.roleBadge[user.role] }}>{user.role}</span>
              {' '}
              <span style={{ ...styles.badge, ...styles.statusBadge[user.is_active] }}>
                {user.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          {/* Account Information */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Account Information</h3>
            <div style={styles.grid}>
              <div style={styles.field}>
                <label style={styles.label}>User ID</label>
                <div style={styles.value}>{user.id}</div>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Email</label>
                <div style={styles.value}>{user.email}</div>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>First Name</label>
                <div style={styles.value}>{user.first_name || 'N/A'}</div>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Last Name</label>
                <div style={styles.value}>{user.last_name || 'N/A'}</div>
              </div>
            </div>
          </div>

          {/* Account Status */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Account Status</h3>
            <div style={styles.grid}>
              <div style={styles.field}>
                <label style={styles.label}>Email Verified</label>
                <div style={styles.value}>{user.email_verified ? '✅ Yes' : '❌ No'}</div>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>MFA Enabled</label>
                <div style={styles.value}>{user.mfa_enabled ? '✅ Yes' : '❌ No'}</div>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Active Sessions</label>
                <div style={styles.value}>{user.active_sessions_count || 0}</div>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>OAuth Accounts</label>
                <div style={styles.value}>{user.oauth_accounts_count || 0}</div>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Activity</h3>
            <div style={styles.grid}>
              <div style={styles.field}>
                <label style={styles.label}>Created At</label>
                <div style={styles.value}>{new Date(user.created_at).toLocaleString()}</div>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Updated At</label>
                <div style={styles.value}>{new Date(user.updated_at).toLocaleString()}</div>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Last Login</label>
                <div style={styles.value}>
                  {user.last_login_at ? new Date(user.last_login_at).toLocaleString() : 'Never'}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={styles.actions}>
            <button
              style={{ ...styles.btn, ...styles.warningBtn }}
              onClick={handleStatusToggle}
              disabled={actionLoading}
            >
              {user.is_active ? '🔒 Deactivate User' : '🔓 Activate User'}
            </button>

            <select
              style={{ ...styles.select, flex: 1 }}
              value={user.role}
              onChange={(e) => handleRoleChange(e.target.value)}
              disabled={actionLoading}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>

            <button
              style={{ ...styles.btn, ...styles.dangerBtn }}
              onClick={handleDeleteUser}
              disabled={actionLoading}
            >
              🗑️ Delete User
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default UserDetailPage;
