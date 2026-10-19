import os
import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

# Ensure backend can be imported
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent.parent))

from backend.app.core.config import settings
# Disable scheduler during test runs
settings.SCHEDULER_ENABLED = False

from backend.app.main import app
from backend.app.db.mongodb import db_manager, get_db
from backend.app.db.indexes import ensure_indexes
from backend.app.services.weather_ingestion import weather_ingestion_service


@pytest.fixture(scope="session", autouse=True)
def setup_test_environment():
    """Initializes clean database state and test environment."""
    db_manager.connect()
    db = get_db()
    ensure_indexes(db)
    weather_ingestion_service.initialize_default_locations()
    yield
    db_manager.close()


@pytest.fixture
def client():
    """FastAPI TestClient fixture."""
    with TestClient(app) as test_client:
        yield test_client
