import asyncio
from datetime import datetime, timezone
from backend.app.core.config import settings
from backend.app.core.logging import logger
from backend.app.db.mongodb import get_collection
from backend.app.services.weather_ingestion import weather_ingestion_service
from backend.app.services.forecast_service import forecast_service
from backend.app.services.evaluation_service import evaluation_service
from backend.app.ml.train import run_model_training_pipeline


async def task_hourly_ingestion():
    """Retrieves and saves new weather observations for all tracked locations."""
    logger.info("Executing scheduled job: Hourly Weather Ingestion...")
    locations_coll = get_collection("locations")
    locations = list(locations_coll.find({}))

    if not locations:
        weather_ingestion_service.initialize_default_locations()
        locations = list(locations_coll.find({}))

    total_ingested = 0
    for loc in locations:
        try:
            count = await weather_ingestion_service.ingest_recent_observations(loc)
            total_ingested += count
        except Exception as e:
            logger.error(f"Error during hourly ingestion for {loc.get('name')}: {e}")

    logger.info(f"Hourly ingestion finished. Ingested {total_ingested} records across {len(locations)} locations.")


async def task_daily_forecast_generation():
    """Generates and persists 24h/7d forecasts for all tracked locations."""
    logger.info("Executing scheduled job: Daily Forecast Generation...")
    locations_coll = get_collection("locations")
    locations = list(locations_coll.find({}))

    for loc in locations:
        try:
            await forecast_service.get_forecast(loc)
        except Exception as e:
            logger.error(f"Error generating daily forecast for {loc.get('name')}: {e}")

    logger.info("Daily forecast generation finished.")


async def task_weekly_model_retrain():
    """Weekly model retraining pipeline on accumulated observations."""
    logger.info("Executing scheduled job: Weekly Model Retrain...")
    try:
        # Run training in background thread/task
        loop = asyncio.get_event_loop()
        res = await loop.run_in_executor(None, run_model_training_pipeline, "BOM-05")
        logger.info(f"Weekly retrain result: {res.get('status')}")
    except Exception as e:
        logger.error(f"Error during weekly model retrain: {e}")


async def task_periodic_forecast_evaluation():
    """Periodically compares past forecasts with actual observations."""
    logger.info("Executing scheduled job: Periodic Forecast Evaluation...")
    locations_coll = get_collection("locations")
    locations = list(locations_coll.find({}))

    for loc in locations:
        loc_id = loc.get("id") or loc.get("name")
        try:
            res = evaluation_service.evaluate_forecasts(loc_id, days=7)
            logger.info(f"Evaluated {res['total_evaluated_forecasts']} forecasts for {loc.get('name')} (MAE: {res['mean_absolute_error']}°C).")
        except Exception as e:
            logger.error(f"Evaluation error for {loc.get('name')}: {e}")


# Synchronous wrapper helpers for APScheduler
def run_sync(coro_fn):
    def wrapper():
        try:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            loop.run_until_complete(coro_fn())
            loop.close()
        except Exception as e:
            logger.error(f"Job execution failed: {e}")
    return wrapper
