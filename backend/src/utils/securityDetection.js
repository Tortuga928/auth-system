/**
 * Security Detection Utilities
 *
 * Story 9.3: Login History & Security Events
 * Detects suspicious activity and generates security alerts
 */

const LoginAttempt = require('../models/LoginAttempt');
const SecurityEvent = require('../models/SecurityEvent');
const Session = require('../models/Session');
const templateEmailService = require('../services/templateEmailService');
const UserModel = require('../models/User');

/**
 * Detect if login is from a new location
 * @param {number} userId - User ID
 * @param {string} currentLocation - Current location string
 * @returns {Promise<boolean>} True if location is new
 */
async function detectNewLocation(userId, currentLocation) {
  if (!currentLocation || currentLocation === 'Unknown') {
    return false; // Can't determine if location data unavailable
  }

  try {
    // Get recent successful login attempts (last 30 days)
    const recentLogins = await LoginAttempt.findByUserId(userId, {
      limit: 100,
      successOnly: true,
    });

    // If no previous logins, it's the first login (not "new")
    if (recentLogins.length <= 1) {
      return false;
    }

    // Check if this location has been seen before
    const hasSeenLocation = recentLogins.some(
      (login) => login.location === currentLocation
    );

    return !hasSeenLocation;
  } catch (error) {
    console.error('Error detecting new location:', error);
    return false;
  }
}

/**
 * Detect brute force attack (multiple failed login attempts)
 * @param {string} email - Email address
 * @param {number} threshold - Number of failures to trigger alert (default: 5)
 * @param {number} minutesWindow - Time window in minutes (default: 15)
 * @returns {Promise<Object>} Detection result with count
 */
async function detectBruteForce(email, threshold = 5, minutesWindow = 15) {
  try {
    const failureCount = await LoginAttempt.countRecentFailures(email, minutesWindow);

    return {
      detected: failureCount >= threshold,
      failureCount,
      threshold,
      minutesWindow,
    };
  } catch (error) {
    console.error('Error detecting brute force:', error);
    return {
      detected: false,
      failureCount: 0,
      threshold,
      minutesWindow,
    };
  }
}

/**
 * Detect if login is from a new device
 * @param {number} userId - User ID
 * @param {string} deviceFingerprint - Device fingerprint (combination of browser + OS + device_type)
 * @returns {Promise<boolean>} True if device is new
 */
async function detectNewDevice(userId, deviceFingerprint) {
  if (!deviceFingerprint) {
    return false;
  }

  try {
    // Get recent sessions (last 60 days)
    const recentSessions = await Session.findByUserId(userId, false); // include inactive

    // If no previous sessions, it's the first device (not "new")
    if (recentSessions.length <= 1) {
      return false;
    }

    // Check if this device fingerprint has been seen before
    const hasSeenDevice = recentSessions.some((session) => {
      const sessionFingerprint = `${session.browser}|${session.os}|${session.device_type}`;
      return sessionFingerprint === deviceFingerprint;
    });

    return !hasSeenDevice;
  } catch (error) {
    console.error('Error detecting new device:', error);
    return false;
  }
}

/**
 * Generate device fingerprint for comparison
 * @param {string} browser - Browser name
 * @param {string} os - Operating system
 * @param {string} deviceType - Device type
 * @returns {string} Device fingerprint
 */
function generateDeviceFingerprint(browser, os, deviceType) {
  return `${browser || 'unknown'}|${os || 'unknown'}|${deviceType || 'unknown'}`;
}

/**
 * Create security event if not duplicate
 * @param {Object} eventData - Event data
 * @param {number} dedupeMinutes - Minutes to check for duplicates (default: 60)
 * @returns {Promise<Object|null>} Created event or null if duplicate
 */
