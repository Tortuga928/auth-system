/**
 * Admin Layout Component
 *
 * Provides shared layout for all admin pages including sidebar navigation,
 * header with user info, and main content area.
 */

import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import apiService from '../../services/api';

const AdminLayout = ({ children, title = 'Admin Panel' }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    // Get user from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      // Check if user is admin
      if (userData.role !== 'admin' && userData.role !== 'super_admin') {
        navigate('/dashboard');
        return;
      }
      setUser(userData);
    } else {
      navigate('/login');
    }
  }, [navigate]);

  // Base menu items for all admins
  const baseMenuItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/admin/users', label: 'Users', icon: '👥' },
    { path: '/admin/mfa-settings', label: 'MFA Settings', icon: '🔐' },
    { path: '/admin/audit-logs', label: 'Audit Logs', icon: '📋' },
  ];

  // Add Settings link for super admins only
  const menuItems = user?.role === 'super_admin'
    ? [...baseMenuItems, { path: '/settings/home', label: 'Settings', icon: '⚙️' }]
    : baseMenuItems;

  const isActive = (path) => location.pathname === path;

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
      width: sidebarCollapsed ? '60px' : '250px',
      backgroundColor: '#2c3e50',
      color: '#ecf0f1',
      transition: 'width 0.3s ease',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      height: '100vh',
      zIndex: 1000,
    },
    sidebarHeader: {
      padding: '20px',
      borderBottom: '1px solid #34495e',
      display: 'flex',
      alignItems: 'center',
      justifyContent: sidebarCollapsed ? 'center' : 'space-between',
    },
    logo: {
      fontSize: sidebarCollapsed ? '20px' : '18px',
      fontWeight: 'bold',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
    },
    collapseBtn: {
      background: 'none',
      border: 'none',
      color: '#ecf0f1',
      cursor: 'pointer',
      fontSize: '18px',
      padding: '5px',
    },
    nav: {
      flex: 1,
      padding: '20px 0',
    },
    navItem: {
      display: 'flex',
      padding: sidebarCollapsed ? '15px 20px' : '12px 20px',
      color: '#bdc3c7',
      textDecoration: 'none',
      transition: 'all 0.2s ease',
      alignItems: 'center',
      gap: '10px',
      fontSize: '14px',
    },
    navItemActive: {
      backgroundColor: '#34495e',
      color: '#3498db',
      borderLeft: '3px solid #3498db',
    },
    navIcon: {
      fontSize: '18px',
    },
    navLabel: {
      display: sidebarCollapsed ? 'none' : 'inline',
    },
    main: {
      flex: 1,
      marginLeft: sidebarCollapsed ? '60px' : '250px',
      transition: 'margin-left 0.3s ease',
      display: 'flex',
      flexDirection: 'column',
    },
    header: {
      backgroundColor: '#fff',
      padding: '15px 30px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#2c3e50',
      margin: 0,
    },
    headerUser: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    userBadge: {
      backgroundColor: user?.role === 'super_admin' ? '#9b59b6' : '#3498db',
      color: '#fff',
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: 'bold',
      textTransform: 'uppercase',
    },
    backLink: {
      color: '#7f8c8d',
      textDecoration: 'none',
      fontSize: '14px',
    },
    logoutButton: {
      backgroundColor: '#e74c3c',
      color: '#fff',
      border: 'none',
      padding: '8px 16px',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'background-color 0.2s ease',
      marginLeft: '10px',
    },
    logoutButtonHover: {
      backgroundColor: '#c0392b',
    },
    content: {
      flex: 1,
      padding: '30px',
    },
    footer: {
      backgroundColor: '#fff',
      padding: '15px 30px',
      borderTop: '1px solid #ecf0f1',
      fontSize: '12px',
      color: '#7f8c8d',
      textAlign: 'center',
    },
  };

  if (!user) {
    return <div style={{ padding: '50px', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <span style={styles.logo}>
            {sidebarCollapsed ? '🔐' : '🔐 Admin Panel'}
          </span>
          {!sidebarCollapsed && (
            <button
              style={styles.collapseBtn}
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              title="Collapse sidebar"
            >
              ◀
            </button>
          )}
          {sidebarCollapsed && (
            <button
              style={styles.collapseBtn}
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              title="Expand sidebar"
            >
              ▶
            </button>
          )}
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
              title={sidebarCollapsed ? item.label : ''}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              <span style={styles.navLabel}>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div style={styles.main}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.headerTitle}>{title}</h1>
            <Link to="/dashboard" style={styles.backLink}>
              ← Back to User Dashboard
            </Link>
          </div>
          <div style={styles.headerUser}>
            <span>{user.username || user.email}</span>
            <span style={styles.userBadge}>{user.role}</span>
            <button
              onClick={handleLogout}
              style={styles.logoutButton}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#c0392b'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#e74c3c'}
              title="Sign out and invalidate all sessions"
            >
              Sign Out
            </button>
          </div>
        </header>

        <main style={styles.content}>{children}</main>

        <footer style={styles.footer}>
          <p>Admin Panel v1.0.0 | Authentication System &copy; 2025</p>
        </footer>
      </div>
    </div>
  );
};

export default AdminLayout;
