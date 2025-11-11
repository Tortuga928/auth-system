# Phase 9: Session Management & Security - Implementation Plan

**Created**: November 11, 2025
**Status**: Ready to Start
**Estimated Duration**: 3-4 days
**Stories**: 5 user stories
**Dependencies**: Phase 8 (User Dashboard) complete

---

## Overview

Phase 9 builds upon the existing authentication system to provide comprehensive session management, device tracking, and security monitoring. Users will be able to:
- View all active sessions/devices
- Revoke suspicious or unwanted sessions
- See login history with location data
- Receive security alerts for suspicious activity
- Manage session timeouts and "remember me" preferences

---

## Existing Foundation (Phase 2)

We already have a `sessions` table created in Phase 2:

```sql
CREATE TABLE sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token VARCHAR(500) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  ip_address VARCHAR(45),
  user_agent VARCHAR(500),
  device_name VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**What we have:**
- ✅ Sessions table with device tracking
- ✅ IP address and user agent storage
- ✅ Active/inactive status flag
- ✅ Foreign key to users with cascade delete

**What we need to add:**
- Additional session metadata (browser, OS, location)
- Last activity timestamp
- Login attempts tracking (separate table)
- Security event logging
- Session management APIs
- Frontend UI for device management

---

## User Stories

### Story 9.1: Enhanced Session Tracking & Metadata

**Priority**: HIGH
**Estimated Time**: 4-5 hours
**Branch**: `feature/9.1-session-metadata`

**User Story**:
> As a **user**, I want **my sessions to track detailed device and location information**, so that **I can identify suspicious activity**.

**Description**:
Enhance the existing sessions table and Session model to track more detailed metadata including parsed user agent (browser, OS, device type), approximate location (from IP), and last activity timestamp.

**Tasks**:
1. Create migration to add columns:
   - `last_activity_at` (TIMESTAMP)
   - `browser` (VARCHAR 100) - parsed from user agent
   - `os` (VARCHAR 100) - parsed from user agent
   - `device_type` (VARCHAR 50) - "desktop", "mobile", "tablet"
   - `location` (VARCHAR 255) - approximate location from IP (city, country)

2. Install dependencies:
   - `ua-parser-js` - Parse user agent strings
   - `geoip-lite` - Get location from IP address (free, no API required)

3. Create/enhance `Session.js` model:
   - `create()` - Create new session with metadata
   - `findByUserId()` - Get all sessions for user
   - `findById()` - Get session by ID
   - `update()` - Update session (last_activity_at)
   - `delete()` - Delete/revoke session
   - `deleteAllForUser()` - Delete all user sessions except current
   - `cleanupExpired()` - Remove expired sessions (cron job)

4. Create utility functions:
   - `parseUserAgent(userAgentString)` - Extract browser, OS, device type
   - `getLocationFromIP(ipAddress)` - Get approximate location
   - `getDeviceName(browser, os)` - Generate friendly device name

5. Update `authController.js` login method:
   - Parse user agent on login
   - Get location from IP
   - Store enhanced metadata in session

**Acceptance Criteria**:
- [ ] Migration adds new columns to sessions table
- [ ] Session model has all CRUD methods
- [ ] User agent parsing extracts browser, OS, device type
- [ ] IP geolocation returns city and country (when available)
- [ ] Login creates session with all metadata
- [ ] `last_activity_at` updates on each authenticated request
- [ ] Test coverage: 10+ tests (model + utilities)

**Testing**:
```javascript
// Test file: test-story-9.1-session-metadata.js
- Can parse user agent (Chrome, Safari, Firefox)
- Can extract OS (Windows, macOS, Linux, Android, iOS)
- Can detect device type (desktop, mobile, tablet)
- Can get location from IP address
- Session created with metadata on login
- Last activity updates on API requests
- Expired sessions can be cleaned up
```

**Files to Modify/Create**:
```
backend/src/db/migrations/20251111_enhance_sessions_table.js (new)
backend/src/models/Session.js (new)
backend/src/utils/sessionUtils.js (new - parsing utilities)
backend/src/controllers/authController.js (modify - enhance login)
backend/src/middleware/auth.js (modify - update last_activity_at)
backend/package.json (add dependencies)
test-story-9.1-session-metadata.js (new)
```

---

### Story 9.2: Device Management Endpoints

**Priority**: HIGH
**Estimated Time**: 4-5 hours
**Branch**: `feature/9.2-device-management-api`

**User Story**:
> As a **user**, I want **API endpoints to view and manage my active sessions**, so that **I can revoke access from lost or suspicious devices**.

**Description**:
Create backend API endpoints for users to view all their active sessions (devices) and revoke specific sessions or all other sessions.

**Tasks**:
1. Create `sessionController.js` with methods:
   - `getUserSessions()` - GET /api/sessions
     - Returns all active sessions for current user
     - Includes device info, last activity, location
     - Marks current session with `isCurrent: true`

   - `revokeSession()` - DELETE /api/sessions/:sessionId
     - Revoke specific session (mark as inactive, delete refresh token)
     - Prevent revoking current session accidentally
     - Log security event

   - `revokeAllOtherSessions()` - POST /api/sessions/revoke-others
     - Revoke all sessions except current one
     - Useful for "Log out everywhere else"
     - Log security event

2. Create `/api/sessions` routes:
   - GET `/api/sessions` - List user sessions (authenticated)
   - DELETE `/api/sessions/:sessionId` - Revoke specific session (authenticated)
   - POST `/api/sessions/revoke-others` - Revoke all other sessions (authenticated)

3. Add security logging:
   - Log when session is revoked
   - Log IP address and user agent of request that revoked session
   - Store in `user_activity_logs` table

4. Add session validation:
   - Check if session exists and belongs to user
   - Check if session is not expired
   - Prevent revoking other users' sessions

**Acceptance Criteria**:
- [ ] GET /api/sessions returns all active sessions with metadata
- [ ] Current session is marked with `isCurrent: true`
- [ ] DELETE /api/sessions/:id revokes specific session
- [ ] Cannot revoke current session via DELETE endpoint
- [ ] POST /api/sessions/revoke-others revokes all except current
- [ ] Session revocation logged to activity log
- [ ] Proper error handling (404 if session not found, 403 if not owned)
- [ ] Test coverage: 12+ tests

**Testing**:
```javascript
// Test file: test-story-9.2-device-management.js
- Can list all user sessions
- Sessions include device metadata
- Current session marked correctly
- Can revoke specific session
- Cannot revoke current session
- Can revoke all other sessions
- Session revocation logged
- Cannot revoke another user's session
- Returns 404 for non-existent session
```

**Response Format**:
```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "id": 123,
        "device_name": "Chrome on Windows",
        "browser": "Chrome",
        "os": "Windows 10",
        "device_type": "desktop",
        "ip_address": "192.168.1.1",
        "location": "San Francisco, USA",
        "last_activity_at": "2025-11-11T10:30:00Z",
        "created_at": "2025-11-10T08:00:00Z",
        "is_current": true
      },
      {
        "id": 124,
        "device_name": "Safari on iPhone",
        "browser": "Safari",
        "os": "iOS 17",
        "device_type": "mobile",
        "ip_address": "10.0.0.1",
        "location": "New York, USA",
        "last_activity_at": "2025-11-09T14:20:00Z",
        "created_at": "2025-11-08T12:00:00Z",
        "is_current": false
      }
    ]
  }
}
```

**Files to Create/Modify**:
```
backend/src/controllers/sessionController.js (new)
backend/src/routes/session.js (new)
backend/src/server.js (modify - add session routes)
test-story-9.2-device-management.js (new)
```

---

### Story 9.3: Login History & Security Events

**Priority**: MEDIUM
**Estimated Time**: 5-6 hours
**Branch**: `feature/9.3-login-history`

**User Story**:
> As a **user**, I want **to see my login history and security events**, so that **I can detect unauthorized access attempts**.

**Description**:
Create a comprehensive login history system that tracks all login attempts (successful and failed), displays them with device/location information, and generates security alerts for suspicious activity.

**Tasks**:
1. Create `login_attempts` table migration:
```sql
CREATE TABLE login_attempts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  success BOOLEAN NOT NULL,
  failure_reason VARCHAR(255),
  ip_address VARCHAR(45),
  user_agent VARCHAR(500),
  browser VARCHAR(100),
  os VARCHAR(100),
  device_type VARCHAR(50),
  location VARCHAR(255),
  attempted_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_user_id (user_id),
  INDEX idx_email (email),
  INDEX idx_attempted_at (attempted_at)
);
```

2. Create `security_events` table migration:
```sql
CREATE TABLE security_events (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  description TEXT,
  severity VARCHAR(20) DEFAULT 'info',
  metadata JSON,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT NOW(),
  acknowledged BOOLEAN DEFAULT false,
  INDEX idx_user_id (user_id),
  INDEX idx_event_type (event_type),
  INDEX idx_severity (severity),
  INDEX idx_created_at (created_at)
);
```

3. Create models:
   - `LoginAttempt.js` - CRUD for login attempts
   - `SecurityEvent.js` - CRUD for security events

4. Update `authController.js`:
   - Log every login attempt (success and failure)
   - Create security events for suspicious activity:
     - Login from new location
     - Multiple failed login attempts (5+ in 15 min)
     - Login from new device
     - Password changed
     - MFA disabled
     - Account settings changed from new IP

5. Create detection utilities:
   - `detectNewLocation(userId, location)` - Check if location is new
   - `detectBruteForce(email)` - Check for multiple failed attempts
   - `detectNewDevice(userId, deviceFingerprint)` - Check if device is new

6. Create API endpoints:
   - GET `/api/security/login-history` - Paginated login history
   - GET `/api/security/events` - Paginated security events
   - POST `/api/security/events/:id/acknowledge` - Mark event as acknowledged

**Acceptance Criteria**:
- [ ] Login attempts table tracks all login tries
- [ ] Security events table stores alerts
- [ ] Every login attempt logged (success/fail)
- [ ] Failed login includes reason (invalid password, user not found, MFA failed)
- [ ] Security events generated for suspicious activity
- [ ] New location detection works
- [ ] Brute force detection triggers after 5 failed attempts in 15 min
- [ ] API endpoints return paginated data
- [ ] Test coverage: 15+ tests

**Testing**:
```javascript
// Test file: test-story-9.3-login-history.js
- Login attempts logged on success
- Login attempts logged on failure
- Failed attempt includes reason
- Login from new location creates security event
- Multiple failed attempts create brute force alert
- Login from new device creates security event
- Can retrieve paginated login history
- Can retrieve paginated security events
- Can acknowledge security events
```

**Files to Create/Modify**:
```
backend/src/db/migrations/20251111_create_login_attempts_table.js (new)
backend/src/db/migrations/20251111_create_security_events_table.js (new)
backend/src/models/LoginAttempt.js (new)
backend/src/models/SecurityEvent.js (new)
backend/src/utils/securityDetection.js (new)
backend/src/controllers/authController.js (modify)
backend/src/controllers/securityController.js (new)
backend/src/routes/security.js (new)
backend/src/server.js (modify - add security routes)
test-story-9.3-login-history.js (new)
```

---

### Story 9.4: Session Timeout & "Remember Me"

**Priority**: MEDIUM
**Estimated Time**: 3-4 hours
**Branch**: `feature/9.4-session-timeout`

**User Story**:
> As a **user**, I want **configurable session timeouts and a "remember me" option**, so that **I can balance security with convenience**.

**Description**:
Implement automatic session timeout after inactivity and "remember me" functionality for extended sessions.

**Tasks**:
1. Add configuration in `config/auth.js`:
```javascript
module.exports = {
  session: {
    inactivityTimeout: 30 * 60 * 1000, // 30 minutes
    absoluteTimeout: 7 * 24 * 60 * 60 * 1000, // 7 days
    rememberMeDuration: 30 * 24 * 60 * 60 * 1000, // 30 days
    cleanupInterval: 60 * 60 * 1000, // 1 hour
  }
};
```

2. Update sessions table migration:
   - Add `remember_me` (BOOLEAN, default false)
   - Add `absolute_expires_at` (TIMESTAMP) - max session duration

3. Create session timeout middleware:
   - `checkSessionTimeout()` - Check last_activity_at vs inactivity timeout
   - Auto-logout if inactive too long
   - Return 401 with specific error code (`SESSION_TIMEOUT`)

4. Update authentication flow:
   - Add `rememberMe` option to login endpoint
   - Set longer `expires_at` if remember_me is true
   - Set `absolute_expires_at` to prevent indefinite sessions

5. Create session cleanup cron job:
   - Run every hour
   - Delete expired sessions
   - Delete sessions past absolute timeout
   - Delete inactive sessions past inactivity timeout

6. Frontend session check:
   - Update `api.js` interceptor to handle `SESSION_TIMEOUT` error
   - Show friendly message: "Your session has expired due to inactivity"
   - Redirect to login with return URL

**Acceptance Criteria**:
- [ ] Sessions expire after 30 min inactivity (configurable)
- [ ] Sessions have absolute timeout of 7 days (configurable)
- [ ] "Remember me" extends session to 30 days
- [ ] Expired sessions automatically cleaned up hourly
- [ ] Timeout returns 401 with `SESSION_TIMEOUT` error code
- [ ] Frontend handles timeout gracefully with message
- [ ] `last_activity_at` updates on every authenticated request
- [ ] Test coverage: 10+ tests

**Testing**:
```javascript
// Test file: test-story-9.4-session-timeout.js
- Session expires after inactivity timeout
- Session stays alive if activity continues
- Remember me extends session duration
- Absolute timeout enforced even with activity
- Expired sessions cleaned up by cron job
- Timeout returns correct error code
- last_activity_at updates on API calls
```

**Files to Create/Modify**:
```
backend/src/db/migrations/20251111_add_session_timeout_fields.js (new)
backend/src/config/auth.js (modify)
backend/src/middleware/sessionTimeout.js (new)
backend/src/middleware/auth.js (modify - update last_activity_at)
backend/src/controllers/authController.js (modify - remember me)
backend/src/jobs/sessionCleanup.js (new - cron job)
backend/src/server.js (modify - start cron job)
frontend/src/services/api.js (modify - handle SESSION_TIMEOUT)
test-story-9.4-session-timeout.js (new)
```

---

### Story 9.5: Device Management UI

**Priority**: HIGH
**Estimated Time**: 5-6 hours
**Branch**: `feature/9.5-device-management-ui`

**User Story**:
> As a **user**, I want **a UI to view and manage my active sessions**, so that **I can easily revoke access from unwanted devices**.

**Description**:
Create a comprehensive frontend interface for viewing active sessions, login history, security events, and managing device access.

**Tasks**:
1. Create **DeviceManagementPage.js**:
   - List all active sessions with cards/table
   - Show device icon based on device_type (desktop/mobile/tablet)
   - Display device name, browser, OS, location
   - Show last activity time (relative: "2 hours ago")
   - Mark current session with badge
   - "Revoke" button for each session (except current)
   - "Log out everywhere else" button
   - Confirmation dialog for revocations

2. Create **LoginHistoryPage.js**:
   - Paginated table of login attempts
   - Color-coded success (green) and failure (red) indicators
   - Show device, location, timestamp
   - Filter by success/failure
   - Show failure reason for failed attempts

3. Create **SecurityAlertsPage.js**:
   - List security events with severity badges
   - Color-coded by severity (info=blue, warning=yellow, critical=red)
   - Show event description and metadata
   - "Acknowledge" button for each alert
   - Filter by severity and event type
   - Empty state: "No security alerts"

4. Update **DashboardPage.js**:
   - Add "Active Devices" widget showing device count
   - Add "Recent Security Alerts" widget (last 3 alerts)
   - Link to full device management page

5. Update **AccountSettingsPage.js**:
   - Add "Session Security" section
   - Show session timeout settings (read-only for now)
   - Link to device management
   - Link to login history
   - Link to security alerts

6. Add navigation links:
   - Update navbar with "Security" dropdown:
     - Devices & Sessions
     - Login History
     - Security Alerts

7. Create API integration in `api.js`:
```javascript
security: {
  getSessions: () => api.get('/api/sessions'),
  revokeSession: (sessionId) => api.delete(`/api/sessions/${sessionId}`),
  revokeAllOthers: () => api.post('/api/sessions/revoke-others'),
  getLoginHistory: (page, limit) => api.get(`/api/security/login-history?page=${page}&limit=${limit}`),
  getSecurityEvents: (page, limit) => api.get(`/api/security/events?page=${page}&limit=${limit}`),
  acknowledgeEvent: (eventId) => api.post(`/api/security/events/${eventId}/acknowledge`),
}
```

**Design Requirements**:
- Consistent with existing UI (match DashboardPage, ActivityLogPage style)
- Responsive (desktop table, mobile cards)
- Device icons (FontAwesome or similar)
- Confirmation dialogs for destructive actions
- Loading states
- Error handling with toast messages
- Empty states with helpful messages

**Acceptance Criteria**:
- [ ] Device management page shows all active sessions
- [ ] Current session clearly marked
- [ ] Can revoke individual sessions (with confirmation)
- [ ] Can log out everywhere else (with confirmation)
- [ ] Login history page shows all attempts (paginated)
- [ ] Success/failure color-coded correctly
- [ ] Security alerts page shows events by severity
- [ ] Can acknowledge security alerts
- [ ] Dashboard shows device count widget
- [ ] Dashboard shows recent alerts widget
- [ ] Navigation links work correctly
- [ ] Responsive design (desktop/mobile)
- [ ] Manual testing: All features work in UI

**Testing**:
- Manual testing in browser (all features)
- Integration test: `test-story-9.5-device-ui-integration.js`
  - API endpoints return correct data
  - Session revocation works end-to-end
  - Login history displays correctly
  - Security events display correctly

**Files to Create/Modify**:
```
frontend/src/pages/DeviceManagementPage.js (new, ~400 lines)
frontend/src/pages/LoginHistoryPage.js (new, ~300 lines)
frontend/src/pages/SecurityAlertsPage.js (new, ~300 lines)
frontend/src/pages/DashboardPage.js (modify - add widgets)
frontend/src/pages/AccountSettingsPage.js (modify - add security section)
frontend/src/services/api.js (modify - add security endpoints)
frontend/src/App.js (modify - add routes)
frontend/src/components/Navbar.js (modify - add security dropdown)
test-story-9.5-device-ui-integration.js (new)
```

---

## Phase 9 Integration Testing

After all 5 stories are complete, create comprehensive integration test:

**File**: `test-phase-9-integration.js`

**Test Suites** (30+ tests):
1. **Session Lifecycle** (5 tests)
   - Session created on login with metadata
   - Last activity updates on API calls
   - Session expires after inactivity
   - Remember me extends session
   - Session cleanup works

2. **Device Management** (6 tests)
   - Can list all user sessions
   - Can revoke specific session
   - Cannot revoke another user's session
   - Can revoke all other sessions
   - Revocation logged in activity log
   - Revoked session cannot be used

3. **Login History** (5 tests)
   - Successful login logged
   - Failed login logged with reason
   - Login history paginated correctly
   - Can filter by success/failure
   - Old login attempts cleaned up

4. **Security Events** (7 tests)
   - New location triggers alert
   - Brute force triggers alert
   - New device triggers alert
   - Password change triggers alert
   - Can retrieve security events
   - Can acknowledge events
   - Events have correct severity

5. **Cross-Feature Integration** (7 tests)
   - Login → Session created → Device list shows it
   - Session revoked → Cannot use refresh token
   - Failed logins → Security event created
   - Multiple devices → All shown in device list
   - Log out everywhere → All sessions revoked
   - Session timeout → Activity log entry created
   - Security event → Dashboard widget shows it

---

## Dependencies & Technologies

### New NPM Packages
```json
{
  "ua-parser-js": "^1.0.37",
  "geoip-lite": "^1.4.9",
  "node-cron": "^3.0.3"
}
```

### Database Additions
- **sessions** table enhancements (5 new columns)
- **login_attempts** table (new, 13 columns)
- **security_events** table (new, 9 columns)

### New Backend Files
- 6 new migrations
- 3 new models (Session, LoginAttempt, SecurityEvent)
- 2 new controllers (sessionController, securityController)
- 2 new route files (session.js, security.js)
- 3 new utility files (sessionUtils, securityDetection, sessionCleanup)
- 2 new middleware (sessionTimeout, enhanced auth)

### New Frontend Files
- 3 new pages (DeviceManagement, LoginHistory, SecurityAlerts)
- Dashboard and Settings enhancements
- Navbar enhancements
- API integration additions

---

## Success Metrics

**Code Quality**:
- All tests passing (60+ tests total)
- 100% test coverage on critical paths
- No console errors in browser
- All ESLint rules passing

**Functionality**:
- Users can view all active sessions
- Users can revoke sessions from UI
- Login history displays correctly
- Security events generated appropriately
- Session timeout works correctly
- Remember me works correctly

**User Experience**:
- Responsive design works on all screen sizes
- Loading states show during API calls
- Error messages are clear and helpful
- Confirmation dialogs prevent accidental revocations
- Empty states guide users

---

## Timeline Estimate

| Story | Estimated Time | Dependencies |
|-------|----------------|--------------|
| 9.1 - Session Metadata | 4-5 hours | None (enhances Phase 2 foundation) |
| 9.2 - Device Management API | 4-5 hours | Story 9.1 |
| 9.3 - Login History | 5-6 hours | Story 9.1 |
| 9.4 - Session Timeout | 3-4 hours | Story 9.1 |
| 9.5 - Device Management UI | 5-6 hours | Stories 9.1, 9.2, 9.3 |
| Integration Testing | 2-3 hours | All stories complete |
| **TOTAL** | **23-29 hours** | **3-4 days** |

---

## Next Steps

1. ✅ Review this plan
2. ⬜ Start with Story 9.1 (Session Metadata)
3. ⬜ Create feature branch: `feature/9.1-session-metadata`
4. ⬜ Implement and test Story 9.1
5. ⬜ Merge to staging and continue with Story 9.2

---

*Plan Created: November 11, 2025*
*Ready to Begin: Phase 8 Complete (100%)*
