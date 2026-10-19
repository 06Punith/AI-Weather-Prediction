import json
import os
from typing import Optional, Dict, Any
from pymongo import MongoClient
import mongomock
from backend.app.core.config import settings
from backend.app.core.logging import logger


class DatabaseManager:
    _instance: Optional["DatabaseManager"] = None

    def __init__(self):
        self.client = None
        self.db = None
        self.is_connected = False
        self.is_embedded = False
        self._storage_file = settings.STORAGE_DIR / "embedded_db.json"

    @classmethod
    def get_instance(cls) -> "DatabaseManager":
        if cls._instance is None:
            cls._instance = DatabaseManager()
        return cls._instance

    def connect(self) -> None:
        """Connects to MongoDB, or falls back to embedded persistent mongomock."""
        # 1. Attempt connection to configured MongoDB URI
        try:
            logger.info(f"Connecting to MongoDB at {settings.MONGODB_URI} (db: {settings.MONGODB_DB_NAME})...")
            client = MongoClient(
                settings.MONGODB_URI,
                serverSelectionTimeoutMS=settings.MONGODB_TIMEOUT_MS,
                connectTimeoutMS=settings.MONGODB_TIMEOUT_MS,
            )
            # Ping database to confirm connectivity
            client.admin.command("ping")
            self.client = client
            self.db = client[settings.MONGODB_DB_NAME]
            self.is_connected = True
            self.is_embedded = False
            logger.info("Successfully connected to live MongoDB server!")
            return
        except Exception as e:
            logger.warning(
                f"Live MongoDB unreachable ({e}). Initializing embedded persistence engine (mongomock + disk snapshot)..."
            )

        # 2. Fallback to mongomock with disk-snapshot capability
        self.client = mongomock.MongoClient()
        self.db = self.client[settings.MONGODB_DB_NAME]
        self.is_connected = True
        self.is_embedded = True

        # Load persisted snapshot if available
        self._load_embedded_snapshot()
        logger.info("Embedded persistence engine initialized successfully.")

    def _load_embedded_snapshot(self) -> None:
        if self._storage_file.exists():
            try:
                with open(self._storage_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                for coll_name, docs in data.items():
                    if docs:
                        coll = self.db[coll_name]
                        # Insert without overwriting if mongomock has data
                        coll.insert_many(docs)
                logger.info(f"Restored {sum(len(d) for d in data.values())} documents from local embedded snapshot.")
            except Exception as ex:
                logger.error(f"Failed to load embedded snapshot: {ex}")

    def save_embedded_snapshot(self) -> None:
        """Saves current state to local JSON snapshot if running in embedded mode."""
        if not self.is_embedded or self.db is None:
            return
        try:
            os.makedirs(settings.STORAGE_DIR, exist_ok=True)
            data: Dict[str, Any] = {}
            for coll_name in ["locations", "observations", "forecasts", "model_runs"]:
                coll = self.db[coll_name]
                docs = list(coll.find({}))
                # Clean ObjectIds for JSON serialization
                clean_docs = []
                for doc in docs:
                    d = dict(doc)
                    if "_id" in d:
                        d["_id"] = str(d["_id"])
                    clean_docs.append(d)
                data[coll_name] = clean_docs

            with open(self._storage_file, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, default=str)
        except Exception as ex:
            logger.error(f"Error saving embedded snapshot: {ex}")

    def close(self) -> None:
        if self.is_embedded:
            self.save_embedded_snapshot()
        if self.client:
            self.client.close()
            self.is_connected = False
            logger.info("Database connection closed.")

    def check_readiness(self) -> dict:
        """Returns readiness status dictionary."""
        if not self.is_connected or self.db is None:
            return {
                "status": "unhealthy",
                "engine": "none",
                "details": "Database is not connected",
            }

        if self.is_embedded:
            return {
                "status": "ready",
                "engine": "embedded-mongomock",
                "storage": str(self._storage_file),
                "details": "Operating in local embedded document mode. Configure MONGODB_URI in .env for external MongoDB Atlas/cluster.",
            }

        try:
            self.client.admin.command("ping")
            return {
                "status": "ready",
                "engine": "mongodb",
                "database": settings.MONGODB_DB_NAME,
                "details": "Connected to live MongoDB instance.",
            }
        except Exception as e:
            return {
                "status": "degraded",
                "engine": "mongodb",
                "details": f"Ping failed: {str(e)}",
            }


db_manager = DatabaseManager.get_instance()


def get_db():
    if not db_manager.is_connected or db_manager.db is None:
        db_manager.connect()
    return db_manager.db


def get_collection(collection_name: str):
    db = get_db()
    return db[collection_name]
