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
};

export default apiService;
export { api }; // Export axios instance for direct use in hooks
