#!/bin/bash

# Phase 2 Comprehensive Test Suite
# Tests Database Schema & Core Models (Stories 2.1 - 2.4)

echo "=========================================================="
echo "   PHASE 2 COMPREHENSIVE TEST SUITE"
echo "   Authentication System Project"
echo "   Database Schema & Core Models"
echo "=========================================================="
echo ""

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0
TOTAL=0

# Function to run a test
run_test() {
    local test_name=$1
    local test_command=$2

    TOTAL=$((TOTAL + 1))
    echo -n "[$TOTAL] Testing: $test_name... "

    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASS${NC}"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

echo "=========================================================="
echo "TEST CATEGORY 1: Database Tables Existence (Story 2.1-2.4)"
echo "=========================================================="
echo ""

run_test "Users table exists" "docker exec auth-postgres psql -U postgres -d authdb -c '\\dt' | grep -q users"
run_test "Sessions table exists" "docker exec auth-postgres psql -U postgres -d authdb -c '\\dt' | grep -q sessions"
run_test "OAuth accounts table exists" "docker exec auth-postgres psql -U postgres -d authdb -c '\\dt' | grep -q oauth_accounts"
run_test "MFA secrets table exists" "docker exec auth-postgres psql -U postgres -d authdb -c '\\dt' | grep -q mfa_secrets"

echo ""
echo "=========================================================="
echo "TEST CATEGORY 2: Users Table Schema (Story 2.1)"
echo "=========================================================="
echo ""

run_test "Users table has id column" "docker exec auth-postgres psql -U postgres -d authdb -c '\\d users' | grep -q 'id.*integer'"
run_test "Users table has username column" "docker exec auth-postgres psql -U postgres -d authdb -c '\\d users' | grep -q 'username'"
run_test "Users table has email column" "docker exec auth-postgres psql -U postgres -d authdb -c '\\d users' | grep -q 'email'"
run_test "Users table has password_hash column" "docker exec auth-postgres psql -U postgres -d authdb -c '\\d users' | grep -q 'password_hash'"
run_test "Users table has email_verified column" "docker exec auth-postgres psql -U postgres -d authdb -c '\\d users' | grep -q 'email_verified'"
run_test "Users table has role column" "docker exec auth-postgres psql -U postgres -d authdb -c '\\d users' | grep -q 'role'"
run_test "Users table has created_at column" "docker exec auth-postgres psql -U postgres -d authdb -c '\\d users' | grep -q 'created_at'"
run_test "Users table has updated_at column" "docker exec auth-postgres psql -U postgres -d authdb -c '\\d users' | grep -q 'updated_at'"

echo ""
echo "=========================================================="
echo "TEST CATEGORY 3: Users Table Constraints"
echo "=========================================================="
echo ""

run_test "Users email has unique constraint" "docker exec auth-postgres psql -U postgres -d authdb -c '\\d users' | grep -q 'users_email_unique'"
run_test "Users username has unique constraint" "docker exec auth-postgres psql -U postgres -d authdb -c '\\d users' | grep -q 'users_username_unique'"
run_test "Users table has primary key" "docker exec auth-postgres psql -U postgres -d authdb -c '\\d users' | grep -q 'PRIMARY KEY'"

echo ""
echo "=========================================================="
echo "TEST CATEGORY 4: OAuth Refactoring Verification (Story 2.3)"
echo "=========================================================="
echo ""

run_test "Users table does NOT have google_id column" "! docker exec auth-postgres psql -U postgres -d authdb -c '\\d users' | grep -q 'google_id'"
run_test "Users table does NOT have github_id column" "! docker exec auth-postgres psql -U postgres -d authdb -c '\\d users' | grep -q 'github_id'"

echo ""
echo "=========================================================="
echo "TEST CATEGORY 5: MFA Refactoring Verification (Story 2.4)"
echo "=========================================================="
echo ""

run_test "Users table does NOT have mfa_enabled column" "! docker exec auth-postgres psql -U postgres -d authdb -c '\\d users' | grep -E '^\s+mfa_enabled'"
run_test "Users table does NOT have mfa_secret column" "! docker exec auth-postgres psql -U postgres -d authdb -c '\\d users' | grep -E '^\s+mfa_secret'"
run_test "Users table does NOT have mfa_backup_codes column" "! docker exec auth-postgres psql -U postgres -d authdb -c '\\d users' | grep -E '^\s+mfa_backup_codes'"

echo ""
echo "=========================================================="
echo "TEST CATEGORY 6: Sessions Table Schema (Story 2.2)"
echo "=========================================================="
echo ""

run_test "Sessions table has id column" "docker exec auth-postgres psql -U postgres -d authdb -c '\\d sessions' | grep -q 'id.*integer'"
run_test "Sessions table has user_id column" "docker exec auth-postgres psql -U postgres -d authdb -c '\\d sessions' | grep -q 'user_id'"
run_test "Sessions table has refresh_token column" "docker exec auth-postgres psql -U postgres -d authdb -c '\\d sessions' | grep -q 'refresh_token'"
run_test "Sessions table has expires_at column" "docker exec auth-postgres psql -U postgres -d authdb -c '\\d sessions' | grep -q 'expires_at'"
run_test "Sessions table has ip_address column" "docker exec auth-postgres psql -U postgres -d authdb -c '\\d sessions' | grep -q 'ip_address'"
run_test "Sessions table has user_agent column" "docker exec auth-postgres psql -U postgres -d authdb -c '\\d sessions' | grep -q 'user_agent'"
run_test "Sessions table has is_active column" "docker exec auth-postgres psql -U postgres -d authdb -c '\\d sessions' | grep -q 'is_active'"
run_test "Sessions table has foreign key to users" "docker exec auth-postgres psql -U postgres -d authdb -c '\\d sessions' | grep -q 'sessions_user_id_foreign'"

echo ""
echo "=========================================================="
echo "TEST CATEGORY 7: OAuth Accounts Table Schema (Story 2.3)"
echo "=========================================================="
echo ""

run_test "OAuth accounts table has id column" "docker exec auth-postgres psql -U postgres -d authdb -c '\\d oauth_accounts' | grep -q 'id.*integer'"
run_test "OAuth accounts table has user_id column" "docker exec auth-postgres psql -U postgres -d authdb -c '\\d oauth_accounts' | grep -q 'user_id'"
run_test "OAuth accounts table has provider column" "docker exec auth-postgres psql -U postgres -d authdb -c '\\d oauth_accounts' | grep -q 'provider'"
run_test "OAuth accounts table has provider_user_id column" "docker exec auth-postgres psql -U postgres -d authdb -c '\\d oauth_accounts' | grep -q 'provider_user_id'"
run_test "OAuth accounts table has email column" "docker exec auth-postgres psql -U postgres -d authdb -c '\\d oauth_accounts' | grep -q 'email'"
run_test "OAuth accounts table has access_token column" "docker exec auth-postgres psql -U postgres -d authdb -c '\\d oauth_accounts' | grep -q 'access_token'"
run_test "OAuth accounts table has profile_data column" "docker exec auth-postgres psql -U postgres -d authdb -c '\\d oauth_accounts' | grep -q 'profile_data'"
run_test "OAuth accounts table has foreign key to users" "docker exec auth-postgres psql -U postgres -d authdb -c '\\d oauth_accounts' | grep -q 'oauth_accounts_user_id_foreign'"

echo ""
echo "=========================================================="
echo "TEST CATEGORY 8: OAuth Accounts Constraints"
echo "=========================================================="
echo ""

run_test "OAuth accounts has unique constraint on provider+provider_user_id" "docker exec auth-postgres psql -U postgres -d authdb -c '\\d oauth_accounts' | grep -q 'oauth_accounts_provider_provider_user_id_unique'"

echo ""
echo "=========================================================="
echo "TEST CATEGORY 9: MFA Secrets Table Schema (Story 2.4)"
echo "=========================================================="
echo ""

run_test "MFA secrets table has id column" "docker exec auth-postgres psql -U postgres -d authdb -c '\\d mfa_secrets' | grep -q 'id.*integer'"
run_test "MFA secrets table has user_id column" "docker exec auth-postgres psql -U postgres -d authdb -c '\\d mfa_secrets' | grep -q 'user_id'"
run_test "MFA secrets table has secret column" "docker exec auth-postgres psql -U postgres -d authdb -c '\\d mfa_secrets' | grep -q 'secret'"
run_test "MFA secrets table has backup_codes column" "docker exec auth-postgres psql -U postgres -d authdb -c '\\d mfa_secrets' | grep -q 'backup_codes'"
run_test "MFA secrets table has enabled column" "docker exec auth-postgres psql -U postgres -d authdb -c '\\d mfa_secrets' | grep -q 'enabled'"
run_test "MFA secrets table has enabled_at column" "docker exec auth-postgres psql -U postgres -d authdb -c '\\d mfa_secrets' | grep -q 'enabled_at'"
run_test "MFA secrets table has failed_attempts column" "docker exec auth-postgres psql -U postgres -d authdb -c '\\d mfa_secrets' | grep -q 'failed_attempts'"
run_test "MFA secrets table has locked_until column" "docker exec auth-postgres psql -U postgres -d authdb -c '\\d mfa_secrets' | grep -q 'locked_until'"
run_test "MFA secrets table has foreign key to users" "docker exec auth-postgres psql -U postgres -d authdb -c '\\d mfa_secrets' | grep -q 'mfa_secrets_user_id_foreign'"

echo ""
echo "=========================================================="
echo "TEST CATEGORY 10: MFA Secrets Constraints"
echo "=========================================================="
echo ""

run_test "MFA secrets has unique constraint on user_id" "docker exec auth-postgres psql -U postgres -d authdb -c '\\d mfa_secrets' | grep -q 'mfa_secrets_user_id_unique'"

echo ""
echo "=========================================================="
echo "TEST CATEGORY 11: Data Insertion Tests"
echo "=========================================================="
echo ""

# Test user insertion
run_test "Can insert user with valid data" "docker exec auth-postgres psql -U postgres -d authdb -c \"INSERT INTO users (username, email, password_hash) VALUES ('testuser', 'test@example.com', 'hash123') RETURNING id\" | grep -q '1 row'"

# Get the user ID for foreign key tests
USER_ID=$(docker exec auth-postgres psql -U postgres -d authdb -t -c "SELECT id FROM users WHERE email='test@example.com';" | xargs)

run_test "Can insert session for user" "docker exec auth-postgres psql -U postgres -d authdb -c \"INSERT INTO sessions (user_id, refresh_token, expires_at) VALUES ($USER_ID, 'token123', NOW() + INTERVAL '7 days') RETURNING id\" | grep -q '1 row'"

run_test "Can insert OAuth account for user" "docker exec auth-postgres psql -U postgres -d authdb -c \"INSERT INTO oauth_accounts (user_id, provider, provider_user_id) VALUES ($USER_ID, 'google', 'google123') RETURNING id\" | grep -q '1 row'"

run_test "Can insert MFA secret for user" "docker exec auth-postgres psql -U postgres -d authdb -c \"INSERT INTO mfa_secrets (user_id, secret, backup_codes) VALUES ($USER_ID, 'secret123', '[\\\"code1\\\", \\\"code2\\\"]'::json) RETURNING id\" | grep -q '1 row'"

echo ""
echo "=========================================================="
echo "TEST CATEGORY 12: Constraint Violation Tests"
echo "=========================================================="
echo ""

run_test "Duplicate email is rejected" "docker exec auth-postgres psql -U postgres -d authdb -c \"INSERT INTO users (username, email, password_hash) VALUES ('testuser2', 'test@example.com', 'hash456')\" 2>&1 | grep -q 'duplicate key'"

run_test "Duplicate username is rejected" "docker exec auth-postgres psql -U postgres -d authdb -c \"INSERT INTO users (username, email, password_hash) VALUES ('testuser', 'test2@example.com', 'hash456')\" 2>&1 | grep -q 'duplicate key'"

run_test "Duplicate OAuth provider account is rejected" "docker exec auth-postgres psql -U postgres -d authdb -c \"INSERT INTO oauth_accounts (user_id, provider, provider_user_id) VALUES ($USER_ID, 'google', 'google123')\" 2>&1 | grep -q 'duplicate key'"

run_test "Duplicate MFA secret for same user is rejected" "docker exec auth-postgres psql -U postgres -d authdb -c \"INSERT INTO mfa_secrets (user_id, secret, backup_codes) VALUES ($USER_ID, 'secret456', '[\\\"code3\\\"]'::json)\" 2>&1 | grep -q 'duplicate key'"

echo ""
echo "=========================================================="
echo "TEST CATEGORY 13: Foreign Key Relationship Tests"
echo "=========================================================="
echo ""

run_test "Cannot insert session with invalid user_id" "docker exec auth-postgres psql -U postgres -d authdb -c \"INSERT INTO sessions (user_id, refresh_token, expires_at) VALUES (99999, 'token456', NOW() + INTERVAL '7 days')\" 2>&1 | grep -q 'violates foreign key'"

run_test "Cannot insert OAuth account with invalid user_id" "docker exec auth-postgres psql -U postgres -d authdb -c \"INSERT INTO oauth_accounts (user_id, provider, provider_user_id) VALUES (99999, 'github', 'github123')\" 2>&1 | grep -q 'violates foreign key'"

run_test "Cannot insert MFA secret with invalid user_id" "docker exec auth-postgres psql -U postgres -d authdb -c \"INSERT INTO mfa_secrets (user_id, secret, backup_codes) VALUES (99999, 'secret789', '[\\\"code4\\\"]'::json)\" 2>&1 | grep -q 'violates foreign key'"

echo ""
echo "=========================================================="
echo "TEST CATEGORY 14: CASCADE Delete Tests"
echo "=========================================================="
echo ""

# Count related records before deletion
SESSION_COUNT=$(docker exec auth-postgres psql -U postgres -d authdb -t -c "SELECT COUNT(*) FROM sessions WHERE user_id=$USER_ID;" | xargs)
OAUTH_COUNT=$(docker exec auth-postgres psql -U postgres -d authdb -t -c "SELECT COUNT(*) FROM oauth_accounts WHERE user_id=$USER_ID;" | xargs)
MFA_COUNT=$(docker exec auth-postgres psql -U postgres -d authdb -t -c "SELECT COUNT(*) FROM mfa_secrets WHERE user_id=$USER_ID;" | xargs)

run_test "User has related sessions before deletion" "[ $SESSION_COUNT -gt 0 ]"
run_test "User has related OAuth accounts before deletion" "[ $OAUTH_COUNT -gt 0 ]"
run_test "User has related MFA secrets before deletion" "[ $MFA_COUNT -gt 0 ]"

# Delete the user
docker exec auth-postgres psql -U postgres -d authdb -c "DELETE FROM users WHERE id=$USER_ID;" > /dev/null 2>&1

# Check CASCADE delete worked
SESSION_COUNT_AFTER=$(docker exec auth-postgres psql -U postgres -d authdb -t -c "SELECT COUNT(*) FROM sessions WHERE user_id=$USER_ID;" | xargs)
OAUTH_COUNT_AFTER=$(docker exec auth-postgres psql -U postgres -d authdb -t -c "SELECT COUNT(*) FROM oauth_accounts WHERE user_id=$USER_ID;" | xargs)
MFA_COUNT_AFTER=$(docker exec auth-postgres psql -U postgres -d authdb -t -c "SELECT COUNT(*) FROM mfa_secrets WHERE user_id=$USER_ID;" | xargs)

run_test "Sessions CASCADE deleted when user deleted" "[ $SESSION_COUNT_AFTER -eq 0 ]"
run_test "OAuth accounts CASCADE deleted when user deleted" "[ $OAUTH_COUNT_AFTER -eq 0 ]"
run_test "MFA secrets CASCADE deleted when user deleted" "[ $MFA_COUNT_AFTER -eq 0 ]"

echo ""
echo "=========================================================="
echo "TEST CATEGORY 15: Migration Status"
echo "=========================================================="
echo ""

run_test "Migration 20251106000001 (users) applied" "docker exec auth-postgres psql -U postgres -d authdb -c 'SELECT * FROM knex_migrations' | grep -q '20251106000001'"
run_test "Migration 20251106000002 (sessions) applied" "docker exec auth-postgres psql -U postgres -d authdb -c 'SELECT * FROM knex_migrations' | grep -q '20251106000002'"
run_test "Migration 20251106000003 (oauth_accounts) applied" "docker exec auth-postgres psql -U postgres -d authdb -c 'SELECT * FROM knex_migrations' | grep -q '20251106000003'"
run_test "Migration 20251106000004 (remove OAuth from users) applied" "docker exec auth-postgres psql -U postgres -d authdb -c 'SELECT * FROM knex_migrations' | grep -q '20251106000004'"
run_test "Migration 20251106000005 (mfa_secrets) applied" "docker exec auth-postgres psql -U postgres -d authdb -c 'SELECT * FROM knex_migrations' | grep -q '20251106000005'"
run_test "Migration 20251106000006 (remove MFA from users) applied" "docker exec auth-postgres psql -U postgres -d authdb -c 'SELECT * FROM knex_migrations' | grep -q '20251106000006'"

echo ""
echo "=========================================================="
echo "   FINAL TEST RESULTS"
echo "=========================================================="
echo ""
echo -e "Total Tests: ${YELLOW}$TOTAL${NC}"
echo -e "Passed:      ${GREEN}$PASSED${NC}"
echo -e "Failed:      ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ ALL TESTS PASSED!${NC}"
    echo "Phase 2 database schema is fully operational."
    echo ""
    echo "Schema Summary:"
    echo "  ✓ Users table (core user data)"
    echo "  ✓ Sessions table (refresh tokens)"
    echo "  ✓ OAuth accounts table (social login)"
    echo "  ✓ MFA secrets table (two-factor auth)"
    echo "  ✓ All foreign keys working"
    echo "  ✓ All constraints enforced"
    echo "  ✓ CASCADE delete verified"
    echo ""
    echo "Ready for Phase 3: Basic JWT Authentication"
    exit 0
else
    echo -e "${RED}✗ SOME TESTS FAILED${NC}"
    echo "Please review the failed tests above."
    echo ""
    echo "Common issues:"
    echo "  - Migrations not applied (run: npm run migrate)"
    echo "  - Database not running (run: docker-compose up -d)"
    echo "  - Previous test data interfering (clean database)"
    exit 1
fi
