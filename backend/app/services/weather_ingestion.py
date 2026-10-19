from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from backend.app.core.config import settings
from backend.app.core.logging import logger
from backend.app.db.mongodb import get_collection
from backend.app.services.open_meteo import open_meteo_service


def sanitize_val(val: Any, default: float = 0.0) -> float:
    try:
        if val is None:
            return default
        f = float(val)
        return f if f == f else default  # NaN check
    except (ValueError, TypeError):
        return default


class WeatherIngestionService:
    @staticmethod
    def initialize_default_locations() -> None:
        """Seeds default worldwide monitoring stations if not already present."""
        locations_coll = get_collection("locations")
        for loc in settings.DEFAULT_LOCATIONS:
            locations_coll.update_one(
                {"id": loc["id"]},
                {"$setOnInsert": loc},
                upsert=True,
            )
        logger.info(f"Initialized {len(settings.DEFAULT_LOCATIONS)} default stations in database.")

    @staticmethod
    async def ingest_recent_observations(location: Dict[str, Any]) -> int:
        """Fetches and persists recent hourly observations (past 3 days + current) into MongoDB."""
        loc_id = location.get("id") or location.get("name")
        lat = location["lat"]
        lon = location["lon"]

        try:
            data = await open_meteo_service.fetch_current_and_forecast(lat=lat, lon=lon, past_days=3)
        except Exception as e:
            logger.error(f"Ingestion failed for {location.get('name')}: {e}")
            return 0

        hourly = data.get("hourly", {})
        times = hourly.get("time", [])
        temps = hourly.get("temperature_2m", [])
        humidities = hourly.get("relative_humidity_2m", [])
        pressures = hourly.get("surface_pressure", [])
        winds = hourly.get("wind_speed_10m", [])
        precips = hourly.get("precipitation", [])
        rains = hourly.get("rain", [])
        rain_probs = hourly.get("precipitation_probability", [])
        codes = hourly.get("weather_code", [])

        obs_coll = get_collection("observations")
        ingested_count = 0
        now_iso = datetime.now(timezone.utc).isoformat()

        # Only ingest observations up to current time (do not treat future hours as observations)
        current_hour_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:00")

        for idx, t_str in enumerate(times):
            if t_str > current_hour_iso:
                continue  # Future hours belong in forecasts, not observations

            # Standardize timestamp to UTC ISO
            ts_clean = f"{t_str}:00Z" if not t_str.endswith("Z") else t_str

            doc = {
                "location_id": loc_id,
                "timestamp": ts_clean,
                "temperature": sanitize_val(temps[idx] if idx < len(temps) else None, 20.0),
                "relative_humidity": sanitize_val(humidities[idx] if idx < len(humidities) else None, 50.0),
                "surface_pressure": sanitize_val(pressures[idx] if idx < len(pressures) else None, 1013.25),
                "wind_speed": sanitize_val(winds[idx] if idx < len(winds) else None, 5.0),
                "precipitation": sanitize_val(precips[idx] if idx < len(precips) else None, 0.0),
                "rain": sanitize_val(rains[idx] if idx < len(rains) else None, 0.0),
                "rain_probability": (
                    sanitize_val(rain_probs[idx], 0.0) / 100.0 if idx < len(rain_probs) and rain_probs[idx] is not None
                    else (1.0 if (idx < len(precips) and sanitize_val(precips[idx]) > 0.1) else 0.0)
                ),
                "weather_code": int(codes[idx]) if idx < len(codes) and codes[idx] is not None else 0,
                "ingested_at": now_iso,
                "source": "open-meteo-live",
            }

            obs_coll.update_one(
                {"location_id": loc_id, "timestamp": ts_clean},
                {"$set": doc},
                upsert=True,
            )
            ingested_count += 1

        logger.info(f"Ingested {ingested_count} observations for {location.get('name')} (id: {loc_id}).")
        return ingested_count

    @staticmethod
    async def ingest_historical_records(
        location: Dict[str, Any], start_date: str, end_date: str
    ) -> int:
        """Ingests deep historical records from the Open-Meteo archive for model training."""
        loc_id = location.get("id") or location.get("name")
        lat = location["lat"]
        lon = location["lon"]

        logger.info(f"Fetching historical archive for {location.get('name')} from {start_date} to {end_date}...")
        data = await open_meteo_service.fetch_historical_archive(
            lat=lat, lon=lon, start_date=start_date, end_date=end_date
        )

        hourly = data.get("hourly", {})
        times = hourly.get("time", [])
        temps = hourly.get("temperature_2m", [])
        humidities = hourly.get("relative_humidity_2m", [])
        pressures = hourly.get("surface_pressure", [])
        winds = hourly.get("wind_speed_10m", [])
        precips = hourly.get("precipitation", [])
        rains = hourly.get("rain", [])
        codes = hourly.get("weather_code", [])

        obs_coll = get_collection("observations")
        count = 0
        now_iso = datetime.now(timezone.utc).isoformat()

        for idx, t_str in enumerate(times):
            ts_clean = f"{t_str}:00Z" if not t_str.endswith("Z") else t_str
            precip_val = sanitize_val(precips[idx] if idx < len(precips) else None, 0.0)

            doc = {
                "location_id": loc_id,
                "timestamp": ts_clean,
                "temperature": sanitize_val(temps[idx] if idx < len(temps) else None, 20.0),
                "relative_humidity": sanitize_val(humidities[idx] if idx < len(humidities) else None, 50.0),
                "surface_pressure": sanitize_val(pressures[idx] if idx < len(pressures) else None, 1013.25),
                "wind_speed": sanitize_val(winds[idx] if idx < len(winds) else None, 5.0),
                "precipitation": precip_val,
                "rain": sanitize_val(rains[idx] if idx < len(rains) else None, 0.0),
                "rain_probability": 1.0 if precip_val > 0.1 else 0.0,
                "weather_code": int(codes[idx]) if idx < len(codes) and codes[idx] is not None else 0,
                "ingested_at": now_iso,
                "source": "open-meteo-archive",
            }

            obs_coll.update_one(
                {"location_id": loc_id, "timestamp": ts_clean},
                {"$set": doc},
                upsert=True,
            )
            count += 1

        logger.info(f"Ingested {count} historical records for {location.get('name')}.")
        return count


weather_ingestion_service = WeatherIngestionService()
