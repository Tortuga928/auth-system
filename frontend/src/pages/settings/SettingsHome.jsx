/**
 * Settings Home Page
 *
 * Landing page for system settings with important warnings
 * and links to external documentation.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SettingsLayout from '../../components/settings/SettingsLayout';
import apiService from '../../services/api';

const SettingsHome = () => {
  const [emailSettings, setEmailSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEmailSettings();
  }, []);

  const fetchEmailSettings = async () => {
    try {
      setLoading(true);
      const response = await apiService.settings.getEmailSettings();
      setEmailSettings(response.data);
    } catch (err) {
      setError('Failed to load settings status');
      console.error('Error fetching email settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    pageTitle: {
      fontSize: '24px',
      fontWeight: '600',
      color: '#2c3e50',
      marginBottom: '8px',
    },
    pageSubtitle: {
      fontSize: '14px',
      color: '#666',
      marginBottom: '30px',
    },
    warningBox: {
      backgroundColor: '#fff3cd',
      border: '1px solid #ffc107',
      borderRadius: '8px',
      padding: '20px 24px',
      marginBottom: '30px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '16px',
    },
    warningIcon: {
      fontSize: '28px',
      marginTop: '2px',
    },
    warningContent: {
      flex: 1,
    },
    warningTitle: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#856404',
      marginBottom: '8px',
    },
    warningText: {
      fontSize: '14px',
      color: '#856404',
      lineHeight: '1.6',
      marginBottom: '12px',
    },
    warningList: {
      margin: '0',
      paddingLeft: '20px',
      color: '#856404',
      fontSize: '14px',
      lineHeight: '1.8',
    },
    statusSection: {
      marginBottom: '30px',
    },
    sectionTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#2c3e50',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    statusCard: {
      backgroundColor: '#fff',
      borderRadius: '8px',
      padding: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    },
    statusRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '12px 0',
      borderBottom: '1px solid #f0f0f0',
    },
    statusRowLast: {
      borderBottom: 'none',
    },
    statusLabel: {
      fontSize: '14px',
      color: '#555',
    },
    statusValue: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    badge: {
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '500',
    },
    badgeEnabled: {
      backgroundColor: '#d4edda',
      color: '#155724',
    },
    badgeDisabled: {
      backgroundColor: '#f8d7da',
      color: '#721c24',
    },
    badgeWarning: {
      backgroundColor: '#fff3cd',
      color: '#856404',
    },
    quickActions: {
      marginTop: '30px',
    },
    actionCards: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '20px',
    },
    actionCard: {
      backgroundColor: '#fff',
      borderRadius: '8px',
      padding: '24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      textDecoration: 'none',
      color: 'inherit',
      transition: 'all 0.2s ease',
      border: '2px solid transparent',
    },
    actionCardIcon: {
      fontSize: '32px',
      marginBottom: '12px',
    },
    actionCardTitle: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#2c3e50',
      marginBottom: '8px',
    },
    actionCardDescription: {
      fontSize: '13px',
      color: '#666',
      lineHeight: '1.5',
    },
    docsSection: {
      marginTop: '40px',
      padding: '20px',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
    },
    docsTitle: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#2c3e50',
      marginBottom: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    docsList: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '16px',
    },
    docsLink: {
      fontSize: '13px',
      color: '#6c5ce7',
      textDecoration: 'none',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    },
    loadingState: {
      textAlign: 'center',
      padding: '40px',
      color: '#666',
    },
    errorState: {
      textAlign: 'center',
      padding: '40px',
      color: '#dc3545',
    },
  };

  const getStatusBadge = (isEnabled) => (
    <span style={{
      ...styles.badge,
      ...(isEnabled ? styles.badgeEnabled : styles.badgeDisabled)
    }}>
      {isEnabled ? 'Enabled' : 'Disabled'}
    </span>
  );

  return (
    <SettingsLayout title="Settings Home">
      <div>
        <h2 style={styles.pageTitle}>System Settings</h2>
        <p style={styles.pageSubtitle}>
          Configure system-wide settings for email services and verification policies.
        </p>

        {/* Warning Box */}
        <div style={styles.warningBox}>
          <span style={styles.warningIcon}>⚠️</span>
          <div style={styles.warningContent}>
            <div style={styles.warningTitle}>Important: Production Configuration</div>
            <p style={styles.warningText}>
              Changes made here affect the entire system. Before modifying any settings, please ensure you understand the implications:
            </p>
            <ul style={styles.warningList}>
              <li>Enabling email verification enforcement will require all users to verify their email addresses</li>
              <li>Setting a grace period of 0 days will immediately block unverified users from logging in</li>
              <li>Email service changes take effect immediately - ensure your provider credentials are correct before activation</li>
              <li>Test your email configuration thoroughly before enabling verification requirements</li>
            </ul>
          </div>
        </div>

        {/* Current Status */}
        <div style={styles.statusSection}>
          <h3 style={styles.sectionTitle}>
            <span>📊</span>
            Current Status
          </h3>

          {loading ? (
            <div style={styles.loadingState}>Loading settings status...</div>
          ) : error ? (
            <div style={styles.errorState}>{error}</div>
          ) : (
            <div style={styles.statusCard}>
              <div style={styles.statusRow}>
                <span style={styles.statusLabel}>Email Verification</span>
                <span style={styles.statusValue}>
                  {getStatusBadge(emailSettings?.enabled)}
                </span>
              </div>
              <div style={styles.statusRow}>
                <span style={styles.statusLabel}>Verification Enforcement</span>
                <span style={styles.statusValue}>
                  {getStatusBadge(emailSettings?.enforced)}
                </span>
              </div>
              <div style={styles.statusRow}>
                <span style={styles.statusLabel}>Grace Period</span>
                <span style={styles.statusValue}>
                  <span style={{ ...styles.badge, ...styles.badgeWarning }}>
                    {emailSettings?.gracePeriodDays ?? 0} days
                  </span>
                </span>
              </div>
              <div style={{ ...styles.statusRow, ...styles.statusRowLast }}>
                <span style={styles.statusLabel}>Active Email Service</span>
                <span style={styles.statusValue}>
                  {emailSettings?.activeEmailServiceId ? (
                    <span style={{ ...styles.badge, ...styles.badgeEnabled }}>Configured</span>
                  ) : (
                    <span style={{ ...styles.badge, ...styles.badgeDisabled }}>Not Configured</span>
                  )}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div style={styles.quickActions}>
          <h3 style={styles.sectionTitle}>
            <span>🚀</span>
            Quick Actions
          </h3>

          <div style={styles.actionCards}>
            <Link
              to="/settings/email"
              style={styles.actionCard}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#6c5ce7';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'transparent';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={styles.actionCardIcon}>📧</div>
              <div style={styles.actionCardTitle}>Configure Email Service</div>
              <div style={styles.actionCardDescription}>
                Set up email providers (SendGrid, Amazon SES, or SMTP), configure verification settings, and test your email delivery.
              </div>
            </Link>

            <Link
              to="/admin/audit-logs"
              style={styles.actionCard}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#6c5ce7';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'transparent';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={styles.actionCardIcon}>📋</div>
              <div style={styles.actionCardTitle}>View Audit Logs</div>
              <div style={styles.actionCardDescription}>
                Review the history of all settings changes, including who made them and when. Track configuration modifications.
              </div>
            </Link>
          </div>
        </div>

        {/* Documentation Links */}
        <div style={styles.docsSection}>
          <div style={styles.docsTitle}>
            <span>📚</span>
            Documentation & Resources
          </div>
          <div style={styles.docsList}>
            <a
              href="https://docs.sendgrid.com/for-developers/sending-email/api-getting-started"
              target="_blank"
              rel="noopener noreferrer"
              style={styles.docsLink}
            >
              <span>🔗</span>
              SendGrid API Guide
            </a>
            <a
              href="https://docs.aws.amazon.com/ses/latest/dg/send-email.html"
              target="_blank"
              rel="noopener noreferrer"
              style={styles.docsLink}
            >
              <span>🔗</span>
              Amazon SES Documentation
            </a>
            <a
              href="https://support.google.com/accounts/answer/185833"
              target="_blank"
              rel="noopener noreferrer"
              style={styles.docsLink}
            >
              <span>🔗</span>
              Gmail App Passwords
            </a>
            <a
              href="https://support.microsoft.com/en-us/office/pop-imap-and-smtp-settings-8361e398-8af4-4e97-b147-6c6c4ac95353"
              target="_blank"
              rel="noopener noreferrer"
              style={styles.docsLink}
            >
              <span>🔗</span>
              Outlook SMTP Settings
            </a>
          </div>
        </div>
      </div>
    </SettingsLayout>
  );
};

export default SettingsHome;
