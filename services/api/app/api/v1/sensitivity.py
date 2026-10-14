"""
Sensitivity Analysis API Endpoints.
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from app.api.deps import get_model_repo
from app.repositories.model_repository import ModelRepository
from app.engine.models import ModelEngineInputs
from app.engine.sensitivity import (
    run_one_var_sensitivity,
    run_two_var_sensitivity,
    run_tornado_analysis,
    OneVarSensitivityResult,
    TwoVarSensitivityResult,
    TornadoSensitivityResult,
)

router = APIRouter(tags=["Sensitivity Analysis"])


class StatelessOneVarPayload(BaseModel):
    base_inputs: ModelEngineInputs
    variable_name: str
    percent_steps: Optional[List[float]] = None


class StatelessTwoVarPayload(BaseModel):
    base_inputs: ModelEngineInputs
    var_x: str
    var_y: str
    metric_name: str = "month_12_arr"
    num_steps: int = 5


class StatelessTornadoPayload(BaseModel):
    base_inputs: ModelEngineInputs
    outcome_metric: str = "month_12_arr"
    perturbation_pct: float = 0.20


@router.post("/sensitivity/one-var", response_model=OneVarSensitivityResult)
def evaluate_one_var_stateless(payload: StatelessOneVarPayload):
    return run_one_var_sensitivity(payload.base_inputs, payload.variable_name, payload.percent_steps)


@router.post("/sensitivity/two-var", response_model=TwoVarSensitivityResult)
def evaluate_two_var_stateless(payload: StatelessTwoVarPayload):
    return run_two_var_sensitivity(payload.base_inputs, payload.var_x, payload.var_y, payload.metric_name, payload.num_steps)


@router.post("/sensitivity/tornado", response_model=TornadoSensitivityResult)
def evaluate_tornado_stateless(payload: StatelessTornadoPayload):
    return run_tornado_analysis(payload.base_inputs, payload.outcome_metric, payload.perturbation_pct)


@router.get("/models/{model_id}/sensitivity/one-var", response_model=OneVarSensitivityResult)
async def evaluate_one_var_saved(
    model_id: str,
    variable_name: str = Query(..., description="Variable key e.g. arpu, customer_churn_rate"),
    repo: ModelRepository = Depends(get_model_repo),
):
    model = await repo.get_model(model_id)
    if not model:
        raise HTTPException(status_code=404, detail="Financial model not found")
    inputs = ModelEngineInputs(**model.configuration)
    return run_one_var_sensitivity(inputs, variable_name)


@router.get("/models/{model_id}/sensitivity/two-var", response_model=TwoVarSensitivityResult)
async def evaluate_two_var_saved(
    model_id: str,
    var_x: str = Query("arpu"),
    var_y: str = Query("lead_conversion_rate"),
    metric_name: str = Query("month_12_arr"),
    repo: ModelRepository = Depends(get_model_repo),
):
    model = await repo.get_model(model_id)
    if not model:
        raise HTTPException(status_code=404, detail="Financial model not found")
    inputs = ModelEngineInputs(**model.configuration)
    return run_two_var_sensitivity(inputs, var_x, var_y, metric_name)


@router.get("/models/{model_id}/sensitivity/tornado", response_model=TornadoSensitivityResult)
async def evaluate_tornado_saved(
    model_id: str,
    outcome_metric: str = Query("month_12_arr"),
    repo: ModelRepository = Depends(get_model_repo),
):
    model = await repo.get_model(model_id)
    if not model:
        raise HTTPException(status_code=404, detail="Financial model not found")
    inputs = ModelEngineInputs(**model.configuration)
    return run_tornado_analysis(inputs, outcome_metric)

