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

  // MFA Enforcement state
  const [enforcementData, setEnforcementData] = useState(null);
  const [enforcementLoading, setEnforcementLoading] = useState(false);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [gracePeriodDays, setGracePeriodDays] = useState(14);
  const [showEnableConfirm, setShowEnableConfirm] = useState(false);
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);

  // Role MFA changes state
  const [pendingRoleChanges, setPendingRoleChanges] = useState({});
  const [showRoleSaveConfirm, setShowRoleSaveConfirm] = useState(false);

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

      setConfig(configRes.data.data.config || configRes.data.data);
      setRoleConfigs(roleRes.data.data.roles || roleRes.data.data || []);
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

  // Fetch enforcement data
  const fetchEnforcementData = useCallback(async () => {
    try {
      setEnforcementLoading(true);
      const [statsRes, usersRes] = await Promise.all([
        adminApi.getEnforcementStats(),
        adminApi.getPendingMFAUsers(),
      ]);
      setEnforcementData(statsRes.data.data);
      setPendingUsers(usersRes.data.data?.users || []);
      if (statsRes.data.data?.gracePeriodDays) {
        setGracePeriodDays(statsRes.data.data.gracePeriodDays);
      }
    } catch (err) {
      console.error('Failed to fetch enforcement data:', err);
    } finally {
      setEnforcementLoading(false);
    }
  }, []);

  // Fetch enforcement data when tab changes to enforcement
  useEffect(() => {
    if (activeTab === 'enforcement') {
      fetchEnforcementData();
    }
  }, [activeTab, fetchEnforcementData]);


  // Enforcement handlers
  const handleEnableEnforcement = async () => {
    try {
      setSaving(true);
      setError(null);
      await adminApi.enableEnforcement({ gracePeriodDays });
      setSuccessMessage('MFA enforcement enabled successfully');
      setShowEnableConfirm(false);
      await fetchEnforcementData();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Failed to enable enforcement:', err);
      setError(err.response?.data?.error || 'Failed to enable enforcement');
    } finally {
      setSaving(false);
    }
  };

  const handleDisableEnforcement = async () => {
    try {
      setSaving(true);
      setError(null);
      await adminApi.disableEnforcement();
      setSuccessMessage('MFA enforcement disabled successfully');
      setShowDisableConfirm(false);
      await fetchEnforcementData();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Failed to disable enforcement:', err);
      setError(err.response?.data?.error || 'Failed to disable enforcement');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateGracePeriod = async () => {
    try {
      setSaving(true);
      setError(null);
      await adminApi.updateGracePeriod({ gracePeriodDays, applyToExisting: false });
      setSuccessMessage('Grace period updated successfully');
      await fetchEnforcementData();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Failed to update grace period:', err);
      setError(err.response?.data?.error || 'Failed to update grace period');
    } finally {
      setSaving(false);
    }
  };

  const handleExtendUserGrace = async (userId, days) => {
    try {
      setSaving(true);
      await adminApi.extendUserGracePeriod(userId, { additionalDays: days });
      setSuccessMessage('Grace period extended successfully');
      await fetchEnforcementData();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Failed to extend grace period:', err);
      setError(err.response?.data?.error || 'Failed to extend grace period');
    } finally {
      setSaving(false);
    }
  };

  // Update global config
  const handleConfigUpdate = async (updates) => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const res = await adminApi.updateMFAConfig(updates);
      // API returns { success, message, data: { config } }
      setConfig(res.data.data.config || res.data.data);
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
      // API returns { success, message, data: { config } }
      setConfig(res.data.data.config || res.data.data);
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


  // Handle role MFA required change (local state only)
  const handleRoleMfaChange = (role, enabled) => {
    setPendingRoleChanges(prev => ({
      ...prev,
      [role]: { ...prev[role], mfa_required: enabled }
    }));
  };

  // Get effective role config (pending changes or original)
  const getEffectiveRoleConfig = (role) => {
    const original = roleConfigs.find(r => r.role === role) || {};
    const pending = pendingRoleChanges[role] || {};
    return { ...original, ...pending };
  };

  // Check if there are unsaved role changes
  const hasRoleChanges = Object.keys(pendingRoleChanges).length > 0;

  // Count changed roles
  const changedRolesCount = Object.keys(pendingRoleChanges).length;

  // Save all role changes
  const handleSaveRoleChanges = async () => {
    try {
      setSaving(true);
      setError(null);

      // Save each changed role
      for (const [role, changes] of Object.entries(pendingRoleChanges)) {
        await adminApi.updateMFARoleConfig(role, changes);
      }

      // Refresh role configs
      const roleRes = await adminApi.getMFARoleConfigs();
      setRoleConfigs(roleRes.data.data.roles || roleRes.data.data || []);

      // Clear pending changes
      setPendingRoleChanges({});
      setShowRoleSaveConfirm(false);
      setSuccessMessage('MFA requirements updated for ' + changedRolesCount + ' role(s)');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Failed to save role changes:', err);
      setError(err.response?.data?.message || 'Failed to save role changes');
    } finally {
      setSaving(false);
    }
  };

  // Cancel role changes
  const handleCancelRoleChanges = () => {
    setPendingRoleChanges({});
    setShowRoleSaveConfirm(false);
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
        <button
          style={{ ...styles.tab, ...(activeTab === 'enforcement' ? styles.tabActive : {}) }}
          onClick={() => setActiveTab('enforcement')}
        >
          🔒 Enforcement
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
                  <div style={{ fontWeight: '500' }}>{config?.role_based_mfa_enabled ? 'Enabled' : 'Disabled'}</div>
                </div>


                {/* Role Details Table - Only show when enabled */}
                {config?.role_based_mfa_enabled && (
                  <div style={{ overflowX: 'auto', marginTop: '15px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f8f9fa' }}>
                          <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Role</th>
                          <th style={{ padding: '10px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>MFA Status</th>
                          <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Methods</th>
                          <th style={{ padding: '10px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>Grace Period</th>
                          <th style={{ padding: '10px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>Users</th>
                        </tr>
                      </thead>
                      <tbody>
                        {['user', 'admin', 'super_admin'].map((role) => {
                          const roleConfig = (summary.settings?.roles?.configs || []).find(r => r.role === role) || {};
                          const compliance = (summary.compliance || []).find(c => c.role === role) || {};
                          return (
                            <tr key={role}>
                              <td style={{ padding: '10px', borderBottom: '1px solid #dee2e6' }}>
                                <span style={{
                                  display: 'inline-block',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  fontSize: '11px',
                                  fontWeight: '500',
                                  backgroundColor: role === 'super_admin' ? '#9b59b6' : role === 'admin' ? '#3498db' : '#27ae60',
                                  color: '#fff',
                                }}>
                                  {role.replace('_', ' ').toUpperCase()}
                                </span>
                              </td>
                              <td style={{ padding: '10px', borderBottom: '1px solid #dee2e6', textAlign: 'center' }}>
                                <span style={{
                                  display: 'inline-block',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  fontSize: '11px',
                                  backgroundColor: roleConfig.mfa_required ? '#d4edda' : '#f8d7da',
                                  color: roleConfig.mfa_required ? '#155724' : '#721c24',
                                }}>
                                  {roleConfig.mfa_required ? 'Enabled' : 'Disabled'}
                                </span>
                              </td>
                              <td style={{ padding: '10px', borderBottom: '1px solid #dee2e6' }}>
                                {(roleConfig.allowed_methods || ['totp', 'email']).join(', ')}
                              </td>
                              <td style={{ padding: '10px', borderBottom: '1px solid #dee2e6', textAlign: 'center' }}>
                                {roleConfig.grace_period_days || 0} days
                              </td>
                              <td style={{ padding: '10px', borderBottom: '1px solid #dee2e6', textAlign: 'center' }}>
                                <span style={{ fontWeight: '500' }}>{compliance.total || 0}</span>
                                <span style={{ color: '#7f8c8d', fontSize: '11px' }}> ({compliance.mfaEnabled || 0} with MFA)</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

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
              <div style={styles.formGroup}>
                <label style={styles.label}>Role-Based MFA Status</label>
                <select
                  style={{ ...styles.select, maxWidth: '300px' }}
                  value={config?.role_based_mfa_enabled ? 'enabled' : 'disabled'}
                  onChange={(e) => handleConfigUpdate({ role_based_mfa_enabled: e.target.value === 'enabled' })}
                >
                  <option value="disabled">Disabled - Use global MFA settings for all roles</option>
                  <option value="enabled">Enabled - Configure MFA per role</option>
                </select>
                <p style={styles.helpText}>
                  When enabled, you can configure different MFA requirements for each user role.
                </p>
              </div>
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
                        const roleConfig = getEffectiveRoleConfig(role);
                        const hasChange = pendingRoleChanges[role] !== undefined;
                        return (
                          <tr key={role} style={{ backgroundColor: hasChange ? '#fff8e1' : 'transparent' }}>
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
                              <select
                                style={{ ...styles.select, maxWidth: '150px', margin: '0 auto' }}
                                value={roleConfig.mfa_required ? 'enabled' : 'disabled'}
                                onChange={(e) => handleRoleMfaChange(role, e.target.value === 'enabled')}
                              >
                                <option value="disabled">Disabled</option>
                                <option value="enabled">Enabled</option>
                              </select>
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
                {/* Save/Cancel buttons */}
                {hasRoleChanges && (
                  <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button
                      style={{ ...styles.button, ...styles.secondaryButton }}
                      onClick={handleCancelRoleChanges}
                      disabled={saving}
                    >
                      Cancel
                    </button>
                    <button
                      style={{ ...styles.button, ...styles.primaryButton }}
                      onClick={() => setShowRoleSaveConfirm(true)}
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : 'Save All Changes'}
                    </button>
                  </div>
                )}

                <p style={{ ...styles.helpText, marginTop: '10px' }}>
                  {hasRoleChanges 
                    ? 'You have unsaved changes. Click "Save All Changes" to apply them.'
                    : 'Configure MFA requirements for each role using the dropdowns above.'}
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

      {/* MFA Enforcement Tab */}
      {activeTab === 'enforcement' && (
        <>
          {enforcementLoading ? (
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <p>Loading enforcement data...</p>
            </div>
          ) : (
            <>
              {/* Enforcement Status Card */}
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>
                  <span>🔒</span> MFA Enforcement Status
                </h3>
                <div style={{ padding: '20px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '20px',
                    backgroundColor: enforcementData?.enforcementEnabled ? '#d4edda' : '#f8f9fa',
                    borderRadius: '8px',
                    marginBottom: '20px',
                  }}>
                    <div>
                      <h4 style={{ margin: '0 0 8px 0', color: enforcementData?.enforcementEnabled ? '#155724' : '#333' }}>
                        {enforcementData?.enforcementEnabled ? '✅ Enforcement Active' : '⚪ Enforcement Inactive'}
                      </h4>
                      <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                        {enforcementData?.enforcementEnabled
                          ? `Started: ${enforcementData?.enforcementStartedAt ? new Date(enforcementData.enforcementStartedAt).toLocaleDateString() : 'N/A'}`
                          : 'MFA is optional for all users'}
                      </p>
                    </div>
                    {enforcementData?.enforcementEnabled ? (
                      <button
                        style={{
                          ...styles.button,
                          backgroundColor: '#dc3545',
                          color: '#fff',
                        }}
                        onClick={() => setShowDisableConfirm(true)}
                        disabled={saving}
                      >
                        Disable Enforcement
                      </button>
                    ) : (
                      <button
                        style={{
                          ...styles.button,
                          backgroundColor: '#28a745',
                          color: '#fff',
                        }}
                        onClick={() => setShowEnableConfirm(true)}
                        disabled={saving}
                      >
                        Enable Enforcement
                      </button>
                    )}
                  </div>

                  {enforcementData?.enforcementEnabled && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                      <div style={{ padding: '16px', backgroundColor: '#e3f2fd', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1976d2' }}>
                          {enforcementData?.totalUsersRequiringSetup || 0}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>Users Pending MFA Setup</div>
                      </div>
                      <div style={{ padding: '16px', backgroundColor: '#fff3e0', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f57c00' }}>
                          {enforcementData?.usersInGracePeriod || 0}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>In Grace Period</div>
                      </div>
                      <div style={{ padding: '16px', backgroundColor: '#ffebee', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#c62828' }}>
                          {enforcementData?.usersGracePeriodExpired || 0}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>Grace Period Expired</div>
                      </div>
                      <div style={{ padding: '16px', backgroundColor: '#e8f5e9', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2e7d32' }}>
                          {enforcementData?.usersCompleted || 0}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>Setup Completed</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Grace Period Settings Card */}
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>
                  <span>⏱️</span> Grace Period Settings
                </h3>
                <div style={{ padding: '20px' }}>
                  <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
                    When enforcement is enabled, existing users are given a grace period to set up MFA.
                    New users must set up MFA immediately after email verification.
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <label style={{ fontWeight: '500' }}>Grace Period (days):</label>
                    <input
                      type="number"
                      min="1"
                      max="90"
                      value={gracePeriodDays}
                      onChange={(e) => setGracePeriodDays(Math.min(90, Math.max(1, parseInt(e.target.value) || 14)))}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '4px',
                        border: '1px solid #ddd',
                        width: '80px',
                      }}
                    />
                    <button
                      style={{
                        ...styles.button,
                        backgroundColor: '#3498db',
                        color: '#fff',
                      }}
                      onClick={handleUpdateGracePeriod}
                      disabled={saving || !enforcementData?.enforcementEnabled}
                    >
                      Update Grace Period
                    </button>
                  </div>
                </div>
              </div>

              {/* Pending Users Card */}
              {pendingUsers.length > 0 && (
                <div style={styles.card}>
                  <h3 style={styles.cardTitle}>
                    <span>👥</span> Users Pending MFA Setup ({pendingUsers.length})
                  </h3>
                  <div style={{ padding: '20px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #ddd' }}>
                          <th style={{ textAlign: 'left', padding: '12px 8px' }}>User</th>
                          <th style={{ textAlign: 'left', padding: '12px 8px' }}>Role</th>
                          <th style={{ textAlign: 'left', padding: '12px 8px' }}>Status</th>
                          <th style={{ textAlign: 'left', padding: '12px 8px' }}>Days Left</th>
                          <th style={{ textAlign: 'left', padding: '12px 8px' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingUsers.slice(0, 10).map((user) => (
                          <tr key={user.id} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '12px 8px' }}>
                              <div>{user.username}</div>
                              <div style={{ fontSize: '12px', color: '#666' }}>{user.email}</div>
                            </td>
                            <td style={{ padding: '12px 8px', textTransform: 'capitalize' }}>{user.role}</td>
                            <td style={{ padding: '12px 8px' }}>
                              <span style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                backgroundColor: user.graceStatus === 'in_grace_period' ? '#fff3e0' :
                                                 user.graceStatus === 'grace_period_expired' ? '#ffebee' : '#f5f5f5',
                                color: user.graceStatus === 'in_grace_period' ? '#f57c00' :
                                       user.graceStatus === 'grace_period_expired' ? '#c62828' : '#666',
                              }}>
                                {user.graceStatus === 'in_grace_period' ? 'In Grace Period' :
                                 user.graceStatus === 'grace_period_expired' ? 'Expired' : 'Pending'}
                              </span>
                            </td>
                            <td style={{ padding: '12px 8px' }}>
                              {user.daysRemaining > 0 ? `${user.daysRemaining} days` : 'Expired'}
                            </td>
                            <td style={{ padding: '12px 8px' }}>
                              <button
                                style={{
                                  ...styles.button,
                                  fontSize: '12px',
                                  padding: '4px 8px',
                                  backgroundColor: '#3498db',
                                  color: '#fff',
                                }}
                                onClick={() => handleExtendUserGrace(user.id, 7)}
                                disabled={saving}
                                title="Add 7 days to grace period"
                              >
                                +7 Days
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {pendingUsers.length > 10 && (
                      <div style={{ textAlign: 'center', padding: '16px', color: '#666' }}>
                        Showing 10 of {pendingUsers.length} users
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Enable Enforcement Confirmation Dialog */}
          {showEnableConfirm && (
            <div style={styles.modalOverlay}>
              <div style={styles.modalContent}>
                <div style={styles.modalHeader}>
                  <h3 style={styles.modalTitle}>Enable MFA Enforcement</h3>
                </div>
                <div style={styles.modalBody}>
                  <p style={{ marginBottom: '16px' }}>
                    <strong>This will require all users to set up MFA.</strong>
                  </p>
                  <ul style={{ paddingLeft: '20px', marginBottom: '16px' }}>
                    <li>Existing users will have {gracePeriodDays} days to set up MFA</li>
                    <li>New users must set up MFA immediately after registration</li>
                    <li>Users cannot access the application without MFA after their grace period</li>
                  </ul>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                    <label>Grace Period:</label>
                    <input
                      type="number"
                      min="1"
                      max="90"
                      value={gracePeriodDays}
                      onChange={(e) => setGracePeriodDays(Math.min(90, Math.max(1, parseInt(e.target.value) || 14)))}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '4px',
                        border: '1px solid #ddd',
                        width: '80px',
                      }}
                    />
                    <span>days</span>
                  </div>
                </div>
                <div style={styles.modalFooter}>
                  <button
                    style={{ ...styles.button, backgroundColor: '#6c757d', color: '#fff' }}
                    onClick={() => setShowEnableConfirm(false)}
                  >
                    Cancel
                  </button>
                  <button
                    style={{ ...styles.button, backgroundColor: '#28a745', color: '#fff' }}
                    onClick={handleEnableEnforcement}
                    disabled={saving}
                  >
                    {saving ? 'Enabling...' : 'Enable Enforcement'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Disable Enforcement Confirmation Dialog */}
          {showDisableConfirm && (
            <div style={styles.modalOverlay}>
              <div style={styles.modalContent}>
                <div style={styles.modalHeader}>
                  <h3 style={styles.modalTitle}>Disable MFA Enforcement</h3>
                </div>
                <div style={styles.modalBody}>
                  <p style={{ marginBottom: '16px' }}>
                    <strong>Are you sure you want to disable MFA enforcement?</strong>
                  </p>
                  <ul style={{ paddingLeft: '20px', marginBottom: '16px' }}>
                    <li>Users will no longer be required to set up MFA</li>
                    <li>Existing MFA setups will remain active</li>
                    <li>Users can still voluntarily use MFA if configured</li>
                  </ul>
                </div>
                <div style={styles.modalFooter}>
                  <button
                    style={{ ...styles.button, backgroundColor: '#6c757d', color: '#fff' }}
                    onClick={() => setShowDisableConfirm(false)}
                  >
                    Cancel
                  </button>
                  <button
                    style={{ ...styles.button, backgroundColor: '#dc3545', color: '#fff' }}
                    onClick={handleDisableEnforcement}
                    disabled={saving}
                  >
                    {saving ? 'Disabling...' : 'Disable Enforcement'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Role Save Confirmation Dialog */}
      {showRoleSaveConfirm && (
        <div style={styles.modalOverlay} onClick={() => setShowRoleSaveConfirm(false)}>
          <div style={{ ...styles.modalContent, maxWidth: '450px' }} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <span style={{ fontSize: '24px' }}>👥</span>
              <h3 style={styles.modalTitle}>Confirm Role MFA Changes</h3>
            </div>
            <div style={styles.modalBody}>
              <p style={{ marginBottom: '15px' }}>
                You are about to update MFA requirements for <strong>{changedRolesCount} role(s)</strong>.
              </p>
              <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                <div style={{ fontWeight: '500', marginBottom: '10px' }}>Changes:</div>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  {Object.entries(pendingRoleChanges).map(([role, changes]) => (
                    <li key={role}>
                      <strong>{role.replace('_', ' ').toUpperCase()}</strong>: MFA {changes.mfa_required ? 'Enabled' : 'Disabled'}
                    </li>
                  ))}
                </ul>
              </div>
              <p style={{ color: '#856404', backgroundColor: '#fff3cd', padding: '10px', borderRadius: '4px', fontSize: '13px' }}>
                ⚠️ These changes will take effect immediately for all users with the affected roles.
              </p>
            </div>
            <div style={styles.modalFooter}>
              <button
                style={{ ...styles.button, ...styles.secondaryButton }}
                onClick={() => setShowRoleSaveConfirm(false)}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                style={{ ...styles.button, ...styles.primaryButton }}
                onClick={handleSaveRoleChanges}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Confirm Changes'}
              </button>
            </div>
          </div>
        </div>
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
