/**
 * OAuth Callback Handler Page
 * 
 * Handles the OAuth callback from Google/GitHub
 * Extracts tokens from URL, stores them, and redirects user
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function OAuthCallbackPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState('processing');
  const [error, setError] = useState(null);

  useEffect(() => {
    handleOAuthCallback();
  }, []);

  const handleOAuthCallback = () => {
    try {
      // Parse URL parameters
      const params = new URLSearchParams(location.search);
      const token = params.get('token');
      const refreshToken = params.get('refresh');
      const errorParam = params.get('error');

      // Check for error in URL
      if (errorParam) {
        setStatus('error');
        setError(getErrorMessage(errorParam));
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      // Validate tokens
      if (!token) {
        setStatus('error');
        setError('No authentication token received');
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      // Store tokens in localStorage
      localStorage.setItem('authToken', token);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }

      console.log('✅ OAuth tokens stored successfully');
      setStatus('success');

      // Redirect to dashboard after short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err) {
      console.error('OAuth callback error:', err);
      setStatus('error');
      setError('Failed to process OAuth callback');
      setTimeout(() => navigate('/login'), 3000);
    }
  };

  const getErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'oauth_failed':
        return 'OAuth authentication failed. Please try again.';
      case 'oauth_error':
        return 'An error occurred during authentication.';
      default:
        return 'Authentication error. Please try again.';
    }
  };

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: '500px', margin: '100px auto', textAlign: 'center' }}>
        {status === 'processing' && (
          <>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔄</div>
            <h2>Processing Authentication...</h2>
            <p style={{ color: '#666', marginTop: '10px' }}>
              Please wait while we log you in
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>✅</div>
            <h2>Authentication Successful!</h2>
            <p style={{ color: '#666', marginTop: '10px' }}>
              Redirecting to dashboard...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>❌</div>
            <h2>Authentication Failed</h2>
            <p style={{ color: '#666', marginTop: '10px' }}>
              {error}
            </p>
            <p style={{ color: '#999', marginTop: '20px', fontSize: '14px' }}>
              Redirecting to login page...
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default OAuthCallbackPage;
