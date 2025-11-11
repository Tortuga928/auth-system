# Authentication System - AI Assistant Guide

## 🏷️ Project Identity

**Project Name**: Authentication System
**Project ID**: auth-system
**Working Directory**: C:\Users\MSTor\Projects\auth-system
**Platform**: Windows with Git Bash (MINGW64_NT-10.0-26100)

**Git Repositories**:
- Main Repository: https://github.com/Tortuga928/auth-system

**Development Ports**:
- Frontend: 3000
- Backend: 5000
- PostgreSQL: 5432
- Redis: 6379

**Production Deployment**: Docker Hub
- Backend Image: mstor/auth-backend
- Frontend Image: mstor/auth-frontend

---

## 🔄 Session Recovery

**⚠️ IMPORTANT**: If resuming work after a session interruption, **READ THIS FIRST**:

**Current Active Work**: Phase 9 - Session Management & Security (READY TO START)

📄 **Beta Branch Documentation**: [docs/BETA_BRANCH_SETUP.md](./docs/BETA_BRANCH_SETUP.md)
📄 **Beta Environment**: https://auth-frontend-beta.onrender.com

**Current Status** (November 11, 2025):
- ✅ **Phase 7 Complete** - All MFA features (Stories 7.1-7.5) - 100% tested in beta
- ✅ **Phase 7-Beta Complete** - Deployed to Render.com, tested, and synced back
- ✅ **Phase 8 Complete** - User Dashboard & Profile Management (6/6 stories, 100%)
  - ✅ Story 8.1: User Dashboard Page
  - ✅ Story 8.2: Avatar Upload & Management
  - ✅ Story 8.3: Profile Edit Page
  - ✅ Story 8.4: Activity Log Page
  - ✅ Story 8.5: Account Settings (password change, account deletion)
  - ✅ Story 8.6: Profile Integration Tests (23 tests, 100% pass rate)
- ✅ **Phase 8-Beta Complete** - Deployed to Render.com, tested, and synced back to staging

**Next Phase**: Phase 9 - Session Management & Security (5 stories)

---

## ⚠️ CRITICAL: Command Compatibility Guidelines

### Environment Context
You are running in **Git Bash on Windows**, which has limited Unix command availability. Always use commands that work in this environment.

### ✅ Available Commands (Always Safe)

**File Operations:**
```bash
ls, cd, pwd, mkdir, cp, mv, rm, touch
cat, head, tail, less, more
find, grep, sed, awk
```

**Development Tools:**
```bash
git (all commands)
docker, docker-compose
npm, node, npx
```

**Process Management:**
```bash
ps, kill, pkill
```

### ❌ Commands That May NOT Be Available

**Avoid these commands** - they require separate installation in Git Bash:

```bash
❌ tree         # Use: ls -R or find instead
❌ watch        # Use: while loop or manual checks
❌ curl         # May not be installed - use node fetch
❌ wget         # Use alternatives
❌ htop/top     # Use: ps aux
❌ netstat      # Use: docker ps for containers
```

### Recommended Command Patterns

#### Directory Listing

```bash
# ✅ GOOD - List directory structure
ls -la                              # Detailed list
find . -type d -maxdepth 2         # Find directories (2 levels)
ls -R                               # Recursive list
find . -type f -name "*.js"        # Find specific files

# ❌ BAD - Requires installation
tree -L 2
```

#### File Search

```bash
# ✅ GOOD - Search for files
find . -name "*.js" | grep -v node_modules
find backend/src -type f -name "*.js"
grep -r "searchterm" . --include="*.js"

# ❌ BAD
tree -P "*.js"
```

#### Monitoring/Watching

```bash
# ✅ GOOD - Watch logs
docker-compose logs -f
docker-compose logs -f backend
tail -f backend/logs/app.log

# ❌ BAD
watch docker ps
```

---

## Project Overview

**What it is**: Full-stack authentication system with JWT, OAuth2, MFA, and RBAC.

**Architecture**:
- Frontend: React 18 (port 3000)
- Backend: Node.js/Express (port 5000)
- Database: PostgreSQL 15 (port 5432)
- Cache: Redis 7 (port 6379)
- Containerization: Docker Compose

**Key Features**:
- JWT authentication with refresh tokens
- Email verification system
- Password reset functionality
- OAuth2 social login (Google, GitHub)
- Multi-factor authentication (TOTP/2FA)
- User dashboard and profile management
- Session management with device tracking
- Role-based access control (RBAC)
- Admin panel for user management

