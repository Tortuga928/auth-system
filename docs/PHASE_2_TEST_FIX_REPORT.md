# Phase 2 Test Suite Fix Report

**Date**: November 6, 2025
**Author**: Claude (AI Assistant)
**Issue**: 8 out of 70 tests failing (88.6% pass rate)
**Resolution**: Fixed test logic - 100% pass rate achieved (70/70 tests)

---

## Executive Summary

The Phase 2 test suite initially had 8 failing tests due to incorrect test logic. All failures were in negative assertion tests (checking that errors occur when they should). The fixes involved:

1. **More specific grep patterns** for column name matching
2. **Removing incorrect negation operators** from error detection tests

After fixes: **70/70 tests passing (100%)**

---

## Failed Tests Analysis

### Original Failures

| Test # | Test Name | Category | Root Cause |
|--------|-----------|----------|------------|
| 19 | Users table does NOT have mfa_secret column | MFA Refactoring | Grep pattern too broad - matched foreign key constraint name |
| 52 | Duplicate email is rejected | Constraint Violations | Negation operator inverted test logic |
| 53 | Duplicate username is rejected | Constraint Violations | Negation operator inverted test logic |
| 54 | Duplicate OAuth provider account is rejected | Constraint Violations | Negation operator inverted test logic |
| 55 | Duplicate MFA secret for same user is rejected | Constraint Violations | Negation operator inverted test logic |
| 56 | Cannot insert session with invalid user_id | Foreign Key Tests | Negation operator inverted test logic |
| 57 | Cannot insert OAuth account with invalid user_id | Foreign Key Tests | Negation operator inverted test logic |
| 58 | Cannot insert MFA secret with invalid user_id | Foreign Key Tests | Negation operator inverted test logic |

---

## Issue 1: Test 19 - False Positive Column Match

### Problem

**Original test (line 93)**:
```bash
run_test "Users table does NOT have mfa_secret column" \
  "! docker exec auth-postgres psql -U postgres -d authdb -c '\\d users' | grep -q 'mfa_secret'"
```

**Why it failed**:
The grep pattern `'mfa_secret'` was matching the foreign key constraint name `mfa_secrets_user_id_foreign` in the `\d users` output, not a column name.

**Investigation**:
```bash
$ docker exec auth-postgres psql -U postgres -d authdb -c '\d users' | grep 'mfa_secret'
TABLE "mfa_secrets" CONSTRAINT "mfa_secrets_user_id_foreign" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
```

The foreign key to the `mfa_secrets` table contains "mfa_secret" in its constraint name.

### Solution

**Fixed test (line 93)**:
```bash
run_test "Users table does NOT have mfa_secret column" \
  "! docker exec auth-postgres psql -U postgres -d authdb -c '\\d users' | grep -E '^\s+mfa_secret'"
```

**What changed**:
- Changed from `-q 'mfa_secret'` to `-E '^\s+mfa_secret'`
- Uses extended regex to match only lines starting with whitespace + column name
- This pattern matches column definitions but not foreign key constraint names

**Result**: Test now correctly identifies that the `mfa_secret` column does NOT exist

---

## Issue 2: Tests 52-55 - Inverted Constraint Violation Logic

### Problem

**Original tests (lines 182-188)**:
```bash
run_test "Duplicate email is rejected" \
  "! docker exec auth-postgres psql ... 2>&1 | grep -q 'duplicate key'"
```

**Why it failed**:
- The INSERT command fails (exit code 1) with error: "duplicate key value violates unique constraint"
- The `2>&1` redirects stderr to stdout
- The grep searches for "duplicate key" in the output
- **If grep FINDS "duplicate key", it returns 0 (success)**
- The `!` operator NEGATES the 0 to 1, **making the test FAIL**

This is backwards! We WANT the test to pass when it finds the error message.

**Investigation**:
```bash
$ docker exec auth-postgres psql -U postgres -d authdb \
  -c "INSERT INTO users (username, email, password_hash) VALUES ('dupe2', 'dupe@example.com', 'hash457')" 2>&1

ERROR:  duplicate key value violates unique constraint "users_email_unique"
DETAIL:  Key (email)=(dupe@example.com) already exists.
Exit code: 1
```

The error message clearly contains "duplicate key". The grep finds it and returns 0. The `!` inverts it to 1 (fail).

### Solution

**Fixed tests (lines 182-188)**:
```bash
run_test "Duplicate email is rejected" \
  "docker exec auth-postgres psql ... 2>&1 | grep -q 'duplicate key'"
```

**What changed**:
- **Removed the `!` operator**
- Now the test passes when grep FINDS "duplicate key" (which is what we want)

**Result**: Tests correctly verify that duplicate constraints are enforced

---

## Issue 3: Tests 56-58 - Inverted Foreign Key Logic

### Problem

**Original tests (lines 196-200)**:
```bash
run_test "Cannot insert session with invalid user_id" \
  "! docker exec auth-postgres psql ... 2>&1 | grep -q 'violates foreign key'"
```

**Why it failed**:
Same logic issue as Issue 2 - the `!` operator inverted the test logic.

**Investigation**:
```bash
$ docker exec auth-postgres psql -U postgres -d authdb \
  -c "INSERT INTO sessions (user_id, refresh_token, expires_at) VALUES (99999, 'token456', NOW() + INTERVAL '7 days')" 2>&1

ERROR:  insert or update on table "sessions" violates foreign key constraint "sessions_user_id_foreign"
DETAIL:  Key (user_id)=(99999) is not present in table "users".
Exit code: 1
```

The error message clearly contains "violates foreign key". The grep finds it and returns 0. The `!` inverts it to 1 (fail).

