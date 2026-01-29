#!/bin/bash

#===============================================================================
# DefenceQuest Simple Deployment Script
#===============================================================================
# A simplified deployment for the single-player learning games
# No database or socket server needed for the defence games
#===============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

log() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE} $1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

usage() {
    cat << EOF
Usage: $0 [COMMAND]

DefenceQuest Simple Deployment

COMMANDS:
    build       Build the production app
    start       Start the production server
    stop        Stop the production server
    restart     Restart the production server
    status      Check server status
    logs        View server logs
    dev         Start development server

OPTIONS:
    -h, --help  Show this help

EXAMPLES:
    $0 build    # Build for production
    $0 start    # Start production server on port 3000
    $0 dev      # Start development server
EOF
    exit 0
}

check_deps() {
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi

    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed"
        exit 1
    fi

    log_success "Dependencies OK (Node $(node -v))"
}

build_app() {
    print_header "Building DefenceQuest"

    cd "$PROJECT_ROOT"
    check_deps

    log "Installing dependencies..."
    npm install

    log "Building production app..."
    npm run build

    log_success "Build complete!"
    echo ""
    echo "To start the server, run: $0 start"
}

start_app() {
    print_header "Starting DefenceQuest"

    cd "$PROJECT_ROOT"

    # Check if already running
    if [ -f "$PROJECT_ROOT/.server.pid" ]; then
        PID=$(cat "$PROJECT_ROOT/.server.pid")
        if ps -p $PID > /dev/null 2>&1; then
            log_error "Server already running (PID: $PID)"
            log "Use '$0 restart' to restart or '$0 stop' to stop"
            exit 1
        fi
    fi

    # Check if build exists
    if [ ! -d "$PROJECT_ROOT/apps/web/.next" ]; then
        log_error "No build found. Run '$0 build' first"
        exit 1
    fi

    log "Starting production server..."

    cd "$PROJECT_ROOT/apps/web"

    # Start Next.js in background
    PORT=3000 nohup npm run start > "$PROJECT_ROOT/logs/server.log" 2>&1 &
    echo $! > "$PROJECT_ROOT/.server.pid"

    sleep 3

    # Verify it's running
    if curl -sf http://localhost:3000 > /dev/null 2>&1; then
        log_success "Server started on http://localhost:3000"
        echo ""
        echo "PID: $(cat $PROJECT_ROOT/.server.pid)"
        echo "Logs: $PROJECT_ROOT/logs/server.log"
    else
        log_error "Server failed to start. Check logs:"
        tail -20 "$PROJECT_ROOT/logs/server.log"
        exit 1
    fi
}

stop_app() {
    print_header "Stopping DefenceQuest"

    if [ -f "$PROJECT_ROOT/.server.pid" ]; then
        PID=$(cat "$PROJECT_ROOT/.server.pid")
        if ps -p $PID > /dev/null 2>&1; then
            kill $PID
            rm "$PROJECT_ROOT/.server.pid"
            log_success "Server stopped (PID: $PID)"
        else
            rm "$PROJECT_ROOT/.server.pid"
            log "Server was not running"
        fi
    else
        log "No server PID file found"

        # Try to find and kill any running next server
        pkill -f "next start" 2>/dev/null && log "Killed orphan Next.js process" || true
    fi
}

restart_app() {
    stop_app
    sleep 2
    start_app
}

status_app() {
    print_header "DefenceQuest Status"

    if [ -f "$PROJECT_ROOT/.server.pid" ]; then
        PID=$(cat "$PROJECT_ROOT/.server.pid")
        if ps -p $PID > /dev/null 2>&1; then
            log_success "Server is running (PID: $PID)"

            if curl -sf http://localhost:3000 > /dev/null 2>&1; then
                log_success "HTTP responding on http://localhost:3000"
            else
                log_error "HTTP not responding"
            fi
        else
            log_error "Server not running (stale PID file)"
        fi
    else
        log "Server is not running"
    fi
}

show_logs() {
    if [ -f "$PROJECT_ROOT/logs/server.log" ]; then
        tail -f "$PROJECT_ROOT/logs/server.log"
    else
        log_error "No log file found"
    fi
}

dev_server() {
    print_header "Starting Development Server"

    cd "$PROJECT_ROOT"
    check_deps

    log "Starting dev server..."
    npm run dev
}

# Create logs directory
mkdir -p "$PROJECT_ROOT/logs"

# Parse command
case "${1:-}" in
    build)
        build_app
        ;;
    start)
        start_app
        ;;
    stop)
        stop_app
        ;;
    restart)
        restart_app
        ;;
    status)
        status_app
        ;;
    logs)
        show_logs
        ;;
    dev)
        dev_server
        ;;
    -h|--help|"")
        usage
        ;;
    *)
        log_error "Unknown command: $1"
        usage
        ;;
esac
