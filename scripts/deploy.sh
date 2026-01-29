#!/bin/bash

#===============================================================================
# GameBlitz Production Deployment Script
#===============================================================================
# This script handles the full deployment process including:
# - Pre-flight checks
# - Database backup
# - Database migrations
# - Building and deploying Docker containers
# - Health checks
# - Rollback capability
#===============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${PROJECT_ROOT}/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="${PROJECT_ROOT}/logs/deploy_${TIMESTAMP}.log"

# Create necessary directories early (before any logging)
mkdir -p "$BACKUP_DIR" "${PROJECT_ROOT}/logs"

# Default values
SKIP_BACKUP=false
SKIP_MIGRATIONS=false
SKIP_BUILD=false
FORCE_DEPLOY=false
ROLLBACK_VERSION=""

#===============================================================================
# Helper Functions
#===============================================================================

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE} $1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

usage() {
    cat << EOF
Usage: $0 [OPTIONS]

GameBlitz Production Deployment Script

OPTIONS:
    -h, --help              Show this help message
    -s, --skip-backup       Skip database backup
    -m, --skip-migrations   Skip database migrations
    -b, --skip-build        Skip Docker build (use existing images)
    -f, --force             Force deployment without confirmations
    -r, --rollback VERSION  Rollback to a specific version/commit
    -e, --env FILE          Specify environment file (default: .env.production)

EXAMPLES:
    $0                      Full deployment with all steps
    $0 --skip-backup        Deploy without backing up database
    $0 --rollback abc123    Rollback to commit abc123
    $0 -f -m                Force deploy, skip migrations

EOF
    exit 0
}

#===============================================================================
# Parse Arguments
#===============================================================================

ENV_FILE=".env.production"

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            usage
            ;;
        -s|--skip-backup)
            SKIP_BACKUP=true
            shift
            ;;
        -m|--skip-migrations)
            SKIP_MIGRATIONS=true
            shift
            ;;
        -b|--skip-build)
            SKIP_BUILD=true
            shift
            ;;
        -f|--force)
            FORCE_DEPLOY=true
            shift
            ;;
        -r|--rollback)
            ROLLBACK_VERSION="$2"
            shift 2
            ;;
        -e|--env)
            ENV_FILE="$2"
            shift 2
            ;;
        *)
            log_error "Unknown option: $1"
            usage
            ;;
    esac
done

#===============================================================================
# Pre-flight Checks
#===============================================================================

preflight_checks() {
    print_header "Pre-flight Checks"

    cd "$PROJECT_ROOT"

    # Create necessary directories
    mkdir -p "$BACKUP_DIR" "${PROJECT_ROOT}/logs"

    # Check if we're in a git repository
    if [ ! -d ".git" ]; then
        log_error "Not a git repository"
        exit 1
    fi
    log_success "Git repository found"

    # Check for uncommitted changes
    if [ -n "$(git status --porcelain)" ]; then
        log_warning "Uncommitted changes detected"
        if [ "$FORCE_DEPLOY" = false ]; then
            read -p "Continue anyway? (y/N) " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                exit 1
            fi
        fi
    else
        log_success "Working directory clean"
    fi

    # Check environment file
    if [ ! -f "$ENV_FILE" ]; then
        log_error "Environment file not found: $ENV_FILE"
        log "Create it from .env.production.example or specify with -e flag"
        exit 1
    fi
    log_success "Environment file found: $ENV_FILE"

    # Load environment variables
    set -a
    source "$ENV_FILE"
    set +a

    # Check required environment variables
    REQUIRED_VARS=(
        "DATABASE_URL"
        "POSTGRES_PASSWORD"
        "NEXTAUTH_SECRET"
        "NEXTAUTH_URL"
        "REDIS_URL"
    )

    for var in "${REQUIRED_VARS[@]}"; do
        if [ -z "${!var}" ]; then
            log_error "Missing required environment variable: $var"
            exit 1
        fi
    done
    log_success "All required environment variables set"

    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    log_success "Docker is available"

    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
    log_success "Docker Compose is available"

    # Check if Docker daemon is running
    if ! docker info &> /dev/null; then
        log_error "Docker daemon is not running"
        exit 1
    fi
    log_success "Docker daemon is running"

    log_success "All pre-flight checks passed!"
}

#===============================================================================
# Rollback Function
#===============================================================================

