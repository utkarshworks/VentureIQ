"""
Pytest global fixtures for API tests.
"""
import pytest
import pytest_asyncio
from app.core.database import engine, Base
import app.models  # Register all models


@pytest_asyncio.fixture(autouse=True, scope="function")
async def setup_test_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

