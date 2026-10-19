import os
from pathlib import Path
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Aether AI Weather Prediction System"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"
    ENV: str = "development"
    DEBUG: bool = True

    # Server binding
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # CORS
    ALLOWED_ORIGINS: Union[str, List[str]] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://192.168.1.4:5173",
    ]

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_allowed_origins(cls, v):
        if isinstance(v, str):
            return [orig.strip() for orig in v.split(",") if orig.strip()]
        return v

    # Database
    MONGODB_URI: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "weather_prediction"
    MONGODB_TIMEOUT_MS: int = 3000

    # Paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    ARTIFACTS_DIR: Path = BASE_DIR / "artifacts"
    MODELS_DIR: Path = ARTIFACTS_DIR / "models"
    STORAGE_DIR: Path = ARTIFACTS_DIR / "storage"

    # Open-Meteo API Endpoints
    OPEN_METEO_BASE_URL: str = "https://api.open-meteo.com/v1"
    OPEN_METEO_ARCHIVE_URL: str = "https://archive-api.open-meteo.com/v1"
    OPEN_METEO_GEOCODING_URL: str = "https://geocoding-api.open-meteo.com/v1/search"
    OPEN_METEO_TIMEOUT_SECONDS: float = 15.0

    # Weather Provider & High-Accuracy API Key (e.g. WeatherAPI for Google 1:1 sync)
    WEATHER_API_PROVIDER: str = "open-meteo"
    WEATHER_API_KEY: str = ""

    # Background Tasks
    SCHEDULER_ENABLED: bool = True

    # Security
    ADMIN_API_KEY: str = "aether-admin-secret-key-change-in-prod"

    # Built-in Default Locations for Monitoring
    DEFAULT_LOCATIONS: List[dict] = [
        {
            "id": "BOM-05",
            "name": "Mumbai",
            "subname": "Maharashtra, India",
            "admin1": "Maharashtra",
            "country": "India",
            "country_code": "IN",
            "lat": 19.0760,
            "lon": 72.8777,
            "elevation": 14,
            "timezone": "Asia/Kolkata",
        },
        {
            "id": "SF-01",
            "name": "San Francisco",
            "subname": "California, United States",
            "admin1": "California",
            "country": "United States",
            "country_code": "US",
            "lat": 37.7749,
            "lon": -122.4194,
            "elevation": 52,
            "timezone": "America/Los_Angeles",
        },
        {
            "id": "NYC-02",
            "name": "New York",
            "subname": "New York, United States",
            "admin1": "New York",
            "country": "United States",
            "country_code": "US",
            "lat": 40.7829,
            "lon": -73.9654,
            "elevation": 38,
            "timezone": "America/New_York",
        },
        {
            "id": "LDN-03",
            "name": "London",
            "subname": "Greater London, United Kingdom",
            "admin1": "England",
            "country": "United Kingdom",
            "country_code": "GB",
            "lat": 51.5074,
            "lon": -0.1278,
            "elevation": 25,
            "timezone": "Europe/London",
        },
        {
            "id": "TKO-04",
            "name": "Tokyo",
            "subname": "Tokyo Prefecture, Japan",
            "admin1": "Tokyo",
            "country": "Japan",
            "country_code": "JP",
            "lat": 35.6895,
            "lon": 139.6917,
            "elevation": 40,
            "timezone": "Asia/Tokyo",
        },
        {
            "id": "BLR-06",
            "name": "Bengaluru",
            "subname": "Karnataka, India",
            "admin1": "Karnataka",
            "country": "India",
            "country_code": "IN",
            "lat": 12.9716,
            "lon": 77.5946,
            "elevation": 920,
            "timezone": "Asia/Kolkata",
        },
    ]

    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).resolve().parent.parent.parent / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()

# Ensure directories exist
os.makedirs(settings.ARTIFACTS_DIR, exist_ok=True)
os.makedirs(settings.MODELS_DIR, exist_ok=True)
os.makedirs(settings.STORAGE_DIR, exist_ok=True)
