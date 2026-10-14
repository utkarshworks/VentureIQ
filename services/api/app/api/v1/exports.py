"""
Export API Endpoints (CSV and PDF).
"""
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from app.api.deps import get_model_repo
from app.repositories.model_repository import ModelRepository
from app.engine.models import ModelEngineInputs
from app.engine.simulator import simulate_model
from app.services.export_service import (
    generate_projections_csv,
    generate_assumptions_csv,
    generate_pdf_report,
)

router = APIRouter(tags=["Exports"])


@router.get("/models/{model_id}/export/csv")
async def export_csv(
    model_id: str,
    export_type: str = Query("projections", pattern="^(projections|assumptions)$"),
    repo: ModelRepository = Depends(get_model_repo),
):
    model = await repo.get_model(model_id)
    if not model:
        raise HTTPException(status_code=404, detail="Financial model not found")

    inputs = ModelEngineInputs(**model.configuration)
    sim_result = simulate_model(inputs)

    if export_type == "assumptions":
        csv_data = generate_assumptions_csv(inputs)
        filename = f"{model.name.replace(' ', '_')}_assumptions.csv"
    else:
        csv_data = generate_projections_csv(sim_result)
        filename = f"{model.name.replace(' ', '_')}_projections.csv"

    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/models/{model_id}/export/pdf")
async def export_pdf(
    model_id: str,
    repo: ModelRepository = Depends(get_model_repo),
):
    model = await repo.get_model(model_id)
    if not model:
        raise HTTPException(status_code=404, detail="Financial model not found")

    inputs = ModelEngineInputs(**model.configuration)
    sim_result = simulate_model(inputs)
    pdf_bytes = generate_pdf_report(model.name, sim_result)
    filename = f"{model.name.replace(' ', '_')}_report.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/export/csv")
def export_csv_stateless(
    inputs: ModelEngineInputs,
    export_type: str = Query("projections", pattern="^(projections|assumptions)$"),
):
    sim_result = simulate_model(inputs)
    if export_type == "assumptions":
        csv_data = generate_assumptions_csv(inputs)
        filename = "ventureiq_assumptions.csv"
    else:
        csv_data = generate_projections_csv(sim_result)
        filename = "ventureiq_projections.csv"

    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/export/pdf")
def export_pdf_stateless(inputs: ModelEngineInputs):
    sim_result = simulate_model(inputs)
    pdf_bytes = generate_pdf_report(inputs.company_name, sim_result)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="ventureiq_financial_report.pdf"'},
    )
