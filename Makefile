.PHONY: dev stop build test lint migrate seed backup logs clean shell-backend shell-db

dev:
	docker compose up -d

stop:
	docker compose down

build:
	docker compose build

test:
	docker compose exec backend pytest

lint:
	docker compose exec backend ruff check .
	docker compose exec backend mypy .

migrate:
	docker compose exec backend alembic upgrade head

seed:
	docker compose exec backend python scripts/seed_data.py

backup:
	./scripts/backup.sh

logs:
	docker compose logs -f

clean:
	docker compose down -v
	rm -rf backend/.pytest_cache
	rm -rf backend/.ruff_cache
	rm -rf frontend/dist
	find . -type d -name __pycache__ -exec rm -r {} +

shell-backend:
	docker compose exec backend /bin/bash

shell-db:
	docker compose exec postgres psql -U eboe -d eboe_dev
