/**
 * Settings Layout Component
 *
 * Provides shared layout for all settings pages including sidebar navigation,
 * header with user info, and main content area.
 * Restricted to Super Admin users only.
 */

import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import apiService from '../../services/api';

const SettingsLayout = ({ children, title = 'Settings' }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Get user from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      // Check if user is super admin - Settings is restricted to super admin only
      if (userData.role !== 'super_admin') {
        navigate('/admin/dashboard');
        return;
      }
      setUser(userData);
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const menuItems = [
    { path: '/settings/home', label: 'Home', icon: '🏠', description: 'Overview and warnings' },
    { path: '/settings/email', label: 'Email', icon: '📧', description: 'Email service configuration' },
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    try {
      await apiService.auth.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  const styles = {
    container: {
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: '#f5f6fa',
    },
    sidebar: {
      width: '220px',
      backgroundColor: '#1a1a2e',
      color: '#eee',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      height: '100vh',
      zIndex: 1000,
    },
    sidebarHeader: {
      padding: '20px',
      borderBottom: '1px solid #2d2d44',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    logo: {
      fontSize: '18px',
      fontWeight: 'bold',
    },
    nav: {
      flex: 1,
      padding: '20px 0',
    },
    navItem: {
      display: 'flex',
      padding: '14px 20px',
      color: '#aaa',
      textDecoration: 'none',
      transition: 'all 0.2s ease',
      alignItems: 'center',
      gap: '12px',
      fontSize: '14px',
      borderLeft: '3px solid transparent',
    },
    navItemActive: {
      backgroundColor: '#2d2d44',
      color: '#6c5ce7',
      borderLeft: '3px solid #6c5ce7',
    },
    navItemHover: {
      backgroundColor: '#242442',
      color: '#ddd',
    },
    navIcon: {
      fontSize: '18px',
    },
    navLabel: {
      fontWeight: '500',
    },
    navDescription: {
      fontSize: '11px',
      color: '#777',
      marginTop: '2px',
    },
    backLink: {
      padding: '15px 20px',
      borderTop: '1px solid #2d2d44',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      color: '#888',
      textDecoration: 'none',
      fontSize: '13px',
      transition: 'all 0.2s ease',
    },
    main: {
      flex: 1,
      marginLeft: '220px',
      display: 'flex',
      flexDirection: 'column',
    },
    header: {
      backgroundColor: '#fff',
      padding: '15px 30px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: '22px',
      fontWeight: '600',
      color: '#2c3e50',
      margin: 0,
    },
    headerBreadcrumb: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '12px',
      color: '#888',
      marginTop: '4px',
    },
    headerUser: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    userBadge: {
      backgroundColor: '#6c5ce7',
      color: '#fff',
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '11px',
      fontWeight: 'bold',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
    logoutButton: {
      backgroundColor: '#e74c3c',
      color: '#fff',
      border: 'none',
      padding: '8px 16px',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: '500',
      transition: 'background-color 0.2s ease',
      marginLeft: '10px',
    },
    content: {
      flex: 1,
      padding: '30px',
    },
    footer: {
      backgroundColor: '#fff',
      padding: '12px 30px',
      borderTop: '1px solid #ecf0f1',
      fontSize: '12px',
      color: '#999',
      textAlign: 'center',
    },
  };

  if (!user) {
    return (
      <div style={{ padding: '50px', textAlign: 'center', color: '#666' }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <span style={{ fontSize: '22px' }}>⚙️</span>
          <span style={styles.logo}>Settings</span>
        </div>

        <nav style={styles.nav}>
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                ...styles.navItem,
                ...(isActive(item.path) ? styles.navItemActive : {}),
              }}
              title={item.description}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              <div>
                <div style={styles.navLabel}>{item.label}</div>
                <div style={styles.navDescription}>{item.description}</div>
              </div>
            </Link>
          ))}
        </nav>

        <Link to="/admin/dashboard" style={styles.backLink}>
          ← Back to Admin Panel
        </Link>
      </aside>

      {/* Main Content */}
      <div style={styles.main}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.headerTitle}>{title}</h1>
            <div style={styles.headerBreadcrumb}>
              <Link to="/admin/dashboard" style={{ color: '#888', textDecoration: 'none' }}>
                Admin
              </Link>
              <span>/</span>
              <span style={{ color: '#6c5ce7' }}>Settings</span>
            </div>
          </div>
          <div style={styles.headerUser}>
            <span style={{ fontSize: '14px', color: '#555' }}>{user.username || user.email}</span>
            <span style={styles.userBadge}>{user.role}</span>
            <button
              onClick={handleLogout}
              style={styles.logoutButton}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#c0392b'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#e74c3c'}
              title="Sign out"
            >
              Sign Out
            </button>
          </div>
        </header>

        <main style={styles.content}>{children}</main>

        <footer style={styles.footer}>
          <p style={{ margin: 0 }}>System Settings | Super Admin Access Only</p>
        </footer>
      </div>
    </div>
  );
};

export default SettingsLayout;
