/**
 * Swagger/OpenAPI Configuration
 *
 * Story 11.3: API Documentation
 * Configures swagger-jsdoc and swagger-ui-express for API documentation
 */

const swaggerJsdoc = require('swagger-jsdoc');
const config = require('./index');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Authentication System API',
      version: '1.0.0',
      description: `
## Overview

A comprehensive authentication system API with JWT, OAuth2, MFA, and RBAC support.

## Features

- **JWT Authentication**: Access tokens (1h) and refresh tokens (7d)
- **OAuth2 Social Login**: Google and GitHub integration
- **Multi-Factor Authentication**: TOTP-based 2FA with backup codes
- **Role-Based Access Control**: User, Admin, and Super Admin roles
- **Session Management**: Device tracking and session revocation
- **Security Monitoring**: Login history and security event tracking

## Authentication

Most endpoints require authentication via Bearer token in the Authorization header:

\`\`\`
Authorization: Bearer <your_access_token>
\`\`\`

### Getting a Token

1. **Register**: POST /api/auth/register
2. **Login**: POST /api/auth/login
3. **Refresh**: POST /api/auth/refresh (when access token expires)

### Rate Limiting

- Registration: 5 requests per hour
- Login: 10 requests per 15 minutes
- Password Reset: 3 requests per hour
      `,
      contact: {
        name: 'API Support',
        email: 'support@example.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: config.env === 'production'
          ? 'https://auth-backend-beta.onrender.com'
          : 'http://localhost:5000',
        description: config.env === 'production' ? 'Production server' : 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT access token',
        },
        mfaChallengeToken: {
          type: 'apiKey',
          in: 'header',
          name: 'X-MFA-Token',
          description: 'MFA challenge token received from login when 2FA is required',
        },
      },
      schemas: {
        // Common response schemas
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
            data: { type: 'object' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            errors: { type: 'array', items: { type: 'string' } },
          },
        },

        // User schemas
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            username: { type: 'string', example: 'johndoe' },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            role: { type: 'string', enum: ['user', 'admin', 'super_admin'], example: 'user' },
            email_verified: { type: 'boolean', example: true },
            avatar_url: { type: 'string', nullable: true },
            is_active: { type: 'boolean', example: true },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },

        // Auth schemas
        RegisterRequest: {
          type: 'object',
          required: ['username', 'email', 'password'],
          properties: {
            username: {
              type: 'string',
              minLength: 3,
              maxLength: 30,
              pattern: '^[a-zA-Z0-9_]+$',
              example: 'johndoe',
              description: 'Letters, numbers, and underscores only',
            },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            password: {
              type: 'string',
              minLength: 8,
              example: 'SecureP@ss123',
              description: 'Min 8 chars, uppercase, lowercase, number, special char',
            },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            password: { type: 'string', example: 'SecureP@ss123' },
            rememberMe: { type: 'boolean', example: false, description: 'Extend session duration' },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Login successful' },
            data: {
              type: 'object',
              properties: {
                user: { $ref: '#/components/schemas/User' },
                accessToken: { type: 'string', description: 'JWT access token (1h expiry)' },
                refreshToken: { type: 'string', description: 'JWT refresh token (7d expiry)' },
              },
            },
          },
        },
        MFARequiredResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            requiresMFA: { type: 'boolean', example: true },
            mfaToken: { type: 'string', description: 'Temporary token for MFA verification' },
            message: { type: 'string', example: 'MFA verification required' },
          },
        },

        // MFA schemas
        MFASetupResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                secret: { type: 'string', description: 'Base32 encoded TOTP secret' },
                qrCode: { type: 'string', description: 'QR code image URL for authenticator app' },
                manualEntry: { type: 'string', description: 'Manual entry code' },
              },
            },
          },
        },
        MFAVerifyRequest: {
          type: 'object',
          required: ['token', 'mfaToken'],
          properties: {
            token: { type: 'string', example: '123456', description: '6-digit TOTP code' },
            mfaToken: { type: 'string', description: 'MFA challenge token from login' },
          },
        },
        BackupCodes: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                backupCodes: {
                  type: 'array',
                  items: { type: 'string', example: 'ABCD-EFGH' },
                  description: 'Array of 10 backup codes',
                },
              },
            },
          },
        },

        // Session schemas
        Session: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            device_name: { type: 'string', example: 'Chrome on Windows' },
            ip_address: { type: 'string', example: '192.168.1.1' },
            user_agent: { type: 'string' },
            last_active: { type: 'string', format: 'date-time' },
            is_current: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },

        // Admin schemas
        AdminUserListResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                users: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/User' },
                },
                pagination: {
                  type: 'object',
                  properties: {
                    page: { type: 'integer', example: 1 },
                    pageSize: { type: 'integer', example: 20 },
                    totalCount: { type: 'integer', example: 100 },
                    totalPages: { type: 'integer', example: 5 },
                  },
                },
              },
            },
          },
        },
        DashboardStats: {
          type: 'object',
          properties: {
            totalUsers: { type: 'integer', example: 150 },
            activeUsers: { type: 'integer', example: 142 },
            newUsersToday: { type: 'integer', example: 5 },
            newUsersThisWeek: { type: 'integer', example: 23 },
            adminCount: { type: 'integer', example: 3 },
            suspendedCount: { type: 'integer', example: 2 },
          },
        },

        // Security schemas
        LoginAttempt: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            ip_address: { type: 'string' },
            user_agent: { type: 'string' },
            device_name: { type: 'string' },
            location: { type: 'string' },
            success: { type: 'boolean' },
            failure_reason: { type: 'string', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        SecurityEvent: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            event_type: { type: 'string', example: 'password_changed' },
            severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
            description: { type: 'string' },
            ip_address: { type: 'string' },
            acknowledged: { type: 'boolean' },
            acknowledged_at: { type: 'string', format: 'date-time', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
          },
        },

        // Audit schemas
        AuditLog: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            admin_id: { type: 'integer' },
            admin_username: { type: 'string' },
            action: { type: 'string', example: 'USER_UPDATE' },
            target_id: { type: 'integer', nullable: true },
            details: { type: 'object' },
            ip_address: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    tags: [
      { name: 'Health', description: 'API health check endpoints' },
      { name: 'Authentication', description: 'User registration, login, and token management' },
      { name: 'OAuth', description: 'Social login with Google and GitHub' },
      { name: 'MFA', description: 'Multi-Factor Authentication setup and verification' },
      { name: 'User', description: 'User profile and account management' },
      { name: 'Sessions', description: 'Device and session management' },
      { name: 'Security', description: 'Login history and security event monitoring' },
      { name: 'Admin', description: 'Admin panel - user management and system monitoring' },
    ],
  },
  apis: ['./src/docs/*.yaml'], // Path to the API docs
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
