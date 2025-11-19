/**
 * Account Settings Page
 *
 * Story 8.5: Account Settings
 * Allows users to change password and delete account
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiService from '../services/api';

function AccountSettingsPage() {
  const navigate = useNavigate();

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Account deletion state
  const [deleteForm, setDeleteForm] = useState({
    password: '',
    confirmDelete: false,
  });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Handle password change form input
  const handlePasswordChange = (e) => {
    setPasswordForm({
      ...passwordForm,
      [e.target.name]: e.target.value,
    });
    setPasswordError(null);
    setPasswordSuccess(false);
  };

  // Handle delete form input
  const handleDeleteChange = (e) => {
    const { name, value, type, checked } = e.target;
    setDeleteForm({
      ...deleteForm,
      [name]: type === 'checkbox' ? checked : value,
    });
    setDeleteError(null);
  };

  // Validate password change form
  const validatePasswordForm = () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('All fields are required');
      return false;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      return false;
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      setPasswordError('New password must be different from current password');
      return false;
    }

    // Password strength validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(passwordForm.newPassword)) {
      setPasswordError('Password must be at least 8 characters with uppercase, lowercase, number, and special character');
      return false;
    }

    return true;
  };

  // Handle password change submit
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!validatePasswordForm()) {
      return;
    }

    try {
      setPasswordLoading(true);
      setPasswordError(null);
      setPasswordSuccess(false);

      await apiService.user.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      setPasswordSuccess(true);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      // Auto-logout after 2.5 seconds (security best practice)
      setTimeout(async () => {
        try {
          // Call backend to invalidate all active sessions
          await apiService.auth.logout();
        } catch (error) {
          console.error('Logout API call failed:', error);
          // Continue with client-side logout even if API fails
        }
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        navigate('/login');
      }, 2500);

    } catch (err) {
      console.error('Password change failed:', err);
      setPasswordError(err.response?.data?.error || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (!deleteForm.password) {
      setDeleteError('Password is required to delete your account');
      return;
    }

    if (!deleteForm.confirmDelete) {
      setDeleteError('Please confirm that you want to delete your account');
      return;
    }

    try {
      setDeleteLoading(true);
      setDeleteError(null);

      await apiService.user.deleteAccount({
        password: deleteForm.password,
      });

      // Clear auth and redirect
      try {
        // Call backend to invalidate all active sessions
        await apiService.auth.logout();
      } catch (error) {
        console.error('Logout API call failed:', error);
        // Continue with navigation even if API fails
      }
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      navigate('/', { state: { message: 'Account deleted successfully' } });

    } catch (err) {
      console.error('Account deletion failed:', err);
      setDeleteError(err.response?.data?.error || 'Failed to delete account');
      setDeleteLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '800px', marginTop: '2rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/dashboard" style={{ color: '#007bff', textDecoration: 'none' }}>
          ← Back to Dashboard
        </Link>
      </div>

      <h1 style={{ marginBottom: '2rem' }}>Account Settings</h1>

      {/* Security Section - Story 9.5 */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-body">
          <h2 className="card-title" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
            Security
          </h2>
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>
            Manage your account security, view active sessions, and monitor login activity.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            {/* Device Management */}
            <Link
              to="/devices"
              className="card"
              style={{
                textDecoration: 'none',
                color: 'inherit',
                border: '1px solid #dee2e6',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                e.currentTarget.style.borderColor = '#007bff';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = '#dee2e6';
              }}
            >
              <div className="card-body text-center">
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💻</div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Device Management</h3>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>
                  View and manage active sessions
                </p>
              </div>
            </Link>

            {/* Login History */}
            <Link
              to="/login-history"
              className="card"
              style={{
                textDecoration: 'none',
                color: 'inherit',
                border: '1px solid #dee2e6',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                e.currentTarget.style.borderColor = '#007bff';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = '#dee2e6';
              }}
            >
              <div className="card-body text-center">
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Login History</h3>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>
                  Review all login attempts
                </p>
              </div>
            </Link>

            {/* Security Alerts */}
            <Link
              to="/security-alerts"
              className="card"
              style={{
                textDecoration: 'none',
                color: 'inherit',
                border: '1px solid #dee2e6',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                e.currentTarget.style.borderColor = '#007bff';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = '#dee2e6';
              }}
            >
              <div className="card-body text-center">
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🚨</div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Security Alerts</h3>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>
                  View and acknowledge events
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Password Change Section */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-body">
          <h2 className="card-title" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
            Change Password
          </h2>
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>
            Update your password to keep your account secure. You will be logged out after changing your password.
          </p>

          {passwordSuccess && (
            <div className="alert alert-success" role="alert">
              <h4 className="alert-heading">Password Changed Successfully!</h4>
              <p>Your password has been updated. You will be logged out in a moment...</p>
            </div>
          )}

          {passwordError && (
            <div className="alert alert-danger" role="alert">
              {passwordError}
            </div>
          )}

          <form onSubmit={handlePasswordSubmit}>
            {/* Current Password */}
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="currentPassword" style={{ fontWeight: 'bold', marginBottom: '0.5rem', display: 'block' }}>
                Current Password *
              </label>
              <input
                type="password"
                id="currentPassword"
                name="currentPassword"
                className="form-control"
                value={passwordForm.currentPassword}
                onChange={handlePasswordChange}
                required
                disabled={passwordLoading || passwordSuccess}
                style={{ fontSize: '1rem', padding: '0.5rem' }}
              />
            </div>

            {/* New Password */}
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="newPassword" style={{ fontWeight: 'bold', marginBottom: '0.5rem', display: 'block' }}>
                New Password *
              </label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                className="form-control"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                required
                disabled={passwordLoading || passwordSuccess}
                style={{ fontSize: '1rem', padding: '0.5rem' }}
              />
              <small className="form-text text-muted">
                At least 8 characters with uppercase, lowercase, number, and special character
              </small>
            </div>

            {/* Confirm New Password */}
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="confirmPassword" style={{ fontWeight: 'bold', marginBottom: '0.5rem', display: 'block' }}>
                Confirm New Password *
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                className="form-control"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
                required
                disabled={passwordLoading || passwordSuccess}
                style={{ fontSize: '1rem', padding: '0.5rem' }}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={passwordLoading || passwordSuccess}
              style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}
            >
              {passwordLoading ? 'Changing Password...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>

      {/* Danger Zone - Account Deletion */}
      <div className="card" style={{ border: '2px solid #dc3545' }}>
        <div className="card-body">
          <h2 className="card-title" style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#dc3545' }}>
            Danger Zone
          </h2>
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>
            Once you delete your account, there is no going back. This action cannot be undone.
          </p>

          {!showDeleteDialog ? (
            <button
              className="btn btn-danger"
              onClick={() => setShowDeleteDialog(true)}
              style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}
            >
              Delete Account
            </button>
          ) : (
            <div style={{ backgroundColor: '#fff3cd', border: '1px solid #ffc107', borderRadius: '4px', padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: '#856404' }}>
                ⚠️ Confirm Account Deletion
              </h3>
              <p style={{ marginBottom: '1rem', color: '#856404' }}>
                Are you absolutely sure? This will:
              </p>
              <ul style={{ marginBottom: '1.5rem', color: '#856404' }}>
                <li>Permanently delete your account</li>
                <li>Delete all your data including avatar</li>
                <li>Remove all activity history</li>
                <li>This action cannot be undone</li>
              </ul>

              {deleteError && (
                <div className="alert alert-danger" role="alert" style={{ marginBottom: '1rem' }}>
                  {deleteError}
                </div>
              )}

              {/* Password Confirmation */}
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="deletePassword" style={{ fontWeight: 'bold', marginBottom: '0.5rem', display: 'block', color: '#856404' }}>
                  Enter your password to confirm *
                </label>
                <input
                  type="password"
                  id="deletePassword"
                  name="password"
                  className="form-control"
                  value={deleteForm.password}
                  onChange={handleDeleteChange}
                  disabled={deleteLoading}
                  style={{ fontSize: '1rem', padding: '0.5rem' }}
                  placeholder="Your password"
                />
              </div>

              {/* Confirmation Checkbox */}
              <div className="form-check" style={{ marginBottom: '1.5rem' }}>
                <input
                  type="checkbox"
                  id="confirmDelete"
                  name="confirmDelete"
                  className="form-check-input"
                  checked={deleteForm.confirmDelete}
                  onChange={handleDeleteChange}
                  disabled={deleteLoading}
                />
                <label htmlFor="confirmDelete" className="form-check-label" style={{ color: '#856404', fontWeight: 'bold' }}>
                  I understand that this action cannot be undone
                </label>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  className="btn btn-danger"
                  onClick={handleDeleteAccount}
                  disabled={deleteLoading || !deleteForm.confirmDelete}
                  style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}
                >
                  {deleteLoading ? 'Deleting Account...' : 'Yes, Delete My Account'}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowDeleteDialog(false);
                    setDeleteForm({ password: '', confirmDelete: false });
                    setDeleteError(null);
                  }}
                  disabled={deleteLoading}
                  style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AccountSettingsPage;
