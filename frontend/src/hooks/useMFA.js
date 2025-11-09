/**
 * Custom hook for MFA operations
 * Manages MFA state and provides functions for all MFA-related actions
 */

import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export const useMFA = () => {
  const [mfaStatus, setMfaStatus] = useState({
    enabled: false,
    backupCodesRemaining: 0,
    loading: true,
    error: null,
  });

  /**
   * Fetch current MFA status
   */
  const fetchMFAStatus = useCallback(async () => {
    try {
      setMfaStatus(prev => ({ ...prev, loading: true, error: null }));
      const response = await api.get('/api/auth/mfa/status');

      setMfaStatus({
        enabled: response.data.data.enabled,
        backupCodesRemaining: response.data.data.backupCodesRemaining || 0,
        loading: false,
        error: null,
      });
    } catch (error) {
      setMfaStatus(prev => ({
        ...prev,
        loading: false,
        error: error.response?.data?.message || 'Failed to fetch MFA status',
      }));
    }
  }, []);

  /**
   * Start MFA setup - generates secret and QR code
   */
  const setupMFA = async () => {
    try {
      const response = await api.post('/api/auth/mfa/setup');
      return {
        success: true,
        data: {
          secret: response.data.data.secret,
          qrCodeUrl: response.data.data.qrCodeUrl,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to setup MFA',
      };
    }
  };

  /**
   * Enable MFA - requires TOTP token verification
   */
  const enableMFA = async (token) => {
    try {
      const response = await api.post('/api/auth/mfa/enable', { token });

      // Update local state
      await fetchMFAStatus();

      return {
        success: true,
        data: {
          backupCodes: response.data.data.backupCodes,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to enable MFA. Invalid code?',
      };
    }
  };

  /**
   * Disable MFA - requires password confirmation
   */
  const disableMFA = async (password) => {
    try {
      await api.post('/api/auth/mfa/disable', { password });

      // Update local state
      await fetchMFAStatus();

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to disable MFA. Incorrect password?',
      };
    }
  };

  /**
   * Regenerate backup codes
   */
  const regenerateBackupCodes = async () => {
    try {
      const response = await api.post('/api/auth/mfa/backup-codes/regenerate');

      // Update local state
      await fetchMFAStatus();

      return {
        success: true,
        data: {
          backupCodes: response.data.data.backupCodes,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to regenerate backup codes',
      };
    }
  };

  /**
   * Verify TOTP code during login
   */
  const verifyTOTP = async (token, mfaChallengeToken) => {
    try {
      const response = await api.post('/api/auth/mfa/verify', {
        token,
        mfaChallengeToken,
      });

      return {
        success: true,
        data: {
          tokens: response.data.data.tokens,
          user: response.data.data.user,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Invalid verification code',
      };
    }
  };

  /**
   * Verify backup code during login
   */
  const verifyBackupCode = async (backupCode, mfaChallengeToken) => {
    try {
      const response = await api.post('/api/auth/mfa/verify-backup', {
        backupCode,
        mfaChallengeToken,
      });

      return {
        success: true,
        data: {
          tokens: response.data.data.tokens,
          user: response.data.data.user,
          backupCodesRemaining: response.data.data.backupCodesRemaining,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Invalid backup code',
      };
    }
  };

  // Fetch MFA status on mount
  useEffect(() => {
    fetchMFAStatus();
  }, [fetchMFAStatus]);

  return {
    // State
    mfaEnabled: mfaStatus.enabled,
    backupCodesRemaining: mfaStatus.backupCodesRemaining,
    loading: mfaStatus.loading,
    error: mfaStatus.error,

    // Actions
    refreshStatus: fetchMFAStatus,
    setupMFA,
    enableMFA,
    disableMFA,
    regenerateBackupCodes,
    verifyTOTP,
    verifyBackupCode,
  };
};

export default useMFA;
