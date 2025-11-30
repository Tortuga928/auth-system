/**
 * Users Management Page
 *
 * Admin interface for managing users - list, search, filter, and CRUD operations.
 * Story 10.5 - Admin Panel UI
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import adminApi from '../../services/adminApi';

import TestEmailModal from '../../components/TestEmailModal';
const UsersManagement = () => {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, totalPages: 1, total: 0 });
  const [filters, setFilters] = useState({ role: '', status: 'active', search: '' });
  const [sortConfig, setSortConfig] = useState({ sortBy: 'created_at', sortOrder: 'DESC' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showTestEmailModal, setShowTestEmailModal] = useState(false);
  const [testEmailUser, setTestEmailUser] = useState(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: pagination.page,
        pageSize: pagination.pageSize,
        ...filters,
        ...sortConfig,
      };

      const response = await adminApi.getUsersWithArchive(params);
      const data = response.data.data;

      setUsers(data.users || []);
      setPagination((prev) => ({
        ...prev,
        totalPages: data.pagination?.totalPages || 1,
        total: data.pagination?.total || 0,
      }));
    } catch (err) {
      console.error('Fetch users error:', err);
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, filters, sortConfig]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSort = (column) => {
    setSortConfig((prev) => ({
      sortBy: column,
      sortOrder: prev.sortBy === column && prev.sortOrder === 'ASC' ? 'DESC' : 'ASC',
    }));
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, page: newPage }));
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    if (!window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      return;
    }

    try {
      setActionLoading(true);
      await adminApi.updateUserRole(userId, newRole);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user role');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeactivateUser = async (user) => {
    const confirmMessage = `Are you sure you want to deactivate this user?

User ID: ${user.id}
Username: ${user.username}
Email: ${user.email}`;

    const confirmed = window.confirm(confirmMessage);
    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(true);
      await adminApi.deleteUser(user.id);
      await fetchUsers();
      alert(`User "${user.username}" has been deactivated successfully!`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to deactivate user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivateUser = async (user) => {
    const confirmed = window.confirm(`Are you sure you want to reactivate this user?`);
    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(true);
      await adminApi.reactivateUser(user.id);
      await fetchUsers();
      alert(`User "${user.username}" has been reactivated successfully!`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reactivate user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleArchiveUser = async (user) => {
    if (!window.confirm('Are you sure you want to archive this user?')) return;
    try {
      setActionLoading(true);
      await adminApi.archiveUser(user.id);
      await fetchUsers();
      alert(`User "${user.username}" has been archived successfully!`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to archive user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestoreFromArchive = async (user) => {
    if (!window.confirm('Are you sure you want to restore this user from archive?')) return;
    try {
      setActionLoading(true);
      await adminApi.restoreUser(user.id);
      await fetchUsers();
      alert(`User "${user.username}" has been restored successfully!`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to restore user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditClick = (user) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };


  const handleTestEmailClick = (user) => {
    setTestEmailUser(user);
    setShowTestEmailModal(true);
  };
  const handleEditSuccess = (message) => {
    setShowEditModal(false);
    setSelectedUser(null);
    fetchUsers();
    alert(message || 'User updated successfully!');
  };

  const styles = {
    controls: {
      display: 'flex',
      gap: '15px',
      marginBottom: '20px',
      flexWrap: 'wrap',
      alignItems: 'center',
    },
    searchInput: {
      padding: '8px 12px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      fontSize: '14px',
      minWidth: '250px',
    },
    select: {
      padding: '8px 12px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      fontSize: '14px',
      minWidth: '120px',
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
    editBtn: {
      backgroundColor: '#e0e0e0',
      border: '1px solid #666',
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
      cursor: 'pointer',
      userSelect: 'none',
    },
    td: {
      padding: '12px 15px',
      borderBottom: '1px solid #dee2e6',
    },
    badge: {
      display: 'inline-block',
      padding: '4px 10px',
      borderRadius: '20px',
      fontSize: '11px',
      fontWeight: 'bold',
      textTransform: 'uppercase',
    },
    roleBadge: {
      user: { backgroundColor: '#3498db', color: '#fff' },
      admin: { backgroundColor: '#9b59b6', color: '#fff' },
      super_admin: { backgroundColor: '#e74c3c', color: '#fff' },
    },
    archivedBadge: { backgroundColor: '#7f8c8d', color: '#fff' },
    archivedRow: { backgroundColor: '#f8f8f8', opacity: 0.8 },
    statusBadge: {
      true: { backgroundColor: '#27ae60', color: '#fff' },
      false: { backgroundColor: '#95a5a6', color: '#fff' },
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
    actionBtn: {
      padding: '4px 8px',
      fontSize: '12px',
      margin: '0 2px',
      cursor: 'pointer',
      border: 'none',
      borderRadius: '3px',
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
    <AdminLayout title="Users Management">
      {error && (
        <div style={styles.errorMsg}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Controls */}
      <div style={styles.controls}>
        <input
          type="text"
          placeholder="Search by username or email..."
          style={styles.searchInput}
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
        />
        <select
          style={styles.select}
          value={filters.role}
          onChange={(e) => handleFilterChange('role', e.target.value)}
        >
          <option value="">All Roles</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
          <option value="super_admin">Super Admin</option>
        </select>
        <select
          style={styles.select}
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="archived">Archived</option>
          <option value="">All</option>
        </select>
        <button
          style={{ ...styles.btn, ...styles.primaryBtn }}
          onClick={() => {
            setFilters({ role: '', status: '', search: '' });
            setPagination((prev) => ({ ...prev, page: 1 }));
          }}
        >
          Clear Filters
        </button>
        <div style={{ marginLeft: 'auto' }}>
          <button
            style={{ ...styles.btn, ...styles.successBtn }}
            onClick={() => setShowCreateModal(true)}
          >
            + Create User
          </button>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>Loading users...</div>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th} onClick={() => handleSort('id')}>
                    ID {sortConfig.sortBy === 'id' && (sortConfig.sortOrder === 'ASC' ? '↑' : '↓')}
                  </th>
                  <th style={styles.th} onClick={() => handleSort('username')}>
                    Username {sortConfig.sortBy === 'username' && (sortConfig.sortOrder === 'ASC' ? '↑' : '↓')}
                  </th>
                  <th style={styles.th} onClick={() => handleSort('email')}>
                    Email {sortConfig.sortBy === 'email' && (sortConfig.sortOrder === 'ASC' ? '↑' : '↓')}
                  </th>
                  <th style={styles.th}>Role</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th} onClick={() => handleSort('created_at')}>
                    Created {sortConfig.sortBy === 'created_at' && (sortConfig.sortOrder === 'ASC' ? '↑' : '↓')}
                  </th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ ...styles.td, textAlign: 'center' }}>
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id}>
                      <td style={styles.td}>{user.id}</td>
                      <td style={styles.td}>
                        <Link to={`/admin/users/${user.id}`} style={{ color: '#3498db', textDecoration: 'none' }}>
                          {user.username}
                        </Link>
                      </td>
                      <td style={styles.td}>{user.email}</td>
                      <td style={styles.td}>
                        <span style={{ ...styles.badge, ...styles.roleBadge[user.role] }}>{user.role}</span>
                      </td>
                      <td style={styles.td}>
                        <span style={{ ...styles.badge, ...styles.statusBadge[user.is_active] }}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={styles.td}>{new Date(user.created_at).toLocaleDateString()}</td>
                      <td style={styles.td}>
                        <button
                          style={{ ...styles.actionBtn, ...styles.editBtn }}
                          title="Edit User"
                          onClick={() => handleEditClick(user)}
                          disabled={actionLoading}
                        >
                          ✏️
                        </button>
                        <Link to={`/admin/users/${user.id}`}>
                          <button style={{ ...styles.actionBtn, ...styles.primaryBtn }} title="View Details">
                            👁️
                          </button>
                        </Link>
                        <button
                          style={{ ...styles.actionBtn, backgroundColor: '#17a2b8', color: '#fff' }}
                          title="Send Test Email"
                          onClick={() => handleTestEmailClick(user)}
                          disabled={actionLoading}
                        >
                          📧
                        </button>
                        <select
                          style={{ ...styles.actionBtn, padding: '4px', fontSize: '11px' }}
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          disabled={actionLoading}
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                          <option value="super_admin">Super Admin</option>
                        </select>
                        <button
                          style={{ ...styles.actionBtn, ...(user.is_active ? styles.successBtn : styles.dangerBtn) }}
                          title={user.is_active ? "Deactivate User" : "Reactivate User"}
                          onClick={() => user.is_active ? handleDeactivateUser(user) : handleReactivateUser(user)}
                          disabled={actionLoading}
                        >
                          ⏻
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
              Showing {(pagination.page - 1) * pagination.pageSize + 1} to{' '}
              {Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total} users
            </div>
            <div>
              <button
                style={styles.pageBtn}
                onClick={() => handlePageChange(1)}
                disabled={pagination.page === 1}
              >
                First
              </button>
              <button
                style={styles.pageBtn}
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                Prev
              </button>
              {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                const pageNum = Math.max(1, pagination.page - 2) + i;
                if (pageNum > pagination.totalPages) return null;
                return (
                  <button
                    key={pageNum}
                    style={{
                      ...styles.pageBtn,
                      ...(pagination.page === pageNum ? styles.activePageBtn : {}),
                    }}
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                style={styles.pageBtn}
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
              >
                Next
              </button>
              <button
                style={styles.pageBtn}
                onClick={() => handlePageChange(pagination.totalPages)}
                disabled={pagination.page === pagination.totalPages}
              >
                Last
              </button>
            </div>
          </div>
        </>
      )}

      {/* Create User Modal (simplified) */}
      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchUsers();
          }}
        />
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <EditUserModal
          user={selectedUser}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Test Email Modal */}
      {showTestEmailModal && testEmailUser && (
        <TestEmailModal
          isOpen={showTestEmailModal}
          onClose={() => {
            setShowTestEmailModal(false);
            setTestEmailUser(null);
          }}
          isAdmin={true}
          userEmail={testEmailUser.email}
          sendTestEmail={async () => {
            const response = await adminApi.sendTestEmail(testEmailUser.id);
            return response.data;
          }}
        />
      )}
    </AdminLayout>
  );
};

