"""
AI Explanation API Endpoints.
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.api.deps import get_model_repo
from app.repositories.model_repository import ModelRepository
from app.engine.models import ModelEngineInputs
from app.engine.simulator import simulate_model
from app.services.ai_service import explain_model_results

router = APIRouter(tags=["AI Explanation"])


class ExplainRequest(BaseModel):
    query: Optional[str] = None
    inputs: Optional[ModelEngineInputs] = None


@router.post("/models/{model_id}/explain")
async def explain_saved_model(
    model_id: str,
    req: ExplainRequest,
    repo: ModelRepository = Depends(get_model_repo),
):
    model = await repo.get_model(model_id)
    if not model:
        raise HTTPException(status_code=404, detail="Financial model not found")
    inputs = ModelEngineInputs(**model.configuration)
    sim_result = simulate_model(inputs)
    return await explain_model_results(sim_result, req.query)


@router.post("/explain")
async def explain_stateless(req: ExplainRequest):
    if not req.inputs:
        raise HTTPException(status_code=400, detail="ModelEngineInputs required for stateless explanation")
    sim_result = simulate_model(req.inputs)
    return await explain_model_results(sim_result, req.query)
