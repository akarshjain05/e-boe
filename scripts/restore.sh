#!/bin/bash
set -e

# Restore script for PostgreSQL
# Usage: ./restore.sh <backup_file>

if [ -z "$1" ]; then
    echo "Usage: ./restore.sh <backup_file>"
    exit 1
fi

BACKUP_FILE=$1

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Backup file not found!"
    exit 1
fi

echo "WARNING: This will overwrite the current database!"
read -p "Are you sure you want to continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

# Find the postgres container
CONTAINER_NAME=$(docker ps --format '{{.Names}}' | grep postgres)

if [ -z "$CONTAINER_NAME" ]; then
    echo "PostgreSQL container not found. Are you sure it's running?"
    exit 1
fi

echo "Restoring from $BACKUP_FILE..."

gunzip -c "$BACKUP_FILE" | docker exec -i $CONTAINER_NAME psql -U eboe -d eboe_dev

echo "Restore completed successfully!"
