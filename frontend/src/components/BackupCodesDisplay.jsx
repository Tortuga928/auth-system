/**
 * BackupCodesDisplay Component
 * Displays backup codes with copy/download functionality
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';

const BackupCodesDisplay = ({ codes, usedCodes = [], onClose, onRegenerate }) => {
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  /**
   * Copy all codes to clipboard
   */
  const handleCopyAll = async () => {
    const text = codes.join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSuccess(true);
      setTimeout(() => setCopiedSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy codes:', err);
      alert('Failed to copy to clipboard. Please copy manually.');
    }
  };

  /**
   * Download codes as text file
   */
  const handleDownload = () => {
    const text = `MFA Backup Codes - Save These Securely
Generated: ${new Date().toLocaleString()}

IMPORTANT: Each code can only be used once.
Save these codes in a secure location.

${codes.join('\n')}

---
Authentication System
`;

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mfa-backup-codes-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  /**
   * Check if a code has been used
   */
  const isCodeUsed = (code) => {
    return usedCodes.includes(code);
  };

  return (
    <div className="backup-codes-modal">
      <div className="modal-overlay" onClick={onClose}></div>
      <div className="modal-content">
        <div className="modal-header">
          <h2>🔑 Backup Codes</h2>
          <button className="close-button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="warning-box">
            <p>
              <strong>⚠️ Important:</strong> Save these backup codes in a secure location.
              Each code can only be used once.
            </p>
          </div>

          <div className="backup-codes-list">
            {codes.map((code, index) => (
              <div
                key={index}
                className={`backup-code-item ${isCodeUsed(code) ? 'used' : ''}`}
              >
                <span className="code-number">{index + 1}.</span>
                <code className="code-value">{code}</code>
                {isCodeUsed(code) && <span className="used-badge">Used</span>}
              </div>
            ))}
          </div>

          <div className="remaining-codes">
            {usedCodes.length > 0 && (
              <p>
                {codes.length - usedCodes.length} of {codes.length} codes remaining
              </p>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <div className="button-group">
            <button className="btn btn-secondary" onClick={handleCopyAll}>
              {copiedSuccess ? '✓ Copied!' : '📋 Copy All'}
            </button>
            <button className="btn btn-secondary" onClick={handleDownload}>
              💾 Download
            </button>
            {onRegenerate && (
              <button className="btn btn-warning" onClick={onRegenerate}>
                🔄 Regenerate Codes
              </button>
            )}
          </div>
          <button className="btn btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>

      <style jsx>{`
        .backup-codes-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
        }

        .modal-content {
          position: relative;
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          max-width: 500px;
          width: 90%;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
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

        .close-button {
          background: none;
          border: none;
          font-size: 32px;
          cursor: pointer;
          color: #6b7280;
          line-height: 1;
          padding: 0;
          width: 32px;
          height: 32px;
        }

        .close-button:hover {
          color: #111827;
        }

        .modal-body {
          padding: 24px;
          overflow-y: auto;
          flex: 1;
        }

        .warning-box {
          background-color: #fef3c7;
          border: 1px solid #fbbf24;
          border-radius: 6px;
          padding: 16px;
          margin-bottom: 24px;
        }

        .warning-box p {
          margin: 0;
          color: #92400e;
          font-size: 14px;
        }

        .backup-codes-list {
          display: grid;
          gap: 12px;
        }

        .backup-code-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background-color: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .backup-code-item.used {
          opacity: 0.5;
          background-color: #f3f4f6;
        }

        .code-number {
          font-weight: 600;
          color: #6b7280;
          min-width: 24px;
        }

        .code-value {
          flex: 1;
          font-family: 'Courier New', monospace;
          font-size: 16px;
          font-weight: 600;
          color: #111827;
          letter-spacing: 2px;
        }

        .used-badge {
          background-color: #ef4444;
          color: white;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        }

        .remaining-codes {
          margin-top: 16px;
          text-align: center;
          color: #6b7280;
          font-size: 14px;
        }

        .modal-footer {
          padding: 24px;
          border-top: 1px solid #e5e7eb;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .button-group {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .btn {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          flex: 1;
          min-width: 120px;
        }

        .btn-primary {
          background-color: #3b82f6;
          color: white;
        }

        .btn-primary:hover {
          background-color: #2563eb;
        }

        .btn-secondary {
          background-color: #f3f4f6;
          color: #374151;
        }

        .btn-secondary:hover {
          background-color: #e5e7eb;
        }

        .btn-warning {
          background-color: #f59e0b;
          color: white;
        }

        .btn-warning:hover {
          background-color: #d97706;
        }
      `}</style>
    </div>
  );
};

BackupCodesDisplay.propTypes = {
  codes: PropTypes.arrayOf(PropTypes.string).isRequired,
  usedCodes: PropTypes.arrayOf(PropTypes.string),
  onClose: PropTypes.func.isRequired,
  onRegenerate: PropTypes.func,
};

export default BackupCodesDisplay;
