# Edit User Feature - Implementation Plan

**Status**: ✅ COMPLETE - Deployed to Beta
**Created**: November 26, 2025
**Completed**: November 26, 2025
**Branch**: `beta` (merged from staging)
**Commit**: `d2b180b feat(admin): add edit user functionality to admin panel`
**Story**: Enhancement to Story 10.5 - Admin Panel UI
**Priority**: HIGH

---

## Overview

Add the ability for admins to edit user details from the Users Management page. This includes editing username, email, name, role, and optionally resetting the user's password.

---

## Current Progress

### Backend - ✅ COMPLETE

File: `backend/src/controllers/adminController.js`

**Changes Made**:
- [x] Password update handling - hashes password if provided in updates
- [x] Email verification reset - sets `email_verified = false` when email changes
- [x] Enhanced response messages - includes notification about email verification reset
- [x] Committed and deployed to beta

**Code Added** (lines ~222-248 in updateUser function):
```javascript
// Handle password update separately (needs hashing)
if (updates.password && updates.password.trim() !== '') {
  const passwordHash = await bcrypt.hash(updates.password, 10);
  filteredUpdates.password_hash = passwordHash;
}

// If email is being changed, reset email_verified to false
if (updates.email && updates.email !== existingUser.email) {
  filteredUpdates.email_verified = false;
}

// Build response message
let message = 'User updated successfully';
if (updates.email && updates.email !== existingUser.email) {
  message += '. Email verification has been reset.';
}
```

### Frontend - ✅ COMPLETE

- [x] Edit User Modal component (~250 lines, inline in UsersManagement.jsx)
- [x] Edit button in Users Management table (pencil icon with light gray bg, dark border)
- [x] Integration with existing page (state, handlers, modal rendering)
- [x] Committed and deployed to beta

---

## Implementation Plan

### Phase 1: Frontend - Edit User Modal Component

**File**: `frontend/src/pages/admin/EditUserModal.jsx`

**Component Structure**:
```jsx
EditUserModal({
  show,           // boolean - modal visibility
  user,           // object - user data to edit
  onClose,        // function - close modal
  onSuccess,      // function - called after successful update
  currentUserRole // string - role of logged-in admin (for permission checks)
})
```

**Form Fields**:
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| username | text | Yes | Unique validation |
| email | email | Yes | Unique validation, triggers email_verified reset |
| first_name | text | No | |
| last_name | text | No | |
| role | select | Yes | Options: user, admin, super_admin (restricted) |
| password | password | No | "Leave blank to keep current password" |
| confirm_password | password | No | Must match password if provided |

**Validation Rules**:
- Username: Required, 3-50 characters
- Email: Required, valid email format
- Password: Optional, but if provided must be 8+ chars with complexity
- Role: Only super_admin can assign super_admin role

**UI Features**:
- Bootstrap modal styling (consistent with CreateUserModal)
- Loading state during submission
- Error display for validation/API errors
- Success message before closing

### Phase 2: Frontend - Users Management Integration

**File**: `frontend/src/pages/admin/UsersManagement.jsx`

**Changes Required**:

1. **State additions**:
```javascript
const [showEditModal, setShowEditModal] = useState(false);
const [selectedUser, setSelectedUser] = useState(null);
```

2. **Handler functions**:
```javascript
const handleEditClick = (user) => {
  setSelectedUser(user);
  setShowEditModal(true);
};

const handleEditSuccess = () => {
  setShowEditModal(false);
  setSelectedUser(null);
  fetchUsers(); // Refresh the list
};
```

3. **Edit button in table** (Actions column):
- Add pencil/edit icon button next to existing actions
- `onClick={() => handleEditClick(user)}`

4. **Modal component**:
```jsx
<EditUserModal
  show={showEditModal}
  user={selectedUser}
  onClose={() => { setShowEditModal(false); setSelectedUser(null); }}
  onSuccess={handleEditSuccess}
  currentUserRole={currentUser?.role}
/>
```

### Phase 3: API Service Update

**File**: `frontend/src/services/adminApi.js`

**Verify/Add Method**:
```javascript
updateUser: async (userId, userData) => {
  return api.put(`/admin/users/${userId}`, userData);
},
```

---

## Test Plan

### Manual Testing Checklist

**Basic Edit Operations**:
- [ ] Open edit modal for a user
- [ ] Modal pre-fills with current user data
- [ ] Edit username only - saves successfully
- [ ] Edit email - saves and shows "email verification reset" message
- [ ] Edit first_name/last_name - saves successfully
- [ ] Cancel button closes modal without saving

**Password Update**:
- [ ] Leave password blank - password unchanged
- [ ] Enter new password - password updated
- [ ] Password mismatch shows validation error
- [ ] Weak password shows validation error

**Role Changes**:
- [ ] Admin can change user role to 'user' or 'admin'
- [ ] Only super_admin can assign 'super_admin' role
- [ ] Cannot change own role (button disabled or hidden)

**Error Handling**:
- [ ] Duplicate username shows error
- [ ] Duplicate email shows error
- [ ] Network error shows appropriate message
- [ ] Validation errors display clearly

**Edge Cases**:
- [ ] Edit user that was just created
- [ ] Edit user with MFA enabled
- [ ] Edit inactive user
- [ ] Rapid edits don't cause issues

---

## Files to Modify/Create

| File | Action | Description |
|------|--------|-------------|
| `backend/src/controllers/adminController.js` | COMMIT | Already modified - password hashing, email verification |
| `frontend/src/pages/admin/EditUserModal.jsx` | CREATE | New modal component |
| `frontend/src/pages/admin/UsersManagement.jsx` | MODIFY | Add edit button and modal integration |
| `frontend/src/services/adminApi.js` | VERIFY | Ensure updateUser method exists |

---

## Commit Plan

**Commit 1**: Backend - User edit enhancements
```
feat(admin): enhance user update with password hashing and email verification reset

- Add password update handling with bcrypt hashing
- Reset email_verified when email changes
- Include notification in response message
```

**Commit 2**: Frontend - Edit User Modal
```
feat(admin): add edit user modal to admin panel

- Create EditUserModal component with form validation
- Add edit button to Users Management table
- Support optional password reset
- Restrict role assignment based on admin permissions
```

---

## Rollback Procedure

If issues arise:
1. `git revert` the commit(s)
2. Redeploy from staging branch
3. Document issues in TROUBLESHOOTING.md

---

## Dependencies

- Story 10.2: User Management API (COMPLETE)
- Story 10.5: Admin Panel UI (COMPLETE - this extends it)
- Bootstrap 5 (already installed)
- adminApi service (already exists)

---

## Estimated Time

- Backend commit: 5 minutes (already done, just needs commit)
- Frontend modal: 45-60 minutes
- Integration & testing: 30 minutes
- **Total**: ~1.5 hours

---

*Last Updated: November 26, 2025*
