/**
 * MFA Settings Page
 * Main UI for managing Multi-Factor Authentication settings
 */

import React, { useState } from 'react';
import useMFA from '../hooks/useMFA';
import BackupCodesDisplay from '../components/BackupCodesDisplay';
import MFASetupWizard from '../components/MFASetupWizard';

const MFASettingsPage = () => {
  const {
    mfaEnabled,
    backupCodesRemaining,
    loading,
    error,
    refreshStatus,
    disableMFA,
    regenerateBackupCodes,
  } = useMFA();

  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [backupCodes, setBackupCodes] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [showSetupWizard, setShowSetupWizard] = useState(false);

  // Disable MFA inline form state
  const [showDisableForm, setShowDisableForm] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmStep, setConfirmStep] = useState(false);


  /**
   * Handle Enable MFA - Opens the MFA Setup Wizard
   */
  const handleEnableMFA = () => {
    setShowSetupWizard(true);
  };

  /**
   * Handle MFA Setup Wizard Completion
   */
  const handleWizardComplete = async () => {
    setShowSetupWizard(false);
    await refreshStatus(); // Refresh MFA status after setup
    setActionSuccess('Two-Factor Authentication enabled successfully!');
    setTimeout(() => setActionSuccess(''), 5000);
  };

  /**
   * Handle MFA Setup Wizard Close
   */
  const handleWizardClose = () => {
    setShowSetupWizard(false);
  };

  /**
   * Toggle disable form visibility
   */
  const handleToggleDisableForm = () => {
    setShowDisableForm(!showDisableForm);
    setDisablePassword('');
    setShowPassword(false);
    setConfirmStep(false);
    setActionError('');
  };

  /**
   * Handle password submit - move to confirm step
   */
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (!disablePassword) {
      setActionError('Please enter your password');
      return;
    }
    setActionError('');
    setConfirmStep(true);
  };

  /**
   * Handle final confirmation - disable MFA
   */
  const handleConfirmDisable = async () => {
    setActionLoading(true);
    setActionError('');
    setActionSuccess('');

    const result = await disableMFA(disablePassword);

    if (result.success) {
      setActionSuccess('MFA has been disabled successfully');
      setShowDisableForm(false);
      setDisablePassword('');
      setConfirmStep(false);
      setTimeout(() => setActionSuccess(''), 3000);
    } else {
      setActionError(result.error);
      setConfirmStep(false);
    }

    setActionLoading(false);
  };

  /**
   * Cancel and reset disable form
   */
  const handleCancelDisable = () => {
    setShowDisableForm(false);
    setDisablePassword('');
    setShowPassword(false);
    setConfirmStep(false);
    setActionError('');
  };

  /**
   * Handle View Backup Codes
   * TODO: In production, may want to require password verification
   */
  const handleViewBackupCodes = async () => {
    alert('For security, backup codes are only shown once during setup.\\nUse "Regenerate Backup Codes" to get new codes.');
  };


  /**
   * Handle Regenerate Backup Codes
   */
  const handleRegenerateBackupCodes = async () => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm('This will invalidate your old backup codes. Continue?')) {
      return;
    }

    setActionLoading(true);
    setActionError('');
    setActionSuccess('');

    const password = prompt('Enter your password to regenerate backup codes:');
    if (!password) return;

    const result = await regenerateBackupCodes(password);

    if (result.success) {
      setBackupCodes(result.data.backupCodes);
      setShowBackupCodes(true);
      setActionSuccess('New backup codes generated');
    } else {
      setActionError(result.error);
    }

    setActionLoading(false);
  };

  /**
   * Close backup codes modal
   */
  const handleCloseBackupCodes = () => {
    setShowBackupCodes(false);
    setBackupCodes([]);
  };

  if (loading) {
    return (
      <div className="mfa-settings-page">
        <div className="container">
          <div className="loading">Loading MFA settings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mfa-settings-page">
      <div className="container">
        <div className="page-header">
          <h1>🔐 Two-Factor Authentication (2FA)</h1>
          <p className="subtitle">
            Add an extra layer of security to your account
          </p>
        </div>

        {error && (
          <div className="alert alert-error">
            <strong>Error:</strong> {error}
          </div>
        )}

        {actionError && (
          <div className="alert alert-error">
            {actionError}
          </div>
        )}

        {actionSuccess && (
          <div className="alert alert-success">
            {actionSuccess}
          </div>
        )}

        <div className="settings-card">
          <div className="card-header">
            <div className="status-section">
              <h2>Status</h2>
              <div className={`status-badge ${mfaEnabled ? 'enabled' : 'disabled'}`}>
                {mfaEnabled ? (
                  <>
                    <span className="status-icon">✓</span>
                    <span>Enabled</span>
                  </>
                ) : (
                  <>
                    <span className="status-icon">○</span>
                    <span>Disabled</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="card-body">
            {!mfaEnabled ? (
              <>
                <div className="info-box">
                  <h3>Why enable 2FA?</h3>
                  <ul>
                    <li>Protect your account from unauthorized access</li>
                    <li>Required even if your password is compromised</li>
                    <li>Use any authenticator app (Google Authenticator, Authy, etc.)</li>
                    <li>Get backup codes for account recovery</li>
                  </ul>
                </div>

                <button
                  className="btn btn-primary btn-large"
                  onClick={handleEnableMFA}
                  disabled={actionLoading}
                >
                  🔒 Enable Two-Factor Authentication
                </button>
              </>
            ) : (
              <>
                <div className="info-box success">
                  <h3>✓ Your account is protected with 2FA</h3>
                  <p>
                    You'll need to enter a code from your authenticator app each time you log in.
                  </p>
                  {backupCodesRemaining > 0 && (
                    <p className="backup-codes-info">
                      <strong>{backupCodesRemaining}</strong> backup code{backupCodesRemaining !== 1 ? 's' : ''} remaining
                    </p>
                  )}
                  {backupCodesRemaining === 0 && (
                    <p className="backup-codes-warning">
                      ⚠️ You have no backup codes remaining. Regenerate them now.
                    </p>
                  )}
                </div>

                <div className="action-buttons">
                  <button
                    className="btn btn-secondary"
                    onClick={handleViewBackupCodes}
                    disabled={actionLoading}
                  >
                    👁️ View Backup Codes
                  </button>

                  <button
                    className="btn btn-secondary"
                    onClick={handleRegenerateBackupCodes}
                    disabled={actionLoading}
                  >
                    🔄 Regenerate Backup Codes
                  </button>

                  <button
                    className="btn btn-danger"
                    onClick={handleToggleDisableForm}
                    disabled={actionLoading || showDisableForm}
                  >
                    🔓 Disable 2FA
                  </button>
                </div>

                {/* Inline Disable Form */}
                {showDisableForm && (
                  <div className="disable-form-container">
                    {!confirmStep ? (
                      <form onSubmit={handlePasswordSubmit} className="disable-form">
                        <h4>Enter your password to disable 2FA</h4>
                        <div className="password-input-wrapper">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={disablePassword}
                            onChange={(e) => setDisablePassword(e.target.value)}
                            placeholder="Enter your password"
                            className="password-input"
                            autoFocus
                            disabled={actionLoading}
                          />
                          <button
                            type="button"
                            className="eye-toggle"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                          >
                            {showPassword ? (
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                                <line x1="1" y1="1" x2="23" y2="23"/>
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                <circle cx="12" cy="12" r="3"/>
                              </svg>
                            )}
                          </button>
                        </div>
                        <div className="form-buttons">
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={handleCancelDisable}
                            disabled={actionLoading}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={actionLoading || !disablePassword}
                          >
                            Continue
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="confirm-step">
                        <div className="warning-box">
                          <h4>Are you sure you want to disable 2FA?</h4>
                          <p>This will remove the extra layer of security from your account. You will only need your password to log in.</p>
                        </div>
                        <div className="form-buttons">
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => setConfirmStep(false)}
                            disabled={actionLoading}
                          >
                            Go Back
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger"
                            onClick={handleConfirmDisable}
                            disabled={actionLoading}
                          >
                            {actionLoading ? 'Disabling...' : 'Yes, Disable 2FA'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="help-section">
          <h3>Need Help?</h3>
          <details>
            <summary>What is Two-Factor Authentication?</summary>
            <p>
              Two-factor authentication (2FA) adds an extra layer of security to your account.
              In addition to your password, you'll need to enter a 6-digit code from an
              authenticator app on your phone.
            </p>
          </details>

          <details>
            <summary>Which authenticator apps can I use?</summary>
            <p>
              You can use any TOTP-compatible authenticator app, including:
            </p>
            <ul>
              <li>Google Authenticator (iOS, Android)</li>
              <li>Authy (iOS, Android, Desktop)</li>
              <li>Microsoft Authenticator (iOS, Android)</li>
              <li>1Password (if you use their password manager)</li>
            </ul>
          </details>

          <details>
            <summary>What are backup codes?</summary>
            <p>
              Backup codes are one-time use codes that let you access your account if you lose
              access to your authenticator app. Save them in a secure location!
            </p>
          </details>

          <details>
            <summary>What if I lose my phone?</summary>
            <p>
              If you lose access to your authenticator app, you can use one of your backup codes
              to log in. If you don't have backup codes, you'll need to contact support.
            </p>
          </details>
        </div>
      </div>

      {showBackupCodes && backupCodes.length > 0 && (
        <BackupCodesDisplay
          codes={backupCodes}
          onClose={handleCloseBackupCodes}
          onRegenerate={handleRegenerateBackupCodes}
        />
      )}

      {showSetupWizard && (
        <MFASetupWizard
          isOpen={showSetupWizard}
          onClose={handleWizardClose}
          onComplete={handleWizardComplete}
        />
      )}

      <style jsx>{`
        .mfa-settings-page {
          min-height: 100vh;
          background-color: #f9fafb;
          padding: 40px 20px;
        }

        .container {
          max-width: 800px;
          margin: 0 auto;
        }

        .page-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .page-header h1 {
          font-size: 32px;
          color: #111827;
          margin-bottom: 8px;
        }

        .subtitle {
          color: #6b7280;
          font-size: 16px;
        }

        .loading {
          text-align: center;
          padding: 60px 20px;
          color: #6b7280;
          font-size: 18px;
        }

        .alert {
          padding: 16px;
          border-radius: 6px;
          margin-bottom: 24px;
        }

        .alert-error {
          background-color: #fee2e2;
          border: 1px solid #fca5a5;
          color: #991b1b;
        }

        .alert-success {
          background-color: #d1fae5;
          border: 1px solid #6ee7b7;
          color: #065f46;
        }

        .settings-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          margin-bottom: 32px;
          overflow: hidden;
        }

        .card-header {
          padding: 24px;
          border-bottom: 1px solid #e5e7eb;
        }

        .status-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .status-section h2 {
          margin: 0;
          font-size: 20px;
          color: #111827;
        }

        .status-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 14px;
        }

        .status-badge.enabled {
          background-color: #d1fae5;
          color: #065f46;
        }

        .status-badge.disabled {
          background-color: #f3f4f6;
          color: #6b7280;
        }

        .status-icon {
          font-size: 16px;
        }

        .card-body {
          padding: 24px;
        }

        .info-box {
          background-color: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 24px;
        }

        .info-box.success {
          background-color: #ecfdf5;
          border-color: #6ee7b7;
        }

        .info-box h3 {
          margin: 0 0 12px 0;
          font-size: 18px;
          color: #111827;
        }

        .info-box p {
          margin: 8px 0;
          color: #374151;
          line-height: 1.6;
        }

        .info-box ul {
          margin: 12px 0;
          padding-left: 24px;
        }

        .info-box li {
          margin: 8px 0;
          color: #374151;
          line-height: 1.6;
        }

        .backup-codes-info {
          font-weight: 600;
          color: #059669;
        }

        .backup-codes-warning {
          color: #d97706;
          font-weight: 600;
        }

        .btn {
          padding: 12px 24px;
          border: none;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-large {
          width: 100%;
          padding: 16px 24px;
          font-size: 18px;
        }

        .btn-primary {
          background-color: #3b82f6;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background-color: #2563eb;
        }

        .btn-secondary {
          background-color: #f3f4f6;
          color: #374151;
        }

        .btn-secondary:hover:not(:disabled) {
          background-color: #e5e7eb;
        }

        .btn-danger {
          background-color: #ef4444;
          color: white;
        }

        .btn-danger:hover:not(:disabled) {
          background-color: #dc2626;
        }

        .action-buttons {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
        }

        .disable-form-container {
          margin-top: 24px;
          padding: 24px;
          background-color: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
        }

        .disable-form h4,
        .confirm-step h4 {
          margin: 0 0 16px 0;
          font-size: 16px;
          color: #991b1b;
        }

        .password-input-wrapper {
          position: relative;
          margin-bottom: 16px;
        }

        .password-input {
          width: 100%;
          padding: 12px 48px 12px 16px;
          font-size: 16px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          background-color: white;
          box-sizing: border-box;
        }

        .password-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .eye-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          color: #6b7280;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .eye-toggle:hover {
          color: #374151;
        }

        .form-buttons {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .warning-box {
          background-color: #fffbeb;
          border: 1px solid #fcd34d;
          border-radius: 6px;
          padding: 16px;
          margin-bottom: 16px;
        }

        .warning-box h4 {
          color: #92400e;
          margin: 0 0 8px 0;
        }

        .warning-box p {
          color: #78350f;
          margin: 0;
          line-height: 1.5;
        }

        .help-section {
          background: white;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          padding: 24px;
        }

        .help-section h3 {
          margin: 0 0 16px 0;
          font-size: 20px;
          color: #111827;
        }

        details {
          margin-bottom: 16px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 16px;
        }

        summary {
          cursor: pointer;
          font-weight: 600;
          color: #111827;
          user-select: none;
        }

        summary:hover {
          color: #3b82f6;
        }

        details[open] summary {
          margin-bottom: 12px;
        }

        details p {
          margin: 8px 0;
          color: #374151;
          line-height: 1.6;
        }

        details ul {
          margin: 8px 0;
          padding-left: 24px;
        }

        details li {
          margin: 4px 0;
          color: #374151;
        }
      `}</style>
    </div>
  );
};

export default MFASettingsPage;

