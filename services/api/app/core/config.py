"""
Application Configuration Settings.
"""
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    PROJECT_NAME: str = "VentureIQ"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = Field(
        default="sqlite+aiosqlite:///./ventureiq.db",
        description="Async database connection string",
    )
    SYNC_DATABASE_URL: str = Field(
        default="sqlite:///./ventureiq.db",
        description="Sync database string for Alembic migrations",
    )

    # Security
    SECRET_KEY: str = "ventureiq-insecure-dev-key-change-in-production-1234567890"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # CORS
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"


    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origin_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


settings = Settings()
