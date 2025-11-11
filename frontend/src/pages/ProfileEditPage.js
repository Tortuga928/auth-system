/**
 * Profile Edit Page
 *
 * Story 8.3: Profile Edit Page
 * Allows users to update their username, email, first name, and last name
 * Requires password confirmation for security
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiService from '../services/api';

function ProfileEditPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
  });

  const [originalData, setOriginalData] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [emailChanged, setEmailChanged] = useState(false);

  // Fetch current profile data
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.user.getProfile();
      const user = response.data.data.user;

      const profileData = {
        username: user.username || '',
        email: user.email || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        password: '',
      };

      setFormData(profileData);
      setOriginalData({
        username: user.username || '',
        email: user.email || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
      });
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError(null);
    setSuccess(false);
  };

  const validateForm = () => {
    // Check if password is provided
    if (!formData.password) {
      setError('Password is required to update your profile');
      return false;
    }

    // Check if at least one field changed
    const hasChanges =
      formData.username !== originalData.username ||
      formData.email !== originalData.email ||
      formData.first_name !== originalData.first_name ||
      formData.last_name !== originalData.last_name;

    if (!hasChanges) {
      setError('No changes detected. Please modify at least one field.');
      return false;
    }

    // Validate username format
    if (formData.username && formData.username !== originalData.username) {
      const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
      if (!usernameRegex.test(formData.username)) {
        setError('Username must be 3-30 characters and contain only letters, numbers, and underscores');
        return false;
      }
    }

    // Validate email format
    if (formData.email && formData.email !== originalData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError('Invalid email format');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validation
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(false);

      const response = await apiService.user.updateProfile(formData);

      setSuccess(true);
      setEmailChanged(response.data.data.emailChanged || false);

      // Update original data with new values
      const updatedUser = response.data.data.user;
      setOriginalData({
        username: updatedUser.username,
        email: updatedUser.email,
        first_name: updatedUser.first_name || '',
        last_name: updatedUser.last_name || '',
      });

      // Clear password field
      setFormData({ ...formData, password: '' });

      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Optional: Redirect to dashboard after 3 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    } catch (err) {
      console.error('Profile update failed:', err);
      setError(err.response?.data?.error || 'Failed to update profile');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/dashboard');
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
            <p className="mt-3">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '600px', marginTop: '2rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/dashboard" style={{ color: '#007bff', textDecoration: 'none' }}>
          ← Back to Dashboard
        </Link>
      </div>

      <div className="card">
        <div className="card-body">
          <h1 className="card-title" style={{ marginBottom: '1.5rem' }}>Edit Profile</h1>

          {/* Success Message */}
          {success && (
            <div className="alert alert-success" role="alert">
              <h4 className="alert-heading">Profile Updated Successfully!</h4>
              <p>Your profile information has been updated.</p>
              {emailChanged && (
                <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#fff3cd', border: '1px solid #ffc107', borderRadius: '4px' }}>
                  <strong>⚠️ Email Verification Required</strong>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>
                    Your email address has been changed. Please check your new email inbox for a verification link.
                    You may need to verify your new email to access all features.
                  </p>
                </div>
              )}
              <p style={{ marginTop: '1rem', marginBottom: 0, fontSize: '0.875rem' }}>
                Redirecting to dashboard in 3 seconds...
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          {/* Profile Edit Form */}
          <form onSubmit={handleSubmit}>
            {/* Username */}
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="username" style={{ fontWeight: 'bold', marginBottom: '0.5rem', display: 'block' }}>
                Username *
              </label>
              <input
                type="text"
                id="username"
                name="username"
                className="form-control"
                value={formData.username}
                onChange={handleChange}
                required
                minLength={3}
                maxLength={30}
                pattern="[a-zA-Z0-9_]{3,30}"
                disabled={submitting}
                style={{ fontSize: '1rem', padding: '0.5rem' }}
              />
              <small className="form-text text-muted">
                3-30 characters, letters, numbers, and underscores only
              </small>
            </div>

            {/* Email */}
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="email" style={{ fontWeight: 'bold', marginBottom: '0.5rem', display: 'block' }}>
                Email *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className="form-control"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={submitting}
                style={{ fontSize: '1rem', padding: '0.5rem' }}
              />
              <small className="form-text text-muted">
                Changing your email will require re-verification
              </small>
            </div>

            {/* First Name */}
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="first_name" style={{ fontWeight: 'bold', marginBottom: '0.5rem', display: 'block' }}>
                First Name
              </label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                className="form-control"
                value={formData.first_name}
                onChange={handleChange}
                maxLength={100}
                disabled={submitting}
                style={{ fontSize: '1rem', padding: '0.5rem' }}
              />
            </div>

            {/* Last Name */}
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="last_name" style={{ fontWeight: 'bold', marginBottom: '0.5rem', display: 'block' }}>
                Last Name
              </label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                className="form-control"
                value={formData.last_name}
                onChange={handleChange}
                maxLength={100}
                disabled={submitting}
                style={{ fontSize: '1rem', padding: '0.5rem' }}
              />
            </div>

            {/* Password Confirmation */}
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="password" style={{ fontWeight: 'bold', marginBottom: '0.5rem', display: 'block' }}>
                Current Password * <span style={{ fontWeight: 'normal', fontSize: '0.875rem', color: '#666' }}>(required for security)</span>
              </label>
              <input
                type="password"
                id="password"
                name="password"
                className="form-control"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={submitting}
                style={{ fontSize: '1rem', padding: '0.5rem' }}
                placeholder="Enter your current password to confirm changes"
              />
              <small className="form-text text-muted">
                Your password is required to update profile information
              </small>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
                style={{ flex: 1, padding: '0.75rem', fontSize: '1rem' }}
              >
                {submitting ? 'Saving Changes...' : 'Save Changes'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCancel}
                disabled={submitting}
                style={{ flex: 1, padding: '0.75rem', fontSize: '1rem' }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Help Text */}
      <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
        <h5 style={{ marginBottom: '0.75rem' }}>Profile Update Tips</h5>
        <ul style={{ marginBottom: 0, paddingLeft: '1.25rem', fontSize: '0.875rem' }}>
          <li>Your current password is always required to make changes</li>
          <li>Username must be unique and 3-30 characters</li>
          <li>Changing your email will require you to verify the new address</li>
          <li>First and last names are optional</li>
        </ul>
      </div>
    </div>
  );
}

export default ProfileEditPage;
