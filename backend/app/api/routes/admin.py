import asyncio
from typing import Optional
from fastapi import APIRouter, Depends, Query, BackgroundTasks
from backend.app.core.security import verify_admin_api_key
from backend.app.core.logging import logger
from backend.app.db.mongodb import get_collection
from backend.app.services.weather_ingestion import weather_ingestion_service
from backend.app.services.forecast_service import forecast_service
from backend.app.ml.train import run_model_training_pipeline
from backend.app.api.routes.weather import resolve_location

router = APIRouter(prefix="/admin", tags=["Administrative Control"])


@router.post("/trigger-ingest")
async def trigger_ingestion(
    city: Optional[str] = Query(None, description="Optional city ID or name to ingest"),
    authorized: bool = Depends(verify_admin_api_key),
):
    """Manually triggers weather ingestion from Open-Meteo into MongoDB."""
    location = resolve_location(city=city)
    count = await weather_ingestion_service.ingest_recent_observations(location)
    return {
        "status": "success",
        "location": location.get("name"),
        "ingested_observations": count,
    }


@router.post("/trigger-forecast")
async def trigger_forecast(
    city: Optional[str] = Query(None, description="City ID or name to forecast"),
    authorized: bool = Depends(verify_admin_api_key),
):
    """Manually triggers 24h & 7d forecast generation and MongoDB persistence."""
    location = resolve_location(city=city)
    data = await forecast_service.get_forecast(location)
    return {
        "status": "success",
        "location": location.get("name"),
        "hourly_count": len(data.get("hourly", [])),
        "daily_count": len(data.get("daily", [])),
        "generated_at": data.get("generated_at"),
    }


@router.post("/trigger-train")
def trigger_training(
    background_tasks: BackgroundTasks,
    city: Optional[str] = Query("BOM-05", description="Location ID to use for training dataset"),
    authorized: bool = Depends(verify_admin_api_key),
):
    """Manually triggers ML model retraining in a background task."""
    location = resolve_location(city=city)
    loc_id = location.get("id") or location.get("name")

    background_tasks.add_task(run_model_training_pipeline, loc_id)
    return {
        "status": "training_scheduled",
        "location": location.get("name"),
        "message": "Model retraining started asynchronously. Check /api/v1/models/status for progress.",
    }
