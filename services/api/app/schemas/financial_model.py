"""
Pydantic Schemas for Financial Models and Configuration.
"""
from typing import Dict, Any, Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from app.engine.models import (
    ModelEngineInputs,
    BusinessModelType,
    CurrencyCode,
    EngineSimulationResult,
    EngineSummary,
    MonthlyProjection,
    ModelWarning,
)


class ModelCreateRequest(BaseModel):
    name: str = "B2B SaaS Growth Model"
    business_model: BusinessModelType = BusinessModelType.B2B_SAAS
    currency: CurrencyCode = CurrencyCode.INR
    start_date: str = "2026-01"
    planning_horizon: int = Field(default=12, ge=1, le=36)
    description: Optional[str] = None
    inputs: ModelEngineInputs


class ModelUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    inputs: Optional[ModelEngineInputs] = None


class ModelSummaryResponse(BaseModel):
    id: str
    organization_id: str
    name: str
    business_model: str
    currency: str
    start_date: str
    planning_horizon: int
    description: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ModelDetailResponse(ModelSummaryResponse):
    configuration: Dict[str, Any]
    active_scenarios_count: int = 1
