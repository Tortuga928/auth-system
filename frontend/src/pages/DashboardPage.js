/**
 * Dashboard page component
 */

import React from 'react';

function DashboardPage() {
  return (
    <div className="container">
      <div className="card">
        <h1>Dashboard</h1>
        <p className="mt-2">Welcome to your dashboard!</p>

        <div className="alert alert-info mt-3">
          <strong>Note:</strong> This is a placeholder page.
          Authentication functionality will be implemented in future stories.
        </div>

        <div className="mt-4">
          <h2>Quick Stats</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
            <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
              <h3 style={{ fontSize: '2rem', color: '#007bff' }}>0</h3>
              <p>Active Sessions</p>
            </div>
            <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
              <h3 style={{ fontSize: '2rem', color: '#28a745' }}>0</h3>
              <p>Verified Devices</p>
            </div>
            <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
              <h3 style={{ fontSize: '2rem', color: '#ffc107' }}>0</h3>
              <p>Login Attempts</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
