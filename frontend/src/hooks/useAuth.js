/**
 * Custom hook for authentication
 * To be implemented in future stories
 */

import { useState, useEffect } from 'react';

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

  const logout = () => {
    // TODO: Implement logout
    localStorage.removeItem('authToken');
    setUser(null);
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
