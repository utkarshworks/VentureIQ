"""
VentureIQ API - Main Application Entrypoint
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
import app.models  # Ensure all models are registered

from app.api.v1.health import router as health_router
from app.api.v1.auth import router as auth_router
from app.api.v1.simulation import router as simulation_router
from app.api.v1.models import router as models_router
from app.api.v1.scenarios import router as scenarios_router
from app.api.v1.reverse_plan import router as reverse_plan_router
from app.api.v1.sensitivity import router as sensitivity_router
from app.api.v1.exports import router as exports_router
from app.api.v1.ai import router as ai_router
from app.api.v1.imports import router as imports_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables on startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="VentureIQ: Deterministic Startup Financial Planning & Unit Economics Decision Intelligence API",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.ENVIRONMENT == "development" else settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API v1 Routers
api_v1_prefix = settings.API_V1_STR
app.include_router(health_router, prefix=api_v1_prefix)
app.include_router(auth_router, prefix=api_v1_prefix)
app.include_router(simulation_router, prefix=api_v1_prefix)
app.include_router(models_router, prefix=api_v1_prefix)
app.include_router(scenarios_router, prefix=api_v1_prefix)
app.include_router(reverse_plan_router, prefix=api_v1_prefix)
app.include_router(sensitivity_router, prefix=api_v1_prefix)
app.include_router(exports_router, prefix=api_v1_prefix)
app.include_router(ai_router, prefix=api_v1_prefix)
app.include_router(imports_router, prefix=api_v1_prefix)


@app.get("/")
def root():
    return {
        "project": "VentureIQ API",
        "tagline": "Model the business. Understand the trade-offs. Make better decisions.",
        "documentation": "/docs",
        "version": "1.0.0",
    }

