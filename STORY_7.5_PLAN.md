# Story 7.5: MFA Settings UI - Implementation Plan

**Created**: November 9, 2025
**Story**: 7.5 - MFA Settings UI (Frontend)
**Estimated Time**: 8-12 hours
**Branch**: `feature/7.5-mfa-settings-ui`

---

## 📋 Story Overview

**User Story**:
> As a **user**, I want a **user-friendly interface to set up and manage my MFA settings**, so that **I can secure my account with two-factor authentication**.

**Acceptance Criteria**:
1. Users can enable MFA from their profile/settings page
2. Setup wizard displays QR code for authenticator apps
3. Users must verify a TOTP code to enable MFA
4. Backup codes are displayed with copy functionality
5. Users can disable MFA (requires password)
6. Login flow prompts for MFA code when enabled
7. Users can use backup codes during login
8. Clear error messages for invalid codes

---

## 🎯 Backend Endpoints (Already Built)

These endpoints are ready to use from Stories 7.1-7.4:

### Setup & Management
- `POST /api/auth/mfa/setup` - Generate secret & QR code
- `POST /api/auth/mfa/enable` - Enable MFA (requires TOTP verification)
- `POST /api/auth/mfa/disable` - Disable MFA (requires password)
- `POST /api/auth/mfa/backup-codes/regenerate` - Get new backup codes
- `GET /api/auth/mfa/status` - Check if MFA is enabled

### Login Flow
- `POST /api/auth/login` - Returns MFA challenge token if enabled
- `POST /api/auth/mfa/verify` - Verify TOTP during login
- `POST /api/auth/mfa/verify-backup` - Verify backup code during login

---

## 🎨 Component Architecture

### 1. MFA Settings Page/Section
**File**: `frontend/src/pages/MFASettings.jsx` (or section in UserProfile)
**Purpose**: Main UI for managing MFA settings

**Features**:
- Display current MFA status (enabled/disabled)
- "Enable MFA" button → Opens setup wizard
- "Disable MFA" button → Prompts for password confirmation
- "View Backup Codes" button (if MFA enabled)
- "Regenerate Backup Codes" button

**State**:
```javascript
const [mfaEnabled, setMfaEnabled] = useState(false);
const [loading, setLoading] = useState(false);
const [showSetupWizard, setShowSetupWizard] = useState(false);
const [showDisableConfirm, setShowDisableConfirm] = useState(false);
```

---

### 2. MFA Setup Wizard Modal
**File**: `frontend/src/components/MFASetupWizard.jsx`
**Purpose**: Multi-step wizard for enabling MFA

**Steps**:

#### Step 1: Introduction
- Explain what MFA is
- Benefits of enabling MFA
- "Get Started" button