---

## Directory Structure

```
auth-system/
├── backend/              # Node.js/Express API
│   ├── src/             # Source code
│   │   ├── config/      # Configuration files
│   │   ├── controllers/ # Route controllers
│   │   ├── models/      # Database models
│   │   ├── routes/      # API routes
│   │   ├── middleware/  # Custom middleware
│   │   ├── services/    # Business logic
│   │   └── utils/       # Helper functions
│   ├── tests/           # Backend tests
│   ├── Dockerfile.dev   # Development container
│   ├── Dockerfile.prod  # Production container
│   └── package.json
│
├── frontend/            # React application
│   ├── src/            # React components
│   │   ├── components/ # Reusable components
│   │   ├── pages/      # Page components
│   │   ├── services/   # API integration
│   │   ├── hooks/      # Custom hooks
│   │   ├── context/    # React context
│   │   └── utils/      # Helper functions
│   ├── public/         # Static assets
│   ├── Dockerfile.dev  # Development container
│   ├── Dockerfile.prod # Production container
│   └── package.json
│
├── database/           # PostgreSQL
│   ├── migrations/     # Schema migrations
│   └── seeds/          # Test data
│
├── scripts/            # Automation scripts
│   ├── deploy/         # Deployment scripts
│   ├── rollback/       # Rollback scripts
│   └── test/           # Testing scripts
│
├── docs/               # Documentation
│   ├── PROJECT_ROADMAP.md
│   ├── GIT_WORKFLOW.md
│   ├── DOCKER_GUIDE.md
│   ├── TESTING_GUIDE.md
│   ├── ROLLBACK_PROCEDURES.md
│   ├── DEPLOYMENT_CHECKLIST.md
│   └── TROUBLESHOOTING.md
│
├── docker-compose.yml  # Multi-container setup
├── .gitignore
├── CLAUDE.md          # This file
└── README.md
```

---

## Common Development Commands

### Docker Commands (Primary Development Method)

```bash
# Start all services (PostgreSQL + Redis + Backend + Frontend)
docker-compose up -d

# Check container status
docker ps

# View logs (all services)
docker-compose logs -f

# View logs (specific service)
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres

# Stop services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v

# Rebuild containers after code changes
docker-compose up -d --build

# Execute commands in running containers
docker-compose exec backend npm run migrate
docker-compose exec postgres psql -U postgres -d authdb
```

### Backend Development

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Run database migrations
npm run migrate

# Run database seeds
npm run seed

# Start development server (if not using Docker)
npm run dev

# Run tests
npm test

# Run linter
npm run lint

# Build for production
npm run build
```

### Frontend Development

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server (if not using Docker)
npm start

# Run tests
npm test

# Run linter
npm run lint

# Build for production
npm run build
```

### Git Workflow

