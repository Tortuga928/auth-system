# Authentication System - Known Issues

**Last Updated**: November 12, 2025

This document tracks known issues, technical debt, and architectural concerns that require attention.

---

## Table of Contents

1. [Critical Issues](#critical-issues)
2. [Medium Priority Issues](#medium-priority-issues)
3. [Low Priority Issues](#low-priority-issues)
4. [Resolved Issues](#resolved-issues)

---

## Critical Issues

### Issue #1: Express-Session Middleware Conflict

**Severity**: 🔴 **HIGH** - Blocks automated testing, potential runtime errors

**Discovered**: November 12, 2025 (Story 9.5: Device Management UI)

**Status**: Open - Requires Architectural Refactoring

**Related Stories**: Stories 9.1-9.4 (Session Management backend)

**Description**:

The application mixes two incompatible authentication paradigms:
1. **Session-based authentication** (Passport.js OAuth for Google/GitHub login)
2. **JWT-based authentication** (Email/password login)

Express-session middleware is configured globally for Passport but interferes with JWT-authenticated routes, causing the following error:

```
TypeError: req.session.touch is not a function
```

This occurs when JWT-authenticated routes (e.g., `/api/sessions`) try to access `req.session`, which is not properly initialized for non-OAuth requests.

**Impact**:
- ❌ Automated integration tests fail with timeout errors
- ❌ Session management endpoints (`/api/sessions/*`) return 500 errors
- ❌ Blocks completion of Story 9.5 integration tests
- ⚠️ Potential runtime errors in production

**Workaround**:
- Manual UI testing in browser (backend endpoints may work for browser-based testing)
- Frontend components are fully functional and ready for testing

**Root Cause**:

Express-session middleware was configured with a custom `session.timeout` property (from Phase 9 planning) that it doesn't recognize, causing the session object not to initialize properly. Additionally, the global session middleware conflicts with JWT authentication flow.

**Affected Files**:
- `backend/src/config/index.js` - Session configuration
- `backend/src/app.js` - Middleware setup (lines 58-80)
- `backend/src/controllers/sessionController.js` - Session management endpoints
- All `/api/sessions/*` and `/api/security/*` routes

**Attempted Fixes** (all unsuccessful):

1. ✅ **Config Separation** (`backend/src/config/index.js`)
   - Separated `expressSession` config from custom `session.timeout` config
   - **Result**: Prevents config error but doesn't resolve `session.touch` issue

2. ✅ **Set saveUninitialized: true** (`backend/src/app.js:62`)
   - Changed from `false` to `true` to allow session initialization
   - **Result**: Helps but doesn't fully resolve the conflict

3. ❌ **Route-specific session middleware**
   - Applied session only to OAuth routes (`/api/oauth`, `/api/auth/google`, `/api/auth/github`)
   - **Result**: Broke Passport.js (requires global session middleware)

4. ❌ **No-op touch() function**
   - Added middleware to provide `req.session.touch = function() {};` for JWT routes
   - **Result**: Function gets overwritten by express-session's end hook

5. ❌ **req.session = undefined**
   - Set session to `undefined` for JWT routes (`backend/src/app.js:75-78`)
   - **Result**: Breaks Passport, causes 500 errors on OAuth registration

**Recommended Solution**:

**Architectural Refactoring** (estimated 4-6 hours):

1. **Isolate Passport/OAuth Routes**:
   - Apply express-session middleware **only** to OAuth routes
   - Use route-specific middleware instead of global application middleware
   - Configure Passport to work with scoped session middleware

2. **Keep JWT Routes Session-Free**:
   - Ensure JWT routes (`/api/sessions/*`, `/api/security/*`, `/api/auth/login`, `/api/auth/register`) never touch `req.session`
   - Remove any session-related logic from JWT controllers
   - Use only JWT tokens for authentication on these routes

3. **Middleware Restructuring**:
   ```javascript
   // backend/src/app.js

   // Remove global session middleware
   // app.use(session(sessionConfig)); // ❌ Remove this

   // Apply session only to OAuth routes
   const oauthSessionMiddleware = session({
     ...config.expressSession,
     saveUninitialized: false,
   });

   app.use('/api/oauth', oauthSessionMiddleware);
   app.use('/api/auth/google', oauthSessionMiddleware);
   app.use('/api/auth/github', oauthSessionMiddleware);

   // Initialize Passport with session support for OAuth routes only
   // May require custom Passport initialization per route
   ```

4. **Passport Configuration Update**:
   - Modify `backend/src/config/passport.js` to handle scoped session middleware
   - Test OAuth login flow thoroughly after changes
   - Ensure session serialization/deserialization still works

5. **Testing**:
   - Verify OAuth login (Google, GitHub) still works
   - Verify email/password login (JWT) works
   - Verify session management endpoints work without session errors
   - Run all Story 9.5 integration tests (35+ tests)

**References**:
- Story 9.5 Completion Report: `docs/STORY_9.5_COMPLETION_REPORT.md`
- Integration Test Suite: `test-story-9.5-device-management-ui.js`
- Express-session docs: https://github.com/expressjs/session
- Passport.js docs: https://www.passportjs.org/

**Next Actions**:
1. Create dedicated story/ticket for architectural refactoring (e.g., "Story 9.6: Session/JWT Architecture Refactoring")
2. Schedule refactoring work (estimated 4-6 hours)
3. Proceed with Stories 9.1-9.4 backend implementation (may need to address this issue first)
4. Manual UI testing of Story 9.5 frontend components

**Created By**: Claude AI Assistant
**Reported In**: Story 9.5 Implementation (November 12, 2025)

---

## Medium Priority Issues

*(No medium priority issues at this time)*

---

## Low Priority Issues

*(No low priority issues at this time)*

---

## Resolved Issues

*(No resolved issues yet)*

---

## Contributing

When adding a new issue to this document, please include:
- **Severity**: 🔴 HIGH | 🟠 MEDIUM | 🟡 LOW
- **Discovered**: Date and context
- **Status**: Open | In Progress | Resolved
- **Description**: Clear explanation of the problem
- **Impact**: What's affected and how
- **Root Cause**: Technical explanation
- **Attempted Fixes**: What's been tried
- **Recommended Solution**: Proposed fix with estimate
- **References**: Links to related docs, code, or external resources

---

*This document is a living record of known issues and will be updated as issues are discovered, investigated, and resolved.*
