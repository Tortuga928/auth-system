/**
 * Main App component with routing
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProfileEditPage from './pages/ProfileEditPage';
import ActivityLogPage from './pages/ActivityLogPage';
import AccountSettingsPage from './pages/AccountSettingsPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import OAuthCallbackPage from './pages/OAuthCallbackPage';
import MFASettingsPage from './pages/MFASettingsPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <nav className="navbar">
          <div className="container">
            <div className="navbar-brand">
              <Link to="/">🔐 Auth System</Link>
            </div>
            <div className="navbar-menu">
              <Link to="/" className="nav-link">Home</Link>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/register" className="nav-link">Register</Link>
              <Link to="/dashboard" className="nav-link">Dashboard</Link>
              <Link to="/mfa-settings" className="nav-link">2FA Settings</Link>
            </div>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/profile" element={<ProfileEditPage />} />
            <Route path="/activity-log" element={<ActivityLogPage />} />
            <Route path="/settings" element={<AccountSettingsPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
            <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
            <Route path="/mfa-settings" element={<MFASettingsPage />} />
          </Routes>
        </main>

        <footer className="footer">
          <div className="container text-center">
            <p>&copy; 2025 Authentication System. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
