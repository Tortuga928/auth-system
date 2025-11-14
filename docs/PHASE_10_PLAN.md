# Phase 10: Admin Panel - Implementation Plan

**Status**: Planning
**Created**: November 14, 2025
**Estimated Time**: 5-7 days
**Dependencies**: Phases 1-9 complete

---

## Overview

Phase 10 implements a comprehensive admin panel for managing users, monitoring system activity, and configuring application settings. This phase builds on the existing authentication and session management features to provide administrators with powerful tools for user management and system oversight.

---

## Goals

1. Enable admins to manage users (create, read, update, delete)
2. Provide role and permission management capabilities
3. Implement system activity monitoring and audit logs
4. Create admin-specific dashboard with key metrics
5. Enable system configuration management
6. Ensure all admin actions are logged and auditable

---

## Stories (6 Total)

### Story 10.1: Admin Role & Permissions Setup

**Priority**: HIGH
**Estimated Time**: 4-6 hours
**Dependencies**: None

**User Story**:
> As an **admin**, I want **proper authorization checks**, so that **only admins can access admin features**.

**Description**:
Set up role-based access control (RBAC) specifically for admin features, including middleware for admin-only routes and permission checks.

**Acceptance Criteria**:
- [ ] Admin role exists in database
- [ ] Admin middleware checks user role
- [ ] Non-admin users are blocked from admin routes (401/403)
- [ ] Admin routes are protected at router level
- [ ] Super admin role for elevated permissions (optional)
- [ ] Permission hierarchy defined (user < admin < super_admin)

**Technical Tasks**:
- Create `isAdmin` middleware in `backend/src/middleware/auth.js`
- Add admin role check to existing `authenticate` middleware
- Create admin routes group with middleware protection
- Add super_admin role support (optional)
- Write tests for admin authorization

**Files to Create/Modify**:
- `backend/src/middleware/auth.js` - Add `isAdmin`, `isSuperAdmin`
- `backend/src/routes/admin.js` - Admin routes group (new)
- `backend/src/controllers/adminController.js` - Admin operations (new)

---

### Story 10.2: User Management API

**Priority**: HIGH
**Estimated Time**: 6-8 hours
**Dependencies**: Story 10.1

**User Story**:
> As an **admin**, I want **to manage users via API**, so that **I can create, update, and delete user accounts**.

**Description**:
Implement RESTful API endpoints for user management (CRUD operations), including search, filtering, and bulk operations.

**Acceptance Criteria**:
- [ ] GET /api/admin/users - List all users (paginated)
- [ ] GET /api/admin/users/:id - Get user details
- [ ] POST /api/admin/users - Create new user
- [ ] PUT /api/admin/users/:id - Update user
- [ ] DELETE /api/admin/users/:id - Delete/deactivate user
- [ ] GET /api/admin/users/search - Search users by email/username
- [ ] PUT /api/admin/users/:id/role - Update user role
- [ ] PUT /api/admin/users/:id/status - Activate/deactivate user
- [ ] All operations require admin role
- [ ] All operations are logged to audit log

**Technical Tasks**:
- Create user management controller
- Implement pagination, filtering, sorting
- Add search functionality (email, username, role)
- Implement soft delete (deactivation) instead of hard delete
- Add bulk operations (optional)
- Create comprehensive tests

**API Endpoints**:
```javascript
// List users with pagination
GET /api/admin/users?page=1&pageSize=20&role=user&status=active&search=john

// Get user details
GET /api/admin/users/:id

// Create user
POST /api/admin/users
Body: { username, email, password, role }

// Update user
PUT /api/admin/users/:id
Body: { username, email, role, status }

// Delete user (soft delete)
DELETE /api/admin/users/:id

// Update role
PUT /api/admin/users/:id/role
Body: { role: 'admin' }

// Update status
PUT /api/admin/users/:id/status
Body: { status: 'active' | 'inactive' | 'suspended' }
```

**Files to Create/Modify**:
- `backend/src/controllers/adminController.js` - User management methods
- `backend/src/routes/admin.js` - User management routes
- `backend/src/models/User.js` - Add admin query methods
- `backend/src/utils/validation.js` - Admin input validation

---

### Story 10.3: Activity & Audit Logs

**Priority**: MEDIUM
**Estimated Time**: 5-6 hours
**Dependencies**: Story 10.2

**User Story**:
> As an **admin**, I want **to view audit logs of admin actions**, so that **I can track who made what changes**.

**Description**:
Implement comprehensive audit logging for all admin actions, including user management, role changes, and system configuration updates.

**Acceptance Criteria**:
- [ ] All admin actions are logged automatically
- [ ] Logs include: admin user, action type, target user/resource, timestamp, IP
- [ ] GET /api/admin/audit-logs - View logs (paginated)
- [ ] Filter logs by: admin, action type, date range, target user
- [ ] Export logs to CSV (optional)
- [ ] Logs are immutable (cannot be deleted/edited)
- [ ] Retention policy configurable (default: 90 days)