### Solution

**Fixed tests (lines 196-200)**:
```bash
run_test "Cannot insert session with invalid user_id" \
  "docker exec auth-postgres psql ... 2>&1 | grep -q 'violates foreign key'"
```

**What changed**:
- **Removed the `!` operator**
- Now the test passes when grep FINDS "violates foreign key" (which is what we want)

**Result**: Tests correctly verify that foreign key constraints are enforced

---

## Technical Deep Dive: Bash Pipeline Exit Codes

### Understanding the Issue

In bash, when you use a pipeline like `command1 | command2`, the exit code is determined by:
- **Default behavior**: Exit code of the LAST command in the pipeline
- **With `set -o pipefail`**: Exit code of the first failing command

Our tests don't use `set -o pipefail`, so the exit code is from the LAST command (grep).

### Example Flow

```bash
# Test command:
! docker exec auth-postgres psql ... 2>&1 | grep -q 'duplicate key'

# Execution flow:
1. docker exec ... INSERT (fails with exit 1)
2. stderr "ERROR: duplicate key..." redirected to stdout
3. grep -q 'duplicate key' searches the output
4. grep FINDS "duplicate key" and returns 0 (success)
5. ! operator negates 0 to 1 (failure)
6. Test FAILS (even though the constraint IS working)
```

### Why Removing `!` Fixes It

```bash
# Fixed test command:
docker exec auth-postgres psql ... 2>&1 | grep -q 'duplicate key'

# Execution flow:
1. docker exec ... INSERT (fails with exit 1)
2. stderr "ERROR: duplicate key..." redirected to stdout
3. grep -q 'duplicate key' searches the output
4. grep FINDS "duplicate key" and returns 0 (success)
5. Test PASSES (constraint is working correctly)
```

---

## Files Modified

### scripts/test-phase-2.sh

**Total changes**: 11 lines modified

**Changes by category**:

1. **MFA Column Tests (3 lines)**: Lines 92-94
   - Changed grep pattern from `-q 'column_name'` to `-E '^\s+column_name'`
   - Kept the `!` operator (these ARE negative tests)

2. **Duplicate Key Tests (4 lines)**: Lines 182-188
   - Removed `!` operator from duplicate email test
   - Removed `!` operator from duplicate username test
   - Removed `!` operator from duplicate OAuth account test
   - Removed `!` operator from duplicate MFA secret test

3. **Foreign Key Tests (3 lines)**: Lines 196-200
   - Removed `!` operator from invalid session user_id test
   - Removed `!` operator from invalid OAuth account user_id test
   - Removed `!` operator from invalid MFA secret user_id test

---

## Test Results

### Before Fixes

```
Total Tests: 70
Passed:      62
Failed:      8

Test Pass Rate: 88.6%
```

### After Fixes

```
Total Tests: 70
Passed:      70
Failed:      0

Test Pass Rate: 100% ✓
```

---

## Verification

All test categories now pass:

✓ **Category 1**: Database Tables Existence (4/4)
✓ **Category 2**: Users Table Schema (8/8)
✓ **Category 3**: Users Table Constraints (3/3)
✓ **Category 4**: OAuth Refactoring Verification (2/2)
✓ **Category 5**: MFA Refactoring Verification (3/3)
✓ **Category 6**: Sessions Table Schema (8/8)
✓ **Category 7**: OAuth Accounts Table Schema (8/8)
✓ **Category 8**: OAuth Accounts Constraints (1/1)
✓ **Category 9**: MFA Secrets Table Schema (9/9)
✓ **Category 10**: MFA Secrets Constraints (1/1)
✓ **Category 11**: Data Insertion Tests (4/4)
✓ **Category 12**: Constraint Violation Tests (4/4)
✓ **Category 13**: Foreign Key Relationship Tests (3/3)
✓ **Category 14**: CASCADE Delete Tests (6/6)
✓ **Category 15**: Migration Status (6/6)

---

## Lessons Learned

### 1. Bash Pipeline Exit Codes
When testing error conditions, understand that `command1 | command2` returns the exit code of `command2`, not `command1`.

### 2. Negative Assertions
For tests checking that an error occurs:
- **Correct**: `command 2>&1 | grep -q 'error message'`
- **Incorrect**: `! command 2>&1 | grep -q 'error message'`

The grep finding the error IS the success condition.

### 3. Grep Pattern Specificity
When checking for column absence, use specific patterns:
- **Too broad**: `grep -q 'column_name'` (matches anywhere)
- **Better**: `grep -E '^\s+column_name'` (matches column definitions only)

### 4. Test Investigation Process
1. Run failing test manually
2. Capture actual error output
3. Verify grep pattern matches
4. Trace exit code flow through pipeline
5. Fix logic accordingly

---

## Conclusion

The Phase 2 database schema is **fully verified and operational**. All 70 tests pass, confirming:

- ✓ All 4 tables exist with correct schema
- ✓ OAuth and MFA columns removed from users table
- ✓ All foreign key relationships working
- ✓ All unique constraints enforced
- ✓ CASCADE delete behavior verified
- ✓ All 6 migrations applied successfully

**Phase 2 is complete and ready for Phase 3: Basic JWT Authentication**

---

## Next Steps

1. ✅ Commit fixed test script
2. ✅ Update PROJECT_ROADMAP.md with test results
3. ⏭️ Proceed to Phase 3: Basic JWT Authentication
   - Story 3.1: JWT token generation & validation
   - Story 3.2: Password hashing with bcrypt
   - Story 3.3: User registration endpoint
   - Story 3.4: User login endpoint
   - Story 3.5: Token refresh mechanism
