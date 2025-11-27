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

  // Archive management
  getUsersWithArchive: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.pageSize) queryParams.append('pageSize', params.pageSize);
    if (params.role) queryParams.append('role', params.role);
    if (params.status) queryParams.append('status', params.status);
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

  // MFA Configuration (Phase 5)
  getMFAConfig: () => api.get('/api/admin/mfa/config'),
  updateMFAConfig: (data) => api.put('/api/admin/mfa/config', data),
  resetMFAConfig: () => api.post('/api/admin/mfa/config/reset'),

  // MFA Role Configs
  getMFARoleConfigs: () => api.get('/api/admin/mfa/role-configs'),
  getMFARoleConfig: (role) => api.get(`/api/admin/mfa/role-configs/${role}`),
  updateMFARoleConfig: (role, data) => api.put(`/api/admin/mfa/role-configs/${role}`, data),

  // MFA Email Templates
  getMFATemplates: () => api.get('/api/admin/mfa/templates'),
  getMFATemplate: (type) => api.get(`/api/admin/mfa/templates/${type}`),
  updateMFATemplate: (type, data) => api.put(`/api/admin/mfa/templates/${type}`, data),
  activateMFATemplate: (type) => api.post(`/api/admin/mfa/templates/${type}/activate`),
  resetMFATemplate: (type) => api.post(`/api/admin/mfa/templates/${type}/reset`),

  // MFA User Management
  getMFAUsers: () => api.get('/api/admin/mfa/users'),
  unlockMFAUser: (userId) => api.post(`/api/admin/mfa/users/${userId}/unlock`),
  forceUserMFATransition: (userId, method) => api.post(`/api/admin/mfa/users/${userId}/force-transition`, { method }),
  applySystemMFAChange: (options) => api.post('/api/admin/mfa/apply-method-change', options),
};

export default adminApi;
