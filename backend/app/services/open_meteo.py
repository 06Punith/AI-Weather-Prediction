import httpx
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from backend.app.core.config import settings
from backend.app.core.logging import logger

# WMO Weather interpretation codes (WW)
WMO_CODE_MAP = {
    0: "Clear Sky",
    1: "Mainly Clear",
    2: "Partly Cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing Rime Fog",
    51: "Light Drizzle",
    53: "Moderate Drizzle",
    55: "Dense Drizzle",
    56: "Light Freezing Drizzle",
    57: "Dense Freezing Drizzle",
    61: "Slight Rain",
    63: "Moderate Rain",
    65: "Heavy Rain",
    66: "Light Freezing Rain",
    67: "Heavy Freezing Rain",
    71: "Slight Snow Fall",
    73: "Moderate Snow Fall",
    75: "Heavy Snow Fall",
    77: "Snow Grains",
    80: "Slight Rain Showers",
    81: "Moderate Rain Showers",
    82: "Violent Rain Showers",
    85: "Slight Snow Showers",
    86: "Heavy Snow Showers",
    95: "Thunderstorm",
    96: "Thunderstorm with Slight Hail",
    99: "Thunderstorm with Heavy Hail",
}


def get_weather_condition(code: int) -> str:
    return WMO_CODE_MAP.get(code, "Clear Sky")


class OpenMeteoService:
    def __init__(self):
        self.base_url = settings.OPEN_METEO_BASE_URL
        self.archive_url = settings.OPEN_METEO_ARCHIVE_URL
        self.geocoding_url = settings.OPEN_METEO_GEOCODING_URL
        self.timeout = settings.OPEN_METEO_TIMEOUT_SECONDS

    async def search_places(self, query: str, count: int = 10) -> List[Dict[str, Any]]:
        """Searches worldwide locations using Open-Meteo Geocoding API."""
        if not query or len(query.strip()) < 2:
            return []

        params = {
            "name": query.strip(),
            "count": min(count, 20),
            "language": "en",
            "format": "json",
        }

        try:
            url = self.geocoding_url if self.geocoding_url.endswith("/search") else f"{self.geocoding_url.rstrip('/')}/search"
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.get(url, params=params)
                if resp.status_code != 200:
                    logger.warning(f"Geocoding API returned status {resp.status_code}")
                    return []

                data = resp.json()
                results = data.get("results", [])
                places = []
                for item in results:
                    admin1 = item.get("admin1") or ""
                    country = item.get("country") or ""
                    subname_parts = [p for p in [admin1, country] if p]
                    subname = ", ".join(subname_parts)

                    places.append({
                        "id": f"GEO-{item.get('id', hash(item.get('name')))}",
                        "name": item.get("name"),
                        "subname": subname,
                        "admin1": admin1,
                        "country": country,
                        "country_code": item.get("country_code", "").upper(),
                        "lat": round(float(item.get("latitude")), 4),
                        "lon": round(float(item.get("longitude")), 4),
                        "elevation": round(float(item.get("elevation", 0)), 1),
                        "timezone": item.get("timezone", "UTC"),
                    })
                return places
        except Exception as e:
            logger.error(f"Error querying Open-Meteo Geocoding: {e}")
            return []

    async def fetch_current_and_forecast(
        self, lat: float, lon: float, past_days: int = 2
    ) -> Dict[str, Any]:
        """Fetches live meteorological observations and 7-day outlook from Open-Meteo."""
        params = {
            "latitude": lat,
            "longitude": lon,
            "current": [
                "temperature_2m",
                "relative_humidity_2m",
                "apparent_temperature",
                "precipitation",
                "rain",
                "weather_code",
                "surface_pressure",
                "wind_speed_10m",
                "wind_direction_10m",
            ],
            "hourly": [
                "temperature_2m",
                "relative_humidity_2m",
                "surface_pressure",
                "wind_speed_10m",
                "precipitation",
                "rain",
                "precipitation_probability",
                "weather_code",
            ],
            "daily": [
                "weather_code",
                "temperature_2m_max",
                "temperature_2m_min",
                "precipitation_sum",
                "precipitation_probability_max",
                "wind_speed_10m_max",
            ],
            "timezone": "UTC",
            "past_days": past_days,
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.get(f"{self.base_url}/forecast", params=params)
                resp.raise_for_status()
                return resp.json()
        except httpx.HTTPStatusError as e:
            logger.error(f"Open-Meteo HTTP {e.response.status_code} error: {e}")
            raise
        except Exception as e:
            logger.error(f"Open-Meteo request failed: {e}")
            raise

    async def fetch_historical_archive(
        self, lat: float, lon: float, start_date: str, end_date: str
    ) -> Dict[str, Any]:
        """Fetches real historical hourly meteorological records from Open-Meteo Archive API."""
        params = {
            "latitude": lat,
            "longitude": lon,
            "start_date": start_date,
            "end_date": end_date,
            "hourly": [
                "temperature_2m",
                "relative_humidity_2m",
                "surface_pressure",
                "wind_speed_10m",
                "precipitation",
                "rain",
                "weather_code",
            ],
            "timezone": "UTC",
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.get(f"{self.archive_url}/archive", params=params)
                resp.raise_for_status()
                return resp.json()
        except Exception as e:
            logger.error(f"Failed to fetch Open-Meteo archive for ({lat}, {lon}): {e}")
            raise


open_meteo_service = OpenMeteoService()
