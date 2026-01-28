#!/bin/bash

#===============================================================================
# GameBlitz Health Check Script
#===============================================================================
# Monitors the health of all services and reports status
#===============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Configuration
WEB_URL="${WEB_URL:-http://localhost:3000}"
SOCKET_URL="${SOCKET_URL:-http://localhost:3001}"
TIMEOUT=5

# Counters
TOTAL=0
PASSED=0
FAILED=0

check() {
    local name="$1"
    local result="$2"

    TOTAL=$((TOTAL + 1))

    if [ "$result" = "0" ]; then
        echo -e "${GREEN}✓${NC} $name"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}✗${NC} $name"
        FAILED=$((FAILED + 1))
    fi
}

echo "========================================"
echo " GameBlitz Health Check"
echo " $(date)"
echo "========================================"
echo ""

# Check Docker
echo "Docker Services:"
echo "----------------"

# PostgreSQL
if docker exec gameblitz-postgres pg_isready -U gameblitz &> /dev/null; then
    check "PostgreSQL" 0
else
    check "PostgreSQL" 1
fi

# Redis
if docker exec gameblitz-redis redis-cli ping 2>/dev/null | grep -q "PONG"; then
    check "Redis" 0
else
    check "Redis" 1
fi

# Web container
if docker ps --format '{{.Names}}' | grep -q "gameblitz-web"; then
    check "Web Container" 0
else
    check "Web Container" 1
fi

# Socket container
if docker ps --format '{{.Names}}' | grep -q "gameblitz-socket"; then
    check "Socket Container" 0
else
    check "Socket Container" 1
fi

echo ""
echo "HTTP Endpoints:"
echo "---------------"

# Web service HTTP check
if curl -sf --max-time $TIMEOUT "$WEB_URL" > /dev/null 2>&1; then
    check "Web HTTP ($WEB_URL)" 0
else
    check "Web HTTP ($WEB_URL)" 1
fi

# API health endpoint
if curl -sf --max-time $TIMEOUT "$WEB_URL/api/health" > /dev/null 2>&1; then
    check "API Health" 0
else
    check "API Health (endpoint may not exist)" 1
fi

# Socket service
if curl -sf --max-time $TIMEOUT "$SOCKET_URL/socket.io/?EIO=4&transport=polling" > /dev/null 2>&1; then
    check "Socket.IO" 0
else
    # Socket.io might return different status codes
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$SOCKET_URL/socket.io/?EIO=4&transport=polling" 2>/dev/null || echo "000")
    if [ "$HTTP_CODE" != "000" ] && [ "$HTTP_CODE" != "404" ]; then
        check "Socket.IO (HTTP $HTTP_CODE)" 0
    else
        check "Socket.IO" 1
    fi
fi

echo ""
echo "Resource Usage:"
echo "---------------"

# Memory usage
docker stats --no-stream --format "{{.Name}}: {{.MemUsage}}" 2>/dev/null | grep gameblitz || echo "Unable to get stats"

echo ""
echo "========================================"
echo " Summary: $PASSED/$TOTAL checks passed"
echo "========================================"

if [ $FAILED -gt 0 ]; then
    echo -e "${RED}Some checks failed!${NC}"
    exit 1
else
    echo -e "${GREEN}All checks passed!${NC}"
    exit 0
fi
