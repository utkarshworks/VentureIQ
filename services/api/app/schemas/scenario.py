from typing import Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.engine.scenarios import ScenarioType


class ScenarioCreateRequest(BaseModel):
    name: str
    scenario_type: ScenarioType = ScenarioType.CUSTOM
    description: Optional[str] = None
    overrides: Dict[str, Any] = {}


class ScenarioUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    overrides: Optional[Dict[str, Any]] = None


class ScenarioResponse(BaseModel):
    id: str
    model_id: str
    name: str
    scenario_type: str
    description: Optional[str]
    overrides: Dict[str, Any]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
