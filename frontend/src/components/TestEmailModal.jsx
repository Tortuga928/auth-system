/**
 * Test Email Modal Component
 *
 * A reusable modal for sending and displaying the result of test emails.
 * Used by both regular users (from Dashboard) and admins (from UsersManagement).
 *
 * Props:
 * - isOpen: boolean - Whether the modal is visible
 * - onClose: function - Called when the modal should close
 * - isAdmin: boolean - If true, shows Message ID in success state
 * - targetUser: object - For admin mode: { id, email, username } of the target user
 * - sendTestEmail: function - Async function that sends the test email
 */

import React, { useState, useEffect } from 'react';

const TestEmailModal = ({ isOpen, onClose, isAdmin = false, targetUser = null, sendTestEmail }) => {
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      // Reset state and send email when modal opens
      setStatus('loading');
      setResult(null);
      setError(null);
      handleSendEmail();
    }
  }, [isOpen]);

  const handleSendEmail = async () => {
    try {
      const response = await sendTestEmail();
      setResult(response);
      setStatus('success');
    } catch (err) {
      console.error('Test email error:', err);
      setError(err.response?.data || { message: 'An unexpected error occurred. Please try again.' });
      setStatus('error');
    }
  };

  if (!isOpen) return null;

  const styles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
    },
    modal: {
      backgroundColor: '#fff',
      borderRadius: '8px',
      padding: '30px',
      width: '450px',
      maxWidth: '90%',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '20px',
    },
    icon: {
      fontSize: '28px',
    },
    title: {
      margin: 0,
      fontSize: '20px',
      color: '#2c3e50',
    },
    content: {
      marginBottom: '25px',
    },
    loadingContainer: {
      textAlign: 'center',
      padding: '20px',
    },
    spinner: {
      width: '40px',
      height: '40px',
      border: '4px solid #f3f3f3',
      borderTop: '4px solid #3498db',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      margin: '0 auto 15px',
    },
    loadingText: {
      color: '#666',
      fontSize: '16px',
    },
    successIcon: {
      color: '#27ae60',
      fontSize: '48px',
      display: 'block',
      textAlign: 'center',
      marginBottom: '15px',
    },
    errorIcon: {
      color: '#e74c3c',
      fontSize: '48px',
      display: 'block',
      textAlign: 'center',
      marginBottom: '15px',
    },
    message: {
      textAlign: 'center',
      fontSize: '16px',
      color: '#2c3e50',
      marginBottom: '20px',
    },
    detailsBox: {
      backgroundColor: '#f8f9fa',
      borderRadius: '4px',
      padding: '15px',
      marginTop: '15px',
    },
    detailRow: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '8px 0',
      borderBottom: '1px solid #eee',
    },
    detailRowLast: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '8px 0',
    },
    detailLabel: {
      color: '#666',
      fontSize: '14px',
    },
    detailValue: {
      color: '#2c3e50',
      fontSize: '14px',
      fontWeight: '500',
      wordBreak: 'break-all',
    },
    errorMessage: {
      textAlign: 'center',
      color: '#e74c3c',
      fontSize: '16px',
      marginBottom: '15px',
    },
    technicalDetails: {
      backgroundColor: '#f8f9fa',
      borderRadius: '4px',
      padding: '15px',
      marginTop: '15px',
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#666',
      wordBreak: 'break-all',
    },
    deliveryNote: {
      textAlign: 'center',
      fontSize: '13px',
      color: '#666',
      marginTop: '10px',
      fontStyle: 'italic',
    },
    footer: {
      display: 'flex',
      justifyContent: 'center',
    },
    closeBtn: {
      padding: '12px 30px',
      backgroundColor: '#3498db',
      color: '#fff',
      border: 'none',
      borderRadius: '4px',
      fontSize: '16px',
      cursor: 'pointer',
      fontWeight: '500',
    },
    closeBtnHover: {
      backgroundColor: '#2980b9',
    },
  };

  // CSS keyframes for spinner animation
  const spinnerKeyframes = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString();
  };

  return (
    <>
      <style>{spinnerKeyframes}</style>
      <div style={styles.overlay} onClick={(e) => e.target === e.currentTarget && status !== 'loading' && onClose()}>
        <div style={styles.modal}>
          {/* Header */}
          <div style={styles.header}>
            <span style={styles.icon}>
              {status === 'loading' ? '📧' : status === 'success' ? '✉️' : '⚠️'}
            </span>
            <h2 style={styles.title}>
              {isAdmin && targetUser
                ? `Test Email for ${targetUser.username || targetUser.email}`
                : 'Send Test Email'}
            </h2>
          </div>

          {/* Content */}
          <div style={styles.content}>
            {/* Loading State */}
            {status === 'loading' && (
              <div style={styles.loadingContainer}>
                <div style={styles.spinner}></div>
                <p style={styles.loadingText}>Sending test email...</p>
              </div>
            )}

            {/* Success State */}
            {status === 'success' && result && (
              <>
                <div style={styles.successIcon}>✅</div>
                <p style={styles.message}>Test email sent successfully!</p>
                <div style={styles.detailsBox}>
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Recipient:</span>
                    <span style={styles.detailValue}>{result.email}</span>
                  </div>
                  <div style={isAdmin && result.messageId ? styles.detailRow : styles.detailRowLast}>
                    <span style={styles.detailLabel}>Sent At:</span>
                    <span style={styles.detailValue}>{formatTimestamp(result.timestamp)}</span>
                  </div>
                  {isAdmin && result.messageId && (
                    <div style={styles.detailRowLast}>
                      <span style={styles.detailLabel}>Message ID:</span>
                      <span style={styles.detailValue}>{result.messageId}</span>
                    </div>
                  )}
                </div>
                <p style={styles.deliveryNote}>
                  Please check your inbox (and spam folder) for the test email.
                </p>
              </>
            )}

            {/* Error State */}
            {status === 'error' && (
              <>
                <div style={styles.errorIcon}>❌</div>
                <p style={styles.errorMessage}>
                  {error?.message || 'Failed to send test email. Please try again.'}
                </p>
                {isAdmin && error?.details && (
                  <div style={styles.technicalDetails}>
                    <strong>Technical Details:</strong>
                    <br />
                    {error.details.code && <span>Code: {error.details.code}<br /></span>}
                    {error.details.command && <span>Command: {error.details.command}<br /></span>}
                    {error.details.response && <span>Response: {error.details.response}</span>}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer - Only show Close button when not loading */}
          {status !== 'loading' && (
            <div style={styles.footer}>
              <button
                style={styles.closeBtn}
                onClick={onClose}
                onMouseOver={(e) => e.target.style.backgroundColor = '#2980b9'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#3498db'}
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default TestEmailModal;
