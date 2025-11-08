/**
 * LinkedProviders Component
 * 
 * Displays and manages linked OAuth providers
 */

import React, { useState, useEffect } from 'react';
import apiService from '../services/api';

function LinkedProviders() {
  const [linkedProviders, setLinkedProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unlinkingProvider, setUnlinkingProvider] = useState(null);

  // Fetch linked providers on component mount
  useEffect(() => {
    fetchLinkedProviders();
  }, []);

  const fetchLinkedProviders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.oauth.getLinkedProviders();
      setLinkedProviders(response.data.data.linkedProviders || []);
    } catch (err) {
      setError(err.message || 'Failed to load linked providers');
      console.error('Error fetching linked providers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlink = async (provider) => {
    if (!window.confirm(`Are you sure you want to unlink your ${provider} account?`)) {
      return;
    }

    try {
      setUnlinkingProvider(provider);
      await apiService.oauth.unlinkProvider(provider);
      // Refresh the list after unlinking
      await fetchLinkedProviders();
      alert(`${provider} account unlinked successfully`);
    } catch (err) {
      alert(`Failed to unlink ${provider}: ${err.message}`);
      console.error('Error unlinking provider:', err);
    } finally {
      setUnlinkingProvider(null);
    }
  };

  const getProviderIcon = (provider) => {
    if (provider === 'google') {
      return (
        <svg width="20" height="20" viewBox="0 0 18 18">
          <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
          <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
          <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707 0-.593.102-1.17.282-1.709V4.958H.957C.347 6.173 0 7.548 0 9c0 1.452.348 2.827.957 4.042l3.007-2.335z"/>
          <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
        </svg>
      );
    } else if (provider === 'github') {
      return (
        <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
        </svg>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="card">
        <h3>Linked Accounts</h3>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <h3>Linked Accounts</h3>
        <div className="alert alert-danger">{error}</div>
        <button className="btn btn-secondary" onClick={fetchLinkedProviders}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="card">
      <h3>Linked Accounts</h3>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        Connect your social accounts to sign in with one click
      </p>

      {linkedProviders.length === 0 ? (
        <p style={{ color: '#999' }}>No accounts linked yet</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {linkedProviders.map((provider) => (
            <div
              key={provider.provider}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '15px',
                border: '1px solid #ddd',
                borderRadius: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {getProviderIcon(provider.provider)}
                <div>
                  <div style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>
                    {provider.provider}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    {provider.provider_email}
                  </div>
                  <div style={{ fontSize: '12px', color: '#999' }}>
                    Linked on {new Date(provider.linked_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <button
                className="btn btn-outline-danger btn-sm"
                onClick={() => handleUnlink(provider.provider)}
                disabled={unlinkingProvider === provider.provider}
              >
                {unlinkingProvider === provider.provider ? 'Unlinking...' : 'Unlink'}
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4">
        <p style={{ fontSize: '14px', color: '#666' }}>
          To link a new account, log out and sign in using that provider.
        </p>
      </div>
    </div>
  );
}

export default LinkedProviders;
