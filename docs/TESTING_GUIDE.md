# Testing Guide

This document outlines comprehensive testing procedures for the Authentication System project.

## Table of Contents

1. [Testing Overview](#testing-overview)
2. [Testing Types](#testing-types)
3. [Test Documentation Structure](#test-documentation-structure)
4. [Acceptance Criteria](#acceptance-criteria)
5. [Test Cases](#test-cases)
6. [BDD Scenarios](#bdd-scenarios)
7. [Automated Testing](#automated-testing)
8. [Manual Testing](#manual-testing)
9. [Edge Cases](#edge-cases)
10. [Test Data Management](#test-data-management)

---

## Testing Overview

Every user story must pass through **5 levels of testing** before deployment:

1. **Unit Testing** - Individual functions and modules
2. **Integration Testing** - API endpoints and database interactions
3. **Component Testing** - Frontend components (React)
4. **E2E Testing** - Complete user workflows
5. **Manual Testing** - Human verification and exploratory testing

---

## Testing Types

### Unit Tests

**Purpose**: Test individual functions in isolation

**Tools**: Jest, Mocha

**Location**:
- Backend: `backend/tests/unit/`
- Frontend: `frontend/src/__tests__/`

**Example**:
```javascript
// backend/tests/unit/auth.test.js
describe('generateJWT', () => {
  it('should generate valid JWT token', () => {
    const token = generateJWT({ userId: 1 });
    expect(token).toBeDefined();
    expect(token.split('.')).toHaveLength(3);
  });
});
```

### Integration Tests

**Purpose**: Test API endpoints and database operations

**Tools**: Supertest, Jest

**Location**: `backend/tests/integration/`

**Example**:
```javascript
// backend/tests/integration/auth.test.js
describe('POST /api/auth/register', () => {
  it('should create new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@test.com', password: 'Test123!' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
  });
});
```

### Component Tests

**Purpose**: Test React components

**Tools**: React Testing Library, Jest

**Location**: `frontend/src/__tests__/`

**Example**:
```javascript
// frontend/src/__tests__/LoginForm.test.js
describe('LoginForm', () => {
  it('should submit form with valid credentials', () => {
    render(<LoginForm />);
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@test.com' }
    });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    // assertions...
  });
});
```

### E2E Tests

**Purpose**: Test complete user workflows

**Tools**: Cypress, Playwright

**Location**: `e2e/`

**Example**:
```javascript
// e2e/auth.spec.js
describe('User Registration', () => {
  it('should register new user and login', () => {
    cy.visit('/register');
    cy.get('[name="email"]').type('test@test.com');
    cy.get('[name="password"]').type('Test123!');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard');
  });
});
```

---

## Test Documentation Structure

For each user story, document tests in this format:

### Template

```markdown
## Story X.X - Feature Name

### Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

### Test Cases

#### TC-X.X-01: Test Case Name
**Setup**:
- Preconditions

**Steps**:
1. Step 1
2. Step 2
3. Step 3

**Expected Result**:
- Expected outcome

**Actual Result**:
- (Fill after testing)

**Status**: ⬜ Pass / ⬜ Fail

---

### BDD Scenarios

#### Scenario 1: Scenario Name
**Given** initial state
**When** action occurs
**Then** expected outcome

**And** additional conditions

---

### Automated Tests

**Unit Tests**:
- `npm test unit/auth.test.js`

**Integration Tests**:
- `npm test integration/register.test.js`

**Component Tests**:
- `npm test LoginForm.test.js`

---

### Manual Testing Steps

1. Manual step 1
2. Manual step 2
3. Verification step

---

### Edge Cases

1. **Edge Case 1**: Description
   - Test: How to test
   - Expected: Expected behavior

2. **Edge Case 2**: Description
   - Test: How to test
   - Expected: Expected behavior
```

---

## Acceptance Criteria

Acceptance criteria define when a story is "done". Every story must meet ALL criteria.

### Format

```markdown
### Acceptance Criteria

**Functional Requirements**:
- [ ] Feature works as specified
- [ ] All API endpoints respond correctly
- [ ] Data is persisted correctly
- [ ] UI displays correct information

**Non-Functional Requirements**:
- [ ] Response time < 200ms
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Accessible (WCAG 2.1 AA)

**Testing Requirements**:
- [ ] Unit tests pass (>80% coverage)
- [ ] Integration tests pass
- [ ] Manual testing complete
- [ ] Edge cases handled

**Security Requirements**:
- [ ] Input validation present
- [ ] No XSS vulnerabilities
- [ ] No SQL injection possible
- [ ] Authentication required

**Documentation Requirements**:
- [ ] Code documented
- [ ] API docs updated
- [ ] User guide updated (if applicable)
```

---

## Test Cases

Test cases provide step-by-step instructions for testing.

### Example: User Registration

#### TC-3.1-01: Successful User Registration

**Setup**:
- Database is running
- Backend server is running
- Frontend is accessible at localhost:3000
- No existing user with email `test@example.com`

**Steps**:
1. Navigate to `/register`
2. Enter email: `test@example.com`
3. Enter password: `SecurePass123!`
4. Enter password confirmation: `SecurePass123!`
5. Click "Register" button
6. Wait for response

**Expected Result**:
- HTTP 201 Created response
- JWT token returned in response body
- User record created in database
- User redirected to `/dashboard`
- Success message displayed

**Actual Result**:
- (Fill after testing)

**Status**: ⬜ Pass / ⬜ Fail

**Notes**:
- (Any observations)

---

#### TC-3.1-02: Registration with Duplicate Email

**Setup**:
- Database has existing user with email `existing@example.com`

**Steps**:
1. Navigate to `/register`
2. Enter email: `existing@example.com`
3. Enter password: `SecurePass123!`
4. Enter password confirmation: `SecurePass123!`
5. Click "Register" button

**Expected Result**:
- HTTP 409 Conflict response
- Error message: "Email already exists"
- No new user created in database
- User remains on registration page

**Actual Result**:
- (Fill after testing)

**Status**: ⬜ Pass / ⬜ Fail

---

#### TC-3.1-03: Registration with Weak Password

**Setup**:
- Backend server is running

**Steps**:
1. Navigate to `/register`
2. Enter email: `test@example.com`
3. Enter password: `123` (weak password)
4. Enter password confirmation: `123`
5. Click "Register" button

**Expected Result**:
- HTTP 400 Bad Request response
- Error message: "Password must be at least 8 characters with uppercase, lowercase, number, and special character"
- No user created in database
- Password field highlighted with error

**Actual Result**:
- (Fill after testing)

**Status**: ⬜ Pass / ⬜ Fail

---

## BDD Scenarios

BDD (Behavior-Driven Development) scenarios use Given/When/Then format for clarity.

### Example: User Login

#### Scenario 1: Successful Login with Valid Credentials

```gherkin
Given a registered user with email "user@example.com" and password "SecurePass123!"
And the user is on the login page
When the user enters email "user@example.com"
And the user enters password "SecurePass123!"
And the user clicks the "Login" button
Then the user should receive a JWT token
And the user should be redirected to "/dashboard"
And the dashboard should display "Welcome, user@example.com"
```

#### Scenario 2: Login Fails with Incorrect Password

```gherkin
Given a registered user with email "user@example.com" and password "SecurePass123!"
And the user is on the login page
When the user enters email "user@example.com"
And the user enters password "WrongPassword!"
And the user clicks the "Login" button
Then the user should see error message "Invalid credentials"
And the user should remain on the login page
And no JWT token should be issued
```

#### Scenario 3: Login Blocked After 5 Failed Attempts

```gherkin
Given a registered user with email "user@example.com"
And the user has failed login 4 times in the last 15 minutes
When the user enters email "user@example.com"
And the user enters password "WrongPassword!"
And the user clicks the "Login" button
Then the user should see error message "Account temporarily locked. Try again in 15 minutes."
And the login attempt should be blocked
And an email should be sent to "user@example.com" about suspicious activity
```

---

## Automated Testing

### Running Tests

```bash
# Backend tests
cd backend

# Run all tests
npm test

# Run specific test file
npm test auth.test.js

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run integration tests only
npm run test:integration

# Run unit tests only
npm run test:unit
```

```bash
# Frontend tests
cd frontend

# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test
npm test LoginForm.test.js

# Update snapshots
npm test -- -u
```

```bash
# E2E tests
npx cypress open    # Interactive mode
npx cypress run     # Headless mode
```

### Test Coverage Requirements

- **Overall**: Minimum 80% coverage
- **Critical paths** (auth, payments): Minimum 95% coverage
- **Utilities**: Minimum 90% coverage
- **UI components**: Minimum 70% coverage

### Coverage Report

```bash
# Generate coverage report
npm run test:coverage

# View HTML report
open coverage/lcov-report/index.html
```

---

## Manual Testing

### Manual Test Checklist

Use this checklist for each story before marking as "done":

```markdown
### Manual Testing Checklist

**Functionality**:
- [ ] All acceptance criteria met
- [ ] Feature works as expected
- [ ] No console errors
- [ ] No network errors

**UI/UX**:
- [ ] Layout looks correct
- [ ] Responsive on mobile (375px)
- [ ] Responsive on tablet (768px)
- [ ] Responsive on desktop (1920px)
- [ ] Loading states work
- [ ] Error states work
- [ ] Success states work
- [ ] All text readable
- [ ] No UI glitches

**Cross-Browser** (test on):
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

**Accessibility**:
- [ ] Keyboard navigation works
- [ ] Screen reader friendly
- [ ] Sufficient color contrast
- [ ] Focus indicators visible
- [ ] ARIA labels present

**Security**:
- [ ] Sensitive data not in URL
- [ ] HTTPS used
- [ ] Tokens stored securely
- [ ] XSS protection working
- [ ] CSRF protection working

**Performance**:
- [ ] Page loads in < 2 seconds
- [ ] API responses in < 200ms
- [ ] No memory leaks
- [ ] Images optimized

**Data**:
- [ ] Data persists correctly
- [ ] Data validates correctly
- [ ] Error messages clear
- [ ] Success messages clear
```

### Exploratory Testing

Spend 15-30 minutes trying to "break" the feature:

1. **Invalid inputs**: Try unexpected data
2. **Boundary values**: Test min/max values
3. **Race conditions**: Click buttons rapidly
4. **Network issues**: Disable network mid-request
5. **Browser back/forward**: Test navigation
6. **Multiple tabs**: Test concurrent sessions
7. **Session timeout**: Let session expire
8. **Browser refresh**: Refresh during operations

Document any issues found!

---

## Edge Cases

Edge cases are scenarios outside normal flow. Every feature should handle these.

### Common Edge Cases

#### Authentication Edge Cases

1. **Empty Credentials**
   - Test: Submit login with empty email/password
   - Expected: Validation error, form not submitted

2. **Very Long Password** (500+ characters)
   - Test: Enter 1000 character password
   - Expected: Either accept and hash, or show max length error

3. **Special Characters in Email**
   - Test: Use email like `user+tag@example.com`
   - Expected: Accept as valid email

4. **Concurrent Login Attempts**
   - Test: Submit login form twice rapidly
   - Expected: Second request should be debounced or handled gracefully

5. **Token Expiration During Request**
   - Test: Make API call with token that expires mid-request
   - Expected: 401 error, redirect to login

6. **Browser Back After Logout**
   - Test: Logout, then press browser back button
   - Expected: Redirect to login, don't show protected page

7. **XSS in Input Fields**
   - Test: Enter `<script>alert('xss')</script>` in email field
   - Expected: Sanitized, no script execution

8. **SQL Injection Attempt**
   - Test: Enter `' OR '1'='1` in password field
   - Expected: Treated as literal string, no SQL execution

#### Email Edge Cases

1. **Email Service Down**
   - Test: Disable email service
   - Expected: User created, but email queued for retry

2. **Invalid Email Format**
   - Test: Enter `notanemail`
   - Expected: Validation error before submission

3. **Verification Link Clicked Twice**
   - Test: Click email verification link twice
   - Expected: Second click shows "Already verified"

4. **Expired Verification Token**
   - Test: Click verification link after 24 hours
   - Expected: Error message, option to resend

#### Database Edge Cases

1. **Database Connection Lost**
   - Test: Stop database mid-request
   - Expected: 500 error with retry mechanism

2. **Unique Constraint Violation**
   - Test: Two simultaneous registrations with same email
   - Expected: One succeeds, other gets conflict error

3. **Transaction Rollback**
   - Test: Cause error mid-transaction
   - Expected: All changes rolled back, data consistent

---

## Test Data Management

### Test Users

Create consistent test users for different scenarios:

```javascript
// backend/tests/fixtures/users.js
module.exports = {
  validUser: {
    email: 'valid@example.com',
    password: 'ValidPass123!',
    name: 'Valid User'
  },

  unverifiedUser: {
    email: 'unverified@example.com',
    password: 'ValidPass123!',
    emailVerified: false
  },

  adminUser: {
    email: 'admin@example.com',
    password: 'AdminPass123!',
    role: 'admin'
  },

  lockedUser: {
    email: 'locked@example.com',
    password: 'ValidPass123!',
    locked: true,
    lockReason: 'Too many failed login attempts'
  }
};
```

### Database Seeding

```bash
# Seed test database
npm run db:seed:test

# Reset test database
npm run db:reset:test
```

### Test Database Setup

```javascript
// backend/tests/setup.js
beforeAll(async () => {
  // Connect to test database
  await database.connect(process.env.TEST_DATABASE_URL);

  // Run migrations
  await database.migrate();

  // Seed test data
  await database.seed();
});

afterAll(async () => {
  // Clean up
  await database.truncate();
  await database.disconnect();
});

beforeEach(async () => {
  // Reset data before each test
  await database.truncate(['users', 'sessions']);
});
```

---

## Testing Workflows

### Story Testing Workflow

```
1. Developer completes code
   ↓
2. Run automated tests locally
   ↓
3. Fix any failing tests
   ↓
4. Run manual test checklist
   ↓
5. Document test results in PROJECT_ROADMAP.md
   ↓
6. Push to feature branch
   ↓
7. CI/CD runs automated tests
   ↓
8. Create PR to staging
   ↓
9. Code review + test review
   ↓
10. Merge to staging
   ↓
11. Deploy to staging environment
   ↓
12. Run full test suite on staging
   ↓
13. Exploratory testing on staging
   ↓
14. Document staging test results
   ↓
15. If all pass → ready for production
```

---

## Test Reporting

### Test Results Template

```markdown
## Test Results: Story X.X

**Test Date**: 2025-11-05
**Tester**: Developer Name
**Environment**: Staging
**Build**: v1.0.0-abc123f

### Automated Tests
- Unit Tests: ✅ 45/45 passed
- Integration Tests: ✅ 23/23 passed
- Component Tests: ✅ 18/18 passed
- E2E Tests: ✅ 12/12 passed
- Coverage: 87%

### Manual Tests
- Test Case TC-3.1-01: ✅ Pass
- Test Case TC-3.1-02: ✅ Pass
- Test Case TC-3.1-03: ✅ Pass

### BDD Scenarios
- Scenario 1: ✅ Pass
- Scenario 2: ✅ Pass
- Scenario 3: ✅ Pass

### Edge Cases
- Empty credentials: ✅ Handled
- Long password: ✅ Handled
- Special chars: ✅ Handled
- XSS attempt: ✅ Blocked

### Issues Found
1. ~~Minor: Success message appears too briefly~~ (Fixed in commit abc123)

### Approval
- [ ] All tests passed
- [ ] Ready for production

**Approved by**: _____________
**Date**: _____________
```

---

## Best Practices

1. **Write tests first** - TDD approach when possible
2. **Test behavior, not implementation** - Focus on what, not how
3. **One assertion per test** - Makes failures easier to debug
4. **Descriptive test names** - Should read like documentation
5. **Arrange-Act-Assert** - Structure tests consistently
6. **Don't test framework code** - Test your code, not React/Express
7. **Mock external dependencies** - Use mocks for APIs, databases in unit tests
8. **Clean up after tests** - Reset state, close connections
9. **Run tests often** - Every commit, every PR
10. **Maintain test code** - Treat tests as production code

---

## Additional Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Supertest](https://github.com/visionmedia/supertest)
- [Cypress](https://www.cypress.io/)
- [BDD with Cucumber](https://cucumber.io/)

---

*Last Updated: November 5, 2025*
