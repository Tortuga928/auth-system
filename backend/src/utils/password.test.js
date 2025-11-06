/**
 * Password Utilities Test Suite
 *
 * Tests password validation, hashing, and comparison functions
 */

const {
  validatePasswordStrength,
  hashPassword,
  comparePassword,
  getPasswordRequirements,
  SALT_ROUNDS,
} = require('./password');

describe('Password Utilities', () => {
  describe('validatePasswordStrength', () => {
    test('should reject empty password', () => {
      const result = validatePasswordStrength('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password is required');
    });

    test('should reject password shorter than 8 characters', () => {
      const result = validatePasswordStrength('Pass1!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    test('should reject password without uppercase letter', () => {
      const result = validatePasswordStrength('password123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    test('should reject password without lowercase letter', () => {
      const result = validatePasswordStrength('PASSWORD123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    test('should reject password without number', () => {
      const result = validatePasswordStrength('Password!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    test('should reject password without special character', () => {
      const result = validatePasswordStrength('Password123');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one special character (!@#$%^&*()_+-=[]{};\':"|,.<>/?)');
    });

    test('should accept strong password', () => {
      const result = validatePasswordStrength('SecurePass123!');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should accept password with various special characters', () => {
      const passwords = [
        'Pass123@word',
        'Pass123#word',
        'Pass123$word',
        'Pass123%word',
        'Pass123^word',
        'Pass123&word',
        'Pass123*word',
      ];

      passwords.forEach(password => {
        const result = validatePasswordStrength(password);
        expect(result.isValid).toBe(true);
      });
    });

    test('should return multiple errors for very weak password', () => {
      const result = validatePasswordStrength('pass');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('hashPassword', () => {
    test('should hash a valid password', async () => {
      const password = 'SecurePass123!';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(20);
      expect(hash).toMatch(/^\$2[aby]\$/); // bcrypt hash format
    });

    test('should reject weak password', async () => {
      await expect(hashPassword('weak')).rejects.toThrow();
    });

    test('should create different hashes for same password', async () => {
      const password = 'SecurePass123!';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2); // Different salts
    });

    test('should reject null password', async () => {
      await expect(hashPassword(null)).rejects.toThrow();
    });

    test('should reject undefined password', async () => {
      await expect(hashPassword(undefined)).rejects.toThrow();
    });
  });

  describe('comparePassword', () => {
    test('should return true for matching password', async () => {
      const password = 'SecurePass123!';
      const hash = await hashPassword(password);
      const isMatch = await comparePassword(password, hash);

      expect(isMatch).toBe(true);
    });

    test('should return false for non-matching password', async () => {
      const password = 'SecurePass123!';
      const wrongPassword = 'WrongPass123!';
      const hash = await hashPassword(password);
      const isMatch = await comparePassword(wrongPassword, hash);

      expect(isMatch).toBe(false);
    });

    test('should return false for empty password', async () => {
      const password = 'SecurePass123!';
      const hash = await hashPassword(password);
      const isMatch = await comparePassword('', hash);

      expect(isMatch).toBe(false);
    });

    test('should return false for empty hash', async () => {
      const isMatch = await comparePassword('SecurePass123!', '');
      expect(isMatch).toBe(false);
    });

    test('should return false for null password', async () => {
      const password = 'SecurePass123!';
      const hash = await hashPassword(password);
      const isMatch = await comparePassword(null, hash);

      expect(isMatch).toBe(false);
    });

    test('should return false for invalid hash format', async () => {
      const isMatch = await comparePassword('SecurePass123!', 'invalid-hash');
      expect(isMatch).toBe(false);
    });
  });

  describe('getPasswordRequirements', () => {
    test('should return password requirements object', () => {
      const requirements = getPasswordRequirements();

      expect(requirements).toBeDefined();
      expect(requirements.minLength).toBe(8);
      expect(requirements.requireUppercase).toBe(true);
      expect(requirements.requireLowercase).toBe(true);
      expect(requirements.requireNumber).toBe(true);
      expect(requirements.requireSpecialChar).toBe(true);
    });

    test('should return a copy not a reference', () => {
      const requirements1 = getPasswordRequirements();
      const requirements2 = getPasswordRequirements();

      requirements1.minLength = 12;

      expect(requirements2.minLength).toBe(8); // Not affected
    });
  });

  describe('Configuration', () => {
    test('should export SALT_ROUNDS', () => {
      expect(SALT_ROUNDS).toBe(10);
    });
  });
});
