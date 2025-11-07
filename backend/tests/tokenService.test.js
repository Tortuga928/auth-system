/**
 * Token Service Tests
 *
 * Tests for email verification and password reset token generation and validation
 */

const tokenService = require('../src/utils/tokenService');

describe('Token Service', () => {
  describe('generateToken', () => {
    test('TC-4.2-02: Token should be unique', () => {
      const token1 = tokenService.generateToken();
      const token2 = tokenService.generateToken();

      expect(token1).not.toBe(token2);
      expect(token1).toHaveLength(64); // 32 bytes = 64 hex characters
      expect(token2).toHaveLength(64);
    });

    test('Token should be cryptographically secure (hex string)', () => {
      const token = tokenService.generateToken();

      expect(token).toMatch(/^[0-9a-f]+$/); // Only hex characters
      expect(token).toHaveLength(64);
    });
  });

  describe('generateEmailVerificationToken', () => {
    test('TC-4.2-01: Should generate token with 24-hour expiration', () => {
      const result = tokenService.generateEmailVerificationToken();

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('expires');
      expect(result.token).toHaveLength(64);
      expect(result.expires).toBeInstanceOf(Date);

      // Check expiration is approximately 24 hours from now (within 1 minute tolerance)
      const now = new Date();
      const expectedExpiry = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const timeDiff = Math.abs(result.expires - expectedExpiry);

      expect(timeDiff).toBeLessThan(60000); // Less than 1 minute difference
    });
  });

  describe('generatePasswordResetToken', () => {
    test('Should generate token with 1-hour expiration', () => {
      const result = tokenService.generatePasswordResetToken();

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('expires');
      expect(result.token).toHaveLength(64);
      expect(result.expires).toBeInstanceOf(Date);

      // Check expiration is approximately 1 hour from now (within 1 minute tolerance)
      const now = new Date();
      const expectedExpiry = new Date(now.getTime() + 60 * 60 * 1000);
      const timeDiff = Math.abs(result.expires - expectedExpiry);

      expect(timeDiff).toBeLessThan(60000); // Less than 1 minute difference
    });
  });

  describe('isTokenExpired', () => {
    test('TC-4.2-03: Should return true for expired token', () => {
      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() - 1); // 1 hour ago

      expect(tokenService.isTokenExpired(pastDate)).toBe(true);
    });

    test('Should return false for valid token', () => {
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 1); // 1 hour from now

      expect(tokenService.isTokenExpired(futureDate)).toBe(false);
    });

    test('Should return true for null expiration', () => {
      expect(tokenService.isTokenExpired(null)).toBe(true);
      expect(tokenService.isTokenExpired(undefined)).toBe(true);
    });
  });

  describe('validateEmailVerificationToken', () => {
    test('TC-4.2-04: Valid token should pass validation', () => {
      const token = 'test-token-12345';
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 1);

      const result = tokenService.validateEmailVerificationToken(
        token,
        token,
        futureDate
      );

      expect(result.valid).toBe(true);
      expect(result.error).toBeNull();
    });

    test('TC-4.2-05: Expired token should fail validation', () => {
      const token = 'test-token-12345';
      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() - 1);

      const result = tokenService.validateEmailVerificationToken(
        token,
        token,
        pastDate
      );

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Token has expired');
    });

    test('Invalid token should fail validation', () => {
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 1);

      const result = tokenService.validateEmailVerificationToken(
        'wrong-token',
        'correct-token',
        futureDate
      );

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid token');
    });

    test('Missing token should fail validation', () => {
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 1);

      const result1 = tokenService.validateEmailVerificationToken(null, 'token', futureDate);
      const result2 = tokenService.validateEmailVerificationToken('token', null, futureDate);

      expect(result1.valid).toBe(false);
      expect(result1.error).toBe('Token is missing');
      expect(result2.valid).toBe(false);
      expect(result2.error).toBe('Token is missing');
    });
  });

  describe('validatePasswordResetToken', () => {
    test('Valid token should pass validation', () => {
      const token = 'reset-token-12345';
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 1);

      const result = tokenService.validatePasswordResetToken(
        token,
        token,
        futureDate
      );

      expect(result.valid).toBe(true);
      expect(result.error).toBeNull();
    });

    test('Expired token should fail validation', () => {
      const token = 'reset-token-12345';
      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() - 1);

      const result = tokenService.validatePasswordResetToken(
        token,
        token,
        pastDate
      );

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Token has expired');
    });
  });

  describe('hashToken', () => {
    test('Should generate consistent SHA256 hash', () => {
      const token = 'test-token-12345';
      const hash1 = tokenService.hashToken(token);
      const hash2 = tokenService.hashToken(token);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA256 produces 64 hex characters
      expect(hash1).toMatch(/^[0-9a-f]+$/);
    });

    test('Different tokens should produce different hashes', () => {
      const hash1 = tokenService.hashToken('token1');
      const hash2 = tokenService.hashToken('token2');

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('clearEmailVerificationToken', () => {
    test('Should return object with null values', () => {
      const result = tokenService.clearEmailVerificationToken();

      expect(result).toEqual({
        email_verification_token: null,
        email_verification_expires: null,
      });
    });
  });

  describe('clearPasswordResetToken', () => {
    test('Should return object with null values', () => {
      const result = tokenService.clearPasswordResetToken();

      expect(result).toEqual({
        password_reset_token: null,
        password_reset_expires: null,
      });
    });
  });
});
