#!/usr/bin/env python3
"""
CLI Script to generate and persist 24h & 7d forecasts for all tracked locations.
Usage:
    python backend/scripts/generate_forecasts.py
"""
import asyncio
import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from backend.app.core.logging import logger
from backend.app.db.mongodb import db_manager, get_db, get_collection
from backend.app.db.indexes import ensure_indexes
from backend.app.services.forecast_service import forecast_service
from backend.app.services.weather_ingestion import weather_ingestion_service


async def main():
    db_manager.connect()
    ensure_indexes(get_db())

    locations_coll = get_collection("locations")
    locations = list(locations_coll.find({}))

    if not locations:
        weather_ingestion_service.initialize_default_locations()
        locations = list(locations_coll.find({}))

    logger.info(f"Generating forecasts for {len(locations)} locations...")
    for loc in locations:
        try:
            data = await forecast_service.get_forecast(loc)
            logger.info(
                f"Generated forecast for {loc.get('name')}: Current={data['current']['temperature']}°C, "
                f"24h steps={len(data['hourly'])}, 7d days={len(data['daily'])}"
            )
        except Exception as e:
            logger.error(f"Error forecasting {loc.get('name')}: {e}")

    logger.info("Forecast generation completed.")
    db_manager.close()


if __name__ == "__main__":
    asyncio.run(main())
