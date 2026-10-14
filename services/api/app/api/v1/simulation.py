"""
Stateless Simulation API Endpoints.
Pure calculation without requiring persistence.
"""
from fastapi import APIRouter
from app.engine.models import ModelEngineInputs, EngineSimulationResult
from app.engine.simulator import simulate_model

router = APIRouter(prefix="/simulate", tags=["Simulation"])


@router.post("", response_model=EngineSimulationResult)
def simulate_stateless(inputs: ModelEngineInputs):
    """
    Simulates a financial model synchronously.
    Pure deterministic engine execution.
    """
    return simulate_model(inputs)

