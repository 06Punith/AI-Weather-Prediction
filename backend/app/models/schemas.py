from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


# ==============================================================================
# Locations
# ==============================================================================

class LocationBase(BaseModel):
    id: str
    name: str
    subname: Optional[str] = None
    admin1: Optional[str] = None
    country: Optional[str] = None
    country_code: Optional[str] = None
    lat: float
    lon: float
    elevation: Optional[float] = 0.0
    timezone: Optional[str] = "UTC"


class LocationResponse(LocationBase):
    current_temp: Optional[float] = None
    condition: Optional[str] = None


# ==============================================================================
# Weather Observations
# ==============================================================================

class ObservationSchema(BaseModel):
    location_id: str
    timestamp: str  # ISO-8601 UTC string
    temperature: float = Field(..., description="Temperature in °C")
    relative_humidity: float = Field(..., description="Relative humidity in %")
    wind_speed: float = Field(..., description="Wind speed in km/h")
    precipitation: float = Field(0.0, description="Precipitation in mm")
    rain: float = Field(0.0, description="Rain occurrence (0.0 or mm)")
    rain_probability: Optional[float] = Field(None, description="Rain likelihood 0.0 - 1.0")
    surface_pressure: float = Field(..., description="Atmospheric pressure in hPa")
    weather_code: Optional[int] = Field(0, description="WMO weather interpretation code")
    is_forecast: bool = False
    source: str = "open-meteo"


class CurrentWeatherResponse(BaseModel):
    location: LocationBase
    timestamp: str
    temperature: float
    temp_min: Optional[float] = None
    temp_max: Optional[float] = None
    apparent_temp: Optional[float] = None
    relative_humidity: float
    wind_speed: float
    wind_direction: Optional[float] = None
    surface_pressure: float
    pressure_trend: Optional[str] = "steady"
    precipitation: float
    rain_probability: float
    weather_code: int
    condition: str
    uv_index: Optional[float] = 3.0
    cloud_cover: Optional[float] = 20.0
    dew_point: Optional[float] = None
    uncertainty: Optional[float] = 0.6
    model_confidence: Optional[float] = 0.94
    is_live_observation: bool = True


# ==============================================================================
# Forecasts
# ==============================================================================

class HourlyForecastItem(BaseModel):
    target_time: str
    hour: int
    time_label: str
    pred_temp: float
    pred_temp_min: float
    pred_temp_max: float
    pred_humidity: float
    pred_wind_speed: float
    pred_rain: float
    pred_rain_prob: float
    surface_pressure: Optional[float] = None
    weather_code: int
    condition: str
    uncertainty: float
    confidence: float
    is_ai_prediction: bool = True


class DailyForecastItem(BaseModel):
    date: str
    day_name: str
    temp_min: float
    temp_max: float
    rain_prob: float
    precipitation_sum: float
    wind_speed_max: float
    weather_code: int
    condition: str
    ai_confidence: float = 0.92


class UnifiedForecastResponse(BaseModel):
    location: LocationBase
    generated_at: str
    model_version: str
    current: CurrentWeatherResponse
    hourly: List[HourlyForecastItem]
    daily: List[DailyForecastItem]


# ==============================================================================
# Historical Comparisons & Evaluation
# ==============================================================================

class HistoryPoint(BaseModel):
    timestamp: str
    time_label: str
    actual_temp: Optional[float] = None
    pred_temp: Optional[float] = None
    actual_rain: Optional[float] = None
    pred_rain_prob: Optional[float] = None
    humidity: Optional[float] = None
    wind_speed: Optional[float] = None
    pressure: Optional[float] = None
    error: Optional[float] = None


class WeatherHistoryResponse(BaseModel):
    location: LocationBase
    range: str
    points: List[HistoryPoint]
    metrics: Dict[str, Any]


class ForecastEvaluationResponse(BaseModel):
    location: LocationBase
    total_evaluated_forecasts: int
    mean_absolute_error: float
    root_mean_squared_error: float
    r2_score: float
    rain_brier_score: float
    calibration_status: str
    comparison_series: List[Dict[str, Any]]


# ==============================================================================
# Model Information & Metrics
# ==============================================================================

class ModelBenchmark(BaseModel):
    name: str
    tag: str
    description: str
    mae: float
    rmse: float
    r2: float
    f1: Optional[float] = None
    roc_auc: Optional[float] = None
    is_best: Dict[str, bool] = Field(default_factory=dict)
    is_production: bool = False


class FeatureImportanceItem(BaseModel):
    feature: str
    category: str
    importance: float


class ModelMetricsResponse(BaseModel):
    benchmarks: List[ModelBenchmark]
    feature_importance: List[FeatureImportanceItem]
    accuracy_trend: List[Dict[str, Any]]
    metadata: Dict[str, Any]


class ModelStatusResponse(BaseModel):
    active_version: str
    status: str
    last_retrained_at: Optional[str] = None
    sample_count: int
    models_available: List[str]
    features_count: int
