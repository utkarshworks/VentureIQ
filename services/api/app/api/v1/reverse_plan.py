"""
Reverse Planning API Endpoints.
"""
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from app.api.deps import get_model_repo
from app.repositories.model_repository import ModelRepository
from app.engine.models import ModelEngineInputs
from app.engine.reverse_planner import (
    ReversePlanRequest,
    ReversePlanResult,
    solve_reverse_plan,
)

router = APIRouter(tags=["Reverse Planning"])


class StatelessReversePlanPayload(BaseModel):
    base_inputs: ModelEngineInputs
    plan_request: ReversePlanRequest


class SaveSolutionAsScenarioRequest(BaseModel):
    scenario_name: str = "Reverse-Planned Milestone"
    description: str = "Assumptions identified by reverse planning optimizer"
    solution_assumptions: Dict[str, Any]


@router.post("/reverse-plan/solve", response_model=ReversePlanResult)
def solve_stateless(payload: StatelessReversePlanPayload):
    """Stateless reverse planning solver."""
    return solve_reverse_plan(payload.base_inputs, payload.plan_request)


@router.post("/models/{model_id}/reverse-plan", response_model=ReversePlanResult)
async def solve_for_saved_model(
    model_id: str,
    req: ReversePlanRequest,
    repo: ModelRepository = Depends(get_model_repo),
):
    model = await repo.get_model(model_id)
    if not model:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Financial model not found")
    base_inputs = ModelEngineInputs(**model.configuration)
    return solve_reverse_plan(base_inputs, req)


@router.post("/models/{model_id}/reverse-plan/save-scenario", status_code=status.HTTP_201_CREATED)
async def save_solution_scenario(
    model_id: str,
    req: SaveSolutionAsScenarioRequest,
    repo: ModelRepository = Depends(get_model_repo),
):
    scenario = await repo.add_scenario(
        model_id=model_id,
        name=req.scenario_name,
        scenario_type="custom",
        description=req.description,
        overrides=req.solution_assumptions,
    )
    if not scenario:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Financial model not found")
    return {"message": "Reverse planning solution saved as scenario successfully", "scenario_id": scenario.id}

