# Deployment Checklist

This document provides a comprehensive checklist for deploying features through the pipeline: Development → Staging → Production.

## Table of Contents

1. [Deployment Overview](#deployment-overview)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Staging Deployment](#staging-deployment)
4. [Production Deployment](#production-deployment)
5. [Post-Deployment Verification](#post-deployment-verification)
6. [Smoke Testing](#smoke-testing)
7. [Rollback Criteria](#rollback-criteria)
8. [Communication Templates](#communication-templates)

---

## Deployment Overview

### Deployment Pipeline

```
Feature Branch
     ↓
[Run Tests]
     ↓
[Code Review]
     ↓
Merge to Staging Branch
     ↓
[Build Docker Images]
     ↓
[Deploy to Staging]
     ↓
[Staging Tests]
     ↓
[Stakeholder Approval]
     ↓
Merge to Main Branch
     ↓
[Build Production Images]
     ↓
[Deploy to Production]
     ↓
[Production Verification]
     ↓
[Monitor]
```

### Deployment Principles

1. **Never skip staging** - All code goes through staging first
2. **Test thoroughly** - Automated + manual testing
3. **Deploy during off-hours** - Minimize user impact
4. **Monitor closely** - Watch metrics for 1 hour post-deploy
5. **Have rollback ready** - Know how to rollback before deploying
6. **Communicate clearly** - Notify stakeholders

---

## Pre-Deployment Checklist

Complete this checklist **BEFORE** deploying to any environment.

### Code Quality

- [ ] All automated tests passing
  ```bash
  npm test
  ```

- [ ] Test coverage meets requirements (≥80%)
  ```bash
  npm run test:coverage
  ```

- [ ] Linting passes with no errors
  ```bash
  npm run lint
  ```

- [ ] No debug code (console.log, debugger)
  ```bash
  grep -r "console.log" src/
  grep -r "debugger" src/
  ```

- [ ] No hardcoded credentials or secrets
  ```bash
  grep -r "password.*=.*'" src/
  grep -r "api_key.*=.*'" src/
  ```

### Documentation

- [ ] README updated (if needed)
- [ ] API documentation updated
- [ ] Environment variables documented
- [ ] Migration instructions included
- [ ] PROJECT_ROADMAP.md updated with story status

### Database

- [ ] Migrations tested locally
  ```bash
  npm run migrate:up
  npm run migrate:down
  npm run migrate:up
  ```

- [ ] Rollback migrations tested
- [ ] Seed data works
- [ ] No destructive migrations without backup plan
- [ ] Database indexes created for new queries

### Dependencies

- [ ] No security vulnerabilities
  ```bash
  npm audit
  ```

- [ ] Dependencies up to date (check for breaking changes)
  ```bash
  npm outdated
  ```

- [ ] Package-lock.json committed

### Environment Configuration

- [ ] .env.example updated with new variables
- [ ] Staging environment variables configured
- [ ] Production environment variables configured
- [ ] Third-party API keys valid

### Git

- [ ] All changes committed
- [ ] Commit messages follow convention
- [ ] Branch synced with main
- [ ] No merge conflicts
- [ ] Pull request approved

### Build

- [ ] Production build succeeds
  ```bash
  cd backend && npm run build
  cd frontend && npm run build
  ```

- [ ] Docker images build successfully
  ```bash
  docker build -t auth-backend:test -f Dockerfile.prod .
  docker build -t auth-frontend:test -f Dockerfile.prod .
  ```

- [ ] Docker images tested locally
  ```bash
  docker-compose -f docker-compose.prod.yml up
  ```

### Testing

- [ ] All acceptance criteria met
- [ ] Manual testing complete
- [ ] Cross-browser testing done (Chrome, Firefox, Safari, Edge)
- [ ] Mobile responsive testing done
- [ ] Accessibility testing done
- [ ] Load testing done (for performance-critical features)

### Backup

- [ ] Database backup created
  ```bash
  ./scripts/backup/backup-database.sh
  ```

- [ ] Backup verified
  ```bash
  ./scripts/backup/verify-backup.sh
  ```

- [ ] Rollback procedure documented and tested

---

## Staging Deployment

### Pre-Staging

- [ ] Complete [Pre-Deployment Checklist](#pre-deployment-checklist)
- [ ] Notify team of staging deployment
- [ ] Schedule deployment time

### Build & Tag

- [ ] Get current git SHA
  ```bash
  GIT_SHA=$(git rev-parse --short HEAD)
  VERSION="v1.1.0"  # Increment version
  TAG="${VERSION}-${GIT_SHA}"
  ```

- [ ] Build Docker images with tags
  ```bash
  # Backend
  cd backend
  docker build -t mstor/auth-backend:${TAG} -f Dockerfile.prod .
  docker tag mstor/auth-backend:${TAG} mstor/auth-backend:staging

  # Frontend
  cd ../frontend
  docker build -t mstor/auth-frontend:${TAG} -f Dockerfile.prod .
  docker tag mstor/auth-frontend:${TAG} mstor/auth-frontend:staging
  ```

- [ ] Push images to Docker Hub
  ```bash
  docker push mstor/auth-backend:${TAG}
  docker push mstor/auth-backend:staging
  docker push mstor/auth-frontend:${TAG}
  docker push mstor/auth-frontend:staging
  ```

### Deploy

- [ ] Pull images on staging server
  ```bash
  docker-compose -f docker-compose.staging.yml pull
  ```

- [ ] Stop staging containers
  ```bash
  docker-compose -f docker-compose.staging.yml down
  ```

- [ ] Run database migrations (if needed)
  ```bash
  docker-compose -f docker-compose.staging.yml run backend npm run migrate
  ```

- [ ] Start staging containers
  ```bash
  docker-compose -f docker-compose.staging.yml up -d
  ```

### Verify

- [ ] Containers running
  ```bash
  docker-compose -f docker-compose.staging.yml ps
  ```

- [ ] No errors in logs
  ```bash
  docker-compose -f docker-compose.staging.yml logs --tail=50
  ```

- [ ] Health check passes
  ```bash
  curl https://api-staging.example.com/health
  ```

- [ ] Frontend accessible
  ```bash
  curl https://staging.example.com
  ```

### Test on Staging

- [ ] Run smoke tests
  ```bash
  npm run test:smoke:staging
  ```

- [ ] Test authentication flow
  - [ ] Register new user
  - [ ] Login
  - [ ] Logout
  - [ ] Password reset

- [ ] Test new feature
  - [ ] All acceptance criteria verified
  - [ ] Edge cases tested
  - [ ] Error handling verified

- [ ] Test existing features (regression)
  - [ ] Core features still work
  - [ ] No unexpected errors

- [ ] Check database
  - [ ] Data persisted correctly
  - [ ] Migrations applied
  - [ ] No orphaned records

### Monitor

- [ ] Watch error logs for 15 minutes
- [ ] Check error rates (should be ~0%)
- [ ] Check response times (should be <200ms)
- [ ] Check database query performance

### Document

- [ ] Update PROJECT_ROADMAP.md
  - Mark story as "In Staging"
  - Record deployment timestamp
  - Record Docker image tag
  - Record test results

---

## Production Deployment

⚠️ **CRITICAL**: Production deployments require extra care and approval.

### Pre-Production

- [ ] All [Staging Deployment](#staging-deployment) steps completed successfully
- [ ] Staging environment stable for at least 24 hours
- [ ] Stakeholder approval received
- [ ] Deployment scheduled during off-hours
- [ ] Team notified of deployment window
- [ ] Rollback procedure reviewed and tested

### Pre-Flight Checks

- [ ] Verify staging is using exact images for production
  ```bash
  docker inspect mstor/auth-backend:staging
  docker inspect mstor/auth-backend:${TAG}
  # Should have same IMAGE ID
  ```

- [ ] Production database backup created
  ```bash
  ./scripts/backup/backup-database.sh production
  ```

- [ ] Backup verified and stored securely
  ```bash
  ./scripts/backup/verify-backup.sh production-backup-*.sql
  ```

- [ ] Rollback script tested
  ```bash
  # Dry run
  ./scripts/rollback/rollback-to-version.sh v1.0.0-abc123f production --dry-run
  ```

### Communication

- [ ] Send pre-deployment notification
  ```
  Subject: [NOTICE] Production Deployment - [Date] [Time]

  We will be deploying [Feature Name] to production on [Date] at [Time].

  Expected downtime: [X minutes] or None
  Changes included: [Brief description]
  Rollback plan: [Brief description]

  Please report any issues immediately.
  ```

### Deploy

- [ ] Set production Docker image tags
  ```bash
  # Tag staging images as production
  docker pull mstor/auth-backend:staging
  docker tag mstor/auth-backend:staging mstor/auth-backend:${TAG}
  docker tag mstor/auth-backend:staging mstor/auth-backend:latest

  docker pull mstor/auth-frontend:staging
  docker tag mstor/auth-frontend:staging mstor/auth-frontend:${TAG}
  docker tag mstor/auth-frontend:staging mstor/auth-frontend:latest
  ```

- [ ] Push production images to Docker Hub
  ```bash
  docker push mstor/auth-backend:${TAG}
  docker push mstor/auth-backend:latest
  docker push mstor/auth-frontend:${TAG}
  docker push mstor/auth-frontend:latest
  ```

- [ ] SSH to production server
  ```bash
  ssh production-server
  ```

- [ ] Pull production images
  ```bash
  docker-compose pull
  ```

- [ ] Stop production containers (if downtime required)
  ```bash
  docker-compose down
  ```

- [ ] Run database migrations (if needed)
  ```bash
  docker-compose run backend npm run migrate
  ```

- [ ] Start production containers
  ```bash
  docker-compose up -d
  ```

- [ ] Monitor startup
  ```bash
  docker-compose logs -f
  # Watch for successful startup messages
  # Ctrl+C after 30 seconds if no errors
  ```

### Immediate Verification

- [ ] All containers running
  ```bash
  docker-compose ps
  # All services should show "Up"
  ```

- [ ] No errors in logs
  ```bash
  docker-compose logs --tail=100 | grep -i error
  # Should be empty or only old errors
  ```

- [ ] Health check passes
  ```bash
  curl https://api.example.com/health
  # Should return { "status": "ok" }
  ```

- [ ] Frontend loads
  ```bash
  curl https://example.com
  # Should return HTML
  ```

- [ ] Database connection working
  ```bash
  docker-compose exec backend node -e "require('./src/config/database').testConnection()"
  ```

### Smoke Testing

- [ ] Run automated smoke tests
  ```bash
  npm run test:smoke:production
  ```

- [ ] Manual smoke tests
  - [ ] Can access homepage
  - [ ] Can login
  - [ ] Can logout
  - [ ] New feature works
  - [ ] Existing features work

### Monitoring (First Hour)

- [ ] Watch error rates
  - Should be 0% or same as before deployment

- [ ] Watch response times
  - Should be <200ms
  - No degradation from before

- [ ] Watch active users
  - Should follow normal pattern
  - No drop-off

- [ ] Watch database performance
  - Query times normal
  - No slow queries
  - Connection pool healthy

- [ ] Check error tracking (Sentry, etc.)
  - No new errors
  - Error rate stable

### Post-Deployment Communication

- [ ] Send success notification
  ```
  Subject: [SUCCESS] Production Deployment Complete

  Production deployment of [Feature Name] completed successfully at [Time].

  Deployed version: ${TAG}
  Status: All systems operational
  Monitoring: Ongoing for next hour

  Please report any issues immediately.
  ```

### Documentation

- [ ] Update PROJECT_ROADMAP.md
  - Mark story as "Deployed to Main"
  - Record production deployment timestamp
  - Record Docker image tag
  - Record production test results
  - Mark story as COMPLETE

- [ ] Tag git commit
  ```bash
  git tag -a ${TAG} -m "Release ${TAG}"
  git push origin ${TAG}
  ```

- [ ] Update CHANGELOG (if applicable)

---

## Post-Deployment Verification

### Functional Verification

```markdown
### Production Verification Checklist

**Core Functionality**:
- [ ] User registration works
- [ ] User login works
- [ ] Password reset works
- [ ] Email verification works
- [ ] OAuth login works (Google)
- [ ] OAuth login works (GitHub)
- [ ] MFA setup works
- [ ] MFA login works
- [ ] User profile updates work
- [ ] Password change works

**New Feature**:
- [ ] Feature accessible
- [ ] Feature works as expected
- [ ] No errors
- [ ] Performance acceptable

**Data Integrity**:
- [ ] New data persists
- [ ] Existing data intact
- [ ] Relationships maintained
- [ ] No orphaned records

**Performance**:
- [ ] Page load time <2s
- [ ] API response time <200ms
- [ ] No memory leaks
- [ ] Database queries optimized

**Security**:
- [ ] HTTPS working
- [ ] Authentication required
- [ ] Authorization working
- [ ] No sensitive data exposed
```

---

## Smoke Testing

### Automated Smoke Tests

```javascript
// tests/smoke/production.test.js
describe('Production Smoke Tests', () => {
  it('should access homepage', async () => {
    const response = await fetch('https://example.com');
    expect(response.status).toBe(200);
  });

  it('should access API health endpoint', async () => {
    const response = await fetch('https://api.example.com/health');
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.status).toBe('ok');
  });

  it('should login with test user', async () => {
    const response = await fetch('https://api.example.com/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: process.env.TEST_USER_PASSWORD
      })
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.token).toBeDefined();
  });
});
```

### Manual Smoke Tests

1. **Homepage Test**
   - Open https://example.com
   - Verify page loads
   - Verify no console errors

2. **Login Test**
   - Click "Login"
   - Enter credentials
   - Click "Submit"
   - Verify redirect to dashboard
   - Verify no errors

3. **New Feature Test**
   - Navigate to new feature
   - Test basic functionality
   - Verify it works as expected

4. **Logout Test**
   - Click "Logout"
   - Verify redirect to homepage
   - Verify can't access dashboard

---

## Rollback Criteria

Rollback immediately if:

- [ ] Application won't start
- [ ] >50% of users affected
- [ ] Critical functionality broken (auth, core features)
- [ ] Data corruption detected
- [ ] Security vulnerability exposed
- [ ] Error rate >5%
- [ ] Response time degradation >50%
- [ ] Database performance degraded >50%

See [ROLLBACK_PROCEDURES.md](ROLLBACK_PROCEDURES.md) for detailed instructions.

---

## Communication Templates

### Pre-Deployment Notice

```
To: team@example.com
Subject: [NOTICE] Production Deployment - [Date] [Time]

Hi Team,

We will be deploying the following changes to production:

**Date**: [Date]
**Time**: [Time] ([Timezone])
**Expected Downtime**: [X minutes] or None
**Deployed By**: [Name]

**Changes Included**:
- Story X.X: [Feature Name]
  - [Brief description]

**User Impact**:
- [Describe any user-facing changes]

**Rollback Plan**:
- Rollback to version: v1.0.0-abc123f
- Estimated rollback time: 5 minutes

Please be available during the deployment window to help monitor and respond to any issues.

Thank you!
```

### Success Notification

```
To: team@example.com
Subject: [SUCCESS] Production Deployment Complete - [Feature Name]

Hi Team,

Production deployment completed successfully!

**Deployed**: [Timestamp]
**Version**: [Tag]
**Status**: All systems operational

**Deployed Changes**:
- Story X.X: [Feature Name]

**Verification**:
- Automated tests: ✅ Passed
- Smoke tests: ✅ Passed
- Error rate: 0%
- Response time: Normal

**Monitoring**: Ongoing for next hour

Please report any issues immediately.

Thank you!
```

### Issue Notification

```
To: team@example.com
Subject: [ISSUE] Production Issue Detected - [Description]

Hi Team,

We have detected an issue in production:

**Issue**: [Brief description]
**Severity**: [Critical/High/Medium/Low]
**Affected Users**: [Percentage or number]
**Detected**: [Timestamp]

**Current Status**:
- Investigating root cause
- Monitoring error rates
- Preparing rollback if needed

**Next Steps**:
- [Action 1]
- [Action 2]

Will provide updates every 15 minutes.

Thank you!
```

### Rollback Notification

```
To: team@example.com
Subject: [URGENT] Production Rollback in Progress

Hi Team,

We are rolling back production due to [issue description].

**Rollback Started**: [Timestamp]
**Rolling Back To**: v1.0.0-abc123f
**Expected Downtime**: 5-10 minutes
**Reason**: [Brief description]

**Status**: In progress

Will notify when rollback is complete.

Thank you!
```

---

## Best Practices

1. **Deploy during off-hours** - Minimize user impact
2. **Test in staging first** - Never skip staging
3. **Monitor closely after deploy** - First hour is critical
4. **Have rollback ready** - Know how to rollback before deploying
5. **Communicate clearly** - Keep stakeholders informed
6. **Document everything** - Record all deployments
7. **Automate when possible** - Reduce human error
8. **Practice deployments** - Regular drills in staging

---

## Deployment Frequency

### Recommended Cadence

- **Features**: Deploy to staging daily, production weekly
- **Bug fixes**: Deploy to production within 24 hours
- **Hotfixes**: Deploy to production immediately after testing
- **Security patches**: Deploy to production ASAP

### Deployment Windows

- **Staging**: Anytime during business hours
- **Production**:
  - Preferred: Tuesday-Thursday, 10 AM - 2 PM (off-peak)
  - Avoid: Friday afternoon, weekends, holidays, peak traffic times

---

*Last Updated: November 5, 2025*