**Branch Strategy**: feature/* → staging → beta → master

```bash
# Check current branch and status
git status

# Create feature branch (naming convention)
git checkout -b feature/story-id-description

# Example: git checkout -b feature/2.1-user-model

# Stage and commit changes
git add .
git commit -m "feat(scope): description"

# Push to remote
git push origin feature/story-id-description

# Merge to staging (after local testing)
git checkout staging
git merge feature/story-id-description
git push origin staging

# Merge to beta (after staging approval - auto-deploys to Render)
git checkout beta
git merge staging
git push origin beta

# Merge to master/production (after beta testing complete)
git checkout master
git merge beta
git push origin master
```

**Beta Branch**:
- Deployed to Render.com: https://auth-frontend-beta.onrender.com
- Auto-deploys on push to beta branch
- Used for pre-production testing of new features
- 4 services: backend, frontend, database (PostgreSQL), Redis

---

## Key Technical Patterns

### 1. Path Handling

**Always use forward slashes** in Git Bash, even on Windows:

```bash
# ✅ GOOD
cd backend/src
cat backend/package.json

# ❌ BAD (Windows-style paths fail in Git Bash)
cd backend\src
cat backend\package.json
```

### 2. Docker-First Development

**Primary development method is Docker Compose**:
- All services run in containers
- Database persists via Docker volumes
- Hot reload enabled for backend and frontend
- No need to install PostgreSQL/Redis locally

### 3. Environment Variables

**Development** (Docker Compose sets these):
- `NODE_ENV=development`
- `DATABASE_URL=postgresql://postgres:postgres@postgres:5432/authdb`
- `REDIS_URL=redis://redis:6379`

**Production** (set via hosting platform):
- Use `.env.example` as template
- Never commit `.env` files
- Use secrets management for sensitive data

### 4. Authentication Pattern

**JWT Token Flow**:
1. User logs in → receives access token + refresh token
2. Access token (1h expiry) for API requests
3. Refresh token (7d expiry) for obtaining new access tokens
4. Tokens stored in httpOnly cookies (production) or localStorage (development)

### 5. Database Migrations

**Always use migrations** - never modify schema directly:
```bash
# Create new migration
npm run migrate:create migration-name

# Run migrations
npm run migrate

# Rollback last migration
npm run migrate:rollback
```

### 6. Error Handling Pattern

**Backend**:
- Use centralized error handling middleware
- Return consistent error format: `{error: string, details?: any}`
- Log errors with timestamps and request context

**Frontend**:
- Use try/catch for async operations
- Display user-friendly error messages
- Log errors to console in development

### 7. Testing Pattern

**Test before committing**:
- Run unit tests: `npm test`
- Run integration tests: `npm run test:integration`
- Manual testing in Docker environment
- Check logs for errors

### 8. File Upload Pattern

**For avatar/file uploads** (implemented in Story 8.2):
- Use **multer** for file upload handling
- Use **sharp** for image processing
- **Validation**: File type (MIME), size limits
- **Processing**: Resize, optimize, format conversion
- **Storage**: Local filesystem (dev), cloud storage (prod)
- **CORS**: Configure for static file serving
  ```javascript
  // Add CORS headers to static files
  app.use('/uploads', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', config.cors.origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    next();
  }, express.static(path.join(__dirname, '../uploads')));

  // Configure helmet for cross-origin resources
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));
  ```
- **Cleanup**: Delete old files when replacing
- **Activity Logging**: Track upload/delete actions

---

## Development Workflow

### Starting a New Feature

1. **Check roadmap**: Review `docs/PROJECT_ROADMAP.md` for user stories
2. **Create branch**: `git checkout -b feature/story-id-description`
3. **Implement**: Write code, tests, documentation
4. **Test locally**: Use Docker Compose environment
5. **Commit**: Follow commit message conventions
6. **Push**: Push to remote repository
7. **PR to staging**: Create pull request to staging branch
8. **Test on staging**: Verify integration with other features
9. **Merge to main**: After staging approval

### Git Commit Conventions

```bash
# Format: type(scope): description

# Types:
feat      # New feature
fix       # Bug fix
docs      # Documentation changes
style     # Code style changes (formatting)
refactor  # Code refactoring
test      # Adding/updating tests
chore     # Build process, dependencies

# Examples:
git commit -m "feat(auth): add JWT token generation"
git commit -m "fix(login): resolve password validation issue"
git commit -m "docs(readme): update installation instructions"
git commit -m "test(user): add user model unit tests"
```

### Testing Workflow

1. **Unit tests**: Test individual functions/components
2. **Integration tests**: Test API endpoints with database
3. **Manual testing**: Use Docker environment
4. **Check logs**: Review backend/frontend logs for errors

### Deployment Workflow

**See `docs/DEPLOYMENT_CHECKLIST.md` for complete procedures**

1. **Pre-deployment**:
   - Run all tests
   - Build production images
   - Review DEPLOYMENT_CHECKLIST.md

2. **Build & Push**:
   - Build Docker images with version tags
   - Push to Docker Hub
   - Tag git commit

3. **Deploy**:
   - Update hosting platform with new image
   - Run database migrations
   - Verify deployment

4. **Post-deployment**:
   - Monitor logs for errors
   - Test critical functionality
   - Update PROJECT_ROADMAP.md

---

## Common Issues Quick Reference

**For detailed troubleshooting, see `docs/TROUBLESHOOTING.md`**

| Issue | Quick Fix |
|-------|-----------|
| Docker containers won't start | Run `docker-compose down -v && docker-compose up -d` |
| Backend can't connect to database | Check PostgreSQL health: `docker-compose logs postgres` |
| Frontend can't reach backend | Verify REACT_APP_API_URL in docker-compose.yml |
| Port already in use | Stop conflicting process or change port in docker-compose.yml |
| Database migrations fail | Check migration syntax, rollback and retry |
| Redis connection timeout | Check Redis health: `docker-compose logs redis` |
| Hot reload not working | Check volume mounts in docker-compose.yml |
| Permission denied errors | Run Git Bash as administrator (Windows) |

---

## Project Status & Roadmap

**Current Phase**: Phase 9 - Session Management & Security (READY TO START)
**Overall Progress**: 63.1% (41/65 stories completed)

### Development Phases (14 Total - Including Phase 7-Beta and 8-Beta)

1. ✅ **Phase 1**: Project Setup & Infrastructure (COMPLETE)
2. ✅ **Phase 2**: Database Schema & Core Models (COMPLETE)
3. ✅ **Phase 3**: Basic JWT Authentication (COMPLETE)
4. ✅ **Phase 4**: Email Verification System (COMPLETE)
5. ✅ **Phase 5**: Password Reset Flow (COMPLETE)
6. ✅ **Phase 6**: OAuth2 Social Login (COMPLETE)
7. ✅ **Phase 7**: Multi-Factor Authentication (COMPLETE - 5/5 stories, 100%)
   - ✅ Story 7.1: MFA Model & TOTP Logic
   - ✅ Story 7.2: MFA Setup Endpoints
   - ✅ Story 7.3: MFA Login Flow
   - ✅ Story 7.4: MFA Recovery & Management
   - ✅ Story 7.5: MFA Settings UI
7b. ✅ **Phase 7-Beta**: Beta Branch Deployment & Testing (COMPLETE - Nov 10, 2025)
   - ✅ Beta branch created from staging
   - ✅ Deployed to Render.com (4 services)
   - ✅ All MFA features tested and verified
   - ✅ Issues found and fixed (API URL, migrations, seeds)
   - ✅ Fixes merged back to staging
8. ✅ **Phase 8**: User Dashboard & Profile Management (COMPLETE - 6/6 stories, 100%)
   - ✅ Story 8.1: User Dashboard Page
   - ✅ Story 8.2: Avatar Upload & Management
   - ✅ Story 8.3: Profile Edit Page
   - ✅ Story 8.4: Activity Log Page
   - ✅ Story 8.5: Account Settings (password change, account deletion)
   - ✅ Story 8.6: Profile Integration Tests (23 tests, 100% pass)
8b. ✅ **Phase 8-Beta**: Beta Branch Deployment & Testing (COMPLETE - Nov 11, 2025)
   - ✅ Deployed Phase 8 features to Render.com beta
   - ✅ Fixed idempotent migrations (safe to run multiple times)
   - ✅ Fixed Docker upload directory permissions
   - ✅ All Phase 8 features tested and verified in production environment
   - ✅ Fixes merged back to staging
9. 📋 **Phase 9**: Session Management & Security
10. 📋 **Phase 10**: Admin Panel
11. 📋 **Phase 11**: Testing & Documentation
12. 📋 **Phase 12**: Production Preparation & Deployment

**See `docs/PROJECT_ROADMAP.md` for detailed user stories and progress tracking**

---

## Code Conventions

### Backend (Node.js/Express)

**File naming**: camelCase for files, PascalCase for classes
```javascript
// userController.js
class UserController {
  // ...
}
```

**Async/await**: Use async/await instead of promises
```javascript
// ✅ GOOD
async function getUser(id) {
  try {
    const user = await User.findById(id);
    return user;
  } catch (error) {
    throw new Error(`Failed to fetch user: ${error.message}`);
  }
}
```

**Error handling**: Use centralized middleware
```javascript
// errors/AppError.js
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}
```

### Frontend (React)

**Component naming**: PascalCase for components
```javascript
// LoginForm.jsx
function LoginForm() {
  // ...
}
```

**Hooks**: Use functional components with hooks
```javascript
// ✅ GOOD
function UserProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();
  }, []);

  return <div>{user?.name}</div>;
}
```

**State management**: Use Context API or Redux (decide in Phase 8)

---

## Testing Standards

### Unit Tests

**Backend**:
```bash
cd backend
npm test                    # Run all tests
npm test -- user.test.js    # Run specific test
npm test -- --coverage      # With coverage report
```

**Frontend**:
```bash
cd frontend
npm test                    # Run all tests
npm test -- LoginForm       # Run specific component test
```

### Integration Tests

**API endpoints**:
```bash
cd backend
npm run test:integration
```

### Test Coverage Requirements

- **Minimum coverage**: 80% for critical paths
- **Controllers**: 90%+ coverage
- **Services/Utils**: 85%+ coverage
- **Components**: 80%+ coverage

---

## Documentation Standards

### Code Documentation

**Always document**:
- Function purpose and parameters
- Complex logic or algorithms
- API endpoints (using JSDoc or OpenAPI)
- Environment variables required
- Configuration options

**Example**:
```javascript
/**
 * Generates a JWT access token for a user
 * @param {Object} user - User object with id and email
 * @param {string} user.id - User ID
 * @param {string} user.email - User email
 * @returns {string} JWT token
 * @throws {Error} If user object is invalid
 */
