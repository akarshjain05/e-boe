# e-BoE (Electronic Bills of Exchange Management System)

An enterprise-grade SaaS application for managing Bills of Exchange. Built with React 19, FastAPI, PostgreSQL, and Redis.

## Features
- Complete Bill of Exchange Lifecycle Management
- Multi-company / Multi-branch support
- Payment processing & Receipts
- Comprehensive Role-Based Access Control (RBAC)
- Advanced Document Management (PDFs, Images)
- Automated PDF Generation (ReportLab/WeasyPrint)
- Real-time Notifications (WebSockets)
- Scheduled Tasks (Celery)
- Extensive Audit Logging

## Tech Stack
- **Frontend**: React 19, Vite, TypeScript, TailwindCSS v4, shadcn/ui, TanStack Query, Zustand, Axios
- **Backend**: Python 3.13, FastAPI, SQLAlchemy 2.0 (Async), Alembic, Pydantic v2
- **Database**: PostgreSQL 16
- **Cache/Broker**: Redis 7
- **Workers**: Celery
- **Infrastructure**: Docker, NGINX

## Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local frontend dev)
- Python 3.13+ (for local backend dev)

## Quick Start
1. Clone the repository
2. Copy environment files:
   ```bash
   cp .env.example .env.development
   cp .env.example .env.production
   cp .env.example backend/.env
   ```
3. Start the development environment:
   ```bash
   make dev
   ```
4. Access the application:
   - Frontend: http://localhost:5173
   - Backend API Docs: http://localhost:8000/docs
