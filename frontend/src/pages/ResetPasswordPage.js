/**
 * Reset Password page component
 * Allows users to set a new password using a reset token
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { validatePassword, getPasswordStrength } from '../utils/validation';
import apiService from '../services/api';

function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('');

  // Validate token exists
  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token');
    }
  }, [token]);

  // Update password strength indicator
  useEffect(() => {
    if (password) {
      setPasswordStrength(getPasswordStrength(password));
    } else {
      setPasswordStrength('');
    }
  }, [password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate password
    if (!password.trim()) {
      setError('Password is required');
      return;
    }

    if (!validatePassword(password)) {
      setError('Password must be at least 8 characters with uppercase, lowercase, and numbers');
      return;
    }

    // Validate password confirmation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await apiService.auth.resetPassword(token, { password });
      setSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err || 'Failed to reset password. The link may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  const getStrengthColor = () => {
    switch (passwordStrength) {
      case 'weak':
        return '#dc3545';
      case 'medium':
        return '#ffc107';
      case 'strong':
        return '#28a745';
      default:
        return '#6c757d';
    }
  };

  return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      <div className="card" style={{ maxWidth: '500px', margin: '0 auto' }}>
        <h1 className="text-center">Reset Password</h1>
        <p className="text-center" style={{ color: '#666', marginTop: '0.5rem' }}>
          Enter your new password below.
        </p>

        {success ? (
          <div className="alert alert-success" style={{ marginTop: '1.5rem' }}>
            <strong>Password reset successful!</strong>
            <p style={{ marginTop: '0.5rem', marginBottom: 0 }}>
              Your password has been successfully reset. You can now log in with your new password.
            </p>
            <p style={{ marginTop: '0.5rem', marginBottom: 0, fontSize: '0.9em', color: '#666' }}>
              Redirecting to login page in 3 seconds...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-3">
            {error && (
              <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                {error}
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="password">New Password</label>
              <input
                type="password"
                id="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                disabled={loading}
                required
              />
              {passwordStrength && (
                <small
                  style={{
                    display: 'block',
                    marginTop: '0.25rem',
                    color: getStrengthColor(),
                    fontWeight: '500',
                  }}
                >
                  Password strength: {passwordStrength}
                </small>
              )}
              <small style={{ display: 'block', marginTop: '0.25rem', color: '#666' }}>
                Must be at least 8 characters with uppercase, lowercase, and numbers
              </small>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                className="form-control"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                disabled={loading}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%' }}
              disabled={loading || !token}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        <div className="mt-3 text-center">
          <p>
            Remember your password? <a href="/login">Login here</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default ResetPasswordPage;
