from typing import List, Optional
from fastapi import APIRouter, Query, HTTPException
from backend.app.db.mongodb import get_collection
from backend.app.models.schemas import LocationBase
from backend.app.services.open_meteo import open_meteo_service
from backend.app.services.weather_ingestion import weather_ingestion_service

router = APIRouter(prefix="/locations", tags=["Locations"])


@router.get("", response_model=List[LocationBase])
def list_locations():
    """Returns the catalog of active global meteorological monitoring stations."""
    locations_coll = get_collection("locations")
    docs = list(locations_coll.find({}))

    if not docs:
        weather_ingestion_service.initialize_default_locations()
        docs = list(locations_coll.find({}))

    results = []
    for d in docs:
        d_clean = dict(d)
        if "_id" in d_clean:
            del d_clean["_id"]
        results.append(LocationBase(**d_clean))
    return results


@router.get("/search", response_model=List[LocationBase])
async def search_locations(
    q: str = Query(..., min_length=2, description="City, district, state or country name across the globe")
):
    """
    Worldwide geocoding search across all global locations using Open-Meteo.
    Enables users to search and forecast for any location on Earth.
    """
    places = await open_meteo_service.search_places(query=q)
    if not places:
        return []

    return [LocationBase(**p) for p in places]
