from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Query, HTTPException
from backend.app.models.schemas import (
    UnifiedForecastResponse,
    HourlyForecastItem,
    DailyForecastItem,
    ForecastEvaluationResponse,
    LocationBase,
)
from backend.app.api.routes.weather import resolve_location
from backend.app.services.forecast_service import forecast_service
from backend.app.services.evaluation_service import evaluation_service

router = APIRouter(tags=["AI Weather Forecasts"])


@router.get("/forecast", response_model=UnifiedForecastResponse)
async def get_unified_forecast(
    city: Optional[str] = Query(None, description="City name or Station ID"),
    lat: Optional[float] = Query(None, description="Latitude"),
    lon: Optional[float] = Query(None, description="Longitude"),
):
    """
    Unified AI Weather Forecast endpoint returning:
    1. Current validated observation
    2. 24-hour hourly AI trajectory with confidence bounds
    3. 7-day calibrated multi-model daily outlook
    """
    location = resolve_location(city=city, lat=lat, lon=lon)
    data = await forecast_service.get_forecast(location)
    return UnifiedForecastResponse(**data)


@router.get("/forecast/hourly", response_model=List[HourlyForecastItem])
async def get_hourly_forecast(
    city: Optional[str] = Query(None, description="City name or Station ID"),
    lat: Optional[float] = Query(None, description="Latitude"),
    lon: Optional[float] = Query(None, description="Longitude"),
    hours: int = Query(24, ge=1, le=24, description="Hourly horizon (max 24)"),
):
    """Returns 24-hour hourly AI predictions with calibrated uncertainty bounds."""
    location = resolve_location(city=city, lat=lat, lon=lon)
    data = await forecast_service.get_forecast(location)
    hourly = data.get("hourly", [])
    return [HourlyForecastItem(**pt) for pt in hourly[:hours]]


@router.get("/forecast/daily", response_model=List[DailyForecastItem])
async def get_daily_forecast(
    city: Optional[str] = Query(None, description="City name or Station ID"),
    lat: Optional[float] = Query(None, description="Latitude"),
    lon: Optional[float] = Query(None, description="Longitude"),
    days: int = Query(7, ge=1, le=7, description="Daily horizon (max 7)"),
):
    """
    Returns 7-day calibrated daily outlook.
    Uses calibrated multi-model meteorology rather than invalid extrapolation.
    """
    location = resolve_location(city=city, lat=lat, lon=lon)
    data = await forecast_service.get_forecast(location)
    daily = data.get("daily", [])
    return [DailyForecastItem(**d) for d in daily[:days]]


@router.get("/forecasts/history")
def get_past_forecasts(
    city: Optional[str] = Query(None, description="City name or Station ID"),
    limit: int = Query(48, ge=1, le=168, description="Number of past forecast records to return"),
):
    """Retrieves stored past generated forecast runs from MongoDB."""
    location = resolve_location(city=city)
    loc_id = location.get("id") or location.get("name")
    records = evaluation_service.get_forecast_history(loc_id, limit=limit)
    return {
        "location": location,
        "count": len(records),
        "forecasts": records,
    }


@router.get("/forecasts/evaluation", response_model=ForecastEvaluationResponse)
def get_forecast_evaluation(
    city: Optional[str] = Query(None, description="City name or Station ID"),
    days: int = Query(7, ge=1, le=30, description="Evaluation period in days"),
):
    """
    Evaluates saved predictions against actual observations once target timestamps pass.
    Calculates empirical MAE, RMSE, R², and rain Brier score.
    """
    location = resolve_location(city=city)
    loc_id = location.get("id") or location.get("name")
    eval_result = evaluation_service.evaluate_forecasts(loc_id, days=days)
    eval_result["location"] = LocationBase(**location)
    return ForecastEvaluationResponse(**eval_result)
