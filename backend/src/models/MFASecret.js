/**
 * MFASecret Model
 *
 * Database operations for mfa_secrets table
 * Handles Multi-Factor Authentication (MFA) using TOTP (Time-based One-Time Password)
 *
 * Features:
 * - TOTP secret generation and verification
 * - QR code generation for authenticator apps
 * - Backup codes generation and verification
 * - Brute-force protection with temporary locking
 * - Secret encryption/decryption
 */

const db = require('../db');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto');

// Encryption configuration
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = Buffer.from(process.env.MFA_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex'), 'hex').slice(0, 32);

class MFASecret {
  /**
   * Encrypt a secret using AES-256-GCM
   *
   * @param {string} text - Text to encrypt
   * @returns {string} Encrypted text with IV and auth tag (format: iv:authTag:encrypted)
   */
  static encrypt(text) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, ENCRYPTION_KEY, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt a secret using AES-256-GCM
   *
   * @param {string} encryptedText - Encrypted text (format: iv:authTag:encrypted)
   * @returns {string} Decrypted text
   */
  static decrypt(encryptedText) {
    const [ivHex, authTagHex, encrypted] = encryptedText.split(':');

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Generate a new TOTP secret
   *
   * @param {string} userEmail - User's email for QR code label
   * @param {string} issuer - Application name for QR code
   * @returns {Object} Secret object with base32 secret and otpauth URL
   */
  static generateTOTPSecret(userEmail, issuer = 'AuthSystem') {
    const secret = speakeasy.generateSecret({
      name: `${issuer} (${userEmail})`,
      issuer: issuer,
      length: 32,
    });

    return {
      secret: secret.base32,
      otpauthUrl: secret.otpauth_url,
    };
  }

  /**
   * Generate QR code data URL for TOTP secret
   *
   * @param {string} otpauthUrl - OTP Auth URL from generateTOTPSecret
   * @returns {Promise<string>} QR code as data URL
   */
  static async generateQRCode(otpauthUrl) {
    try {
      const dataUrl = await QRCode.toDataURL(otpauthUrl);
      return dataUrl;
    } catch (error) {
      throw new Error(`Failed to generate QR code: ${error.message}`);
    }
  }

  /**
   * Verify a TOTP token
   *
   * @param {string} token - 6-digit TOTP token from user
   * @param {string} encryptedSecret - Encrypted TOTP secret
   * @param {number} window - Time window for validation (default: 1 = ±30 seconds)
   * @returns {boolean} True if token is valid
   */
  static verifyTOTP(token, encryptedSecret, window = 1) {
    try {
      const secret = this.decrypt(encryptedSecret);

      const verified = speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: token,
        window: window,
      });

      return verified;
    } catch (error) {
      console.error('TOTP verification error:', error);
      return false;
    }
  }

  /**
   * Generate backup codes
   *
   * @param {number} count - Number of backup codes to generate (default: 10)
   * @returns {string[]} Array of backup codes
   */
  static generateBackupCodes(count = 10) {
    const codes = [];

    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric code
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      // Format as XXXX-XXXX for readability
      const formatted = `${code.slice(0, 4)}-${code.slice(4)}`;
      codes.push(formatted);
    }

    return codes;
  }

  /**
   * Hash a backup code for storage
   *
   * @param {string} code - Backup code to hash
   * @returns {string} Hashed backup code
   */
  static hashBackupCode(code) {
    return crypto.createHash('sha256').update(code).digest('hex');
  }

  /**
   * Verify a backup code
   *
   * @param {string} code - Backup code from user
   * @param {string[]} hashedCodes - Array of hashed backup codes from database
   * @returns {boolean} True if code matches one of the hashed codes
   */
  static verifyBackupCode(code, hashedCodes) {
    const hashedInput = this.hashBackupCode(code);
    return hashedCodes.includes(hashedInput);
  }

  /**
   * Create MFA secret for a user
   *
   * @param {number} userId - User ID
   * @param {string} secret - TOTP secret (will be encrypted)
   * @param {string[]} backupCodes - Array of backup codes (will be hashed)
   * @returns {Promise<Object>} Created MFA secret record
   */
  static async create(userId, secret, backupCodes) {
    const encryptedSecret = this.encrypt(secret);
    const hashedBackupCodes = backupCodes.map(code => this.hashBackupCode(code));

    const query = `
      INSERT INTO mfa_secrets (user_id, secret, backup_codes, enabled)
      VALUES ($1, $2, $3, $4)
      RETURNING id, user_id, enabled, enabled_at, created_at, updated_at
    `;

    const values = [userId, encryptedSecret, JSON.stringify(hashedBackupCodes), false];

    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      // Handle unique constraint violation
      if (error.code === '23505') {
        throw new Error('MFA secret already exists for this user');
      }
      throw error;
    }
  }

  /**
   * Find MFA secret by user ID
   *
   * @param {number} userId - User ID
   * @returns {Promise<Object|null>} MFA secret record or null if not found
   */
  static async findByUserId(userId) {
    const query = `
      SELECT id, user_id, secret, backup_codes, enabled, enabled_at,
             last_used_at, failed_attempts, locked_until, created_at, updated_at
      FROM mfa_secrets
      WHERE user_id = $1
    `;

    const result = await db.query(query, [userId]);
    return result.rows[0] || null;
  }

  /**
   * Update MFA secret
   *
   * @param {number} userId - User ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated MFA secret record
   */
  static async update(userId, updates) {
    const allowedFields = ['secret', 'backup_codes', 'enabled', 'enabled_at', 'last_used_at', 'failed_attempts', 'locked_until'];
    const fields = Object.keys(updates).filter(key => allowedFields.includes(key));

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    // Encrypt secret if provided
    if (updates.secret) {
      updates.secret = this.encrypt(updates.secret);
    }

    // Hash backup codes if provided
    if (updates.backup_codes && Array.isArray(updates.backup_codes)) {
      updates.backup_codes = JSON.stringify(
        updates.backup_codes.map(code => this.hashBackupCode(code))
      );
    }

    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    const values = [userId, ...fields.map(field => updates[field])];

    const query = `
      UPDATE mfa_secrets
      SET ${setClause}, updated_at = NOW()
      WHERE user_id = $1
      RETURNING id, user_id, enabled, enabled_at, last_used_at, failed_attempts, locked_until, created_at, updated_at
    `;

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      throw new Error('MFA secret not found');
    }

    return result.rows[0];
  }

  /**
   * Enable MFA for a user
   *
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Updated MFA secret record
   */
  static async enable(userId) {
    return this.update(userId, {
      enabled: true,
      enabled_at: new Date(),
      failed_attempts: 0,
      locked_until: null,
    });
  }

  /**
   * Disable MFA for a user
   *
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Updated MFA secret record
   */
  static async disable(userId) {
    return this.update(userId, {
      enabled: false,
      enabled_at: null,
      failed_attempts: 0,
      locked_until: null,
    });
  }

  /**
   * Record successful MFA verification
   *
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Updated MFA secret record
   */
  static async recordSuccessfulVerification(userId) {
    return this.update(userId, {
      last_used_at: new Date(),
      failed_attempts: 0,
      locked_until: null,
    });
  }

  /**
   * Increment failed MFA attempts
   *
   * @param {number} userId - User ID
   * @param {number} maxAttempts - Maximum allowed attempts before locking (default: 5)
   * @param {number} lockDurationMinutes - Lock duration in minutes (default: 15)
   * @returns {Promise<Object>} Updated MFA secret record with lock status
   */
  static async incrementFailedAttempts(userId, maxAttempts = 5, lockDurationMinutes = 15) {
    const mfaSecret = await this.findByUserId(userId);

    if (!mfaSecret) {
      throw new Error('MFA secret not found');
    }

    const newFailedAttempts = (mfaSecret.failed_attempts || 0) + 1;
    const updates = { failed_attempts: newFailedAttempts };

    // Lock account if max attempts reached
    if (newFailedAttempts >= maxAttempts) {
      const lockUntil = new Date(Date.now() + lockDurationMinutes * 60 * 1000);
      updates.locked_until = lockUntil;
    }

    return this.update(userId, updates);
  }

  /**
   * Check if MFA is currently locked
   *
   * @param {number} userId - User ID
   * @returns {Promise<boolean>} True if locked
   */
  static async isLocked(userId) {
    const mfaSecret = await this.findByUserId(userId);

    if (!mfaSecret || !mfaSecret.locked_until) {
      return false;
    }

    const now = new Date();
    const lockUntil = new Date(mfaSecret.locked_until);

    // If lock has expired, reset failed attempts
    if (now > lockUntil) {
      await this.update(userId, {
        failed_attempts: 0,
        locked_until: null,
      });
      return false;
    }

    return true;
  }

  /**
   * Remove a used backup code
   *
   * @param {number} userId - User ID
   * @param {string} usedCode - Backup code that was used
   * @returns {Promise<Object>} Updated MFA secret record
   */
  static async removeUsedBackupCode(userId, usedCode) {
    const mfaSecret = await this.findByUserId(userId);

    if (!mfaSecret) {
      throw new Error('MFA secret not found');
    }

    const hashedBackupCodes = typeof mfaSecret.backup_codes === "string" ? JSON.parse(mfaSecret.backup_codes) : mfaSecret.backup_codes;
    const hashedUsedCode = this.hashBackupCode(usedCode);

    // Remove the used code
    const remainingCodes = hashedBackupCodes.filter(code => code !== hashedUsedCode);

    const query = `
      UPDATE mfa_secrets
      SET backup_codes = $1, updated_at = NOW()
      WHERE user_id = $2
      RETURNING id, user_id, enabled, enabled_at, last_used_at, created_at, updated_at
    `;

    const result = await db.query(query, [JSON.stringify(remainingCodes), userId]);
    return result.rows[0];
  }

  /**
   * Delete MFA secret for a user
   *
   * @param {number} userId - User ID
   * @returns {Promise<boolean>} True if deleted
   */
  static async delete(userId) {
    const query = 'DELETE FROM mfa_secrets WHERE user_id = $1';
    const result = await db.query(query, [userId]);
    return result.rowCount > 0;
  }
}

module.exports = MFASecret;
