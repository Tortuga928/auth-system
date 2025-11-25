# Quick Start Guide

## Get Up and Running in 5 Minutes

This guide helps you quickly set up and start using the Authentication System.

---

## For Users

### 1. Create Your Account

```
1. Go to https://auth-frontend.onrender.com
2. Click "Register"
3. Fill in: username, email, password
4. Check email → Click verification link
5. Done! You can now log in.
```

### 2. Secure Your Account

```
1. Log in to your account
2. Go to Security Settings
3. Enable Two-Factor Authentication (2FA)
4. Save your backup codes somewhere safe
5. Your account is now protected!
```

### 3. Explore Features

| Feature | Where to Find |
|---------|---------------|
| Update profile | Dashboard → Edit Profile |
| Change password | Security → Change Password |
| View login history | Security → Login History |
| Manage sessions | Security → Active Sessions |
| Upload avatar | Edit Profile → Upload Photo |

---

## For Developers

### Prerequisites

- Docker & Docker Compose
- Git
- Node.js 18+ (optional, for local development)

### 1. Clone the Repository

```bash
git clone https://github.com/Tortuga928/auth-system.git
cd auth-system
```

### 2. Start with Docker

```bash
# Start all services
docker-compose up -d

# Check status
docker ps

# View logs
docker-compose logs -f
```

### 3. Access the Application

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000/api |
| API Docs | http://localhost:5000/api/docs |
| PostgreSQL | localhost:5432 |

### 4. Create a Test User

```bash
# Register via API
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"Test123!@#"}'
```

Or use the frontend registration form.

### 5. Run Tests

```bash
# Backend tests
docker-compose exec backend npm test

# Frontend tests
docker-compose exec frontend npm test

# Performance tests
docker-compose exec backend npm run test:perf
```

---

## For Admins

### Getting Admin Access

1. Contact a super_admin to grant you admin role
2. Log out and log back in
3. Click "Admin" in the navigation

### Admin Quick Actions

| Task | Steps |
|------|-------|
| View all users | Admin → Users |
| Deactivate user | Users → Select user → Deactivate |
| View audit logs | Admin → Audit Logs |
| Check security | Admin → Security |
| View statistics | Admin → Dashboard |

### Super Admin Only

| Task | Steps |
|------|-------|
| Change user role | Users → Select user → Change Role |
| Manage other admins | Users → Filter by admin role |

---

## Common Tasks

### Reset Your Password

```
1. Click "Forgot Password?" on login page
2. Enter your email
3. Check email for reset link
4. Click link → Create new password
```

### Set Up 2FA

```
1. Download Google Authenticator or Authy
2. Go to Security → Two-Factor Authentication
3. Click "Enable 2FA"
4. Scan QR code with your app
5. Enter the 6-digit code
6. SAVE YOUR BACKUP CODES!
```

### Log Out of All Devices

```
1. Go to Security → Active Sessions
2. Click "Revoke All Other Sessions"
3. Only your current session remains
```

### Delete Your Account

```
1. Go to Account Settings
2. Scroll to "Delete Account"
3. Enter password + type "DELETE"
4. Account is permanently deleted
```

---

## Environment Configuration

### Required Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# JWT
JWT_SECRET=your-super-secret-key
JWT_REFRESH_SECRET=another-secret-key

# Email (SendGrid)
SENDGRID_API_KEY=your-sendgrid-key
EMAIL_FROM=noreply@yourdomain.com

# OAuth (optional)
GOOGLE_CLIENT_ID=your-google-id
GOOGLE_CLIENT_SECRET=your-google-secret
GITHUB_CLIENT_ID=your-github-id
GITHUB_CLIENT_SECRET=your-github-secret
```

### Development vs Production

| Setting | Development | Production |
|---------|-------------|------------|
| NODE_ENV | development | production |
| Database | Docker PostgreSQL | Managed PostgreSQL |
| HTTPS | No | Yes (required) |
| Debug logs | Enabled | Disabled |

---

## API Quick Reference

### Authentication

```bash
# Register
POST /api/auth/register
{username, email, password}

# Login
POST /api/auth/login
{email, password}
→ Returns: {accessToken, refreshToken}

# Logout
POST /api/auth/logout
Authorization: Bearer <token>

# Refresh Token
POST /api/auth/refresh
{refreshToken}
```

### User Profile

```bash
# Get Profile
GET /api/user/profile
Authorization: Bearer <token>

# Update Profile
PUT /api/user/profile
Authorization: Bearer <token>
{displayName, bio, location}
```

### 2FA

```bash
# Setup 2FA
POST /api/auth/mfa/setup
→ Returns: {secret, qrCode}

# Enable 2FA
POST /api/auth/mfa/enable
{token: "123456"}
→ Returns: {backupCodes}

# Verify 2FA (during login)
POST /api/auth/mfa/verify
{mfaToken, token: "123456"}
```

---

## Troubleshooting

### Docker Issues

```bash
# Reset everything
docker-compose down -v
docker-compose up -d --build

# Check logs
docker-compose logs backend
docker-compose logs frontend
```

### Database Issues

```bash
# Run migrations
docker-compose exec backend npm run migrate

# Reset database
docker-compose down -v
docker-compose up -d
docker-compose exec backend npm run migrate
docker-compose exec backend npm run seed
```

### Authentication Issues

- **Can't log in**: Check email verification status
- **Token expired**: Refresh token or log in again
- **2FA not working**: Ensure phone time is synced

---

## Need More Help?

| Resource | Link |
|----------|------|
| User Guide | [docs/USER_GUIDE.md](./USER_GUIDE.md) |
| Admin Guide | [docs/ADMIN_GUIDE.md](./ADMIN_GUIDE.md) |
| API Documentation | [/api/docs](/api/docs) |
| Troubleshooting | [docs/TROUBLESHOOTING.md](./TROUBLESHOOTING.md) |
| Docker Guide | [docs/DOCKER_GUIDE.md](./DOCKER_GUIDE.md) |

---

*Last Updated: November 25, 2025*
