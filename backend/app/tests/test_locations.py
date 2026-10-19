from unittest.mock import patch


def test_list_locations(client):
    response = client.get("/api/v1/locations")
    assert response.status_code == 200
    locations = response.json()
    assert isinstance(locations, list)
    assert len(locations) >= 1
    # Check schema
    first = locations[0]
    assert "id" in first
    assert "name" in first
    assert "lat" in first
    assert "lon" in first


def test_search_locations_validation(client):
    # Query too short (< 2 characters)
    response = client.get("/api/v1/locations/search?q=a")
    assert response.status_code == 422


@patch("backend.app.services.open_meteo.open_meteo_service.search_places")
def test_search_locations_success(mock_search, client):
    mock_search.return_value = [
        {
            "id": "GEO-12345",
            "name": "Paris",
            "subname": "Île-de-France, France",
            "admin1": "Île-de-France",
            "country": "France",
            "country_code": "FR",
            "lat": 48.8566,
            "lon": 2.3522,
            "elevation": 35.0,
            "timezone": "Europe/Paris",
        }
    ]
    response = client.get("/api/v1/locations/search?q=Paris")
    assert response.status_code == 200
    results = response.json()
    assert len(results) == 1
    assert results[0]["name"] == "Paris"
    assert results[0]["country"] == "France"
