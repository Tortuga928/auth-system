#!/bin/bash

# Phase 1 Comprehensive Test Suite
# Tests all components from Stories 1.1 - 1.5

echo "=================================================="
echo "   PHASE 1 COMPREHENSIVE TEST SUITE"
echo "   Authentication System Project"
echo "=================================================="
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

echo "=================================================="
echo "TEST CATEGORY 1: Repository Structure (Story 1.1)"
echo "=================================================="
echo ""

run_test "Git repository initialized" "[ -d .git ]"
run_test "README.md exists" "[ -f README.md ]"
run_test "Backend directory exists" "[ -d backend ]"
run_test "Frontend directory exists" "[ -d frontend ]"
run_test "Database directory exists" "[ -d database ]"
run_test "Docs directory exists" "[ -d docs ]"
run_test "Scripts directory exists" "[ -d scripts ]"
run_test "docker-compose.yml exists" "[ -f docker-compose.yml ]"
run_test ".gitignore exists" "[ -f .gitignore ]"
run_test "PROJECT_ROADMAP.md exists" "[ -f docs/PROJECT_ROADMAP.md ]"

echo ""
echo "=================================================="
echo "TEST CATEGORY 2: Backend Setup (Story 1.2)"
echo "=================================================="
echo ""

run_test "Backend package.json exists" "[ -f backend/package.json ]"
run_test "Backend server.js exists" "[ -f backend/src/server.js ]"
run_test "Backend app.js exists" "[ -f backend/src/app.js ]"
run_test "Backend config exists" "[ -f backend/src/config/index.js ]"
run_test "Backend error handler exists" "[ -f backend/src/middleware/errorHandler.js ]"
run_test "Backend health route exists" "[ -f backend/src/routes/health.js ]"
run_test "Backend .eslintrc.js exists" "[ -f backend/.eslintrc.js ]"
run_test "Backend node_modules installed" "[ -d backend/node_modules ]"

echo ""
echo "=================================================="
echo "TEST CATEGORY 3: Frontend Setup (Story 1.3)"
echo "=================================================="
echo ""

run_test "Frontend package.json exists" "[ -f frontend/package.json ]"
run_test "Frontend index.html exists" "[ -f frontend/public/index.html ]"
run_test "Frontend App.js exists" "[ -f frontend/src/App.js ]"
run_test "Frontend index.js exists" "[ -f frontend/src/index.js ]"
run_test "Frontend API service exists" "[ -f frontend/src/services/api.js ]"
run_test "Frontend pages exist" "[ -d frontend/src/pages ]"
run_test "Frontend components exist" "[ -d frontend/src/components ]"
run_test "Frontend node_modules installed" "[ -d frontend/node_modules ]"

echo ""
echo "=================================================="
echo "TEST CATEGORY 4: Database Setup (Story 1.4)"
echo "=================================================="
echo ""

run_test "Knexfile exists" "[ -f backend/knexfile.js ]"
run_test "Database module exists" "[ -f backend/src/db/index.js ]"
run_test "Migrations directory exists" "[ -d backend/src/db/migrations ]"
run_test "Users migration exists" "[ -f backend/src/db/migrations/20251106000001_create_users_table.js ]"
run_test "Sessions migration exists" "[ -f backend/src/db/migrations/20251106000002_create_sessions_table.js ]"

echo ""
echo "=================================================="
echo "TEST CATEGORY 5: Docker Environment (Story 1.5)"
echo "=================================================="
echo ""

run_test "Backend Dockerfile.dev exists" "[ -f backend/Dockerfile.dev ]"
run_test "Frontend Dockerfile.dev exists" "[ -f frontend/Dockerfile.dev ]"
run_test "Backend .dockerignore exists" "[ -f backend/.dockerignore ]"
run_test "Frontend .dockerignore exists" "[ -f frontend/.dockerignore ]"

echo ""
echo "=================================================="
echo "TEST CATEGORY 6: Docker Services Health"
echo "=================================================="
echo ""

run_test "PostgreSQL container running" "docker ps | grep -q auth-postgres"
run_test "Redis container running" "docker ps | grep -q auth-redis"
run_test "Backend container running" "docker ps | grep -q auth-backend"
run_test "Frontend container running" "docker ps | grep -q auth-frontend"
run_test "PostgreSQL is healthy" "docker ps | grep auth-postgres | grep -q healthy"
run_test "Redis is healthy" "docker ps | grep auth-redis | grep -q healthy"

echo ""
echo "=================================================="
echo "TEST CATEGORY 7: Backend API Functionality"
echo "=================================================="
echo ""

# Wait for backend to be ready
sleep 2

run_test "Backend health endpoint responds" "curl -s http://localhost:5000/health > /dev/null"
run_test "Backend returns JSON" "curl -s http://localhost:5000/health | grep -q success"
run_test "Backend shows database connected" "curl -s http://localhost:5000/health | grep -q '\"database\":\"connected\"'"
run_test "Backend environment is development" "curl -s http://localhost:5000/health | grep -q '\"environment\":\"development\"'"
run_test "Backend root endpoint works" "curl -s http://localhost:5000/ | grep -q 'Authentication System API'"
run_test "Backend 404 handler works" "curl -s http://localhost:5000/nonexistent | grep -q 'Route not found'"

echo ""
echo "=================================================="
echo "TEST CATEGORY 8: Frontend Application"
echo "=================================================="
echo ""

run_test "Frontend homepage responds" "curl -s http://localhost:3000 > /dev/null"
run_test "Frontend returns HTML" "curl -s http://localhost:3000 | grep -q '<html'"
run_test "Frontend has correct title" "curl -s http://localhost:3000 | grep -q 'Authentication System'"
run_test "Frontend bundle loads" "curl -s http://localhost:3000 | grep -q 'bundle.js'"

echo ""
echo "=================================================="
echo "TEST CATEGORY 9: Database Connectivity"
echo "=================================================="
echo ""

run_test "Can connect to PostgreSQL" "docker exec auth-postgres psql -U postgres -d authdb -c 'SELECT 1' > /dev/null 2>&1"
run_test "Users table exists" "docker exec auth-postgres psql -U postgres -d authdb -c '\dt' | grep -q users"
run_test "Sessions table exists" "docker exec auth-postgres psql -U postgres -d authdb -c '\dt' | grep -q sessions"
run_test "Migrations table exists" "docker exec auth-postgres psql -U postgres -d authdb -c '\dt' | grep -q knex_migrations"

echo ""
echo "=================================================="
echo "TEST CATEGORY 10: Network & Communication"
echo "=================================================="
echo ""

run_test "Docker network exists" "docker network ls | grep -q auth-network"
run_test "PostgreSQL volume exists" "docker volume ls | grep -q auth-postgres-data"
run_test "Redis volume exists" "docker volume ls | grep -q auth-redis-data"
run_test "Backend can reach PostgreSQL" "docker exec auth-backend nc -zv postgres 5432 2>&1 | grep -q succeeded"
run_test "Backend can reach Redis" "docker exec auth-backend nc -zv redis 6379 2>&1 | grep -q succeeded"

echo ""
echo "=================================================="
echo "   FINAL TEST RESULTS"
echo "=================================================="
echo ""
echo -e "Total Tests: ${YELLOW}$TOTAL${NC}"
echo -e "Passed:      ${GREEN}$PASSED${NC}"
echo -e "Failed:      ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ ALL TESTS PASSED!${NC}"
    echo "Phase 1 is fully operational and ready for Phase 2."
    exit 0
else
    echo -e "${RED}✗ SOME TESTS FAILED${NC}"
    echo "Please review the failed tests above."
    exit 1
fi
