"""
Scenario API Endpoints (Creation, listing, and multi-scenario comparison).
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from app.api.deps import get_model_repo
from app.repositories.model_repository import ModelRepository
from app.schemas.scenario import ScenarioCreateRequest, ScenarioResponse
from app.engine.models import ModelEngineInputs
from app.engine.scenarios import (
    ScenarioConfig,
    ScenarioType,
    compare_scenarios,
    ScenarioComparisonResult,
    get_default_optimistic_overrides,
    get_default_downside_overrides,
)

router = APIRouter(prefix="/models/{model_id}/scenarios", tags=["Scenarios"])


@router.get("", response_model=List[ScenarioResponse])
async def list_scenarios(model_id: str, repo: ModelRepository = Depends(get_model_repo)):
    return await repo.get_scenarios(model_id)


@router.post("", response_model=ScenarioResponse, status_code=status.HTTP_201_CREATED)
async def create_scenario(
    model_id: str,
    req: ScenarioCreateRequest,
    repo: ModelRepository = Depends(get_model_repo),
):
    scenario = await repo.add_scenario(
        model_id=model_id,
        name=req.name,
        scenario_type=req.scenario_type.value,
        description=req.description,
        overrides=req.overrides,
    )
    if not scenario:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Financial model not found")
    return scenario


@router.post("/compare", response_model=ScenarioComparisonResult)
async def compare_all_scenarios(
    model_id: str,
    repo: ModelRepository = Depends(get_model_repo),
):
    model = await repo.get_model(model_id)
    if not model:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Financial model not found")

    base_inputs = ModelEngineInputs(**model.configuration)
    db_scenarios = await repo.get_scenarios(model_id)

    scenario_configs: List[ScenarioConfig] = []
    # Always include Base Case
    scenario_configs.append(
        ScenarioConfig(
            id="base",
            name="Base Case",
            scenario_type=ScenarioType.BASE,
            description="Baseline model assumptions",
            overrides={},
        )
    )

    # Check if Optimistic or Downside exist in DB; if not, supply default calculated presets
    has_opt = any(s.scenario_type == "optimistic" for s in db_scenarios)
    has_down = any(s.scenario_type == "downside" for s in db_scenarios)

    if not has_opt:
        scenario_configs.append(
            ScenarioConfig(
                id="default_optimistic",
                name="Optimistic Case",
                scenario_type=ScenarioType.OPTIMISTIC,
                description="Enhanced conversion (+25%) and retention (+20%)",
                overrides=get_default_optimistic_overrides(base_inputs),
            )
        )

    if not has_down:
        scenario_configs.append(
            ScenarioConfig(
                id="default_downside",
                name="Downside Case",
                scenario_type=ScenarioType.DOWNSIDE,
                description="Decreased conversion (-25%) and higher churn (+30%)",
                overrides=get_default_downside_overrides(base_inputs),
            )
        )

    for s in db_scenarios:
        if s.scenario_type != "base":
            scenario_configs.append(
                ScenarioConfig(
                    id=s.id,
                    name=s.name,
                    scenario_type=ScenarioType(s.scenario_type),
                    description=s.description,
                    overrides=s.overrides,
                )
            )

    return compare_scenarios(base_inputs, scenario_configs)
