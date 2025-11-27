/**
 * Email 2FA Tests
 *
 * Tests for email-based two-factor authentication
 */

const request = require('supertest');
const app = require('../src/app');
const db = require('../src/db');
const jwt = require('jsonwebtoken');
const config = require('../src/config');
const Email2FACode = require('../src/models/Email2FACode');

// Test data
const testUser = {
  id: 995,
  email: 'testuser@test.com',
  username: 'testuser',
  role: 'user',
};

// Generate test JWT tokens
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    config.jwt.secret,
    { expiresIn: '1h' }
  );
};

let userToken;

describe('Email 2FA', () => {
  beforeAll(async () => {
    userToken = generateToken(testUser);
  });

  afterAll(async () => {
    // Cleanup test data
    await db.query('DELETE FROM email_2fa_codes WHERE user_id = $1', [testUser.id]);
    await db.pool.end();
  });

  beforeEach(async () => {
    // Clean up codes before each test
    await db.query('DELETE FROM email_2fa_codes WHERE user_id = $1', [testUser.id]);
  });

  // ============================================
  // CODE GENERATION TESTS
  // ============================================

  describe('Code Generation', () => {
    it('should generate 6-digit numeric code by default', () => {
      const code = Email2FACode.generateCode();
      expect(code).toMatch(/^\d{6}$/);
    });

    it('should generate 8-digit numeric code', () => {
      const code = Email2FACode.generateCode('numeric_8');
      expect(code).toMatch(/^\d{8}$/);
    });

    it('should generate alphanumeric code', () => {
      const code = Email2FACode.generateCode('alphanumeric_6');
      expect(code).toMatch(/^[A-Z2-9]{6}$/);
    });

    it('should hash codes consistently', () => {
      const code = '123456';
      const hash1 = Email2FACode.hashCode(code);
      const hash2 = Email2FACode.hashCode(code);
      expect(hash1).toBe(hash2);
    });

    it('should be case insensitive when hashing', () => {
      const hash1 = Email2FACode.hashCode('ABC123');
      const hash2 = Email2FACode.hashCode('abc123');
      expect(hash1).toBe(hash2);
    });
  });

  // ============================================
  // CODE CREATION TESTS
  // ============================================

  describe('Code Creation', () => {
    it('should create a new code for user', async () => {
      const code = '123456';
      const result = await Email2FACode.create(testUser.id, code, 5);

      expect(result).toBeDefined();
      expect(result.user_id).toBe(testUser.id);
      expect(result.used).toBe(false);
      expect(result.attempts).toBe(0);
    });

    it('should invalidate existing codes when creating new one', async () => {
      // Create first code
      await Email2FACode.create(testUser.id, '111111', 5);

      // Create second code
      await Email2FACode.create(testUser.id, '222222', 5);

      // Only one active code should exist
      const activeCode = await Email2FACode.getActiveCode(testUser.id);
      expect(activeCode).toBeDefined();
    });

    it('should accept object format for creation', async () => {
      const result = await Email2FACode.create({
        user_id: testUser.id,
        email: testUser.email,
        code: '123456',
        expires_at: new Date(Date.now() + 5 * 60 * 1000),
      });

      expect(result).toBeDefined();
      expect(result.user_id).toBe(testUser.id);
      expect(result.email).toBe(testUser.email);
    });
  });

  // ============================================
  // CODE VERIFICATION TESTS
  // ============================================

  describe('Code Verification', () => {
    it('should verify correct code', async () => {
      const code = '123456';
      await Email2FACode.create(testUser.id, code, 5);

      const result = await Email2FACode.verify(testUser.id, code);
      expect(result.success).toBe(true);
    });

    it('should reject incorrect code', async () => {
      await Email2FACode.create(testUser.id, '123456', 5);

      const result = await Email2FACode.verify(testUser.id, '654321');
      expect(result.success).toBe(false);
      expect(result.reason).toContain('Invalid');
    });

    it('should reject expired code', async () => {
      // Create expired code directly in DB
      const codeHash = Email2FACode.hashCode('123456');
      await db.query(
        `INSERT INTO email_2fa_codes (user_id, code_hash, expires_at)
         VALUES ($1, $2, NOW() - INTERVAL '1 minute')`,
        [testUser.id, codeHash]
      );

      const result = await Email2FACode.verify(testUser.id, '123456');
      expect(result.success).toBe(false);
      expect(result.reason).toContain('expired');
    });

    it('should return error when no code exists', async () => {
      const result = await Email2FACode.verify(testUser.id, '123456');
      expect(result.success).toBe(false);
      expect(result.reason).toContain('No verification code');
    });

    it('should track failed attempts', async () => {
      await Email2FACode.create(testUser.id, '123456', 5);

      // First wrong attempt
      await Email2FACode.verify(testUser.id, '111111');

      // Check attempts increased
      const activeCode = await Email2FACode.getActiveCode(testUser.id);
      expect(activeCode.attempts).toBe(1);
    });
  });

  // ============================================
  // LOCKOUT TESTS
  // ============================================

  describe('Lockout Handling', () => {
    it('should lock after max attempts', async () => {
      await Email2FACode.create(testUser.id, '123456', 5);

      // Make 5 wrong attempts
      for (let i = 0; i < 5; i++) {
        await Email2FACode.verify(testUser.id, '111111');
      }

      // Next attempt should show locked
      const result = await Email2FACode.verify(testUser.id, '123456');
      expect(result.success).toBe(false);
      expect(result.isLocked).toBe(true);
    });

    it('should check lockout status', async () => {
      // Create code with lockout
      const codeHash = Email2FACode.hashCode('123456');
      await db.query(
        `INSERT INTO email_2fa_codes (user_id, code_hash, expires_at, locked_until, attempts)
         VALUES ($1, $2, NOW() + INTERVAL '5 minutes', NOW() + INTERVAL '15 minutes', 5)`,
        [testUser.id, codeHash]
      );

      const lockoutStatus = await Email2FACode.checkLockout(testUser.id);
      expect(lockoutStatus.isLocked).toBe(true);
    });

    it('should unlock user codes', async () => {
      // Create locked code
      const codeHash = Email2FACode.hashCode('123456');
      await db.query(
        `INSERT INTO email_2fa_codes (user_id, code_hash, expires_at, locked_until, attempts)
         VALUES ($1, $2, NOW() + INTERVAL '5 minutes', NOW() + INTERVAL '15 minutes', 5)`,
        [testUser.id, codeHash]
      );

      // Unlock
      await Email2FACode.unlock(testUser.id);

      const lockoutStatus = await Email2FACode.checkLockout(testUser.id);
      expect(lockoutStatus.isLocked).toBe(false);
    });
  });

  // ============================================
  // RESEND TESTS
  // ============================================

  describe('Resend Functionality', () => {
    it('should allow resend when no active code', async () => {
      const result = await Email2FACode.canResend(testUser.id);
      expect(result.allowed).toBe(true);
    });

    it('should track resend count', async () => {
      await Email2FACode.create(testUser.id, '123456', 5);

      await Email2FACode.recordResend(testUser.id);
      await Email2FACode.recordResend(testUser.id);

      const activeCode = await Email2FACode.getActiveCode(testUser.id);
      expect(activeCode.resend_count).toBe(2);
    });

    it('should enforce cooldown between resends', async () => {
      await Email2FACode.create(testUser.id, '123456', 5);
      await Email2FACode.recordResend(testUser.id);

      // Immediate second resend should be blocked
      const result = await Email2FACode.canResend(testUser.id);
      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBeGreaterThan(0);
    });
  });

  // ============================================
  // API ENDPOINT TESTS
  // ============================================

  describe('API Endpoints', () => {
    describe('GET /api/auth/mfa/config', () => {
      it('should return public MFA configuration', async () => {
        const response = await request(app)
          .get('/api/auth/mfa/config')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.mfaMode).toBeDefined();
        expect(response.body.data.codeExpirationMinutes).toBeDefined();
      });
    });

    describe('POST /api/auth/mfa/email/request', () => {
      it('should require userId and email', async () => {
        const response = await request(app)
          .post('/api/auth/mfa/email/request')
          .send({})
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('required');
      });
    });

    describe('POST /api/auth/mfa/email/verify', () => {
      it('should require userId and code', async () => {
        const response = await request(app)
          .post('/api/auth/mfa/email/verify')
          .send({})
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('required');
      });
    });

    describe('GET /api/auth/mfa/status', () => {
      it('should require authentication', async () => {
        const response = await request(app)
          .get('/api/auth/mfa/status')
          .expect(401);

        expect(response.body.error).toBeDefined();
      });

      it('should return MFA status for authenticated user', async () => {
        const response = await request(app)
          .get('/api/auth/mfa/status')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
      });
    });

    describe('POST /api/auth/mfa/email/enable', () => {
      it('should require authentication', async () => {
        const response = await request(app)
          .post('/api/auth/mfa/email/enable')
          .expect(401);

        expect(response.body.error).toBeDefined();
      });
    });

    describe('POST /api/auth/mfa/email/disable', () => {
      it('should require authentication', async () => {
        const response = await request(app)
          .post('/api/auth/mfa/email/disable')
          .expect(401);

        expect(response.body.error).toBeDefined();
      });
    });

    describe('POST /api/auth/mfa/email/alternate', () => {
      it('should require authentication', async () => {
        const response = await request(app)
          .post('/api/auth/mfa/email/alternate')
          .send({ alternateEmail: 'test@test.com' })
          .expect(401);

        expect(response.body.error).toBeDefined();
      });

      it('should require alternateEmail in body', async () => {
        const response = await request(app)
          .post('/api/auth/mfa/email/alternate')
          .set('Authorization', `Bearer ${userToken}`)
          .send({})
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('required');
      });
    });
  });

  // ============================================
  // CLEANUP TESTS
  // ============================================

  describe('Cleanup', () => {
    it('should clean up expired codes', async () => {
      // Insert old expired codes
      const codeHash = Email2FACode.hashCode('123456');
      await db.query(
        `INSERT INTO email_2fa_codes (user_id, code_hash, expires_at, created_at)
         VALUES ($1, $2, NOW() - INTERVAL '48 hours', NOW() - INTERVAL '48 hours')`,
        [testUser.id, codeHash]
      );

      const deletedCount = await Email2FACode.cleanup(24);
      expect(deletedCount).toBeGreaterThanOrEqual(1);
    });
  });
});
