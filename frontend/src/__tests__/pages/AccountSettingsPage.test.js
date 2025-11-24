import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AccountSettingsPage from '../../pages/AccountSettingsPage';
import apiService from '../../services/api';

// Mock the API service
jest.mock('../../services/api');

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

// Mock setTimeout
jest.useFakeTimers();

describe('AccountSettingsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();

    // Default successful API responses
    apiService.user = {
      changePassword: jest.fn().mockResolvedValue({
        data: { message: 'Password changed successfully' },
      }),
      deleteAccount: jest.fn().mockResolvedValue({
        data: { message: 'Account deleted successfully' },
      }),
    };

    apiService.auth = {
      logout: jest.fn().mockResolvedValue({}),
    };
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  const renderAccountSettingsPage = () => {
    return render(
      <BrowserRouter>
        <AccountSettingsPage />
      </BrowserRouter>
    );
  };

  describe('Component Rendering', () => {
    test('renders account settings page with all sections', () => {
      renderAccountSettingsPage();

      expect(screen.getByText('Account Settings')).toBeInTheDocument();
      expect(screen.getByText('Security')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /change password/i })).toBeInTheDocument();
      expect(screen.getByText('Danger Zone')).toBeInTheDocument();
    });

    test('renders security section links', () => {
      renderAccountSettingsPage();

      expect(screen.getByText('Device Management')).toBeInTheDocument();
      expect(screen.getByText('Login History')).toBeInTheDocument();
      expect(screen.getByText('Security Alerts')).toBeInTheDocument();
    });

    test('renders password change form', () => {
      renderAccountSettingsPage();

      expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^new password \*/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /change password/i })).toBeInTheDocument();
    });

    test('renders delete account button', () => {
      renderAccountSettingsPage();

      expect(screen.getByRole('button', { name: /delete account/i })).toBeInTheDocument();
    });

    test('renders back to dashboard link', () => {
      renderAccountSettingsPage();

      const backLink = screen.getByText(/back to dashboard/i);
      expect(backLink).toBeInTheDocument();
      expect(backLink.closest('a')).toHaveAttribute('href', '/dashboard');
    });
  });

  describe('Password Change - Form Validation', () => {
    test('shows error when fields are empty', async () => {
      renderAccountSettingsPage();

      const submitButton = screen.getByRole('button', { name: /change password/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/all fields are required/i)).toBeInTheDocument();
      });

      expect(apiService.user.changePassword).not.toHaveBeenCalled();
    });

    test('shows error when new passwords do not match', async () => {
      renderAccountSettingsPage();

      const currentPassword = screen.getByLabelText(/current password/i);
      const newPassword = screen.getByLabelText(/^new password \*/i);
      const confirmPassword = screen.getByLabelText(/confirm new password/i);
      const submitButton = screen.getByRole('button', { name: /change password/i });

      fireEvent.change(currentPassword, { target: { name: 'currentPassword', value: 'OldPass123!' } });
      fireEvent.change(newPassword, { target: { name: 'newPassword', value: 'NewPass123!' } });
      fireEvent.change(confirmPassword, { target: { name: 'confirmPassword', value: 'DifferentPass123!' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/new passwords do not match/i)).toBeInTheDocument();
      });

      expect(apiService.user.changePassword).not.toHaveBeenCalled();
    });

    test('shows error when new password is same as current password', async () => {
      renderAccountSettingsPage();

      const currentPassword = screen.getByLabelText(/current password/i);
      const newPassword = screen.getByLabelText(/^new password \*/i);
      const confirmPassword = screen.getByLabelText(/confirm new password/i);
      const submitButton = screen.getByRole('button', { name: /change password/i });

      fireEvent.change(currentPassword, { target: { name: 'currentPassword', value: 'SamePass123!' } });
      fireEvent.change(newPassword, { target: { name: 'newPassword', value: 'SamePass123!' } });
      fireEvent.change(confirmPassword, { target: { name: 'confirmPassword', value: 'SamePass123!' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/new password must be different from current password/i)).toBeInTheDocument();
      });

      expect(apiService.user.changePassword).not.toHaveBeenCalled();
    });

    test('shows error when password does not meet strength requirements', async () => {
      renderAccountSettingsPage();

      const currentPassword = screen.getByLabelText(/current password/i);
      const newPassword = screen.getByLabelText(/^new password \*/i);
      const confirmPassword = screen.getByLabelText(/confirm new password/i);
      const submitButton = screen.getByRole('button', { name: /change password/i });

      fireEvent.change(currentPassword, { target: { name: 'currentPassword', value: 'OldPass123!' } });
      fireEvent.change(newPassword, { target: { name: 'newPassword', value: 'weak' } });
      fireEvent.change(confirmPassword, { target: { name: 'confirmPassword', value: 'weak' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      });

      expect(apiService.user.changePassword).not.toHaveBeenCalled();
    });

    test('clears error when user starts typing', async () => {
      renderAccountSettingsPage();

      const submitButton = screen.getByRole('button', { name: /change password/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/all fields are required/i)).toBeInTheDocument();
      });

      const currentPassword = screen.getByLabelText(/current password/i);
      fireEvent.change(currentPassword, { target: { name: 'currentPassword', value: 'O' } });

      await waitFor(() => {
        expect(screen.queryByText(/all fields are required/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Password Change - Successful Change', () => {
    test('successfully changes password and shows success message', async () => {
      renderAccountSettingsPage();

      const currentPassword = screen.getByLabelText(/current password/i);
      const newPassword = screen.getByLabelText(/^new password \*/i);
      const confirmPassword = screen.getByLabelText(/confirm new password/i);
      const submitButton = screen.getByRole('button', { name: /change password/i });

      fireEvent.change(currentPassword, { target: { name: 'currentPassword', value: 'OldPass123!' } });
      fireEvent.change(newPassword, { target: { name: 'newPassword', value: 'NewPass123!' } });
      fireEvent.change(confirmPassword, { target: { name: 'confirmPassword', value: 'NewPass123!' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(apiService.user.changePassword).toHaveBeenCalledWith({
          currentPassword: 'OldPass123!',
          newPassword: 'NewPass123!',
        });
      });

      // Success alert should appear
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      expect(screen.getByText(/password changed successfully/i)).toBeInTheDocument();
      expect(screen.getByText(/you will be logged out in a moment/i)).toBeInTheDocument();
    });

    test('clears form after successful password change', async () => {
      renderAccountSettingsPage();

      const currentPassword = screen.getByLabelText(/current password/i);
      const newPassword = screen.getByLabelText(/^new password \*/i);
      const confirmPassword = screen.getByLabelText(/confirm new password/i);
      const submitButton = screen.getByRole('button', { name: /change password/i });

      fireEvent.change(currentPassword, { target: { name: 'currentPassword', value: 'OldPass123!' } });
      fireEvent.change(newPassword, { target: { name: 'newPassword', value: 'NewPass123!' } });
      fireEvent.change(confirmPassword, { target: { name: 'confirmPassword', value: 'NewPass123!' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(currentPassword).toHaveValue('');
        expect(newPassword).toHaveValue('');
        expect(confirmPassword).toHaveValue('');
      });
    });

    test('disables form after successful password change', async () => {
      renderAccountSettingsPage();

      const currentPassword = screen.getByLabelText(/current password/i);
      const newPassword = screen.getByLabelText(/^new password \*/i);
      const confirmPassword = screen.getByLabelText(/confirm new password/i);
      const submitButton = screen.getByRole('button', { name: /change password/i });

      fireEvent.change(currentPassword, { target: { name: 'currentPassword', value: 'OldPass123!' } });
      fireEvent.change(newPassword, { target: { name: 'newPassword', value: 'NewPass123!' } });
      fireEvent.change(confirmPassword, { target: { name: 'confirmPassword', value: 'NewPass123!' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(currentPassword).toBeDisabled();
        expect(newPassword).toBeDisabled();
        expect(confirmPassword).toBeDisabled();
        expect(submitButton).toBeDisabled();
      });
    });

    test('logs out and navigates to login after 2.5 seconds', async () => {
      const removeItemSpy = jest.spyOn(Storage.prototype, 'removeItem');

      renderAccountSettingsPage();

      const currentPassword = screen.getByLabelText(/current password/i);
      const newPassword = screen.getByLabelText(/^new password \*/i);
      const confirmPassword = screen.getByLabelText(/confirm new password/i);
      const submitButton = screen.getByRole('button', { name: /change password/i });

      fireEvent.change(currentPassword, { target: { name: 'currentPassword', value: 'OldPass123!' } });
      fireEvent.change(newPassword, { target: { name: 'newPassword', value: 'NewPass123!' } });
      fireEvent.change(confirmPassword, { target: { name: 'confirmPassword', value: 'NewPass123!' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password changed successfully/i)).toBeInTheDocument();
      });

      // Fast-forward time by 2.5 seconds
      jest.advanceTimersByTime(2500);

      await waitFor(() => {
        expect(apiService.auth.logout).toHaveBeenCalled();
      });

      expect(removeItemSpy).toHaveBeenCalledWith('authToken');
      expect(removeItemSpy).toHaveBeenCalledWith('user');
      expect(mockNavigate).toHaveBeenCalledWith('/login');

      removeItemSpy.mockRestore();
    });
  });

  describe('Password Change - Error Handling', () => {
    test('displays error message when password change fails', async () => {
      apiService.user.changePassword.mockRejectedValue({
        response: {
          data: {
            error: 'Current password is incorrect',
          },
        },
      });

      renderAccountSettingsPage();

      const currentPassword = screen.getByLabelText(/current password/i);
      const newPassword = screen.getByLabelText(/^new password \*/i);
      const confirmPassword = screen.getByLabelText(/confirm new password/i);
      const submitButton = screen.getByRole('button', { name: /change password/i });

      fireEvent.change(currentPassword, { target: { name: 'currentPassword', value: 'WrongPass123!' } });
      fireEvent.change(newPassword, { target: { name: 'newPassword', value: 'NewPass123!' } });
      fireEvent.change(confirmPassword, { target: { name: 'confirmPassword', value: 'NewPass123!' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/current password is incorrect/i)).toBeInTheDocument();
      });
    });

    test('displays generic error when no specific message provided', async () => {
      apiService.user.changePassword.mockRejectedValue(new Error('Network error'));

      renderAccountSettingsPage();

      const currentPassword = screen.getByLabelText(/current password/i);
      const newPassword = screen.getByLabelText(/^new password \*/i);
      const confirmPassword = screen.getByLabelText(/confirm new password/i);
      const submitButton = screen.getByRole('button', { name: /change password/i });

      fireEvent.change(currentPassword, { target: { name: 'currentPassword', value: 'OldPass123!' } });
      fireEvent.change(newPassword, { target: { name: 'newPassword', value: 'NewPass123!' } });
      fireEvent.change(confirmPassword, { target: { name: 'confirmPassword', value: 'NewPass123!' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to change password/i)).toBeInTheDocument();
      });
    });
  });

  describe('Account Deletion - Dialog', () => {
    test('shows delete confirmation dialog when delete button clicked', () => {
      renderAccountSettingsPage();

      const deleteButton = screen.getByRole('button', { name: /^delete account$/i });
      fireEvent.click(deleteButton);

      expect(screen.getByText(/confirm account deletion/i)).toBeInTheDocument();
      expect(screen.getByText(/permanently delete your account/i)).toBeInTheDocument();
      // Check for checkbox label which is unique to the dialog
      expect(screen.getByLabelText(/i understand that this action cannot be undone/i)).toBeInTheDocument();
    });

    test('renders password input and confirmation checkbox in delete dialog', () => {
      renderAccountSettingsPage();

      const deleteButton = screen.getByRole('button', { name: /^delete account$/i });
      fireEvent.click(deleteButton);

      expect(screen.getByLabelText(/enter your password to confirm/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/i understand that this action cannot be undone/i)).toBeInTheDocument();
    });

    test('hides delete dialog when cancel button clicked', () => {
      renderAccountSettingsPage();

      // Open dialog
      const deleteButton = screen.getByRole('button', { name: /^delete account$/i });
      fireEvent.click(deleteButton);

      expect(screen.getByText(/confirm account deletion/i)).toBeInTheDocument();

      // Close dialog
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(screen.queryByText(/confirm account deletion/i)).not.toBeInTheDocument();
    });

    test('delete button is disabled until checkbox is checked', () => {
      renderAccountSettingsPage();

      const deleteButton = screen.getByRole('button', { name: /^delete account$/i });
      fireEvent.click(deleteButton);

      const confirmButton = screen.getByRole('button', { name: /yes, delete my account/i });
      expect(confirmButton).toBeDisabled();

      const checkbox = screen.getByLabelText(/i understand that this action cannot be undone/i);
      fireEvent.click(checkbox);

      expect(confirmButton).not.toBeDisabled();
    });
  });

  describe('Account Deletion - Validation', () => {
    test('shows error when password is not provided', async () => {
      renderAccountSettingsPage();

      // Open dialog
      const deleteButton = screen.getByRole('button', { name: /^delete account$/i });
      fireEvent.click(deleteButton);

      // Check confirmation checkbox
      const checkbox = screen.getByLabelText(/i understand that this action cannot be undone/i);
      fireEvent.click(checkbox);

      // Try to delete without password
      const confirmButton = screen.getByRole('button', { name: /yes, delete my account/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(/password is required to delete your account/i)).toBeInTheDocument();
      });

      expect(apiService.user.deleteAccount).not.toHaveBeenCalled();
    });

    test('shows error when checkbox is not checked', async () => {
      renderAccountSettingsPage();

      // Open dialog
      const deleteButton = screen.getByRole('button', { name: /^delete account$/i });
      fireEvent.click(deleteButton);

      // Enter password but don't check checkbox
      const passwordInput = screen.getByLabelText(/enter your password to confirm/i);
      fireEvent.change(passwordInput, { target: { name: 'password', value: 'MyPass123!' } });

      const confirmButton = screen.getByRole('button', { name: /yes, delete my account/i });

      // Button should be disabled, but let's verify the logic
      expect(confirmButton).toBeDisabled();
    });
  });

  describe('Account Deletion - Successful Deletion', () => {
    test('successfully deletes account and navigates to home', async () => {
      const removeItemSpy = jest.spyOn(Storage.prototype, 'removeItem');

      renderAccountSettingsPage();

      // Open dialog
      const deleteButton = screen.getByRole('button', { name: /^delete account$/i });
      fireEvent.click(deleteButton);

      // Enter password
      const passwordInput = screen.getByLabelText(/enter your password to confirm/i);
      fireEvent.change(passwordInput, { target: { name: 'password', value: 'MyPass123!' } });

      // Check confirmation checkbox
      const checkbox = screen.getByLabelText(/i understand that this action cannot be undone/i);
      fireEvent.click(checkbox);

      // Confirm deletion
      const confirmButton = screen.getByRole('button', { name: /yes, delete my account/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(apiService.user.deleteAccount).toHaveBeenCalledWith({
          password: 'MyPass123!',
        });
      });

      // Wait for logout and navigation to complete
      await waitFor(() => {
        expect(apiService.auth.logout).toHaveBeenCalled();
        expect(removeItemSpy).toHaveBeenCalledWith('authToken');
        expect(removeItemSpy).toHaveBeenCalledWith('user');
        expect(mockNavigate).toHaveBeenCalledWith('/', {
          state: { message: 'Account deleted successfully' },
        });
      });

      removeItemSpy.mockRestore();
    });
  });

  describe('Account Deletion - Error Handling', () => {
    test('displays error message when account deletion fails', async () => {
      apiService.user.deleteAccount.mockRejectedValue({
        response: {
          data: {
            error: 'Incorrect password',
          },
        },
      });

      renderAccountSettingsPage();

      // Open dialog
      const deleteButton = screen.getByRole('button', { name: /^delete account$/i });
      fireEvent.click(deleteButton);

      // Enter password
      const passwordInput = screen.getByLabelText(/enter your password to confirm/i);
      fireEvent.change(passwordInput, { target: { name: 'password', value: 'WrongPass!' } });

      // Check confirmation checkbox
      const checkbox = screen.getByLabelText(/i understand that this action cannot be undone/i);
      fireEvent.click(checkbox);

      // Try to delete
      const confirmButton = screen.getByRole('button', { name: /yes, delete my account/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(/incorrect password/i)).toBeInTheDocument();
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});
