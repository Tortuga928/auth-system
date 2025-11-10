# Beta Environment Testing Guide

**Environment**: Beta Testing Environment
**URL**: https://auth-frontend-beta.onrender.com
**Status**: ✅ Live and Ready for Testing
**Last Updated**: November 10, 2025

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Test User Credentials](#test-user-credentials)
3. [What to Test](#what-to-test)
4. [Testing Workflows](#testing-workflows)
5. [How to Report Issues](#how-to-report-issues)
6. [Known Limitations](#known-limitations)
7. [FAQ](#faq)

---

## Quick Start

### Access the Beta Environment

1. **Open your browser** and navigate to:
   ```
   https://auth-frontend-beta.onrender.com
   ```

2. **Log in** with one of the test accounts (see credentials below)

3. **Start testing!** Follow the testing workflows in this guide

**Note**: This is a **test environment** - all data is temporary and may be reset at any time.

---

## Test User Credentials

We have **3 test accounts** set up with different configurations:

### 👤 Account 1: Admin User

```
Email:    admin@test.com
Password: Admin123!@#
Role:     Administrator
MFA:      Disabled (can enable for testing)
```

**Use this account to:**
- Test admin features (when available)
- Test MFA setup from scratch
- Test account with elevated permissions

---

### 👤 Account 2: Regular User

```
Email:    testuser@test.com
Password: User123!@#
Role:     Regular User
MFA:      Disabled (can enable for testing)
```

**Use this account to:**
- Test standard user features
- Test MFA setup flow
- Test typical user workflows

---

### 👤 Account 3: MFA Pre-Enabled User

```
Email:    mfa@test.com
Password: MFA123!@#
Role:     Regular User
MFA:      ✅ ENABLED
```

**MFA Setup:**
- **Secret**: `PFNGIXRFO5JEYXJKKYXWOXKEEUUSCWTNJE3EEOSIKBTGWYS5OIZA`
- **To login**: You'll need an authenticator app (Google Authenticator, Authy, etc.)
- **Setup**: Add the secret above to your authenticator app to generate codes

**Use this account to:**
- Test MFA login flow
- Test MFA disable flow
- Test account with MFA already configured

---

## What to Test

The beta environment includes **all Phase 1-7 features**. Here's what you should test:

### ✅ Phase 3: Basic Authentication

- [ ] **Registration** - Create new account
- [ ] **Login** - Sign in with credentials
- [ ] **Logout** - Sign out of application
- [ ] **Token Refresh** - Session stays active

### ✅ Phase 4: Email Verification

- [ ] **Email verification flow** (if email is configured)
- [ ] **Resend verification email**

### ✅ Phase 5: Password Reset

- [ ] **Forgot password request**
- [ ] **Password reset email** (if email is configured)
- [ ] **Reset password with token**
- [ ] **Login with new password**

### ✅ Phase 6: OAuth Social Login

- [ ] **Google OAuth login** (if configured)
- [ ] **GitHub OAuth login** (if configured)
- [ ] **Account linking**
- [ ] **Account unlinking**

### ✅ Phase 7: Multi-Factor Authentication (MFA)

**Priority Testing - This is new!**

- [ ] **Enable MFA** - Set up 2FA on account
- [ ] **QR Code Scan** - Use authenticator app
- [ ] **Manual Secret Entry** - Add secret manually
- [ ] **MFA Login** - Log in with TOTP code
- [ ] **Backup Codes** - Verify backup codes displayed
- [ ] **Disable MFA** - Remove 2FA from account
- [ ] **MFA Settings Page** - View and manage MFA status

---

## Testing Workflows

### 🧪 Workflow 1: Complete MFA Setup (Priority!)

**Goal**: Test the full MFA setup and login experience

**Steps:**

1. **Log in** with testuser@test.com / User123!@#
2. **Navigate to "2FA Settings"** (look for link in navigation)
3. **Click "Enable Two-Factor Authentication"** button
4. **Click "Get Started"** on the setup page
5. **Open your authenticator app** (Google Authenticator, Authy, Microsoft Authenticator, etc.)
6. **Scan the QR code** displayed OR manually enter the secret
7. **Enter the 6-digit code** from your authenticator app
8. **Click "Verify"** or "Submit"
9. **Verify success message** appears
10. **Save backup codes** (if displayed) - write them down!
11. **Log out** of the application
12. **Log in again** with testuser@test.com / User123!@#
13. **Verify TOTP prompt** appears after password
14. **Enter current code** from authenticator app
15. **Verify successful login** with MFA

**Expected Results:**
- ✅ QR code displayed clearly
- ✅ Secret text shown for manual entry
- ✅ TOTP code verified successfully
- ✅ Backup codes displayed (save these!)
- ✅ 2FA Settings shows "Enabled"
- ✅ Login requires TOTP code after password
- ✅ Valid TOTP code allows login

**What to Look For:**
- ⚠️ Any error messages
- ⚠️ UI/UX issues (confusing buttons, unclear instructions)
- ⚠️ QR code not scanning correctly
- ⚠️ TOTP verification failing with valid codes

---

### 🧪 Workflow 2: MFA Disable Flow

**Goal**: Test removing 2FA from an account

**Prerequisites**: Account with MFA enabled (use workflow 1 first, or use mfa@test.com)

**Steps:**

1. **Log in** with MFA-enabled account (testuser@test.com if you completed workflow 1)
   - Enter password
   - Enter TOTP code from authenticator app
2. **Navigate to "2FA Settings"**
3. **Verify status shows "Enabled"**
4. **Click "Disable 2FA"** or similar button
5. **Confirm the action** (if prompted)
6. **Verify success message**
7. **Verify status shows "Disabled"**
8. **Log out**
9. **Log in again** with same credentials
10. **Verify NO TOTP prompt** - should log in with password only

**Expected Results:**
- ✅ Disable button clearly visible
- ✅ Confirmation dialog appears (security best practice)
- ✅ MFA successfully removed
- ✅ Status updated to "Disabled"
- ✅ Subsequent logins don't require TOTP

**What to Look For:**
- ⚠️ Can disable without confirmation (security issue)
- ⚠️ MFA not fully removed (still prompts for code)
- ⚠️ Error messages
- ⚠️ UI not updating after disable

---

### 🧪 Workflow 3: Basic Login/Logout

**Goal**: Test fundamental authentication

**Steps:**

1. **Go to login page**
2. **Enter credentials**: testuser@test.com / User123!@#
3. **Click "Login"**
4. **Verify redirect to dashboard** or home page
5. **Verify user info displayed** (name, email, etc.)
6. **Click "Logout"**
7. **Verify redirect to login page**
8. **Verify cannot access protected pages** without login

**Expected Results:**
- ✅ Login successful with valid credentials
- ✅ Error message with invalid credentials
- ✅ User session maintained across page refreshes
- ✅ Logout clears session
- ✅ Protected routes redirect to login when logged out

---

### 🧪 Workflow 4: Password Reset Flow

**Goal**: Test forgot password functionality

**Steps:**

1. **Go to login page**
2. **Click "Forgot Password?"** link
3. **Enter email**: testuser@test.com
4. **Click "Send Reset Email"**
5. **Check confirmation message** (email may not actually send in beta)
6. **If email arrives**, click reset link
7. **Enter new password** (must meet requirements)
8. **Confirm new password**
9. **Submit form**
10. **Verify redirect to login**
11. **Log in with NEW password**

**Expected Results:**
- ✅ Reset request accepted
- ✅ Email sent (if configured)
- ✅ Reset link works (if email configured)
- ✅ Password requirements shown
- ✅ Can log in with new password

**Note**: Email functionality may not be fully configured in beta. Focus on UI/UX testing.

---

### 🧪 Workflow 5: Session Management

**Goal**: Test session persistence and security

**Steps:**

1. **Log in** with any test account
2. **Refresh the page** - verify still logged in
3. **Open new tab** with same URL - verify still logged in
4. **Close browser completely**
5. **Reopen browser** and navigate to site
6. **Verify session status** (depends on "remember me" setting)
7. **Leave browser open for 1+ hours**
8. **Try to access a protected page**
9. **Verify token refresh** or re-login prompt

**Expected Results:**
- ✅ Session persists across page refreshes
- ✅ Session persists across tabs
- ✅ Session behavior depends on settings (remember me)
- ✅ Token refresh works automatically
- ✅ Expired sessions redirect to login

---

## How to Report Issues

### 🐛 Bug Report Template

When you find an issue, please report it with the following information:

```
**Title**: Short description of the issue

**Severity**:
- [ ] Critical (app unusable)
- [ ] High (major feature broken)
- [ ] Medium (feature works but has issues)
- [ ] Low (minor UI/UX issue)

**Steps to Reproduce**:
1. Go to...
2. Click on...
3. Enter...
4. See error

**Expected Behavior**:
What you expected to happen

**Actual Behavior**:
What actually happened

**Screenshots**:
(Attach if helpful)

**Browser & OS**:
- Browser: Chrome 118 / Firefox 119 / Safari 17 / Edge 118
- OS: Windows 11 / macOS 14 / iOS 17 / Android 14

**Account Used**:
- Email: testuser@test.com (don't share password)

**Additional Notes**:
Any other relevant information
```

### Where to Report

**Option 1**: GitHub Issues
- Go to: https://github.com/Tortuga928/auth-system/issues
- Create a new issue
- Use the template above
- Tag with `beta-testing` label

**Option 2**: Direct Communication
- Email: [Add your email]
- Slack: [Add Slack channel]
- Teams: [Add Teams channel]

---

## Known Limitations

### ⚠️ Beta Environment Constraints

**1. Email Functionality**
- ✅ **Status**: May be partially configured
- 📝 **Impact**: Password reset emails, verification emails may not send
- 💡 **Workaround**: Focus on UI/UX testing; email delivery not critical for beta

**2. OAuth Social Login**
- ✅ **Status**: May not be configured
- 📝 **Impact**: Google/GitHub login may not work
- 💡 **Workaround**: Test with email/password authentication

**3. Free Tier Performance**
- ✅ **Status**: Running on Render free tier
- 📝 **Impact**: First request after inactivity may be slow (~30s cold start)
- 💡 **Workaround**: Wait patiently for initial load

**4. Database Resets**
- ✅ **Status**: Test data may be reset periodically
- 📝 **Impact**: Custom accounts/data may disappear
- 💡 **Workaround**: Use provided test accounts; expect data to reset

**5. Maintenance Windows**
- ✅ **Status**: May deploy updates without notice
- 📝 **Impact**: Brief downtime during deployments (~2-5 min)
- 💡 **Workaround**: Refresh page if you get errors

---

## FAQ

### Q: Can I create my own test account?

**A**: Yes! Click "Register" and create a new account. However, test accounts may be reset periodically, so don't rely on custom accounts persisting.

---

### Q: What if I can't log in with the test accounts?

**A**:
1. Double-check you're using the exact credentials (case-sensitive)
2. Try a different test account
3. Check if there's a maintenance window (site may be deploying)
4. Report the issue if it persists

---

### Q: Do I need to install an authenticator app?

**A**: Only if you want to test MFA features. Recommended apps:
- Google Authenticator (iOS/Android)
- Authy (iOS/Android/Desktop)
- Microsoft Authenticator (iOS/Android)
- 1Password (has built-in TOTP)

---

### Q: What happens to my authenticator app entry after testing?

**A**: You can delete it from your authenticator app when done testing. It's a test account on a beta server, not production data.

---

### Q: Can I test on mobile devices?

**A**: Yes! The beta environment is accessible from any device with a web browser. Test on:
- 📱 Mobile phones (iOS/Android)
- 📱 Tablets
- 💻 Desktop browsers
- Different screen sizes

---

### Q: How long will the beta environment be available?

**A**: The beta environment will remain active throughout development. It may be updated or reset as new features are added.

---

### Q: What if I find a security issue?

**A**: Report it **immediately** through the designated security reporting channel (not public GitHub issues). Contact the project lead directly.

---

### Q: Can I share these test credentials?

**A**: Yes, within the development team. These are test accounts in a non-production environment. However, don't post them publicly online.

---

### Q: The site is loading slowly - is something wrong?

**A**: The beta environment runs on Render's free tier, which has "cold starts" after periods of inactivity. The first request may take 30-60 seconds. Subsequent requests will be fast.

---

### Q: Can I test password reset without email working?

**A**: You can test the UI and request flow, but you won't receive the actual reset email if email isn't configured. Focus on testing the forms, validation, and error messages.

---

### Q: What should I NOT test?

**Don't test:**
- ❌ Load testing / stress testing (free tier limits)
- ❌ Automated scanning / security penetration testing (against Render TOS)
- ❌ Spam / abuse (excessive requests)
- ❌ Production data entry (this is a test environment)

---

## 🎯 Testing Priorities

### High Priority (Test These First!)

1. ✅ **MFA Setup Flow** (Workflow 1) - New feature!
2. ✅ **MFA Login Flow** (Part of Workflow 1)
3. ✅ **MFA Disable Flow** (Workflow 2)
4. ✅ **Basic Login/Logout** (Workflow 3)

### Medium Priority

5. ⭐ **Password Reset UI** (Workflow 4) - UI only if email not working
6. ⭐ **Session Management** (Workflow 5)
7. ⭐ **Mobile Testing** - Test on different devices
8. ⭐ **Browser Compatibility** - Test on different browsers

### Low Priority (If Time Permits)

9. ⭐ **OAuth Login** (if configured)
10. ⭐ **Account Settings** - Profile editing
11. ⭐ **Edge Cases** - Invalid input, error handling
12. ⭐ **Accessibility** - Screen readers, keyboard navigation

---

## 📊 Testing Checklist

Use this checklist to track your testing progress:

### Authentication Features
- [ ] Login with valid credentials
- [ ] Login with invalid credentials (error handling)
- [ ] Logout functionality
- [ ] Session persistence across page refresh
- [ ] Session persistence across browser tabs

### MFA Features (Priority!)
- [ ] Enable MFA - full workflow
- [ ] QR code scan with authenticator app
- [ ] Manual secret entry
- [ ] TOTP verification (valid code)
- [ ] TOTP verification (invalid code - error handling)
- [ ] Backup codes displayed and saved
- [ ] Login with MFA enabled
- [ ] Disable MFA
- [ ] 2FA Settings page accuracy

### Password Reset
- [ ] Forgot password request
- [ ] Email sent confirmation (UI)
- [ ] Reset form validation
- [ ] Password requirements displayed

### User Experience
- [ ] Navigation is clear
- [ ] Error messages are helpful
- [ ] Success messages are clear
- [ ] Forms are easy to use
- [ ] Mobile responsive design
- [ ] Loading states displayed

### Browser Testing
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

---

## 🙏 Thank You!

Your testing helps us build a better, more secure authentication system. Every bug you find, every improvement you suggest makes the product better for everyone.

**Happy Testing!** 🚀

---

## Need Help?

If you have questions about this testing guide or the beta environment:

1. Check the [FAQ section](#faq) above
2. Review the [Known Limitations](#known-limitations)
3. Contact the development team
4. Check the [Technical Documentation](./BETA_BRANCH_SETUP.md) for detailed setup info

---

*Beta Testing Guide Version 1.0*
*Last Updated: November 10, 2025*
*Beta Environment URL: https://auth-frontend-beta.onrender.com*
