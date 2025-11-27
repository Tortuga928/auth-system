/**
 * MFA Admin API Tests
 *
 * Tests for MFA configuration admin endpoints
 * Requires admin or super_admin role authentication
 */

const request = require('supertest');
const app = require('../src/app');
const db = require('../src/db');
const jwt = require('jsonwebtoken');
const config = require('../src/config');

// Test data
const testAdmin = {
  id: 999,
  email: 'testadmin@test.com',
  role: 'admin',
};

const testSuperAdmin = {
  id: 998,
  email: 'testsuperadmin@test.com',
  role: 'super_admin',
};

const testUser = {
  id: 997,
  email: 'testuser@test.com',
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

let adminToken;
let superAdminToken;
let userToken;

describe('MFA Admin API', () => {
  beforeAll(async () => {
    // Generate tokens for testing
    adminToken = generateToken(testAdmin);
    superAdminToken = generateToken(testSuperAdmin);
    userToken = generateToken(testUser);
  });

  afterAll(async () => {
    // Close database connection
    await db.pool.end();
  });

  // ============================================
  // AUTHENTICATION TESTS
  // ============================================

  describe('Authentication', () => {
    it('should reject requests without authentication', async () => {
      const response = await request(app)
        .get('/api/admin/mfa/config')
        .expect(401);

      expect(response.body.error).toBeDefined();
    });

    it('should reject requests with invalid token', async () => {
      const response = await request(app)
        .get('/api/admin/mfa/config')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.error).toBeDefined();
    });

    it('should reject requests from regular users', async () => {
      const response = await request(app)
        .get('/api/admin/mfa/config')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.error).toBeDefined();
    });
  });

  // ============================================
  // MFA CONFIG TESTS
  // ============================================

  describe('GET /api/admin/mfa/config', () => {
    it('should return MFA configuration for admin', async () => {
      const response = await request(app)
        .get('/api/admin/mfa/config')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.config).toBeDefined();
      expect(response.body.data.availableModes).toBeDefined();
      expect(response.body.data.availableLockoutBehaviors).toBeDefined();
      expect(response.body.data.availableCodeFormats).toBeDefined();
    });

    it('should return all available configuration options', async () => {
      const response = await request(app)
        .get('/api/admin/mfa/config')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify all option arrays are present
      expect(Array.isArray(response.body.data.availableModes)).toBe(true);
      expect(Array.isArray(response.body.data.availableLockoutBehaviors)).toBe(true);
      expect(Array.isArray(response.body.data.availableCodeFormats)).toBe(true);
      expect(Array.isArray(response.body.data.availableUserControlModes)).toBe(true);
      expect(Array.isArray(response.body.data.availableMethodChangeBehaviors)).toBe(true);
    });
  });

  describe('PUT /api/admin/mfa/config', () => {
    it('should update MFA configuration', async () => {
      const updates = {
        code_expiration_minutes: 10,
        max_attempts: 5,
      };

      const response = await request(app)
        .put('/api/admin/mfa/config')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updates)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('updated');
      expect(response.body.data.config.code_expiration_minutes).toBe(10);
      expect(response.body.data.config.max_attempts).toBe(5);
    });

    it('should reject empty updates', async () => {
      const response = await request(app)
        .put('/api/admin/mfa/config')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('No configuration updates');
    });

    it('should reject invalid MFA mode', async () => {
      const response = await request(app)
        .put('/api/admin/mfa/config')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ mfa_mode: 'invalid_mode' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/admin/mfa/config/reset', () => {
    it('should require super_admin role', async () => {
      const response = await request(app)
        .post('/api/admin/mfa/config/reset')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(403);

      expect(response.body.error).toBeDefined();
    });

    it('should reset config with super_admin role', async () => {
      const response = await request(app)
        .post('/api/admin/mfa/config/reset')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('reset');
      // Verify default values
      expect(response.body.data.config.mfa_mode).toBe('disabled');
    });
  });

  // ============================================
  // ROLE CONFIG TESTS
  // ============================================

  describe('GET /api/admin/mfa/roles', () => {
    it('should return all role configurations', async () => {
      const response = await request(app)
        .get('/api/admin/mfa/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.roles).toBeDefined();
      expect(response.body.data.validRoles).toBeDefined();
      expect(response.body.data.validMethods).toBeDefined();
    });

    it('should return roles for user, admin, and super_admin', async () => {
      const response = await request(app)
        .get('/api/admin/mfa/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const roleNames = response.body.data.roles.map(r => r.role_name);
      expect(roleNames).toContain('user');
      expect(roleNames).toContain('admin');
      expect(roleNames).toContain('super_admin');
    });
  });

  describe('PUT /api/admin/mfa/roles/:role', () => {
    it('should update role configuration', async () => {
      const updates = {
        mfa_required: true,
        allowed_methods: ['email', 'totp'],
      };

      const response = await request(app)
        .put('/api/admin/mfa/roles/admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updates)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.config.mfa_required).toBe(true);
    });

    it('should reject invalid role', async () => {
      const response = await request(app)
        .put('/api/admin/mfa/roles/invalid_role')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ mfa_required: true })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid role');
    });
  });

  // ============================================
  // EMAIL TEMPLATE TESTS
  // ============================================

  describe('GET /api/admin/mfa/email-template', () => {
    it('should return email templates', async () => {
      const response = await request(app)
        .get('/api/admin/mfa/email-template')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.templates).toBeDefined();
      expect(Array.isArray(response.body.data.templates)).toBe(true);
    });

    it('should have an active template', async () => {
      const response = await request(app)
        .get('/api/admin/mfa/email-template')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.activeTemplate).toBeDefined();
    });
  });

  describe('PUT /api/admin/mfa/email-template/:id', () => {
    it('should update email template', async () => {
      // First get templates to find ID
      const getResponse = await request(app)
        .get('/api/admin/mfa/email-template')
        .set('Authorization', `Bearer ${adminToken}`);

      const templateId = getResponse.body.data.templates[0]?.id;
      if (!templateId) {
        console.log('No templates found, skipping update test');
        return;
      }

      const updates = {
        subject_line: 'Test Subject {{code}}',
      };

      const response = await request(app)
        .put(`/api/admin/mfa/email-template/${templateId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updates)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.template.subject_line).toBe('Test Subject {{code}}');
    });
  });

  describe('POST /api/admin/mfa/email-template/:id/activate', () => {
    it('should activate a template', async () => {
      // First get templates
      const getResponse = await request(app)
        .get('/api/admin/mfa/email-template')
        .set('Authorization', `Bearer ${adminToken}`);

      const templateId = getResponse.body.data.templates[0]?.id;
      if (!templateId) {
        console.log('No templates found, skipping activate test');
        return;
      }

      const response = await request(app)
        .post(`/api/admin/mfa/email-template/${templateId}/activate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.template.is_active).toBe(true);
    });
  });

  describe('POST /api/admin/mfa/email-template/preview', () => {
    it('should generate template preview', async () => {
      const response = await request(app)
        .post('/api/admin/mfa/email-template/preview')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.subject).toBeDefined();
      expect(response.body.data.htmlBody).toBeDefined();
      expect(response.body.data.textBody).toBeDefined();
      expect(response.body.data.testCode).toBeDefined();
    });
  });

  describe('POST /api/admin/mfa/email-template/reset', () => {
    it('should require super_admin role', async () => {
      const response = await request(app)
        .post('/api/admin/mfa/email-template/reset')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(403);

      expect(response.body.error).toBeDefined();
    });

    it('should reset templates with super_admin', async () => {
      const response = await request(app)
        .post('/api/admin/mfa/email-template/reset')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.templates).toBeDefined();
    });
  });

  // ============================================
  // METHOD CHANGE TESTS
  // ============================================

  describe('POST /api/admin/mfa/apply-change', () => {
    it('should apply method change with valid behavior', async () => {
      const response = await request(app)
        .post('/api/admin/mfa/apply-change')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ behavior: 'immediate' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.behavior).toBe('immediate');
    });

    it('should accept grace_period behavior with days', async () => {
      const response = await request(app)
        .post('/api/admin/mfa/apply-change')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ behavior: 'grace_period', gracePeriodDays: 7 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.behavior).toBe('grace_period');
      expect(response.body.data.gracePeriodDays).toBe(7);
    });

    it('should reject invalid behavior', async () => {
      const response = await request(app)
        .post('/api/admin/mfa/apply-change')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ behavior: 'invalid_behavior' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid behavior');
    });
  });

  describe('GET /api/admin/mfa/pending-transitions', () => {
    it('should return pending transitions list', async () => {
      const response = await request(app)
        .get('/api/admin/mfa/pending-transitions')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toBeDefined();
      expect(Array.isArray(response.body.data.users)).toBe(true);
      expect(response.body.data.count).toBeDefined();
    });
  });

  describe('POST /api/admin/mfa/force-transition/:userId', () => {
    it('should force user transition', async () => {
      // Use a test user ID
      const testUserId = 1;

      const response = await request(app)
        .post(`/api/admin/mfa/force-transition/${testUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('forced');
    });
  });

  // ============================================
  // USER MFA MANAGEMENT TESTS
  // ============================================

  describe('POST /api/admin/mfa/users/:id/unlock', () => {
    it('should unlock user MFA', async () => {
      // Use a test user ID
      const testUserId = 1;

      const response = await request(app)
        .post(`/api/admin/mfa/users/${testUserId}/unlock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('unlocked');
    });
  });
});
