# Git Workflow Guide

This document outlines the Git branching strategy, workflow, and best practices for the Authentication System project.

## Table of Contents

1. [Branching Strategy](#branching-strategy)
2. [Branch Naming Conventions](#branch-naming-conventions)
3. [Workflow Steps](#workflow-steps)
4. [Commit Message Conventions](#commit-message-conventions)
5. [Pull Request Process](#pull-request-process)
6. [Merge Procedures](#merge-procedures)
7. [Conflict Resolution](#conflict-resolution)
8. [Code Review Checklist](#code-review-checklist)

---

## Branching Strategy

This project uses a **three-tier branching strategy**:

### Main Branches

1. **`main`** - Production-ready code
   - Always stable and deployable
   - Protected branch (requires PR approval)
   - Tagged with semantic versions
   - Deployed to production

2. **`staging`** - Integration testing environment
   - Pre-production testing
   - All features merged here before main
   - Deployed to staging environment for testing
   - Should be stable but may have minor issues

### Supporting Branches

3. **Feature Branches** - Individual user story implementation
   - Created from: `main`
   - Merged to: `staging` (after testing)
   - Naming: `type/story-id-description`
   - Short-lived (delete after merge)

### Branch Types

- **`feature/`** - New features or enhancements
- **`bugfix/`** - Bug fixes during development
- **`hotfix/`** - Critical production fixes
- **`refactor/`** - Code refactoring without feature changes
- **`docs/`** - Documentation updates only
- **`test/`** - Test additions or modifications

---

## Branch Naming Conventions

### Format

```
type/story-id-description
```

### Examples

- `feature/1.1-project-setup`
- `feature/2.3-user-registration`
- `feature/3.5-oauth-google`
- `bugfix/2.3-email-validation`
- `hotfix/4.2-security-patch`
- `refactor/3.1-cleanup-auth`
- `docs/update-readme`
- `test/1.2-add-unit-tests`

### Rules

1. **Lowercase only** - All branch names in lowercase
2. **Hyphens for spaces** - Use hyphens to separate words
3. **Clear description** - Description should be brief but meaningful (2-4 words)
4. **Story ID required** - Always include the story ID (except docs/test branches)
5. **No special characters** - Only letters, numbers, hyphens, and forward slashes

---

## Workflow Steps

### 1. Start New Feature

```bash
# Update main branch
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/1.1-project-setup

# Verify branch
git branch
```

### 2. Develop Feature

```bash
# Make changes to code
# ...

# Stage changes
git add .

# Commit with message
git commit -m "feat(setup): initialize project structure

- Create backend folder structure
- Add Express.js setup
- Configure TypeScript
- Add basic middleware

Story: 1.1"

# Push to remote
git push -u origin feature/1.1-project-setup
```

### 3. Keep Feature Branch Updated

```bash
# Regularly sync with main
git checkout main
git pull origin main
git checkout feature/1.1-project-setup
git merge main

# Or use rebase for cleaner history
git rebase main
```

### 4. Create Pull Request

```bash
# Push latest changes
git push origin feature/1.1-project-setup

# Create PR via GitHub/GitLab UI:
# - Base: staging
# - Compare: feature/1.1-project-setup
# - Fill out PR template
# - Request reviews
```

### 5. Merge to Staging

```bash
# After PR approval
# Merge via GitHub UI or command line:

git checkout staging
git pull origin staging
git merge --no-ff feature/1.1-project-setup
git push origin staging
```

### 6. Test in Staging

```bash
# Deploy staging environment
# Run tests
# Verify functionality
# Check for regressions
```

### 7. Merge to Main (Production)

```bash
# After successful staging tests
# Create PR: staging → main

git checkout main
git pull origin main
git merge --no-ff staging
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin main --tags
```

### 8. Cleanup

```bash
# Delete feature branch locally
git branch -d feature/1.1-project-setup

# Delete feature branch remotely
git push origin --delete feature/1.1-project-setup
```

---

## Commit Message Conventions

We follow the **Conventional Commits** specification.

### Format

```
type(scope): subject

body (optional)

footer (optional)
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation only
- **style**: Code style changes (formatting, no logic change)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks (deps, build, etc.)
- **perf**: Performance improvements
- **ci**: CI/CD changes

### Examples

```bash
# Feature commit
git commit -m "feat(auth): add JWT token generation

Implement JWT access and refresh token generation with configurable expiration times.

Story: 3.2"

# Bug fix commit
git commit -m "fix(email): correct verification link format

Fix issue where verification links were malformed in production environment.

Story: 4.1
Fixes: #42"

# Documentation commit
git commit -m "docs(readme): update installation instructions"

# Refactor commit
git commit -m "refactor(user): extract validation logic to separate module"
```

### Rules

1. **Imperative mood** - "add feature" not "added feature"
2. **Lowercase subject** - No capitalization
3. **No period** - Don't end subject with period
4. **50 char limit** - Keep subject line under 50 characters
5. **Wrap body at 72** - Wrap body text at 72 characters
6. **Reference story** - Include story ID in body or footer

---

## Pull Request Process

### PR Template

```markdown
## Description
Brief description of changes

## Story
Story ID: 1.1 - Project Setup

## Type of Change
- [ ] Feature
- [ ] Bug Fix
- [ ] Hotfix
- [ ] Refactor
- [ ] Documentation
- [ ] Test

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed
- [ ] All tests passing

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Dependent changes merged

## Screenshots (if applicable)

## Additional Notes
```

### Review Process

1. **Create PR** - Fill out PR template completely
2. **Automated checks** - Wait for CI/CD pipeline
3. **Code review** - At least one approval required
4. **Address feedback** - Make requested changes
5. **Final approval** - Get final approval
6. **Merge** - Merge with `--no-ff` (no fast-forward)

---

## Merge Procedures

### Merging Feature → Staging

```bash
# Always use --no-ff to preserve history
git checkout staging
git merge --no-ff feature/1.1-project-setup
git push origin staging
```

### Merging Staging → Main

```bash
# Create release tag
git checkout main
git merge --no-ff staging
git tag -a v1.0.0 -m "Release v1.0.0 - Initial production release"
git push origin main --tags
```

### Hotfix Procedure

```bash
# Create hotfix from main
git checkout main
git checkout -b hotfix/4.2-security-patch

# Make fix and test
# ...

# Merge to main
git checkout main
git merge --no-ff hotfix/4.2-security-patch
git tag -a v1.0.1 -m "Hotfix v1.0.1 - Security patch"
git push origin main --tags

# Also merge to staging
git checkout staging
git merge --no-ff hotfix/4.2-security-patch
git push origin staging

# Delete hotfix branch
git branch -d hotfix/4.2-security-patch
git push origin --delete hotfix/4.2-security-patch
```

---

## Conflict Resolution

### When Conflicts Occur

1. **Don't panic** - Conflicts are normal
2. **Understand the changes** - Review both versions
3. **Communicate** - Discuss with team if needed
4. **Test after resolution** - Always test merged code

### Resolution Steps

```bash
# Update your branch
git checkout feature/1.1-project-setup
git fetch origin
git merge origin/main

# Conflicts will be marked in files
# Open conflicted files and look for:
<<<<<<< HEAD
Your changes
=======
Incoming changes
>>>>>>> origin/main

# Edit files to resolve conflicts
# Remove conflict markers
# Keep the correct code

# Mark as resolved
git add <resolved-file>

# Complete merge
git commit -m "merge: resolve conflicts with main"

# Push
git push origin feature/1.1-project-setup
```

### Best Practices

- **Resolve early** - Don't let conflicts accumulate
- **Small commits** - Easier to resolve conflicts
- **Communicate** - Talk to team about conflicting changes
- **Test thoroughly** - Run tests after resolution
- **Use tools** - Use merge tools (VS Code, GitKraken, etc.)

---

## Code Review Checklist

### For Author

- [ ] Code is self-documenting or well-commented
- [ ] All tests pass locally
- [ ] No debug code or console.logs
- [ ] No sensitive data (keys, passwords) in code
- [ ] Code follows project style guide
- [ ] PR description is clear and complete
- [ ] Story acceptance criteria met
- [ ] No unnecessary files committed

### For Reviewer

**Functionality**
- [ ] Code does what it's supposed to do
- [ ] Edge cases are handled
- [ ] Error handling is appropriate
- [ ] No obvious bugs

**Code Quality**
- [ ] Code is readable and maintainable
- [ ] Functions are single-purpose
- [ ] No code duplication
- [ ] Naming is clear and consistent
- [ ] No unnecessary complexity

**Testing**
- [ ] Tests are comprehensive
- [ ] Tests are meaningful (not just coverage)
- [ ] All tests pass
- [ ] Manual testing completed

**Security**
- [ ] No SQL injection vulnerabilities
- [ ] No XSS vulnerabilities
- [ ] Input validation present
- [ ] Sensitive data encrypted
- [ ] Authentication/authorization correct

**Performance**
- [ ] No obvious performance issues
- [ ] Database queries optimized
- [ ] No memory leaks
- [ ] Appropriate caching used

**Documentation**
- [ ] README updated if needed
- [ ] API docs updated
- [ ] Comments explain "why" not "what"
- [ ] User stories updated with progress

---

## Common Git Commands

### Branch Management

```bash
# List branches
git branch -a

# Delete local branch
git branch -d feature/1.1-project-setup

# Delete remote branch
git push origin --delete feature/1.1-project-setup

# Rename branch
git branch -m old-name new-name
```

### Undoing Changes

```bash
# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1

# Revert a commit (creates new commit)
git revert <commit-hash>

# Discard local changes
git checkout -- <file>
```

### Viewing History

```bash
# View commit history
git log --oneline --graph --all

# View changes in commit
git show <commit-hash>

# View file history
git log -p <file>
```

### Stashing Changes

```bash
# Save work in progress
git stash

# List stashes
git stash list

# Apply stash
git stash apply

# Apply and remove stash
git stash pop
```

---

## Git Aliases (Optional)

Add to `.gitconfig` for shortcuts:

```ini
[alias]
    st = status
    co = checkout
    br = branch
    ci = commit
    lg = log --oneline --graph --all
    unstage = reset HEAD --
    last = log -1 HEAD
    visual = log --oneline --graph --all --decorate
```

---

## Best Practices

1. **Commit often** - Small, focused commits
2. **Pull before push** - Always sync before pushing
3. **Write good messages** - Future you will thank you
4. **Test before commit** - Don't break the build
5. **Review your own code** - Check diff before committing
6. **Keep branches short-lived** - Merge frequently
7. **Don't commit secrets** - Use environment variables
8. **Tag releases** - Use semantic versioning

---

## Troubleshooting

### "Cannot push to protected branch"
- Create a PR instead of direct push
- Protected branches require review

### "Merge conflicts"
- See [Conflict Resolution](#conflict-resolution) section

### "Pushed sensitive data"
- Immediately notify team
- Use `git filter-branch` or BFG Repo-Cleaner
- Rotate all exposed credentials

### "Wrong branch"
```bash
# Move commits to correct branch
git checkout correct-branch
git cherry-pick <commit-hash>
git checkout wrong-branch
git reset --hard HEAD~1
```

---

## Additional Resources

- [Git Documentation](https://git-scm.com/doc)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Flow](https://guides.github.com/introduction/flow/)
- [Atlassian Git Tutorials](https://www.atlassian.com/git/tutorials)

---

*Last Updated: November 5, 2025*
