/**
 * MFA Required Setup Page
 *
 * This page is shown to users who must set up MFA before accessing the application.
 * Used in MFA enforcement mode for:
 * - New users after email verification
 * - Existing users whose grace period has expired
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';

// Styles
const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    padding: '20px',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
    maxWidth: '600px',
    width: '100%',
    overflow: 'hidden',
  },
  header: {
    backgroundColor: '#007bff',
    color: '#fff',
    padding: '24px',
    textAlign: 'center',
  },
  headerTitle: {
    margin: 0,
    fontSize: '24px',
    fontWeight: '600',
  },
  headerSubtitle: {
    margin: '8px 0 0 0',
    fontSize: '14px',
    opacity: 0.9,
  },
  body: {
    padding: '24px',
  },
  infoBox: {
    backgroundColor: '#e3f2fd',
    borderLeft: '4px solid #2196f3',
    padding: '16px',
    marginBottom: '24px',
    borderRadius: '0 4px 4px 0',
  },
  infoText: {
    margin: 0,
    fontSize: '14px',
    color: '#1565c0',
    lineHeight: '1.5',
  },
  stepContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  step: {
    display: 'flex',
    alignItems: 'flex-start',
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
    fontSize: '14px',
    flexShrink: 0,
  },
  stepCompleted: {
    backgroundColor: '#28a745',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    margin: '0 0 4px 0',
    fontSize: '16px',
    fontWeight: '600',
    color: '#333',
  },
  stepDescription: {
    margin: 0,
    fontSize: '14px',
    color: '#666',
  },
  // QR Code section
  qrContainer: {
    textAlign: 'center',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    marginBottom: '16px',
  },
  qrImage: {
    maxWidth: '200px',
    margin: '0 auto',
  },
  secretCode: {
    fontFamily: 'monospace',
    fontSize: '16px',
    letterSpacing: '2px',
    backgroundColor: '#e9ecef',
    padding: '8px 16px',
    borderRadius: '4px',
    marginTop: '12px',
    display: 'inline-block',
  },
  // Form styles
  formGroup: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '500',
    color: '#333',
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '16px',
    boxSizing: 'border-box',
  },
  button: {
    width: '100%',
    padding: '14px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginBottom: '12px',
  },
  primaryButton: {
    backgroundColor: '#007bff',
    color: '#fff',
  },
  secondaryButton: {
    backgroundColor: '#6c757d',
    color: '#fff',
  },
  disabledButton: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed',
  },
  // Alert styles
  alert: {
    padding: '12px 16px',
    borderRadius: '6px',
    marginBottom: '16px',
    fontSize: '14px',
  },
  alertDanger: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    border: '1px solid #f5c6cb',
  },
  alertSuccess: {
    backgroundColor: '#d4edda',
    color: '#155724',
    border: '1px solid #c3e6cb',
  },
  alertWarning: {
    backgroundColor: '#fff3cd',
    color: '#856404',
    border: '1px solid #ffeeba',
  },
  // Backup codes
  backupCodesContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '8px',
    padding: '16px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    marginBottom: '16px',
  },
  backupCode: {
    fontFamily: 'monospace',
    fontSize: '14px',
    padding: '8px',
    backgroundColor: '#fff',
    border: '1px solid #ddd',
    borderRadius: '4px',
    textAlign: 'center',
  },
  footer: {
    padding: '16px 24px',
    borderTop: '1px solid #e0e0e0',
    backgroundColor: '#f8f9fa',
    textAlign: 'center',
  },
  footerText: {
    margin: 0,
    fontSize: '12px',
    color: '#666',
  },
};

function MFARequiredSetupPage() {
  const navigate = useNavigate();

  // Setup state
  const [currentStep, setCurrentStep] = useState(1); // 1: Start, 2: Scan QR, 3: Verify, 4: Backup Codes, 5: Complete
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // MFA setup data
  const [setupData, setSetupData] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [manualSecret, setManualSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);

  // User data from localStorage
  const [userData, setUserData] = useState(null);
  const [mfaSetupToken, setMfaSetupToken] = useState('');

  // Load setup data on mount
  useEffect(() => {
    const token = localStorage.getItem('mfaSetupToken');
    const dataStr = localStorage.getItem('mfaSetupData');

    if (!token || !dataStr) {
      // No setup token, redirect to login
      navigate('/login');
      return;
    }

    setMfaSetupToken(token);
    try {
      const data = JSON.parse(dataStr);
      setUserData(data);
      setSetupData(data);
    } catch {
      navigate('/login');
    }
  }, [navigate]);

  // Start TOTP setup - get QR code
  const handleStartSetup = async () => {
    setLoading(true);
    setError('');

    try {
      // Use the enforcement status endpoint to check what is needed
      const statusResponse = await apiService.mfa.getEnforcementStatus(mfaSetupToken);
      const status = statusResponse.data.data;

      // Now start the TOTP setup
      const response = await apiService.mfa.setupWithToken(mfaSetupToken);
      const data = response.data.data;

      setQrCodeUrl(data.qrCodeUrl);
      setManualSecret(data.secret);
      setCurrentStep(2);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to start MFA setup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Verify TOTP code
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await apiService.mfa.enableWithToken(mfaSetupToken, verificationCode);
      const data = response.data.data;

      // Store backup codes
      if (data.backupCodes) {
        setBackupCodes(data.backupCodes);
        setCurrentStep(4);
      } else {
        // No backup codes, complete setup
        await handleCompleteSetup();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Invalid verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Complete setup and get tokens
  const handleCompleteSetup = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await apiService.mfa.completeRequiredSetup({
        mfaSetupToken,
        totpToken: verificationCode,
      });

      const data = response.data.data;

      // Store tokens and user data
      localStorage.setItem('authToken', data.tokens.accessToken);
      localStorage.setItem('refreshToken', data.tokens.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Clear setup tokens
      localStorage.removeItem('mfaSetupToken');
      localStorage.removeItem('mfaSetupData');

      setCurrentStep(5);
      setSuccess('MFA setup completed successfully! Redirecting...');

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to complete MFA setup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Download backup codes
  const handleDownloadBackupCodes = () => {
    const content = `MFA Backup Codes\n================\nGenerated: ${new Date().toLocaleString()}\n\n${backupCodes.map((code, i) => `${i + 1}. ${code}`).join('\n')}\n\nIMPORTANT: Store these codes in a safe place.\nEach code can only be used once.`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mfa-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Copy backup codes to clipboard
  const handleCopyBackupCodes = () => {
    const text = backupCodes.join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setSuccess('Backup codes copied to clipboard!');
      setTimeout(() => setSuccess(''), 3000);
    });
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <>
            <div style={styles.infoBox}>
              <p style={styles.infoText}>
                <strong>Security Requirement:</strong> Your organization requires two-factor
                authentication (2FA) to be enabled on your account before you can access the application.
              </p>
            </div>

            <div style={styles.stepContainer}>
              <div style={styles.step}>
                <div style={styles.stepNumber}>1</div>
                <div style={styles.stepContent}>
                  <h4 style={styles.stepTitle}>Install an Authenticator App</h4>
                  <p style={styles.stepDescription}>
                    Download Google Authenticator, Authy, or any compatible TOTP app on your phone.
                  </p>
                </div>
              </div>
              <div style={styles.step}>
                <div style={styles.stepNumber}>2</div>
                <div style={styles.stepContent}>
                  <h4 style={styles.stepTitle}>Scan the QR Code</h4>
                  <p style={styles.stepDescription}>
                    Use your authenticator app to scan the QR code that will be shown in the next step.
                  </p>
                </div>
              </div>
              <div style={styles.step}>
                <div style={styles.stepNumber}>3</div>
                <div style={styles.stepContent}>
                  <h4 style={styles.stepTitle}>Enter Verification Code</h4>
                  <p style={styles.stepDescription}>
                    Enter the 6-digit code from your authenticator app to confirm setup.
                  </p>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '24px' }}>
              <button
                style={{ ...styles.button, ...styles.primaryButton }}
                onClick={handleStartSetup}
                disabled={loading}
              >
                {loading ? 'Starting Setup...' : 'Begin Setup'}
              </button>
            </div>
          </>
        );

      case 2:
        return (
          <>
            <div style={styles.qrContainer}>
              <h4 style={{ margin: '0 0 16px 0' }}>Scan this QR Code</h4>
              {qrCodeUrl ? (
                <img src={qrCodeUrl} alt="QR Code" style={styles.qrImage} />
              ) : (
                <p>Loading QR code...</p>
              )}
              <p style={{ margin: '16px 0 8px 0', fontSize: '14px', color: '#666' }}>
                Cannot scan? Enter this code manually:
              </p>
              <code style={styles.secretCode}>{manualSecret}</code>
            </div>

            <button
              style={{ ...styles.button, ...styles.primaryButton }}
              onClick={() => setCurrentStep(3)}
            >
              Continue to Verification
            </button>
          </>
        );

      case 3:
        return (
          <>
            <div style={styles.infoBox}>
              <p style={styles.infoText}>
                Enter the 6-digit code displayed in your authenticator app to verify the setup.
              </p>
            </div>

            <form onSubmit={handleVerifyCode}>
              <div style={styles.formGroup}>
                <label style={styles.label} htmlFor="verificationCode">
                  Verification Code
                </label>
                <input
                  type="text"
                  id="verificationCode"
                  style={styles.input}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  autoFocus
                  required
                />
              </div>

              <button
                type="submit"
                style={{
                  ...styles.button,
                  ...styles.primaryButton,
                  ...(loading ? styles.disabledButton : {}),
                }}
                disabled={loading || verificationCode.length !== 6}
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>
            </form>

            <button
              style={{ ...styles.button, ...styles.secondaryButton }}
              onClick={() => setCurrentStep(2)}
            >
              ← Back to QR Code
            </button>
          </>
        );

      case 4:
        return (
          <>
            <div style={{ ...styles.alert, ...styles.alertWarning }}>
              <strong>Important:</strong> Save these backup codes in a secure location.
              You can use them to access your account if you lose your authenticator device.
            </div>

            <div style={styles.backupCodesContainer}>
              {backupCodes.map((code, index) => (
                <div key={index} style={styles.backupCode}>{code}</div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <button
                style={{ ...styles.button, ...styles.secondaryButton, flex: 1 }}
                onClick={handleDownloadBackupCodes}
              >
                📥 Download
              </button>
              <button
                style={{ ...styles.button, ...styles.secondaryButton, flex: 1 }}
                onClick={handleCopyBackupCodes}
              >
                📋 Copy
              </button>
            </div>

            <button
              style={{ ...styles.button, ...styles.primaryButton }}
              onClick={handleCompleteSetup}
              disabled={loading}
            >
              {loading ? 'Completing Setup...' : 'I Have Saved My Codes - Complete Setup'}
            </button>
          </>
        );

      case 5:
        return (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
            <h3 style={{ margin: '0 0 8px 0' }}>Setup Complete!</h3>
            <p style={{ color: '#666' }}>Redirecting to your dashboard...</p>
          </div>
        );

      default:
        return null;
    }
  };

  if (!userData) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.body}>
            <p style={{ textAlign: 'center', color: '#666' }}>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.headerTitle}>🔐 MFA Setup Required</h1>
          <p style={styles.headerSubtitle}>
            Welcome, {userData.username || userData.email}
          </p>
        </div>

        <div style={styles.body}>
          {error && (
            <div style={{ ...styles.alert, ...styles.alertDanger }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{ ...styles.alert, ...styles.alertSuccess }}>
              {success}
            </div>
          )}

          {renderStepContent()}
        </div>

        <div style={styles.footer}>
          <p style={styles.footerText}>
            Need help? Contact your system administrator.
          </p>
        </div>
      </div>
    </div>
  );
}

export default MFARequiredSetupPage;
