/**
 * Custom hook for authentication
 * To be implemented in future stories
 */

import { useState, useEffect } from 'react';
import apiService from '../services/api';

function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Check if user is authenticated
    // This will be implemented when authentication is added
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    // TODO: Implement login
    console.log('Login:', credentials);
  };

  const logout = async () => {
    try {
      // Call backend to invalidate all active sessions
      await apiService.auth.logout();
    } catch (error) {
      console.error('Backend logout API call failed:', error);
      // Continue with client-side logout even if backend API fails
      // This ensures user can always log out from the client side
    } finally {
      // Always clear client-side auth state regardless of API success/failure
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  const register = async (userData) => {
    // TODO: Implement registration
    console.log('Register:', userData);
  };

  return {
    user,
    loading,
    login,
    logout,
    register,
    isAuthenticated: !!user,
  };
}

export default useAuth;
