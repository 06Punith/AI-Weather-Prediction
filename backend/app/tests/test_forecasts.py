from unittest.mock import patch, AsyncMock
from backend.app.tests.test_weather import MOCK_METEO_RESPONSE


@patch("backend.app.services.open_meteo.open_meteo_service.fetch_current_and_forecast", new_callable=AsyncMock)
def test_unified_forecast(mock_fetch, client):
    mock_fetch.return_value = MOCK_METEO_RESPONSE

    response = client.get("/api/v1/forecast?city=Mumbai")
    assert response.status_code == 200
    data = response.json()
    assert "location" in data
    assert "current" in data
    assert "hourly" in data
    assert "daily" in data
    assert len(data["hourly"]) == 24
    assert len(data["daily"]) == 7

    # Verify hourly items have uncertainty and confidence
    first_hour = data["hourly"][0]
    assert "pred_temp" in first_hour
    assert "pred_temp_min" in first_hour
    assert "pred_temp_max" in first_hour
    assert "uncertainty" in first_hour
    assert "confidence" in first_hour
    assert first_hour["is_ai_prediction"] is True


@patch("backend.app.services.open_meteo.open_meteo_service.fetch_current_and_forecast", new_callable=AsyncMock)
def test_hourly_forecast_endpoint(mock_fetch, client):
    mock_fetch.return_value = MOCK_METEO_RESPONSE

    response = client.get("/api/v1/forecast/hourly?city=Mumbai&hours=12")
    assert response.status_code == 200
    hourly = response.json()
    assert isinstance(hourly, list)
    assert len(hourly) == 12


@patch("backend.app.services.open_meteo.open_meteo_service.fetch_current_and_forecast", new_callable=AsyncMock)
def test_daily_forecast_endpoint(mock_fetch, client):
    mock_fetch.return_value = MOCK_METEO_RESPONSE

    response = client.get("/api/v1/forecast/daily?city=Mumbai&days=5")
    assert response.status_code == 200
    daily = response.json()
    assert isinstance(daily, list)
    assert len(daily) == 5


def test_forecast_evaluation(client):
    response = client.get("/api/v1/forecasts/evaluation?city=Mumbai")
    assert response.status_code == 200
    data = response.json()
    assert "mean_absolute_error" in data
    assert "root_mean_squared_error" in data
    assert "r2_score" in data
    assert "calibration_status" in data