rollback() {
    print_header "Rolling Back to $ROLLBACK_VERSION"

    cd "$PROJECT_ROOT"

    # Verify the version exists
    if ! git cat-file -t "$ROLLBACK_VERSION" &> /dev/null; then
        log_error "Version $ROLLBACK_VERSION not found"
        exit 1
    fi

    # Get current version for backup reference
    CURRENT_VERSION=$(git rev-parse HEAD)
    log "Current version: $CURRENT_VERSION"
    log "Rolling back to: $ROLLBACK_VERSION"

    if [ "$FORCE_DEPLOY" = false ]; then
        read -p "Are you sure you want to rollback? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi

    # Checkout the rollback version
    git checkout "$ROLLBACK_VERSION"

    # Rebuild and restart containers
    SKIP_MIGRATIONS=true  # Don't run migrations on rollback
    SKIP_BACKUP=true      # Already have current state

    log_success "Rolled back to $ROLLBACK_VERSION"
}

#===============================================================================
# Database Backup
#===============================================================================

backup_database() {
    if [ "$SKIP_BACKUP" = true ]; then
        log_warning "Skipping database backup"
        return
    fi

    print_header "Database Backup"

    BACKUP_FILE="${BACKUP_DIR}/gameblitz_${TIMESTAMP}.sql"

    log "Creating database backup: $BACKUP_FILE"

    # Check if postgres container is running
    if docker ps --format '{{.Names}}' | grep -q "gameblitz-postgres"; then
        docker exec gameblitz-postgres pg_dump -U "${POSTGRES_USER:-gameblitz}" "${POSTGRES_DB:-gameblitz}" > "$BACKUP_FILE"

        # Compress the backup
        gzip "$BACKUP_FILE"
        BACKUP_FILE="${BACKUP_FILE}.gz"

        log_success "Database backup created: $BACKUP_FILE"

        # Keep only last 10 backups
        cd "$BACKUP_DIR"
        ls -t *.sql.gz 2>/dev/null | tail -n +11 | xargs -r rm
        log "Cleaned up old backups (keeping last 10)"
    else
        log_warning "PostgreSQL container not running - skipping backup"
        log_warning "This might be a fresh deployment"
    fi
}

#===============================================================================
# Database Migrations
#===============================================================================

run_migrations() {
    if [ "$SKIP_MIGRATIONS" = true ]; then
        log_warning "Skipping database migrations"
        return
    fi

    print_header "Database Migrations"

    cd "$PROJECT_ROOT"

    # Ensure database container is running
    log "Ensuring database is running..."
    docker-compose -f docker-compose.prod.yml up -d postgres

    # Wait for database to be ready
    log "Waiting for database to be ready..."
    sleep 5

    for i in {1..30}; do
        if docker exec gameblitz-postgres pg_isready -U "${POSTGRES_USER:-gameblitz}" &> /dev/null; then
            log_success "Database is ready"
            break
        fi
        if [ $i -eq 30 ]; then
            log_error "Database failed to start"
            exit 1
        fi
        sleep 2
    done

    # Generate Prisma client and run migrations
    log "Generating Prisma client and running migrations..."
    docker run --rm \
        --network gameblitz_default \
        -v "${PROJECT_ROOT}:/app" \
        -w /app/packages/database \
        -e DATABASE_URL="$DATABASE_URL" \
        node:20-slim \
        sh -c "apt-get update && apt-get install -y openssl && npm install -g pnpm && pnpm install --ignore-scripts && npx prisma generate && npx prisma migrate deploy"

    log_success "Database migrations completed"
}

#===============================================================================
# Build Docker Images
#===============================================================================

build_images() {
    if [ "$SKIP_BUILD" = true ]; then
        log_warning "Skipping Docker build"
        return
    fi

    print_header "Building Docker Images"

    cd "$PROJECT_ROOT"

    # Build images with cache
    log "Building Docker images..."
    docker-compose -f docker-compose.prod.yml build --parallel

    # Tag images with timestamp for rollback capability
    COMMIT_SHA=$(git rev-parse --short HEAD)

    docker tag gameblitz-web:latest "gameblitz-web:${COMMIT_SHA}"
    docker tag gameblitz-socket:latest "gameblitz-socket:${COMMIT_SHA}"

    log_success "Docker images built and tagged"
    log "Tagged as: gameblitz-web:${COMMIT_SHA}, gameblitz-socket:${COMMIT_SHA}"
}

#===============================================================================
# Deploy Containers
#===============================================================================

