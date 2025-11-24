import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import HomePage from '../../pages/HomePage';

describe('HomePage', () => {
  const renderHomePage = () => {
    return render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );
  };

  describe('Component Rendering', () => {
    test('renders welcome heading', () => {
      renderHomePage();

      expect(screen.getByRole('heading', { name: /welcome to authentication system/i })).toBeInTheDocument();
    });

    test('renders welcome description', () => {
      renderHomePage();

      expect(screen.getByText(/a full-stack authentication system with advanced security features/i)).toBeInTheDocument();
    });

    test('renders Features section', () => {
      renderHomePage();

      expect(screen.getByRole('heading', { name: /^features$/i })).toBeInTheDocument();
    });

    test('renders Technology Stack section', () => {
      renderHomePage();

      expect(screen.getByRole('heading', { name: /technology stack/i })).toBeInTheDocument();
    });
  });

  describe('Features List', () => {
    test('displays JWT authentication feature', () => {
      renderHomePage();

      expect(screen.getByText(/jwt-based authentication with refresh tokens/i)).toBeInTheDocument();
    });

    test('displays email verification feature', () => {
      renderHomePage();

      expect(screen.getByText(/email verification system/i)).toBeInTheDocument();
    });

    test('displays password reset feature', () => {
      renderHomePage();

      expect(screen.getByText(/password reset functionality/i)).toBeInTheDocument();
    });

    test('displays OAuth2 social login feature', () => {
      renderHomePage();

      expect(screen.getByText(/oauth2 social login \(google, github\)/i)).toBeInTheDocument();
    });

    test('displays multi-factor authentication feature', () => {
      renderHomePage();

      expect(screen.getByText(/multi-factor authentication \(totp\/2fa\)/i)).toBeInTheDocument();
    });

    test('displays user dashboard feature', () => {
      renderHomePage();

      expect(screen.getByText(/user dashboard and profile management/i)).toBeInTheDocument();
    });

    test('displays session management feature', () => {
      renderHomePage();

      expect(screen.getByText(/session management with device tracking/i)).toBeInTheDocument();
    });

    test('displays RBAC feature', () => {
      renderHomePage();

      expect(screen.getByText(/role-based access control \(rbac\)/i)).toBeInTheDocument();
    });

    test('displays admin panel feature', () => {
      renderHomePage();

      expect(screen.getByText(/admin panel for user management/i)).toBeInTheDocument();
    });
  });

  describe('Technology Stack List', () => {
    test('displays backend technology', () => {
      renderHomePage();

      expect(screen.getByText(/backend:/i)).toBeInTheDocument();
      expect(screen.getByText(/node\.js with express/i)).toBeInTheDocument();
    });

    test('displays frontend technology', () => {
      renderHomePage();

      expect(screen.getByText(/frontend:/i)).toBeInTheDocument();
      expect(screen.getByText(/react/i)).toBeInTheDocument();
    });

    test('displays database technology', () => {
      renderHomePage();

      expect(screen.getByText(/database:/i)).toBeInTheDocument();
      expect(screen.getByText(/postgresql/i)).toBeInTheDocument();
    });

    test('displays caching technology', () => {
      renderHomePage();

      expect(screen.getByText(/caching:/i)).toBeInTheDocument();
      expect(screen.getByText(/redis/i)).toBeInTheDocument();
    });

    test('displays containerization technology', () => {
      renderHomePage();

      expect(screen.getByText(/containerization:/i)).toBeInTheDocument();
      expect(screen.getByText(/docker & docker compose/i)).toBeInTheDocument();
    });
  });
});
