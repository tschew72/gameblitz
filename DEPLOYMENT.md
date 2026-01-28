# GameBlitz Deployment Guide

This guide covers deploying GameBlitz to production.

## Prerequisites

- Docker and Docker Compose installed
- Git
- Node.js 20+ (for local development)
- pnpm package manager

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/tschew72/gameblitz.git
cd gameblitz

# 2. Copy and configure environment
cp .env.production.example .env.production
# Edit .env.production with your values

# 3. Deploy
./scripts/deploy.sh
```

## Environment Configuration

Copy `.env.production.example` to `.env.production` and configure:

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `POSTGRES_PASSWORD` | Database password | Strong random password |
| `NEXTAUTH_SECRET` | Auth encryption key | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Public URL of your app | `https://gameblitz.example.com` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `NEXT_PUBLIC_SOCKET_URL` | Socket server URL | `https://gameblitz.example.com:3001` |
| `CORS_ORIGIN` | Allowed CORS origins | `https://gameblitz.example.com` |

### Generate Secrets

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate POSTGRES_PASSWORD
openssl rand -base64 24
```

## Deployment Scripts

### Full Deployment

```bash
# Standard deployment (backup + migrate + build + deploy + health check)
pnpm deploy

# Skip database backup
pnpm deploy:skip-backup

# Force deployment (no confirmations)
pnpm deploy:force

# Custom options
./scripts/deploy.sh --skip-backup --skip-migrations
```

### Database Operations

```bash
# Check migration status
pnpm db:migrate:status

# Run pending migrations
pnpm db:migrate

# Create new migration
pnpm db:migrate:create add_new_field

# Backup database
pnpm db:backup

# Restore from backup
pnpm db:restore backups/gameblitz_20240129_120000.sql.gz

# Seed database with sample data
pnpm --filter @gameblitz/database db:seed
```

### Docker Operations

```bash
# Start all services
pnpm docker:up

# Stop all services
pnpm docker:down

# View logs
pnpm docker:logs

# Rebuild images
pnpm docker:build
```

### Health Checks

```bash
# Run health checks
pnpm health
```

## Deployment Process

The deployment script performs these steps:

1. **Pre-flight Checks**
   - Verify git repository
   - Check for uncommitted changes
   - Validate environment variables
   - Check Docker availability

2. **Database Backup**
   - Creates timestamped SQL dump
   - Compresses with gzip
   - Keeps last 10 backups

3. **Database Migrations**
   - Ensures database container is running
   - Generates Prisma client
   - Runs `prisma migrate deploy`

4. **Build Docker Images**
   - Builds web and socket-server images
   - Tags with commit SHA for rollback

5. **Deploy Containers**
   - Stops existing containers
   - Starts new containers with updated images

6. **Health Checks**
   - Verifies web service responds
   - Checks socket server
   - Validates database connection
   - Tests Redis connectivity

## Rollback

To rollback to a previous version:

```bash
# Rollback to specific commit
./scripts/deploy.sh --rollback abc1234

# View available versions
git log --oneline -10
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Load Balancer                        │
│                   (nginx/cloudflare)                     │
└─────────────────────┬───────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
        ▼                           ▼
┌───────────────┐           ┌───────────────┐
│   Web App     │           │ Socket Server │
│  (Next.js)    │           │  (Socket.io)  │
│  Port 3000    │           │  Port 3001    │
└───────┬───────┘           └───────┬───────┘
        │                           │
        └─────────────┬─────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
        ▼                           ▼
┌───────────────┐           ┌───────────────┐
│  PostgreSQL   │           │    Redis      │
│  Port 5432    │           │  Port 6379    │
└───────────────┘           └───────────────┘
```

## Docker Compose Services

| Service | Port | Description |
|---------|------|-------------|
| `web` | 3000 | Next.js web application |
| `socket-server` | 3001 | Socket.io real-time server |
| `postgres` | 5432 | PostgreSQL database |
| `redis` | 6379 | Redis for sessions/cache |

## Production Checklist

- [ ] Configure `.env.production` with secure passwords
- [ ] Set up SSL/TLS certificates
- [ ] Configure reverse proxy (nginx)
- [ ] Set up monitoring (Sentry, etc.)
- [ ] Configure backups
- [ ] Set up log aggregation
- [ ] Configure firewall rules
- [ ] Test rollback procedure
- [ ] Document runbooks

## Troubleshooting

### Container won't start

```bash
# Check container logs
docker-compose -f docker-compose.prod.yml logs web
docker-compose -f docker-compose.prod.yml logs socket-server

# Check container status
docker-compose -f docker-compose.prod.yml ps
```

### Database connection issues

```bash
# Test database connection
docker exec gameblitz-postgres pg_isready -U gameblitz

# Access database shell
docker exec -it gameblitz-postgres psql -U gameblitz -d gameblitz
```

### Migration failures

```bash
# Check migration status
./scripts/db-migrate.sh status

# View migration history
docker exec gameblitz-postgres psql -U gameblitz -d gameblitz -c "SELECT * FROM _prisma_migrations"
```

### Health check failures

```bash
# Manual health check
curl http://localhost:3000/api/health

# Check all services
./scripts/health-check.sh
```

## Maintenance

### Regular Tasks

- **Daily**: Check health status
- **Weekly**: Review logs for errors
- **Monthly**: Test backup restoration
- **Quarterly**: Review and rotate secrets

### Updating Dependencies

```bash
# Update all dependencies
pnpm update

# Update specific package
pnpm update @prisma/client

# Regenerate lock file
pnpm install
```

## Support

For issues or questions:
- GitHub Issues: https://github.com/tschew72/gameblitz/issues
