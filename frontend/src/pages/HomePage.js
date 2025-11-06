/**
 * Home page component
 */

import React from 'react';

function HomePage() {
  return (
    <div className="container">
      <div className="card">
        <h1>Welcome to Authentication System</h1>
        <p className="mt-3">
          A full-stack authentication system with advanced security features including
          JWT authentication, email verification, OAuth2 social login, and multi-factor authentication (MFA).
        </p>

        <div className="mt-4">
          <h2>Features</h2>
          <ul className="mt-2" style={{ lineHeight: '1.8' }}>
            <li>✅ JWT-based authentication with refresh tokens</li>
            <li>✅ Email verification system</li>
            <li>✅ Password reset functionality</li>
            <li>✅ OAuth2 social login (Google, GitHub)</li>
            <li>✅ Multi-factor authentication (TOTP/2FA)</li>
            <li>✅ User dashboard and profile management</li>
            <li>✅ Session management with device tracking</li>
            <li>✅ Role-based access control (RBAC)</li>
            <li>✅ Admin panel for user management</li>
          </ul>
        </div>

        <div className="mt-4">
          <h2>Technology Stack</h2>
          <ul className="mt-2" style={{ lineHeight: '1.8' }}>
            <li><strong>Backend:</strong> Node.js with Express</li>
            <li><strong>Frontend:</strong> React</li>
            <li><strong>Database:</strong> PostgreSQL</li>
            <li><strong>Caching:</strong> Redis</li>
            <li><strong>Containerization:</strong> Docker & Docker Compose</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