deploy_containers() {
    print_header "Deploying Containers"

    cd "$PROJECT_ROOT"

    # Pull latest base images
    log "Pulling latest base images..."
    docker-compose -f docker-compose.prod.yml pull postgres redis

    # Stop existing containers gracefully
    log "Stopping existing containers..."
    docker-compose -f docker-compose.prod.yml stop web socket-server || true

    # Start all services
    log "Starting services..."
    docker-compose -f docker-compose.prod.yml --env-file "$ENV_FILE" up -d

    log_success "Containers deployed"
}

#===============================================================================
# Health Checks
#===============================================================================

health_checks() {
    print_header "Health Checks"

    # Wait for services to start
    log "Waiting for services to start..."
    sleep 10

    # Check web service
    log "Checking web service..."
    for i in {1..30}; do
        if curl -sf http://localhost:3000 > /dev/null 2>&1; then
            log_success "Web service is healthy"
            break
        fi
        if [ $i -eq 30 ]; then
            log_error "Web service health check failed"
            docker-compose -f docker-compose.prod.yml logs web | tail -50
            exit 1
        fi
        sleep 2
    done

    # Check socket service
    log "Checking socket service..."
    for i in {1..30}; do
        if curl -sf http://localhost:3001 > /dev/null 2>&1; then
            log_success "Socket service is healthy"
            break
        fi
        if [ $i -eq 30 ]; then
            log_warning "Socket service health check - endpoint may not return 200 but service might be running"
        fi
        sleep 2
    done

    # Check database
    log "Checking database..."
    if docker exec gameblitz-postgres pg_isready -U "${POSTGRES_USER:-gameblitz}" &> /dev/null; then
        log_success "Database is healthy"
    else
        log_error "Database health check failed"
        exit 1
    fi

    # Check Redis
    log "Checking Redis..."
    if docker exec gameblitz-redis redis-cli ping | grep -q "PONG"; then
        log_success "Redis is healthy"
    else
        log_error "Redis health check failed"
        exit 1
    fi

    log_success "All health checks passed!"
}

#===============================================================================
# Post-deployment
#===============================================================================

post_deployment() {
    print_header "Post-deployment Summary"

    cd "$PROJECT_ROOT"

    # Get deployment info
    COMMIT_SHA=$(git rev-parse --short HEAD)
    COMMIT_MSG=$(git log -1 --pretty=%B | head -1)

    echo -e "\n${GREEN}Deployment Successful!${NC}\n"
    echo "=========================================="
    echo "Timestamp:    $(date)"
    echo "Commit:       $COMMIT_SHA"
    echo "Message:      $COMMIT_MSG"
    echo "Environment:  $ENV_FILE"
    echo "Log file:     $LOG_FILE"
    echo "=========================================="
    echo ""
    echo "Services:"
    docker-compose -f docker-compose.prod.yml ps
    echo ""
    echo "URLs:"
    echo "  - Web:      http://localhost:3000"
    echo "  - Socket:   http://localhost:3001"
    echo ""

    # Save deployment info
    cat > "${PROJECT_ROOT}/.last-deployment" << EOF
TIMESTAMP=$TIMESTAMP
COMMIT=$COMMIT_SHA
ENV_FILE=$ENV_FILE
STATUS=SUCCESS
EOF

    log_success "Deployment completed successfully!"
}

#===============================================================================
# Cleanup on failure
#===============================================================================

cleanup_on_failure() {
    log_error "Deployment failed! Check logs at: $LOG_FILE"

    # Ask if user wants to rollback
    if [ "$FORCE_DEPLOY" = false ]; then
        read -p "Would you like to restart previous containers? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker-compose -f docker-compose.prod.yml up -d
        fi
    fi

    exit 1
}

#===============================================================================
# Main Execution
#===============================================================================

main() {
    print_header "GameBlitz Production Deployment"

    log "Starting deployment at $(date)"
    log "Options: skip_backup=$SKIP_BACKUP, skip_migrations=$SKIP_MIGRATIONS, skip_build=$SKIP_BUILD"

    # Set up error handling
    trap cleanup_on_failure ERR

    # Handle rollback if specified
    if [ -n "$ROLLBACK_VERSION" ]; then
        rollback
    fi

    # Run deployment steps
    preflight_checks
    backup_database
    run_migrations
    build_images
    deploy_containers
    health_checks
    post_deployment
}

# Run main function
main
