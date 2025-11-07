#!/bin/bash

# Phase 3 Comprehensive Test Suite
# Tests Basic JWT Authentication (Stories 3.1 - 3.4)

echo "=========================================================="
echo "   PHASE 3 COMPREHENSIVE TEST SUITE"
echo "   Authentication System Project"
echo "   Basic JWT Authentication"
echo "=========================================================="
echo ""

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0
TOTAL=0

# Test results storage
declare -a FAILED_TESTS

# Function to run a test
run_test() {
    local test_name=$1
    local test_command=$2
    local category=$3

    TOTAL=$((TOTAL + 1))
    echo -n "[$TOTAL] Testing: $test_name... "

    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASS${NC}"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        FAILED=$((FAILED + 1))
        FAILED_TESTS+=("[$category] $test_name")
        return 1
    fi
}

# Function to run API test with detailed output
run_api_test() {
    local test_name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local expected_status=$5
    local expected_text=$6
    local category=$7

    TOTAL=$((TOTAL + 1))
    echo -n "[$TOTAL] API Test: $test_name... "

    # Make request and capture response
    if [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data" 2>&1)
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$endpoint" 2>&1)
    fi

    # Extract status code (last line) and body (everything before)
    status_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | head -n -1)

    # Check status code
    if [ "$status_code" = "$expected_status" ]; then
        # Check if response contains expected text (if provided)
        if [ -z "$expected_text" ] || echo "$body" | grep -q "$expected_text"; then
            echo -e "${GREEN}✓ PASS${NC} (HTTP $status_code)"
            PASSED=$((PASSED + 1))
            return 0
        else
            echo -e "${RED}✗ FAIL${NC} (HTTP $status_code, missing: $expected_text)"
            FAILED=$((FAILED + 1))
            FAILED_TESTS+=("[$category] $test_name - Expected text not found")
            return 1
        fi
    else
        echo -e "${RED}✗ FAIL${NC} (Expected $expected_status, got $status_code)"
        FAILED=$((FAILED + 1))
        FAILED_TESTS+=("[$category] $test_name - Wrong status code")
        return 1
    fi
}

# Cleanup function
cleanup_test_data() {
    echo -e "${BLUE}Cleaning up test data...${NC}"
    docker exec auth-postgres psql -U postgres -d authdb -c "DELETE FROM users WHERE email LIKE 'test%@example.com'" > /dev/null 2>&1
}

echo "=========================================================="
echo "TEST CATEGORY 1: Password Utilities (Story 3.1)"
echo "=========================================================="
echo ""

# These tests run via npm test in backend
cd /c/Users/MSTor/Projects/auth-system/backend

run_test "Password hashing module loads" "node -e \"require('./src/utils/password'); console.log('OK')\"" "Password Utils"
run_test "JWT module loads" "node -e \"require('./src/utils/jwt'); console.log('OK')\"" "JWT Utils"

echo ""
echo "=========================================================="
echo "TEST CATEGORY 2: Database Connection"
echo "=========================================================="
echo ""

run_test "PostgreSQL container is running" "docker ps | grep -q auth-postgres" "Database"
run_test "Database accepts connections" "docker exec auth-postgres psql -U postgres -d authdb -c 'SELECT 1' | grep -q '1 row'" "Database"
run_test "Users table exists" "docker exec auth-postgres psql -U postgres -d authdb -c '\\dt' | grep -q users" "Database"

echo ""
echo "=========================================================="
echo "TEST CATEGORY 3: Backend API Server"
echo "=========================================================="
echo ""

run_test "Backend container is running" "docker ps | grep -q auth-backend" "Backend"
run_test "Backend is healthy" "curl -s http://localhost:5000/health | grep -q 'healthy'" "Backend"
run_test "Backend returns JSON" "curl -s http://localhost:5000/ | grep -q 'Authentication System API'" "Backend"

echo ""
echo "=========================================================="
echo "TEST CATEGORY 4: User Registration (Story 3.2)"
echo "=========================================================="
echo ""

# Clean up before registration tests
cleanup_test_data

# Test 1: Valid registration
run_api_test \
    "Register with valid credentials" \
    "POST" \
    "http://localhost:5000/api/auth/register" \
    '{"username":"testuser1","email":"test1@example.com","password":"TestPass123!"}' \
    "201" \
    "success.*true" \
    "Registration"

# Test 2: Duplicate email
run_api_test \
    "Reject duplicate email" \
    "POST" \
    "http://localhost:5000/api/auth/register" \
    '{"username":"testuser2","email":"test1@example.com","password":"TestPass123!"}' \
    "409" \
    "Email already exists" \
    "Registration"

# Test 3: Duplicate username
run_api_test \
    "Reject duplicate username" \
    "POST" \
    "http://localhost:5000/api/auth/register" \
    '{"username":"testuser1","email":"test2@example.com","password":"TestPass123!"}' \
    "409" \
    "Username already exists" \
    "Registration"

