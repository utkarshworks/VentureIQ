"""
CSV Data Import and Mapping Endpoints.
"""
import io
import csv
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, UploadFile, File, HTTPException, Response, Depends
from pydantic import BaseModel
from app.api.deps import get_model_repo
from app.repositories.model_repository import ModelRepository

router = APIRouter(prefix="/imports", tags=["Data Import"])


class ImportConfirmRequest(BaseModel):
    model_id: str
    column_mapping: Dict[str, str]  # CSV header -> Model parameter key
    records: List[Dict[str, Any]]
    replace_existing: bool = False


@router.get("/template")
def download_sample_template():
    """Returns downloadable CSV template for historical data."""
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "period",
        "monthly_leads",
        "conversion_rate",
        "marketing_spend",
        "active_customers",
        "actual_mrr",
        "cogs",
        "payroll",
        "notes"
    ])
    writer.writerow(["2025-10", "800", "0.035", "120000", "45", "112500", "15000", "180000", "Observed historical month"])
    writer.writerow(["2025-11", "950", "0.038", "140000", "52", "130000", "17500", "180000", "Observed historical month"])
    writer.writerow(["2025-12", "1100", "0.040", "160000", "64", "160000", "21000", "220000", "Observed historical month"])

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="ventureiq_historical_template.csv"'},
    )


@router.post("/preview")
async def preview_csv_upload(file: UploadFile = File(...)):
    """Parses and previews CSV file, validates columns, and reports errors."""
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")

    content = await file.read()
    text = content.decode("utf-8", errors="replace")
    reader = csv.reader(io.StringIO(text))

    rows = list(reader)
    if not rows:
        raise HTTPException(status_code=400, detail="Uploaded CSV file is empty")

    headers = [h.strip() for h in rows[0]]
    data_rows = rows[1:]

    preview_records: List[Dict[str, Any]] = []
    errors: List[str] = []

    for idx, row in enumerate(data_rows[:20], start=2):
        if len(row) != len(headers):
            errors.append(f"Row {idx}: Expected {len(headers)} columns, found {len(row)}.")
            continue
        record = {headers[i]: row[i].strip() for i in range(len(headers))}
        preview_records.append(record)

    # Standard recognized schema keys
    recognized_keys = [
        "period",
        "monthly_leads",
        "conversion_rate",
        "marketing_spend",
        "active_customers",
        "actual_mrr",
        "cogs",
        "payroll",
    ]
    auto_mapping = {h: h for h in headers if h.lower() in recognized_keys}

    return {
        "filename": file.filename,
        "total_rows": len(data_rows),
        "headers": headers,
        "preview_records": preview_records,
        "auto_mapping": auto_mapping,
        "errors": errors,
        "status": "VALID" if not errors else "HAS_WARNINGS",
    }
