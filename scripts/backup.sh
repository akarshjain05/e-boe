#!/bin/bash
set -e

# Backup script for PostgreSQL
# Usage: ./backup.sh

BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/eboe_backup_$TIMESTAMP.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "Starting backup to $BACKUP_FILE..."

# Find the postgres container
CONTAINER_NAME=$(docker ps --format '{{.Names}}' | grep postgres)

if [ -z "$CONTAINER_NAME" ]; then
    echo "PostgreSQL container not found. Are you sure it's running?"
    exit 1
fi

docker exec -t $CONTAINER_NAME pg_dump -U eboe -d eboe_dev -c | gzip > "$BACKUP_FILE"

echo "Backup completed successfully!"

# Delete backups older than 30 days
find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +30 -delete
echo "Cleaned up old backups."
