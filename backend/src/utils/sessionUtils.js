/**
 * Session Utilities
 *
 * Story 9.1: Enhanced Session Tracking & Metadata
 * Utilities for parsing user agents and extracting location information
 */

const UAParser = require('ua-parser-js');
const geoip = require('geoip-lite');

/**
 * Parse user agent string to extract browser, OS, and device information
 * @param {string} userAgentString - Raw user agent string from request
 * @returns {Object} Parsed user agent information
 */
function parseUserAgent(userAgentString) {
  if (!userAgentString) {
    return {
      browser: 'Unknown',
      os: 'Unknown',
      device_type: 'unknown',
    };
  }

  const parser = new UAParser(userAgentString);
  const result = parser.getResult();

  // Extract browser name and version
  const browserName = result.browser.name || 'Unknown';
  const browserVersion = result.browser.major || '';
  const browser = browserVersion ? `${browserName} ${browserVersion}` : browserName;

  // Extract OS name and version
  const osName = result.os.name || 'Unknown';
  const osVersion = result.os.version || '';
  const os = osVersion ? `${osName} ${osVersion}` : osName;

  // Determine device type
  let deviceType = 'desktop'; // default
  if (result.device.type === 'mobile') {
    deviceType = 'mobile';
  } else if (result.device.type === 'tablet') {
    deviceType = 'tablet';
  }

  return {
    browser,
    os,
    device_type: deviceType,
  };
}

/**
 * Get approximate location from IP address using geoip-lite
 * @param {string} ipAddress - IP address (IPv4 or IPv6)
 * @returns {string|null} Location string (e.g., "San Francisco, USA") or null if not found
 */
function getLocationFromIP(ipAddress) {
  if (!ipAddress) {
    return null;
  }

  // Skip localhost/private IPs
  if (
    ipAddress === '127.0.0.1' ||
    ipAddress === 'localhost' ||
    ipAddress === '::1' ||
    ipAddress.startsWith('192.168.') ||
    ipAddress.startsWith('10.') ||
    ipAddress.startsWith('172.')
  ) {
    return 'Local Network';
  }

  // Lookup IP address
  const geo = geoip.lookup(ipAddress);

  if (!geo) {
    return null;
  }

  // Build location string: "City, Country"
  const city = geo.city || null;
  const country = geo.country || null;

  if (city && country) {
    return `${city}, ${country}`;
  } else if (country) {
    return country;
  }

  return null;
}

/**
 * Generate a friendly device name from browser and OS
 * @param {string} browser - Browser name (e.g., "Chrome 120")
 * @param {string} os - Operating system (e.g., "Windows 10")
 * @returns {string} Friendly device name (e.g., "Chrome on Windows")
 */
function getDeviceName(browser, os) {
  if (!browser || !os) {
    return 'Unknown Device';
  }

  // Extract just the browser name (without version)
  const browserName = browser.split(' ')[0];

  // Extract just the OS name (without version)
  const osName = os.split(' ')[0];

  return `${browserName} on ${osName}`;
}

/**
 * Normalize IP address for consistent comparison
 * Removes IPv6-mapped IPv4 prefix (::ffff:) for comparison purposes
 * @param {string} ipAddress - IP address to normalize
 * @returns {string} Normalized IP address
 */
function normalizeIPAddress(ipAddress) {
  if (!ipAddress || ipAddress === 'Unknown') {
    return ipAddress;
  }

  // Remove IPv6-mapped IPv4 prefix (::ffff:)
  // Docker and some proxies add this prefix to IPv4 addresses
  if (ipAddress.startsWith('::ffff:')) {
    return ipAddress.substring(7); // Remove '::ffff:' prefix
  }

  return ipAddress;
}

/**
 * Extract client IP address from request
 * Handles proxies and load balancers (X-Forwarded-For, X-Real-IP)
 * @param {Object} req - Express request object
 * @returns {string} Client IP address
 */
function getClientIP(req) {
  // Check X-Forwarded-For header (proxy/load balancer)
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    // X-Forwarded-For can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim();
  }

  // Check X-Real-IP header (nginx)
  const realIP = req.headers['x-real-ip'];
  if (realIP) {
    return realIP.trim();
  }

  // Fall back to req.ip or req.connection.remoteAddress
  return req.ip || req.connection?.remoteAddress || 'Unknown';
}

/**
 * Extract all session metadata from request
 * Convenience function that combines all parsing utilities
 * @param {Object} req - Express request object
 * @returns {Object} Complete session metadata
 */
function extractSessionMetadata(req) {
  const userAgentString = req.headers['user-agent'] || '';
  const ipAddress = getClientIP(req);

  const { browser, os, device_type } = parseUserAgent(userAgentString);
  const location = getLocationFromIP(ipAddress);
  const device_name = getDeviceName(browser, os);

  return {
    ip_address: ipAddress,
    user_agent: userAgentString,
    browser,
    os,
    device_type,
    device_name,
    location,
    last_activity_at: new Date(),
  };
}

module.exports = {
  parseUserAgent,
  getLocationFromIP,
  getDeviceName,
  getClientIP,
  normalizeIPAddress,
  extractSessionMetadata,
};