# Test 4: Invalid email format
run_api_test \
    "Reject invalid email format" \
    "POST" \
    "http://localhost:5000/api/auth/register" \
    '{"username":"testuser3","email":"invalid-email","password":"TestPass123!"}' \
    "400" \
    "Invalid email format" \
    "Registration"

# Test 5: Weak password
run_api_test \
    "Reject weak password" \
    "POST" \
    "http://localhost:5000/api/auth/register" \
    '{"username":"testuser4","email":"test4@example.com","password":"weak"}' \
    "400" \
    "Password does not meet requirements" \
    "Registration"

# Test 6: Invalid username (too short)
run_api_test \
    "Reject short username" \
    "POST" \
    "http://localhost:5000/api/auth/register" \
    '{"username":"ab","email":"test5@example.com","password":"TestPass123!"}' \
    "400" \
    "Username must be 3-30 characters" \
    "Registration"

# Test 7: Missing fields
run_api_test \
    "Reject missing email" \
    "POST" \
    "http://localhost:5000/api/auth/register" \
    '{"username":"testuser6","password":"TestPass123!"}' \
    "400" \
    "required" \
    "Registration"

# Test 8: Registration returns tokens
run_api_test \
    "Registration returns JWT tokens" \
    "POST" \
    "http://localhost:5000/api/auth/register" \
    '{"username":"testuser7","email":"test7@example.com","password":"TestPass123!"}' \
    "201" \
    "accessToken.*refreshToken" \
    "Registration"

echo ""
echo "=========================================================="
echo "TEST CATEGORY 5: User Login (Story 3.3)"
echo "=========================================================="
echo ""

# Test 9: Valid login
run_api_test \
    "Login with valid credentials" \
    "POST" \
    "http://localhost:5000/api/auth/login" \
    '{"email":"test1@example.com","password":"TestPass123!"}' \
    "200" \
    "success.*true" \
    "Login"

# Test 10: Login returns tokens
run_api_test \
    "Login returns JWT tokens" \
    "POST" \
    "http://localhost:5000/api/auth/login" \
    '{"email":"test1@example.com","password":"TestPass123!"}' \
    "200" \
    "accessToken.*refreshToken" \
    "Login"

# Test 11: Invalid email
run_api_test \
    "Reject invalid email" \
    "POST" \
    "http://localhost:5000/api/auth/login" \
    '{"email":"nonexistent@example.com","password":"TestPass123!"}' \
    "401" \
    "Invalid email or password" \
    "Login"

# Test 12: Invalid password
run_api_test \
    "Reject invalid password" \
    "POST" \
    "http://localhost:5000/api/auth/login" \
    '{"email":"test1@example.com","password":"WrongPass123!"}' \
    "401" \
    "Invalid email or password" \
    "Login"

# Test 13: Missing fields
run_api_test \
    "Reject missing password" \
    "POST" \
    "http://localhost:5000/api/auth/login" \
    '{"email":"test1@example.com"}' \
    "400" \
    "required" \
    "Login"

echo ""
echo "=========================================================="
echo "TEST CATEGORY 6: JWT Token Format (Story 3.4)"
echo "=========================================================="
echo ""

