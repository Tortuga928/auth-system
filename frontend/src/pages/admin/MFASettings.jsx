/**
 * MFA Settings Page
 *
 * Admin page for configuring Multi-Factor Authentication settings.
 * Phase 5 - Email 2FA Enhancement
 *
 * Sections:
 * 1. Global MFA Mode Configuration
 * 2. Email 2FA Settings (code expiration, rate limits)
 * 3. Device Trust Settings
 * 4. Role-specific MFA Requirements
 * 5. Email Template Management
 */

import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import adminApi from '../../services/adminApi';

// MFA Mode descriptions with detailed impact information
const MFA_MODES = {
  disabled: {
    label: 'Disabled',
    description: 'MFA is completely disabled. Users can only use password authentication.',
    color: '#95a5a6',
    userImpact: [
      'Users will log in with only their password',
      'Any existing MFA setups will remain but will not be required',
      'Reduced security - accounts are more vulnerable to password attacks',
      'Users will NOT be prompted to set up MFA',
    ],
    adminInstructions: `MFA has been disabled for your account.

You can now log in using just your password. No additional verification will be required.

If you previously set up an authenticator app or email verification, those settings have been preserved but are no longer active.

Note: For enhanced security, we recommend re-enabling MFA when possible.`,
  },
  totp_only: {
    label: 'TOTP Only',
    description: 'Only authenticator app (TOTP) is available. Traditional 2FA experience.',
    color: '#3498db',
    userImpact: [
      'Users must set up an authenticator app (Google Authenticator, Authy, Microsoft Authenticator, etc.)',
      'A 6-digit code from the app will be required at each login',
      'Users without MFA set up will be prompted to configure it',
      'Email-based verification will NOT be available',
    ],
    adminInstructions: `Important: Multi-Factor Authentication (MFA) is now required for your account.

Please set up an authenticator app before your next login:

1. Download an authenticator app on your phone:
   - Google Authenticator (iOS/Android)
   - Authy (iOS/Android)
   - Microsoft Authenticator (iOS/Android)

2. Log in to your account and go to Account Settings > Security

3. Click "Set Up Two-Factor Authentication" and scan the QR code with your app

4. Enter the 6-digit code from your app to complete setup

You will need to enter a code from your authenticator app each time you log in.`,
  },
  email_only: {
    label: 'Email Only',
    description: 'Only email verification codes are used. No authenticator app required.',
    color: '#9b59b6',
    userImpact: [
      'Users will receive a verification code via email at each login',
      'No authenticator app installation is required',
      'Users must have access to their registered email address',
      'Codes expire after a few minutes and must be entered promptly',
    ],
    adminInstructions: `Email verification is now required for your account.

Each time you log in, you will:

1. Enter your username and password as usual
2. Receive a verification code at your registered email address
3. Enter the code to complete your login

Please ensure:
- Your registered email address is current and accessible
- Check your spam/junk folder if you do not see the verification email
- Codes expire after a few minutes, so enter them promptly

No app installation is required - just access to your email.`,
  },
  totp_email_required: {
    label: 'Both Required',
    description: 'Users must set up both TOTP and Email 2FA. Maximum security.',
    color: '#e74c3c',
    userImpact: [
      'Users must configure BOTH an authenticator app AND email verification',
      'Maximum security level - two independent verification methods',
      'Login requires entering codes from both methods',
      'If either method fails, users cannot log in without admin assistance',
    ],
    adminInstructions: `Enhanced security is now active for your account.

You are required to set up BOTH authentication methods:

STEP 1: Set Up Authenticator App
1. Download an authenticator app (Google Authenticator, Authy, etc.)
2. Go to Account Settings > Security
3. Scan the QR code and verify with the 6-digit code

STEP 2: Verify Email Address
1. In Account Settings > Security, click "Enable Email Verification"
2. Enter the code sent to your registered email
3. Complete the verification

At each login, you will need to:
- Enter a code from your authenticator app
- Enter a code sent to your email

This provides maximum security for your account.`,
  },
  totp_email_fallback: {
    label: 'TOTP Primary, Email Fallback',
    description: 'TOTP is primary method. Email is available as backup if user loses authenticator.',
    color: '#27ae60',
    userImpact: [
      'Users should set up an authenticator app as their primary method',
      'Email verification is available as a backup option',
      'If users lose access to their authenticator, they can use email codes',
      'Provides good security with a recovery option',
    ],
    adminInstructions: `Multi-Factor Authentication (MFA) is now required for your account.

PRIMARY METHOD: Authenticator App (Recommended)
1. Download an authenticator app (Google Authenticator, Authy, etc.)
2. Go to Account Settings > Security
3. Set up two-factor authentication by scanning the QR code
4. Enter the 6-digit code to complete setup

BACKUP METHOD: Email Verification
If you ever lose access to your authenticator app:
1. On the login screen, click "Use Email Verification Instead"
2. A code will be sent to your registered email
3. Enter the code to log in

We recommend setting up the authenticator app as it's more secure and does not require waiting for emails.`,
  },
};

