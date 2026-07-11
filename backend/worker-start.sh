#!/bin/bash
set -e

# Wait for Redis
echo "Waiting for Redis..."
while ! nc -z localhost 6379; do
  sleep 1
done
echo "Redis started"

# Run Celery Worker & Beat in the background
echo "Starting Celery Worker..."
celery -A app.core.celery_app worker --loglevel=info &

echo "Starting Celery Beat..."
celery -A app.core.celery_app beat --loglevel=info &

# Wait for any process to exit
wait -n
  
# Exit with status of process that exited first
exit $?
