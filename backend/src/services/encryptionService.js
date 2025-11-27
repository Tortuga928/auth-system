/**
 * Encryption Service
 *
 * AES-256 encryption for sensitive data like email service credentials.
 * Uses a 32-byte key from the EMAIL_ENCRYPTION_KEY environment variable.
 */

const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
const SALT_LENGTH = 32; // For key derivation

/**
 * Get the encryption key from environment variable
 * @returns {Buffer} 32-byte encryption key
 * @throws {Error} If EMAIL_ENCRYPTION_KEY is not set or invalid
 */
function getEncryptionKey() {
  const key = process.env.EMAIL_ENCRYPTION_KEY;

  if (!key) {
    throw new Error(
      'EMAIL_ENCRYPTION_KEY environment variable is not set. ' +
      'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }

  // If key is hex-encoded (64 chars), decode it
  if (key.length === 64 && /^[0-9a-fA-F]+$/.test(key)) {
    return Buffer.from(key, 'hex');
  }

  // If key is 32 characters, use it directly
  if (key.length === 32) {
    return Buffer.from(key, 'utf8');
  }

  // Otherwise, derive a key from the provided string
  return crypto.scryptSync(key, 'auth-system-salt', 32);
}

/**
 * Encrypt data using AES-256-GCM
 *
 * @param {Object|string} data - Data to encrypt (will be JSON stringified if object)
 * @returns {string} Encrypted data as base64 string (iv:authTag:ciphertext)
 * @throws {Error} If encryption fails
 */
function encrypt(data) {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);

    // Convert data to string if needed
    const plaintext = typeof data === 'object' ? JSON.stringify(data) : String(data);

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    // Encrypt
    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    // Get auth tag
    const authTag = cipher.getAuthTag();

    // Combine iv:authTag:ciphertext
    const result = [
      iv.toString('base64'),
      authTag.toString('base64'),
      encrypted,
    ].join(':');

    return result;
  } catch (error) {
    console.error('Encryption error:', error.message);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt data using AES-256-GCM
 *
 * @param {string} encryptedData - Encrypted data as base64 string (iv:authTag:ciphertext)
 * @param {boolean} parseJson - Whether to parse the decrypted data as JSON (default: true)
 * @returns {Object|string} Decrypted data
 * @throws {Error} If decryption fails
 */
function decrypt(encryptedData, parseJson = true) {
  try {
    const key = getEncryptionKey();

    // Split the encrypted data
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const [ivBase64, authTagBase64, ciphertext] = parts;
    const iv = Buffer.from(ivBase64, 'base64');
    const authTag = Buffer.from(authTagBase64, 'base64');

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    // Decrypt
    let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    // Parse JSON if requested
    if (parseJson) {
      try {
        return JSON.parse(decrypted);
      } catch {
        return decrypted;
      }
    }

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error.message);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Verify that the encryption key is configured correctly
 *
 * @returns {boolean} True if encryption is properly configured
 */
function verifyConfiguration() {
  try {
    getEncryptionKey();
    // Test encrypt/decrypt cycle
    const testData = { test: 'verification' };
    const encrypted = encrypt(testData);
    const decrypted = decrypt(encrypted);
    return decrypted.test === testData.test;
  } catch (error) {
    console.error('Encryption configuration error:', error.message);
    return false;
  }
}

/**
 * Mask sensitive data for display (e.g., API keys)
 *
 * @param {string} value - Sensitive value to mask
 * @param {number} visibleChars - Number of characters to show at start and end (default: 4)
 * @returns {string} Masked value (e.g., "SG.x****xxxx")
 */
function maskSensitiveValue(value, visibleChars = 4) {
  if (!value || typeof value !== 'string') {
    return '••••••••';
  }

  if (value.length <= visibleChars * 2) {
    return '••••••••';
  }

  const start = value.substring(0, visibleChars);
  const end = value.substring(value.length - visibleChars);
  const maskLength = Math.min(value.length - visibleChars * 2, 8);
  const mask = '•'.repeat(maskLength);

  return `${start}${mask}${end}`;
}

/**
 * Redact credentials from an object for logging/audit purposes
 *
 * @param {Object} credentials - Credentials object
 * @returns {Object} Credentials with values masked
 */
function redactCredentials(credentials) {
  if (!credentials || typeof credentials !== 'object') {
    return {};
  }

  const redacted = {};
  for (const [key, value] of Object.entries(credentials)) {
    redacted[key] = maskSensitiveValue(value);
  }
  return redacted;
}

module.exports = {
  encrypt,
  decrypt,
  verifyConfiguration,
  maskSensitiveValue,
  redactCredentials,
};