const MFASettings = () => {
  // State
  const [config, setConfig] = useState(null);
  const [roleConfigs, setRoleConfigs] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');
  
  // MFA Mode confirmation dialog state
  const [showModeConfirm, setShowModeConfirm] = useState(false);
  const [pendingMode, setPendingMode] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // Fetch all MFA configuration data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [configRes, roleRes, templateRes] = await Promise.all([
        adminApi.getMFAConfig(),
        adminApi.getMFARoleConfigs(),
        adminApi.getMFATemplates(),
      ]);

      setConfig(configRes.data.data);
      setRoleConfigs(roleRes.data.data || []);
      // Backend returns { activeTemplate, templates } - extract the templates array
      setTemplates(templateRes.data.data?.templates || []);
    } catch (err) {
      console.error('Failed to load MFA settings:', err);
      setError(err.response?.data?.message || 'Failed to load MFA settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fetch MFA summary data
  const fetchSummary = useCallback(async () => {
    try {
      setSummaryLoading(true);
      const res = await adminApi.getMFASummary();
      setSummary(res.data.data);
    } catch (err) {
      console.error('Failed to load MFA summary:', err);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  // Fetch summary when tab changes to summary
  useEffect(() => {
    if (activeTab === 'summary') {
      fetchSummary();
    }
  }, [activeTab, fetchSummary]);


  // Update global config
  const handleConfigUpdate = async (updates) => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const res = await adminApi.updateMFAConfig(updates);
      setConfig(res.data.data);
      setSuccessMessage('MFA settings updated successfully');

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Failed to update MFA config:', err);
      setError(err.response?.data?.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  // Reset to defaults
  const handleReset = async () => {
    if (!window.confirm('Are you sure you want to reset MFA settings to defaults?')) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const res = await adminApi.resetMFAConfig();
      setConfig(res.data.data);
      setSuccessMessage('MFA settings reset to defaults');

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Failed to reset MFA config:', err);
      setError(err.response?.data?.message || 'Failed to reset settings');
    } finally {
      setSaving(false);
    }
  };

  // Handle MFA mode dropdown change - opens confirmation dialog
  const handleModeSelectChange = (e) => {
    const newMode = e.target.value;
    if (newMode !== config?.mfa_mode) {
      setPendingMode(newMode);
      setShowModeConfirm(true);
      setCopySuccess(false);
    }
  };

  // Confirm MFA mode change
  const handleModeConfirm = async () => {
    if (pendingMode) {
      await handleConfigUpdate({ mfa_mode: pendingMode });
      setShowModeConfirm(false);
      setPendingMode(null);
    }
  };

  // Cancel MFA mode change
  const handleModeCancel = () => {
    setShowModeConfirm(false);
    setPendingMode(null);
    setCopySuccess(false);
  };

  // Copy instructions to clipboard
  const handleCopyInstructions = async () => {
    if (pendingMode && MFA_MODES[pendingMode]?.adminInstructions) {
      try {
        await navigator.clipboard.writeText(MFA_MODES[pendingMode].adminInstructions);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  // Styles
  const styles = {
    tabs: {
      display: 'flex',
      borderBottom: '2px solid #ecf0f1',
      marginBottom: '20px',
    },
    tab: {
      padding: '12px 24px',
      cursor: 'pointer',
      borderTop: 'none',
      borderLeft: 'none',
      borderRight: 'none',
      borderBottom: '2px solid transparent',
      background: 'none',
      fontSize: '14px',
      fontWeight: '500',
      color: '#7f8c8d',
      transition: 'all 0.2s ease',
    },
    tabActive: {
      color: '#3498db',
      borderBottom: '2px solid #3498db',
      marginBottom: '-2px',
    },
    card: {
      backgroundColor: '#fff',
      borderRadius: '8px',
      padding: '20px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      marginBottom: '20px',
    },
    cardTitle: {
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#2c3e50',
      marginBottom: '15px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    formGroup: {
      marginBottom: '20px',
    },
    label: {
      display: 'block',
      marginBottom: '8px',
      fontWeight: '500',
      color: '#2c3e50',
    },
    select: {
      width: '100%',
      padding: '10px 12px',
      borderRadius: '4px',
      border: '1px solid #ddd',
      fontSize: '14px',
      backgroundColor: '#fff',
    },
    input: {
      width: '100%',
      padding: '10px 12px',
      borderRadius: '4px',
      border: '1px solid #ddd',
      fontSize: '14px',
      boxSizing: 'border-box',
    },
    inputSmall: {
      width: '100px',
      padding: '8px 12px',
      borderRadius: '4px',
      border: '1px solid #ddd',
      fontSize: '14px',
      textAlign: 'center',
    },
    checkbox: {
      marginRight: '8px',
      width: '18px',
      height: '18px',
    },
    checkboxLabel: {
      display: 'flex',
      alignItems: 'center',
      cursor: 'pointer',
      marginBottom: '10px',
    },
    helpText: {
      fontSize: '12px',
      color: '#7f8c8d',
      marginTop: '4px',
    },
    modeCard: {
      border: '2px solid #ecf0f1',
      borderRadius: '8px',
      padding: '15px',
      marginBottom: '10px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },
    modeCardActive: {
      borderColor: '#3498db',
      backgroundColor: '#f8f9ff',
    },
    modeLabel: {
      fontWeight: 'bold',
      fontSize: '16px',
      marginBottom: '5px',
    },
    modeDescription: {
      fontSize: '13px',
      color: '#7f8c8d',
    },
    row: {
      display: 'flex',
      gap: '20px',
      flexWrap: 'wrap',
    },
    col: {
      flex: '1',
      minWidth: '250px',
    },
    button: {
      padding: '10px 20px',
      borderRadius: '4px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'background-color 0.2s ease',
    },
    primaryButton: {
      backgroundColor: '#3498db',
      color: '#fff',
    },
    dangerButton: {
      backgroundColor: '#e74c3c',
      color: '#fff',
    },
    secondaryButton: {
      backgroundColor: '#ecf0f1',
      color: '#2c3e50',
    },
    buttonGroup: {
      display: 'flex',
      gap: '10px',
      marginTop: '20px',
    },
    alert: {
      padding: '12px 16px',
      borderRadius: '4px',
      marginBottom: '20px',
      fontSize: '14px',
    },
    alertSuccess: {
      backgroundColor: '#d4edda',
      color: '#155724',
      border: '1px solid #c3e6cb',
    },
    alertError: {
      backgroundColor: '#f8d7da',
      color: '#721c24',
      border: '1px solid #f5c6cb',
    },
    badge: {
      display: 'inline-block',
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: 'bold',
    },
    divider: {
      borderTop: '1px solid #ecf0f1',
      margin: '20px 0',
    },
    // Modal styles
    modalOverlay: {
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
    modalContent: {
      backgroundColor: '#fff',
      borderRadius: '8px',
      padding: '0',
      maxWidth: '600px',
      width: '90%',
      maxHeight: '90vh',
      overflow: 'auto',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
    },
    modalHeader: {
      padding: '20px',
      borderBottom: '1px solid #ecf0f1',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    modalTitle: {
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#2c3e50',
      margin: 0,
    },
    modalBody: {
      padding: '20px',
    },
    modalFooter: {
      padding: '15px 20px',
      borderTop: '1px solid #ecf0f1',
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '10px',
    },
    modeTransition: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '15px',
      marginBottom: '20px',
      padding: '15px',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
    },
    modeBox: {
      padding: '10px 15px',
      borderRadius: '6px',
      textAlign: 'center',
      minWidth: '120px',
    },
    arrow: {
      fontSize: '24px',
      color: '#7f8c8d',
    },
    sectionTitle: {
      fontSize: '14px',
      fontWeight: 'bold',
      color: '#2c3e50',
      marginBottom: '10px',
      marginTop: '15px',
    },
    impactList: {
      margin: '0',
      paddingLeft: '20px',
      color: '#555',
      fontSize: '13px',
      lineHeight: '1.6',
    },
    instructionsBox: {
      backgroundColor: '#f8f9fa',
      border: '1px solid #ecf0f1',
      borderRadius: '6px',
      padding: '15px',
      marginTop: '10px',
      position: 'relative',
    },
    instructionsText: {
      whiteSpace: 'pre-wrap',
      fontSize: '13px',
      color: '#555',
      lineHeight: '1.5',
      margin: 0,
      fontFamily: 'inherit',
    },
    copyButton: {
      position: 'absolute',
      top: '10px',
      right: '10px',
      padding: '6px 12px',
      fontSize: '12px',
      backgroundColor: '#3498db',
      color: '#fff',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
    },
    copyButtonSuccess: {
      backgroundColor: '#27ae60',
    },
    futureFeature: {
      display: 'flex',
      alignItems: 'center',
      padding: '10px 0',
      color: '#7f8c8d',
      fontSize: '13px',
    },
    futureLabel: {
      marginLeft: '8px',
      fontSize: '11px',
      backgroundColor: '#f39c12',
      color: '#fff',
      padding: '2px 6px',
      borderRadius: '3px',
    },
    disabledCheckbox: {
      marginRight: '8px',
      opacity: 0.5,
    },
  };

  if (loading) {
    return (
      <AdminLayout title="MFA Settings">
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <p>Loading MFA settings...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="MFA Settings">
      {/* Success/Error Messages */}
      {successMessage && (
        <div style={{ ...styles.alert, ...styles.alertSuccess }}>
          {successMessage}
        </div>
      )}
      {error && (
        <div style={{ ...styles.alert, ...styles.alertError }}>
          {error}
        </div>
      )}

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          style={{ ...styles.tab, ...(activeTab === 'summary' ? styles.tabActive : {}) }}
          onClick={() => setActiveTab('summary')}
        >
          MFA Summary
        </button>
        <button
          style={{ ...styles.tab, ...(activeTab === 'general' ? styles.tabActive : {}) }}
          onClick={() => setActiveTab('general')}
        >
          MFA Mode
        </button>
        <button
          style={{ ...styles.tab, ...(activeTab === 'email' ? styles.tabActive : {}) }}
          onClick={() => setActiveTab('email')}
        >
          Email 2FA
        </button>
        <button
          style={{ ...styles.tab, ...(activeTab === 'devices' ? styles.tabActive : {}) }}
          onClick={() => setActiveTab('devices')}
        >
          Device Trust
        </button>
        <button
          style={{ ...styles.tab, ...(activeTab === 'roles' ? styles.tabActive : {}) }}
          onClick={() => setActiveTab('roles')}
        >
          Role Settings
        </button>
        <button
          style={{ ...styles.tab, ...(activeTab === 'templates' ? styles.tabActive : {}) }}
          onClick={() => setActiveTab('templates')}
        >
          Email Templates
        </button>
      </div>


      {/* MFA Summary Tab */}
      {activeTab === 'summary' && (
        <>
          {summaryLoading ? (
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <p>Loading MFA summary...</p>
            </div>
          ) : summary ? (
            <>
              {/* Refresh Button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px' }}>
                <button
                  style={{ ...styles.button, ...styles.secondaryButton }}
                  onClick={fetchSummary}
                  disabled={summaryLoading}
                >
                  Refresh
                </button>
              </div>

              {/* Current Settings Section */}
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>
                  <span>Settings Overview</span>
                  <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#7f8c8d' }}>
                    <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('general'); }} style={{ color: '#3498db', textDecoration: 'none' }}>Edit</a>
                  </span>
                </h3>

                <div style={styles.divider} />

                {/* MFA Mode */}
                <h4 style={{ marginBottom: '10px', color: '#2c3e50' }}>General</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#7f8c8d' }}>MFA Mode</div>
                    <div style={{ fontWeight: '500' }}>{summary.settings?.general?.mfaMode?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Disabled'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#7f8c8d' }}>User Control</div>
                    <div style={{ fontWeight: '500' }}>{summary.settings?.general?.userControlMode?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'User Managed'}</div>
                  </div>
                </div>

                <div style={styles.divider} />

                {/* Email 2FA Settings */}
                <h4 style={{ marginBottom: '10px', color: '#2c3e50' }}>
                  Email 2FA
                  <span style={{ marginLeft: '10px', fontSize: '12px', fontWeight: 'normal' }}>
                    <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('email'); }} style={{ color: '#3498db', textDecoration: 'none' }}>Edit</a>
                  </span>
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#7f8c8d' }}>Code Format</div>
                    <div style={{ fontWeight: '500' }}>{summary.settings?.email2fa?.codeFormat || '6-digit'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#7f8c8d' }}>Code Expiration</div>
                    <div style={{ fontWeight: '500' }}>{summary.settings?.email2fa?.codeExpirationMinutes || 5} minutes</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#7f8c8d' }}>Max Failed Attempts</div>
                    <div style={{ fontWeight: '500' }}>{summary.settings?.email2fa?.maxFailedAttempts || 5}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#7f8c8d' }}>Lockout Behavior</div>
                    <div style={{ fontWeight: '500' }}>{summary.settings?.email2fa?.lockoutBehavior?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Temporary'}</div>
                  </div>
                </div>

                <div style={styles.divider} />

                {/* Device Trust Settings */}
                <h4 style={{ marginBottom: '10px', color: '#2c3e50' }}>
                  Device Trust
                  <span style={{ marginLeft: '10px', fontSize: '12px', fontWeight: 'normal' }}>
                    <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('devices'); }} style={{ color: '#3498db', textDecoration: 'none' }}>Edit</a>
                  </span>
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#7f8c8d' }}>Status</div>
                    <div style={{ fontWeight: '500' }}>{summary.settings?.deviceTrust?.enabled ? 'Enabled' : 'Disabled'}</div>
                  </div>
                  {summary.settings?.deviceTrust?.enabled && (
                    <>
                      <div>
                        <div style={{ fontSize: '12px', color: '#7f8c8d' }}>Trust Duration</div>
                        <div style={{ fontWeight: '500' }}>{summary.settings?.deviceTrust?.durationDays || 30} days</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#7f8c8d' }}>Max Devices</div>
                        <div style={{ fontWeight: '500' }}>{summary.settings?.deviceTrust?.maxDevices || 5}</div>
                      </div>
                    </>
                  )}
                </div>

                <div style={styles.divider} />

                {/* Role-Based Settings */}
                <h4 style={{ marginBottom: '10px', color: '#2c3e50' }}>
                  Role-Based MFA
                  <span style={{ marginLeft: '10px', fontSize: '12px', fontWeight: 'normal' }}>
                    <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('roles'); }} style={{ color: '#3498db', textDecoration: 'none' }}>Edit</a>
                  </span>
                </h4>
                <div>
                  <div style={{ fontSize: '12px', color: '#7f8c8d' }}>Status</div>
                  <div style={{ fontWeight: '500' }}>{summary.settings?.roles?.enabled ? 'Enabled' : 'Disabled'}</div>
                </div>

                <div style={styles.divider} />

                {/* Email Templates */}
                <h4 style={{ marginBottom: '10px', color: '#2c3e50' }}>
                  Email Templates
                  <span style={{ marginLeft: '10px', fontSize: '12px', fontWeight: 'normal' }}>
                    <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('templates'); }} style={{ color: '#3498db', textDecoration: 'none' }}>Edit</a>
                  </span>
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#7f8c8d' }}>Active Template</div>
                    <div style={{ fontWeight: '500' }}>{summary.settings?.templates?.activeTemplate?.name || 'Default'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#7f8c8d' }}>Total Templates</div>
                    <div style={{ fontWeight: '500' }}>{summary.settings?.templates?.totalTemplates || 0}</div>
                  </div>
                </div>
              </div>

              {/* Statistics Section */}
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>Statistics</h3>

                <div style={styles.divider} />

                {/* User MFA Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                  <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#3498db' }}>{summary.statistics?.users?.total || 0}</div>
                    <div style={{ fontSize: '12px', color: '#7f8c8d' }}>Active Users</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#27ae60' }}>{summary.statistics?.users?.withMfa || 0}</div>
                    <div style={{ fontSize: '12px', color: '#7f8c8d' }}>Users with MFA</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#9b59b6' }}>{summary.statistics?.users?.adoptionRate || 0}%</div>
                    <div style={{ fontSize: '12px', color: '#7f8c8d' }}>Adoption Rate</div>
                  </div>
                </div>

                <div style={styles.divider} />

                {/* MFA by Type */}
                <h4 style={{ marginBottom: '10px', color: '#2c3e50' }}>MFA by Type</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#7f8c8d' }}>TOTP Users</div>
                    <div style={{ fontWeight: '500', fontSize: '18px' }}>{summary.statistics?.mfaByType?.totp || 0}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#7f8c8d' }}>Email 2FA Users</div>
                    <div style={{ fontWeight: '500', fontSize: '18px' }}>{summary.statistics?.mfaByType?.email2fa || 0}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#7f8c8d' }}>Both Methods</div>
                    <div style={{ fontWeight: '500', fontSize: '18px' }}>{summary.statistics?.mfaByType?.both || 0}</div>
                  </div>
                </div>

                <div style={styles.divider} />

                {/* Other Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#7f8c8d' }}>Trusted Devices</div>
                    <div style={{ fontWeight: '500', fontSize: '18px' }}>{summary.statistics?.trustedDevices || 0}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#7f8c8d' }}>Users with Backup Codes</div>
                    <div style={{ fontWeight: '500', fontSize: '18px' }}>{summary.statistics?.backupCodes?.usersGenerated || 0}</div>
                  </div>
                </div>
              </div>

              {/* Activity Section */}
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>
                  Activity (Last {summary.activity?.period || '7 days'})
                  <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#7f8c8d' }}>
                    <a href="/admin/audit-logs?action=MFA" style={{ color: '#3498db', textDecoration: 'none' }}>View Audit Logs</a>
                  </span>
                </h3>

                <div style={styles.divider} />

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px' }}>
                  <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#27ae60' }}>
                      {summary.activity?.setups?.count || 0}
                      {summary.activity?.setups?.trend === 'up' && <span style={{ color: '#27ae60', marginLeft: '5px' }}>+</span>}
                      {summary.activity?.setups?.trend === 'down' && <span style={{ color: '#e74c3c', marginLeft: '5px' }}>-</span>}
                    </div>
                    <div style={{ fontSize: '12px', color: '#7f8c8d' }}>New Setups</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3498db' }}>
                      {summary.activity?.verifications?.count || 0}
                      {summary.activity?.verifications?.trend === 'up' && <span style={{ color: '#27ae60', marginLeft: '5px' }}>+</span>}
                      {summary.activity?.verifications?.trend === 'down' && <span style={{ color: '#e74c3c', marginLeft: '5px' }}>-</span>}
                    </div>
                    <div style={{ fontSize: '12px', color: '#7f8c8d' }}>Verifications</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#e74c3c' }}>
                      {summary.activity?.failures?.count || 0}
                      {summary.activity?.failures?.trend === 'up' && <span style={{ color: '#e74c3c', marginLeft: '5px' }}>!</span>}
                      {summary.activity?.failures?.trend === 'down' && <span style={{ color: '#27ae60', marginLeft: '5px' }}>-</span>}
                    </div>
                    <div style={{ fontSize: '12px', color: '#7f8c8d' }}>Failed Attempts</div>
                  </div>
                </div>
              </div>

              {/* Role Compliance Section */}
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>Role Compliance</h3>

                <div style={styles.divider} />

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8f9fa' }}>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Role</th>
                        <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>Total Users</th>
                        <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>MFA Enabled</th>
                        <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>Compliance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(summary.compliance || []).map((item) => (
                        <tr key={item.role}>
                          <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>
                            <span style={{
                              ...styles.badge,
                              backgroundColor: item.role === 'super_admin' ? '#9b59b6' : item.role === 'admin' ? '#3498db' : '#27ae60',
                              color: '#fff',
                            }}>
                              {item.role.replace('_', ' ').toUpperCase()}
                            </span>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>{item.total}</td>
                          <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>{item.mfaEnabled}</td>
                          <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>
                            <span style={{
                              ...styles.badge,
                              backgroundColor: item.percentage >= 80 ? '#27ae60' : item.percentage >= 50 ? '#f39c12' : '#e74c3c',
                              color: '#fff',
                            }}>
                              {item.percentage}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <p>No summary data available</p>
              <button
                style={{ ...styles.button, ...styles.primaryButton, marginTop: '15px' }}
                onClick={fetchSummary}
              >
                Load Summary
              </button>
            </div>
          )}
        </>
      )}

      {/* MFA Mode Confirmation Dialog */}
      {showModeConfirm && pendingMode && (
        <div style={styles.modalOverlay} onClick={handleModeCancel}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <span style={{ fontSize: '24px' }}>🔐</span>
              <h3 style={styles.modalTitle}>Confirm MFA Mode Change</h3>
            </div>

            <div style={styles.modalBody}>
              {/* Mode Transition Display */}
              <div style={styles.modeTransition}>
                <div style={{
                  ...styles.modeBox,
                  backgroundColor: MFA_MODES[config?.mfa_mode]?.color || '#95a5a6',
                  color: '#fff',
                }}>
                  <div style={{ fontSize: '12px', opacity: 0.9 }}>Current</div>
                  <div style={{ fontWeight: 'bold' }}>{MFA_MODES[config?.mfa_mode]?.label || 'Unknown'}</div>
                </div>
                <span style={styles.arrow}>→</span>
                <div style={{
                  ...styles.modeBox,
                  backgroundColor: MFA_MODES[pendingMode]?.color || '#95a5a6',
                  color: '#fff',
                }}>
                  <div style={{ fontSize: '12px', opacity: 0.9 }}>New</div>
                  <div style={{ fontWeight: 'bold' }}>{MFA_MODES[pendingMode]?.label}</div>
                </div>
              </div>

              {/* Description */}
              <div style={styles.sectionTitle}>Description</div>
              <p style={{ fontSize: '13px', color: '#555', margin: '0 0 15px 0' }}>
                {MFA_MODES[pendingMode]?.description}
              </p>

              <div style={styles.divider} />

              {/* User Impact */}
              <div style={styles.sectionTitle}>Impact on Users</div>
              <ul style={styles.impactList}>
                {MFA_MODES[pendingMode]?.userImpact?.map((impact, index) => (
                  <li key={index}>{impact}</li>
                ))}
              </ul>

              <div style={styles.divider} />

              {/* Admin Instructions */}
              <div style={styles.sectionTitle}>Instructions to Share with Users</div>
              <div style={styles.instructionsBox}>
                <button
                  style={{
                    ...styles.copyButton,
                    ...(copySuccess ? styles.copyButtonSuccess : {}),
                  }}
                  onClick={handleCopyInstructions}
                >
                  {copySuccess ? '✓ Copied!' : 'Copy Instructions'}
                </button>
                <pre style={styles.instructionsText}>
                  {MFA_MODES[pendingMode]?.adminInstructions}
                </pre>
              </div>

              <div style={styles.divider} />

              {/* Future Development Options */}
              <div style={styles.sectionTitle}>Additional Options</div>
              <div style={styles.futureFeature}>
                <input type="checkbox" disabled style={styles.disabledCheckbox} />
                <span>Notify all affected users via email</span>
                <span style={styles.futureLabel}>Future Development</span>
              </div>
              <div style={styles.futureFeature}>
                <input type="checkbox" disabled style={styles.disabledCheckbox} />
                <span>Schedule this change for later</span>
                <span style={styles.futureLabel}>Future Development</span>
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button
                style={{ ...styles.button, ...styles.secondaryButton }}
                onClick={handleModeCancel}
              >
                Cancel
              </button>
              <button
                style={{ ...styles.button, ...styles.primaryButton }}
                onClick={handleModeConfirm}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Confirm Change'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MFA Mode Tab */}
      {activeTab === 'general' && (
        <>
          {/* MFA Mode Selection */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>
              <span>🔐</span> MFA Mode
            </h3>
            <div style={styles.formGroup}>
              <label style={styles.label}>Select system-wide MFA mode</label>
              <select
                style={styles.select}
                value={config?.mfa_mode || 'disabled'}
                onChange={handleModeSelectChange}
              >
                {Object.entries(MFA_MODES).map(([mode, info]) => (
                  <option key={mode} value={mode}>
                    {info.label} - {info.description}
                  </option>
                ))}
              </select>
              <p style={styles.helpText}>
                This determines which authentication methods are available to users. Changing this setting will affect all users.
              </p>
            </div>
          </div>

          {/* User Control Mode */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>
              <span>👤</span> User Control
            </h3>
            <div style={styles.formGroup}>
              <label style={styles.label}>Who controls MFA settings?</label>
              <select
                style={styles.select}
                value={config?.user_control_mode || 'user_managed'}
                onChange={(e) => handleConfigUpdate({ user_control_mode: e.target.value })}
              >
                <option value="user_managed">User Managed - Users can enable/disable their own MFA</option>
                <option value="admin_controlled">Admin Controlled - Only admins can change MFA settings</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div style={styles.buttonGroup}>
            <button
              style={{ ...styles.button, ...styles.dangerButton }}
              onClick={handleReset}
              disabled={saving}
            >
              Reset to Defaults
            </button>
          </div>
        </>
      )}

      {/* Email 2FA Settings Tab */}
      {activeTab === 'email' && (
        <>
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>
              <span>📧</span> Email Code Settings
            </h3>

            <div style={styles.row}>
              <div style={styles.col}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Code Format</label>
                  <select
                    style={styles.select}
                    value={config?.code_format || 'numeric_6'}
                    onChange={(e) => handleConfigUpdate({ code_format: e.target.value })}
                  >
                    <option value="numeric_6">6-digit numeric (123456)</option>
                    <option value="numeric_8">8-digit numeric (12345678)</option>
                    <option value="alphanumeric_6">6-character alphanumeric (A1B2C3)</option>
                  </select>
                </div>
              </div>
              <div style={styles.col}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Code Expiration (minutes)</label>
                  <input
                    type="number"
                    style={styles.inputSmall}
                    value={config?.code_expiration_minutes || 5}
                    min="1"
                    max="30"
                    onChange={(e) => handleConfigUpdate({ code_expiration_minutes: parseInt(e.target.value) })}
                  />
                  <p style={styles.helpText}>How long before a code expires (1-30 minutes)</p>
                </div>
              </div>
            </div>

            <div style={styles.divider} />

            <h4 style={{ marginBottom: '15px', color: '#2c3e50' }}>Rate Limiting</h4>
            <div style={styles.row}>
              <div style={styles.col}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Max Resend Attempts</label>
                  <input
                    type="number"
                    style={styles.inputSmall}
                    value={config?.resend_rate_limit || 3}
                    min="1"
                    max="10"
                    onChange={(e) => handleConfigUpdate({ resend_rate_limit: parseInt(e.target.value) })}
                  />
                  <p style={styles.helpText}>How many times a user can request a new code</p>
                </div>
              </div>
              <div style={styles.col}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Resend Cooldown (seconds)</label>
                  <input
                    type="number"
                    style={styles.inputSmall}
                    value={config?.resend_cooldown_seconds || 60}
                    min="30"
                    max="300"
                    onChange={(e) => handleConfigUpdate({ resend_cooldown_seconds: parseInt(e.target.value) })}
                  />
                  <p style={styles.helpText}>Wait time between resend requests</p>
                </div>
              </div>
            </div>
          </div>

          {/* Lockout Settings */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>
              <span>🔒</span> Failed Attempt Handling
            </h3>

            <div style={styles.row}>
              <div style={styles.col}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Max Failed Attempts</label>
                  <input
                    type="number"
                    style={styles.inputSmall}
                    value={config?.max_failed_attempts || 5}
                    min="3"
                    max="10"
                    onChange={(e) => handleConfigUpdate({ max_failed_attempts: parseInt(e.target.value) })}
                  />
                  <p style={styles.helpText}>Failed attempts before lockout</p>
                </div>
              </div>
              <div style={styles.col}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Lockout Behavior</label>
                  <select
                    style={styles.select}
                    value={config?.lockout_behavior || 'temporary_lockout'}
                    onChange={(e) => handleConfigUpdate({ lockout_behavior: e.target.value })}
                  >
                    <option value="temporary_lockout">Temporary Lockout</option>
                    <option value="require_password">Require Password Re-entry</option>
                    <option value="admin_intervention">Admin Intervention Required</option>
                  </select>
                </div>
              </div>
              <div style={styles.col}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Lockout Duration (minutes)</label>
                  <input
                    type="number"
                    style={styles.inputSmall}
                    value={config?.lockout_duration_minutes || 15}
                    min="5"
                    max="60"
                    onChange={(e) => handleConfigUpdate({ lockout_duration_minutes: parseInt(e.target.value) })}
                  />
                  <p style={styles.helpText}>For temporary lockout only</p>
                </div>
              </div>
            </div>
          </div>

          {/* Backup Codes */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>
              <span>🔑</span> Backup Codes
            </h3>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                style={styles.checkbox}
                checked={config?.backup_codes_enabled_totp || false}
                onChange={(e) => handleConfigUpdate({ backup_codes_enabled_totp: e.target.checked })}
              />
              Enable backup codes for TOTP users
            </label>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                style={styles.checkbox}
                checked={config?.backup_codes_enabled_email || false}
                onChange={(e) => handleConfigUpdate({ backup_codes_enabled_email: e.target.checked })}
              />
              Enable backup codes for Email 2FA users
            </label>
          </div>
        </>
      )}

      {/* Device Trust Tab */}
      {activeTab === 'devices' && (
        <>
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>
              <span>💻</span> Device Trust Settings
            </h3>
            <p style={styles.helpText}>
              Allow users to mark devices as "trusted" to skip MFA verification for a period of time.
            </p>

            <div style={{ marginTop: '20px' }}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  style={styles.checkbox}
                  checked={config?.device_trust_enabled || false}
                  onChange={(e) => handleConfigUpdate({ device_trust_enabled: e.target.checked })}
                />
                <strong>Enable "Remember this device" feature</strong>
              </label>
            </div>

            {config?.device_trust_enabled && (
              <>
                <div style={styles.divider} />
                <div style={styles.row}>
                  <div style={styles.col}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Trust Duration (days)</label>
                      <input
                        type="number"
                        style={styles.inputSmall}
                        value={config?.device_trust_duration_days || 30}
                        min="1"
                        max="365"
                        onChange={(e) => handleConfigUpdate({ device_trust_duration_days: parseInt(e.target.value) })}
                      />
                      <p style={styles.helpText}>How long before MFA is required again</p>
                    </div>
                  </div>
                  <div style={styles.col}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Max Trusted Devices</label>
                      <input
                        type="number"
                        style={styles.inputSmall}
                        value={config?.max_trusted_devices || 5}
                        min="1"
                        max="20"
                        onChange={(e) => handleConfigUpdate({ max_trusted_devices: parseInt(e.target.value) })}
                      />
                      <p style={styles.helpText}>Maximum devices per user</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Role Settings Tab */}
      {activeTab === 'roles' && (
        <>
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>
              <span>👥</span> Role-Based MFA Requirements
            </h3>
            <p style={styles.helpText}>
              Configure MFA requirements for specific user roles. Role settings override global settings.
            </p>

            <div style={{ marginTop: '20px' }}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  style={styles.checkbox}
                  checked={config?.role_based_mfa_enabled || false}
                  onChange={(e) => handleConfigUpdate({ role_based_mfa_enabled: e.target.checked })}
                />
                <strong>Enable role-based MFA requirements</strong>
              </label>
            </div>

            {config?.role_based_mfa_enabled && (
              <>
                <div style={styles.divider} />
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8f9fa' }}>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Role</th>
                        <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>MFA Required</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Allowed Methods</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Grace Period</th>
                      </tr>
                    </thead>
                    <tbody>
                      {['user', 'admin', 'super_admin'].map((role) => {
                        const roleConfig = roleConfigs.find(r => r.role === role) || {};
                        return (
                          <tr key={role}>
                            <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>
                              <span style={{
                                ...styles.badge,
                                backgroundColor: role === 'super_admin' ? '#9b59b6' : role === 'admin' ? '#3498db' : '#27ae60',
                                color: '#fff',
                              }}>
                                {role.replace('_', ' ').toUpperCase()}
                              </span>
                            </td>
                            <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6', textAlign: 'center' }}>
                              <input
                                type="checkbox"
                                checked={roleConfig.mfa_required || false}
                                onChange={() => {/* TODO: Implement role config update */}}
                                style={{ width: '20px', height: '20px' }}
                              />
                            </td>
                            <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>
                              {(roleConfig.allowed_methods || ['totp', 'email']).join(', ')}
                            </td>
                            <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>
                              {roleConfig.grace_period_days || 0} days
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <p style={{ ...styles.helpText, marginTop: '10px' }}>
                  Click on a role to configure detailed settings.
                </p>
              </>
            )}
          </div>
        </>
      )}

      {/* Email Templates Tab */}
      {activeTab === 'templates' && (
        <>
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>
              <span>📝</span> Email Templates
            </h3>
            <p style={styles.helpText}>
              Customize the email templates sent for MFA verification.
            </p>

            <div style={{ marginTop: '20px' }}>
              {['login_verification', 'setup_verification', 'alternate_email_verification'].map((templateType) => {
                const template = templates.find(t => t.template_type === templateType);
                return (
                  <div
                    key={templateType}
                    style={{
                      ...styles.modeCard,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={styles.modeLabel}>
                        {templateType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                      </div>
                      <div style={styles.modeDescription}>
                        {template?.subject || 'Default template'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        style={{ ...styles.button, ...styles.secondaryButton }}
                        onClick={() => {/* TODO: Open template editor */}}
                      >
                        Edit
                      </button>
                      <button
                        style={{ ...styles.button, ...styles.secondaryButton }}
                        onClick={() => {/* TODO: Preview template */}}
                      >
                        Preview
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Saving indicator */}
      {saving && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          backgroundColor: '#3498db',
          color: '#fff',
          padding: '10px 20px',
          borderRadius: '4px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
        }}>
          Saving...
        </div>
      )}
    </AdminLayout>
  );
};

export default MFASettings;
