"""
Persistent Financial Model Endpoints.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from app.api.deps import get_model_repo
from app.repositories.model_repository import ModelRepository
from app.schemas.financial_model import (
    ModelCreateRequest,
    ModelUpdateRequest,
    ModelSummaryResponse,
    ModelDetailResponse,
)
from app.engine.models import ModelEngineInputs, EngineSimulationResult
from app.engine.simulator import simulate_model

router = APIRouter(prefix="/models", tags=["Financial Models"])


@router.get("", response_model=List[ModelSummaryResponse])
async def list_models(repo: ModelRepository = Depends(get_model_repo)):
    return await repo.list_models()


@router.post("", response_model=ModelDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_model(req: ModelCreateRequest, repo: ModelRepository = Depends(get_model_repo)):
    model = await repo.create_model(
        name=req.name,
        business_model=req.business_model.value,
        currency=req.currency.value,
        start_date=req.start_date,
        planning_horizon=req.planning_horizon,
        inputs=req.inputs,
        description=req.description,
    )
    return ModelDetailResponse(
        id=model.id,
        organization_id=model.organization_id,
        name=model.name,
        business_model=model.business_model,
        currency=model.currency,
        start_date=model.start_date,
        planning_horizon=model.planning_horizon,
        description=model.description,
        created_at=model.created_at,
        updated_at=model.updated_at,
        configuration=model.configuration,
        active_scenarios_count=1,
    )


@router.get("/{model_id}", response_model=ModelDetailResponse)
async def get_model(model_id: str, repo: ModelRepository = Depends(get_model_repo)):
    model = await repo.get_model(model_id)
    if not model:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Financial model not found")
    scenarios = await repo.get_scenarios(model_id)
    return ModelDetailResponse(
        id=model.id,
        organization_id=model.organization_id,
        name=model.name,
        business_model=model.business_model,
        currency=model.currency,
        start_date=model.start_date,
        planning_horizon=model.planning_horizon,
        description=model.description,
        created_at=model.created_at,
        updated_at=model.updated_at,
        configuration=model.configuration,
        active_scenarios_count=len(scenarios),
    )


@router.patch("/{model_id}", response_model=ModelDetailResponse)
async def update_model(
    model_id: str,
    req: ModelUpdateRequest,
    repo: ModelRepository = Depends(get_model_repo),
):
    model = await repo.update_model(
        model_id=model_id,
        name=req.name,
        description=req.description,
        inputs=req.inputs,
    )
    if not model:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Financial model not found")
    scenarios = await repo.get_scenarios(model_id)
    return ModelDetailResponse(
        id=model.id,
        organization_id=model.organization_id,
        name=model.name,
        business_model=model.business_model,
        currency=model.currency,
        start_date=model.start_date,
        planning_horizon=model.planning_horizon,
        description=model.description,
        created_at=model.created_at,
        updated_at=model.updated_at,
        configuration=model.configuration,
        active_scenarios_count=len(scenarios),
    )


@router.delete("/{model_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_model(model_id: str, repo: ModelRepository = Depends(get_model_repo)):
    deleted = await repo.delete_model(model_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Financial model not found")
    return None


@router.post("/{model_id}/run", response_model=EngineSimulationResult)
async def run_saved_model(
    model_id: str,
    scenario_id: Optional[str] = None,
    repo: ModelRepository = Depends(get_model_repo),
):
    model = await repo.get_model(model_id)
    if not model:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Financial model not found")

    config = model.configuration.copy()
    if scenario_id:
        scenarios = await repo.get_scenarios(model_id)
        sc = next((s for s in scenarios if s.id == scenario_id), None)
        if sc and sc.overrides:
            config.update(sc.overrides)

    inputs = ModelEngineInputs(**config)
    sim_result = simulate_model(inputs)

    # Persist run record
    await repo.record_run(
        model_id=model_id,
        scenario_id=scenario_id,
        summary=sim_result.summary.model_dump(),
        projections=[p.model_dump() for p in sim_result.projections],
        warnings=[w.model_dump() for w in sim_result.warnings],
    )

    return sim_result

