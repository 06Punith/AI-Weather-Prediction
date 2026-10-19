from datetime import datetime, timezone
from fastapi import APIRouter
from backend.app.core.config import settings
from backend.app.db.mongodb import db_manager

router = APIRouter(tags=["Health & Status"])


@router.get("/")
def root():
    return {
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "operational",
        "docs_url": "/docs",
        "api_v1": settings.API_V1_PREFIX,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/health")
def health_liveness():
    """Liveness probe to confirm service process is responsive."""
    return {
        "status": "ok",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": settings.VERSION,
    }


@router.get("/health/ready")
def health_readiness():
    """Readiness probe to confirm database connectivity and storage readiness."""
    readiness = db_manager.check_readiness()
    return {
        "status": readiness["status"],
        "database": readiness,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
