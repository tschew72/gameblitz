#!/bin/bash

#===============================================================================
# GameBlitz Database Migration Script
#===============================================================================
# Handles database schema changes, migrations, and seeding
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
BACKUP_DIR="${PROJECT_ROOT}/backups"

log() { echo -e "${BLUE}[DB]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

usage() {
    cat << EOF
Usage: $0 COMMAND [OPTIONS]

Database Migration Script for GameBlitz

COMMANDS:
    status          Show migration status
    migrate         Run pending migrations
    create NAME     Create a new migration
    reset           Reset database (WARNING: destroys all data)
    seed            Seed database with initial data
    backup          Create database backup
    restore FILE    Restore database from backup
    generate        Generate Prisma client
    studio          Open Prisma Studio

OPTIONS:
    -e, --env FILE  Environment file (default: .env)
    -f, --force     Force operation without confirmation
    -h, --help      Show this help message

EXAMPLES:
    $0 status                       Check migration status
    $0 migrate                      Run pending migrations
    $0 create add_user_avatar       Create new migration
    $0 backup                       Backup database
    $0 restore backups/backup.sql   Restore from backup

EOF
    exit 0
}

# Load environment
load_env() {
    ENV_FILE="${1:-.env}"
    if [ -f "$PROJECT_ROOT/$ENV_FILE" ]; then
        set -a
        source "$PROJECT_ROOT/$ENV_FILE"
        set +a
        log "Loaded environment from $ENV_FILE"
    elif [ -f "$PROJECT_ROOT/.env" ]; then
        set -a
        source "$PROJECT_ROOT/.env"
        set +a
        log "Loaded environment from .env"
    else
        log_error "No environment file found"
        exit 1
    fi
}

# Check if running in Docker or locally
get_prisma_cmd() {
    if command -v npx &> /dev/null; then
        echo "cd $PROJECT_ROOT/packages/database && npx prisma"
    else
        echo "docker run --rm -v $PROJECT_ROOT:/app -w /app/packages/database -e DATABASE_URL=$DATABASE_URL node:20-alpine npx prisma"
    fi
}

# Migration status
cmd_status() {
    log "Checking migration status..."
    cd "$PROJECT_ROOT/packages/database"
    npx prisma migrate status
}

# Run migrations
cmd_migrate() {
    log "Running database migrations..."

    cd "$PROJECT_ROOT/packages/database"

    # Check if there are pending migrations
    if npx prisma migrate status 2>&1 | grep -q "Database schema is up to date"; then
        log_success "Database is already up to date"
        return
    fi

    # Run migrations
    npx prisma migrate deploy

    log_success "Migrations completed"
}

# Create new migration
cmd_create() {
    NAME="$1"
    if [ -z "$NAME" ]; then
        log_error "Migration name required"
        echo "Usage: $0 create MIGRATION_NAME"
        exit 1
    fi

    log "Creating migration: $NAME"
    cd "$PROJECT_ROOT/packages/database"
    npx prisma migrate dev --name "$NAME"
    log_success "Migration created: $NAME"
}

# Reset database
cmd_reset() {
    log_warning "This will destroy all data in the database!"

    if [ "$FORCE" != true ]; then
        read -p "Are you sure? Type 'yes' to confirm: " confirm
        if [ "$confirm" != "yes" ]; then
            log "Aborted"
            exit 0
        fi
    fi

    log "Resetting database..."
    cd "$PROJECT_ROOT/packages/database"
    npx prisma migrate reset --force
    log_success "Database reset completed"
}

# Seed database
cmd_seed() {
    log "Seeding database..."
    cd "$PROJECT_ROOT/packages/database"

    # Check if seed file exists
    if [ -f "prisma/seed.ts" ]; then
        npx prisma db seed
        log_success "Database seeded"
    else
        log_warning "No seed file found at packages/database/prisma/seed.ts"
    fi
}

# Backup database
cmd_backup() {
    mkdir -p "$BACKUP_DIR"
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="${BACKUP_DIR}/gameblitz_${TIMESTAMP}.sql"

    log "Creating backup: $BACKUP_FILE"

    # Extract connection details from DATABASE_URL
    # Format: postgresql://user:password@host:port/database
    if [[ $DATABASE_URL =~ postgresql://([^:]+):([^@]+)@([^:]+):([^/]+)/(.+) ]]; then
        DB_USER="${BASH_REMATCH[1]}"
        DB_PASS="${BASH_REMATCH[2]}"
        DB_HOST="${BASH_REMATCH[3]}"
        DB_PORT="${BASH_REMATCH[4]}"
        DB_NAME="${BASH_REMATCH[5]}"

        PGPASSWORD="$DB_PASS" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" > "$BACKUP_FILE"
    elif docker ps --format '{{.Names}}' | grep -q "gameblitz-postgres"; then
        # Fallback to Docker
        docker exec gameblitz-postgres pg_dump -U "${POSTGRES_USER:-gameblitz}" "${POSTGRES_DB:-gameblitz}" > "$BACKUP_FILE"
    else
        log_error "Cannot connect to database"
        exit 1
    fi

    # Compress
    gzip "$BACKUP_FILE"
    log_success "Backup created: ${BACKUP_FILE}.gz"

    # Show backup size
    ls -lh "${BACKUP_FILE}.gz"
}

# Restore database
cmd_restore() {
    BACKUP_FILE="$1"

    if [ -z "$BACKUP_FILE" ]; then
        log_error "Backup file required"
        echo "Usage: $0 restore BACKUP_FILE"
        echo ""
        echo "Available backups:"
        ls -lh "$BACKUP_DIR"/*.sql.gz 2>/dev/null || echo "  No backups found"
        exit 1
    fi

    if [ ! -f "$BACKUP_FILE" ]; then
        log_error "Backup file not found: $BACKUP_FILE"
        exit 1
    fi

    log_warning "This will overwrite the current database!"

    if [ "$FORCE" != true ]; then
        read -p "Are you sure? Type 'yes' to confirm: " confirm
        if [ "$confirm" != "yes" ]; then
            log "Aborted"
            exit 0
        fi
    fi

    log "Restoring from: $BACKUP_FILE"

    # Decompress if needed
    if [[ "$BACKUP_FILE" == *.gz ]]; then
        gunzip -c "$BACKUP_FILE" > /tmp/restore.sql
        RESTORE_FILE="/tmp/restore.sql"
    else
        RESTORE_FILE="$BACKUP_FILE"
    fi

    # Restore
    if [[ $DATABASE_URL =~ postgresql://([^:]+):([^@]+)@([^:]+):([^/]+)/(.+) ]]; then
        DB_USER="${BASH_REMATCH[1]}"
        DB_PASS="${BASH_REMATCH[2]}"
        DB_HOST="${BASH_REMATCH[3]}"
        DB_PORT="${BASH_REMATCH[4]}"
        DB_NAME="${BASH_REMATCH[5]}"

        PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" < "$RESTORE_FILE"
    elif docker ps --format '{{.Names}}' | grep -q "gameblitz-postgres"; then
        docker exec -i gameblitz-postgres psql -U "${POSTGRES_USER:-gameblitz}" "${POSTGRES_DB:-gameblitz}" < "$RESTORE_FILE"
    fi

    # Cleanup
    [ -f /tmp/restore.sql ] && rm /tmp/restore.sql

    log_success "Database restored from $BACKUP_FILE"
}

# Generate Prisma client
cmd_generate() {
    log "Generating Prisma client..."
    cd "$PROJECT_ROOT/packages/database"
    npx prisma generate
    log_success "Prisma client generated"
}

# Open Prisma Studio
cmd_studio() {
    log "Opening Prisma Studio..."
    cd "$PROJECT_ROOT/packages/database"
    npx prisma studio
}

#===============================================================================
# Main
#===============================================================================

FORCE=false
ENV_FILE=".env"

# Parse options
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            usage
            ;;
        -f|--force)
            FORCE=true
            shift
            ;;
        -e|--env)
            ENV_FILE="$2"
            shift 2
            ;;
        *)
            break
            ;;
    esac
done

COMMAND="$1"
shift || true

load_env "$ENV_FILE"

case $COMMAND in
    status)
        cmd_status
        ;;
    migrate)
        cmd_migrate
        ;;
    create)
        cmd_create "$1"
        ;;
    reset)
        cmd_reset
        ;;
    seed)
        cmd_seed
        ;;
    backup)
        cmd_backup
        ;;
    restore)
        cmd_restore "$1"
        ;;
    generate)
        cmd_generate
        ;;
    studio)
        cmd_studio
        ;;
    "")
        usage
        ;;
    *)
        log_error "Unknown command: $COMMAND"
        usage
        ;;
esac
