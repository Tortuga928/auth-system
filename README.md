# Authentication System

A full-stack authentication system with advanced security features including JWT authentication, email verification, OAuth2 social login, and multi-factor authentication (MFA).

## Technology Stack

- **Backend**: Node.js with Express
- **Frontend**: React
- **Database**: PostgreSQL
- **Caching**: Redis
- **Containerization**: Docker & Docker Compose
- **CI/CD**: Docker Hub

## Features

### Core Authentication
- ✅ JWT-based authentication with refresh tokens
- ✅ Email verification system
- ✅ Password reset functionality
- ✅ OAuth2 social login (Google, GitHub)
- ✅ Multi-factor authentication (TOTP/2FA)
- ✅ Complete logout with session invalidation
- ✅ User registration with rate limiting

### User Features
- ✅ User dashboard and profile management
- ✅ Avatar upload and management
- ✅ Session management with device tracking
- ✅ Login history and security alerts
- ✅ Activity log tracking

### Admin Features
- ✅ Role-based access control (RBAC)
- ✅ Admin panel for user management
- ✅ User CRUD operations (create, read, update, soft delete)
- ✅ Role and status management
- ✅ Comprehensive audit logging
- ✅ Admin dashboard with metrics and charts

### Security Features
- ✅ Rate limiting on sensitive endpoints
  - Registration: 5 requests/hour
  - Login: 10 requests/15 minutes
  - Password reset: 3 requests/hour
- ✅ Session timeout and "Remember Me"
- ✅ Device tracking and management
- ✅ Security event monitoring

## Project Structure

```
auth-system/
├── backend/          # Express.js backend API
├── frontend/         # React frontend application
├── database/         # Database migrations and seeds
├── docs/             # Project documentation
├── scripts/          # Automation scripts (deploy, rollback, test)
├── docker-compose.yml
└── README.md
```

## Documentation

Comprehensive documentation is available in the `/docs` directory:

- **[PROJECT_ROADMAP.md](docs/PROJECT_ROADMAP.md)** - Complete project roadmap with user stories and tracking
- **[GIT_WORKFLOW.md](docs/GIT_WORKFLOW.md)** - Git branching strategy and workflow
- **[DOCKER_GUIDE.md](docs/DOCKER_GUIDE.md)** - Docker build, deployment, and management
- **[TESTING_GUIDE.md](docs/TESTING_GUIDE.md)** - Testing procedures and documentation
- **[ROLLBACK_PROCEDURES.md](docs/ROLLBACK_PROCEDURES.md)** - Rollback and recovery procedures
- **[DEPLOYMENT_CHECKLIST.md](docs/DEPLOYMENT_CHECKLIST.md)** - Deployment verification checklist
- **[TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)** - Common issues and solutions

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Docker Desktop
- PostgreSQL (via Docker)
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Tortuga928/auth-system.git
cd auth-system
```

2. Start Docker containers:
```bash
docker-compose up -d
```

3. Install backend dependencies:
```bash
cd backend
npm install
```

4. Install frontend dependencies:
```bash
cd frontend
npm install
```

5. Set up environment variables (see `.env.example` in backend and frontend)

6. Run database migrations:
```bash
cd backend
npm run migrate
```

7. Start development servers:
```bash
# Backend (runs on port 5000)
cd backend
npm run dev

# Frontend (runs on port 3000)
cd frontend
npm start
```

## Development Workflow

This project uses a structured Git workflow with feature branches:

- **Feature branches**: `feature/story-id-description` (e.g., `feature/1.1-project-setup`)
- **Staging branch**: `staging` - Integration testing environment
- **Main branch**: `main` - Production-ready code

See [GIT_WORKFLOW.md](docs/GIT_WORKFLOW.md) for complete details.

## Deployment

Deployment is managed through Docker Hub with versioned images:

- Image tags follow format: `v1.0.0-abc123f` (version + git SHA)
- Staging deployments test features before production
- Rollback scripts available for quick recovery

See [DOCKER_GUIDE.md](docs/DOCKER_GUIDE.md) and [DEPLOYMENT_CHECKLIST.md](docs/DEPLOYMENT_CHECKLIST.md) for details.

## Testing

Comprehensive testing includes:

- Unit tests (Jest)
- Integration tests (Supertest)
- Frontend tests (React Testing Library)
- End-to-end tests (Cypress - optional)

See [TESTING_GUIDE.md](docs/TESTING_GUIDE.md) for complete testing procedures.

## Contributing

1. Check [PROJECT_ROADMAP.md](docs/PROJECT_ROADMAP.md) for available user stories
2. Create a feature branch following naming convention
3. Implement feature with tests
4. Submit PR to staging branch
5. After review and testing, merge to main

## License

MIT License

## Contact

For questions or issues, please refer to [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) or open an issue.

---

## Project Status

**Current Phase**: Phase 11 - Testing & Documentation (In Progress)
**Overall Progress**: 81.5% (53/65 stories completed)

### Completed Phases
- ✅ Phase 1-6: Core infrastructure and authentication
- ✅ Phase 7: Multi-Factor Authentication
- ✅ Phase 8: User Dashboard & Profile Management
- ✅ Phase 9: Session Management & Security
- ✅ Phase 10: Admin Panel
- 🔄 Phase 11: Testing & Documentation (Story 11.1 Complete)

See [PROJECT_ROADMAP.md](docs/PROJECT_ROADMAP.md) for detailed progress tracking.

---

*Last Updated: November 24, 2025*