#### Step 2: Scan QR Code
- Display QR code from backend
- Show manual entry code (for apps that can't scan)
- Instructions: "Scan with Google Authenticator, Authy, etc."

#### Step 3: Verify Setup
- 6-digit TOTP input field
- "Verify" button
- Error handling for invalid codes

#### Step 4: Save Backup Codes
- Display 10 backup codes
- "Copy All" button
- "Download as Text" button
- Warning: "Save these codes - you won't see them again"
- Checkbox: "I have saved my backup codes"
- "Complete Setup" button (disabled until checkbox checked)

**State**:
```javascript
const [currentStep, setCurrentStep] = useState(1);
const [qrCodeUrl, setQrCodeUrl] = useState('');
const [secret, setSecret] = useState('');
const [backupCodes, setBackupCodes] = useState([]);
const [totpCode, setTotpCode] = useState('');
const [error, setError] = useState('');
const [savedCodesConfirmed, setSavedCodesConfirmed] = useState(false);
```

**API Calls**:
```javascript
// Step 2: Get QR code
const setupMFA = async () => {
  const response = await api.post('/api/auth/mfa/setup');
  setQrCodeUrl(response.data.data.qrCodeUrl);
  setSecret(response.data.data.secret);
};

// Step 3: Enable MFA
const enableMFA = async (token) => {
  const response = await api.post('/api/auth/mfa/enable', { token });
  setBackupCodes(response.data.data.backupCodes);
  setCurrentStep(4);
};
```

---

### 3. MFA Verification Input (Login Flow)
**File**: `frontend/src/components/MFAVerificationInput.jsx`
**Purpose**: Prompt for MFA code during login

**Features**:
- 6-digit code input (auto-submit on 6 digits)
- "Use backup code" link
- Switches to backup code input (longer text field)
- "Verify" button
- Error messages
- "Lost your device? Reset MFA" link

**Props**:
```javascript
MFAVerificationInput.propTypes = {
  mfaChallengeToken: PropTypes.string.isRequired,
  onSuccess: PropTypes.func.isRequired, // Called with tokens
  onError: PropTypes.func.isRequired,
};
```

**State**:
```javascript
const [code, setCode] = useState('');
const [useBackupCode, setUseBackupCode] = useState(false);
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');
```

**API Calls**:
```javascript
// Verify TOTP
const verifyTOTP = async (token) => {
  const response = await api.post('/api/auth/mfa/verify', {
    token,
    mfaChallengeToken
  });
  onSuccess(response.data.data.tokens);
};

// Verify Backup Code
const verifyBackupCode = async (code) => {
  const response = await api.post('/api/auth/mfa/verify-backup', {
    backupCode: code,
    mfaChallengeToken
  });
  onSuccess(response.data.data.tokens);
};
```

---

### 4. Backup Codes Display Component
**File**: `frontend/src/components/BackupCodesDisplay.jsx`
**Purpose**: Display backup codes with copy/download functionality

**Features**:
- List of 10 backup codes (formatted nicely)
- "Copy All" button
- "Download" button (creates .txt file)
- Warning message
- Used codes marked differently (grayed out)

**Props**:
```javascript
BackupCodesDisplay.propTypes = {
  codes: PropTypes.arrayOf(PropTypes.string).isRequired,
  usedCodes: PropTypes.arrayOf(PropTypes.string), // Optional
  onClose: PropTypes.func,
};
```

**Utilities**:
```javascript
const copyToClipboard = (codes) => {
  navigator.clipboard.writeText(codes.join('\n'));
  // Show success message
};

const downloadCodes = (codes) => {
  const blob = new Blob([codes.join('\n')], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'mfa-backup-codes.txt';
  a.click();
};
```

---

### 5. MFA Disable Confirmation Modal
**File**: `frontend/src/components/MFADisableConfirmation.jsx`
**Purpose**: Confirm password before disabling MFA

**Features**:
- Password input field
- Warning message about disabling MFA
- "Cancel" and "Disable MFA" buttons
- Error handling

**State**:
```javascript
const [password, setPassword] = useState('');
const [error, setError] = useState('');
const [loading, setLoading] = useState(false);
```

**API Call**:
```javascript
const disableMFA = async (password) => {
  const response = await api.post('/api/auth/mfa/disable', { password });
  // Refresh MFA status
  onSuccess();
};
```

---

## 🔄 User Flows

### Flow 1: Enable MFA
1. User navigates to Settings/Profile
2. Clicks "Enable MFA" button
3. **Setup Wizard Step 1**: Reads introduction
4. **Setup Wizard Step 2**: Scans QR code with authenticator app
5. **Setup Wizard Step 3**: Enters TOTP code from app, clicks "Verify"
6. **Setup Wizard Step 4**: Views backup codes, copies/downloads them, checks confirmation, clicks "Complete"
7. Modal closes, MFA status updates to "Enabled"

### Flow 2: Disable MFA
1. User navigates to Settings/Profile
2. Clicks "Disable MFA" button
3. **Confirmation Modal**: Enters password
4. Clicks "Disable MFA"
5. Modal closes, MFA status updates to "Disabled"

### Flow 3: Login with MFA
1. User enters email/password on login page
2. Backend detects MFA enabled, returns challenge token
3. **MFA Verification Input** appears
4. User enters 6-digit TOTP code
5. Clicks "Verify" (or auto-submits)
6. Success → Redirected to dashboard
7. Error → Shows error message, allows retry

### Flow 4: Login with Backup Code
1. User enters email/password on login page
2. **MFA Verification Input** appears
3. User clicks "Use backup code" link
4. Input switches to text field
5. User enters backup code, clicks "Verify"
6. Success → Redirected to dashboard (shows warning: "X backup codes remaining")
7. Error → Shows error message

### Flow 5: Regenerate Backup Codes
1. User navigates to Settings/Profile (MFA already enabled)
2. Clicks "View Backup Codes" button
3. **Backup Codes Modal** appears
4. Clicks "Regenerate" button
5. Confirmation: "This will invalidate old codes. Continue?"
6. New codes displayed
7. User copies/downloads new codes

---

## 🎨 UI/UX Design Guidelines

### Color Scheme
- **Success**: Green (#10b981)
- **Warning**: Yellow/Orange (#f59e0b)
- **Error**: Red (#ef4444)
- **Primary**: Blue (#3b82f6)
- **Disabled**: Gray (#9ca3af)

### Typography
- **Headings**: Bold, 24px (Step titles), 18px (Section headers)
- **Body**: Regular, 14px
- **Codes**: Monospace font (backup codes, TOTP codes)
- **Warnings**: Bold, 14px with icon

### Spacing
- **Modal padding**: 24px
- **Step spacing**: 32px between steps
- **Button margin**: 8px between buttons
- **Input margin**: 16px below labels

### Accessibility
- All buttons have proper ARIA labels
- Form inputs have associated labels
- Error messages announced to screen readers
- Keyboard navigation support
- Focus indicators on all interactive elements

---

## 🧪 Testing Strategy

### Unit Tests (Component Testing)

#### MFASetupWizard.test.jsx
```javascript
describe('MFASetupWizard', () => {
  test('renders introduction step initially', () => {});
  test('displays QR code on step 2', () => {});
  test('validates TOTP code format', () => {});
  test('shows error for invalid TOTP code', () => {});
  test('displays backup codes on step 4', () => {});
  test('enables Complete button after confirmation checkbox', () => {});
  test('calls onComplete callback when setup finishes', () => {});
});
```

#### MFAVerificationInput.test.jsx
```javascript
describe('MFAVerificationInput', () => {
  test('auto-submits on 6 digits', () => {});
  test('switches to backup code input', () => {});
  test('shows error for invalid code', () => {});
  test('calls onSuccess with tokens', () => {});
});
```

#### BackupCodesDisplay.test.jsx
```javascript
describe('BackupCodesDisplay', () => {
  test('displays all backup codes', () => {});
  test('copies codes to clipboard', () => {});
  test('downloads codes as text file', () => {});
  test('marks used codes differently', () => {});
});
```

### Integration Tests

#### test-story7.5-mfa-ui.js
```javascript
// Test complete MFA setup flow
// Test MFA login flow
// Test backup code usage
// Test MFA disable flow
// Test regenerate backup codes
```

### Manual Testing Checklist
- [ ] Enable MFA with Google Authenticator
- [ ] Enable MFA with Authy
- [ ] Verify TOTP code works
- [ ] Verify invalid TOTP code shows error
- [ ] Download backup codes
- [ ] Login with TOTP code
- [ ] Login with backup code
- [ ] Disable MFA with password
- [ ] Regenerate backup codes
- [ ] Test on mobile device
- [ ] Test keyboard navigation
- [ ] Test with screen reader

---

## 📦 Dependencies

### New NPM Packages (if needed)
```bash
npm install qrcode.react  # For displaying QR codes
```

### Existing Packages
- `react` - Component framework
- `axios` - API calls (already configured)
- `react-router-dom` - Navigation
- `prop-types` - Prop validation

---

## 📁 File Structure

```
frontend/src/
├── pages/
│   └── MFASettings.jsx              # Main MFA settings page
│
├── components/
│   ├── MFASetupWizard.jsx           # Multi-step setup modal
│   ├── MFAVerificationInput.jsx     # Login MFA input
│   ├── BackupCodesDisplay.jsx       # Backup codes display
│   └── MFADisableConfirmation.jsx   # Disable MFA modal
│
├── services/
│   └── api.js                        # API integration (already exists)
│
├── hooks/
│   └── useMFA.js                     # Custom hook for MFA operations
│
└── __tests__/
    ├── MFASetupWizard.test.jsx
    ├── MFAVerificationInput.test.jsx
    └── BackupCodesDisplay.test.jsx
```

---

## ⏱️ Time Estimates

### Component Development
| Component | Estimated Time |
|-----------|----------------|
| MFASettings Page | 1-2 hours |
| MFASetupWizard (4 steps) | 3-4 hours |
| MFAVerificationInput | 1-2 hours |
| BackupCodesDisplay | 1 hour |
| MFADisableConfirmation | 1 hour |
| useMFA custom hook | 1 hour |
| **Subtotal** | **8-11 hours** |

### Testing & Polish
| Task | Estimated Time |
|------|----------------|
| Unit tests | 2 hours |
| Integration tests | 1 hour |
| Manual testing | 1 hour |
| Bug fixes | 1-2 hours |
| **Subtotal** | **5-6 hours** |

### **Total Estimate**: 13-17 hours (adjust to 8-12 with focus)

---

## 🎯 Acceptance Criteria (Detailed)

### Functional Requirements
- [ ] User can navigate to MFA settings page
- [ ] User can see current MFA status (enabled/disabled)
- [ ] User can click "Enable MFA" to start setup wizard
- [ ] Setup wizard shows 4 clear steps with progress indicator
- [ ] QR code displays correctly in Step 2
- [ ] Manual entry code shown for users who can't scan QR
- [ ] TOTP input accepts 6 digits only
- [ ] Invalid TOTP shows clear error message
- [ ] Backup codes (10) display in Step 4
- [ ] "Copy All" button copies codes to clipboard
- [ ] "Download" button saves codes as .txt file
- [ ] Complete button disabled until "saved codes" checkbox checked
- [ ] MFA status updates to "Enabled" after completion
- [ ] User can disable MFA with password confirmation
- [ ] Login page shows MFA input when user has MFA enabled
- [ ] MFA input auto-submits on 6 digits
- [ ] "Use backup code" link switches input type
- [ ] Backup code input accepts longer codes
- [ ] Valid MFA code logs user in successfully
- [ ] Invalid MFA code shows error, allows retry
- [ ] Backup codes can be used to login
- [ ] Used backup codes are tracked
- [ ] User can regenerate backup codes

### Non-Functional Requirements
- [ ] All components are responsive (mobile-friendly)
- [ ] Loading states shown during API calls
- [ ] Error messages are user-friendly
- [ ] Success messages confirm actions
- [ ] Keyboard navigation works throughout
- [ ] ARIA labels present for accessibility
- [ ] No console errors or warnings
- [ ] Code follows project conventions
- [ ] Components are reusable
- [ ] PropTypes defined for all components

---

## 🚀 Implementation Phases

### Phase 1: Core Components (4-5 hours)
1. Create `MFASettings` page structure
2. Build `MFASetupWizard` (Steps 1-4)
3. Build `BackupCodesDisplay` component
4. Test QR code display and backup codes

### Phase 2: Login Integration (2-3 hours)
1. Build `MFAVerificationInput` component
2. Integrate with login flow
3. Add "Use backup code" functionality
4. Test TOTP and backup code login

### Phase 3: Management Features (2-3 hours)
1. Build `MFADisableConfirmation` modal
2. Add "Regenerate Backup Codes" feature
3. Add "View Backup Codes" feature
4. Test disable and regenerate flows

### Phase 4: Testing & Polish (3-4 hours)
1. Write unit tests for all components
2. Write integration test script
3. Manual testing on all flows
4. Fix bugs and polish UI
5. Update documentation

---

## 📝 Implementation Notes

### QR Code Display
```javascript
import QRCode from 'qrcode.react';

<QRCode
  value={`otpauth://totp/AuthSystem:${userEmail}?secret=${secret}&issuer=AuthSystem`}
  size={256}
  level="H"
  includeMargin={true}
/>
```

### Auto-submit on 6 digits
```javascript
const handleCodeChange = (e) => {
  const value = e.target.value.replace(/\D/g, ''); // Only digits
  setCode(value);

  if (value.length === 6) {
    // Auto-submit
    handleVerify(value);
  }
};
```

### Copy to Clipboard
```javascript
const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    setShowCopySuccess(true);
    setTimeout(() => setShowCopySuccess(false), 2000);
  } catch (err) {
    console.error('Failed to copy:', err);
  }
};
```

### Download as Text File
```javascript
const downloadCodes = (codes) => {
  const text = `MFA Backup Codes - Save These Securely\n\n${codes.join('\n')}`;
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `mfa-backup-codes-${new Date().toISOString().split('T')[0]}.txt`;
  link.click();
  URL.revokeObjectURL(url);
};
```

---

## ✅ Definition of Done

Story 7.5 is complete when:
- [ ] All 5 components built and working
- [ ] All user flows tested manually
- [ ] Unit tests written (80%+ coverage)
- [ ] Integration test script created and passing
- [ ] No console errors or warnings
- [ ] Code reviewed and follows conventions
- [ ] Documentation updated
- [ ] Committed to feature branch
- [ ] Merged to staging
- [ ] Pushed to GitHub

---

## 🔗 Related Stories

**Dependencies**:
- ✅ Story 7.1: MFA Model & TOTP Logic
- ✅ Story 7.2: MFA Setup Endpoints
- ✅ Story 7.3: MFA Login Flow
- ✅ Story 7.4: MFA Recovery & Management

**Enables**:
- Phase 7 Complete (100%)
- Production deployment of full MFA system

---

**This plan document will be used to guide the implementation of Story 7.5.**

When ready to start: Create branch `feature/7.5-mfa-settings-ui` and begin with Phase 1.
