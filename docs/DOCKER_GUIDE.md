# Docker Guide

This document covers Docker build, deployment, and management procedures for the Authentication System project.

## Table of Contents

1. [Docker Overview](#docker-overview)
2. [Image Tagging Strategy](#image-tagging-strategy)
3. [Local Development](#local-development)
4. [Building Images](#building-images)
5. [Docker Hub Deployment](#docker-hub-deployment)
6. [Environment Configuration](#environment-configuration)
7. [Container Management](#container-management)
8. [Troubleshooting](#troubleshooting)

---

## Docker Overview

### Architecture

```
┌─────────────┐
│   Docker    │
│   Desktop   │
└──────┬──────┘
       │
       ├── Backend Container (Node.js/Express)
       ├── Frontend Container (React)
       ├── PostgreSQL Container
       └── Redis Container
```

### Services

- **backend**: Express.js API server (port 5000)
- **frontend**: React development server (port 3000)
- **postgres**: PostgreSQL database (port 5432)
- **redis**: Redis cache (port 6379)

---

## Image Tagging Strategy

### Format: Hybrid (Version + Git SHA)

```
v{major}.{minor}.{patch}-{git-sha}
```

### Examples

- `v1.0.0-abc123f` - Initial production release
- `v1.1.0-def456a` - Minor version update
- `v2.0.0-ghi789b` - Major version update

### Tag Components

1. **Version** (`v1.0.0`)
   - **Major**: Breaking changes
   - **Minor**: New features (backward compatible)
   - **Patch**: Bug fixes

2. **Git SHA** (`abc123f`)
   - Short commit hash (7 characters)
   - Enables exact code traceability
   - Facilitates rollback

### Environment Tags

- **latest**: Always points to latest production build
- **staging**: Current staging environment version
- **development**: Latest development build

### Full Image Name Format

```
<dockerhub-username>/<repository>:<tag>

Examples:
mstor/auth-backend:v1.0.0-abc123f
mstor/auth-backend:latest
mstor/auth-frontend:v1.0.0-abc123f
```

---

## Local Development

### Starting Development Environment

```bash
# Start all containers
docker-compose up -d

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

### Stopping Development Environment

```bash
# Stop all containers
docker-compose down

# Stop and remove volumes (⚠️ deletes data)
docker-compose down -v
```

### Individual Container Commands

```bash
# Start specific service
docker-compose up -d postgres

# Stop specific service
docker-compose stop backend

# Restart service
docker-compose restart frontend

# View service logs
docker-compose logs -f backend
```

### Accessing Containers

```bash
# Execute command in running container
docker-compose exec backend bash
docker-compose exec postgres psql -U postgres

# Run one-off command
docker-compose run backend npm test
```

---

## Building Images

### Development Build

```bash
# Build backend
cd backend
docker build -t auth-backend:dev .

# Build frontend
cd frontend
docker build -t auth-frontend:dev .
```

### Production Build

```bash
# Get current git SHA
GIT_SHA=$(git rev-parse --short HEAD)
VERSION="v1.0.0"
TAG="${VERSION}-${GIT_SHA}"

# Build backend with tag
cd backend
docker build -t mstor/auth-backend:${TAG} -f Dockerfile.prod .
docker tag mstor/auth-backend:${TAG} mstor/auth-backend:latest

# Build frontend with tag
cd frontend
docker build -t mstor/auth-frontend:${TAG} -f Dockerfile.prod .
docker tag mstor/auth-frontend:${TAG} mstor/auth-frontend:latest
```

### Multi-Platform Build (Optional)

```bash
# Build for multiple architectures
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t mstor/auth-backend:${TAG} \
  --push \
  .
```

### Build Arguments

```bash
# Pass build arguments
docker build \
  --build-arg NODE_ENV=production \
  --build-arg API_URL=https://api.example.com \
  -t mstor/auth-backend:${TAG} \
  .
```

---

## Docker Hub Deployment

### Prerequisites

1. Docker Hub account created
2. Repository created on Docker Hub
3. Local Docker logged in

### Login to Docker Hub

```bash
# Login
docker login

# Enter username and password when prompted
```

### Push Images to Docker Hub

```bash
# Get tag info
GIT_SHA=$(git rev-parse --short HEAD)
VERSION="v1.0.0"
TAG="${VERSION}-${GIT_SHA}"

# Push backend
docker push mstor/auth-backend:${TAG}
docker push mstor/auth-backend:latest

# Push frontend
docker push mstor/auth-frontend:${TAG}
docker push mstor/auth-frontend:latest
```

### Verify Push

```bash
# List images on Docker Hub
docker search mstor/auth-backend

# Or check Docker Hub website
# https://hub.docker.com/r/mstor/auth-backend
```

### Pull Images

```bash
# Pull specific version
docker pull mstor/auth-backend:v1.0.0-abc123f

# Pull latest
docker pull mstor/auth-backend:latest
```

---

## Environment Configuration

### Development Environment (.env.development)

```env
# Backend
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/authdb
REDIS_URL=redis://redis:6379
JWT_SECRET=dev-secret-key-change-in-production
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_EXPIRES_IN=7d

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@example.com

# Frontend
REACT_APP_API_URL=http://localhost:5000
REACT_APP_ENV=development
```

### Staging Environment (.env.staging)

```env
# Backend
NODE_ENV=staging
PORT=5000
DATABASE_URL=postgresql://user:pass@staging-db:5432/authdb
REDIS_URL=redis://staging-redis:6379
JWT_SECRET=staging-secret-key-use-strong-password
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_EXPIRES_IN=7d

# Email
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
EMAIL_FROM=noreply@staging.example.com

# Frontend
REACT_APP_API_URL=https://api-staging.example.com
REACT_APP_ENV=staging
```

### Production Environment (.env.production)

```env
# Backend
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://user:pass@prod-db:5432/authdb
REDIS_URL=redis://prod-redis:6379
JWT_SECRET=production-secret-key-use-very-strong-password
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# Email
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
EMAIL_FROM=noreply@example.com

# OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Frontend
REACT_APP_API_URL=https://api.example.com
REACT_APP_ENV=production

# Security
RATE_LIMIT_WINDOW=15m
RATE_LIMIT_MAX=100
CORS_ORIGIN=https://example.com
```

### Environment Variables in Docker Compose

```yaml
# docker-compose.yml
services:
  backend:
    env_file:
      - .env.development
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/authdb
      - REDIS_URL=redis://redis:6379
```

---

## Container Management

### Health Checks

```yaml
# docker-compose.yml
services:
  backend:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

### Resource Limits

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

### Networking

```bash
# List networks
docker network ls

# Inspect network
docker network inspect auth-system_default

# Create custom network
docker network create auth-network
```

### Volumes

```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect auth-system_postgres_data

# Remove unused volumes
docker volume prune

# Backup volume
docker run --rm \
  -v auth-system_postgres_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/postgres-backup.tar.gz /data
```

### Cleanup

```bash
# Remove stopped containers
docker container prune

# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Remove everything unused
docker system prune -a --volumes
```

---

## Deployment Workflows

### Staging Deployment

```bash
#!/bin/bash
# deploy-staging.sh

set -e

echo "Starting staging deployment..."

# Get version info
GIT_SHA=$(git rev-parse --short HEAD)
VERSION="v1.0.0"
TAG="${VERSION}-${GIT_SHA}"

echo "Version: ${TAG}"

# Build images
echo "Building backend..."
cd backend
docker build -t mstor/auth-backend:${TAG} -f Dockerfile.prod .
docker tag mstor/auth-backend:${TAG} mstor/auth-backend:staging

echo "Building frontend..."
cd ../frontend
docker build -t mstor/auth-frontend:${TAG} -f Dockerfile.prod .
docker tag mstor/auth-frontend:${TAG} mstor/auth-frontend:staging

# Push to Docker Hub
echo "Pushing to Docker Hub..."
docker push mstor/auth-backend:${TAG}
docker push mstor/auth-backend:staging
docker push mstor/auth-frontend:${TAG}
docker push mstor/auth-frontend:staging

# Pull on staging server (via SSH or CD tool)
echo "Deploying to staging server..."
# ssh staging-server "docker-compose pull && docker-compose up -d"

echo "Staging deployment complete!"
echo "Tag: ${TAG}"
```

### Production Deployment

```bash
#!/bin/bash
# deploy-production.sh

set -e

echo "Starting production deployment..."

# Get version info
GIT_SHA=$(git rev-parse --short HEAD)
VERSION="v1.0.0"
TAG="${VERSION}-${GIT_SHA}"

echo "Version: ${TAG}"
echo "⚠️  Deploying to PRODUCTION. Continue? (y/n)"
read -r confirm

if [ "$confirm" != "y" ]; then
  echo "Deployment cancelled"
  exit 1
fi

# Tag staging images as production
docker pull mstor/auth-backend:staging
docker tag mstor/auth-backend:staging mstor/auth-backend:${TAG}
docker tag mstor/auth-backend:staging mstor/auth-backend:latest

docker pull mstor/auth-frontend:staging
docker tag mstor/auth-frontend:staging mstor/auth-frontend:${TAG}
docker tag mstor/auth-frontend:staging mstor/auth-frontend:latest

# Push to Docker Hub
echo "Pushing to Docker Hub..."
docker push mstor/auth-backend:${TAG}
docker push mstor/auth-backend:latest
docker push mstor/auth-frontend:${TAG}
docker push mstor/auth-frontend:latest

# Deploy to production
echo "Deploying to production server..."
# ssh prod-server "docker-compose pull && docker-compose up -d"

echo "Production deployment complete!"
echo "Tag: ${TAG}"
```

---

## Troubleshooting

### Common Issues

#### Container Won't Start

```bash
# Check logs
docker-compose logs backend

# Check if port is in use
netstat -an | grep 5000

# Remove and recreate container
docker-compose rm -f backend
docker-compose up -d backend
```

#### Database Connection Failed

```bash
# Check if postgres is running
docker-compose ps postgres

# Check postgres logs
docker-compose logs postgres

# Verify connection string
docker-compose exec backend env | grep DATABASE_URL

# Test connection
docker-compose exec postgres psql -U postgres -d authdb -c "SELECT 1;"
```

#### Image Build Fails

```bash
# Clear build cache
docker builder prune

# Build without cache
docker build --no-cache -t auth-backend:dev .

# Check Dockerfile syntax
docker build --check .
```

#### Out of Disk Space

```bash
# Check disk usage
docker system df

# Clean up
docker system prune -a --volumes

# Remove specific old images
docker images | grep auth-backend | awk '{print $3}' | xargs docker rmi
```

#### Container Crashes Immediately

```bash
# Run container in interactive mode to debug
docker run -it auth-backend:dev sh

# Check entry point
docker inspect auth-backend:dev | grep -A 5 Entrypoint

# Override entry point for debugging
docker run -it --entrypoint sh auth-backend:dev
```

### Performance Issues

```bash
# Check resource usage
docker stats

# Increase memory limit
# Edit docker-compose.yml or Docker Desktop settings

# Check for memory leaks
docker-compose exec backend npm run memory-profiler
```

### Network Issues

```bash
# Check network connectivity
docker-compose exec backend ping postgres

# Inspect network
docker network inspect auth-system_default

# Recreate network
docker-compose down
docker network prune
docker-compose up -d
```

---

## Best Practices

1. **Use .dockerignore** - Exclude unnecessary files from build context
2. **Multi-stage builds** - Reduce image size
3. **Layer caching** - Order Dockerfile commands for optimal caching
4. **Don't run as root** - Create non-root user in container
5. **Health checks** - Add health check endpoints
6. **Resource limits** - Set memory and CPU limits
7. **Secrets management** - Use Docker secrets or env files (not in image)
8. **Logging** - Use stdout/stderr for container logs
9. **Version tags** - Always tag images with versions
10. **Regular updates** - Keep base images updated

---

## Docker Commands Reference

### Images

```bash
docker images                    # List images
docker build -t name:tag .      # Build image
docker rmi image-id             # Remove image
docker tag source target        # Tag image
docker push name:tag            # Push to registry
docker pull name:tag            # Pull from registry
```

### Containers

```bash
docker ps                       # List running containers
docker ps -a                    # List all containers
docker run name:tag             # Create and start container
docker start container-id       # Start stopped container
docker stop container-id        # Stop running container
docker rm container-id          # Remove container
docker logs container-id        # View logs
docker exec -it container sh    # Execute command in container
```

### Docker Compose

```bash
docker-compose up -d            # Start services
docker-compose down             # Stop services
docker-compose ps               # List services
docker-compose logs -f          # View logs
docker-compose build            # Build services
docker-compose pull             # Pull service images
docker-compose restart          # Restart services
```

---

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Docker Hub](https://hub.docker.com/)
- [Best Practices for Writing Dockerfiles](https://docs.docker.com/develop/dev-best-practices/)

---

*Last Updated: November 5, 2025*
