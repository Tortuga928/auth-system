import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DashboardPage from '../../pages/DashboardPage';
import apiService from '../../services/api';

// Mock the API service
jest.mock('../../services/api');

// Mock AvatarUpload component
jest.mock('../../components/AvatarUpload', () => {
  return function MockAvatarUpload({ currentAvatarUrl, onUploadSuccess }) {
    return (
      <div data-testid="avatar-upload">
        <button onClick={() => onUploadSuccess('/uploads/new-avatar.jpg')}>
          Upload Avatar
        </button>
      </div>
    );
  };
});

describe('DashboardPage', () => {
  const mockProfileData = {
    user: {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      role: 'user',
      avatarUrl: null,
      createdAt: '2024-01-01T00:00:00.000Z',
    },
    security: {
      emailVerified: true,
      mfaEnabled: false,
      passwordLastChanged: '2024-01-01T00:00:00.000Z',
      oauthAccounts: [],
      oauthAccountsCount: 0,
    },
    activity: [
      {
        id: 1,
        action: 'login',
        description: 'User logged in',
        timestamp: new Date().toISOString(),
        ipAddress: '192.168.1.1',
      },
      {
        id: 2,
        action: 'profile_updated',
        description: 'Profile information updated',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        ipAddress: '192.168.1.1',
      },
    ],
  };

  const mockSecurityData = {
    sessions: [
      { id: 1, deviceName: 'Chrome on Windows' },
      { id: 2, deviceName: 'Firefox on Mac' },
    ],
  };

  const mockUnacknowledgedCount = {
    count: 3,
  };

  const mockLoginStats = {
    totalLogins: 10,
    successfulLogins: 8,
    failedLogins: 2,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Default successful API responses
    apiService.user = {
      getProfile: jest.fn().mockResolvedValue({
        data: { data: mockProfileData },
      }),
    };

    apiService.security = {
      getSessions: jest.fn().mockResolvedValue({
        data: { data: mockSecurityData },
      }),
      getUnacknowledgedCount: jest.fn().mockResolvedValue({
        data: { data: mockUnacknowledgedCount },
      }),
      getLoginStats: jest.fn().mockResolvedValue({
        data: { data: mockLoginStats },
      }),
    };
  });

  const renderDashboardPage = () => {
    return render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    );
  };

  describe('Loading State', () => {
    test('displays loading spinner while fetching data', () => {
      apiService.user.getProfile.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      renderDashboardPage();

      expect(screen.getByText(/loading dashboard/i)).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('Profile Display', () => {
    test('displays user profile information', async () => {
      renderDashboardPage();

      await waitFor(() => {
        expect(screen.getByText('testuser')).toBeInTheDocument();
      });

      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      expect(screen.getByText('user')).toBeInTheDocument();
    });

    test('displays admin badge for admin users', async () => {
      const adminProfile = {
        ...mockProfileData,
        user: { ...mockProfileData.user, role: 'admin' },
      };

      apiService.user.getProfile.mockResolvedValue({
        data: { data: adminProfile },
      });

      renderDashboardPage();

      await waitFor(() => {
        expect(screen.getByText('admin')).toBeInTheDocument();
      });
    });

    test('renders AvatarUpload component', async () => {
      renderDashboardPage();

      await waitFor(() => {
        expect(screen.getByTestId('avatar-upload')).toBeInTheDocument();
      });
    });
  });

  describe('Activity Log', () => {
    test('displays recent activity table', async () => {
      renderDashboardPage();

      await waitFor(() => {
        expect(screen.getByText(/recent activity/i)).toBeInTheDocument();
      });

      expect(screen.getByText('User logged in')).toBeInTheDocument();
    });

    test('displays message when no activity', async () => {
      const profileNoActivity = {
        ...mockProfileData,
        activity: [],
      };

      apiService.user.getProfile.mockResolvedValue({
        data: { data: profileNoActivity },
      });

      renderDashboardPage();

      await waitFor(() => {
        expect(screen.getByText(/no activity logged yet/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('displays error message when profile fetch fails', async () => {
      const errorMessage = 'Failed to load dashboard data';
      apiService.user.getProfile.mockRejectedValue({
        response: {
          data: {
            error: errorMessage,
          },
        },
      });

      renderDashboardPage();

      await waitFor(() => {
        expect(screen.getByText(/error loading dashboard/i)).toBeInTheDocument();
      });

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    test('displays retry button on error', async () => {
      apiService.user.getProfile.mockRejectedValue(
        new Error('Network error')
      );

      renderDashboardPage();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });
    });

    test('retries fetching data when retry button clicked', async () => {
      // First call fails
      apiService.user.getProfile
        .mockRejectedValueOnce(new Error('Network error'))
        // Second call succeeds
        .mockResolvedValueOnce({
          data: { data: mockProfileData },
        });

      renderDashboardPage();

      await waitFor(() => {
        expect(screen.getByText(/error loading dashboard/i)).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('testuser')).toBeInTheDocument();
      });

      expect(apiService.user.getProfile).toHaveBeenCalledTimes(2);
    });
  });

  describe('API Calls', () => {
    test('fetches profile data on mount', async () => {
      renderDashboardPage();

      await waitFor(() => {
        expect(apiService.user.getProfile).toHaveBeenCalledTimes(1);
      });
    });

    test('fetches security data on mount', async () => {
      renderDashboardPage();

      await waitFor(() => {
        expect(apiService.security.getSessions).toHaveBeenCalledTimes(1);
        expect(apiService.security.getUnacknowledgedCount).toHaveBeenCalledTimes(1);
        expect(apiService.security.getLoginStats).toHaveBeenCalledWith(7);
      });
    });
  });
});
