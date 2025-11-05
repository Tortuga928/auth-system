# Rollback Procedures

This document provides comprehensive rollback procedures for quick recovery when deployments fail or issues are discovered in production.

## Table of Contents

1. [Rollback Overview](#rollback-overview)
2. [When to Rollback](#when-to-rollback)
3. [Rollback Decision Tree](#rollback-decision-tree)
4. [Quick Rollback Commands](#quick-rollback-commands)
5. [Detailed Rollback Procedures](#detailed-rollback-procedures)
6. [Database Migration Rollback](#database-migration-rollback)
7. [Automated Rollback Scripts](#automated-rollback-scripts)
8. [Post-Rollback Verification](#post-rollback-verification)
9. [Common Rollback Scenarios](#common-rollback-scenarios)

---

## Rollback Overview

### Rollback Goals

1. **Speed**: Restore service as quickly as possible
2. **Safety**: Don't lose data or corrupt state
3. **Verification**: Confirm system is working after rollback
4. **Documentation**: Record what happened and why

### Rollback Levels

1. **Code Rollback** - Revert to previous git commit/tag
2. **Docker Rollback** - Deploy previous Docker image
3. **Database Rollback** - Reverse database migrations
4. **Full Rollback** - All of the above

---

## When to Rollback

### Immediate Rollback Required

🚨 Rollback immediately if:

- [ ] Application won't start
- [ ] Critical functionality broken (login, auth, payments)
- [ ] Data corruption occurring
- [ ] Security vulnerability exposed
- [ ] Performance degradation >50%
- [ ] Database migration failed catastrophically

### Monitored Rollback (Fix Forward vs Rollback)

⚠️ Evaluate fix-forward vs rollback if:

- [ ] Minor bug affecting <10% of users
- [ ] UI issue (no data impact)
- [ ] Non-critical feature broken
- [ ] Performance degradation <20%
- [ ] Known workaround exists

**Decision Criteria**:
- Can fix be deployed in <15 minutes? → Fix forward
- Is fix complex or risky? → Rollback
- Is it after business hours? → Rollback (fix in morning)

---

## Rollback Decision Tree

```
┌─────────────────────────┐
│   Issue Detected        │
└───────────┬─────────────┘
            │
            ▼
     ┌──────────────┐
     │  Critical?   │
     └──┬───────┬───┘
        │       │
      Yes       No
        │       │
        ▼       ▼
   ┌─────┐   ┌──────────────┐
   │ ┌───┘   │ Can fix in   │
   │ │       │ <15 minutes? │
   │ │       └──┬───────┬───┘
   │ │          │       │
   │ │         Yes     No
   │ │          │       │
   │ │          ▼       │
   │ │       ┌─────┐   │
   │ │       │ Fix │   │
   │ └──────▶│ Now │◀──┘
   │         └─────┘
   ▼
┌─────────────┐
│  ROLLBACK   │
│     NOW     │
└─────────────┘
```

---

## Quick Rollback Commands

### Docker Rollback (Fastest - Recommended)

```bash
# Pull previous version tag
docker pull mstor/auth-backend:v1.0.0-abc123f
docker pull mstor/auth-frontend:v1.0.0-abc123f

# Update docker-compose.yml to use specific version
# OR stop and run with specific version

docker-compose down
docker-compose up -d
```

### Git Rollback

```bash
# Find last good commit
git log --oneline

# Revert to specific commit (creates new commit)
git revert <commit-hash>

# OR reset to specific commit (⚠️ destructive)
git reset --hard <commit-hash>
git push --force origin main
```

### Automated Rollback Script

```bash
# Use automated script (recommended)
cd scripts/rollback
./rollback-story.sh 3.1

# Or rollback to specific version
./rollback-to-version.sh v1.0.0-abc123f
```

---

## Detailed Rollback Procedures

### Procedure 1: Rollback Staging Environment

**Scenario**: Feature deployed to staging has critical issues

**Steps**:

1. **Identify Last Good Version**
   ```bash
   # Check PROJECT_ROADMAP.md for last successful deployment
   # Note the version tag (e.g., v1.0.0-abc123f)
   ```

2. **Pull Previous Docker Images**
   ```bash
   cd /path/to/auth-system

   # Pull last good backend image
   docker pull mstor/auth-backend:v1.0.0-abc123f

   # Pull last good frontend image
   docker pull mstor/auth-frontend:v1.0.0-abc123f
   ```

3. **Update docker-compose.staging.yml**
   ```yaml
   services:
     backend:
       image: mstor/auth-backend:v1.0.0-abc123f

     frontend:
       image: mstor/auth-frontend:v1.0.0-abc123f
   ```

4. **Restart Containers**
   ```bash
   docker-compose -f docker-compose.staging.yml down
   docker-compose -f docker-compose.staging.yml up -d
   ```

5. **Verify Rollback**
   ```bash
   # Check container status
   docker-compose ps

   # Check logs
   docker-compose logs -f backend
   docker-compose logs -f frontend

   # Test health endpoint
   curl http://staging.example.com/health
   ```

6. **Verify Functionality**
   - [ ] Can access application
   - [ ] Can login
   - [ ] Can register
   - [ ] No errors in console
   - [ ] Database queries working

7. **Document Rollback**
   ```bash
   # Update PROJECT_ROADMAP.md
   # Record in rollback history:
   # - When: 2025-11-05 14:30
   # - From: v1.1.0-def456a
   # - To: v1.0.0-abc123f
   # - Reason: Critical auth bug
   # - Rolled back by: Developer Name
   ```

---

### Procedure 2: Rollback Production Environment

**Scenario**: Production deployment has critical issues

⚠️ **CRITICAL**: Production rollbacks require extra care

**Steps**:

1. **Notify Stakeholders**
   ```
   Subject: [URGENT] Production Rollback in Progress

   We are rolling back production due to [issue description].
   Expected downtime: 5-10 minutes
   We will notify when complete.
   ```

2. **Create Backup** (if time allows)
   ```bash
   # Backup database
   cd scripts/backup
   ./backup-database.sh production

   # Verify backup
   ./verify-backup.sh production-backup-20251105.sql
   ```

3. **Identify Last Good Version**
   ```bash
   # Check PROJECT_ROADMAP.md
   # Check git tags
   git tag --list --sort=-version:refname

   # Last good version: v1.0.0-abc123f
   ```

4. **Rollback Docker Images**
   ```bash
   # SSH to production server
   ssh production-server

   # Pull last good images
   docker pull mstor/auth-backend:v1.0.0-abc123f
   docker pull mstor/auth-frontend:v1.0.0-abc123f

   # Update docker-compose.production.yml
   nano docker-compose.production.yml
   # Change image tags to v1.0.0-abc123f

   # Restart containers
   docker-compose -f docker-compose.production.yml down
   docker-compose -f docker-compose.production.yml up -d
   ```

5. **Rollback Database (if migrations ran)**
   ```bash
   # Check if new migrations ran
   docker-compose exec backend npm run migrate:status

   # If yes, rollback migrations
   docker-compose exec backend npm run migrate:down

   # Verify schema
   docker-compose exec backend npm run migrate:status
   ```

6. **Verify Rollback**
   ```bash
   # Check health
   curl https://api.example.com/health

   # Check frontend
   curl https://example.com

   # Check database connection
   docker-compose exec backend node -e "require('./src/config/database').testConnection()"
   ```

7. **Run Smoke Tests**
   ```bash
   cd tests
   npm run smoke-test:production
   ```

8. **Monitor Metrics**
   - Check error rates
   - Check response times
   - Check active users
   - Check database queries

9. **Notify Stakeholders**
   ```
   Subject: [RESOLVED] Production Rollback Complete

   Production has been rolled back to v1.0.0-abc123f.
   All systems operational.
   Root cause analysis in progress.
   ```

10. **Post-Mortem**
    - Document issue
    - Identify root cause
    - Create fix plan
    - Schedule follow-up

---

### Procedure 3: Rollback Single Feature (Git Revert)

**Scenario**: One feature causing issues, others are fine

**Steps**:

1. **Identify Problem Commits**
   ```bash
   # View recent commits
   git log --oneline

   # Identify commits for Story X.X
   git log --grep="Story: 3.1"
   ```

2. **Revert Specific Commits**
   ```bash
   # Revert commits (newest to oldest)
   git revert <commit-hash-3>
   git revert <commit-hash-2>
   git revert <commit-hash-1>

   # OR revert range
   git revert <oldest-commit>..<newest-commit>
   ```

3. **Test Locally**
   ```bash
   # Start local environment
   docker-compose up -d

   # Run tests
   npm test

   # Verify feature is reverted
   # Verify other features still work
   ```

4. **Push Revert**
   ```bash
   git push origin main
   ```

5. **Deploy Revert**
   ```bash
   # Build new images
   ./scripts/deploy/build-images.sh

   # Deploy to staging
   ./scripts/deploy/deploy-staging.sh

   # Test on staging
   # If good, deploy to production
   ./scripts/deploy/deploy-production.sh
   ```

---

## Database Migration Rollback

### Check Migration Status

```bash
# View migration status
npm run migrate:status

# Output shows:
# ✓ 001_create_users_table
# ✓ 002_create_sessions_table
# ✓ 003_create_oauth_accounts_table (← last run)
```

### Rollback Last Migration

```bash
# Rollback one migration
npm run migrate:down

# This runs the "down" function in the migration file
```

### Rollback Multiple Migrations

```bash
# Rollback to specific migration
npm run migrate:to 002_create_sessions_table

# Rollback all migrations (⚠️ destroys data)
npm run migrate:reset
```

### Manual Database Rollback

```bash
# If migrations are corrupted, manual SQL may be needed

# Connect to database
docker-compose exec postgres psql -U postgres -d authdb

# Run rollback SQL
DROP TABLE IF EXISTS oauth_accounts;
ALTER TABLE users DROP COLUMN new_column;

# Update migration tracking table
DELETE FROM migrations WHERE name = '003_create_oauth_accounts_table';
```

### Database Backup Restore

```bash
# If database is corrupted, restore from backup

# Stop application
docker-compose stop backend

# Restore backup
docker-compose exec postgres psql -U postgres -d authdb < backup-20251105.sql

# Verify data
docker-compose exec postgres psql -U postgres -d authdb -c "SELECT COUNT(*) FROM users;"

# Restart application
docker-compose start backend
```

---

## Automated Rollback Scripts

### Script: rollback-story.sh

Location: `scripts/rollback/rollback-story.sh`

```bash
#!/bin/bash
# Automated rollback for a specific user story

set -e

STORY_ID=$1

if [ -z "$STORY_ID" ]; then
  echo "Usage: ./rollback-story.sh <story-id>"
  echo "Example: ./rollback-story.sh 3.1"
  exit 1
fi

echo "Rolling back Story: $STORY_ID"

# Find commits for this story
COMMITS=$(git log --grep="Story: $STORY_ID" --format="%H" | tac)

if [ -z "$COMMITS" ]; then
  echo "No commits found for Story: $STORY_ID"
  exit 1
fi

echo "Found commits:"
echo "$COMMITS"

read -p "Rollback these commits? (y/n): " confirm
if [ "$confirm" != "y" ]; then
  echo "Rollback cancelled"
  exit 0
fi

# Revert commits
for commit in $COMMITS; do
  echo "Reverting $commit..."
  git revert --no-commit $commit
done

# Commit revert
git commit -m "rollback: revert Story $STORY_ID

This rollback reverts all changes from Story $STORY_ID due to issues found in testing/production.

Commits reverted:
$COMMITS

Rolled back on: $(date)
"

echo "Rollback complete!"
echo "Run tests before pushing: npm test"
```

### Script: rollback-to-version.sh

Location: `scripts/rollback/rollback-to-version.sh`

```bash
#!/bin/bash
# Rollback Docker deployment to specific version

set -e

VERSION=$1
ENVIRONMENT=${2:-staging}

if [ -z "$VERSION" ]; then
  echo "Usage: ./rollback-to-version.sh <version> [environment]"
  echo "Example: ./rollback-to-version.sh v1.0.0-abc123f staging"
  exit 1
fi

echo "Rolling back $ENVIRONMENT to version: $VERSION"

# Pull images
echo "Pulling Docker images..."
docker pull mstor/auth-backend:$VERSION
docker pull mstor/auth-frontend:$VERSION

# Update docker-compose file
COMPOSE_FILE="docker-compose.${ENVIRONMENT}.yml"

if [ ! -f "$COMPOSE_FILE" ]; then
  echo "Error: $COMPOSE_FILE not found"
  exit 1
fi

# Backup current compose file
cp $COMPOSE_FILE ${COMPOSE_FILE}.backup

# Update image tags
sed -i "s|mstor/auth-backend:.*|mstor/auth-backend:${VERSION}|g" $COMPOSE_FILE
sed -i "s|mstor/auth-frontend:.*|mstor/auth-frontend:${VERSION}|g" $COMPOSE_FILE

echo "Updated $COMPOSE_FILE"

# Restart containers
echo "Restarting containers..."
docker-compose -f $COMPOSE_FILE down
docker-compose -f $COMPOSE_FILE up -d

echo "Waiting for services to start..."
sleep 10

# Check health
echo "Checking health..."
if curl -f http://localhost:5000/health > /dev/null 2>&1; then
  echo "✓ Backend healthy"
else
  echo "✗ Backend health check failed"
  echo "Rolling back to previous version..."
  mv ${COMPOSE_FILE}.backup $COMPOSE_FILE
  docker-compose -f $COMPOSE_FILE up -d
  exit 1
fi

echo "Rollback to $VERSION complete!"
echo "Verify functionality before proceeding."
```

---

## Post-Rollback Verification

### Verification Checklist

After any rollback, verify these items:

```markdown
### Post-Rollback Checklist

**Application Status**:
- [ ] Containers running (docker-compose ps)
- [ ] No errors in logs
- [ ] Health endpoint responding
- [ ] Frontend accessible

**Functionality**:
- [ ] Can access homepage
- [ ] Can login
- [ ] Can register new user
- [ ] Can access dashboard
- [ ] API endpoints responding

**Database**:
- [ ] Database connection working
- [ ] Queries executing successfully
- [ ] Data integrity verified
- [ ] No orphaned records

**Performance**:
- [ ] Response times normal (<200ms)
- [ ] No memory leaks
- [ ] CPU usage normal
- [ ] Database query performance normal

**Monitoring**:
- [ ] Error rates back to normal
- [ ] Active users stable
- [ ] No new errors reported
- [ ] Metrics dashboard green

**Communication**:
- [ ] Stakeholders notified
- [ ] Documentation updated
- [ ] Post-mortem scheduled
- [ ] Rollback logged in PROJECT_ROADMAP.md
```

---

## Common Rollback Scenarios

### Scenario 1: Broken Authentication

**Issue**: Users can't login after deployment

**Rollback**:
```bash
# Immediate Docker rollback
cd /path/to/auth-system
./scripts/rollback/rollback-to-version.sh v1.0.0-abc123f production

# Verify
curl https://api.example.com/api/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!"}'
```

### Scenario 2: Database Migration Failed

**Issue**: Migration partially completed, database in bad state

**Rollback**:
```bash
# Stop application
docker-compose stop backend

# Restore database from backup
docker-compose exec postgres psql -U postgres -d authdb < backup-pre-migration.sql

# Verify
docker-compose exec postgres psql -U postgres -d authdb -c "\dt"

# Start application with old code
./scripts/rollback/rollback-to-version.sh v1.0.0-abc123f production
```

### Scenario 3: Performance Degradation

**Issue**: Response times 3x slower after deployment

**Rollback**:
```bash
# Quick Docker rollback
./scripts/rollback/rollback-to-version.sh v1.0.0-abc123f production

# Monitor performance
watch -n 5 'curl -w "@curl-format.txt" -o /dev/null -s https://api.example.com/health'

# If still slow, might be database issue - check indexes
```

### Scenario 4: Feature Flag Rollback (Alternative to Code Rollback)

**Issue**: New feature causing problems, but rest of code is good

**Alternative**: Disable feature via environment variable (no rollback needed)

```bash
# Update .env.production
ENABLE_NEW_FEATURE=false

# Restart containers
docker-compose restart backend

# Feature is now disabled, no code rollback needed
```

---

## Rollback History Template

Record all rollbacks in PROJECT_ROADMAP.md:

```markdown
### Rollback History

| Date | From Version | To Version | Environment | Reason | Rolled Back By | Duration |
|------|--------------|------------|-------------|--------|----------------|----------|
| 2025-11-05 14:30 | v1.1.0-def456a | v1.0.0-abc123f | Production | Auth bug | John Doe | 8 min |
| 2025-11-04 10:15 | v1.0.1-ghi789b | v1.0.0-abc123f | Staging | Migration fail | Jane Smith | 5 min |
```

---

## Best Practices

1. **Always backup before rollback** - Especially database
2. **Test rollback procedures** - Practice in staging
3. **Document everything** - Why, when, what, who
4. **Automate common rollbacks** - Use scripts
5. **Monitor after rollback** - Watch for issues
6. **Plan fix-forward** - Don't stay rolled back forever
7. **Learn from rollbacks** - Improve deployment process
8. **Keep rollback scripts updated** - Test regularly

---

## Additional Resources

- [Git Revert Documentation](https://git-scm.com/docs/git-revert)
- [Docker Rollback Strategies](https://docs.docker.com/engine/swarm/how-swarm-mode-works/services/)
- [Database Migration Best Practices](https://www.postgresql.org/docs/current/sql-altertable.html)

---

*Last Updated: November 5, 2025*
