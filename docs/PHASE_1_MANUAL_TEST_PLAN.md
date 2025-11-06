# Phase 1 Manual Test Plan - UI Testing

**Project**: Authentication System
**Phase**: Phase 1 - Project Foundation
**Test Type**: Manual UI Testing
**Tester**: _______________
**Date**: _______________
**Environment**: Development (Docker)

---

## Prerequisites

Before starting, ensure:

- [ ] All Docker containers are running
  ```bash
  docker-compose ps
  # Should show 4 containers: postgres, redis, backend, frontend
  ```

- [ ] Backend is accessible at http://localhost:5000
- [ ] Frontend is accessible at http://localhost:3000
- [ ] You have a modern browser (Chrome, Firefox, Edge, or Safari)
- [ ] Browser DevTools are available (F12)

---

## Test Suite 1: Frontend Application UI

### Test 1.1: Homepage Load
**Objective**: Verify the frontend homepage loads correctly

**Steps**:
1. Open browser
2. Navigate to http://localhost:3000
3. Observe the page load

**Expected Results**:
- [ ] Page loads within 2 seconds
- [ ] Page title shows "Authentication System"
- [ ] Navigation bar visible at top
- [ ] Navigation has logo "🔐 Auth System"
- [ ] Navigation has links: Home, Login, Register, Dashboard
- [ ] Footer visible at bottom
- [ ] Footer shows "© 2025 Authentication System. All rights reserved."
- [ ] No console errors (check DevTools → Console)
- [ ] No 404 errors (check DevTools → Network)

**Status**: ⬜ Pass | ⬜ Fail
**Notes**: _______________________________________________

---

### Test 1.2: Navigation Menu
**Objective**: Verify all navigation links work

