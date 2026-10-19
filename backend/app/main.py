from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse

from backend.app.core.config import settings
from backend.app.core.logging import logger
from backend.app.db.mongodb import db_manager, get_db
from backend.app.db.indexes import ensure_indexes
from backend.app.services.weather_ingestion import weather_ingestion_service
from backend.app.jobs.scheduler import start_scheduler, shutdown_scheduler

# Route imports
from backend.app.api.routes.health import router as health_router
from backend.app.api.routes.locations import router as locations_router
from backend.app.api.routes.weather import router as weather_router
from backend.app.api.routes.forecasts import router as forecasts_router
from backend.app.api.routes.model_metrics import router as model_metrics_router
from backend.app.api.routes.admin import router as admin_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle: database connection, indexes, seeding, scheduler."""
    logger.info("Initializing Aether AI Weather Prediction Backend...")

    # 1. Connect to Database (MongoDB or embedded fallback)
    db_manager.connect()
    db = get_db()

    # 2. Verify collection indexes
    ensure_indexes(db)

    # 3. Seed default stations
    weather_ingestion_service.initialize_default_locations()

    # 4. Start APScheduler background pipeline
    start_scheduler()

    logger.info("Application startup sequence completed successfully.")
    yield

    logger.info("Initiating application graceful shutdown...")
    shutdown_scheduler()
    db_manager.close()
    logger.info("Shutdown complete.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "Production-grade AI Weather Prediction System REST API. "
        "Provides 24-hour hourly AI predictions (XGBoost + PyTorch LSTM sequence model), "
        "calibrated 7-day outlooks, global geocoding, real Open-Meteo telemetry ingestion, "
        "and empirical forecast evaluation with MongoDB persistence."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# 1. GZip Compression Middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)

# 2. CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS if isinstance(settings.ALLOWED_ORIGINS, list) else ["*"],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global sanitized error handler to prevent internal stack traces or connection leaks
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.method} {request.url.path}: {exc}", exc_info=settings.DEBUG)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal Server Error",
            "message": str(exc) if settings.DEBUG else "An unexpected error occurred while processing the request.",
            "path": request.url.path,
        },
    )


# Root health routes
app.include_router(health_router)

# Versioned API v1 routes
v1_prefix = settings.API_V1_PREFIX
app.include_router(locations_router, prefix=v1_prefix)
app.include_router(weather_router, prefix=v1_prefix)
app.include_router(forecasts_router, prefix=v1_prefix)
app.include_router(model_metrics_router, prefix=v1_prefix)
app.include_router(admin_router, prefix=v1_prefix)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend.app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )
