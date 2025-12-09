/**
 * Grace Period Warning Banner
 *
 * Displays a warning banner for users who are in a grace period for MFA setup.
 * Shows the number of days remaining and provides a link to set up MFA.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const styles = {
  banner: {
    backgroundColor: '#fff3cd',
    borderBottom: '1px solid #ffc107',
    padding: '12px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    flexWrap: 'wrap',
  },
  bannerUrgent: {
    backgroundColor: '#f8d7da',
    borderBottom: '1px solid #f5c6cb',
  },
  content: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flex: 1,
  },
  icon: {
    fontSize: '24px',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    margin: 0,
    fontSize: '14px',
    fontWeight: '600',
    color: '#856404',
  },
  titleUrgent: {
    color: '#721c24',
  },
  description: {
    margin: '4px 0 0 0',
    fontSize: '13px',
    color: '#856404',
  },
  descriptionUrgent: {
    color: '#721c24',
  },
  actions: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  setupButton: {
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '4px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  dismissButton: {
    backgroundColor: 'transparent',
    border: 'none',
    padding: '4px 8px',
    cursor: 'pointer',
    fontSize: '18px',
    color: '#856404',
    opacity: 0.7,
  },
  dismissButtonUrgent: {
    color: '#721c24',
  },
  countdown: {
    fontWeight: '700',
    fontSize: '14px',
  },
};

function GracePeriodWarningBanner() {
  const navigate = useNavigate();
  const [gracePeriodData, setGracePeriodData] = useState(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check for grace period warning in localStorage
    const warningData = localStorage.getItem('mfaGracePeriodWarning');
    if (warningData) {
      try {
        const data = JSON.parse(warningData);
        setGracePeriodData(data);

        // Check if already dismissed for today
        const dismissedDate = localStorage.getItem('mfaGracePeriodDismissed');
        if (dismissedDate === new Date().toDateString()) {
          setIsDismissed(true);
        }
      } catch {
        // Invalid data, clear it
        localStorage.removeItem('mfaGracePeriodWarning');
      }
    }
  }, []);

  const handleDismiss = () => {
    // Remember dismissal for today only
    localStorage.setItem('mfaGracePeriodDismissed', new Date().toDateString());
    setIsDismissed(true);
  };

  const handleSetupMFA = () => {
    navigate('/mfa-settings');
  };

  // Do not render if no grace period data, already dismissed, or grace period expired
  if (!gracePeriodData || isDismissed) {
    return null;
  }

  const daysRemaining = gracePeriodData.daysRemaining;
  const isUrgent = daysRemaining <= 3;

  // Calculate end date text
  const endDate = gracePeriodData.gracePeriodEnd
    ? new Date(gracePeriodData.gracePeriodEnd).toLocaleDateString()
    : null;

  // Determine message based on urgency
  let message = '';
  if (daysRemaining === 0) {
    message = 'Your grace period expires today!';
  } else if (daysRemaining === 1) {
    message = 'Your grace period expires tomorrow!';
  } else if (daysRemaining <= 3) {
    message = `Only ${daysRemaining} days left to set up MFA!`;
  } else {
    message = `You have ${daysRemaining} days to set up MFA.`;
  }

  return (
    <div style={{ ...styles.banner, ...(isUrgent ? styles.bannerUrgent : {}) }}>
      <div style={styles.content}>
        <span style={styles.icon}>{isUrgent ? '⚠️' : '🔐'}</span>
        <div style={styles.textContainer}>
          <h4 style={{ ...styles.title, ...(isUrgent ? styles.titleUrgent : {}) }}>
            MFA Setup Required
          </h4>
          <p style={{ ...styles.description, ...(isUrgent ? styles.descriptionUrgent : {}) }}>
            {message}
            {endDate && ` (Deadline: ${endDate})`}
            {' '}After your grace period expires, you will be required to set up two-factor authentication before accessing the application.
          </p>
        </div>
      </div>
      <div style={styles.actions}>
        <button style={styles.setupButton} onClick={handleSetupMFA}>
          Set Up MFA Now
        </button>
        {!isUrgent && (
          <button
            style={{ ...styles.dismissButton, ...(isUrgent ? styles.dismissButtonUrgent : {}) }}
            onClick={handleDismiss}
            title="Remind me later"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

export default GracePeriodWarningBanner;
