/**
 * Email Settings Page
 *
 * Complete email service configuration UI including:
 * - Email verification settings (enabled, enforced, grace period)
 * - Email service providers CRUD (SendGrid, SES, SMTP)
 * - Connection testing and test email sending
 * - Email template preview
 */

import React, { useState, useEffect, useCallback } from 'react';
import SettingsLayout from '../../components/settings/SettingsLayout';
import apiService from '../../services/api';

const EmailSettings = () => {
  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Email verification settings
  const [verificationSettings, setVerificationSettings] = useState({
    enabled: false,
    enforced: false,
    gracePeriodDays: 7,
  });

  // Email services list
  const [emailServices, setEmailServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [serviceModalMode, setServiceModalMode] = useState('create'); // 'create' or 'edit'

  // Provider instructions
  const [providerInstructions, setProviderInstructions] = useState(null);

  // Test results
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState(null);
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState(null);
  const [testEmailAddress, setTestEmailAddress] = useState('');

  // Template preview
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);
  const [templateHtml, setTemplateHtml] = useState('');

  // New service form
  const [newService, setNewService] = useState({
    name: '',
    provider_type: 'sendgrid',
    config: {},
    credentials: {},
  });

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [settingsRes, servicesRes] = await Promise.all([
        apiService.settings.getEmailSettings(),
        apiService.settings.getEmailServices(),
      ]);

      setVerificationSettings(settingsRes.data.data);
      setEmailServices(servicesRes.data.data || []);
    } catch (err) {
      setError('Failed to load email settings');
      console.error('Error loading email settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle verification settings change
  const handleSettingsChange = (field, value) => {
    setVerificationSettings(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Save verification settings
  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      await apiService.settings.updateEmailSettings(verificationSettings);
      setSuccess('Email verification settings saved successfully');

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // Open service modal for create
  const handleCreateService = async (providerType) => {
    setServiceModalMode('create');
    setNewService({
      name: '',
      provider_type: providerType,
      config: getDefaultConfig(providerType),
      credentials: getDefaultCredentials(providerType),
    });

    // Fetch provider instructions
    try {
      const res = await apiService.settings.getProviderInstructions(providerType);
      setProviderInstructions(res.data.data);
    } catch (err) {
      console.error('Failed to load provider instructions:', err);
    }

    setShowServiceModal(true);
  };

  // Open service modal for edit
  const handleEditService = async (service) => {
    setServiceModalMode('edit');
    setSelectedService(service);
    setNewService({
      name: service.name,
      provider_type: service.provider_type,
      config: service.config || {},
      credentials: {}, // Don't populate credentials for security
    });

    // Fetch provider instructions
    try {
      const res = await apiService.settings.getProviderInstructions(service.provider_type);
      setProviderInstructions(res.data.data);
    } catch (err) {
      console.error('Failed to load provider instructions:', err);
    }

    setShowServiceModal(true);
  };

  // Get default config for provider type
  const getDefaultConfig = (providerType) => {
    switch (providerType) {
      case 'sendgrid':
        return { from_email: '', from_name: '' };
      case 'ses':
        return { region: 'us-east-1', from_email: '', from_name: '' };
      case 'smtp':
        return { host: '', port: 587, security: 'starttls', from_email: '', from_name: '' };
      default:
        return {};
    }
  };

  // Get default credentials for provider type
  const getDefaultCredentials = (providerType) => {
    switch (providerType) {
      case 'sendgrid':
        return { api_key: '' };
      case 'ses':
        return { access_key_id: '', secret_access_key: '' };
      case 'smtp':
        return { username: '', password: '' };
      default:
        return {};
    }
  };

  // Handle service form change
  const handleServiceFormChange = (field, value, isCredential = false) => {
    if (isCredential) {
      setNewService(prev => ({
        ...prev,
        credentials: { ...prev.credentials, [field]: value },
      }));
    } else if (field === 'name' || field === 'provider_type') {
      setNewService(prev => ({ ...prev, [field]: value }));
    } else {
      setNewService(prev => ({
        ...prev,
        config: { ...prev.config, [field]: value },
      }));
    }
  };

  // Save service (create or update)
  const handleSaveService = async () => {
    try {
      setSaving(true);
      setError(null);

      if (serviceModalMode === 'create') {
        await apiService.settings.createEmailService(newService);
        setSuccess('Email service created successfully');
      } else {
        // Only include credentials if they were modified
        const updateData = {
          name: newService.name,
          config: newService.config,
        };

        // Check if any credential has a value
        const hasCredentials = Object.values(newService.credentials).some(v => v && v.trim() !== '');
        if (hasCredentials) {
          updateData.credentials = newService.credentials;
        }

        await apiService.settings.updateEmailService(selectedService.id, updateData);
        setSuccess('Email service updated successfully');
      }

      setShowServiceModal(false);
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save email service');
    } finally {
      setSaving(false);
    }
  };

  // Delete service
  const handleDeleteService = async (service) => {
    if (!window.confirm(`Are you sure you want to delete "${service.name}"? This cannot be undone.`)) {
      return;
    }

    try {
      await apiService.settings.deleteEmailService(service.id);
      setSuccess('Email service deleted');
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete email service');
    }
  };

  // Activate service
  const handleActivateService = async (service) => {
    try {
      await apiService.settings.activateEmailService(service.id);
      setSuccess(`${service.name} is now the active email service`);
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to activate email service');
    }
  };

  // Deactivate service
  const handleDeactivateService = async (service) => {
    try {
      await apiService.settings.deactivateEmailService(service.id);
      setSuccess(`${service.name} has been deactivated`);
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to deactivate email service');
    }
  };

  // Test connection
  const handleTestConnection = async (service) => {
    try {
      setTestingConnection(true);
      setConnectionTestResult(null);
      setSelectedService(service);

      const res = await apiService.settings.testEmailConnection(service.id);
      setConnectionTestResult(res.data.data);
    } catch (err) {
      setConnectionTestResult({
        success: false,
        message: err.response?.data?.message || 'Connection test failed',
      });
    } finally {
      setTestingConnection(false);
    }
  };

  // Send test email
  const handleSendTestEmail = async (service) => {
    if (!testEmailAddress || !testEmailAddress.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setSendingTestEmail(true);
      setTestEmailResult(null);

      const res = await apiService.settings.testSendEmail(service.id, { to: testEmailAddress });
      setTestEmailResult(res.data.data);
    } catch (err) {
      setTestEmailResult({
        success: false,
        message: err.response?.data?.message || 'Failed to send test email',
      });
    } finally {
      setSendingTestEmail(false);
    }
  };

  // Preview template
  const handlePreviewTemplate = async (service) => {
    try {
      const res = await apiService.settings.previewEmailTemplate(service.id);
      setTemplateHtml(res.data.data?.html || '<p>No template available</p>');
      setShowTemplatePreview(true);
    } catch (err) {
      setError('Failed to load template preview');
    }
  };

  // Styles
  const styles = {
    section: {
      backgroundColor: '#fff',
      borderRadius: '8px',
      padding: '24px',
      marginBottom: '24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
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
    formGroup: {
      marginBottom: '20px',
    },
    label: {
      display: 'block',
      fontSize: '14px',
      fontWeight: '500',
      color: '#555',
      marginBottom: '8px',
    },
    input: {
      width: '100%',
      padding: '10px 12px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      fontSize: '14px',
      boxSizing: 'border-box',
    },
    select: {
      width: '100%',
      padding: '10px 12px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      fontSize: '14px',
      backgroundColor: '#fff',
      cursor: 'pointer',
    },
    checkbox: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      cursor: 'pointer',
    },
    checkboxInput: {
      width: '18px',
      height: '18px',
      cursor: 'pointer',
    },
    button: {
      padding: '10px 20px',
      borderRadius: '4px',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      border: 'none',
      transition: 'all 0.2s ease',
    },
    primaryButton: {
      backgroundColor: '#6c5ce7',
      color: '#fff',
    },
    secondaryButton: {
      backgroundColor: '#f1f1f1',
      color: '#333',
    },
    dangerButton: {
      backgroundColor: '#e74c3c',
      color: '#fff',
    },
    successButton: {
      backgroundColor: '#27ae60',
      color: '#fff',
    },
    buttonRow: {
      display: 'flex',
      gap: '12px',
      marginTop: '20px',
    },
    alert: {
      padding: '12px 16px',
      borderRadius: '4px',
      marginBottom: '20px',
      fontSize: '14px',
    },
    alertError: {
      backgroundColor: '#f8d7da',
      color: '#721c24',
      border: '1px solid #f5c6cb',
    },
    alertSuccess: {
      backgroundColor: '#d4edda',
      color: '#155724',
      border: '1px solid #c3e6cb',
    },
    serviceCard: {
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '12px',
      border: '1px solid #e9ecef',
    },
    serviceCardActive: {
      border: '2px solid #27ae60',
      backgroundColor: '#f0fff4',
    },
    serviceHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '12px',
    },
    serviceName: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#2c3e50',
    },
    serviceBadge: {
      padding: '4px 10px',
      borderRadius: '20px',
      fontSize: '11px',
      fontWeight: '500',
    },
    badgeActive: {
      backgroundColor: '#27ae60',
      color: '#fff',
    },
    badgeInactive: {
      backgroundColor: '#95a5a6',
      color: '#fff',
    },
    serviceDetails: {
      fontSize: '13px',
      color: '#666',
      marginBottom: '12px',
    },
    serviceActions: {
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap',
    },
    smallButton: {
      padding: '6px 12px',
      fontSize: '12px',
    },
    providerCards: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px',
      marginTop: '16px',
    },
    providerCard: {
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      padding: '20px',
      textAlign: 'center',
      cursor: 'pointer',
      border: '2px solid transparent',
      transition: 'all 0.2s ease',
    },
    providerIcon: {
      fontSize: '32px',
      marginBottom: '8px',
    },
    providerName: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#2c3e50',
    },
    modal: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
    },
    modalContent: {
      backgroundColor: '#fff',
      borderRadius: '8px',
      width: '90%',
      maxWidth: '600px',
      maxHeight: '90vh',
      overflow: 'auto',
    },
    modalHeader: {
      padding: '20px 24px',
      borderBottom: '1px solid #eee',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    modalTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#2c3e50',
    },
    modalClose: {
      background: 'none',
      border: 'none',
      fontSize: '24px',
      cursor: 'pointer',
      color: '#999',
    },
    modalBody: {
      padding: '24px',
    },
    modalFooter: {
      padding: '16px 24px',
      borderTop: '1px solid #eee',
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '12px',
    },
    instructions: {
      backgroundColor: '#e8f4fd',
      borderRadius: '4px',
      padding: '16px',
      marginBottom: '20px',
      fontSize: '13px',
      color: '#31708f',
    },
    instructionsList: {
      margin: '8px 0 0 0',
      paddingLeft: '20px',
    },
    testResult: {
      marginTop: '12px',
      padding: '12px',
      borderRadius: '4px',
      fontSize: '13px',
    },
    testSuccess: {
      backgroundColor: '#d4edda',
      color: '#155724',
    },
    testError: {
      backgroundColor: '#f8d7da',
      color: '#721c24',
    },
    previewFrame: {
      width: '100%',
      minHeight: '400px',
      border: '1px solid #ddd',
      borderRadius: '4px',
    },
  };

  // Provider type labels
  const providerLabels = {
    sendgrid: { name: 'SendGrid', icon: '📧' },
    ses: { name: 'Amazon SES', icon: '☁️' },
    smtp: { name: 'SMTP Server', icon: '📮' },
  };

  if (loading) {
    return (
      <SettingsLayout title="Email Settings">
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          Loading email settings...
        </div>
      </SettingsLayout>
    );
  }

  return (
    <SettingsLayout title="Email Settings">
      <div>
        {/* Alerts */}
        {error && (
          <div style={{ ...styles.alert, ...styles.alertError }}>
            {error}
            <button
              onClick={() => setError(null)}
              style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              ×
            </button>
          </div>
        )}
        {success && (
          <div style={{ ...styles.alert, ...styles.alertSuccess }}>
            {success}
          </div>
        )}

        {/* Email Verification Settings Section */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>
            <span>🔐</span>
            Email Verification Settings
          </h3>

          <div style={styles.formGroup}>
            <label style={styles.checkbox}>
              <input
                type="checkbox"
                checked={verificationSettings.enabled}
                onChange={(e) => handleSettingsChange('enabled', e.target.checked)}
                style={styles.checkboxInput}
              />
              <span>Enable Email Verification</span>
            </label>
            <p style={{ fontSize: '12px', color: '#888', marginTop: '4px', marginLeft: '28px' }}>
              When enabled, new users will receive a verification email upon registration.
            </p>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.checkbox}>
              <input
                type="checkbox"
                checked={verificationSettings.enforced}
                onChange={(e) => handleSettingsChange('enforced', e.target.checked)}
                style={styles.checkboxInput}
                disabled={!verificationSettings.enabled}
              />
              <span>Enforce Email Verification</span>
            </label>
            <p style={{ fontSize: '12px', color: '#888', marginTop: '4px', marginLeft: '28px' }}>
              When enforced, users cannot access the system until they verify their email.
            </p>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Grace Period (Days)</label>
            <input
              type="number"
              min="0"
              max="365"
              value={verificationSettings.gracePeriodDays}
              onChange={(e) => handleSettingsChange('gracePeriodDays', parseInt(e.target.value) || 0)}
              style={{ ...styles.input, maxWidth: '150px' }}
              disabled={!verificationSettings.enforced}
            />
            <p style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
              {verificationSettings.gracePeriodDays === 0
                ? 'Users must verify their email before they can log in.'
                : `Users have ${verificationSettings.gracePeriodDays} days after registration to verify their email.`}
            </p>
          </div>

          <div style={styles.buttonRow}>
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              style={{ ...styles.button, ...styles.primaryButton }}
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>

        {/* Email Services Section */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>
            <span>📧</span>
            Email Service Providers
          </h3>

          {/* Existing Services */}
          {emailServices.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#555', marginBottom: '12px' }}>
                Configured Services
              </h4>
              {emailServices.map(service => (
                <div
                  key={service.id}
                  style={{
                    ...styles.serviceCard,
                    ...(service.is_active ? styles.serviceCardActive : {}),
                  }}
                >
                  <div style={styles.serviceHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '24px' }}>{providerLabels[service.provider_type]?.icon}</span>
                      <span style={styles.serviceName}>{service.name}</span>
                    </div>
                    <span style={{
                      ...styles.serviceBadge,
                      ...(service.is_active ? styles.badgeActive : styles.badgeInactive),
                    }}>
                      {service.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div style={styles.serviceDetails}>
                    <div>Provider: {providerLabels[service.provider_type]?.name}</div>
                    <div>From: {service.config?.from_email || 'Not configured'}</div>
                    {service.last_test_at && (
                      <div>Last Test: {new Date(service.last_test_at).toLocaleString()}</div>
                    )}
                  </div>

                  <div style={styles.serviceActions}>
                    <button
                      onClick={() => handleEditService(service)}
                      style={{ ...styles.button, ...styles.secondaryButton, ...styles.smallButton }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleTestConnection(service)}
                      disabled={testingConnection}
                      style={{ ...styles.button, ...styles.secondaryButton, ...styles.smallButton }}
                    >
                      {testingConnection && selectedService?.id === service.id ? 'Testing...' : 'Test Connection'}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedService(service);
                        setTestEmailAddress('');
                        setTestEmailResult(null);
                      }}
                      style={{ ...styles.button, ...styles.secondaryButton, ...styles.smallButton }}
                    >
                      Send Test
                    </button>
                    <button
                      onClick={() => handlePreviewTemplate(service)}
                      style={{ ...styles.button, ...styles.secondaryButton, ...styles.smallButton }}
                    >
                      Preview
                    </button>
                    {!service.is_active ? (
                      <button
                        onClick={() => handleActivateService(service)}
                        style={{ ...styles.button, ...styles.successButton, ...styles.smallButton }}
                      >
                        Activate
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDeactivateService(service)}
                        style={{ ...styles.button, ...styles.secondaryButton, ...styles.smallButton }}
                      >
                        Deactivate
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteService(service)}
                      style={{ ...styles.button, ...styles.dangerButton, ...styles.smallButton }}
                    >
                      Delete
                    </button>
                  </div>

                  {/* Connection Test Result */}
                  {connectionTestResult && selectedService?.id === service.id && (
                    <div style={{
                      ...styles.testResult,
                      ...(connectionTestResult.success ? styles.testSuccess : styles.testError),
                    }}>
                      {connectionTestResult.message}
                    </div>
                  )}

                  {/* Test Email Form */}
                  {selectedService?.id === service.id && !connectionTestResult && (
                    <div style={{ marginTop: '16px', padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ ...styles.label, marginBottom: '4px' }}>Test Email Address</label>
                          <input
                            type="email"
                            value={testEmailAddress}
                            onChange={(e) => setTestEmailAddress(e.target.value)}
                            placeholder="recipient@example.com"
                            style={styles.input}
                          />
                        </div>
                        <button
                          onClick={() => handleSendTestEmail(service)}
                          disabled={sendingTestEmail}
                          style={{ ...styles.button, ...styles.primaryButton }}
                        >
                          {sendingTestEmail ? 'Sending...' : 'Send'}
                        </button>
                        <button
                          onClick={() => setSelectedService(null)}
                          style={{ ...styles.button, ...styles.secondaryButton }}
                        >
                          Cancel
                        </button>
                      </div>
                      {testEmailResult && (
                        <div style={{
                          ...styles.testResult,
                          ...(testEmailResult.success ? styles.testSuccess : styles.testError),
                        }}>
                          {testEmailResult.message || (testEmailResult.success ? 'Test email sent successfully!' : 'Failed to send test email')}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add New Service */}
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#555', marginBottom: '12px' }}>
              Add New Email Service
            </h4>
            <div style={styles.providerCards}>
              {Object.entries(providerLabels).map(([type, provider]) => (
                <div
                  key={type}
                  style={styles.providerCard}
                  onClick={() => handleCreateService(type)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#6c5ce7';
                    e.currentTarget.style.backgroundColor = '#f0f0ff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'transparent';
                    e.currentTarget.style.backgroundColor = '#f8f9fa';
                  }}
                >
                  <div style={styles.providerIcon}>{provider.icon}</div>
                  <div style={styles.providerName}>{provider.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Service Modal */}
        {showServiceModal && (
          <div style={styles.modal}>
            <div style={styles.modalContent}>
              <div style={styles.modalHeader}>
                <h3 style={styles.modalTitle}>
                  {serviceModalMode === 'create' ? 'Add' : 'Edit'} {providerLabels[newService.provider_type]?.name}
                </h3>
                <button onClick={() => setShowServiceModal(false)} style={styles.modalClose}>×</button>
              </div>

              <div style={styles.modalBody}>
                {/* Provider Instructions */}
                {providerInstructions && (
                  <div style={styles.instructions}>
                    <strong>Setup Instructions:</strong>
                    <ol style={styles.instructionsList}>
                      {providerInstructions.steps?.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Service Name */}
                <div style={styles.formGroup}>
                  <label style={styles.label}>Service Name *</label>
                  <input
                    type="text"
                    value={newService.name}
                    onChange={(e) => handleServiceFormChange('name', e.target.value)}
                    placeholder="e.g., Production SendGrid"
                    style={styles.input}
                  />
                </div>

                {/* Provider-specific fields */}
                {newService.provider_type === 'sendgrid' && (
                  <>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>API Key *</label>
                      <input
                        type="password"
                        value={newService.credentials.api_key || ''}
                        onChange={(e) => handleServiceFormChange('api_key', e.target.value, true)}
                        placeholder={serviceModalMode === 'edit' ? '(unchanged)' : 'SG.xxxxx'}
                        style={styles.input}
                      />
                    </div>
                  </>
                )}

                {newService.provider_type === 'ses' && (
                  <>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>AWS Region *</label>
                      <select
                        value={newService.config.region || 'us-east-1'}
                        onChange={(e) => handleServiceFormChange('region', e.target.value)}
                        style={styles.select}
                      >
                        {['us-east-1', 'us-east-2', 'us-west-1', 'us-west-2', 'eu-west-1', 'eu-central-1', 'ap-northeast-1', 'ap-southeast-1'].map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Access Key ID *</label>
                      <input
                        type="text"
                        value={newService.credentials.access_key_id || ''}
                        onChange={(e) => handleServiceFormChange('access_key_id', e.target.value, true)}
                        placeholder={serviceModalMode === 'edit' ? '(unchanged)' : 'AKIAIOSFODNN7EXAMPLE'}
                        style={styles.input}
                      />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Secret Access Key *</label>
                      <input
                        type="password"
                        value={newService.credentials.secret_access_key || ''}
                        onChange={(e) => handleServiceFormChange('secret_access_key', e.target.value, true)}
                        placeholder={serviceModalMode === 'edit' ? '(unchanged)' : ''}
                        style={styles.input}
                      />
                    </div>
                  </>
                )}

                {newService.provider_type === 'smtp' && (
                  <>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>SMTP Host *</label>
                      <input
                        type="text"
                        value={newService.config.host || ''}
                        onChange={(e) => handleServiceFormChange('host', e.target.value)}
                        placeholder="smtp.example.com"
                        style={styles.input}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <div style={{ ...styles.formGroup, flex: 1 }}>
                        <label style={styles.label}>Port *</label>
                        <input
                          type="number"
                          value={newService.config.port || 587}
                          onChange={(e) => handleServiceFormChange('port', parseInt(e.target.value) || 587)}
                          style={styles.input}
                        />
                      </div>
                      <div style={{ ...styles.formGroup, flex: 1 }}>
                        <label style={styles.label}>Security *</label>
                        <select
                          value={newService.config.security || 'starttls'}
                          onChange={(e) => handleServiceFormChange('security', e.target.value)}
                          style={styles.select}
                        >
                          <option value="none">None</option>
                          <option value="ssl">SSL/TLS (465)</option>
                          <option value="tls">TLS (465)</option>
                          <option value="starttls">STARTTLS (587)</option>
                        </select>
                      </div>
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Username *</label>
                      <input
                        type="text"
                        value={newService.credentials.username || ''}
                        onChange={(e) => handleServiceFormChange('username', e.target.value, true)}
                        placeholder={serviceModalMode === 'edit' ? '(unchanged)' : 'user@example.com'}
                        style={styles.input}
                      />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Password *</label>
                      <input
                        type="password"
                        value={newService.credentials.password || ''}
                        onChange={(e) => handleServiceFormChange('password', e.target.value, true)}
                        placeholder={serviceModalMode === 'edit' ? '(unchanged)' : ''}
                        style={styles.input}
                      />
                    </div>
                  </>
                )}

                {/* Common fields */}
                <div style={styles.formGroup}>
                  <label style={styles.label}>From Email *</label>
                  <input
                    type="email"
                    value={newService.config.from_email || ''}
                    onChange={(e) => handleServiceFormChange('from_email', e.target.value)}
                    placeholder="noreply@example.com"
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>From Name</label>
                  <input
                    type="text"
                    value={newService.config.from_name || ''}
                    onChange={(e) => handleServiceFormChange('from_name', e.target.value)}
                    placeholder="Auth System"
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.modalFooter}>
                <button
                  onClick={() => setShowServiceModal(false)}
                  style={{ ...styles.button, ...styles.secondaryButton }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveService}
                  disabled={saving}
                  style={{ ...styles.button, ...styles.primaryButton }}
                >
                  {saving ? 'Saving...' : (serviceModalMode === 'create' ? 'Create Service' : 'Save Changes')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Template Preview Modal */}
        {showTemplatePreview && (
          <div style={styles.modal}>
            <div style={{ ...styles.modalContent, maxWidth: '800px' }}>
              <div style={styles.modalHeader}>
                <h3 style={styles.modalTitle}>Email Template Preview</h3>
                <button onClick={() => setShowTemplatePreview(false)} style={styles.modalClose}>×</button>
              </div>
              <div style={styles.modalBody}>
                <iframe
                  srcDoc={templateHtml}
                  style={styles.previewFrame}
                  title="Email Template Preview"
                  sandbox="allow-same-origin"
                />
              </div>
              <div style={styles.modalFooter}>
                <button
                  onClick={() => setShowTemplatePreview(false)}
                  style={{ ...styles.button, ...styles.secondaryButton }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SettingsLayout>
  );
};

export default EmailSettings;
