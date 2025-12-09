/**
 * Admin API Service
 *
 * Provides API methods for admin panel functionality.
 * Story 10.5 - Admin Panel UI
 */

import { api } from './api';

const adminApi = {
  // Dashboard
  getDashboardStats: () => api.get('/api/admin/dashboard/stats'),
  getUserGrowth: (days = 30) => api.get(`/api/admin/dashboard/user-growth?days=${days}`),
  getActivitySummary: () => api.get('/api/admin/dashboard/activity'),
  getSecurityOverview: () => api.get('/api/admin/dashboard/security'),

  // User management
  getUsers: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.pageSize) queryParams.append('pageSize', params.pageSize);
    if (params.role) queryParams.append('role', params.role);
    if (params.status) queryParams.append('status', params.status);
    if (params.search) queryParams.append('search', params.search);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    return api.get(`/api/admin/users?${queryParams.toString()}`);
  },
  getUserById: (id) => api.get(`/api/admin/users/${id}`),
  createUser: (data) => api.post('/api/admin/users', data),
  updateUser: (id, data) => api.put(`/api/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/api/admin/users/${id}`),
  updateUserRole: (id, role) => api.put(`/api/admin/users/${id}/role`, { role }),
  updateUserStatus: (id, isActive) => api.put(`/api/admin/users/${id}/status`, { is_active: isActive }),
  reactivateUser: (id) => api.put(`/api/admin/users/${id}/reactivate`),
  searchUsers: (query, limit = 10) => api.get(`/api/admin/users/search?q=${encodeURIComponent(query)}&limit=${limit}`),

  // Send test email to a user (no rate limiting for admins)
  sendTestEmail: (userId) => api.post(`/api/admin/users/${userId}/test-email`),

  // Archive management
  getUsersWithArchive: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.pageSize) queryParams.append('pageSize', params.pageSize);
    if (params.role) queryParams.append('role', params.role);
    // Use !== undefined to allow empty string for 'All' status filter
    if (params.status !== undefined) queryParams.append('status', params.status);
    if (params.search) queryParams.append('search', params.search);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    return api.get(`/api/admin/users-v2?${queryParams.toString()}`);
  },
  archiveUser: (id) => api.post(`/api/admin/users/${id}/archive`),
  restoreUser: (id) => api.post(`/api/admin/users/${id}/restore`),
  anonymizeUser: (id) => api.post(`/api/admin/users/${id}/anonymize`),

  // Audit logs
  getAuditLogs: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.pageSize) queryParams.append('pageSize', params.pageSize);
    if (params.admin_id) queryParams.append('admin_id', params.admin_id);
    if (params.action) queryParams.append('action', params.action);
    if (params.target_type) queryParams.append('target_type', params.target_type);
    if (params.target_id) queryParams.append('target_id', params.target_id);
    if (params.start_date) queryParams.append('start_date', params.start_date);
    if (params.end_date) queryParams.append('end_date', params.end_date);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    return api.get(`/api/admin/audit-logs?${queryParams.toString()}`);
  },

  // MFA Summary (Dashboard-style overview)
  getMFASummary: () => api.get("/api/admin/mfa/summary"),

  // MFA Configuration (Phase 5)
  getMFAConfig: () => api.get('/api/admin/mfa/config'),
  updateMFAConfig: (data) => api.put('/api/admin/mfa/config', data),
  resetMFAConfig: () => api.post('/api/admin/mfa/config/reset'),

  // MFA Role Configs
  getMFARoleConfigs: () => api.get('/api/admin/mfa/roles'),
  getMFARoleConfig: (role) => api.get(`/api/admin/mfa/roles/${role}`),
  updateMFARoleConfig: (role, data) => api.put(`/api/admin/mfa/roles/${role}`, data),

  // Email Templates (new comprehensive API)
  getEmailTemplates: () => api.get('/api/admin/email-templates'),
  getEmailTemplate: (key) => api.get(`/api/admin/email-templates/${key}`),
  updateEmailTemplate: (key, data) => api.put(`/api/admin/email-templates/${key}`, data),
  setEmailTemplateVersion: (key, version) => api.post(`/api/admin/email-templates/${key}/activate`, { version }),
  resetEmailTemplate: (key) => api.post(`/api/admin/email-templates/${key}/reset`),
  resetAllEmailTemplates: () => api.post('/api/admin/email-templates/reset-all'),
  previewEmailTemplate: (data) => api.post('/api/admin/email-templates/preview', data),
  sendTemplateTestEmail: (data) => api.post('/api/admin/email-templates/send-test', data),
  getEmailTemplatePlaceholders: (key) => api.get(`/api/admin/email-templates/${key}/placeholders`),

  // Legacy MFA Templates (redirect to new API for backwards compatibility)
  getMFATemplates: () => api.get('/api/admin/email-templates'),
  getMFATemplate: (key) => api.get(`/api/admin/email-templates/${key}`),
  updateMFATemplate: (key, data) => api.put(`/api/admin/email-templates/${key}`, data),
  activateMFATemplate: (key) => api.post(`/api/admin/email-templates/${key}/activate`, { version: 'branded' }),
  resetMFATemplate: (key) => api.post(`/api/admin/email-templates/${key}/reset`),

  // MFA User Management
  getMFAUsers: () => api.get('/api/admin/mfa/users'),
  unlockMFAUser: (userId) => api.post(`/api/admin/mfa/users/${userId}/unlock`),
  forceUserMFATransition: (userId, method) => api.post(`/api/admin/mfa/users/${userId}/force-transition`, { method }),
  applySystemMFAChange: (options) => api.post('/api/admin/mfa/apply-method-change', options),

  // MFA Enforcement
  getEnforcementStats: () => api.get('/api/admin/mfa/enforcement/stats'),
  enableEnforcement: (data) => api.post('/api/admin/mfa/enforcement/enable', data),
  disableEnforcement: () => api.post('/api/admin/mfa/enforcement/disable'),
  updateGracePeriod: (data) => api.put('/api/admin/mfa/enforcement/grace-period', data),
  updateRoleExemption: (role, data) => api.put(`/api/admin/mfa/enforcement/role-exemption/${role}`, data),
  getPendingMFAUsers: (status) => api.get('/api/admin/mfa/enforcement/pending-users', { params: { status } }),
  extendUserGracePeriod: (userId, data) => api.post(`/api/admin/mfa/enforcement/extend-grace/${userId}`, data),
};

export default adminApi;