async function createSecurityEvent(eventData, dedupeMinutes = 60) {
  try {
    // Check if similar event already exists recently (prevent spam)
    const hasSimilar = await SecurityEvent.hasRecentSimilarEvent(
      eventData.user_id,
      eventData.event_type,
      dedupeMinutes
    );

    if (hasSimilar) {
      console.log(
        `Skipping duplicate security event: ${eventData.event_type} for user ${eventData.user_id}`
      );
      return null;
    }

    // Create the event
    const event = await SecurityEvent.create(eventData);
    return event;
  } catch (error) {
    console.error('Error creating security event:', error);
    return null;
  }
}

/**
 * Check for and create security events based on login
 * @param {Object} params - Parameters
 * @param {number} params.userId - User ID
 * @param {string} params.email - User email
 * @param {boolean} params.success - Whether login was successful
 * @param {string} params.ipAddress - IP address
 * @param {string} params.location - Location string
 * @param {string} params.browser - Browser name
 * @param {string} params.os - Operating system
 * @param {string} params.deviceType - Device type
 * @returns {Promise<Array>} Array of created security events
 */
async function checkLoginSecurity(params) {
  const {
    userId,
    email,
    success,
    ipAddress,
    location,
    browser,
    os,
    deviceType,
  } = params;

  const events = [];

  try {
    // Only check these for successful logins
    if (success && userId) {
      // Check for new location
      const isNewLocation = await detectNewLocation(userId, location);
      if (isNewLocation) {
        const event = await createSecurityEvent({
          user_id: userId,
          event_type: 'login_from_new_location',
          description: `Login detected from a new location: ${location}`,
          severity: 'warning',
          metadata: {
            location,
            ip_address: ipAddress,
            browser,
            os,
            device_type: deviceType,
          },
          ip_address: ipAddress,
        });
        if (event) events.push(event);
      }

      // Check for new device
      const deviceFingerprint = generateDeviceFingerprint(browser, os, deviceType);
      const isNewDevice = await detectNewDevice(userId, deviceFingerprint);
      if (isNewDevice) {
        const event = await createSecurityEvent({
          user_id: userId,
          event_type: 'login_from_new_device',
          description: `Login detected from a new device: ${browser} on ${os}`,
          severity: 'info',
          metadata: {
            browser,
            os,
            device_type: deviceType,
            device_fingerprint: deviceFingerprint,
            ip_address: ipAddress,
            location,
          },
          ip_address: ipAddress,
        });
        if (event) events.push(event);

        // Send new device login alert email (non-blocking)
        try {
          const userForEmail = await UserModel.findById(userId);
          if (userForEmail) {
            const deviceDesc = (browser || 'Unknown') + ' on ' + (os || 'Unknown');
            templateEmailService.sendNewDeviceLoginEmail(userForEmail.email, userForEmail.username || userForEmail.email, {
              deviceInfo: deviceDesc,
              location: location || 'Unknown',
              ipAddress: ipAddress || 'Unknown',
            }).catch(err => console.error('Failed to send new device login email:', err.message));
          }
        } catch (emailErr) {
          console.error('Error getting user for new device email:', emailErr.message);
        }
      }
    }

    // Check for brute force attempts (for both success and failure)
    const bruteForceResult = await detectBruteForce(email);
    if (bruteForceResult.detected) {
      // Try to find user ID from email for the event
      const User = require('../models/User');
      const user = await User.findByEmail(email);

      if (user) {
        const event = await createSecurityEvent(
          {
            user_id: user.id,
            event_type: 'brute_force_attempt',
            description: `Multiple failed login attempts detected: ${bruteForceResult.failureCount} failures in ${bruteForceResult.minutesWindow} minutes`,
            severity: 'critical',
            metadata: {
              email,
              failure_count: bruteForceResult.failureCount,
              time_window_minutes: bruteForceResult.minutesWindow,
              ip_address: ipAddress,
            },
            ip_address: ipAddress,
          },
          120 // Dedupe for 2 hours (longer than normal)
        );
        if (event) events.push(event);
      }
    }
  } catch (error) {
    console.error('Error checking login security:', error);
  }

  return events;
}

module.exports = {
  detectNewLocation,
  detectBruteForce,
  detectNewDevice,
  generateDeviceFingerprint,
  createSecurityEvent,
  checkLoginSecurity,
};
