/**
 * Password Utilities
 *
 * Provides secure password hashing and validation using bcrypt.
 *
 * Features:
 * - Password strength validation
 * - Bcrypt hashing with configurable salt rounds
 * - Password comparison for authentication
 * - Never logs or exposes plain-text passwords
 */

const bcrypt = require('bcrypt');

// Configuration
const SALT_ROUNDS = 10;

/**
 * Password strength requirements
 */
const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: true,
};

/**
 * Validates password strength
 *
 * @param {string} password - Plain text password to validate
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
function validatePasswordStrength(password) {
  const errors = [];

  if (!password) {
    return {
      isValid: false,
      errors: ['Password is required'],
    };
  }

  // Check minimum length
  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(`Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long`);
  }

  // Check for uppercase letter
  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  // Check for lowercase letter
  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  // Check for number
  if (PASSWORD_REQUIREMENTS.requireNumber && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  // Check for special character
  if (PASSWORD_REQUIREMENTS.requireSpecialChar && !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*()_+-=[]{};\':"|,.<>/?)');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Hashes a plain text password using bcrypt
 *
 * @param {string} password - Plain text password to hash
 * @returns {Promise<string>} - Hashed password
 * @throws {Error} - If password is invalid or hashing fails
 */
async function hashPassword(password) {
  // Validate password strength
  const validation = validatePasswordStrength(password);
  if (!validation.isValid) {
    throw new Error(validation.errors.join('. '));
  }

  try {
    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    return hashedPassword;
  } catch (error) {
    throw new Error('Failed to hash password');
  }
}

/**
 * Compares a plain text password with a hashed password
 *
 * @param {string} password - Plain text password to compare
 * @param {string} hashedPassword - Hashed password from database
 * @returns {Promise<boolean>} - True if passwords match, false otherwise
 */
async function comparePassword(password, hashedPassword) {
  if (!password || !hashedPassword) {
    return false;
  }

  try {
    const isMatch = await bcrypt.compare(password, hashedPassword);
    return isMatch;
  } catch (error) {
    // Log error but don't expose details to caller
    console.error('Error comparing passwords:', error.message);
    return false;
  }
}

/**
 * Gets the current password requirements for display to users
 *
 * @returns {Object} - Password requirements object
 */
function getPasswordRequirements() {
  return { ...PASSWORD_REQUIREMENTS };
}

module.exports = {
  validatePasswordStrength,
  hashPassword,
  comparePassword,
  getPasswordRequirements,
  SALT_ROUNDS, // Export for testing purposes
};
