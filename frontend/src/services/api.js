/**
 * API service layer using Axios
 */

import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors globally
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle SESSION_TIMEOUT specifically (Story 9.4)
    if (error.response?.status === 401 && error.response?.data?.error === 'SESSION_TIMEOUT') {
      // Clear auth token
      localStorage.removeItem('authToken');

      // Get timeout reason for user-friendly message
      const reason = error.response.data.reason;
      const message = reason === 'inactivity_timeout'
        ? 'Your session has expired due to inactivity. Please log in again.'
        : 'Your session has expired. Please log in again.';

      // Store error message for login page
      sessionStorage.setItem('sessionTimeoutMessage', message);

      // Redirect to login with return URL
      const currentPath = window.location.pathname;
      if (currentPath !== '/login') {
        window.location.href = `/login?return=${encodeURIComponent(currentPath)}`;
      }

      return Promise.reject(error);
    }

    // Pass through the full error object so components can handle it
    // This allows proper error message extraction in hooks
    // 401 errors will be handled by individual components, not globally redirected
    return Promise.reject(error);
  }
);

// API methods
const apiService = {
  // Health check
  health: () => api.get('/health'),

  // Auth endpoints (to be implemented)
  auth: {
    login: (credentials) => api.post('/api/auth/login', credentials),
    register: (userData) => api.post('/api/auth/register', userData),
    logout: () => api.post('/api/auth/logout'),
    refreshToken: () => api.post('/api/auth/refresh'),
    forgotPassword: (data) => api.post('/api/auth/forgot-password', data),
    resetPassword: (token, data) => api.post(`/api/auth/reset-password/${token}`, data),
    verifyMFA: (data) => api.post('/api/auth/mfa/verify', data),
    verifyBackupCode: (data) => api.post('/api/auth/mfa/verify-backup', data),
    // Email 2FA endpoints (Phase 6)
    verifyEmailMFA: (data) => api.post('/api/auth/mfa/verify-email', data),
    resendEmailMFA: (data) => api.post('/api/auth/mfa/resend-email', data),
    switchMFAMethod: (data) => api.post('/api/auth/mfa/switch-method', data),
  },

  // MFA Configuration endpoints (Phase 6)
  mfa: {
    // Public config (no auth required)
    getPublicConfig: () => api.get('/api/auth/mfa/config'),
    // User MFA status (auth required)
    getStatus: () => api.get('/api/auth/mfa/status'),
    // Email 2FA management (auth required)
    enableEmail2FA: () => api.post('/api/auth/mfa/email/enable'),
    disableEmail2FA: (data) => api.post('/api/auth/mfa/email/disable', data),
    requestEmailCode: () => api.post('/api/auth/mfa/email/request'),
    verifyEmailCode: (data) => api.post('/api/auth/mfa/email/verify', data),
    resendEmailCode: () => api.post('/api/auth/mfa/email/resend'),
    // Alternate email
    setAlternateEmail: (data) => api.post('/api/auth/mfa/email/alternate', data),
    verifyAlternateEmail: (data) => api.post('/api/auth/mfa/email/alternate/verify', data),
    removeAlternateEmail: () => api.delete('/api/auth/mfa/email/alternate'),
    // Trusted devices
    getTrustedDevices: () => api.get('/api/auth/mfa/trusted-devices'),
    removeTrustedDevice: (deviceId) => api.delete(`/api/auth/mfa/trusted-devices/${deviceId}`),
    removeAllTrustedDevices: () => api.delete('/api/auth/mfa/trusted-devices'),
    // User preferences
    getPreferences: () => api.get('/api/auth/mfa/preferences'),
    updatePreferences: (data) => api.put('/api/auth/mfa/preferences', data),
  },

  // User endpoints (to be implemented)
  user: {
    getProfile: () => api.get('/api/user/profile'),
    updateProfile: (data) => api.put('/api/user/profile', data),
    changePassword: (data) => api.post('/api/user/change-password', data),
    uploadAvatar: (formData) => api.post('/api/user/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
    deleteAvatar: () => api.delete('/api/user/avatar'),
    getActivity: (page = 1, limit = 25) => api.get(`/api/user/activity?page=${page}&limit=${limit}`),
    deleteAccount: (data) => api.delete('/api/user/account', { data }),
  },

  // OAuth endpoints
  oauth: {
    getLinkedProviders: () => api.get('/api/auth/linked-providers'),
    unlinkProvider: (provider) => api.delete(`/api/auth/unlink/${provider}`),
  },

  // Security endpoints (Story 9.5)
  security: {
    // Session management
    getSessions: () => api.get('/api/sessions'),
    revokeSession: (sessionId) => api.delete(`/api/sessions/${sessionId}`),
    revokeAllOthers: () => api.post('/api/sessions/revoke-others'),

    // Login history
    getLoginHistory: (page = 1, pageSize = 25) =>
      api.get(`/api/security/login-history?page=${page}&pageSize=${pageSize}`),
    getLoginStats: (days = 30) =>
      api.get(`/api/security/login-stats?days=${days}`),

    // Security events
    getSecurityEvents: (page = 1, pageSize = 25) =>
      api.get(`/api/security/events?page=${page}&pageSize=${pageSize}`),
    getEventStats: (days = 30) =>
      api.get(`/api/security/event-stats?days=${days}`),
    acknowledgeEvent: (eventId) =>
      api.post(`/api/security/events/${eventId}/acknowledge`),
    acknowledgeAllEvents: () =>
      api.post('/api/security/events/acknowledge-all'),
    getUnacknowledgedCount: () =>
      api.get('/api/security/events/unacknowledged-count'),
  },

  // Settings endpoints (Super Admin only)
  settings: {
    // Email verification settings
    getEmailSettings: () => api.get('/api/admin/settings/email'),
    updateEmailSettings: (data) => api.put('/api/admin/settings/email', data),

    // Email service CRUD
    getEmailServices: () => api.get('/api/admin/settings/email-services'),
    getEmailService: (id) => api.get(`/api/admin/settings/email-services/${id}`),
    createEmailService: (data) => api.post('/api/admin/settings/email-services', data),
    updateEmailService: (id, data) => api.put(`/api/admin/settings/email-services/${id}`, data),
    deleteEmailService: (id) => api.delete(`/api/admin/settings/email-services/${id}`),

    // Email service actions
    activateEmailService: (id) => api.post(`/api/admin/settings/email-services/${id}/activate`),
    deactivateEmailService: (id) => api.post(`/api/admin/settings/email-services/${id}/deactivate`),
    testEmailConnection: (id) => api.post(`/api/admin/settings/email-services/${id}/test-connection`),
    testSendEmail: (id, data) => api.post(`/api/admin/settings/email-services/${id}/test-send`, data),
    previewEmailTemplate: (id) => api.get(`/api/admin/settings/email-services/${id}/preview-template`),

    // Provider instructions
    getProviderInstructions: (type) => api.get(`/api/admin/settings/email-providers/${type}/instructions`),

    // Audit log
    getSettingsAuditLog: (page = 1, limit = 50) =>
      api.get(`/api/admin/settings/audit-log?page=${page}&limit=${limit}`),
  },
};

export default apiService;
export { api }; // Export axios instance for direct use in hooks
