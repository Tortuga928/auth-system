# User Guide

## Authentication System - End User Documentation

Welcome to the Authentication System! This guide will help you navigate all features available to registered users.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Registration](#registration)
3. [Login](#login)
4. [Dashboard](#dashboard)
5. [Profile Management](#profile-management)
6. [Security Settings](#security-settings)
7. [Two-Factor Authentication (2FA)](#two-factor-authentication-2fa)
8. [Session Management](#session-management)
9. [Account Settings](#account-settings)
10. [Troubleshooting](#troubleshooting)

---

## Getting Started

### System Requirements

- Modern web browser (Chrome, Firefox, Safari, Edge)
- JavaScript enabled
- Cookies enabled (for session management)

### Accessing the Application

- **Production**: https://auth-frontend.onrender.com
- **Beta**: https://auth-frontend-beta.onrender.com

---

## Registration

### Creating a New Account

1. Click **"Register"** on the homepage
2. Fill in the registration form:
   - **Username**: 3-30 characters, letters, numbers, underscores only
   - **Email**: Valid email address (used for verification)
   - **Password**: Minimum 8 characters with:
     - At least one uppercase letter
     - At least one lowercase letter
     - At least one number
     - At least one special character (!@#$%^&*)
3. Click **"Create Account"**
4. Check your email for a verification link
5. Click the verification link to activate your account

### Password Requirements

Your password must meet these security requirements:

| Requirement | Example |
|------------|---------|
| Minimum 8 characters | `MyPass12!` |
| At least 1 uppercase | `M` in MyPass12! |
| At least 1 lowercase | `yass` in MyPass12! |
| At least 1 number | `12` in MyPass12! |
| At least 1 special character | `!` in MyPass12! |

### Email Verification

After registration, you'll receive an email with a verification link. This link:
- Expires after 24 hours
- Can only be used once
- Must be clicked from the same browser (recommended)

**Didn't receive the email?**
1. Check your spam/junk folder
2. Wait a few minutes and try again
3. Use the "Resend Verification" option on the login page

---

## Login

### Standard Login

1. Enter your **email** or **username**
2. Enter your **password**
3. Click **"Sign In"**

### Remember Me

Check "Remember Me" to stay logged in for 30 days. Without it, your session expires after 1 hour of inactivity.

**Security Note**: Don't use "Remember Me" on shared or public computers.

### Social Login (OAuth)

You can also sign in using:
- **Google** - Click "Sign in with Google"
- **GitHub** - Click "Sign in with GitHub"

Social login automatically creates an account if you don't have one.

### Two-Factor Authentication (2FA) Login

If you've enabled 2FA:
1. Enter your email and password
2. You'll be prompted for a 6-digit code
3. Open your authenticator app (Google Authenticator, Authy, etc.)
4. Enter the current 6-digit code
5. Click **"Verify"**

**Lost your authenticator?** Use one of your backup codes instead.

---

## Dashboard

### Overview

Your dashboard displays:
- **Profile Summary**: Your name, email, and avatar
- **Account Status**: Verification status, 2FA status
- **Recent Activity**: Last 10 login events
- **Quick Actions**: Links to common tasks

### Activity Log

View your recent account activity:
- Login attempts (successful and failed)
- Password changes
- Profile updates
- Security events

Each entry shows:
- Date and time
- Action type
- IP address
- Device/browser information

---

## Profile Management

### Viewing Your Profile

Click your avatar or name in the top navigation to access your profile.

### Editing Your Profile

1. Go to **Dashboard** → **Edit Profile**
2. Update your information:
   - **Display Name**: How others see you
   - **Bio**: Short description about yourself
   - **Location**: Your location (optional)
   - **Website**: Personal website URL (optional)
3. Click **"Save Changes"**

### Avatar Upload

1. Go to **Edit Profile**
2. Click on your current avatar or "Upload Photo"
3. Select an image file:
   - Supported formats: JPG, PNG, GIF
   - Maximum size: 5MB
   - Recommended: Square image, minimum 200x200 pixels
4. Your avatar will be automatically cropped and resized

### Removing Your Avatar

1. Go to **Edit Profile**
2. Click **"Remove Avatar"**
3. Confirm the removal

---

## Security Settings

### Accessing Security Settings

Go to **Dashboard** → **Security** or click the shield icon.

### Password Change

1. Go to **Security Settings**
2. Click **"Change Password"**
3. Enter your current password
4. Enter your new password (must meet requirements)
5. Confirm your new password
6. Click **"Update Password"**

**Note**: Changing your password will log you out of all other sessions.

### Login History

View all login attempts to your account:
- Successful logins
- Failed attempts
- IP addresses
- Locations (approximate)
- Device information

**Suspicious activity?** If you see logins you don't recognize:
1. Change your password immediately
2. Enable 2FA if not already enabled
3. Revoke all other sessions
4. Contact support if needed

---

## Two-Factor Authentication (2FA)

### What is 2FA?

Two-Factor Authentication adds an extra layer of security. Even if someone knows your password, they can't access your account without your phone.

### Setting Up 2FA

1. Go to **Security Settings** → **Two-Factor Authentication**
2. Click **"Enable 2FA"**
3. Install an authenticator app if you don't have one:
   - Google Authenticator (iOS/Android)
   - Authy (iOS/Android/Desktop)
   - Microsoft Authenticator (iOS/Android)
4. Scan the QR code with your authenticator app
5. Enter the 6-digit code from your app
6. Click **"Verify and Enable"**
7. **IMPORTANT**: Save your backup codes securely!

### Backup Codes

When you enable 2FA, you receive 10 backup codes. These are **one-time use** codes for when you can't access your authenticator app.

**Storing Backup Codes**:
- Write them down and store in a safe place
- Save them in a password manager
- Print them and store securely
- **Never** store them in plain text on your computer

**Using a Backup Code**:
1. On the 2FA verification screen, click "Use backup code"
2. Enter one of your backup codes
3. The code is consumed and can't be used again

**Regenerating Backup Codes**:
1. Go to **Security Settings** → **2FA**
2. Click **"Regenerate Backup Codes"**
3. Enter a code from your authenticator app
4. New codes are generated (old ones are invalidated)

### Disabling 2FA

1. Go to **Security Settings** → **2FA**
2. Click **"Disable 2FA"**
3. Enter your password to confirm
4. 2FA is disabled

**Warning**: Disabling 2FA reduces your account security.

### Lost Authenticator App

If you've lost access to your authenticator app:

**Option 1: Use a Backup Code**
1. Click "Use backup code" on login
2. Enter one of your saved backup codes

**Option 2: Email Recovery**
1. Click "Lost access to authenticator?"
2. Enter your password
3. Check your email for a reset link
4. Click the link to disable 2FA
5. Set up 2FA again with your new device

---

## Session Management

### Active Sessions

View all devices currently logged into your account:
- Device type (Desktop, Mobile, Tablet)
- Browser name and version
- Operating system
- IP address and location
- Last activity time

### Current Session

Your current session is marked with a "Current" badge. You cannot revoke your current session.

### Revoking Sessions

To log out of a specific device:
1. Go to **Security Settings** → **Sessions**
2. Find the session you want to end
3. Click **"Revoke"**
4. Confirm the action

**Revoke All Sessions**:
1. Click **"Revoke All Other Sessions"**
2. This logs you out everywhere except your current browser

**When to revoke sessions**:
- You lost a device
- You used a public computer
- You see unfamiliar devices
- You changed your password

---

## Account Settings

### Email Notifications

Control what emails you receive:
- Security alerts (recommended: ON)
- Login notifications
- Newsletter and updates

### Account Deletion

**Warning**: Account deletion is permanent and cannot be undone.

1. Go to **Account Settings**
2. Scroll to "Delete Account"
3. Click **"Delete My Account"**
4. Enter your password
5. Type "DELETE" to confirm
6. Click **"Permanently Delete Account"**

**What gets deleted**:
- Your profile and all personal data
- Login history and activity logs
- All active sessions
- 2FA configuration

**What's retained** (for legal/security):
- Audit logs (anonymized)
- Transaction records (if applicable)

---

## Troubleshooting

### Can't Log In

**"Invalid credentials"**
- Check your email/username spelling
- Ensure Caps Lock is off
- Try resetting your password

**"Account not verified"**
- Check your email for the verification link
- Click "Resend Verification Email"

**"Account locked"**
- Too many failed attempts
- Wait 15 minutes and try again
- Contact support if issue persists

### 2FA Issues

**"Invalid code"**
- Ensure your phone's time is correct (auto-sync recommended)
- Enter the code quickly (they change every 30 seconds)
- Try the next code if current one just changed

**"Lost authenticator app"**
- Use a backup code
- Use email recovery option

### Password Reset

1. Click "Forgot Password?" on login page
2. Enter your email address
3. Check your email for reset link (check spam folder)
4. Click the link and create a new password
5. Link expires after 1 hour

### Email Not Received

1. Check spam/junk folder
2. Add our email to your contacts
3. Wait a few minutes and try again
4. Ensure your email address is correct
5. Contact support if issue persists

### Account Recovery

If you've lost access to both your password and 2FA:
1. Contact support with proof of identity
2. Provide account details (username, email)
3. Answer security questions (if set up)
4. Support will verify and assist with recovery

---

## Privacy & Security Tips

### Password Security

- Use unique passwords for each service
- Use a password manager
- Never share your password
- Change passwords regularly

### Account Security

- Enable 2FA
- Review active sessions regularly
- Keep backup codes secure
- Log out from shared computers

### Phishing Awareness

- We never ask for your password via email
- Check the URL before entering credentials
- Look for HTTPS and valid certificate
- Report suspicious emails to support

---

## Support

Need help? Contact us:
- **Email**: support@auth-system.com
- **Response Time**: Within 24 hours

When contacting support, include:
- Your username (not password!)
- Description of the issue
- Steps to reproduce
- Screenshots if applicable

---

*Last Updated: November 25, 2025*
*Version: 1.0*
