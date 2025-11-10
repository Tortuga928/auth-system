/**
 * MFA Setup Wizard Component
 * 4-step wizard for enabling Two-Factor Authentication
 *
 * Steps:
 * 1. Introduction - Explain MFA benefits
 * 2. Scan QR Code - Display QR code and manual entry code
 * 3. Verify Setup - User enters TOTP to confirm
 * 4. Save Backup Codes - Display backup codes with download option
 */

import React, { useState } from 'react';
import { QRCodeCanvas as QRCode } from 'qrcode.react';
import { useMFA } from '../hooks/useMFA';

const MFASetupWizard = ({ isOpen, onClose, onComplete }) => {
  const { setupMFA, enableMFA } = useMFA();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 2 data
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [userEmail, setUserEmail] = useState('');

  // Step 3 data
  const [totpCode, setTotpCode] = useState('');

  // Step 4 data
  const [backupCodes, setBackupCodes] = useState([]);
  const [codesAcknowledged, setCodesAcknowledged] = useState(false);

  /**
   * Step 1: Introduction - User clicks "Get Started"
   */
  const handleGetStarted = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await setupMFA();

      if (result.success) {
        setQrCodeUrl(result.data.qrCodeUrl);
        setSecret(result.data.secret);
        setBackupCodes(result.data.backupCodes);
        // Extract email from user context or token
        setUserEmail(localStorage.getItem('userEmail') || 'user@example.com');
        setCurrentStep(2);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to initialize MFA setup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Step 2: QR Code - User proceeds after scanning
   */
  const handleQRScanned = () => {
    setCurrentStep(3);
  };

  /**
   * Step 3: Verify TOTP - User enters code to verify
   */
  const handleVerifyCode = async () => {
    if (totpCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await enableMFA(totpCode);

      if (result.success) {
        setCurrentStep(4);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Verification failed. Please check your code and try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle TOTP input change - auto-submit on 6 digits
   */
  const handleTotpChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Only digits
    setTotpCode(value);

    if (value.length === 6) {
      // Auto-submit after a brief delay to show the 6th digit
      setTimeout(() => {
        handleVerifyCode();
      }, 300);
    }
  };

  /**
   * Step 4: Complete setup
   */
  const handleComplete = () => {
    if (!codesAcknowledged) {
      setError('Please confirm you have saved your backup codes');
      return;
    }

    onComplete();
    handleClose();
  };

  /**
   * Copy all backup codes to clipboard
   */
  const handleCopyAll = async () => {
    const codesText = backupCodes.join('\n');
    try {
      await navigator.clipboard.writeText(codesText);
      // Show success feedback (could add a toast notification)
      setError(''); // Clear any errors
    } catch (err) {
      setError('Failed to copy codes. Please copy them manually.');
    }
  };

  /**
   * Download backup codes as text file
   */
  const handleDownload = () => {
    const text = `Two-Factor Authentication Backup Codes
Generated: ${new Date().toLocaleString()}

IMPORTANT: Save these codes in a secure location.
Each code can only be used once.

${backupCodes.map((code, i) => `${i + 1}. ${code}`).join('\n')}

If you lose access to your authenticator app, you can use
one of these codes to log in to your account.`;

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mfa-backup-codes-${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  /**
   * Close wizard and reset state
   */
  const handleClose = () => {
    setCurrentStep(1);
    setLoading(false);
    setError('');
    setQrCodeUrl('');
    setSecret('');
    setTotpCode('');
    setBackupCodes([]);
    setCodesAcknowledged(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container wizard-modal">
        {/* Header */}
        <div className="modal-header">
          <h2>🔐 Enable Two-Factor Authentication</h2>
          <button className="close-btn" onClick={handleClose} aria-label="Close">
            ×
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="wizard-progress">
          <div className={`step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
            <div className="step-number">{currentStep > 1 ? '✓' : '1'}</div>
            <div className="step-label">Intro</div>
          </div>
          <div className="step-divider"></div>
          <div className={`step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
            <div className="step-number">{currentStep > 2 ? '✓' : '2'}</div>
            <div className="step-label">Scan</div>
          </div>
          <div className="step-divider"></div>
          <div className={`step ${currentStep >= 3 ? 'active' : ''} ${currentStep > 3 ? 'completed' : ''}`}>
            <div className="step-number">{currentStep > 3 ? '✓' : '3'}</div>
            <div className="step-label">Verify</div>
          </div>
          <div className="step-divider"></div>
          <div className={`step ${currentStep >= 4 ? 'active' : ''}`}>
            <div className="step-number">4</div>
            <div className="step-label">Done</div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {/* Step Content */}
        <div className="modal-body">
          {/* Step 1: Introduction */}
          {currentStep === 1 && (
            <div className="wizard-step step-intro">
              <div className="step-icon">🛡️</div>
              <h3>Protect Your Account with 2FA</h3>
              <p className="step-description">
                Two-factor authentication adds an extra layer of security to your account.
                Even if someone knows your password, they won't be able to access your account
                without your phone.
              </p>

              <div className="benefits-list">
                <div className="benefit-item">
                  <span className="benefit-icon">✓</span>
                  <span>Prevent unauthorized access to your account</span>
                </div>
                <div className="benefit-item">
                  <span className="benefit-icon">✓</span>
                  <span>Works with Google Authenticator, Authy, and other apps</span>
                </div>
                <div className="benefit-item">
                  <span className="benefit-icon">✓</span>
                  <span>Backup codes provided for account recovery</span>
                </div>
              </div>

              <button
                className="btn btn-primary btn-large"
                onClick={handleGetStarted}
                disabled={loading}
              >
                {loading ? 'Initializing...' : 'Get Started'}
              </button>
            </div>
          )}

          {/* Step 2: Scan QR Code */}
          {currentStep === 2 && (
            <div className="wizard-step step-qrcode">
              <h3>Scan QR Code</h3>
              <p className="step-description">
                Use your authenticator app to scan this QR code:
              </p>

              <div className="qr-code-container">
                <QRCode
                  value={qrCodeUrl}
                  size={256}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <div className="manual-code-section">
                <p className="text-muted">Can't scan? Enter this code manually:</p>
                <div className="code-display">
                  <code>{secret}</code>
                  <button
                    className="btn-copy-small"
                    onClick={() => navigator.clipboard.writeText(secret)}
                    title="Copy to clipboard"
                  >
                    📋
                  </button>
                </div>
              </div>

              <div className="app-suggestions">
                <p className="text-muted">Recommended apps:</p>
                <div className="app-list">
                  <span>Google Authenticator</span>
                  <span>•</span>
                  <span>Authy</span>
                  <span>•</span>
                  <span>Microsoft Authenticator</span>
                </div>
              </div>

              <div className="step-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => setCurrentStep(1)}
                >
                  ← Back
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleQRScanned}
                >
                  I've Scanned the Code →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Verify TOTP */}
          {currentStep === 3 && (
            <div className="wizard-step step-verify">
              <h3>Verify Your Setup</h3>
              <p className="step-description">
                Enter the 6-digit code from your authenticator app to confirm everything is working:
              </p>

              <div className="totp-input-container">
                <input
                  type="text"
                  className="totp-input"
                  value={totpCode}
                  onChange={handleTotpChange}
                  placeholder="000000"
                  maxLength="6"
                  autoFocus
                  disabled={loading}
                />
              </div>

              <p className="text-muted text-small">
                The code changes every 30 seconds
              </p>

              <div className="step-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setCurrentStep(2);
                    setTotpCode('');
                    setError('');
                  }}
                  disabled={loading}
                >
                  ← Back
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleVerifyCode}
                  disabled={loading || totpCode.length !== 6}
                >
                  {loading ? 'Verifying...' : 'Verify Code'}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Save Backup Codes */}
          {currentStep === 4 && (
            <div className="wizard-step step-backup-codes">
              <div className="success-icon">✓</div>
              <h3>2FA Enabled Successfully!</h3>
              <p className="step-description">
                Save these backup codes in a secure location. You can use them to access
                your account if you lose your phone.
              </p>

              <div className="warning-box">
                <span className="warning-icon">⚠️</span>
                <strong>Important:</strong> Each code can only be used once. You won't see these codes again!
              </div>

              <div className="backup-codes-grid">
                {backupCodes.map((code, index) => (
                  <div key={index} className="backup-code-item">
                    <span className="code-number">{index + 1}.</span>
                    <span className="code-value">{code}</span>
                  </div>
                ))}
              </div>

              <div className="codes-actions">
                <button className="btn btn-secondary" onClick={handleCopyAll}>
                  📋 Copy All
                </button>
                <button className="btn btn-secondary" onClick={handleDownload}>
                  📥 Download
                </button>
              </div>

              <div className="acknowledgment">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={codesAcknowledged}
                    onChange={(e) => setCodesAcknowledged(e.target.checked)}
                  />
                  <span>I have saved my backup codes in a secure location</span>
                </label>
              </div>

              <button
                className="btn btn-primary btn-large"
                onClick={handleComplete}
                disabled={!codesAcknowledged}
              >
                Complete Setup
              </button>
            </div>
          )}
        </div>

        {/* Styles */}
        <style jsx>{`
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 20px;
          }

          .wizard-modal {
            background: white;
            border-radius: 12px;
            max-width: 600px;
            width: 100%;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
          }

          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 24px;
            border-bottom: 1px solid #e5e7eb;
          }

          .modal-header h2 {
            margin: 0;
            font-size: 24px;
            color: #111827;
          }

          .close-btn {
            background: none;
            border: none;
            font-size: 32px;
            color: #9ca3af;
            cursor: pointer;
            line-height: 1;
            padding: 0;
            width: 32px;
            height: 32px;
          }

          .close-btn:hover {
            color: #374151;
          }

          .wizard-progress {
            display: flex;
            align-items: center;
            padding: 24px;
            background-color: #f9fafb;
          }

          .step {
            display: flex;
            flex-direction: column;
            align-items: center;
            flex: 1;
          }

          .step-number {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background-color: #e5e7eb;
            color: #6b7280;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            margin-bottom: 8px;
          }

          .step.active .step-number {
            background-color: #3b82f6;
            color: white;
          }

          .step.completed .step-number {
            background-color: #10b981;
            color: white;
          }

          .step-label {
            font-size: 12px;
            color: #6b7280;
          }

          .step.active .step-label {
            color: #111827;
            font-weight: 600;
          }

          .step-divider {
            height: 2px;
            background-color: #e5e7eb;
            flex: 1;
            margin: 0 8px 24px 8px;
          }

          .modal-body {
            padding: 24px;
          }

          .alert {
            padding: 12px 16px;
            border-radius: 6px;
            margin-bottom: 20px;
          }

          .alert-error {
            background-color: #fee2e2;
            border: 1px solid #fca5a5;
            color: #991b1b;
          }

          .wizard-step {
            text-align: center;
          }

          .step-icon {
            font-size: 64px;
            margin-bottom: 16px;
          }

          .wizard-step h3 {
            margin: 0 0 12px 0;
            font-size: 24px;
            color: #111827;
          }

          .step-description {
            color: #6b7280;
            line-height: 1.6;
            margin-bottom: 24px;
          }

          .benefits-list {
            text-align: left;
            margin: 24px 0;
            max-width: 400px;
            margin-left: auto;
            margin-right: auto;
          }

          .benefit-item {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 12px;
          }

          .benefit-icon {
            color: #10b981;
            font-weight: 700;
            font-size: 18px;
          }

          .qr-code-container {
            display: flex;
            justify-content: center;
            padding: 24px;
            background-color: #f9fafb;
            border-radius: 8px;
            margin-bottom: 24px;
          }

          .manual-code-section {
            margin-bottom: 24px;
          }

          .code-display {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            margin-top: 8px;
          }

          .code-display code {
            font-family: 'Courier New', monospace;
            font-size: 16px;
            background-color: #f3f4f6;
            padding: 8px 16px;
            border-radius: 6px;
            letter-spacing: 2px;
          }

          .btn-copy-small {
            background: none;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            padding: 6px 12px;
            cursor: pointer;
            font-size: 16px;
          }

          .btn-copy-small:hover {
            background-color: #f3f4f6;
          }

          .app-suggestions {
            margin-top: 16px;
          }

          .app-list {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            color: #6b7280;
            font-size: 14px;
            margin-top: 8px;
          }

          .totp-input-container {
            margin: 32px 0;
          }

          .totp-input {
            font-size: 32px;
            font-family: 'Courier New', monospace;
            letter-spacing: 12px;
            text-align: center;
            padding: 16px;
            border: 2px solid #d1d5db;
            border-radius: 8px;
            width: 280px;
            max-width: 100%;
          }

          .totp-input:focus {
            outline: none;
            border-color: #3b82f6;
          }

          .text-muted {
            color: #6b7280;
          }

          .text-small {
            font-size: 14px;
          }

          .success-icon {
            font-size: 64px;
            color: #10b981;
            margin-bottom: 16px;
          }

          .warning-box {
            background-color: #fef3c7;
            border: 1px solid #fbbf24;
            border-radius: 8px;
            padding: 16px;
            margin: 24px 0;
            display: flex;
            align-items: center;
            gap: 12px;
            text-align: left;
          }

          .warning-icon {
            font-size: 24px;
          }

          .backup-codes-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
            margin: 24px 0;
            text-align: left;
          }

          .backup-code-item {
            background-color: #f9fafb;
            padding: 12px;
            border-radius: 6px;
            font-family: 'Courier New', monospace;
            font-size: 14px;
          }

          .code-number {
            color: #6b7280;
            margin-right: 8px;
          }

          .code-value {
            color: #111827;
            font-weight: 600;
          }

          .codes-actions {
            display: flex;
            gap: 12px;
            justify-content: center;
            margin: 24px 0;
          }

          .acknowledgment {
            margin: 24px 0;
          }

          .checkbox-label {
            display: flex;
            align-items: center;
            gap: 12px;
            cursor: pointer;
            justify-content: center;
          }

          .checkbox-label input[type="checkbox"] {
            width: 20px;
            height: 20px;
            cursor: pointer;
          }

          .step-actions {
            display: flex;
            gap: 12px;
            justify-content: center;
            margin-top: 24px;
          }

          .btn {
            padding: 12px 24px;
            border: none;
            border-radius: 6px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
          }

          .btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .btn-large {
            width: 100%;
            padding: 16px;
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
        `}</style>
      </div>
    </div>
  );
};

export default MFASetupWizard;
