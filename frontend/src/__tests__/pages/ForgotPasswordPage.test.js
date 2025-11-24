import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ForgotPasswordPage from '../../pages/ForgotPasswordPage';
import apiService from '../../services/api';
import * as validation from '../../utils/validation';

// Mock the API service
jest.mock('../../services/api');

// Mock validation utilities
jest.mock('../../utils/validation', () => ({
  validateEmail: jest.fn(),
}));

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default: emails are valid
    validation.validateEmail.mockReturnValue(true);

    // Default successful API response
    apiService.auth = {
      forgotPassword: jest.fn().mockResolvedValue({
        data: { message: 'Password reset email sent' },
      }),
    };
  });

  const renderForgotPasswordPage = () => {
    return render(
      <BrowserRouter>
        <ForgotPasswordPage />
      </BrowserRouter>
    );
  };

  describe('Component Rendering', () => {
    test('renders forgot password form', () => {
      renderForgotPasswordPage();

      expect(screen.getByRole('heading', { name: /forgot password/i })).toBeInTheDocument();
      expect(screen.getByText(/enter your email address and we'll send you a link/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
    });

    test('renders links to login and register pages', () => {
      renderForgotPasswordPage();

      expect(screen.getByText(/remember your password/i)).toBeInTheDocument();
      expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();

      const loginLink = screen.getByRole('link', { name: /login here/i });
      expect(loginLink).toHaveAttribute('href', '/login');

      const registerLink = screen.getByRole('link', { name: /register here/i });
      expect(registerLink).toHaveAttribute('href', '/register');
    });

    test('email input is initially empty', () => {
      renderForgotPasswordPage();

      const emailInput = screen.getByLabelText(/email address/i);
      expect(emailInput).toHaveValue('');
    });
  });

  describe('Form Interaction', () => {
    test('allows typing in email field', () => {
      renderForgotPasswordPage();

      const emailInput = screen.getByLabelText(/email address/i);
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      expect(emailInput).toHaveValue('test@example.com');
    });

    test('disables form while loading', async () => {
      apiService.auth.forgotPassword.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );

      renderForgotPasswordPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);

      expect(emailInput).toBeDisabled();
      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveTextContent(/sending/i);
    });
  });

  describe('Form Validation', () => {
    test('shows error when email is empty', async () => {
      renderForgotPasswordPage();

      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email address is required/i)).toBeInTheDocument();
      });

      expect(apiService.auth.forgotPassword).not.toHaveBeenCalled();
    });

    test('shows error when email is invalid', async () => {
      validation.validateEmail.mockReturnValue(false);

      renderForgotPasswordPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });

      expect(validation.validateEmail).toHaveBeenCalledWith('invalid-email');
      expect(apiService.auth.forgotPassword).not.toHaveBeenCalled();
    });

    test('clears error on next submission attempt', async () => {
      renderForgotPasswordPage();

      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email address is required/i)).toBeInTheDocument();
      });

      const emailInput = screen.getByLabelText(/email address/i);
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      // Submit again - error should clear
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText(/email address is required/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Successful Submission', () => {
    test('successfully sends password reset email', async () => {
      renderForgotPasswordPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(apiService.auth.forgotPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
        });
      });

      // Wait for success message to appear
      await waitFor(() => {
        expect(screen.getByText('Email sent!')).toBeInTheDocument();
      });

      expect(screen.getByText(/if an account exists with that email/i)).toBeInTheDocument();
    });

    test('clears email input after successful submission', async () => {
      renderForgotPasswordPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(apiService.auth.forgotPassword).toHaveBeenCalled();
      });

      // Wait for success message to appear, which means form is hidden
      await waitFor(() => {
        expect(screen.getByText('Email sent!')).toBeInTheDocument();
      });

      // Email input should no longer be visible (replaced with success message)
      expect(screen.queryByLabelText(/email address/i)).not.toBeInTheDocument();
    });

    test('shows "Back to Login" button after successful submission', async () => {
      renderForgotPasswordPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /back to login/i })).toBeInTheDocument();
      });

      const backButton = screen.getByRole('link', { name: /back to login/i });
      expect(backButton).toHaveAttribute('href', '/login');
    });

    test('hides form after successful submission', async () => {
      renderForgotPasswordPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email sent!/i)).toBeInTheDocument();
      });

      // Form should be hidden
      expect(screen.queryByRole('button', { name: /send reset link/i })).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/email address/i)).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('displays error message when API call fails', async () => {
      apiService.auth.forgotPassword.mockRejectedValue('Network error');

      renderForgotPasswordPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });

    test('displays generic error when no specific message provided', async () => {
      apiService.auth.forgotPassword.mockRejectedValue(null);

      renderForgotPasswordPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to send password reset email/i)).toBeInTheDocument();
      });
    });

    test('re-enables form after error', async () => {
      apiService.auth.forgotPassword.mockRejectedValue('Network error');

      renderForgotPasswordPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });

      // Form should be enabled again
      expect(emailInput).not.toBeDisabled();
      expect(submitButton).not.toBeDisabled();
    });

    test('allows retry after error', async () => {
      // First call fails
      apiService.auth.forgotPassword
        .mockRejectedValueOnce('Network error')
        // Second call succeeds
        .mockResolvedValueOnce({
          data: { message: 'Password reset email sent' },
        });

      renderForgotPasswordPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      // First attempt
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });

      // Second attempt
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email sent!/i)).toBeInTheDocument();
      });

      expect(apiService.auth.forgotPassword).toHaveBeenCalledTimes(2);
    });
  });
});
