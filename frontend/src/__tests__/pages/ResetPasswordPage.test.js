import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ResetPasswordPage from '../../pages/ResetPasswordPage';
import apiService from '../../services/api';
import * as validation from '../../utils/validation';

// Mock the API service
jest.mock('../../services/api');

// Mock validation utilities
jest.mock('../../utils/validation', () => ({
  validatePassword: jest.fn(),
  getPasswordStrength: jest.fn(),
}));

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock setTimeout
jest.useFakeTimers();

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default: passwords are valid
    validation.validatePassword.mockReturnValue(true);
    validation.getPasswordStrength.mockReturnValue('strong');

    // Default successful API response
    apiService.auth = {
      resetPassword: jest.fn().mockResolvedValue({
        data: { message: 'Password reset successful' },
      }),
    };
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  const renderWithToken = (token = 'valid-token') => {
    return render(
      <MemoryRouter initialEntries={[`/reset-password/${token}`]}>
        <Routes>
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        </Routes>
      </MemoryRouter>
    );
  };

  describe('Component Rendering', () => {
    test('renders reset password form with token', () => {
      renderWithToken('test-token');

      expect(screen.getByRole('heading', { name: /reset password/i })).toBeInTheDocument();
      expect(screen.getByText(/enter your new password below/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument();
    });

    test('renders link to login page', () => {
      renderWithToken('test-token');

      expect(screen.getByText(/remember your password/i)).toBeInTheDocument();
      const loginLink = screen.getByRole('link', { name: /login here/i });
      expect(loginLink).toHaveAttribute('href', '/login');
    });

    test('password inputs are initially empty', () => {
      renderWithToken('test-token');

      expect(screen.getByLabelText(/new password/i)).toHaveValue('');
      expect(screen.getByLabelText(/confirm password/i)).toHaveValue('');
    });

    test('displays password requirements hint', () => {
      renderWithToken('test-token');

      expect(screen.getByText(/must be at least 8 characters/i)).toBeInTheDocument();
    });
  });

  describe('Token Validation', () => {
    test('shows error when no token is provided', async () => {
      renderWithToken('');

      await waitFor(() => {
        expect(screen.getByText(/invalid or missing reset token/i)).toBeInTheDocument();
      });
    });

    test('disables submit button when no token', () => {
      renderWithToken('');

      const submitButton = screen.getByRole('button', { name: /reset password/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Password Strength Indicator', () => {
    test('displays password strength when typing', () => {
      validation.getPasswordStrength.mockReturnValue('weak');
      renderWithToken('test-token');

      const passwordInput = screen.getByLabelText(/new password/i);
      fireEvent.change(passwordInput, { target: { value: 'weak' } });

      expect(validation.getPasswordStrength).toHaveBeenCalledWith('weak');
      expect(screen.getByText(/password strength: weak/i)).toBeInTheDocument();
    });

    test('updates strength indicator as password changes', () => {
      renderWithToken('test-token');

      const passwordInput = screen.getByLabelText(/new password/i);

      // Weak password
      validation.getPasswordStrength.mockReturnValue('weak');
      fireEvent.change(passwordInput, { target: { value: 'weak' } });
      expect(screen.getByText(/password strength: weak/i)).toBeInTheDocument();

      // Medium password
      validation.getPasswordStrength.mockReturnValue('medium');
      fireEvent.change(passwordInput, { target: { value: 'Medium1' } });
      expect(screen.getByText(/password strength: medium/i)).toBeInTheDocument();

      // Strong password
      validation.getPasswordStrength.mockReturnValue('strong');
      fireEvent.change(passwordInput, { target: { value: 'Strong123!' } });
      expect(screen.getByText(/password strength: strong/i)).toBeInTheDocument();
    });

    test('hides strength indicator when password is empty', () => {
      validation.getPasswordStrength.mockReturnValue('');
      renderWithToken('test-token');

      expect(screen.queryByText(/password strength/i)).not.toBeInTheDocument();
    });
  });

  describe('Form Interaction', () => {
    test('allows typing in password fields', () => {
      renderWithToken('test-token');

      const passwordInput = screen.getByLabelText(/new password/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);

      fireEvent.change(passwordInput, { target: { value: 'NewPass123!' } });
      fireEvent.change(confirmInput, { target: { value: 'NewPass123!' } });

      expect(passwordInput).toHaveValue('NewPass123!');
      expect(confirmInput).toHaveValue('NewPass123!');
    });

    test('disables form while loading', async () => {
      apiService.auth.resetPassword.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );

      renderWithToken('test-token');

      const passwordInput = screen.getByLabelText(/new password/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      fireEvent.change(passwordInput, { target: { value: 'NewPass123!' } });
      fireEvent.change(confirmInput, { target: { value: 'NewPass123!' } });
      fireEvent.click(submitButton);

      expect(passwordInput).toBeDisabled();
      expect(confirmInput).toBeDisabled();
      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveTextContent(/resetting/i);
    });
  });

  describe('Form Validation', () => {
    test('shows error when password is empty', async () => {
      renderWithToken('test-token');

      const submitButton = screen.getByRole('button', { name: /reset password/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });

      expect(apiService.auth.resetPassword).not.toHaveBeenCalled();
    });

    test('shows error when password is invalid', async () => {
      validation.validatePassword.mockReturnValue(false);

      renderWithToken('test-token');

      const passwordInput = screen.getByLabelText(/new password/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      fireEvent.change(passwordInput, { target: { value: 'weak' } });
      fireEvent.change(confirmInput, { target: { value: 'weak' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      });

      expect(validation.validatePassword).toHaveBeenCalledWith('weak');
      expect(apiService.auth.resetPassword).not.toHaveBeenCalled();
    });

    test('shows error when passwords do not match', async () => {
      renderWithToken('test-token');

      const passwordInput = screen.getByLabelText(/new password/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
      fireEvent.change(confirmInput, { target: { value: 'Different123!' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      });

      expect(apiService.auth.resetPassword).not.toHaveBeenCalled();
    });

    test('clears error on next submission attempt', async () => {
      renderWithToken('test-token');

      const submitButton = screen.getByRole('button', { name: /reset password/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText(/new password/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);

      fireEvent.change(passwordInput, { target: { value: 'NewPass123!' } });
      fireEvent.change(confirmInput, { target: { value: 'NewPass123!' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText(/password is required/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Successful Password Reset', () => {
    test('successfully resets password', async () => {
      renderWithToken('test-token');

      const passwordInput = screen.getByLabelText(/new password/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      fireEvent.change(passwordInput, { target: { value: 'NewPass123!' } });
      fireEvent.change(confirmInput, { target: { value: 'NewPass123!' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(apiService.auth.resetPassword).toHaveBeenCalledWith('test-token', {
          password: 'NewPass123!',
        });
      });

      expect(screen.getByText(/password reset successful/i)).toBeInTheDocument();
      expect(screen.getByText(/you can now log in with your new password/i)).toBeInTheDocument();
    });

    test('hides form after successful reset', async () => {
      renderWithToken('test-token');

      const passwordInput = screen.getByLabelText(/new password/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      fireEvent.change(passwordInput, { target: { value: 'NewPass123!' } });
      fireEvent.change(confirmInput, { target: { value: 'NewPass123!' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password reset successful/i)).toBeInTheDocument();
      });

      // Form should be hidden
      expect(screen.queryByLabelText(/new password/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/confirm password/i)).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /reset password/i })).not.toBeInTheDocument();
    });

    test('shows redirect message after successful reset', async () => {
      renderWithToken('test-token');

      const passwordInput = screen.getByLabelText(/new password/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      fireEvent.change(passwordInput, { target: { value: 'NewPass123!' } });
      fireEvent.change(confirmInput, { target: { value: 'NewPass123!' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/redirecting to login page in 3 seconds/i)).toBeInTheDocument();
      });
    });

    test('redirects to login after 3 seconds', async () => {
      renderWithToken('test-token');

      const passwordInput = screen.getByLabelText(/new password/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      fireEvent.change(passwordInput, { target: { value: 'NewPass123!' } });
      fireEvent.change(confirmInput, { target: { value: 'NewPass123!' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password reset successful/i)).toBeInTheDocument();
      });

      // Fast-forward time by 3 seconds
      jest.advanceTimersByTime(3000);

      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  describe('Error Handling', () => {
    test('displays error message when reset fails', async () => {
      apiService.auth.resetPassword.mockRejectedValue('Invalid or expired token');

      renderWithToken('test-token');

      const passwordInput = screen.getByLabelText(/new password/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      fireEvent.change(passwordInput, { target: { value: 'NewPass123!' } });
      fireEvent.change(confirmInput, { target: { value: 'NewPass123!' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid or expired token/i)).toBeInTheDocument();
      });
    });

    test('displays generic error when no specific message provided', async () => {
      apiService.auth.resetPassword.mockRejectedValue(null);

      renderWithToken('test-token');

      const passwordInput = screen.getByLabelText(/new password/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      fireEvent.change(passwordInput, { target: { value: 'NewPass123!' } });
      fireEvent.change(confirmInput, { target: { value: 'NewPass123!' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to reset password/i)).toBeInTheDocument();
      });
    });

    test('re-enables form after error', async () => {
      apiService.auth.resetPassword.mockRejectedValue('Network error');

      renderWithToken('test-token');

      const passwordInput = screen.getByLabelText(/new password/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      fireEvent.change(passwordInput, { target: { value: 'NewPass123!' } });
      fireEvent.change(confirmInput, { target: { value: 'NewPass123!' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });

      // Form should be enabled again
      expect(passwordInput).not.toBeDisabled();
      expect(confirmInput).not.toBeDisabled();
      expect(submitButton).not.toBeDisabled();
    });

    test('allows retry after error', async () => {
      // First call fails
      apiService.auth.resetPassword
        .mockRejectedValueOnce('Network error')
        // Second call succeeds
        .mockResolvedValueOnce({
          data: { message: 'Password reset successful' },
        });

      renderWithToken('test-token');

      const passwordInput = screen.getByLabelText(/new password/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      fireEvent.change(passwordInput, { target: { value: 'NewPass123!' } });
      fireEvent.change(confirmInput, { target: { value: 'NewPass123!' } });

      // First attempt
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });

      // Second attempt
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password reset successful/i)).toBeInTheDocument();
      });

      expect(apiService.auth.resetPassword).toHaveBeenCalledTimes(2);
    });
  });
});
