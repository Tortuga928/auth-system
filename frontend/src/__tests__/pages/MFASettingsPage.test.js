import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import MFASettingsPage from '../../pages/MFASettingsPage';

// Mock the useMFA hook
const mockUseMFA = {
  mfaEnabled: false,
  backupCodesRemaining: 0,
  loading: false,
  error: null,
  refreshStatus: jest.fn(),
  disableMFA: jest.fn(),
  regenerateBackupCodes: jest.fn(),
};

jest.mock('../../hooks/useMFA', () => ({
  __esModule: true,
  default: () => mockUseMFA,
}));

// Mock child components
jest.mock('../../components/BackupCodesDisplay', () => {
  return function MockBackupCodesDisplay({ codes, onClose }) {
    return (
      <div data-testid="backup-codes-display">
        <div>Backup Codes: {codes.join(', ')}</div>
        <button onClick={onClose}>Close Backup Codes</button>
      </div>
    );
  };
});

jest.mock('../../components/MFASetupWizard', () => {
  return function MockMFASetupWizard({ isOpen, onClose, onComplete }) {
    return isOpen ? (
      <div data-testid="mfa-setup-wizard">
        <div>MFA Setup Wizard</div>
        <button onClick={onClose}>Close Wizard</button>
        <button onClick={onComplete}>Complete Setup</button>
      </div>
    ) : null;
  };
});

