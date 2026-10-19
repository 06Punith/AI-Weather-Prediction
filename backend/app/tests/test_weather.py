from unittest.mock import patch, AsyncMock


MOCK_METEO_RESPONSE = {
    "current": {
        "temperature_2m": 28.5,
        "relative_humidity_2m": 65.0,
        "apparent_temperature": 30.2,
        "precipitation": 0.0,
        "rain": 0.0,
        "weather_code": 2,
        "surface_pressure": 1012.0,
        "wind_speed_10m": 12.0,
        "wind_direction_10m": 240.0,
    },
    "hourly": {
        "time": [f"2026-10-16T{h:02d}:00" for h in range(24)],
        "temperature_2m": [25.0 + (h % 5) for h in range(24)],
        "relative_humidity_2m": [60.0 for _ in range(24)],
        "surface_pressure": [1012.0 for _ in range(24)],
        "wind_speed_10m": [10.0 for _ in range(24)],
        "precipitation": [0.0 for _ in range(24)],
        "rain": [0.0 for _ in range(24)],
        "precipitation_probability": [10 for _ in range(24)],
        "weather_code": [2 for _ in range(24)],
    },
    "daily": {
        "time": ["2026-10-16", "2026-10-17", "2026-10-18", "2026-10-19", "2026-10-20", "2026-10-21", "2026-10-22"],
        "temperature_2m_max": [31.0, 30.5, 31.2, 32.0, 31.8, 30.2, 29.8],
        "temperature_2m_min": [24.0, 24.2, 24.5, 25.0, 24.8, 23.9, 23.5],
        "precipitation_sum": [0.0, 0.5, 0.0, 2.1, 0.0, 0.0, 0.0],
        "precipitation_probability_max": [15, 40, 10, 65, 20, 10, 10],
        "wind_speed_10m_max": [15.0, 16.0, 14.0, 22.0, 15.0, 12.0, 14.0],
        "weather_code": [2, 80, 1, 63, 2, 0, 0],
    },
}


@patch("backend.app.services.open_meteo.open_meteo_service.fetch_current_and_forecast", new_callable=AsyncMock)
def test_get_current_weather(mock_fetch, client):
    mock_fetch.return_value = MOCK_METEO_RESPONSE

    response = client.get("/api/v1/weather/current?city=Mumbai")
    assert response.status_code == 200
    data = response.json()
    assert "location" in data
    assert data["location"]["name"] == "Mumbai"
    assert "temperature" in data
    assert "relative_humidity" in data
    assert "surface_pressure" in data
    assert "is_live_observation" in data
    assert data["is_live_observation"] is True


@patch("backend.app.services.open_meteo.open_meteo_service.fetch_current_and_forecast", new_callable=AsyncMock)
def test_get_weather_history(mock_fetch, client):
    mock_fetch.return_value = MOCK_METEO_RESPONSE

    response = client.get("/api/v1/weather/history?city=Mumbai&range=24h")
    assert response.status_code == 200
    data = response.json()
    assert "location" in data
    assert "points" in data
    assert "metrics" in data
    assert isinstance(data["points"], list)
