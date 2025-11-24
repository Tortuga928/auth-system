import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from '../../pages/LoginPage';
import apiService from '../../services/api';

// Mock the API service
jest.mock('../../services/api');

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('LoginPage', () => {
  let setItemSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    // Spy on localStorage.setItem
    setItemSpy = jest.spyOn(Storage.prototype, 'setItem');
  });

  afterEach(() => {
    setItemSpy.mockRestore();
  });

  const renderLoginPage = () => {
    return render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );
  };

  describe('Component Rendering', () => {
    test('renders login form with email and password inputs', () => {
      renderLoginPage();

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /login|sign in/i })).toBeInTheDocument();
    });

    test('renders links to register page', () => {
      renderLoginPage();

      expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
    });

    test('email and password inputs are initially empty', () => {
      renderLoginPage();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);

      expect(emailInput).toHaveValue('');
      expect(passwordInput).toHaveValue('');
    });
  });

  describe('Form Validation', () => {
    test('allows typing in email and password fields', () => {
      renderLoginPage();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      expect(emailInput).toHaveValue('test@example.com');
      expect(passwordInput).toHaveValue('password123');
    });

    test('submit button is disabled while loading', async () => {
      apiService.auth.login.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );

      renderLoginPage();

      const submitButton = screen.getByRole('button', { name: /login|sign in/i });
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      expect(submitButton).toBeDisabled();
    });
  });

  describe('Successful Login', () => {
    test('successfully logs in user without MFA', async () => {
      const mockResponse = {
        data: {
          data: {
            mfaRequired: false,
            tokens: {
              accessToken: 'fake-access-token',
              refreshToken: 'fake-refresh-token',
            },
            user: {
              id: 1,
              email: 'test@example.com',
              name: 'Test User',
            },
          },
        },
      };

      apiService.auth.login.mockResolvedValue(mockResponse);

      renderLoginPage();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /login|sign in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(apiService.auth.login).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
      });

      expect(setItemSpy).toHaveBeenCalledWith('authToken', 'fake-access-token');
      expect(setItemSpy).toHaveBeenCalledWith('refreshToken', 'fake-refresh-token');
      expect(setItemSpy).toHaveBeenCalledWith(
        'user',
        JSON.stringify(mockResponse.data.data.user)
      );
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  describe('MFA Flow', () => {
    test('displays MFA input when MFA is required', async () => {
      const mockResponse = {
        data: {
          data: {
            mfaRequired: true,
            mfaChallengeToken: 'fake-challenge-token',
          },
        },
      };

      apiService.auth.login.mockResolvedValue(mockResponse);

      renderLoginPage();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /login|sign in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/enter.*code/i)).toBeInTheDocument();
      });

      expect(screen.getByLabelText(/mfa.*code|verification.*code/i)).toBeInTheDocument();
    });

    test('successfully verifies MFA TOTP code', async () => {
      // First call: login with MFA required
      const loginResponse = {
        data: {
          data: {
            mfaRequired: true,
            mfaChallengeToken: 'fake-challenge-token',
          },
        },
      };

      // Second call: MFA verification success
      const mfaResponse = {
        data: {
          data: {
            tokens: {
              accessToken: 'fake-access-token',
              refreshToken: 'fake-refresh-token',
            },
            user: {
              id: 1,
              email: 'test@example.com',
              name: 'Test User',
            },
          },
        },
      };

      apiService.auth.login.mockResolvedValue(loginResponse);
      apiService.auth.verifyMFA.mockResolvedValue(mfaResponse);

      renderLoginPage();

      // Step 1: Login
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const loginButton = screen.getByRole('button', { name: /login|sign in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(loginButton);

      // Step 2: Enter MFA code
      await waitFor(() => {
        expect(screen.getByLabelText(/mfa.*code|verification.*code/i)).toBeInTheDocument();
      });

      const mfaInput = screen.getByLabelText(/mfa.*code|verification.*code/i);
      const verifyButton = screen.getByRole('button', { name: /verify/i });

      fireEvent.change(mfaInput, { target: { value: '123456' } });
      fireEvent.click(verifyButton);

      await waitFor(() => {
        expect(apiService.auth.verifyMFA).toHaveBeenCalledWith({
          mfaChallengeToken: 'fake-challenge-token',
          token: '123456',
        });
      });

      expect(setItemSpy).toHaveBeenCalledWith('authToken', 'fake-access-token');
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    test('successfully verifies MFA backup code', async () => {
      // First call: login with MFA required
      const loginResponse = {
        data: {
          data: {
            mfaRequired: true,
            mfaChallengeToken: 'fake-challenge-token',
          },
        },
      };

      // Second call: backup code verification success
      const backupCodeResponse = {
        data: {
          data: {
            tokens: {
              accessToken: 'fake-access-token',
              refreshToken: 'fake-refresh-token',
            },
            user: {
              id: 1,
              email: 'test@example.com',
              name: 'Test User',
            },
          },
        },
      };

      apiService.auth.login.mockResolvedValue(loginResponse);
      apiService.auth.verifyBackupCode.mockResolvedValue(backupCodeResponse);

      renderLoginPage();

      // Step 1: Login
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const loginButton = screen.getByRole('button', { name: /login|sign in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(loginButton);

      // Step 2: Enter backup code
      await waitFor(() => {
        expect(screen.getByLabelText(/mfa.*code|verification.*code/i)).toBeInTheDocument();
      });

      const mfaInput = screen.getByLabelText(/mfa.*code|verification.*code/i);
      const verifyButton = screen.getByRole('button', { name: /verify/i });

      fireEvent.change(mfaInput, { target: { value: 'ABC123-DEF456' } });
      fireEvent.click(verifyButton);

      await waitFor(() => {
        expect(apiService.auth.verifyBackupCode).toHaveBeenCalledWith({
          mfaChallengeToken: 'fake-challenge-token',
          backupCode: 'ABC123-DEF456',
        });
      });

      expect(setItemSpy).toHaveBeenCalledWith('authToken', 'fake-access-token');
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  describe('Error Handling', () => {
    test('displays error message when login fails', async () => {
      const errorMessage = 'Invalid credentials';
      apiService.auth.login.mockRejectedValue({
        response: {
          data: {
            message: errorMessage,
          },
        },
      });

      renderLoginPage();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /login|sign in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    test('displays generic error when no specific message provided', async () => {
      apiService.auth.login.mockRejectedValue(new Error('Network error'));

      renderLoginPage();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /login|sign in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/login failed/i)).toBeInTheDocument();
      });
    });

    test('displays error when MFA verification fails', async () => {
      // First call: login with MFA required
      const loginResponse = {
        data: {
          data: {
            mfaRequired: true,
            mfaChallengeToken: 'fake-challenge-token',
          },
        },
      };

      apiService.auth.login.mockResolvedValue(loginResponse);
      apiService.auth.verifyMFA.mockRejectedValue({
        response: {
          data: {
            message: 'Invalid MFA code',
          },
        },
      });

      renderLoginPage();

      // Step 1: Login
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const loginButton = screen.getByRole('button', { name: /login|sign in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(loginButton);

      // Step 2: Enter invalid MFA code
      await waitFor(() => {
        expect(screen.getByLabelText(/mfa.*code|verification.*code/i)).toBeInTheDocument();
      });

      const mfaInput = screen.getByLabelText(/mfa.*code|verification.*code/i);
      const verifyButton = screen.getByRole('button', { name: /verify/i });

      fireEvent.change(mfaInput, { target: { value: '000000' } });
      fireEvent.click(verifyButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid MFA code')).toBeInTheDocument();
      });
    });
  });
});
