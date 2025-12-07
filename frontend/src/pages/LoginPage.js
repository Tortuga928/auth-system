/**
 * Login page component
 * Updated with Email 2FA support (Phase 6)
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaChallengeToken, setMfaChallengeToken] = useState('');
  const [mfaCode, setMfaCode] = useState('');

  // Email 2FA specific state (Phase 6)
  const [mfaMethod, setMfaMethod] = useState('totp'); // 'totp' or 'email'
  const [availableMethods, setAvailableMethods] = useState([]);
  const [backupMethod, setBackupMethod] = useState(null);
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const [emailCodeExpiresAt, setEmailCodeExpiresAt] = useState(null);
  const [deviceTrustEnabled, setDeviceTrustEnabled] = useState(false);
  const [deviceTrustDays, setDeviceTrustDays] = useState(30);
  const [trustDevice, setTrustDevice] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  // Countdown timer for resend button (Phase 6)
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await apiService.auth.login({ email, password });

      // Check if MFA is required
      if (response.data.data.mfaRequired) {
        setMfaRequired(true);
        setMfaChallengeToken(response.data.data.mfaChallengeToken);

        // Set Email 2FA specific data (Phase 6)
        const data = response.data.data;
        setMfaMethod(data.mfaMethod || 'totp');
        setAvailableMethods(data.availableMethods || ['totp']);
        setBackupMethod(data.backupMethod || null);
        setEmailCodeSent(data.emailCodeSent || false);
        setEmailCodeExpiresAt(data.emailCodeExpiresAt || null);
        setDeviceTrustEnabled(data.deviceTrustEnabled || false);
        setDeviceTrustDays(data.deviceTrustDays || 30);

        // Start resend countdown if email code was sent
        if (data.emailCodeSent) {
          setResendCountdown(60);
        }

        setLoading(false);
        return;
      }

      // Regular login success
      localStorage.setItem('authToken', response.data.data.tokens.accessToken);
      localStorage.setItem('refreshToken', response.data.data.tokens.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Login failed. Please try again.');
      setLoading(false);
    }
  };

  const handleMfaSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let response;

      // Sanitize input: trim whitespace and remove any non-alphanumeric characters except dash
      const sanitizedCode = mfaCode.trim().replace(/[^0-9A-Za-z-]/g, '');

      // Check if it's a backup code (contains dash or is longer than 6 chars)
      const isBackupCode = sanitizedCode.includes('-') || sanitizedCode.length > 6;

      if (isBackupCode) {
        // Use backup code endpoint
        response = await apiService.auth.verifyBackupCode({
          mfaChallengeToken,
          backupCode: sanitizedCode.toUpperCase(),
        });
      } else if (mfaMethod === 'email') {
        // Use Email 2FA endpoint (Phase 6)
        response = await apiService.auth.verifyEmailMFA({
          mfaChallengeToken,
          code: sanitizedCode,
          trustDevice: trustDevice,
        });
      } else {
        // Use TOTP endpoint
        response = await apiService.auth.verifyMFA({
          mfaChallengeToken,
          token: sanitizedCode,
        });
      }

      const accessToken = response.data.data.tokens.accessToken;
      const refreshToken = response.data.data.tokens.refreshToken;

      localStorage.setItem('authToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));

      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Invalid MFA code. Please try again.');
      setLoading(false);
    }
  };

  // Handle resending email code (Phase 6)
  const handleResendEmailCode = async () => {
    if (resendCountdown > 0) return;

    setError('');
    setLoading(true);

    try {
      await apiService.auth.resendEmailMFA({ mfaChallengeToken });
      setEmailCodeSent(true);
      setResendCountdown(60);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle switching MFA method (Phase 6)
  const handleSwitchMethod = async (newMethod) => {
    if (newMethod === mfaMethod) return;

    setError('');
    setLoading(true);

    try {
      const response = await apiService.auth.switchMFAMethod({
        mfaChallengeToken,
        method: newMethod,
      });

      setMfaMethod(newMethod);
      setMfaCode('');

      // If switching to email, code is automatically sent
      if (newMethod === 'email') {
        setEmailCodeSent(true);
        setEmailCodeExpiresAt(response.data.data.emailCodeExpiresAt);
        setResendCountdown(60);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to switch method. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Redirect to Google OAuth endpoint
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    window.location.href = `${apiUrl}/api/oauth/google`;
  };

  const handleGitHubLogin = () => {
    // Redirect to GitHub OAuth endpoint
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    window.location.href = `${apiUrl}/api/oauth/github`;
  };

  // Show MFA form if MFA is required
  if (mfaRequired) {
    const isEmailMethod = mfaMethod === 'email';
    const canSwitchMethod = availableMethods.length > 1;

    return (
      <div className="container">
        <div className="card" style={{ maxWidth: '500px', margin: '0 auto' }}>
          <h1 className="text-center">Two-Factor Authentication</h1>
          <p className="text-center" style={{ color: '#666' }}>
            {isEmailMethod
              ? 'Enter the verification code sent to your email'
              : 'Enter the 6-digit code from your authenticator app or use a backup code'
            }
          </p>

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          {/* Method Switcher (Phase 6) */}
          {canSwitchMethod && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                {availableMethods.includes('totp') && (
                  <button
                    type="button"
                    className={`btn ${mfaMethod === 'totp' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => handleSwitchMethod('totp')}
                    disabled={loading}
                    style={{ flex: 1 }}
                  >
                    🔑 Authenticator App
                  </button>
                )}
                {availableMethods.includes('email') && (
                  <button
                    type="button"
                    className={`btn ${mfaMethod === 'email' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => handleSwitchMethod('email')}
                    disabled={loading}
                    style={{ flex: 1 }}
                  >
                    📧 Email Code
                  </button>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleMfaSubmit} className="mt-3">
            <div className="form-group">
              <label className="form-label" htmlFor="mfaCode">
                {isEmailMethod ? 'Email Verification Code' : 'Verification Code'}
              </label>
              <input
                type="text"
                id="mfaCode"
                className="form-control"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                placeholder={isEmailMethod ? 'Enter code from email' : 'Enter 6-digit code or backup code'}
                required
                autoFocus
                maxLength={isEmailMethod ? 6 : 20}
              />
            </div>

            {/* Email code resend option (Phase 6) */}
            {isEmailMethod && emailCodeSent && (
              <div style={{ marginBottom: '15px', textAlign: 'center' }}>
                <p style={{ fontSize: '14px', color: '#666', margin: '0 0 10px 0' }}>
                  Code sent to your registered email address
                </p>
                <button
                  type="button"
                  className="btn btn-link"
                  onClick={handleResendEmailCode}
                  disabled={loading || resendCountdown > 0}
                  style={{ padding: '0' }}
                >
                  {resendCountdown > 0
                    ? `Resend code in ${resendCountdown}s`
                    : 'Resend code'
                  }
                </button>
              </div>
            )}

            {/* Trust device checkbox (Phase 6) */}
            {deviceTrustEnabled && (
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={trustDevice}
                    onChange={(e) => setTrustDevice(e.target.checked)}
                  />
                  <span style={{ fontSize: '14px', color: '#666' }}>
                    Trust this device for {deviceTrustDays} days
                  </span>
                </label>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%' }}
              disabled={loading}
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </form>

          <div className="mt-3 text-center">
            <button
              type="button"
              className="btn btn-link"
              onClick={() => {
                setMfaRequired(false);
                setMfaCode('');
                setTrustDevice(false);
              }}
            >
              ← Back to login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Regular login form
  return (
    <div className="container">
      <div className="card" style={{ maxWidth: '500px', margin: '0 auto' }}>
        <h1 className="text-center">Login</h1>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-3">
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-3 text-center">
          <p>
            <a href="/forgot-password">Forgot your password?</a>
          </p>
          <p>
            Don't have an account? <a href="/register">Register here</a>
          </p>
        </div>

        <div className="mt-4">
          <div className="text-center mb-3">
            <span style={{ color: '#666' }}>Or continue with</span>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-outline-secondary"
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              onClick={handleGoogleLogin}
            >
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
                <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707 0-.593.102-1.17.282-1.709V4.958H.957C.347 6.173 0 7.548 0 9c0 1.452.348 2.827.957 4.042l3.007-2.335z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
              </svg>
              Google
            </button>

            <button
              type="button"
              className="btn btn-outline-secondary"
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              onClick={handleGitHubLogin}
            >
              <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
              </svg>
              GitHub
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
