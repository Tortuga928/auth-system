/**
 * Register page component
 *
 * Handles user registration with support for:
 * - Email verification requirement
 * - MFA enforcement notification (when enabled)
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';

// Registration Success Modal Component
const RegistrationSuccessModal = ({ isOpen, onClose, email, mfaSetupRequired }) => {
  if (!isOpen) return null;

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalContent}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>✅ Registration Successful!</h2>
        </div>

        <div style={styles.modalBody}>
          <div style={styles.stepContainer}>
            <div style={styles.step}>
              <div style={styles.stepNumber}>1</div>
              <div style={styles.stepContent}>
                <h3 style={styles.stepTitle}>Verify Your Email</h3>
                <p style={styles.stepDescription}>
                  We have sent a verification email to <strong>{email}</strong>.
                  Please check your inbox and click the verification link to activate your account.
                </p>
                <p style={styles.stepNote}>
                  Note: Check your spam folder if you do not see the email within a few minutes.
                </p>
              </div>
            </div>

            {mfaSetupRequired && (
              <div style={styles.step}>
                <div style={styles.stepNumber}>2</div>
                <div style={styles.stepContent}>
                  <h3 style={styles.stepTitle}>Set Up Two-Factor Authentication</h3>
                  <p style={styles.stepDescription}>
                    After verifying your email, you will be required to set up two-factor
                    authentication (2FA) for your account security.
                  </p>
                  <p style={styles.stepNote}>
                    This is a security requirement. You will need an authenticator app
                    (like Google Authenticator or Authy) installed on your phone.
                  </p>
                </div>
              </div>
            )}

            <div style={styles.step}>
              <div style={styles.stepNumber}>{mfaSetupRequired ? '3' : '2'}</div>
              <div style={styles.stepContent}>
                <h3 style={styles.stepTitle}>Log In to Your Account</h3>
                <p style={styles.stepDescription}>
                  Once verification is complete{mfaSetupRequired ? ' and MFA is set up' : ''},
                  you can log in and start using the application.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div style={styles.modalFooter}>
          <button style={styles.primaryButton} onClick={onClose}>
            Go to Login
          </button>
        </div>
      </div>
    </div>
  );
};

// Styles for the modal
const styles = {
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    maxWidth: '500px',
    width: '90%',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
  },
  modalHeader: {
    padding: '24px',
    borderBottom: '1px solid #e0e0e0',
    backgroundColor: '#f8f9fa',
    borderRadius: '12px 12px 0 0',
  },
  modalTitle: {
    margin: 0,
    fontSize: '24px',
    color: '#28a745',
    textAlign: 'center',
  },
  modalBody: {
    padding: '24px',
  },
  stepContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  step: {
    display: 'flex',
    gap: '16px',
    padding: '16px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
  },
  stepNumber: {
    width: '32px',
    height: '32px',
    backgroundColor: '#007bff',
    color: '#fff',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '16px',
    flexShrink: 0,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    margin: '0 0 8px 0',
    fontSize: '16px',
    fontWeight: '600',
    color: '#333',
  },
  stepDescription: {
    margin: '0 0 8px 0',
    fontSize: '14px',
    color: '#666',
    lineHeight: '1.5',
  },
  stepNote: {
    margin: 0,
    fontSize: '12px',
    color: '#888',
    fontStyle: 'italic',
  },
  modalFooter: {
    padding: '16px 24px',
    borderTop: '1px solid #e0e0e0',
    backgroundColor: '#f8f9fa',
    borderRadius: '0 0 12px 12px',
    display: 'flex',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    padding: '12px 32px',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};

function RegisterPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [registrationData, setRegistrationData] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      // Call registration API
      const response = await apiService.auth.register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });

      // Store registration response data
      setRegistrationData({
        email: formData.email,
        emailVerificationRequired: response.data?.data?.emailVerificationRequired || true,
        mfaSetupRequired: response.data?.data?.mfaSetupRequired || false,
      });

      // Show success modal
      setShowSuccessModal(true);

    } catch (err) {
      // Extract error message from response
      const errorMessage = err.response?.data?.error ||
                          err.response?.data?.message ||
                          err.message ||
                          'Registration failed. Please try again.';

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setShowSuccessModal(false);
    navigate('/login', {
      state: {
        message: 'Registration successful! Please check your email to verify your account.',
      },
    });
  };

  return (
    <div className="container">
      {/* Registration Success Modal */}
      <RegistrationSuccessModal
        isOpen={showSuccessModal}
        onClose={handleModalClose}
        email={registrationData?.email}
        mfaSetupRequired={registrationData?.mfaSetupRequired}
      />

      <div className="card" style={{ maxWidth: '500px', margin: '0 auto' }}>
        <h1 className="text-center">Register</h1>

        {/* Error Message */}
        {error && (
          <div className="alert alert-danger mt-3" role="alert">
            ❌ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-3">
          <div className="form-group">
            <label className="form-label" htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              className="form-control"
              value={formData.username}
              onChange={handleChange}
              required
              disabled={loading || showSuccessModal}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-control"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading || showSuccessModal}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              className="form-control"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading || showSuccessModal}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              className="form-control"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              disabled={loading || showSuccessModal}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={loading || showSuccessModal}
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <div className="mt-3 text-center">
          <p>
            Already have an account? <a href="/login">Login here</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
