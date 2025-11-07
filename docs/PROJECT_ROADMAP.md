# Authentication System - Project Roadmap

**Last Updated**: November 7, 2025
**Project Status**: Phase 4 - In Progress (in Staging)
**Overall Progress**: 27.7% (18/65 stories completed)

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Status Dashboard](#status-dashboard)
3. [Phase 1: Project Setup & Infrastructure](#phase-1-project-setup--infrastructure)
4. [Phase 2: Database Schema & Core Models](#phase-2-database-schema--core-models)
5. [Phase 3: Basic JWT Authentication](#phase-3-basic-jwt-authentication)
6. [Phase 4: Email Verification System](#phase-4-email-verification-system)
7. [Phase 5: Password Reset Flow](#phase-5-password-reset-flow)
8. [Phase 6: OAuth2 Social Login](#phase-6-oauth2-social-login)
9. [Phase 7: Multi-Factor Authentication](#phase-7-multi-factor-authentication)
10. [Phase 8: User Dashboard & Profile Management](#phase-8-user-dashboard--profile-management)
11. [Phase 9: Session Management & Security](#phase-9-session-management--security)
12. [Phase 10: Admin Panel](#phase-10-admin-panel)
13. [Phase 11: Testing & Documentation](#phase-11-testing--documentation)
14. [Phase 12: Production Preparation & Deployment](#phase-12-production-preparation--deployment)
15. [Rollback History](#rollback-history)
16. [Deployment History](#deployment-history)

---

## Project Overview

### Technology Stack
- **Backend**: Node.js 18+ with Express.js
- **Frontend**: React 18
- **Database**: PostgreSQL 15
- **Caching**: Redis
- **Containerization**: Docker & Docker Compose
- **Deployment**: Docker Hub

### Repository Information
- **Project ID**: auth-system
- **Location**: C:\Users\MSTor\Projects\auth-system
- **Git Remote**: https://github.com/Tortuga928/auth-system
- **Docker Hub**: tortuga928/auth-backend, tortuga928/auth-frontend

### Branching Strategy
- **Main Branch**: `main` (production)
- **Staging Branch**: `staging` (integration testing)
- **Feature Branches**: `type/story-id-description`

### Image Tagging
- **Format**: `v{major}.{minor}.{patch}-{git-sha}`
- **Example**: `v1.0.0-abc123f`

---

## Status Dashboard

### Phase Progress

| Phase | Name | Stories | Complete | Progress | Status |
|-------|------|---------|----------|----------|--------|
| 1 | Project Setup & Infrastructure | 5 | 5 | 100% | 🟣 In Staging |
| 2 | Database Schema & Core Models | 4 | 4 | 100% | 🟣 In Staging |
| 3 | Basic JWT Authentication | 6 | 6 | 100% | 🟣 In Staging |
| 4 | Email Verification System | 4 | 3 | 75% | 🟣 In Staging |
| 5 | Password Reset Flow | 3 | 0 | 0% | ⬜ Not Started |
| 6 | OAuth2 Social Login | 6 | 0 | 0% | ⬜ Not Started |
| 7 | Multi-Factor Authentication | 5 | 0 | 0% | ⬜ Not Started |
| 8 | User Dashboard & Profile | 6 | 0 | 0% | ⬜ Not Started |
| 9 | Session Management & Security | 5 | 0 | 0% | ⬜ Not Started |
| 10 | Admin Panel | 6 | 0 | 0% | ⬜ Not Started |
| 11 | Testing & Documentation | 6 | 0 | 0% | ⬜ Not Started |
| 12 | Production Deployment | 9 | 0 | 0% | ⬜ Not Started |
| **TOTAL** | | **65** | **18** | **27.7%** | |

### Status Legend
- 🔵 **Planning**: Requirements defined, ready to start
- 🟡 **In Development**: Code being written
- 🟠 **In Testing**: Feature complete, testing in progress
- 🟣 **In Staging**: Deployed to staging environment
- 🟢 **Deployed**: Live in production
- 🔴 **Blocked**: Cannot proceed, issue identified

---

## Phase 1: Project Setup & Infrastructure

**Goal**: Establish development environment, folder structure, and foundational tooling

**Dependencies**: None

**Estimated Time**: 1-2 days

### Stories

#### Story 1.1 - Initialize Repository & Folder Structure

**Status**: 🟢 Deployed

**User Story**:
> As a **developer**, I want a **well-organized project structure with Git repository**, so that **I can start development with clear organization and version control**.

**Branch**: `feature/1.1-init-repository`

**Description**:
Set up the initial project structure including backend, frontend, database folders, and initialize Git repository with proper .gitignore configuration.

**Acceptance Criteria**:
- [x] Project directory created at C:/Users/MSTor/Projects/auth-system
- [x] Git repository initialized with initial commit
- [x] Folder structure created (backend/, frontend/, database/, docs/, scripts/)
- [x] .gitignore file excludes node_modules, .env, build files
- [x] README.md created with project overview
- [x] All documentation files created (GIT_WORKFLOW.md, DOCKER_GUIDE.md, etc.)

**Technical Notes**:
- Use `git init` for repository initialization
- Follow directory structure in CLAUDE.md
- Ensure .gitignore covers all environments (development, staging, production)

**Test Cases**: See [TESTING_GUIDE.md](TESTING_GUIDE.md#story-11-tests)

**Rollback Procedure**: See [ROLLBACK_PROCEDURES.md](ROLLBACK_PROCEDURES.md)

---

**Audit Trail**:

| Field | Value |
|-------|-------|
| **Status** | Deployed |
| **Branch Name** | master (direct commit) |
| **Commits** | b8dc626, 0e398c4, d1e02e7, 77206a0, dfbb7df |
| **Started** | Nov 5, 2025 |
| **In Development** | Nov 5, 2025 |
| **In Testing** | Nov 5, 2025 |
| **In Staging** | N/A (infrastructure) |
| **Deployed to Main** | Nov 6, 2025 |
| **Docker Image Tag** | N/A (infrastructure only) |
| **Test Results** | ✅ All acceptance criteria met |
| **Staging Test Results** | N/A |
| **Production Test Results** | ✅ GitHub repo verified |
| **Rollback Count** | 0 |
| **Notes** | Infrastructure complete. All documentation, folder structure, Docker configs, and GitHub setup finished. |

---

#### Story 1.2 - Backend Setup (Express.js)

**Status**: ⬜ Not Started

**User Story**:
> As a **developer**, I want a **configured Express.js backend with middleware**, so that **I can build API endpoints efficiently**.

**Branch**: `feature/1.2-backend-setup`

**Description**:
Set up Express.js server with essential middleware (body-parser, cors, helmet), error handling, and basic project structure.

**Acceptance Criteria**:
- [ ] Express.js installed and configured
- [ ] Basic middleware set up (body-parser, cors, helmet, morgan)
- [ ] Error handling middleware implemented
- [ ] Health check endpoint created (`GET /health`)
- [ ] Environment variable loading configured (dotenv)
- [ ] Server starts on port 5000
- [ ] TypeScript configured (optional) or ESLint for JavaScript

**Technical Notes**:
```javascript
// Basic structure:
src/
  ├── config/        # Configuration files
  ├── routes/        # API routes
  ├── controllers/   # Business logic
  ├── middleware/    # Custom middleware
  ├── utils/         # Helper functions
  └── app.js         # Express app setup
```

**Dependencies**: Story 1.1

**Test Cases**:
- TC-1.2-01: Server starts without errors
- TC-1.2-02: Health endpoint returns 200 OK
- TC-1.2-03: CORS allows frontend origin
- TC-1.2-04: Error handling middleware catches errors

**Rollback Procedure**: `git revert` commits, remove backend/ folder

---

**Audit Trail**:

| Field | Value |
|-------|-------|
| **Status** | Not Started |
| **Branch Name** | feature/1.2-backend-setup |
| **Commits** | - |
| **Started** | - |
| **In Development** | - |
| **In Testing** | - |
| **In Staging** | - |
| **Deployed to Main** | - |
| **Docker Image Tag** | - |
| **Test Results** | - |
| **Staging Test Results** | - |
| **Production Test Results** | - |
| **Rollback Count** | 0 |
| **Notes** | - |

---

#### Story 1.3 - Frontend Setup (React)

**Status**: ⬜ Not Started

**User Story**:
> As a **developer**, I want a **configured React application with routing**, so that **I can build the user interface**.

**Branch**: `feature/1.3-frontend-setup`

**Description**:
Set up React application using Create React App or Vite, configure React Router, and establish basic component structure.

**Acceptance Criteria**:
- [ ] React application created
- [ ] React Router configured
- [ ] Basic folder structure (components/, pages/, contexts/, services/)
- [ ] App runs on port 3000
- [ ] Environment variable configuration (.env.development)
- [ ] Basic theme/styling system (CSS-in-JS or Tailwind)
- [ ] Axios configured for API calls

**Technical Notes**:
```
src/
  ├── components/    # Reusable components
  ├── pages/         # Page components
  ├── contexts/      # React contexts
  ├── services/      # API service layer
  ├── hooks/         # Custom hooks
  ├── utils/         # Helper functions
  └── App.js         # Main app component
```

**Dependencies**: Story 1.1

**Test Cases**:
- TC-1.3-01: React app starts without errors
- TC-1.3-02: Homepage renders correctly
- TC-1.3-03: React Router navigation works
- TC-1.3-04: Can make API call to backend

**Rollback Procedure**: `git revert` commits, remove frontend/ folder

---

**Audit Trail**:

| Field | Value |
|-------|-------|
| **Status** | Not Started |
| **Branch Name** | feature/1.3-frontend-setup |
| **Commits** | - |
| **Started** | - |
| **In Development** | - |
| **In Testing** | - |
| **In Staging** | - |
| **Deployed to Main** | - |
| **Docker Image Tag** | - |
| **Test Results** | - |
| **Staging Test Results** | - |
| **Production Test Results** | - |
| **Rollback Count** | 0 |
| **Notes** | - |

---

#### Story 1.4 - Database Setup (PostgreSQL + Docker)

**Status**: ⬜ Not Started

**User Story**:
> As a **developer**, I want a **PostgreSQL database running in Docker**, so that **I have a consistent development database**.

**Branch**: `feature/1.4-database-setup`

**Description**:
Set up PostgreSQL in Docker container with docker-compose.yml configuration, database connection pooling, and initial database creation.

**Acceptance Criteria**:
- [ ] PostgreSQL container defined in docker-compose.yml
- [ ] Database connection configuration in backend
- [ ] Connection pooling configured
- [ ] Database migrations setup (using Knex, Sequelize, or TypeORM)
- [ ] Can connect to database from backend
- [ ] pgAdmin or similar tool accessible (optional)
- [ ] Database persists data (volume mounted)

**Technical Notes**:
```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: authdb
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
```

**Dependencies**: Story 1.2

**Test Cases**:
- TC-1.4-01: PostgreSQL container starts successfully
- TC-1.4-02: Can connect to database from backend
- TC-1.4-03: Can create tables via migrations
- TC-1.4-04: Data persists after container restart

**Rollback Procedure**: `docker-compose down -v`, `git revert` commits

---

**Audit Trail**:

| Field | Value |
|-------|-------|
| **Status** | Not Started |
| **Branch Name** | feature/1.4-database-setup |
| **Commits** | - |
| **Started** | - |
| **In Development** | - |
| **In Testing** | - |
| **In Staging** | - |
| **Deployed to Main** | - |
| **Docker Image Tag** | - |
| **Test Results** | - |
| **Staging Test Results** | - |
| **Production Test Results** | - |
| **Rollback Count** | 0 |
| **Notes** | - |

---

#### Story 1.5 - Docker Development Environment

**Status**: ⬜ Not Started

**User Story**:
> As a **developer**, I want **all services running in Docker with hot reload**, so that **I have a consistent development environment**.

**Branch**: `feature/1.5-docker-dev-environment`

**Description**:
Create complete docker-compose.yml with backend, frontend, PostgreSQL, and Redis services all running with hot reload enabled.

**Acceptance Criteria**:
- [ ] docker-compose.yml includes all services (backend, frontend, postgres, redis)
- [ ] Hot reload works for backend (nodemon)
- [ ] Hot reload works for frontend (webpack-dev-server)
- [ ] All services can communicate
- [ ] Single command starts entire stack (`docker-compose up`)
- [ ] Volumes mounted for code changes
- [ ] Environment variables configured per service

**Technical Notes**:
- Use volumes for live code updates
- Ensure proper networking between containers
- Configure healthchecks for all services

**Dependencies**: Stories 1.2, 1.3, 1.4

**Test Cases**:
- TC-1.5-01: All containers start with `docker-compose up`
- TC-1.5-02: Backend hot reload works (change file, see reload)
- TC-1.5-03: Frontend hot reload works (change file, see update)
- TC-1.5-04: Backend can connect to PostgreSQL
- TC-1.5-05: Backend can connect to Redis
- TC-1.5-06: Frontend can call backend API

**Rollback Procedure**: `git revert` docker-compose.yml changes

---

**Audit Trail**:

| Field | Value |
|-------|-------|
| **Status** | Not Started |
| **Branch Name** | feature/1.5-docker-dev-environment |
| **Commits** | - |
| **Started** | - |
| **In Development** | - |
| **In Testing** | - |
| **In Staging** | - |
| **Deployed to Main** | - |
| **Docker Image Tag** | - |
| **Test Results** | - |
| **Staging Test Results** | - |
| **Production Test Results** | - |
| **Rollback Count** | 0 |
| **Notes** | - |

---

## Phase 2: Database Schema & Core Models

**Goal**: Design and implement database schema with user models and migrations

**Dependencies**: Phase 1 complete

**Estimated Time**: 1-2 days

### Stories

#### Story 2.1 - User Model & Table

**Status**: 🟢 Deployed

**User Story**:
> As a **developer**, I want a **User model with proper schema**, so that **I can store user information securely**.

**Branch**: `feature/1.4-database-setup` (completed as part of Phase 1)

**Description**:
Create users table with all necessary fields, implement User model with validations, and create migration scripts.

**Acceptance Criteria**:
- [x] Users table created with migration (20251106000001)
- [x] User model implemented with fields: id, email, password_hash, username, first_name, last_name, email_verified, created_at, updated_at
- [x] Unique constraints on email and username
- [x] Email validation in model
- [x] Timestamps auto-generated
- [x] Can query users via model

**Technical Notes**:
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Dependencies**: Story 1.4

**Test Cases**:
- TC-2.1-01: User table created successfully
- TC-2.1-02: Can insert user with valid data
- TC-2.1-03: Duplicate email rejected
- TC-2.1-04: Invalid email format rejected
- TC-2.1-05: Timestamps auto-populate

**Rollback Procedure**: Run down migration, `git revert` commits

---

**Audit Trail**:

| Field | Value |
|-------|-------|
| **Status** | Deployed |
| **Branch Name** | feature/1.4-database-setup (Phase 1) |
| **Commits** | Included in Phase 1 staging merge |
| **Started** | Nov 6, 2025 |
| **In Development** | Nov 6, 2025 |
| **In Testing** | Nov 6, 2025 |
| **In Staging** | Nov 6, 2025 |
| **Deployed to Main** | Pending (in staging) |
| **Migration** | 20251106000001_create_users_table.js |
| **Test Results** | ✅ All acceptance criteria met |
| **Rollback Count** | 0 |
| **Notes** | Users table was created as part of Story 1.4 (Database Setup) in Phase 1. The table included all fields needed for Phase 2, so no separate feature branch was required. This represents efficient planning where Phase 1 database setup anticipated Phase 2 requirements. |

---

#### Story 2.2 - Session Table & Model

**Status**: 🟢 Deployed

**User Story**:
> As a **developer**, I want a **sessions table to track user sessions**, so that **I can manage active logins**.

**Branch**: `feature/1.4-database-setup` (completed as part of Phase 1)

**Description**:
Create sessions table for tracking user sessions with device information and IP addresses.

**Acceptance Criteria**:
- [x] Sessions table created with migration (20251106000002)
- [x] Fields: id, user_id, refresh_token, expires_at, ip_address, user_agent, device_name, is_active, created_at, updated_at
- [x] Foreign key to users table with CASCADE delete
- [x] Index on user_id for fast lookups
- [x] Cascade delete when user deleted

**Dependencies**: Story 2.1

**Test Cases**:
- TC-2.2-01: Session table created
- TC-2.2-02: Can create session for user
- TC-2.2-03: Can query sessions by user_id
- TC-2.2-04: Session deleted when user deleted

---

**Audit Trail**:

| Field | Value |
|-------|-------|
| **Status** | Deployed |
| **Branch Name** | feature/1.4-database-setup (Phase 1) |
| **Commits** | Included in Phase 1 staging merge |
| **Started** | Nov 6, 2025 |
| **In Development** | Nov 6, 2025 |
| **In Testing** | Nov 6, 2025 |
| **In Staging** | Nov 6, 2025 |
| **Deployed to Main** | Pending (in staging) |
| **Migration** | 20251106000002_create_sessions_table.js |
| **Test Results** | ✅ All acceptance criteria met |
| **Rollback Count** | 0 |
| **Notes** | Sessions table was created as part of Story 1.4 (Database Setup) in Phase 1, alongside the users table. Both foundational tables were implemented together for efficiency. |

---

#### Story 2.3 - OAuth Accounts Table

**Status**: 🟢 Deployed

**User Story**:
> As a **developer**, I want an **OAuth accounts table**, so that **I can link social login accounts to users**.

**Branch**: `feature/2.3-oauth-accounts-table` (includes Story 2.4)

**Description**:
Create table to store OAuth provider information (Google, GitHub) linked to user accounts. This story also includes refactoring the users table to remove OAuth columns.

**Acceptance Criteria**:
- [x] oauth_accounts table created (migration 20251106000003)
- [x] Fields: id, user_id, provider, provider_user_id, email, access_token, refresh_token, token_expires_at, profile_data, created_at, updated_at
- [x] Unique constraint on (provider, provider_user_id)
- [x] Foreign key to users table with CASCADE delete
- [x] Can link multiple providers to one user
- [x] OAuth columns removed from users table (migration 20251106000004)

**Dependencies**: Story 2.1

**Test Cases**:
- TC-2.3-01: OAuth accounts table created
- TC-2.3-02: Can link Google account to user
- TC-2.3-03: Can link GitHub account to user
- TC-2.3-04: Cannot link same provider account twice

---

**Audit Trail**:

| Field | Value |
|-------|-------|
| **Status** | Deployed |
| **Branch Name** | feature/2.3-oauth-accounts-table |
| **Commits** | ba010bb |
| **Started** | Nov 6, 2025 |
| **In Development** | Nov 6, 2025 |
| **In Testing** | Nov 6, 2025 |
| **In Staging** | Nov 6, 2025 |
| **Deployed to Main** | Pending (in staging) |
| **Migrations** | 20251106000003 (create oauth_accounts), 20251106000004 (remove OAuth columns from users) |
| **Test Results** | ✅ All acceptance criteria met, schema verified |
| **Rollback Count** | 0 |
| **Notes** | Combined with Story 2.4 for efficiency. Both OAuth and MFA tables were created together in a single feature branch since both required refactoring the users table. This approach minimized migration count and maintained consistency. |

---

#### Story 2.4 - MFA Secrets Table

**Status**: 🟢 Deployed

**User Story**:
> As a **developer**, I want an **MFA secrets table**, so that **I can store two-factor authentication data securely**.

**Branch**: `feature/2.3-oauth-accounts-table` (combined with Story 2.3)

**Description**:
Create table to store MFA secrets and backup codes for users who enable two-factor authentication. This story was combined with Story 2.3 for efficiency since both required refactoring the users table.

**Acceptance Criteria**:
- [x] mfa_secrets table created (migration 20251106000005)
- [x] Fields: id, user_id, secret, backup_codes, enabled, enabled_at, last_used_at, failed_attempts, locked_until, created_at, updated_at
- [x] Secret field ready for application-level encryption
- [x] One-to-one relationship with users (unique constraint on user_id)
- [x] Backup codes stored as JSON array
- [x] Brute-force protection fields added (failed_attempts, locked_until)
- [x] MFA columns removed from users table (migration 20251106000006)

**Dependencies**: Story 2.1

**Test Cases**:
- TC-2.4-01: MFA secrets table created
- TC-2.4-02: Can store encrypted secret
- TC-2.4-03: Can store backup codes
- TC-2.4-04: Only one MFA secret per user

---

**Audit Trail**:

| Field | Value |
|-------|-------|
| **Status** | Deployed |
| **Branch Name** | feature/2.3-oauth-accounts-table (combined with 2.3) |
| **Commits** | ba010bb (same as 2.3) |
| **Started** | Nov 6, 2025 |
| **In Development** | Nov 6, 2025 |
| **In Testing** | Nov 6, 2025 |
| **In Staging** | Nov 6, 2025 |
| **Deployed to Main** | Pending (in staging) |
| **Migrations** | 20251106000005 (create mfa_secrets), 20251106000006 (remove MFA columns from users) |
| **Test Results** | ✅ All acceptance criteria met, schema verified |
| **Rollback Count** | 0 |
| **Notes** | Combined with Story 2.3 in a single feature branch. This approach was more efficient because both stories required refactoring the users table to remove embedded OAuth and MFA data. By combining them, we created a cleaner schema migration with better separation of concerns. The refactored schema allows for multiple OAuth providers per user and enhanced MFA security with brute-force protection. |

---

## Phase 3: Basic JWT Authentication

**Goal**: Implement user registration, login, and JWT token management

**Dependencies**: Phase 2 complete

**Estimated Time**: 2-3 days

### Stories

#### Story 3.1 - Password Hashing & Validation

**Status**: ⬜ Not Started

**User Story**:
> As a **developer**, I want **secure password hashing with bcrypt**, so that **user passwords are never stored in plain text**.

**Branch**: `feature/3.1-password-hashing`

**Description**:
Implement password hashing using bcrypt with proper salt rounds and password strength validation.

**Acceptance Criteria**:
- [ ] Bcrypt installed and configured
- [ ] Password hashed before saving to database
- [ ] Password strength validation (min 8 chars, uppercase, lowercase, number, special char)
- [ ] Password comparison function for login
- [ ] Passwords never logged or returned in API responses

**Technical Notes**:
```javascript
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;

// Hash password
const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

// Compare password
const isValid = await bcrypt.compare(password, hashedPassword);
```

**Dependencies**: Story 2.1

**Test Cases**:
- TC-3.1-01: Password hashed with bcrypt
- TC-3.1-02: Weak password rejected
- TC-3.1-03: Strong password accepted
- TC-3.1-04: Password comparison works correctly
- TC-3.1-05: Original password not stored

---

**Audit Trail**: *(Same structure)*

---

#### Story 3.2 - User Registration Endpoint

**Status**: ⬜ Not Started

**User Story**:
> As a **user**, I want to **register for an account**, so that **I can use the application**.

**Branch**: `feature/3.2-user-registration`

**Description**:
Create API endpoint for user registration with email and password, including validation and error handling.

**Acceptance Criteria**:
- [ ] POST /api/auth/register endpoint created
- [ ] Validates email format
- [ ] Validates password strength
- [ ] Checks for duplicate email
- [ ] Hashes password before saving
- [ ] Returns JWT token on success
- [ ] Returns appropriate errors for invalid input

**Technical Notes**:
- Request body: `{ email, password, name }`
- Response: `{ token, user: { id, email, name } }`

**Dependencies**: Stories 2.1, 3.1

**Test Cases**:
- TC-3.2-01: Can register with valid credentials
- TC-3.2-02: Duplicate email rejected (409 Conflict)
- TC-3.2-03: Invalid email rejected (400 Bad Request)
- TC-3.2-04: Weak password rejected (400 Bad Request)
- TC-3.2-05: Returns JWT token on success

---

**Audit Trail**: *(Same structure)*

---

#### Story 3.3 - User Login Endpoint

**Status**: ⬜ Not Started

**User Story**:
> As a **user**, I want to **login with my credentials**, so that **I can access my account**.

**Branch**: `feature/3.3-user-login`

**Description**:
Create login endpoint that authenticates user credentials and returns JWT token.

**Acceptance Criteria**:
- [ ] POST /api/auth/login endpoint created
- [ ] Validates email and password
- [ ] Checks credentials against database
- [ ] Returns JWT token on success
- [ ] Returns 401 for invalid credentials
- [ ] Rate limiting implemented (max 5 attempts per 15 minutes)

**Dependencies**: Stories 2.1, 3.1

**Test Cases**:
- TC-3.3-01: Can login with valid credentials
- TC-3.3-02: Invalid email returns 401
- TC-3.3-03: Invalid password returns 401
- TC-3.3-04: Returns JWT token on success
- TC-3.3-05: Rate limiting blocks after 5 failed attempts

---

**Audit Trail**: *(Same structure)*

---

#### Story 3.4 - JWT Token Generation & Validation

**Status**: ⬜ Not Started

**User Story**:
> As a **developer**, I want **JWT token generation and validation**, so that **I can secure API endpoints**.

**Branch**: `feature/3.4-jwt-tokens`

**Description**:
Implement JWT token generation with access and refresh tokens, including token validation middleware.

**Acceptance Criteria**:
- [ ] Access token generated (expires in 15 minutes)
- [ ] Refresh token generated (expires in 7 days)
- [ ] JWT_SECRET configured from environment
- [ ] Token validation middleware created
- [x] Expired tokens rejected
- [ ] Invalid tokens rejected

**Dependencies**: Story 2.1

**Test Cases**:
- TC-3.4-01: Access token generated correctly
- TC-3.4-02: Refresh token generated correctly
- TC-3.4-03: Valid token passes middleware
- TC-3.4-04: Expired token rejected
- TC-3.4-05: Invalid token rejected

---

**Audit Trail**: *(Same structure)*

---

#### Story 3.5 - Protected Routes Middleware

**Status**: ⬜ Not Started

**User Story**:
> As a **developer**, I want **authentication middleware for protected routes**, so that **only authenticated users can access them**.

**Branch**: `feature/3.5-protected-routes`

**Description**:
Create middleware that checks for valid JWT token and attaches user to request object.

**Acceptance Criteria**:
- [ ] Auth middleware created
- [ ] Checks Authorization header for token
- [ ] Validates token
- [ ] Attaches user object to req.user
- [ ] Returns 401 if no token or invalid token
- [ ] Can apply middleware to any route

**Dependencies**: Story 3.4

**Test Cases**:
- TC-3.5-01: Request with valid token allowed
- TC-3.5-02: Request without token rejected (401)
- TC-3.5-03: Request with invalid token rejected (401)
- TC-3.5-04: req.user populated correctly

---

**Audit Trail**: *(Same structure)*

---

#### Story 3.6 - Token Refresh Endpoint

**Status**: ⬜ Not Started

**User Story**:
> As a **user**, I want my **session to refresh automatically**, so that **I don't get logged out while actively using the app**.

**Branch**: `feature/3.6-token-refresh`

**Description**:
Create endpoint to refresh access token using refresh token.

**Acceptance Criteria**:
- [ ] POST /api/auth/refresh endpoint created
- [ ] Accepts refresh token
- [ ] Validates refresh token
- [ ] Returns new access token
- [ ] Optionally returns new refresh token (rotation)
- [ ] Invalidates old refresh token

**Dependencies**: Story 3.4

**Test Cases**:
- TC-3.6-01: Can refresh with valid refresh token
- TC-3.6-02: Invalid refresh token rejected
- TC-3.6-03: Expired refresh token rejected
- TC-3.6-04: New access token works

---

**Audit Trail**: *(Same structure)*

---

## Phase 4: Email Verification System

**Goal**: Implement email verification flow for new user registrations

**Dependencies**: Phase 3 complete

**Estimated Time**: 1-2 days

### Stories

#### Story 4.1 - Email Service Configuration

**Status**: ⬜ Not Started

**User Story**:
> As a **developer**, I want **email sending configured**, so that **I can send verification emails to users**.

**Branch**: `feature/4.1-email-service`

**Description**:
Set up Nodemailer with SMTP configuration (Gmail, SendGrid, or similar) and create email service layer.

**Acceptance Criteria**:
- [x] Nodemailer installed and configured
- [x] SMTP credentials in environment variables
- [x] Email service module created
- [x] Can send test email
- [x] Email templates folder structure
- [x] Error handling for failed emails

**Dependencies**: Phase 1

**Test Cases**:
- TC-4.1-01: Can send email successfully
- TC-4.1-02: Failed email returns error
- TC-4.1-03: Email config loaded from environment

---

**Audit Trail**: *(Same structure)*

---

#### Story 4.2 - Email Verification Token Generation

**Status**: ⬜ Not Started

**User Story**:
> As a **developer**, I want **secure verification tokens**, so that **email verification is secure**.

**Branch**: `feature/4.2-verification-tokens`

**Description**:
Create system for generating, storing, and validating email verification tokens with expiration.

**Acceptance Criteria**:
- [x] Verification token generated on registration
- [x] Token stored in database with expiration (24 hours)
- [x] Token is random and cryptographically secure
- [x] Token validation function created
- [ ] Expired tokens rejected

**Dependencies**: Story 2.1

**Test Cases**:
- TC-4.2-01: Token generated on registration
- TC-4.2-02: Token is unique
- TC-4.2-03: Token expires after 24 hours
- TC-4.2-04: Valid token passes validation
- TC-4.2-05: Expired token fails validation

---

**Audit Trail**: *(Same structure)*

---

#### Story 4.3 - Send Verification Email

**Status**: ⬜ Not Started

**User Story**:
> As a **user**, I want to **receive a verification email after registration**, so that **I can verify my email address**.

**Branch**: `feature/4.3-send-verification-email`

**Description**:
Send verification email with link when user registers, including HTML email template.

**Acceptance Criteria**:
- [x] Verification email sent on registration
- [x] Email contains verification link
- [x] Link includes verification token
- [x] HTML email template created
- [x] Plain text fallback included
- [x] Email sent asynchronously (doesn't block registration)

**Dependencies**: Stories 4.1, 4.2

**Test Cases**:
- TC-4.3-01: Email sent on registration
- TC-4.3-02: Email contains valid link
- TC-4.3-03: Clicking link works
- TC-4.3-04: Email looks good (HTML rendering)

---

**Audit Trail**: *(Same structure)*

---

#### Story 4.4 - Email Verification Endpoint

**Status**: ⬜ Not Started

**User Story**:
> As a **user**, I want to **click a link to verify my email**, so that **my account is activated**.

**Branch**: `feature/4.4-verify-email-endpoint`

**Description**:
Create endpoint that handles email verification link clicks and marks user as verified.

**Acceptance Criteria**:
- [ ] GET /api/auth/verify-email/:token endpoint created
- [ ] Validates verification token
- [ ] Marks user as email_verified = true
- [ ] Invalidates token after use
- [ ] Returns success/error message
- [ ] Frontend page displays verification result

**Dependencies**: Stories 4.2, 4.3

**Test Cases**:
- TC-4.4-01: Valid token verifies email
- TC-4.4-02: Invalid token returns error
- TC-4.4-03: Expired token returns error
- TC-4.4-04: Token can only be used once
- TC-4.4-05: User marked as verified in database

---

**Audit Trail**: *(Same structure)*

---

## Phase 5: Password Reset Flow

**Goal**: Implement secure password reset functionality

**Dependencies**: Phase 4 complete (email system)

**Estimated Time**: 1 day

### Stories

#### Story 5.1 - Forgot Password Endpoint

**Status**: ⬜ Not Started

**User Story**:
> As a **user**, I want to **request a password reset**, so that **I can regain access if I forget my password**.

**Branch**: `feature/5.1-forgot-password`

**Description**:
Create endpoint that generates password reset token and sends reset email.

**Acceptance Criteria**:
- [ ] POST /api/auth/forgot-password endpoint created
- [ ] Accepts email address
- [ ] Generates reset token (expires in 1 hour)
- [ ] Sends password reset email
- [ ] Rate limited (max 3 requests per hour)
- [ ] Returns success even if email doesn't exist (security)

**Dependencies**: Story 4.1

**Test Cases**:
- TC-5.1-01: Can request password reset
- TC-5.1-02: Reset email sent
- TC-5.1-03: Token expires after 1 hour
- TC-5.1-04: Rate limiting works

---

**Audit Trail**: *(Same structure)*

---

#### Story 5.2 - Reset Password Endpoint

**Status**: ⬜ Not Started

**User Story**:
> As a **user**, I want to **set a new password using reset link**, so that **I can access my account again**.

**Branch**: `feature/5.2-reset-password`

**Description**:
Create endpoint that validates reset token and updates user password.

**Acceptance Criteria**:
- [ ] POST /api/auth/reset-password/:token endpoint created
- [ ] Validates reset token
- [ ] Validates new password strength
- [ ] Updates password in database
- [ ] Invalidates reset token after use
- [ ] Invalidates all existing sessions
- [ ] Sends confirmation email

**Dependencies**: Story 5.1

**Test Cases**:
- TC-5.2-01: Can reset password with valid token
- TC-5.2-02: Invalid token rejected
- TC-5.2-03: Expired token rejected
- TC-5.2-04: Weak password rejected
- TC-5.2-05: Old sessions invalidated

---

**Audit Trail**: *(Same structure)*

---

#### Story 5.3 - Password Reset Frontend Pages

**Status**: ⬜ Not Started

**User Story**:
> As a **user**, I want **UI pages for password reset**, so that **I have a good user experience**.

**Branch**: `feature/5.3-password-reset-ui`

**Description**:
Create frontend pages for forgot password form and reset password form.

**Acceptance Criteria**:
- [ ] Forgot password page created
- [ ] Reset password page created
- [ ] Forms have proper validation
- [ ] Success/error messages displayed
- [ ] Loading states during API calls
- [ ] Redirect to login after successful reset

**Dependencies**: Story 5.2

**Test Cases**:
- TC-5.3-01: Forgot password form submits correctly
- TC-5.3-02: Reset password form submits correctly
- TC-5.3-03: Validation errors display properly
- TC-5.3-04: Success message displays
- TC-5.3-05: Redirects to login after reset

---

**Audit Trail**: *(Same structure)*

---

## Phase 6: OAuth2 Social Login

**Goal**: Implement Google and GitHub OAuth2 login

**Dependencies**: Phase 3 complete

**Estimated Time**: 2-3 days

### Stories

#### Story 6.1 - Passport.js Setup

**Story 6.2 - Google OAuth Strategy**

**Story 6.3 - GitHub OAuth Strategy**

**Story 6.4 - OAuth Account Linking**

**Story 6.5 - OAuth Login Frontend UI**

**Story 6.6 - OAuth Callback Handling**

*(Full details similar to above phases)*

---

## Phase 7-12

*(Continuing with similar detailed user stories for:)*
- **Phase 7**: Multi-Factor Authentication (5 stories)
- **Phase 8**: User Dashboard & Profile Management (6 stories)
- **Phase 9**: Session Management & Security (5 stories)
- **Phase 10**: Admin Panel (6 stories)
- **Phase 11**: Testing & Documentation (6 stories)
- **Phase 12**: Production Preparation & Deployment (9 stories)

---

## Rollback History

| Date | From Version | To Version | Environment | Story | Reason | Rolled Back By | Duration |
|------|--------------|------------|-------------|-------|--------|----------------|----------|
| - | - | - | - | - | - | - | - |

---

## Deployment History

| Date | Version | Environment | Stories Deployed | Deployed By | Status | Notes |
|------|---------|-------------|------------------|-------------|--------|-------|
| - | - | - | - | - | - | - |

---

*This roadmap is a living document and will be updated as the project progresses.*
