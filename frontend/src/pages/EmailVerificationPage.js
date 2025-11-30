/**
 * Email Verification page component
 * Verifies user email address using token from URL
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiService from '../services/api';

function EmailVerificationPage() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Verify email on component mount
  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setError('Invalid or missing verification token');
        setLoading(false);
        return;
      }

      try {
        await apiService.auth.verifyEmail(token);
        setSuccess(true);

        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } catch (err) {
        const errorMessage = err.response?.data?.message || err.message || 'Failed to verify email. The link may be invalid or expired.';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    verifyEmail();
  }, [token, navigate]);

  return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      <div className="card" style={{ maxWidth: '500px', margin: '0 auto' }}>
        <h1 className="text-center">Email Verification</h1>

        {loading && (
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <p style={{ color: '#666', fontSize: '1.1rem' }}>
              Verifying your email address...
            </p>
            <div style={{
              display: 'inline-block',
              width: '40px',
              height: '40px',
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #007bff',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginTop: '1rem'
            }} />
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        )}

        {!loading && success && (
          <div className="alert alert-success" style={{ marginTop: '1.5rem' }}>
            <strong>Email verified successfully!</strong>
            <p style={{ marginTop: '0.5rem', marginBottom: 0 }}>
              Your email address has been verified. You can now log in to your account.
            </p>
            <p style={{ marginTop: '0.5rem', marginBottom: 0, fontSize: '0.9em', color: '#666' }}>
              Redirecting to login page in 3 seconds...
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="alert alert-error" style={{ marginTop: '1.5rem' }}>
            <strong>Verification Failed</strong>
            <p style={{ marginTop: '0.5rem', marginBottom: 0 }}>
              {error}
            </p>
          </div>
        )}

        <div className="mt-3 text-center">
          {!loading && error && (
            <p>
              Need a new verification link? <a href="/login">Login</a> to request one.
            </p>
          )}
          {!loading && success && (
            <p>
              <a href="/login">Click here</a> if you're not redirected automatically.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default EmailVerificationPage;