**Log Entry Format**:
```javascript
{
  id: 123,
  admin_id: 5,
  admin_email: 'admin@example.com',
  action: 'USER_UPDATE',
  target_type: 'user',
  target_id: 42,
  details: { role: 'user' → 'admin' },
  ip_address: '192.168.1.1',
  user_agent: 'Mozilla/5.0...',
  timestamp: '2025-11-14T10:30:00Z'
}
```

**Action Types**:
- `USER_CREATE`, `USER_UPDATE`, `USER_DELETE`, `USER_ROLE_CHANGE`
- `USER_STATUS_CHANGE`, `USER_PASSWORD_RESET`
- `SYSTEM_CONFIG_UPDATE`, `ADMIN_LOGIN`

**Technical Tasks**:
- Create `audit_logs` table migration
- Create AuditLog model
- Implement audit logging middleware
- Create audit log query methods
- Add CSV export functionality (optional)
- Write comprehensive tests

**Files to Create/Modify**:
- `backend/src/db/migrations/YYYYMMDD_create_audit_logs_table.js`
- `backend/src/models/AuditLog.js` - Audit log model (new)
- `backend/src/middleware/auditLog.js` - Logging middleware (new)
- `backend/src/controllers/adminController.js` - Add audit log endpoints
- `backend/src/routes/admin.js` - Add audit log routes

---

### Story 10.4: Admin Dashboard API

**Priority**: MEDIUM
**Estimated Time**: 4-5 hours
**Dependencies**: Story 10.2, 10.3

**User Story**:
> As an **admin**, I want **a dashboard with key metrics**, so that **I can monitor system health at a glance**.

**Description**:
Implement API endpoints for admin dashboard metrics, including user statistics, activity trends, and system health indicators.

**Acceptance Criteria**:
- [ ] GET /api/admin/dashboard/stats - Overall system statistics
- [ ] GET /api/admin/dashboard/user-growth - User registration trends
- [ ] GET /api/admin/dashboard/activity - Recent activity summary
- [ ] GET /api/admin/dashboard/security - Security overview
- [ ] Metrics calculated efficiently (use caching where appropriate)
- [ ] All metrics updated in real-time or near-real-time

**Dashboard Metrics**:
```javascript
// Overall Statistics
{
  totalUsers: 1234,
  activeUsers: 890,
  newUsersToday: 12,
  newUsersThisWeek: 67,
  newUsersThisMonth: 245,
  adminCount: 5,
  suspendedCount: 3
}

// User Growth (last 30 days)
{
  labels: ['Nov 1', 'Nov 2', ...],
  data: [10, 15, 8, ...]
}

// Activity Summary
{
  loginAttemptsToday: 456,
  failedLoginsToday: 23,
  activeSessionsNow: 145,
  securityEventsToday: 5
}

// Security Overview
{
  criticalAlertsCount: 2,
  mfaEnabledPercentage: 67.5,
  recentFailedLogins: [...],
  suspiciousActivity: [...]
}
```

**Technical Tasks**:
- Create dashboard statistics queries
- Implement caching for expensive queries (Redis)
- Add time-series data aggregation
- Create comprehensive tests
- Optimize query performance

**Files to Create/Modify**:
- `backend/src/controllers/adminController.js` - Dashboard methods
- `backend/src/routes/admin.js` - Dashboard routes
- `backend/src/services/adminStatsService.js` - Statistics service (new)
- `backend/src/utils/cache.js` - Caching utilities

---

### Story 10.5: Admin Panel UI

**Priority**: HIGH
**Estimated Time**: 8-10 hours
**Dependencies**: Stories 10.1-10.4

**User Story**:
> As an **admin**, I want **a web interface for admin tasks**, so that **I can manage users without using API directly**.

**Description**:
Implement comprehensive admin panel UI with user management, audit logs, and dashboard metrics.

**Acceptance Criteria**:
- [ ] Admin Dashboard page with key metrics and charts
- [ ] Users Management page (list, search, filter, CRUD)
- [ ] User Details page (view/edit user, roles, sessions, activity)
- [ ] Audit Logs page (view, filter, export)
- [ ] Admin navigation menu
- [ ] Responsive design (mobile-friendly)
- [ ] All UI actions call backend APIs
- [ ] Error handling and user feedback
- [ ] Confirmation dialogs for destructive actions

**Pages to Create**:

**1. Admin Dashboard** (`/admin/dashboard`)
- Key metrics cards (total users, active users, new users)
- User growth chart (last 30 days)
- Recent activity feed
- Security alerts summary

**2. Users Management** (`/admin/users`)
- Paginated user list table
- Search and filter controls
- Sort by: date, name, role, status
- Actions: View, Edit, Delete, Change Role
- Bulk actions (optional)

**3. User Details** (`/admin/users/:id`)
- User profile information
- Role and status management
- Active sessions list
- Login history
- Security events
- Account actions (reset password, suspend, delete)

**4. Audit Logs** (`/admin/audit-logs`)
- Paginated audit log table
- Filter by: admin, action, date range, target
- Export to CSV button
- Log detail view (modal or sidebar)