function generateAccessToken(user) {
  // ...
}
```

### Project Documentation

**Update after significant changes**:
- PROJECT_ROADMAP.md (mark stories complete)
- TROUBLESHOOTING.md (add new issues/solutions)
- README.md (update features/instructions)

---

## Security Best Practices

1. **Never commit secrets**: Use `.env` files (gitignored)
2. **Validate input**: Sanitize all user input
3. **Use prepared statements**: Prevent SQL injection
4. **Hash passwords**: Use bcrypt (min 10 rounds)
5. **Rate limiting**: Implement on sensitive endpoints
6. **CORS**: Configure properly for frontend origin
7. **HTTPS only**: In production
8. **Security headers**: Use helmet.js

---

## Quick Tips for AI Assistants

### Before Starting Work

1. **Check PROJECT_ROADMAP.md** for current phase and user stories
2. **Review relevant docs** in `/docs` directory
3. **Verify Docker environment** is running
4. **Check git status** and current branch

### Starting a New Phase or User Story

**⚠️ CRITICAL: ALWAYS use feature branches for phase/user story development**

When the user says they want to start a new phase or user story from PROJECT_ROADMAP.md:

1. **Check if feature branch already exists**:
   ```bash
   git branch -a | grep feature/story-id-description
   ```
   - Check both local and remote branches
   - Use naming convention: `feature/story-id-description`
   - Example: `feature/2.1-database-schema`, `feature/3.2-jwt-authentication`

2. **If branch EXISTS**:
   - Inform user: "Feature branch `feature/2.1-database-schema` already exists."
   - Checkout the existing branch: `git checkout feature/2.1-database-schema`
   - Pull latest changes: `git pull origin feature/2.1-database-schema`
   - Proceed with development

3. **If branch DOES NOT EXIST**:
   - Inform user: "Feature branch `feature/2.1-database-schema` doesn't exist yet."
   - **ASK for confirmation**: "Should I create it? [Yes/No]"
   - Wait for user approval
   - After confirmation, create branch from master:
     ```bash
     git checkout -b feature/2.1-database-schema
     ```
   - Confirm creation and proceed

4. **Only work on master for**:
   - Documentation-only updates (like CLAUDE.md, README.md)
   - Project infrastructure changes
   - Configuration files that affect all features

**Why this matters**: Feature branches keep the main codebase stable, allow parallel development, and make it easy to rollback if needed.

**Branch Note**: Currently using `master` as the main branch (will migrate to `main` later per git workflow docs).

### During Development

1. **Use Docker Compose** for all development
2. **Test incrementally** - don't wait until finished
3. **Check logs frequently** - catch errors early
4. **Follow naming conventions** consistently
5. **Write tests** alongside code (not after)

### Before Committing

1. **Run tests**: `npm test` in backend and frontend
2. **Check logs**: No errors in Docker logs
3. **Review changes**: `git diff` before staging
4. **Follow commit conventions**: `feat(scope): description`
5. **Update documentation**: If adding features

### Common Mistakes to Avoid

❌ Using `tree` command (not available in Git Bash)
❌ Hardcoding configuration values
❌ Skipping tests
❌ Committing `.env` files
❌ Not checking Docker logs
❌ Forgetting to run migrations
❌ Using Windows-style paths in Git Bash
❌ Not following git workflow (feature → staging → main)
❌ **Working directly on master for feature development** (always use feature branches)
❌ Creating feature branches without checking if they already exist first
❌ Creating feature branches without asking user for confirmation

---

## External Resources

- **Express.js Docs**: https://expressjs.com/
- **React Docs**: https://react.dev/
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **Docker Docs**: https://docs.docker.com/
- **JWT Best Practices**: https://tools.ietf.org/html/rfc8725

---

## Contact & Support

- **Project Lead**: (Add contact info)
- **Repository Issues**: (Add GitHub issues URL)
- **Documentation**: See `/docs` directory

---

*Last Updated: November 11, 2025*
*Version: 1.6*
*Current Phase: 9 Ready to Start - Phase 8 Complete (Dashboard, Avatar, Profile, Activity, Settings)*