# Capture a token from registration for format testing
echo -n "[$((TOTAL + 1))] Capturing JWT token for format tests... "
response=$(curl -s -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test1@example.com","password":"TestPass123!"}')

ACCESS_TOKEN=$(echo "$response" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
REFRESH_TOKEN=$(echo "$response" | grep -o '"refreshToken":"[^"]*"' | cut -d'"' -f4)

if [ -n "$ACCESS_TOKEN" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    TOTAL=$((TOTAL + 1))
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ FAIL${NC}"
    TOTAL=$((TOTAL + 1))
    FAILED=$((FAILED + 1))
    FAILED_TESTS+=("[JWT] Failed to capture token")
fi

# Test JWT format (3 parts separated by dots)
TOTAL=$((TOTAL + 1))
echo -n "[$TOTAL] JWT has correct format (3 parts)... "
if echo "$ACCESS_TOKEN" | grep -qE '^[^.]+\.[^.]+\.[^.]+$'; then
    echo -e "${GREEN}✓ PASS${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ FAIL${NC}"
    FAILED=$((FAILED + 1))
    FAILED_TESTS+=("[JWT] Token format invalid")
fi

# Test token is not empty
TOTAL=$((TOTAL + 1))
echo -n "[$TOTAL] Access token is not empty... "
if [ ${#ACCESS_TOKEN} -gt 50 ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ FAIL${NC}"
    FAILED=$((FAILED + 1))
    FAILED_TESTS+=("[JWT] Access token too short")
fi

TOTAL=$((TOTAL + 1))
echo -n "[$TOTAL] Refresh token is not empty... "
if [ ${#REFRESH_TOKEN} -gt 50 ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ FAIL${NC}"
    FAILED=$((FAILED + 1))
    FAILED_TESTS+=("[JWT] Refresh token too short")
fi

echo ""
echo "=========================================================="
echo "TEST CATEGORY 7: User Data Validation"
echo "=========================================================="
echo ""

# Test 14: Registration creates user in database
TOTAL=$((TOTAL + 1))
echo -n "[$TOTAL] User created in database... "
USER_COUNT=$(docker exec auth-postgres psql -U postgres -d authdb -t -c "SELECT COUNT(*) FROM users WHERE email='test1@example.com';" | xargs)
if [ "$USER_COUNT" = "1" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ FAIL${NC}"
    FAILED=$((FAILED + 1))
    FAILED_TESTS+=("[Database] User not created")
fi

# Test 15: Password is hashed
TOTAL=$((TOTAL + 1))
echo -n "[$TOTAL] Password is hashed (bcrypt)... "
PASSWORD_HASH=$(docker exec auth-postgres psql -U postgres -d authdb -t -c "SELECT password_hash FROM users WHERE email='test1@example.com';" | xargs)
if echo "$PASSWORD_HASH" | grep -qE '^\$2[aby]\$'; then
    echo -e "${GREEN}✓ PASS${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ FAIL${NC}"
    FAILED=$((FAILED + 1))
    FAILED_TESTS+=("[Security] Password not hashed with bcrypt")
fi

# Test 16: Email verified is false by default
TOTAL=$((TOTAL + 1))
echo -n "[$TOTAL] Email verified defaults to false... "
EMAIL_VERIFIED=$(docker exec auth-postgres psql -U postgres -d authdb -t -c "SELECT email_verified FROM users WHERE email='test1@example.com';" | xargs)
if [ "$EMAIL_VERIFIED" = "f" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ FAIL${NC}"
    FAILED=$((FAILED + 1))
    FAILED_TESTS+=("[Database] Email verified not defaulting to false")
fi

# Test 17: Role defaults to user
TOTAL=$((TOTAL + 1))
echo -n "[$TOTAL] Role defaults to 'user'... "
ROLE=$(docker exec auth-postgres psql -U postgres -d authdb -t -c "SELECT role FROM users WHERE email='test1@example.com';" | xargs)
if [ "$ROLE" = "user" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ FAIL${NC}"
    FAILED=$((FAILED + 1))
    FAILED_TESTS+=("[Database] Role not defaulting to user")
fi

echo ""
echo "=========================================================="
echo "TEST CATEGORY 8: Security Checks"
echo "=========================================================="
echo ""

# Test 18: Plain password never stored
TOTAL=$((TOTAL + 1))
echo -n "[$TOTAL] Plain password not stored in database... "
PLAIN_CHECK=$(docker exec auth-postgres psql -U postgres -d authdb -t -c "SELECT password_hash FROM users WHERE password_hash='TestPass123!';" | wc -l)
if [ "$PLAIN_CHECK" = "0" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ FAIL${NC}"
    FAILED=$((FAILED + 1))
    FAILED_TESTS+=("[Security] Plain password found in database")
fi

# Test 19: Error messages don't reveal if email exists (login)
TOTAL=$((TOTAL + 1))
echo -n "[$TOTAL] Error message doesn't reveal email existence... "
response=$(curl -s -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"nonexistent@example.com","password":"TestPass123!"}')
if echo "$response" | grep -q "Invalid email or password" && ! echo "$response" | grep -q "not found\|does not exist"; then
    echo -e "${GREEN}✓ PASS${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ FAIL${NC}"
    FAILED=$((FAILED + 1))
    FAILED_TESTS+=("[Security] Error message reveals too much info")
fi

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
    echo "Phase 3 authentication system is fully operational."
    echo ""
    echo "Component Summary:"
    echo "  ✓ Password hashing & validation (Story 3.1)"
    echo "  ✓ JWT token generation & validation (Story 3.4)"
    echo "  ✓ User registration endpoint (Story 3.2)"
    echo "  ✓ User login endpoint (Story 3.3)"
    echo "  ✓ Database operations"
    echo "  ✓ Security measures"
    echo ""
    echo "Ready for Story 3.5: Protected Routes Middleware"

    # Cleanup
    cleanup_test_data

    exit 0
else
    echo -e "${RED}✗ SOME TESTS FAILED${NC}"
    echo ""
    echo "Failed Tests:"
    for test in "${FAILED_TESTS[@]}"; do
        echo -e "  ${RED}✗${NC} $test"
    done
    echo ""
    echo "Common issues:"
    echo "  - Backend container not running (run: docker restart auth-backend)"
    echo "  - Database connection issues"
    echo "  - Code not loaded (restart containers)"

    # Cleanup anyway
    cleanup_test_data

    exit 1
fi
