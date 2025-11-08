# Test Script: Story 6.5 - OAuth Login Frontend UI

## Test Overview

This story adds OAuth login buttons to the frontend and provides UI for managing linked providers.

## Automated Tests

Since this is primarily UI, most testing will be manual. However, here are the key changes to verify:

### TC-6.5-01: OAuth Buttons Added to Login Page ✅
**Files Modified:**
- `frontend/src/pages/LoginPage.js`

**Changes:**
- Added Google OAuth button with proper styling and icon
- Added GitHub OAuth button with proper styling and icon
- Added "Or continue with" divider text
- Buttons redirect to `/api/oauth/google` and `/api/oauth/github`

**Verification:**
- Run `cd frontend && npm start`
- Navigate to `/login`
- Verify two OAuth buttons appear below the regular login form
- Verify buttons have proper icons (Google colorful icon, GitHub monochrome)

### TC-6.5-02: LinkedProviders Component Created ✅
**Files Created:**
- `frontend/src/components/LinkedProviders.js`

**Features:**
- Fetches linked providers from `/api/auth/linked-providers`
- Displays list of linked OAuth accounts with provider icons
- Shows provider email and link date
- Provides "Unlink" button for each provider
- Confirmation dialog before unlinking
- Loading and error states

**Verification:**
- Component code exists and follows React best practices
- Uses apiService for API calls
- Proper error handling

### TC-6.5-03: OAuth API Methods Added ✅
**Files Modified:**
- `frontend/src/services/api.js`

**Changes:**
- Added `oauth.getLinkedProviders()` method
- Added `oauth.unlinkProvider(provider)` method

**Verification:**
- Methods exist in apiService.oauth object
- Methods use correct endpoints

### TC-6.5-04: Dashboard Shows Linked Providers ✅
**Files Modified:**
- `frontend/src/pages/DashboardPage.js`

**Changes:**
- Imported LinkedProviders component
- Added LinkedProviders component below stats section

**Verification:**
- Dashboard imports LinkedProviders
- Component is rendered in dashboard

## Manual Testing Instructions

### Test Case 1: OAuth Button Functionality

**Steps:**
1. Start frontend: `cd frontend && npm start`
2. Navigate to `http://localhost:3000/login`
3. Click "Google" button
4. Verify redirect to `http://localhost:5000/api/oauth/google`
5. Verify redirect to Google authentication page

**Expected:**
- Google OAuth flow initiates
- User is redirected to Google login

**Steps:**
1. Navigate back to login page
2. Click "GitHub" button
3. Verify redirect to `http://localhost:5000/api/oauth/github`
4. Verify redirect to GitHub authorization page

**Expected:**
- GitHub OAuth flow initiates
- User is redirected to GitHub authorization

### Test Case 2: OAuth Login Flow (Google)

**Steps:**
1. Click "Google" button on login page
2. Complete Google authentication
3. Grant permissions to application
4. Verify redirect back to application
5. Verify user is logged in
6. Check that JWT token is stored

**Expected:**
- User successfully logs in via Google
- User is redirected to dashboard/home
- authToken stored in localStorage
- User session is active

### Test Case 3: OAuth Login Flow (GitHub)

**Steps:**
1. Log out if logged in
2. Click "GitHub" button on login page
3. Complete GitHub authentication
4. Authorize the application
5. Verify redirect back to application
6. Verify user is logged in

**Expected:**
- User successfully logs in via GitHub
- User is redirected to dashboard/home
- authToken stored in localStorage
- User session is active

### Test Case 4: View Linked Providers

**Steps:**
1. Log in via Google OAuth
2. Navigate to Dashboard
3. Scroll to "Linked Accounts" section
4. Verify Google appears in linked providers list

**Expected:**
- LinkedProviders component displays
- Google account shown with:
  - Google icon
  - Provider name "Google"
  - Email address from Google account
  - Link date
  - "Unlink" button

### Test Case 5: Link Multiple Providers

**Steps:**
1. Ensure logged in via Google (from Test Case 4)
2. Log out
3. Log in via GitHub using SAME email address
4. Navigate to Dashboard
5. Check "Linked Accounts" section

**Expected:**
- User logs into same account (not new account)
- Both Google and GitHub appear in linked providers
- Same user session maintained

### Test Case 6: Unlink Provider

**Steps:**
1. Navigate to Dashboard
2. In "Linked Accounts" section, click "Unlink" for Google
3. Confirm in dialog
4. Wait for operation to complete

**Expected:**
- Confirmation dialog appears
- After confirming, Google is removed from list
- Success message shown
- Only GitHub remains linked

### Test Case 7: Re-link Provider

**Steps:**
1. After unlinking Google (Test Case 6)
2. Log out
3. Log in via Google again
4. Navigate to Dashboard
5. Check "Linked Accounts"

**Expected:**
- Google account is re-linked
- Both Google and GitHub appear again
- New link date shown for Google

### Test Case 8: New User via OAuth

**Steps:**
1. Log out
2. Click Google button with email NOT in system
3. Complete Google authentication
4. Verify redirect and login
5. Navigate to Dashboard
6. Check "Linked Accounts"

**Expected:**
- New user account created automatically
- User logged in successfully
- Google appears in linked providers
- Email is auto-verified (email_verified: true in database)

### Test Case 9: UI Responsiveness

**Steps:**
1. View login page on mobile viewport (375px)
2. Verify OAuth buttons stack/resize properly
3. View dashboard on mobile
4. Verify LinkedProviders component is responsive

**Expected:**
- OAuth buttons remain accessible on mobile
- Icons and text visible
- LinkedProviders cards stack vertically on mobile
- No horizontal scroll

### Test Case 10: Error Handling

**Steps:**
1. Stop backend server
2. Navigate to Dashboard
3. Check "Linked Accounts" section

**Expected:**
- Loading state appears initially
- Error message shown: "Failed to load linked providers"
- "Retry" button available

**Steps:**
1. Restart backend
2. Click "Retry" button

**Expected:**
- Linked providers load successfully
- No error shown

## Implementation Status

✅ **UI Components:**
- OAuth login buttons on LoginPage
- LinkedProviders component
- Integration with DashboardPage

✅ **API Integration:**
- OAuth API methods added to apiService
- Proper error handling
- Token management

✅ **Styling:**
- Google button with official colors
- GitHub button with monochrome icon
- Proper spacing and layout
- Responsive design

✅ **UX Enhancements:**
- Confirmation dialogs for unlinking
- Loading states
- Error states with retry
- Provider icons for visual identification

## Benefits

- **Single Sign-On:** Users can log in with Google/GitHub
- **Account Management:** Users can view and manage linked providers
- **Better UX:** Visual OAuth buttons are more appealing than text links
- **Multi-Provider Support:** Users can link multiple OAuth accounts

## Next Steps

Story 6.6 will implement OAuth callback handling to properly save tokens and redirect users after OAuth authentication.
