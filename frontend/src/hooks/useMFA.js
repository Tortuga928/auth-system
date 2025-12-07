/**
 * Custom hook for MFA operations
 * Manages MFA state and provides functions for all MFA-related actions
 * Updated with Email 2FA support (Phase 6)
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export const useMFA = () => {
  const [mfaStatus, setMfaStatus] = useState({
    enabled: false,
    backupCodesRemaining: 0,
    loading: true,
    error: null,
    // Email 2FA fields (Phase 6)
    email2FAEnabled: false,
    totpEnabled: false,
    alternateEmail: null,
    preferredMethod: 'totp',
  });

  /**
   * Fetch current MFA status
   */
  const fetchMFAStatus = useCallback(async () => {
    try {
      setMfaStatus(prev => ({ ...prev, loading: true, error: null }));

      const response = await api.get('/api/auth/mfa/status');
      const data = response.data.data;

      setMfaStatus({
        enabled: data.mfaEnabled,
        backupCodesRemaining: data.backupCodesRemaining || 0,
        loading: false,
        error: null,
        // Email 2FA fields (Phase 6)
        email2FAEnabled: data.email2FAEnabled || false,
        totpEnabled: data.totpEnabled || data.mfaEnabled || false,
        alternateEmail: data.alternateEmail || null,
        preferredMethod: data.preferredMethod || 'totp',
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
          qrCodeUrl: response.data.data.qrCodeUrl, // Use otpauthUrl from backend
          backupCodes: response.data.data.backupCodes,
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
  const regenerateBackupCodes = async (password) => {
    try {
      const response = await api.post('/api/auth/mfa/backup-codes/regenerate', { password });

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

  // ==========================================
  // Email 2FA Functions (Phase 6)
  // ==========================================

  /**
   * Enable Email 2FA
   */
  const enableEmail2FA = async () => {
    try {
      await api.post('/api/auth/mfa/email/enable');
      await fetchMFAStatus();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to enable Email 2FA',
      };
    }
  };

  /**
   * Disable Email 2FA - requires password confirmation
   */
  const disableEmail2FA = async (password) => {
    try {
      await api.post('/api/auth/mfa/email/disable', { password });
      await fetchMFAStatus();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to disable Email 2FA',
      };
    }
  };

  /**
   * Set alternate email for 2FA codes
   */
  const setAlternateEmail = async (email) => {
    try {
      const response = await api.post('/api/auth/mfa/email/alternate', { email });
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to set alternate email',
      };
    }
  };

  /**
   * Verify alternate email with code
   */
  const verifyAlternateEmail = async (code) => {
    try {
      await api.post('/api/auth/mfa/email/alternate/verify', { code });
      await fetchMFAStatus();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Invalid verification code',
      };
    }
  };

  /**
   * Remove alternate email
   */
  const removeAlternateEmail = async () => {
    try {
      await api.delete('/api/auth/mfa/email/alternate');
      await fetchMFAStatus();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to remove alternate email',
      };
    }
  };

  /**
   * Get trusted devices
   */
  const getTrustedDevices = async () => {
    try {
      const response = await api.get('/api/auth/mfa/trusted-devices');
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch trusted devices',
      };
    }
  };

  /**
   * Remove a trusted device
   */
  const removeTrustedDevice = async (deviceId) => {
    try {
      await api.delete(`/api/auth/mfa/trusted-devices/${deviceId}`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to remove device',
      };
    }
  };

  /**
   * Remove all trusted devices
   */
  const removeAllTrustedDevices = async () => {
    try {
      await api.delete('/api/auth/mfa/trusted-devices');
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to remove all devices',
      };
    }
  };

  /**
   * Update MFA preferences (preferred method)
   */
  const updatePreferences = async (preferences) => {
    try {
      await api.put('/api/auth/mfa/preferences', preferences);
      await fetchMFAStatus();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update preferences',
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
    // Email 2FA State (Phase 6)
    email2FAEnabled: mfaStatus.email2FAEnabled,
    totpEnabled: mfaStatus.totpEnabled,
    alternateEmail: mfaStatus.alternateEmail,
    preferredMethod: mfaStatus.preferredMethod,

    // TOTP Actions
    refreshStatus: fetchMFAStatus,
    setupMFA,
    enableMFA,
    disableMFA,
    regenerateBackupCodes,
    verifyTOTP,
    verifyBackupCode,

    // Email 2FA Actions (Phase 6)
    enableEmail2FA,
    disableEmail2FA,
    setAlternateEmail,
    verifyAlternateEmail,
    removeAlternateEmail,
    getTrustedDevices,
    removeTrustedDevice,
    removeAllTrustedDevices,
    updatePreferences,
  };
};

export default useMFA;
