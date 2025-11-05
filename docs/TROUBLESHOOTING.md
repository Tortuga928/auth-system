# Troubleshooting Guide

This document provides solutions for common issues encountered during development, deployment, and operation of the Authentication System.

## Table of Contents

1. [Quick Diagnostics](#quick-diagnostics)
2. [Development Issues](#development-issues)
3. [Docker Issues](#docker-issues)
4. [Database Issues](#database-issues)
5. [Authentication Issues](#authentication-issues)
6. [Email Issues](#email-issues)
7. [Performance Issues](#performance-issues)
8. [Deployment Issues](#deployment-issues)
9. [Production Issues](#production-issues)
10. [Getting Help](#getting-help)

---

## Quick Diagnostics

### Health Check Commands

```bash
# Check all containers
docker-compose ps

# Check backend health
curl http://localhost:5000/health

# Check frontend
curl http://localhost:3000

# Check database connection
docker-compose exec backend node -e "require('./src/config/database').testConnection()"

# Check Redis connection
docker-compose exec backend node -e "require('./src/config/redis').ping()"

# View all logs
docker-compose logs --tail=50

# View specific service logs
docker-compose logs -f backend
```

---

## Development Issues

### Issue: npm install fails

**Symptoms**:
- Error during `npm install`
- Missing dependencies

**Solutions**:

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install

# If still failing, check Node version
node --version  # Should be 18+
nvm use 18      # If using nvm
```

### Issue: Port already in use

**Symptoms**:
- Error: `EADDRINUSE: address already in use :::5000`

**Solutions**:

```bash
# Find process using port 5000
lsof -i :5000        # Mac/Linux
netstat -ano | findstr :5000  # Windows

# Kill process
kill -9 <PID>        # Mac/Linux
taskkill /PID <PID> /F  # Windows

# Or use different port
PORT=5001 npm start
```

### Issue: Module not found

**Symptoms**:
- Error: `Cannot find module './some-module'`

**Solutions**:

```bash
# Ensure dependencies installed
npm install

# Check if file exists
ls src/path/to/module.js

# Check import path (case-sensitive)
# Correct: import './myModule'
# Wrong: import './MyModule'  # (if file is myModule.js)

# Clear Node cache
rm -rf node_modules/.cache
```

### Issue: Hot reload not working

**Symptoms**:
- Changes don't reflect without restart
- Need to manually restart server

**Solutions**:

```bash
# Backend (use nodemon)
npm install -g nodemon
nodemon src/app.js

# Frontend (check webpack config)
# Ensure webpack-dev-server is running
npm start

# Check if files are being watched
# Add to webpack.config.js:
watchOptions: {
  poll: 1000,
  ignored: /node_modules/
}
```

---

## Docker Issues

### Issue: Docker containers won't start

**Symptoms**:
- `docker-compose up` fails
- Containers exit immediately

**Solutions**:

```bash
# Check logs
docker-compose logs

# Remove old containers
docker-compose down
docker-compose up -d

# Rebuild images
docker-compose build --no-cache
docker-compose up -d

# Check Docker Desktop is running
docker ps  # Should not error
```

### Issue: Cannot connect to Docker daemon

**Symptoms**:
- Error: `Cannot connect to the Docker daemon`

**Solutions**:

```bash
# Start Docker Desktop
# (Open Docker Desktop application)

# On Linux, start Docker service
sudo systemctl start docker

# Check Docker status
docker info

# Add user to docker group (Linux)
sudo usermod -aG docker $USER
# Logout and login again
```

### Issue: Out of disk space

**Symptoms**:
- Error: `no space left on device`
- Builds fail

**Solutions**:

```bash
# Check disk usage
docker system df

# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Remove everything unused
docker system prune -a --volumes

# WARNING: This removes ALL unused data
```

### Issue: Container crashes immediately

**Symptoms**:
- Container starts then exits with code 1

**Solutions**:

```bash
# Check logs
docker-compose logs backend

# Run container interactively
docker run -it auth-backend:dev sh

# Check entry point
docker inspect auth-backend:dev | grep Entrypoint

# Override entry point for debugging
docker run -it --entrypoint sh auth-backend:dev
```

### Issue: Network issues between containers

**Symptoms**:
- Backend can't connect to database
- Error: `getaddrinfo ENOTFOUND postgres`

**Solutions**:

```bash
# Check network
docker network ls
docker network inspect auth-system_default

# Use service name as hostname
# Correct: DATABASE_URL=postgresql://user:pass@postgres:5432/db
# Wrong: DATABASE_URL=postgresql://user:pass@localhost:5432/db

# Recreate network
docker-compose down
docker network prune
docker-compose up -d
```

---

## Database Issues

### Issue: Database connection refused

**Symptoms**:
- Error: `connection refused`
- Backend can't connect to database

**Solutions**:

```bash
# Check if postgres container is running
docker-compose ps postgres

# Check postgres logs
docker-compose logs postgres

# Verify connection string
echo $DATABASE_URL

# Test connection manually
docker-compose exec postgres psql -U postgres -d authdb

# Restart postgres
docker-compose restart postgres

# If using localhost, use 127.0.0.1 instead
# Wrong: localhost:5432
# Correct: 127.0.0.1:5432
```

### Issue: Migration fails

**Symptoms**:
- Migration script errors
- Database schema mismatch

**Solutions**:

```bash
# Check migration status
npm run migrate:status

# Try running migration manually
docker-compose exec backend npm run migrate:up

# Check postgres logs
docker-compose logs postgres

# If stuck, rollback and retry
npm run migrate:down
npm run migrate:up

# If completely broken, restore from backup
docker-compose exec postgres psql -U postgres -d authdb < backup.sql
```

### Issue: Duplicate key error

**Symptoms**:
- Error: `duplicate key value violates unique constraint`

**Solutions**:

```sql
-- Find duplicate records
SELECT email, COUNT(*)
FROM users
GROUP BY email
HAVING COUNT(*) > 1;

-- Delete duplicates (keep first)
DELETE FROM users a
USING users b
WHERE a.id > b.id
AND a.email = b.email;

-- Ensure unique constraint exists
ALTER TABLE users
ADD CONSTRAINT users_email_unique UNIQUE (email);
```

### Issue: Database locked

**Symptoms**:
- Queries hang
- Timeout errors

**Solutions**:

```sql
-- Check active connections
SELECT * FROM pg_stat_activity;

-- Kill problematic query
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE pid = <problematic_pid>;

-- Restart database
docker-compose restart postgres
```

### Issue: Slow queries

**Symptoms**:
- API responses slow
- Database CPU high

**Solutions**:

```sql
-- Find slow queries
SELECT query, mean_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Check if indexes exist
\d users  -- Shows table structure including indexes

-- Add missing indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);

-- Analyze table statistics
ANALYZE users;
```

---

## Authentication Issues

### Issue: JWT token invalid

**Symptoms**:
- 401 Unauthorized errors
- "Invalid token" errors

**Solutions**:

```bash
# Check JWT_SECRET is set
echo $JWT_SECRET

# Ensure JWT_SECRET matches between frontend and backend

# Check token expiration
# Decode token at https://jwt.io
# Check 'exp' field

# Clear old tokens
# In browser console:
localStorage.clear()

# Issue new token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!"}'
```

### Issue: Password not hashing

**Symptoms**:
- Passwords stored in plain text
- Login fails

**Solutions**:

```javascript
// Check bcrypt is installed
npm list bcrypt

// Ensure password is hashed before saving
const bcrypt = require('bcrypt');
const hashedPassword = await bcrypt.hash(password, 10);

// Verify hash in database
SELECT password FROM users WHERE email = 'test@test.com';
// Should start with $2b$ or $2a$

// Test password comparison
const isValid = await bcrypt.compare('Test123!', hashedPassword);
console.log(isValid);  // Should be true
```

### Issue: Session not persisting

**Symptoms**:
- User logged out after refresh
- Session lost

**Solutions**:

```javascript
// Check Redis is running
docker-compose ps redis

// Check session middleware
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,  // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7  // 7 days
  }
}));

// Check cookies in browser
// DevTools → Application → Cookies
// Should see connect.sid cookie
```

### Issue: CORS errors

**Symptoms**:
- Frontend can't call backend
- Error: `blocked by CORS policy`

**Solutions**:

```javascript
// Backend: Enable CORS
const cors = require('cors');

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Frontend: Include credentials
fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  credentials: 'include',  // Important!
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
```

---

## Email Issues

### Issue: Emails not sending

**Symptoms**:
- No emails received
- No errors

**Solutions**:

```bash
# Check email configuration
echo $SMTP_HOST
echo $SMTP_USER
echo $EMAIL_FROM

# Test SMTP connection
npm install -g nodemailer

# Create test file
cat > test-email.js << EOF
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

transporter.sendMail({
  from: process.env.EMAIL_FROM,
  to: 'your-email@example.com',
  subject: 'Test',
  text: 'Test email'
}, (err, info) => {
  if (err) console.error(err);
  else console.log('Sent:', info);
});
EOF

node test-email.js
```

### Issue: Emails going to spam

**Symptoms**:
- Emails sent but in spam folder

**Solutions**:

1. **Set up SPF record** (DNS)
   ```
   example.com. IN TXT "v=spf1 include:_spf.google.com ~all"
   ```

2. **Set up DKIM** (DNS)
   - Get DKIM keys from email provider
   - Add DKIM DNS record

3. **Set up DMARC** (DNS)
   ```
   _dmarc.example.com. IN TXT "v=DMARC1; p=none; rua=mailto:dmarc@example.com"
   ```

4. **Use reputable email service**
   - SendGrid, Mailgun, Amazon SES

5. **Warm up IP address**
   - Send gradually increasing volumes
   - Start with known good recipients

### Issue: Email templates not rendering

**Symptoms**:
- Plain text instead of HTML
- Missing styles

**Solutions**:

```javascript
// Ensure HTML email is sent
await transporter.sendMail({
  from: process.env.EMAIL_FROM,
  to: user.email,
  subject: 'Welcome',
  text: 'Welcome plain text',  // Fallback
  html: '<h1>Welcome</h1><p>HTML content</p>'  // Main content
});

// Use inline CSS for email
// Email clients don't support external CSS
// Correct:
<p style="color: blue;">Text</p>

// Wrong:
<style>.text { color: blue; }</style>
<p class="text">Text</p>
```

---

## Performance Issues

### Issue: Slow API responses

**Symptoms**:
- Response times >1 second
- Timeouts

**Solutions**:

```bash
# Check database query performance
# Add logging to see slow queries

# Add indexes
CREATE INDEX idx_users_email ON users(email);

# Use connection pooling
// In database config:
{
  pool: {
    min: 2,
    max: 10
  }
}

# Cache frequent queries (Redis)
const redis = require('redis');
const client = redis.createClient();

// Check result in cache first
const cached = await client.get(`user:${id}`);
if (cached) return JSON.parse(cached);

// Query database
const user = await User.findById(id);

// Cache result
await client.set(`user:${id}`, JSON.stringify(user), 'EX', 3600);
```

### Issue: High memory usage

**Symptoms**:
- Container using >1GB RAM
- Out of memory errors

**Solutions**:

```bash
# Check memory usage
docker stats

# Set memory limits
# In docker-compose.yml:
services:
  backend:
    mem_limit: 512m

# Check for memory leaks
npm install -g clinic
clinic doctor -- node src/app.js

# Common memory leak: event listeners
// Wrong:
setInterval(() => { ... }, 1000);  // Never cleared

// Correct:
const interval = setInterval(() => { ... }, 1000);
// Clear when done:
clearInterval(interval);
```

### Issue: Slow page load

**Symptoms**:
- Frontend takes >5 seconds to load

**Solutions**:

```bash
# Build for production
npm run build

# Check bundle size
npx webpack-bundle-analyzer build/

# Code splitting
// Use React.lazy for large components
const Dashboard = React.lazy(() => import('./Dashboard'));

# Optimize images
# Use WebP format
# Compress images

# Enable gzip compression
// In Express:
const compression = require('compression');
app.use(compression());
```

---

## Deployment Issues

### Issue: Build fails

**Symptoms**:
- `npm run build` errors
- Docker build fails

**Solutions**:

```bash
# Clear build cache
rm -rf build/
rm -rf node_modules/.cache

# Rebuild
npm run build

# Check for type errors (if using TypeScript)
npx tsc --noEmit

# Check for lint errors
npm run lint

# Build with verbose output
npm run build --verbose
```

### Issue: Environment variables not loading

**Symptoms**:
- `undefined` for env variables
- Features not working

**Solutions**:

```bash
# Check .env file exists
ls -la .env

# Check variables are set
cat .env | grep API_KEY

# Load .env in code
// At top of app.js:
require('dotenv').config();

# In Docker, use env_file:
# docker-compose.yml:
services:
  backend:
    env_file:
      - .env

# Or pass directly:
services:
  backend:
    environment:
      - DATABASE_URL=${DATABASE_URL}
```

### Issue: Docker image too large

**Symptoms**:
- Image size >1GB
- Slow deployments

**Solutions**:

```dockerfile
# Use multi-stage builds
# Dockerfile:
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
CMD ["node", "build/app.js"]

# Use .dockerignore
# .dockerignore:
node_modules
npm-debug.log
.git
.env
README.md
```

---

## Production Issues

### Issue: 500 Internal Server Error

**Symptoms**:
- Generic 500 errors
- No details

**Solutions**:

```bash
# Check logs
docker-compose logs backend | tail -100

# Enable error details (only in development!)
// In Express error handler:
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

# Check error tracking (Sentry, etc.)
# Review recent errors in dashboard
```

### Issue: High error rate

**Symptoms**:
- Many errors in logs
- Users reporting issues

**Solutions**:

```bash
# Check error tracking dashboard
# Identify most common error

# Group errors by type
docker-compose logs backend | grep ERROR | sort | uniq -c | sort -rn

# Check for specific error
docker-compose logs backend | grep "specific error message"

# If critical, rollback immediately
./scripts/rollback/rollback-to-version.sh v1.0.0-abc123f production
```

### Issue: Database connection pool exhausted

**Symptoms**:
- Error: `remaining connection slots are reserved`
- Cannot acquire connection from pool

**Solutions**:

```javascript
// Increase pool size
// In database config:
{
  pool: {
    min: 5,
    max: 20  // Increase from 10
  }
}

// Check for connection leaks
// Ensure connections are released
const client = await pool.connect();
try {
  const result = await client.query('SELECT * FROM users');
  return result.rows;
} finally {
  client.release();  // Always release!
}

// Monitor active connections
SELECT count(*) FROM pg_stat_activity;
```

---

## Getting Help

### Before Asking for Help

1. **Check logs**
   ```bash
   docker-compose logs --tail=100
   ```

2. **Search this guide**
   - Use Ctrl+F to search for error message

3. **Check documentation**
   - [PROJECT_ROADMAP.md](PROJECT_ROADMAP.md)
   - [GIT_WORKFLOW.md](GIT_WORKFLOW.md)
   - [DOCKER_GUIDE.md](DOCKER_GUIDE.md)

4. **Google the error**
   - Include exact error message
   - Include relevant technology (Node.js, PostgreSQL, etc.)

### When Asking for Help

Include:

1. **What you're trying to do**
2. **What you expected to happen**
3. **What actually happened**
4. **Error messages** (full text)
5. **Logs** (relevant portion)
6. **Environment** (OS, Node version, Docker version)
7. **What you've already tried**

### Support Channels

1. **Project Issues**
   - GitHub Issues (for bugs)

2. **Documentation**
   - Check all docs/ files first

3. **Stack Overflow**
   - Tag: `node.js`, `postgresql`, `docker`, `react`

4. **Community**
   - Slack/Discord (if available)

---

## Additional Resources

- [Node.js Debugging Guide](https://nodejs.org/en/docs/guides/debugging-getting-started/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [Express.js Error Handling](https://expressjs.com/en/guide/error-handling.html)

---

*Last Updated: November 5, 2025*