**Technical Tasks**:
- Create admin layout component
- Implement admin navigation
- Create dashboard with charts (Chart.js or Recharts)
- Build user management table with CRUD
- Implement audit log viewer
- Add role-based UI rendering
- Create comprehensive tests (React Testing Library)

**Files to Create**:
- `frontend/src/pages/admin/AdminDashboard.js`
- `frontend/src/pages/admin/UsersManagement.js`
- `frontend/src/pages/admin/UserDetails.js`
- `frontend/src/pages/admin/AuditLogs.js`
- `frontend/src/components/admin/AdminLayout.js`
- `frontend/src/components/admin/UserTable.js`
- `frontend/src/components/admin/StatsCard.js`
- `frontend/src/components/admin/UserGrowthChart.js`
- `frontend/src/services/api.js` - Add admin API methods

---

### Story 10.6: Admin Panel Integration Tests

**Priority**: HIGH
**Estimated Time**: 4-5 hours
**Dependencies**: Story 10.5

**User Story**:
> As a **developer**, I want **comprehensive tests for admin features**, so that **admin functionality is reliable**.

**Description**:
Create integration tests for all admin panel features, including API endpoints and UI components.

**Acceptance Criteria**:
- [ ] API endpoint tests (50+ test cases)
- [ ] Authorization tests (admin vs non-admin)
- [ ] User management workflow tests
- [ ] Audit logging verification tests
- [ ] Dashboard metrics accuracy tests
- [ ] Frontend component tests
- [ ] End-to-end workflow tests (optional)
- [ ] All tests passing (100% success rate)

**Test Coverage**:

**Backend Tests**:
- Admin authorization (admin, non-admin, super_admin)
- User CRUD operations
- Search and filtering
- Role changes
- Status changes
- Audit log creation
- Audit log queries
- Dashboard statistics
- Error handling

**Frontend Tests**:
- Admin dashboard rendering
- User table operations
- User detail view
- Audit log display
- Role-based UI visibility
- Error states
- Loading states

**Technical Tasks**:
- Write backend integration tests
- Write frontend component tests
- Create test fixtures and factories
- Implement test data seeding
- Create comprehensive test report

**Files to Create**:
- `test-phase-10-admin-panel.js` - Comprehensive backend tests
- `frontend/src/pages/admin/__tests__/AdminDashboard.test.js`
- `frontend/src/pages/admin/__tests__/UsersManagement.test.js`
- `frontend/src/pages/admin/__tests__/UserDetails.test.js`
- `frontend/src/pages/admin/__tests__/AuditLogs.test.js`
- `backend/src/db/seeds/test/admin_test_data.js` - Test data

---

## Implementation Order

1. **Story 10.1**: Admin Role & Permissions Setup (Foundation)
2. **Story 10.2**: User Management API (Core functionality)
3. **Story 10.3**: Activity & Audit Logs (Compliance)
4. **Story 10.4**: Admin Dashboard API (Metrics)
5. **Story 10.5**: Admin Panel UI (User interface)
6. **Story 10.6**: Integration Tests (Quality assurance)

---

## Technical Considerations

### Security
- All admin routes require admin role
- Sensitive operations require additional confirmation
- Audit all admin actions
- Rate limit admin API endpoints
- Implement CSRF protection for admin forms

### Performance
- Implement pagination for large datasets
- Cache dashboard metrics (5-minute TTL)
- Use database indexes for search queries
- Lazy load admin UI components

### Database
- Add `status` column to users table (active, inactive, suspended)
- Create `audit_logs` table with proper indexes
- Consider partitioning audit_logs by date

### UI/UX
- Use existing Bootstrap styling for consistency
- Implement loading states for async operations
- Add confirmation dialogs for destructive actions
- Provide clear error messages
- Mobile-responsive design

---

## Dependencies

**NPM Packages**:
- Backend: None (use existing packages)
- Frontend: `recharts` or `chart.js` (for dashboard charts)

**External Services**:
- None

---

## Testing Strategy

### Unit Tests
- Admin middleware authorization
- User CRUD operations
- Audit log creation
- Dashboard metrics calculation

### Integration Tests
- Complete admin workflows
- Multi-user scenarios
- Permission boundaries
- Audit log accuracy

### Manual Testing
- Admin UI walkthrough
- Role switching scenarios
- Mobile responsiveness
- Error handling

---

## Success Criteria

- [ ] All 6 stories completed
- [ ] 50+ integration tests passing
- [ ] Admin panel accessible only to admins
- [ ] All admin actions audited
- [ ] Dashboard displays accurate metrics
- [ ] UI is responsive and user-friendly
- [ ] Zero security vulnerabilities
- [ ] Documentation updated

---

## Rollback Plan

If issues are discovered:
1. Revert feature branch to staging
2. Fix issues in new feature branch
3. Re-test thoroughly
4. Re-deploy to beta for verification

---

## Notes

- Admin panel is critical infrastructure - prioritize security and reliability
- Consider adding bulk operations in future iterations
- Export functionality can be added as enhancement
- Consider adding admin notifications/alerts system
- Super admin role may be needed for multi-tenant scenarios

---

*This plan will be updated as Phase 10 progresses.*
