#!/usr/bin/env python3
"""
CLI Script to ingest historical weather observations from Open-Meteo into MongoDB.
Usage:
    python backend/scripts/ingest_history.py --city Mumbai --start 2023-01-01 --end 2024-01-01
"""
import argparse
import asyncio
import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from backend.app.core.logging import logger
from backend.app.db.mongodb import db_manager, get_db
from backend.app.db.indexes import ensure_indexes
from backend.app.services.weather_ingestion import weather_ingestion_service
from backend.app.api.routes.weather import resolve_location


async def main():
    parser = argparse.ArgumentParser(description="Ingest historical weather observations into MongoDB")
    parser.add_argument("--city", default="Mumbai", help="City name or Station ID (default: Mumbai)")
    parser.add_argument("--start", default="2023-01-01", help="Start date YYYY-MM-DD")
    parser.add_argument("--end", default="2024-01-01", help="End date YYYY-MM-DD")
    args = parser.parse_args()

    db_manager.connect()
    ensure_indexes(get_db())

    location = resolve_location(city=args.city)
    logger.info(f"Target location: {location.get('name')} ({location['lat']}°N, {location['lon']}°E)")

    count = await weather_ingestion_service.ingest_historical_records(
        location=location,
        start_date=args.start,
        end_date=args.end,
    )

    logger.info(f"Successfully ingested {count} historical records into MongoDB.")
    db_manager.close()


if __name__ == "__main__":
    asyncio.run(main())
