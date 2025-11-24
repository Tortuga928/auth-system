import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import RegisterPage from '../../pages/RegisterPage';
import apiService from '../../services/api';

// Mock the API service
jest.mock('../../services/api');

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock setTimeout for redirect tests
jest.useFakeTimers();

describe('RegisterPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  const renderRegisterPage = () => {
    return render(
      <BrowserRouter>
        <RegisterPage />
      </BrowserRouter>
    );
  };

  describe('Component Rendering', () => {
    test('renders registration form with all required fields', () => {
      renderRegisterPage();

      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /register|sign up/i })).toBeInTheDocument();
    });

    test('renders link to login page', () => {
      renderRegisterPage();

      expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
    });

    test('all input fields are initially empty', () => {
      renderRegisterPage();

      expect(screen.getByLabelText(/username/i)).toHaveValue('');
      expect(screen.getByLabelText(/^email$/i)).toHaveValue('');
      expect(screen.getByLabelText(/^password$/i)).toHaveValue('');
      expect(screen.getByLabelText(/confirm password/i)).toHaveValue('');
    });
  });

  describe('Form Validation', () => {
    test('allows typing in all form fields', () => {
      renderRegisterPage();

      const usernameInput = screen.getByLabelText(/username/i);
      const emailInput = screen.getByLabelText(/^email$/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });

      expect(usernameInput).toHaveValue('testuser');
      expect(emailInput).toHaveValue('test@example.com');
      expect(passwordInput).toHaveValue('password123');
      expect(confirmPasswordInput).toHaveValue('password123');
    });

    test('displays error when passwords do not match', async () => {
      renderRegisterPage();

      const usernameInput = screen.getByLabelText(/username/i);
      const emailInput = screen.getByLabelText(/^email$/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /register|sign up/i });

      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'differentpassword' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      });

      // Ensure API was not called
      expect(apiService.auth.register).not.toHaveBeenCalled();
    });

    test('clears error message when user starts typing', async () => {
      renderRegisterPage();

      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /register|sign up/i });

      // Trigger password mismatch error
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'different' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      });

      // Start typing in a field
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });

      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByText(/passwords do not match/i)).not.toBeInTheDocument();
      });
    });

    test('disables submit button while loading', async () => {
      apiService.auth.register.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );

      renderRegisterPage();

      const usernameInput = screen.getByLabelText(/username/i);
      const emailInput = screen.getByLabelText(/^email$/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /register|sign up/i });

      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      expect(submitButton).toBeDisabled();
    });

    test('disables form inputs while loading', async () => {
      apiService.auth.register.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );

      renderRegisterPage();

      const usernameInput = screen.getByLabelText(/username/i);
      const emailInput = screen.getByLabelText(/^email$/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /register|sign up/i });

      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      expect(usernameInput).toBeDisabled();
      expect(emailInput).toBeDisabled();
      expect(passwordInput).toBeDisabled();
      expect(confirmPasswordInput).toBeDisabled();
    });
  });

  describe('Successful Registration', () => {
    test('successfully registers user and shows success message', async () => {
      const mockResponse = {
        data: {
          message: 'Registration successful',
          user: {
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
          },
        },
      };

      apiService.auth.register.mockResolvedValue(mockResponse);

      renderRegisterPage();

      const usernameInput = screen.getByLabelText(/username/i);
      const emailInput = screen.getByLabelText(/^email$/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /register|sign up/i });

      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(apiService.auth.register).toHaveBeenCalledWith({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
        });
      });

      // Check success message appears (with emoji)
      await waitFor(() => {
        expect(screen.getByText(/✅.*registration successful.*redirecting/i)).toBeInTheDocument();
      });
    });

    test('redirects to login page after 2 seconds', async () => {
      const mockResponse = {
        data: {
          message: 'Registration successful',
          user: {
            id: 1,
            username: 'testuser',
            email: 'test@example.com',
          },
        },
      };

      apiService.auth.register.mockResolvedValue(mockResponse);

      renderRegisterPage();

      const usernameInput = screen.getByLabelText(/username/i);
      const emailInput = screen.getByLabelText(/^email$/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /register|sign up/i });

      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/registration successful/i)).toBeInTheDocument();
      });

      // Fast-forward time by 2 seconds
      jest.advanceTimersByTime(2000);

      // Check navigation was called with correct parameters
      expect(mockNavigate).toHaveBeenCalledWith('/login', {
        state: {
          message: 'Registration successful! Please check your email to verify your account.',
        },
      });
    });

    test('disables form after successful registration', async () => {
      const mockResponse = {
        data: {
          message: 'Registration successful',
        },
      };

      apiService.auth.register.mockResolvedValue(mockResponse);

      renderRegisterPage();

      const usernameInput = screen.getByLabelText(/username/i);
      const emailInput = screen.getByLabelText(/^email$/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /register|sign up/i });

      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/registration successful/i)).toBeInTheDocument();
      });

      // Form should be disabled after success
      expect(usernameInput).toBeDisabled();
      expect(emailInput).toBeDisabled();
      expect(passwordInput).toBeDisabled();
      expect(confirmPasswordInput).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    test('displays error message when registration fails', async () => {
      const errorMessage = 'Email already exists';
      apiService.auth.register.mockRejectedValue({
        response: {
          data: {
            error: errorMessage,
          },
        },
      });

      renderRegisterPage();

      const usernameInput = screen.getByLabelText(/username/i);
      const emailInput = screen.getByLabelText(/^email$/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /register|sign up/i });

      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      fireEvent.change(emailInput, { target: { value: 'existing@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      // Error message includes emoji ❌ - use getByRole for more flexible matching
      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toHaveTextContent(/email already exists/i);
      });
    });

    test('displays generic error when no specific message provided', async () => {
      apiService.auth.register.mockRejectedValue(new Error('Network error'));

      renderRegisterPage();

      const usernameInput = screen.getByLabelText(/username/i);
      const emailInput = screen.getByLabelText(/^email$/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /register|sign up/i });

      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toHaveTextContent(/registration failed/i);
      });
    });

    test('re-enables form after error', async () => {
      apiService.auth.register.mockRejectedValue({
        response: {
          data: {
            error: 'Email already exists',
          },
        },
      });

      renderRegisterPage();

      const usernameInput = screen.getByLabelText(/username/i);
      const emailInput = screen.getByLabelText(/^email$/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /register|sign up/i });

      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      fireEvent.change(emailInput, { target: { value: 'existing@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toHaveTextContent(/email already exists/i);
      });

      // Form should be re-enabled after error
      expect(usernameInput).not.toBeDisabled();
      expect(emailInput).not.toBeDisabled();
      expect(passwordInput).not.toBeDisabled();
      expect(confirmPasswordInput).not.toBeDisabled();
      expect(submitButton).not.toBeDisabled();
    });
  });
});
