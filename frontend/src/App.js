/**
 * Main App component with routing
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
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
// Story 9.5: Device Management UI
import DeviceManagementPage from './pages/DeviceManagementPage';
import LoginHistoryPage from './pages/LoginHistoryPage';
import SecurityAlertsPage from './pages/SecurityAlertsPage';
// Story 10.5: Admin Panel UI
import AdminDashboard from './pages/admin/AdminDashboard';
import UsersManagement from './pages/admin/UsersManagement';
import UserDetailPage from './pages/admin/UserDetailPage';
import AuditLogs from './pages/admin/AuditLogs';
// Phase 5: Admin MFA Settings
import AdminMFASettings from './pages/admin/MFASettings';
// Settings (Super Admin only)
import SettingsHome from './pages/settings/SettingsHome';
import EmailSettings from './pages/settings/EmailSettings';
import apiService from './services/api';
import './App.css';

function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  // Check login status on mount and location change
  useEffect(() => {
    const authToken = localStorage.getItem('authToken');
    const userData = localStorage.getItem('user');
    setIsLoggedIn(!!authToken);
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        setUser(null);
      }
    }
  }, [location]);

  const handleLogout = async () => {
    try {
      // Call backend to invalidate all active sessions
      await apiService.auth.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with client-side logout even if API fails
    } finally {
      // Always clear client-side auth state
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      setIsLoggedIn(false);
      setUser(null);
      navigate('/login');
    }
  };

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-brand">
          <Link to="/">🔐 Auth System</Link>
        </div>
        <div className="navbar-menu">
          <Link to="/" className="nav-link">Home</Link>
          {!isLoggedIn && <Link to="/login" className="nav-link">Login</Link>}
          {!isLoggedIn && <Link to="/register" className="nav-link">Register</Link>}
          {isLoggedIn && <Link to="/dashboard" className="nav-link">Dashboard</Link>}
          {isLoggedIn && <Link to="/mfa-settings" className="nav-link">2FA Settings</Link>}
          {isLoggedIn && <Link to="/devices" className="nav-link">Devices</Link>}
          {isLoggedIn && <Link to="/login-history" className="nav-link">Login History</Link>}
          {isLoggedIn && <Link to="/security-alerts" className="nav-link">Security</Link>}
          {isLoggedIn && (user?.role === 'admin' || user?.role === 'super_admin') && (
            <Link to="/admin/dashboard" className="nav-link">Admin</Link>
          )}
          {isLoggedIn && user?.role === 'super_admin' && (
            <Link to="/settings/home" className="nav-link">Settings</Link>
          )}
          {isLoggedIn && (
            <button onClick={handleLogout} className="nav-link logout-button">
              Sign Out
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <div className="app">
        <Navigation />

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
            {/* Story 9.5: Device Management UI */}
            <Route path="/devices" element={<DeviceManagementPage />} />
            <Route path="/login-history" element={<LoginHistoryPage />} />
            {/* Story 10.5: Admin Panel UI */}
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<UsersManagement />} />
            <Route path="/admin/users/:id" element={<UserDetailPage />} />
            <Route path="/admin/audit-logs" element={<AuditLogs />} />
            {/* Phase 5: Admin MFA Settings */}
            <Route path="/admin/mfa-settings" element={<AdminMFASettings />} />
            <Route path="/security-alerts" element={<SecurityAlertsPage />} />
            {/* Settings routes (Super Admin only) */}
            <Route path="/settings/home" element={<SettingsHome />} />
            <Route path="/settings/email" element={<EmailSettings />} />
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