describe('MFASettingsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset mock to default state
    mockUseMFA.mfaEnabled = false;
    mockUseMFA.backupCodesRemaining = 0;
    mockUseMFA.loading = false;
    mockUseMFA.error = null;
    mockUseMFA.refreshStatus.mockResolvedValue();
    mockUseMFA.disableMFA.mockResolvedValue({ success: true });
    mockUseMFA.regenerateBackupCodes.mockResolvedValue({
      success: true,
      data: { backupCodes: ['CODE1', 'CODE2', 'CODE3'] },
    });
  });

  const renderMFASettingsPage = () => {
    return render(
      <BrowserRouter>
        <MFASettingsPage />
      </BrowserRouter>
    );
  };

  describe('Loading State', () => {
    test('displays loading message while fetching MFA status', () => {
      mockUseMFA.loading = true;
      renderMFASettingsPage();

      expect(screen.getByText(/loading mfa settings/i)).toBeInTheDocument();
    });
  });

  describe('MFA Disabled State', () => {
    test('displays "Enable Two-Factor Authentication" button when MFA is disabled', () => {
      mockUseMFA.mfaEnabled = false;
      renderMFASettingsPage();

      expect(screen.getByText(/enable two-factor authentication/i)).toBeInTheDocument();
      expect(screen.getByText(/disabled/i)).toBeInTheDocument();
    });

    test('displays benefits of enabling 2FA', () => {
      mockUseMFA.mfaEnabled = false;
      renderMFASettingsPage();

      expect(screen.getByText(/why enable 2fa/i)).toBeInTheDocument();
      expect(screen.getByText(/protect your account from unauthorized access/i)).toBeInTheDocument();
    });

    test('opens MFA setup wizard when enable button clicked', () => {
      mockUseMFA.mfaEnabled = false;
      renderMFASettingsPage();

      const enableButton = screen.getByRole('button', { name: /enable two-factor authentication/i });
      fireEvent.click(enableButton);

      expect(screen.getByTestId('mfa-setup-wizard')).toBeInTheDocument();
    });

    test('closes MFA setup wizard when close button clicked', () => {
      mockUseMFA.mfaEnabled = false;
      renderMFASettingsPage();

      // Open wizard
      const enableButton = screen.getByRole('button', { name: /enable two-factor authentication/i });
      fireEvent.click(enableButton);

      // Close wizard
      const closeButton = screen.getByRole('button', { name: /close wizard/i });
      fireEvent.click(closeButton);

      expect(screen.queryByTestId('mfa-setup-wizard')).not.toBeInTheDocument();
    });

    test('refreshes status and shows success message when wizard completed', async () => {
      mockUseMFA.mfaEnabled = false;
      renderMFASettingsPage();

      // Open wizard
      const enableButton = screen.getByRole('button', { name: /enable two-factor authentication/i });
      fireEvent.click(enableButton);

      // Complete setup
      const completeButton = screen.getByRole('button', { name: /complete setup/i });
      fireEvent.click(completeButton);

      await waitFor(() => {
        expect(mockUseMFA.refreshStatus).toHaveBeenCalledTimes(1);
      });

      // Success message should appear
      await waitFor(() => {
        expect(screen.getByText(/two-factor authentication enabled successfully/i)).toBeInTheDocument();
      });
    });
  });

  describe('MFA Enabled State', () => {
    test('displays "Enabled" status when MFA is enabled', () => {
      mockUseMFA.mfaEnabled = true;
      mockUseMFA.backupCodesRemaining = 5;
      renderMFASettingsPage();

      expect(screen.getByText(/enabled/i)).toBeInTheDocument();
      expect(screen.getByText(/your account is protected with 2fa/i)).toBeInTheDocument();
    });

    test('displays backup codes remaining count', () => {
      mockUseMFA.mfaEnabled = true;
      mockUseMFA.backupCodesRemaining = 3;
      renderMFASettingsPage();

      // Text is split between strong tag and regular text, so check for both parts
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText(/backup codes remaining/i)).toBeInTheDocument();
    });

    test('displays warning when no backup codes remaining', () => {
      mockUseMFA.mfaEnabled = true;
      mockUseMFA.backupCodesRemaining = 0;
      renderMFASettingsPage();

      expect(screen.getByText(/you have no backup codes remaining/i)).toBeInTheDocument();
    });

    test('displays action buttons when MFA is enabled', () => {
      mockUseMFA.mfaEnabled = true;
      renderMFASettingsPage();

      expect(screen.getByRole('button', { name: /view backup codes/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /regenerate backup codes/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /disable 2fa/i })).toBeInTheDocument();
    });
  });

  describe('View Backup Codes', () => {
    test('shows alert when view backup codes clicked', () => {
      mockUseMFA.mfaEnabled = true;
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

      renderMFASettingsPage();

      const viewButton = screen.getByRole('button', { name: /view backup codes/i });
      fireEvent.click(viewButton);

      expect(alertSpy).toHaveBeenCalledWith(
        expect.stringContaining('backup codes are only shown once')
      );

      alertSpy.mockRestore();
    });
  });

  describe('Regenerate Backup Codes', () => {
    test('prompts for confirmation and password before regenerating', async () => {
      mockUseMFA.mfaEnabled = true;
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
      const promptSpy = jest.spyOn(window, 'prompt').mockReturnValue('password123');

      renderMFASettingsPage();

      const regenerateButton = screen.getByRole('button', { name: /regenerate backup codes/i });
      fireEvent.click(regenerateButton);

      await waitFor(() => {
        expect(confirmSpy).toHaveBeenCalled();
        expect(promptSpy).toHaveBeenCalled();
      });

      confirmSpy.mockRestore();
      promptSpy.mockRestore();
    });

    test('displays new backup codes after successful regeneration', async () => {
      mockUseMFA.mfaEnabled = true;
      jest.spyOn(window, 'confirm').mockReturnValue(true);
      jest.spyOn(window, 'prompt').mockReturnValue('password123');

      renderMFASettingsPage();

      const regenerateButton = screen.getByRole('button', { name: /regenerate backup codes/i });
      fireEvent.click(regenerateButton);

      await waitFor(() => {
        expect(mockUseMFA.regenerateBackupCodes).toHaveBeenCalledWith('password123');
      });

      // Wait for backup codes display to appear
      await waitFor(() => {
        expect(screen.getByTestId('backup-codes-display')).toBeInTheDocument();
      });

      expect(screen.getByText(/new backup codes generated/i)).toBeInTheDocument();
    });

    test('does not regenerate if user cancels confirmation', async () => {
      mockUseMFA.mfaEnabled = true;
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);

      renderMFASettingsPage();

      const regenerateButton = screen.getByRole('button', { name: /regenerate backup codes/i });
      fireEvent.click(regenerateButton);

      await waitFor(() => {
        expect(confirmSpy).toHaveBeenCalled();
      });

      expect(mockUseMFA.regenerateBackupCodes).not.toHaveBeenCalled();

      confirmSpy.mockRestore();
    });

    test('displays error message if regeneration fails', async () => {
      mockUseMFA.mfaEnabled = true;
      mockUseMFA.regenerateBackupCodes.mockResolvedValue({
        success: false,
        error: 'Invalid password',
      });

      jest.spyOn(window, 'confirm').mockReturnValue(true);
      jest.spyOn(window, 'prompt').mockReturnValue('wrongpassword');

      renderMFASettingsPage();

      const regenerateButton = screen.getByRole('button', { name: /regenerate backup codes/i });
      fireEvent.click(regenerateButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid password/i)).toBeInTheDocument();
      });
    });
  });

  describe('Disable MFA', () => {
    test('prompts for password before disabling MFA', async () => {
      mockUseMFA.mfaEnabled = true;
      const promptSpy = jest.spyOn(window, 'prompt').mockReturnValue('password123');

      renderMFASettingsPage();

      const disableButton = screen.getByRole('button', { name: /disable 2fa/i });
      fireEvent.click(disableButton);

      await waitFor(() => {
        expect(promptSpy).toHaveBeenCalledWith(
          expect.stringContaining('Enter your password')
        );
      });

      promptSpy.mockRestore();
    });

    test('shows success message after disabling MFA', async () => {
      mockUseMFA.mfaEnabled = true;
      jest.spyOn(window, 'prompt').mockReturnValue('password123');

      renderMFASettingsPage();

      const disableButton = screen.getByRole('button', { name: /disable 2fa/i });
      fireEvent.click(disableButton);

      await waitFor(() => {
        expect(mockUseMFA.disableMFA).toHaveBeenCalledWith('password123');
      });

      expect(screen.getByText(/mfa has been disabled successfully/i)).toBeInTheDocument();
    });

    test('does not disable if user cancels password prompt', async () => {
      mockUseMFA.mfaEnabled = true;
      const promptSpy = jest.spyOn(window, 'prompt').mockReturnValue(null);

      renderMFASettingsPage();

      const disableButton = screen.getByRole('button', { name: /disable 2fa/i });
      fireEvent.click(disableButton);

      await waitFor(() => {
        expect(promptSpy).toHaveBeenCalled();
      });

      expect(mockUseMFA.disableMFA).not.toHaveBeenCalled();

      promptSpy.mockRestore();
    });

    test('displays error message if disable fails', async () => {
      mockUseMFA.mfaEnabled = true;
      mockUseMFA.disableMFA.mockResolvedValue({
        success: false,
        error: 'Incorrect password',
      });

      jest.spyOn(window, 'prompt').mockReturnValue('wrongpassword');

      renderMFASettingsPage();

      const disableButton = screen.getByRole('button', { name: /disable 2fa/i });
      fireEvent.click(disableButton);

      await waitFor(() => {
        expect(screen.getByText(/incorrect password/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('displays error message from useMFA hook', () => {
      mockUseMFA.error = 'Failed to load MFA settings';
      renderMFASettingsPage();

      expect(screen.getByText(/failed to load mfa settings/i)).toBeInTheDocument();
    });
  });

  describe('Help Section', () => {
    test('displays help section with FAQ', () => {
      renderMFASettingsPage();

      expect(screen.getByText(/need help/i)).toBeInTheDocument();
      expect(screen.getByText(/what is two-factor authentication/i)).toBeInTheDocument();
      expect(screen.getByText(/which authenticator apps can i use/i)).toBeInTheDocument();
    });
  });
});
