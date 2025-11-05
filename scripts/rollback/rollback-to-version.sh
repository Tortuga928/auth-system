#!/bin/bash
# Rollback Docker deployment to specific version
# Usage: ./rollback-to-version.sh <version> [environment]
# Example: ./rollback-to-version.sh v1.0.0-abc123f staging

set -e

VERSION=$1
ENVIRONMENT=${2:-staging}

if [ -z "$VERSION" ]; then
  echo "Usage: ./rollback-to-version.sh <version> [environment]"
  echo "Example: ./rollback-to-version.sh v1.0.0-abc123f staging"
  echo ""
  echo "Environments: staging, production"
  exit 1
fi

echo "============================================"
echo "  Docker Rollback to Version: $VERSION"
echo "  Environment: $ENVIRONMENT"
echo "============================================"
echo ""

# Validate environment
if [ "$ENVIRONMENT" != "staging" ] && [ "$ENVIRONMENT" != "production" ]; then
  echo "❌ Invalid environment: $ENVIRONMENT"
  echo "Valid options: staging, production"
  exit 1
fi

# Production warning
if [ "$ENVIRONMENT" == "production" ]; then
  echo "⚠️  WARNING: Rolling back PRODUCTION environment"
  echo ""
  read -p "Are you absolutely sure? Type 'ROLLBACK PRODUCTION' to confirm: " confirm
  if [ "$confirm" != "ROLLBACK PRODUCTION" ]; then
    echo "Rollback cancelled"
    exit 0
  fi
fi

# Pull images
echo "Pulling Docker images for version: $VERSION..."
docker pull mstor/auth-backend:$VERSION || {
  echo "❌ Failed to pull backend image: $VERSION"
  echo "Available tags: https://hub.docker.com/r/mstor/auth-backend/tags"
  exit 1
}

docker pull mstor/auth-frontend:$VERSION || {
  echo "❌ Failed to pull frontend image: $VERSION"
  echo "Available tags: https://hub.docker.com/r/mstor/auth-frontend/tags"
  exit 1
}

echo "✓ Images pulled successfully"
echo ""

# Update docker-compose file
COMPOSE_FILE="docker-compose.${ENVIRONMENT}.yml"

if [ ! -f "$COMPOSE_FILE" ]; then
  echo "❌ Error: $COMPOSE_FILE not found"
  exit 1
fi

# Backup current compose file
echo "Backing up $COMPOSE_FILE..."
cp $COMPOSE_FILE ${COMPOSE_FILE}.backup.$(date +%Y%m%d-%H%M%S)

# Update image tags
echo "Updating image tags in $COMPOSE_FILE..."
sed -i.tmp "s|image: mstor/auth-backend:.*|image: mstor/auth-backend:${VERSION}|g" $COMPOSE_FILE
sed -i.tmp "s|image: mstor/auth-frontend:.*|image: mstor/auth-frontend:${VERSION}|g" $COMPOSE_FILE
rm ${COMPOSE_FILE}.tmp 2>/dev/null || true

echo "✓ Updated $COMPOSE_FILE"
echo ""

# Restart containers
echo "Restarting containers..."
docker-compose -f $COMPOSE_FILE down
docker-compose -f $COMPOSE_FILE up -d

echo ""
echo "Waiting for services to start..."
sleep 10

# Check health
echo "Checking service health..."

if curl -f http://localhost:5000/health > /dev/null 2>&1; then
  echo "✓ Backend healthy"
else
  echo "❌ Backend health check failed"
  echo ""
  echo "Rolling back to previous configuration..."

  # Restore backup
  LATEST_BACKUP=$(ls -t ${COMPOSE_FILE}.backup.* | head -1)
  if [ -f "$LATEST_BACKUP" ]; then
    cp $LATEST_BACKUP $COMPOSE_FILE
    docker-compose -f $COMPOSE_FILE up -d
    echo "Restored previous configuration"
  fi

  exit 1
fi

if curl -f http://localhost:3000 > /dev/null 2>&1; then
  echo "✓ Frontend healthy"
else
  echo "⚠️  Frontend health check failed (may need manual verification)"
fi

echo ""
echo "✅ Rollback to $VERSION complete!"
echo ""
echo "Next steps:"
echo "1. Verify functionality manually"
echo "2. Check logs: docker-compose -f $COMPOSE_FILE logs"
echo "3. Monitor error rates"
echo "4. Update PROJECT_ROADMAP.md with rollback details"
echo ""
echo "Rollback completed at: $(date)"
echo ""
