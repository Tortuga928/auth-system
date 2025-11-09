/**
 * MFA Settings Page
 * Main UI for managing Multi-Factor Authentication settings
 */

import React, { useState } from 'react';
import useMFA from '../hooks/useMFA';
import BackupCodesDisplay from '../components/BackupCodesDisplay';

const MFASettingsPage = () => {
  console.log('📄 [MFASettingsPage] Component rendering...');

  const {
    mfaEnabled,
    backupCodesRemaining,
    loading,
    error,
    refreshStatus,
    disableMFA,
    regenerateBackupCodes,
  } = useMFA();

  console.log('📄 [MFASettingsPage] Hook returned values:', {
    mfaEnabled,
    backupCodesRemaining,
    loading,
    error
  });

  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [backupCodes, setBackupCodes] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  /**
   * Handle Enable MFA
   * TODO: Replace with MFASetupWizard modal in Checkpoint 2
   */
  const handleEnableMFA = () => {
    alert('MFA Setup Wizard will be implemented in Checkpoint 2');
    // Will open MFASetupWizard modal
  };

  /**
   * Handle Disable MFA
   * TODO: Replace with MFADisableConfirmation modal in Checkpoint 2
   */
  const handleDisableMFA = async () => {
    const password = prompt('Enter your password to disable MFA:');
    if (!password) return;

    setActionLoading(true);
    setActionError('');
    setActionSuccess('');

    const result = await disableMFA(password);

    if (result.success) {
      setActionSuccess('MFA has been disabled successfully');
      setTimeout(() => setActionSuccess(''), 3000);
    } else {
      setActionError(result.error);
    }

    setActionLoading(false);
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
    console.log('📄 [MFASettingsPage] Rendering loading state...');
    return (
      <div className="mfa-settings-page">
        <div className="container">
          <div className="loading">Loading MFA settings...</div>
        </div>
      </div>
    );
  }

  console.log('📄 [MFASettingsPage] Rendering main UI...');

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
                    onClick={handleDisableMFA}
                    disabled={actionLoading}
                  >
                    🔓 Disable 2FA
                  </button>
                </div>
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
