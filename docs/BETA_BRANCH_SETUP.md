# Beta Branch Setup Guide

## Overview

The `beta` branch serves as a pre-production testing environment deployed on Render. It sits between `staging` (local testing) and `master` (production).

## Branch Workflow

```
feature/* → staging → beta → master
   ↓           ↓       ↓       ↓
 Local     Local    Render  Render
  Dev      Test     Beta    Prod
```

## Branch Information

- **Source**: Created from `staging` branch
- **Created**: November 10, 2025
- **Purpose**: Pre-production testing on Render infrastructure
- **Deployment**: Auto-deploy to Render on push

## Git Commands

### Deploying to Beta

```bash
# From staging, merge to beta
git checkout beta
git merge --no-ff staging
git push origin beta

# Render automatically deploys after push
```

### Checking Beta Status

```bash
# View beta branch
git checkout beta

# Compare with staging
git log staging..beta

# Compare with master
git log beta..master
```

## Branch Protection Rules

### Recommended GitHub Settings

Configure these settings at: `https://github.com/Tortuga928/auth-system/settings/branches`

**For `beta` branch:**

1. ✅ **Require pull request reviews before merging**: No
   - Direct push from staging allowed for faster iteration

2. ✅ **Require status checks to pass**: Optional
   - Add if CI/CD is configured

3. ✅ **Require branches to be up to date**: Yes
   - Ensures no conflicts with other changes

4. ✅ **Include administrators**: Yes
   - Even admins follow the workflow

5. ✅ **Restrict who can push**: Optional
   - Limit to staging branch or key developers

6. ✅ **Allow force pushes**: No
   - Prevent accidental history rewriting

7. ✅ **Allow deletions**: No
   - Beta branch is permanent infrastructure

### Current Protection Status

- [ ] Branch protection rules configured on GitHub
- [ ] Auto-deploy configured on Render
- [ ] Team notified of beta workflow

## Testing Workflow

1. **Develop feature** in feature branch
2. **Merge to staging** for local testing
3. **Test locally** at http://localhost:3000
4. **Merge to beta** when staging tests pass
5. **Test on Render** at beta URLs
6. **Merge to master** when beta tests pass
7. **Deploy to production**

## Rollback Procedures

### Rollback Beta to Previous Commit

```bash
# View commit history
git log --oneline -10

# Rollback to specific commit
git checkout beta
git reset --hard <commit-hash>
git push origin beta --force

# Note: Force push is dangerous, use only for rollbacks
```

### Emergency Rollback

If beta environment is completely broken:

```bash
# Reset beta to match staging
git checkout beta
git reset --hard staging
git push origin beta --force

# Or reset to production
git checkout beta
git reset --hard master
git push origin beta --force
```

## Maintenance

### Keeping Beta Up to Date

Beta should always be ahead of or equal to staging:

```bash
# Regular sync (weekly or after major staging updates)
git checkout beta
git merge --no-ff staging
git push origin beta
```

### Cleaning Up Stale Data

Beta database can be reset via Render dashboard:
1. Go to beta PostgreSQL service
2. Use "Reset Database" option (loses all data)
3. Restart backend service to run migrations and seeds

## Troubleshooting

### "Beta is behind staging"

```bash
git checkout beta
git merge staging
git push origin beta
```

### "Merge conflicts with beta"

```bash
git checkout beta
git merge staging
# Resolve conflicts in files
git add .
git commit -m "merge: resolve conflicts between staging and beta"
git push origin beta
```

### "Beta deployment failed on Render"

1. Check Render logs for errors
2. Verify environment variables are set
3. Check database connectivity
4. Rollback if necessary (see Rollback Procedures above)

---

*Created: November 10, 2025*
*Part of: Phase 7-Beta-Branch-Addition*
