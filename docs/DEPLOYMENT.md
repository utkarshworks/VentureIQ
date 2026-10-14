# VentureIQ: Deployment & Operational Runbook

## 1. Production Architecture Overview

VentureIQ is packaged into production-ready containers:
- **Frontend Container:** Next.js Node.js server (or static standalone build) running on port 3000.
- **Backend API Container:** FastAPI ASGI application served via Uvicorn/Gunicorn with multiple workers on port 8000.
- **Database:** Managed PostgreSQL 16+ instance with SSL enforced.
- **Reverse Proxy / Ingress:** Nginx or Cloud Load Balancer with TLS termination.

---

## 2. Production Environment Configuration

Refer to `.env.example`. Required keys:
- `DATABASE_URL`: `postgresql+asyncpg://user:password@host:5432/ventureiq` (and sync counterpart for migrations: `postgresql://user:password@host:5432/ventureiq`)
- `SECRET_KEY`: High-entropy 256-bit secret for JWT signature verification.
- `ALGORITHM`: `HS256`
- `ACCESS_TOKEN_EXPIRE_MINUTES`: 1440 (24 hours)
- `CORS_ORIGINS`: Comma-separated list of allowed frontend origins (e.g. `http://localhost:3000,https://app.ventureiq.io`).
- `ENVIRONMENT`: `production` or `development`

---

## 4. Database Migrations & Rollback Procedures

### Forward Migration
```bash
cd services/api
alembic upgrade head
```

### Rollback Procedure
```bash
# Roll back one migration step
alembic downgrade -1

# Roll back to specific revision
alembic downgrade <revision_id>
```

---

## 5. Health Checks & Monitoring
- **Liveness probe:** `GET /api/v1/health` $\to$ Returns `{"status": "ok"}`
- **Readiness probe:** `GET /api/v1/health/ready` $\to$ Validates database connection pool and returns `{"database": "connected"}`.