**Steps**:
1. On homepage (http://localhost:3000)
2. Click "Login" in navigation
3. Observe URL change
4. Click "Register" in navigation
5. Observe URL change
6. Click "Dashboard" in navigation
7. Observe URL change
8. Click "Home" or logo to return to homepage

**Expected Results**:
- [ ] Clicking "Login" navigates to /login
- [ ] Clicking "Register" navigates to /register
- [ ] Clicking "Dashboard" navigates to /dashboard
- [ ] Clicking "Home" or logo returns to /
- [ ] URL changes without full page reload (React SPA behavior)
- [ ] No console errors during navigation
- [ ] No broken pages or white screens

**Status**: ⬜ Pass | ⬜ Fail
**Notes**: _______________________________________________

---

### Test 1.3: Homepage Content
**Objective**: Verify homepage displays correct content

**Steps**:
1. Navigate to http://localhost:3000
2. Read page content

**Expected Results**:
- [ ] Page shows "Home Page" or welcome message
- [ ] Content is centered and readable
- [ ] Text is not overlapping
- [ ] Styling is applied (not plain HTML)
- [ ] No broken images
- [ ] No placeholder text like "Lorem ipsum"

**Status**: ⬜ Pass | ⬜ Fail
**Notes**: _______________________________________________

---

### Test 1.4: Login Page UI
**Objective**: Verify login page exists and looks correct

**Steps**:
1. Navigate to http://localhost:3000/login
2. Inspect the page

**Expected Results**:
- [ ] Page shows "Login Page" or login form
- [ ] Page has basic structure (heading, form, or placeholder)
- [ ] No console errors
- [ ] Page is styled consistently with homepage
- [ ] Navigation bar still visible

**Status**: ⬜ Pass | ⬜ Fail
**Notes**: _______________________________________________

---

### Test 1.5: Register Page UI
**Objective**: Verify register page exists and looks correct

**Steps**:
1. Navigate to http://localhost:3000/register
2. Inspect the page

**Expected Results**:
- [ ] Page shows "Register Page" or registration form
- [ ] Page has basic structure (heading, form, or placeholder)
- [ ] No console errors
- [ ] Page is styled consistently with homepage
- [ ] Navigation bar still visible

**Status**: ⬜ Pass | ⬜ Fail
**Notes**: _______________________________________________

---

### Test 1.6: Dashboard Page UI
**Objective**: Verify dashboard page exists and looks correct

**Steps**:
1. Navigate to http://localhost:3000/dashboard
2. Inspect the page

**Expected Results**:
- [ ] Page shows "Dashboard Page" or dashboard content
- [ ] Page has basic structure
- [ ] No console errors
- [ ] Page is styled consistently with homepage
- [ ] Navigation bar still visible

**Status**: ⬜ Pass | ⬜ Fail
**Notes**: _______________________________________________

---

### Test 1.7: 404 Not Found Page
**Objective**: Verify non-existent routes are handled

**Steps**:
1. Navigate to http://localhost:3000/nonexistent-page
2. Observe what happens

**Expected Results**:
- [ ] Page shows some content (even if it's just navigation)
- [ ] OR shows "404 Not Found" or similar message
- [ ] No white screen or crash
- [ ] Navigation bar still visible and functional
- [ ] Can navigate back to home using navigation

**Status**: ⬜ Pass | ⬜ Fail
**Notes**: _______________________________________________

---

### Test 1.8: Responsive Design - Desktop
**Objective**: Verify UI looks good on desktop screen sizes

**Steps**:
1. Set browser to full screen on desktop monitor
2. Navigate through all pages (Home, Login, Register, Dashboard)
3. Observe layout

**Expected Results**:
- [ ] All pages are readable at full screen
- [ ] Content is not stretched too wide
- [ ] Navigation is horizontal and accessible
- [ ] Text size is comfortable to read
- [ ] No horizontal scrolling required
- [ ] Footer is at bottom of page

**Status**: ⬜ Pass | ⬜ Fail
**Notes**: _______________________________________________

---

### Test 1.9: Responsive Design - Mobile
**Objective**: Verify UI adapts to mobile screen sizes

**Steps**:
1. Open DevTools (F12)
2. Click "Toggle Device Toolbar" (Ctrl+Shift+M)
3. Select "iPhone 12 Pro" or similar mobile device
4. Navigate through all pages

**Expected Results**:
- [ ] All pages fit on mobile screen
- [ ] No horizontal scrolling
- [ ] Text is readable (not too small)
- [ ] Navigation is accessible (hamburger menu or mobile-friendly)
- [ ] Footer is visible
- [ ] All interactive elements are tappable

**Status**: ⬜ Pass | ⬜ Fail
**Notes**: _______________________________________________

---

### Test 1.10: Browser DevTools - Console
**Objective**: Verify no JavaScript errors in console

**Steps**:
1. Open DevTools → Console tab
2. Clear console
3. Navigate to homepage
4. Navigate to each page (Login, Register, Dashboard)
5. Observe console for errors

**Expected Results**:
- [ ] No red error messages
- [ ] No warnings about missing dependencies
- [ ] No 404 errors for JavaScript files
- [ ] No CORS errors
- [ ] Only informational logs (if any)

**Status**: ⬜ Pass | ⬜ Fail
**Notes**: _______________________________________________

---

### Test 1.11: Browser DevTools - Network
**Objective**: Verify all resources load successfully

**Steps**:
1. Open DevTools → Network tab
2. Clear network log
3. Refresh homepage (Ctrl+F5)
4. Observe network requests

**Expected Results**:
- [ ] All requests show status 200 (OK) or 304 (Not Modified)
- [ ] No 404 (Not Found) errors
- [ ] No 500 (Server Error) errors
- [ ] HTML file loads
- [ ] JavaScript bundle loads
- [ ] CSS loads (if separate file)
- [ ] Total load time < 2 seconds

**Status**: ⬜ Pass | ⬜ Fail
**Notes**: _______________________________________________

---

### Test 1.12: Page Refresh Behavior
**Objective**: Verify app handles page refresh correctly

**Steps**:
1. Navigate to http://localhost:3000/dashboard
2. Press F5 to refresh page
3. Observe behavior

**Expected Results**:
- [ ] Page refreshes without error
- [ ] URL remains /dashboard
- [ ] Dashboard content reloads
- [ ] No redirect to homepage
- [ ] No 404 error
- [ ] Navigation still works

**Status**: ⬜ Pass | ⬜ Fail
**Notes**: _______________________________________________

---

## Test Suite 2: Backend API Testing (via Browser)

### Test 2.1: Backend Root Endpoint
**Objective**: Verify backend API is accessible

**Steps**:
1. Open new browser tab
2. Navigate to http://localhost:5000
3. Observe response

**Expected Results**:
- [ ] Page displays JSON response
- [ ] Response contains "Authentication System API"
- [ ] Response is formatted JSON (not plain text)
- [ ] Status code is 200 OK (check DevTools → Network)

**Status**: ⬜ Pass | ⬜ Fail
**Notes**: _______________________________________________

---

### Test 2.2: Backend Health Endpoint
**Objective**: Verify health check endpoint works

**Steps**:
1. Navigate to http://localhost:5000/health
2. Observe JSON response

**Expected Results**:
- [ ] Response is JSON object
- [ ] Contains `"success": true`
- [ ] Contains `"message": "Server is running"`
- [ ] Contains `"timestamp"` with current date/time
- [ ] Contains `"uptime"` with seconds (number)
- [ ] Contains `"environment": "development"`
- [ ] Contains `"database": "connected"`
- [ ] Status code is 200 OK

**Status**: ⬜ Pass | ⬜ Fail
**Notes**: _______________________________________________

---

### Test 2.3: Backend 404 Handler
**Objective**: Verify non-existent API routes return proper error

**Steps**:
1. Navigate to http://localhost:5000/api/nonexistent
2. Observe response

**Expected Results**:
- [ ] Response is JSON object
- [ ] Contains error message about "Route not found"
- [ ] Status code is 404 (check DevTools → Network)
- [ ] Response has proper structure (not HTML error page)

**Status**: ⬜ Pass | ⬜ Fail
**Notes**: _______________________________________________

---

### Test 2.4: Backend CORS Headers
**Objective**: Verify CORS is configured for frontend access

**Steps**:
1. Navigate to http://localhost:3000 (frontend)
2. Open DevTools → Console
3. Type and enter:
   ```javascript
   fetch('http://localhost:5000/health')
     .then(r => r.json())
     .then(data => console.log('Success:', data))
     .catch(err => console.error('Error:', err))
   ```
4. Observe console output

**Expected Results**:
- [ ] No CORS error in console
- [ ] Request succeeds
- [ ] Console shows "Success:" with health data
- [ ] Response contains database status

**Status**: ⬜ Pass | ⬜ Fail
**Notes**: _______________________________________________

---

## Test Suite 3: Database Connectivity

### Test 3.1: Database Connection via Health Endpoint
**Objective**: Verify database is connected and accessible

**Steps**:
1. Navigate to http://localhost:5000/health
2. Find the "database" field in JSON response

**Expected Results**:
- [ ] Response contains `"database": "connected"`
- [ ] NOT `"database": "disconnected"`
- [ ] Health endpoint responds without delay

**Status**: ⬜ Pass | ⬜ Fail
**Notes**: _______________________________________________

---

### Test 3.2: Database Tables Existence
**Objective**: Verify migrations created database tables

**Steps**:
1. Open terminal
2. Run:
   ```bash
   docker exec auth-postgres psql -U postgres -d authdb -c "\dt"
   ```
3. Observe output

**Expected Results**:
- [ ] Command executes without error
- [ ] Output shows table: `users`
- [ ] Output shows table: `sessions`
- [ ] Output shows table: `knex_migrations`
- [ ] Output shows table: `knex_migrations_lock`

**Status**: ⬜ Pass | ⬜ Fail
**Notes**: _______________________________________________

---

### Test 3.3: Users Table Schema
**Objective**: Verify users table has correct columns

**Steps**:
1. Run:
   ```bash
   docker exec auth-postgres psql -U postgres -d authdb -c "\d users"
   ```
2. Observe columns

**Expected Results**:
- [ ] Table has column: `id`
- [ ] Table has column: `username`
- [ ] Table has column: `email`
- [ ] Table has column: `password_hash`
- [ ] Table has column: `email_verified`
- [ ] Table has column: `mfa_enabled`
- [ ] Table has column: `role`
- [ ] Table has column: `created_at`
- [ ] Table has column: `updated_at`

**Status**: ⬜ Pass | ⬜ Fail
**Notes**: _______________________________________________

---

### Test 3.4: Sessions Table Schema
**Objective**: Verify sessions table has correct columns

**Steps**:
1. Run:
   ```bash
   docker exec auth-postgres psql -U postgres -d authdb -c "\d sessions"
   ```
2. Observe columns

**Expected Results**:
- [ ] Table has column: `id`
- [ ] Table has column: `user_id`
- [ ] Table has column: `refresh_token`
- [ ] Table has column: `expires_at`
- [ ] Table has column: `ip_address`
- [ ] Table has column: `user_agent`
- [ ] Table has column: `is_active`
- [ ] Table has column: `created_at`

**Status**: ⬜ Pass | ⬜ Fail
**Notes**: _______________________________________________

---

## Test Suite 4: Docker Environment

### Test 4.1: All Containers Running
**Objective**: Verify all 4 containers are running

**Steps**:
1. Run:
   ```bash
   docker-compose ps
   ```
2. Observe output

**Expected Results**:
- [ ] 4 containers are listed
- [ ] `auth-postgres` status: Up
- [ ] `auth-redis` status: Up
- [ ] `auth-backend` status: Up
- [ ] `auth-frontend` status: Up
- [ ] No containers show "Exited" or "Restarting"

**Status**: ⬜ Pass | ⬜ Fail
**Notes**: _______________________________________________

---

### Test 4.2: Container Health Checks
**Objective**: Verify health checks are passing

**Steps**:
1. Run:
   ```bash
   docker ps
   ```
2. Check STATUS column

**Expected Results**:
- [ ] `auth-postgres` shows "(healthy)"
- [ ] `auth-redis` shows "(healthy)"
- [ ] Backend and frontend containers are "Up"

**Status**: ⬜ Pass | ⬜ Fail
**Notes**: _______________________________________________

---

### Test 4.3: Docker Logs - No Errors
**Objective**: Verify no critical errors in container logs

**Steps**:
1. Check backend logs:
   ```bash
   docker-compose logs backend --tail=50
   ```
2. Check frontend logs:
   ```bash
   docker-compose logs frontend --tail=50
   ```
3. Look for errors

**Expected Results**:
- [ ] No "Error:" messages in backend logs
- [ ] No "ECONNREFUSED" database errors
- [ ] No "Module not found" errors
- [ ] Backend shows "Server running on port 5000"
- [ ] Backend shows "✅ Database connected"
- [ ] Frontend shows "webpack compiled successfully"
- [ ] Frontend shows "Compiled successfully"

**Status**: ⬜ Pass | ⬜ Fail
**Notes**: _______________________________________________

---

### Test 4.4: Hot Reload - Backend
**Objective**: Verify backend hot reload works

**Steps**:
1. Open `backend/src/routes/health.js`
2. Find the response message
3. Change "Server is running" to "Server is running - TEST"
4. Save file
5. Wait 2-3 seconds
6. Navigate to http://localhost:5000/health
7. Revert the change and save again

**Expected Results**:
- [ ] Backend detects file change
- [ ] Backend restarts automatically
- [ ] Logs show "Server restarted"
- [ ] Health endpoint returns new message "Server is running - TEST"
- [ ] After revert, original message returns

**Status**: ⬜ Pass | ⬜ Fail
**Notes**: _______________________________________________

---

### Test 4.5: Hot Reload - Frontend
**Objective**: Verify frontend hot reload works

**Steps**:
1. Navigate to http://localhost:3000 in browser
2. Open `frontend/src/pages/HomePage.js`
3. Change the page heading text
4. Save file
5. Observe browser (should auto-refresh)
6. Revert change

**Expected Results**:
- [ ] Browser automatically refreshes
- [ ] New text appears without manual refresh
- [ ] No full page reload (HMR - Hot Module Replacement)
- [ ] Console shows "webpack compiled successfully"
- [ ] After revert, original text returns

**Status**: ⬜ Pass | ⬜ Fail
**Notes**: _______________________________________________

---

### Test 4.6: Volume Persistence
**Objective**: Verify database data persists across restarts

**Steps**:
1. Insert test data:
   ```bash
   docker exec auth-postgres psql -U postgres -d authdb -c "INSERT INTO users (username, email, password_hash) VALUES ('testuser', 'test@example.com', 'hash123');"
   ```
2. Verify data exists:
   ```bash
   docker exec auth-postgres psql -U postgres -d authdb -c "SELECT username FROM users WHERE email='test@example.com';"
   ```
3. Restart containers:
   ```bash
   docker-compose restart
   ```
4. Verify data still exists:
   ```bash
   docker exec auth-postgres psql -U postgres -d authdb -c "SELECT username FROM users WHERE email='test@example.com';"
   ```
5. Clean up:
   ```bash
   docker exec auth-postgres psql -U postgres -d authdb -c "DELETE FROM users WHERE email='test@example.com';"
   ```

**Expected Results**:
- [ ] Data inserts successfully
- [ ] Data is queryable before restart
- [ ] Containers restart without errors
- [ ] Data still exists after restart
- [ ] Cleanup successful

**Status**: ⬜ Pass | ⬜ Fail
**Notes**: _______________________________________________

---

## Test Suite 5: Performance & Load Times

### Test 5.1: Frontend Initial Load Time
**Objective**: Verify frontend loads quickly

**Steps**:
1. Open DevTools → Network tab
2. Clear cache (Ctrl+Shift+Delete → Clear cache)
3. Navigate to http://localhost:3000
4. Check "Load" time at bottom of Network tab

**Expected Results**:
- [ ] Page loads in < 3 seconds (cold load)
- [ ] DOMContentLoaded < 1 second
- [ ] All resources load successfully

**Status**: ⬜ Pass | ⬜ Fail
**Notes**: _______________________________________________

---

### Test 5.2: Backend API Response Time
**Objective**: Verify backend responds quickly

**Steps**:
1. Open DevTools → Network tab
2. Navigate to http://localhost:5000/health
3. Click on the request in Network tab
4. Check "Time" or "Duration"

**Expected Results**:
- [ ] Response time < 200ms
- [ ] No significant delays
- [ ] Consistent response times on multiple requests

**Status**: ⬜ Pass | ⬜ Fail
**Notes**: _______________________________________________

---

### Test 5.3: Database Query Performance
**Objective**: Verify database queries are fast

**Steps**:
1. Check health endpoint multiple times:
   ```bash
   for i in {1..5}; do curl -s http://localhost:5000/health | grep database; done
   ```
2. Observe response

**Expected Results**:
- [ ] All 5 requests show "database":"connected"
- [ ] No timeouts
- [ ] Responses return quickly (< 100ms each)

**Status**: ⬜ Pass | ⬜ Fail
**Notes**: _______________________________________________

---

## Test Summary

**Total Tests**: 31
**Passed**: _____
**Failed**: _____
**Pass Rate**: _____%

### Failed Tests
List any failed tests and their issue descriptions:

1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

### Issues Found
Describe any issues, bugs, or concerns discovered:

1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

### Notes & Observations
Additional comments about the testing session:

_______________________________________________
_______________________________________________
_______________________________________________

---

## Sign-Off

**Tester Name**: _______________
**Date Completed**: _______________
**Test Duration**: _______________
**Overall Status**: ⬜ PASS | ⬜ FAIL | ⬜ PASS WITH ISSUES

**Recommendation**:
⬜ Approve for Phase 2
⬜ Re-test after fixes
⬜ Reject - critical issues found

---

*This manual test plan complements the automated test suite (`scripts/test-phase-1.sh`) and provides hands-on verification of the Phase 1 deliverables.*
