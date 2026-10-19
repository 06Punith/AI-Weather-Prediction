from pymongo import ASCENDING, DESCENDING
from backend.app.core.logging import logger


def ensure_indexes(db) -> None:
    """Ensures required unique and lookup indexes exist across all collections."""
    try:
        # 1. Locations
        db["locations"].create_index([("id", ASCENDING)], unique=True)
        db["locations"].create_index([("name", ASCENDING)])
        db["locations"].create_index([("country", ASCENDING)])

        # 2. Observations: Unique compound index on location_id + timestamp
        db["observations"].create_index(
            [("location_id", ASCENDING), ("timestamp", ASCENDING)],
            unique=True,
        )
        db["observations"].create_index([("timestamp", DESCENDING)])

        # 3. Forecasts
        db["forecasts"].create_index(
            [("location_id", ASCENDING), ("target_time", ASCENDING)]
        )
        db["forecasts"].create_index([("generated_at", DESCENDING)])

        # 4. Model Runs
        db["model_runs"].create_index([("trained_at", DESCENDING)])
        db["model_runs"].create_index([("model_version", ASCENDING)])

        logger.info("MongoDB collection indexes verified successfully.")
    except Exception as e:
        logger.warning(f"Note on index creation: {e}")
