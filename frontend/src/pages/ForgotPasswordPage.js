/**
 * Forgot Password page component
 * Allows users to request a password reset email
 */

import React, { useState } from 'react';
import { validateEmail } from '../utils/validation';
import apiService from '../services/api';

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validate email
    if (!email.trim()) {
      setError('Email address is required');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      await apiService.auth.forgotPassword({ email });
      setSuccess(true);
      setEmail(''); // Clear form after success
    } catch (err) {
      setError(err || 'Failed to send password reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      <div className="card" style={{ maxWidth: '500px', margin: '0 auto' }}>
        <h1 className="text-center">Forgot Password</h1>
        <p className="text-center" style={{ color: '#666', marginTop: '0.5rem' }}>
          Enter your email address and we'll send you a link to reset your password.
        </p>

        {success ? (
          <div className="alert alert-success" style={{ marginTop: '1.5rem' }}>
            <strong>Email sent!</strong>
            <p style={{ marginTop: '0.5rem', marginBottom: 0 }}>
              If an account exists with that email, a password reset link has been sent.
              Please check your inbox and follow the instructions.
            </p>
            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
              <a href="/login" className="btn btn-primary">
                Back to Login
              </a>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-3">
            {error && (
              <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                {error}
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                disabled={loading}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%' }}
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        <div className="mt-3 text-center">
          <p>
            Remember your password? <a href="/login">Login here</a>
          </p>
          <p>
            Don't have an account? <a href="/register">Register here</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
