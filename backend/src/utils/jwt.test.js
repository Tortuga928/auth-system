/**
 * JWT Utilities Test Suite
 *
 * Tests JWT token generation, validation, and helper functions
 */

// Load environment variables first
require('dotenv').config();

const {
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyToken,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  extractTokenFromHeader,
  JWT_SECRET,
  JWT_ACCESS_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN,
} = require('./jwt');

describe('JWT Utilities', () => {
  const mockUser = {
    id: 1,
    email: 'test@example.com',
    role: 'user',
  };

  describe('Configuration', () => {
    test('should export JWT_SECRET', () => {
      expect(JWT_SECRET).toBeDefined();
      expect(typeof JWT_SECRET).toBe('string');
    });

    test('should export JWT_ACCESS_EXPIRES_IN', () => {
      expect(JWT_ACCESS_EXPIRES_IN).toBeDefined();
      expect(JWT_ACCESS_EXPIRES_IN).toBe('15m');
    });

    test('should export JWT_REFRESH_EXPIRES_IN', () => {
      expect(JWT_REFRESH_EXPIRES_IN).toBeDefined();
      expect(JWT_REFRESH_EXPIRES_IN).toBe('7d');
    });
  });

  describe('generateAccessToken', () => {
    test('should generate access token for valid user', () => {
      const token = generateAccessToken(mockUser);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    test('should include user information in token', () => {
      const token = generateAccessToken(mockUser);
      const decoded = decodeToken(token);

      expect(decoded.id).toBe(mockUser.id);
      expect(decoded.email).toBe(mockUser.email);
      expect(decoded.role).toBe(mockUser.role);
      expect(decoded.type).toBe('access');
    });

    test('should include issuer and audience', () => {
      const token = generateAccessToken(mockUser);
      const decoded = decodeToken(token);

      expect(decoded.iss).toBe('auth-system');
      expect(decoded.aud).toBe('auth-system-api');
    });

    test('should throw error for user without ID', () => {
      expect(() => generateAccessToken({})).toThrow('User ID is required');
    });

    test('should throw error for null user', () => {
      expect(() => generateAccessToken(null)).toThrow('User ID is required');
    });

    test('should default role to "user" if not provided', () => {
      const userWithoutRole = { id: 1, email: 'test@example.com' };
      const token = generateAccessToken(userWithoutRole);
      const decoded = decodeToken(token);

      expect(decoded.role).toBe('user');
    });
  });

  describe('generateRefreshToken', () => {
    test('should generate refresh token for valid user', () => {
      const token = generateRefreshToken(mockUser);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    test('should include minimal user information', () => {
      const token = generateRefreshToken(mockUser);
      const decoded = decodeToken(token);

      expect(decoded.id).toBe(mockUser.id);
      expect(decoded.email).toBeUndefined(); // Not included in refresh token
      expect(decoded.role).toBeUndefined(); // Not included in refresh token
      expect(decoded.type).toBe('refresh');
    });

    test('should throw error for user without ID', () => {
      expect(() => generateRefreshToken({})).toThrow('User ID is required');
    });

    test('should throw error for null user', () => {
      expect(() => generateRefreshToken(null)).toThrow('User ID is required');
    });
  });

  describe('generateTokenPair', () => {
    test('should generate both access and refresh tokens', () => {
      const tokens = generateTokenPair(mockUser);

      expect(tokens).toHaveProperty('accessToken');
      expect(tokens).toHaveProperty('refreshToken');
      expect(typeof tokens.accessToken).toBe('string');
      expect(typeof tokens.refreshToken).toBe('string');
    });

    test('should generate different tokens for access and refresh', () => {
      const tokens = generateTokenPair(mockUser);

      expect(tokens.accessToken).not.toBe(tokens.refreshToken);
    });

    test('should mark tokens with correct type', () => {
      const tokens = generateTokenPair(mockUser);
      const accessDecoded = decodeToken(tokens.accessToken);
      const refreshDecoded = decodeToken(tokens.refreshToken);

      expect(accessDecoded.type).toBe('access');
      expect(refreshDecoded.type).toBe('refresh');
    });
  });

  describe('verifyToken', () => {
    test('should verify valid access token', () => {
      const token = generateAccessToken(mockUser);
      const decoded = verifyToken(token);

      expect(decoded).toBeDefined();
      expect(decoded.id).toBe(mockUser.id);
    });

    test('should verify valid refresh token', () => {
      const token = generateRefreshToken(mockUser);
      const decoded = verifyToken(token);

      expect(decoded).toBeDefined();
      expect(decoded.id).toBe(mockUser.id);
    });

    test('should throw error for empty token', () => {
      expect(() => verifyToken('')).toThrow('Token is required');
    });

    test('should throw error for null token', () => {
      expect(() => verifyToken(null)).toThrow('Token is required');
    });

    test('should throw error for invalid token', () => {
      expect(() => verifyToken('invalid-token')).toThrow('Invalid token');
    });

    test('should throw error for token with wrong signature', () => {
      // Valid JWT structure but wrong signature
      const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIn0.fake_signature';
      expect(() => verifyToken(fakeToken)).toThrow('Invalid token');
    });

    test('should enforce token type when specified', () => {
      const accessToken = generateAccessToken(mockUser);

      expect(() => verifyToken(accessToken, 'refresh')).toThrow('Invalid token type');
    });
  });

  describe('verifyAccessToken', () => {
    test('should verify valid access token', () => {
      const token = generateAccessToken(mockUser);
      const decoded = verifyAccessToken(token);

      expect(decoded).toBeDefined();
      expect(decoded.type).toBe('access');
    });

    test('should reject refresh token', () => {
      const token = generateRefreshToken(mockUser);

      expect(() => verifyAccessToken(token)).toThrow('Invalid token type');
    });
  });

  describe('verifyRefreshToken', () => {
    test('should verify valid refresh token', () => {
      const token = generateRefreshToken(mockUser);
      const decoded = verifyRefreshToken(token);

      expect(decoded).toBeDefined();
      expect(decoded.type).toBe('refresh');
    });

    test('should reject access token', () => {
      const token = generateAccessToken(mockUser);

      expect(() => verifyRefreshToken(token)).toThrow('Invalid token type');
    });
  });

  describe('decodeToken', () => {
    test('should decode valid token without verification', () => {
      const token = generateAccessToken(mockUser);
      const decoded = decodeToken(token);

      expect(decoded).toBeDefined();
      expect(decoded.id).toBe(mockUser.id);
      expect(decoded.email).toBe(mockUser.email);
    });

    test('should decode without verifying signature', () => {
      // This token has invalid signature but should still decode
      const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIn0.fake';
      const decoded = decodeToken(fakeToken);

      expect(decoded).toBeDefined();
      expect(decoded.id).toBe(1);
    });

    test('should return null for completely invalid token', () => {
      const decoded = decodeToken('not-a-jwt-token');
      expect(decoded).toBeNull();
    });
  });

  describe('extractTokenFromHeader', () => {
    test('should extract token from valid Bearer header', () => {
      const token = 'sample-jwt-token';
      const header = `Bearer ${token}`;
      const extracted = extractTokenFromHeader(header);

      expect(extracted).toBe(token);
    });

    test('should return null for missing header', () => {
      const extracted = extractTokenFromHeader(null);
      expect(extracted).toBeNull();
    });

    test('should return null for empty header', () => {
      const extracted = extractTokenFromHeader('');
      expect(extracted).toBeNull();
    });

    test('should return null for header without Bearer prefix', () => {
      const extracted = extractTokenFromHeader('some-token');
      expect(extracted).toBeNull();
    });

    test('should return null for header with wrong prefix', () => {
      const extracted = extractTokenFromHeader('Basic some-token');
      expect(extracted).toBeNull();
    });

    test('should return null for malformed Bearer header', () => {
      const extracted = extractTokenFromHeader('Bearer');
      expect(extracted).toBeNull();
    });

    test('should return null for malformed header with extra parts', () => {
      const extracted = extractTokenFromHeader('Bearer token with spaces');
      // Malformed header should return null
      expect(extracted).toBeNull();
    });
  });

  describe('Token Expiration', () => {
    test('should include expiration in access token', () => {
      const token = generateAccessToken(mockUser);
      const decoded = decodeToken(token);

      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeGreaterThan(decoded.iat);
    });

    test('should include expiration in refresh token', () => {
      const token = generateRefreshToken(mockUser);
      const decoded = decodeToken(token);

      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeGreaterThan(decoded.iat);
    });

    test('refresh token should expire later than access token', () => {
      const tokens = generateTokenPair(mockUser);
      const accessDecoded = decodeToken(tokens.accessToken);
      const refreshDecoded = decodeToken(tokens.refreshToken);

      expect(refreshDecoded.exp).toBeGreaterThan(accessDecoded.exp);
    });
  });
});