// Create User Modal Component
const CreateUserModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await adminApi.createUser(formData);
      alert('User created successfully!');
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const modalStyles = {
    overlay: {
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
    },
    modal: {
      backgroundColor: '#fff',
      borderRadius: '8px',
      padding: '30px',
      width: '400px',
      maxWidth: '90%',
    },
    title: {
      fontSize: '20px',
      marginBottom: '20px',
      color: '#2c3e50',
    },
    formGroup: {
      marginBottom: '15px',
    },
    label: {
      display: 'block',
      marginBottom: '5px',
      fontWeight: 'bold',
      fontSize: '14px',
    },
    input: {
      width: '100%',
      padding: '8px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      fontSize: '14px',
      boxSizing: 'border-box',
    },
    buttons: {
      display: 'flex',
      gap: '10px',
      marginTop: '20px',
    },
    btn: {
      flex: 1,
      padding: '10px',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontWeight: 'bold',
    },
    error: {
      color: '#e74c3c',
      marginBottom: '15px',
      fontSize: '14px',
    },
  };

  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={modalStyles.title}>Create New User</h2>
        {error && <div style={modalStyles.error}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div style={modalStyles.formGroup}>
            <label style={modalStyles.label}>Username</label>
            <input
              type="text"
              style={modalStyles.input}
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
            />
          </div>
          <div style={modalStyles.formGroup}>
            <label style={modalStyles.label}>Email</label>
            <input
              type="email"
              style={modalStyles.input}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          <div style={modalStyles.formGroup}>
            <label style={modalStyles.label}>Password</label>
            <input
              type="password"
              style={modalStyles.input}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength="8"
            />
          </div>
          <div style={modalStyles.formGroup}>
            <label style={modalStyles.label}>Role</label>
            <select
              style={modalStyles.input}
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>
          <div style={modalStyles.buttons}>
            <button
              type="button"
              style={{ ...modalStyles.btn, backgroundColor: '#95a5a6', color: '#fff' }}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{ ...modalStyles.btn, backgroundColor: '#27ae60', color: '#fff' }}
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit User Modal Component
const EditUserModal = ({ user, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    username: user.username || '',
    email: user.email || '',
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    role: user.role || 'user',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate password match if password is provided
    if (formData.password && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password length if provided
    if (formData.password && formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      // Build update data (exclude confirmPassword and empty password)
      const updateData = {
        username: formData.username,
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        role: formData.role,
      };

      // Only include password if provided
      if (formData.password && formData.password.trim() !== '') {
        updateData.password = formData.password;
      }

      const response = await adminApi.updateUser(user.id, updateData);
      onSuccess(response.data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const modalStyles = {
    overlay: {
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
    },
    modal: {
      backgroundColor: '#fff',
      borderRadius: '8px',
      padding: '30px',
      width: '450px',
      maxWidth: '90%',
      maxHeight: '90vh',
      overflowY: 'auto',
    },
    title: {
      fontSize: '20px',
      marginBottom: '20px',
      color: '#2c3e50',
    },
    formGroup: {
      marginBottom: '15px',
    },
    label: {
      display: 'block',
      marginBottom: '5px',
      fontWeight: 'bold',
      fontSize: '14px',
    },
    input: {
      width: '100%',
      padding: '8px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      fontSize: '14px',
      boxSizing: 'border-box',
    },
    hint: {
      fontSize: '12px',
      color: '#666',
      marginTop: '4px',
    },
    warning: {
      fontSize: '12px',
      color: '#f39c12',
      marginTop: '4px',
    },
    passwordWrapper: {
      position: 'relative',
    },
    eyeBtn: {
      position: 'absolute',
      right: '8px',
      top: '50%',
      transform: 'translateY(-50%)',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: '4px',
    },
    divider: {
      borderTop: '1px solid #eee',
      margin: '20px 0',
      paddingTop: '15px',
    },
    dividerLabel: {
      fontSize: '14px',
      color: '#666',
      marginBottom: '15px',
    },
    buttons: {
      display: 'flex',
      gap: '10px',
      marginTop: '20px',
    },
    btn: {
      flex: 1,
      padding: '10px',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontWeight: 'bold',
    },
    error: {
      color: '#e74c3c',
      marginBottom: '15px',
      fontSize: '14px',
      backgroundColor: '#ffeaea',
      padding: '10px',
      borderRadius: '4px',
    },
  };

  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={modalStyles.title}>Edit User: {user.username}</h2>
        {error && <div style={modalStyles.error}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div style={modalStyles.formGroup}>
            <label style={modalStyles.label}>Username *</label>
            <input
              type="text"
              style={modalStyles.input}
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
              minLength="3"
              maxLength="50"
            />
          </div>

          <div style={modalStyles.formGroup}>
            <label style={modalStyles.label}>Email *</label>
            <input
              type="email"
              style={modalStyles.input}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            {formData.email !== user.email && (
              <div style={modalStyles.warning}>
                Warning: Changing email will require re-verification
              </div>
            )}
          </div>

          <div style={modalStyles.formGroup}>
            <label style={modalStyles.label}>First Name</label>
            <input
              type="text"
              style={modalStyles.input}
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            />
          </div>

          <div style={modalStyles.formGroup}>
            <label style={modalStyles.label}>Last Name</label>
            <input
              type="text"
              style={modalStyles.input}
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            />
          </div>

          <div style={modalStyles.formGroup}>
            <label style={modalStyles.label}>Role *</label>
            <select
              style={modalStyles.input}
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>

          <div style={modalStyles.divider}>
            <div style={modalStyles.dividerLabel}>Password Reset (Optional)</div>

            <div style={modalStyles.formGroup}>
              <label style={modalStyles.label}>New Password</label>
              <div style={modalStyles.passwordWrapper}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  style={{ ...modalStyles.input, paddingRight: '35px' }}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  minLength="8"
                  placeholder="Leave blank to keep current"
                />
                <button
                  type="button"
                  style={modalStyles.eyeBtn}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              <div style={modalStyles.hint}>Leave blank to keep current password</div>
            </div>

            <div style={modalStyles.formGroup}>
              <label style={modalStyles.label}>Confirm Password</label>
              <div style={modalStyles.passwordWrapper}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  style={{ ...modalStyles.input, paddingRight: '35px' }}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Confirm new password"
                />
              </div>
            </div>
          </div>

          <div style={modalStyles.buttons}>
            <button
              type="button"
              style={{ ...modalStyles.btn, backgroundColor: '#95a5a6', color: '#fff' }}
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{ ...modalStyles.btn, backgroundColor: '#3498db', color: '#fff' }}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UsersManagement;
