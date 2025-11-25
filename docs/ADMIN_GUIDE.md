# Admin Guide

## Authentication System - Administrator Documentation

This guide covers all administrative features available to users with admin or super_admin roles.

---

## Table of Contents

1. [Admin Roles & Permissions](#admin-roles--permissions)
2. [Accessing the Admin Panel](#accessing-the-admin-panel)
3. [Dashboard Overview](#dashboard-overview)
4. [User Management](#user-management)
5. [Audit Logs](#audit-logs)
6. [Security Monitoring](#security-monitoring)
7. [System Statistics](#system-statistics)
8. [Best Practices](#best-practices)

---

## Admin Roles & Permissions

### Role Hierarchy

| Role | Level | Description |
|------|-------|-------------|
| `user` | 1 | Standard user - no admin access |
| `admin` | 2 | Administrator - user management, audit logs |
| `super_admin` | 3 | Super Admin - all admin rights + role assignment |

### Permission Matrix

| Action | user | admin | super_admin |
|--------|------|-------|-------------|
| View own profile | ✅ | ✅ | ✅ |
| Edit own profile | ✅ | ✅ | ✅ |
| Access admin panel | ❌ | ✅ | ✅ |
| View all users | ❌ | ✅ | ✅ |
| Edit user profiles | ❌ | ✅ | ✅ |
| Deactivate users | ❌ | ✅ | ✅ |
| View audit logs | ❌ | ✅ | ✅ |
| Change user roles | ❌ | ❌ | ✅ |
| Manage admins | ❌ | ❌ | ✅ |

---

## Accessing the Admin Panel

### Navigation

1. Log in with an admin or super_admin account
2. Click **"Admin"** in the top navigation bar
3. Or navigate directly to `/admin`

### Admin Panel URL

- **Production**: https://auth-frontend.onrender.com/admin
- **Beta**: https://auth-frontend-beta.onrender.com/admin

### First-Time Access

If you've just been granted admin access:
1. Log out and log back in to refresh your session
2. The "Admin" link will appear in the navigation
3. Access may take up to 1 minute to propagate

---

## Dashboard Overview

### Dashboard Metrics

The admin dashboard displays real-time statistics:

**User Statistics**
- Total registered users
- Active users (logged in within 30 days)
- New users this month
- Users by role breakdown

**Security Metrics**
- 2FA adoption rate
- Failed login attempts (24h)
- Locked accounts
- Suspicious activity alerts

**System Health**
- Active sessions count
- API response times
- Database status
- Cache hit rate

### Dashboard Refresh

- Statistics refresh every 5 minutes
- Click **"Refresh"** for immediate update
- Data is cached for performance

---

## User Management

### User List

Navigate to **Admin** → **Users** to see all registered users.

**List Features**:
- Search by username, email, or name
- Filter by role (user, admin, super_admin)
- Filter by status (active, inactive, locked)
- Sort by registration date, last login, name
- Pagination (25 users per page)

### User Details

Click on a user to view:
- Profile information
- Account status
- Role assignment
- Login history
- Security settings (2FA status)
- Activity log

### Editing Users

1. Click on a user in the list
2. Click **"Edit"**
3. Modify allowed fields:
   - Display name
   - Email (requires re-verification)
   - Status (active/inactive)
4. Click **"Save Changes"**

**Note**: You cannot edit users with higher roles than yourself.

### User Status Management

**Deactivating a User**:
1. Find the user in the list
2. Click **"Deactivate"** or the status toggle
3. Confirm the action
4. User can no longer log in
5. All active sessions are revoked

**Reactivating a User**:
1. Filter by "Inactive" status
2. Find the deactivated user
3. Click **"Activate"**
4. User can log in again

**Soft Delete Policy**:
- Users are never permanently deleted
- "Delete" actually deactivates the account
- Data is retained for audit purposes
- This is an industry best practice

### Role Management (Super Admin Only)

Super admins can change user roles:

1. Click on a user
2. Click **"Change Role"**
3. Select the new role
4. Provide a reason (required for audit)
5. Click **"Update Role"**

**Role Change Rules**:
- Cannot change your own role
- Cannot promote above your own level
- Cannot demote another super_admin
- All role changes are logged

### Bulk Actions

Select multiple users for bulk operations:
- Deactivate selected users
- Export user data (CSV)
- Send notification email

---

## Audit Logs

### Accessing Audit Logs

Navigate to **Admin** → **Audit Logs**

### Log Types

| Type | Description | Retention |
|------|-------------|-----------|
| Authentication | Login, logout, failed attempts | 90 days |
| User Management | Role changes, deactivations | 1 year |
| Security | 2FA changes, password resets | 1 year |
| Admin Actions | All admin panel activities | 2 years |

### Log Entry Details

Each log entry contains:
- **Timestamp**: When the action occurred
- **Actor**: Who performed the action
- **Action**: What was done
- **Target**: Who/what was affected
- **IP Address**: Source IP
- **User Agent**: Browser/device info
- **Details**: Additional context (JSON)

### Filtering Logs

Filter audit logs by:
- Date range
- Action type
- Actor (admin who performed action)
- Target user
- IP address

### Exporting Logs

1. Apply desired filters
2. Click **"Export"**
3. Choose format (CSV, JSON)
4. Download file

**Note**: Exports are logged for compliance.

### Log Retention

- Logs are automatically archived after retention period
- Archived logs can be requested from system administrators
- Critical security logs may be retained longer

---

## Security Monitoring

### Security Dashboard

Navigate to **Admin** → **Security**

### Failed Login Monitor

View recent failed login attempts:
- Username/email tried
- IP address
- Timestamp
- Failure reason

**Alert Thresholds**:
- 5 failures in 15 minutes: Warning
- 10 failures in 15 minutes: Account locked
- 50 failures from same IP: IP flagged

### Account Lockouts

View and manage locked accounts:
1. Go to **Security** → **Locked Accounts**
2. See lock reason and duration
3. Option to unlock early (with reason)

**Auto-Unlock**:
- Accounts unlock after 15 minutes
- Or manually unlock from admin panel

### Suspicious Activity

Flagged activities include:
- Login from new country
- Multiple failed 2FA attempts
- Password reset from unusual IP
- Rapid profile changes

**Reviewing Alerts**:
1. Click on the alert
2. Review activity details
3. Mark as "Investigated" or "False Positive"
4. Take action if needed (deactivate user, etc.)

### IP Blocklist

View and manage blocked IPs:
- Auto-blocked IPs (from rate limiting)
- Manually blocked IPs
- Whitelist trusted IPs

---

## System Statistics

### User Growth

View user registration trends:
- Daily/weekly/monthly new users
- User retention rates
- Churn analysis

### Authentication Stats

- Login success rate
- Average session duration
- Peak usage times
- OAuth vs password login ratio

### 2FA Adoption

- Percentage of users with 2FA
- 2FA method breakdown
- Backup code usage

### Performance Metrics

- API response times (p50, p95, p99)
- Database query performance
- Cache efficiency

---

## Best Practices

### User Management

1. **Principle of Least Privilege**
   - Only grant admin access when necessary
   - Prefer admin over super_admin when possible
   - Review admin list regularly

2. **Documentation**
   - Always provide reasons for role changes
   - Document unusual deactivations
   - Keep notes on security investigations

3. **Regular Reviews**
   - Audit admin actions monthly
   - Review inactive accounts quarterly
   - Check for orphaned sessions

### Security

1. **Admin Account Security**
   - Always enable 2FA on admin accounts
   - Use strong, unique passwords
   - Never share admin credentials

2. **Monitoring**
   - Review audit logs weekly
   - Investigate all security alerts
   - Report suspicious patterns

3. **Incident Response**
   - Know the escalation path
   - Document all incidents
   - Follow up on resolutions

### Compliance

1. **Data Privacy**
   - Only access user data when necessary
   - Don't export data without authorization
   - Follow data retention policies

2. **Audit Trail**
   - All admin actions are logged
   - Logs cannot be modified or deleted
   - Exports require justification

---

## Troubleshooting

### "Access Denied" to Admin Panel

- Verify you have admin or super_admin role
- Clear browser cache and log in again
- Contact a super_admin to verify your role

### Cannot Change User Role

- Only super_admins can change roles
- Cannot modify users with equal/higher roles
- Check if user is the last super_admin

### Audit Logs Not Loading

- Clear browser cache
- Check date filter range
- Try a smaller date range
- Contact system administrator

### User Shows as "Active" After Deactivation

- Cache may take up to 5 minutes to update
- Click "Refresh" on the dashboard
- Check if user was reactivated by another admin

---

## API Reference

Admins can also use the API directly. See [API Documentation](/api/docs) for endpoints:

- `GET /api/admin/users` - List all users
- `GET /api/admin/users/:id` - Get user details
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Deactivate user
- `PUT /api/admin/users/:id/role` - Change role (super_admin)
- `GET /api/admin/audit-logs` - Get audit logs
- `GET /api/admin/dashboard/stats` - Get dashboard statistics

All API calls require admin Bearer token authentication.

---

## Support

For admin-specific issues:
- **Internal**: Contact your super_admin
- **Technical**: Submit a support ticket
- **Security Incidents**: Use emergency contact

---

*Last Updated: November 25, 2025*
*Version: 1.0*
