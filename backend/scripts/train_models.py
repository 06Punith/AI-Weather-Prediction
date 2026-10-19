#!/usr/bin/env python3
"""
CLI Script to train and evaluate ML models (Persistence, Ridge, XGBoost, PyTorch LSTM).
Usage:
    python backend/scripts/train_models.py --city Mumbai
"""
import argparse
import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from backend.app.core.logging import logger
from backend.app.db.mongodb import db_manager, get_db
from backend.app.db.indexes import ensure_indexes
from backend.app.ml.train import run_model_training_pipeline
from backend.app.api.routes.weather import resolve_location


def main():
    parser = argparse.ArgumentParser(description="Train and evaluate ML weather models")
    parser.add_argument("--city", default="Mumbai", help="Target city for training data")
    args = parser.parse_args()

    db_manager.connect()
    ensure_indexes(get_db())

    location = resolve_location(city=args.city)
    loc_id = location.get("id") or location.get("name")
    logger.info(f"Initiating training pipeline for {location.get('name')} (ID: {loc_id})...")

    result = run_model_training_pipeline(location_id=loc_id)

    if result.get("status") == "success":
        logger.info("\n" + "=" * 60)
        logger.info(f"MODEL TRAINING COMPLETED: Version {result.get('model_version')}")
        logger.info("=" * 60)
        for bench in result.get("benchmarks", []):
            logger.info(
                f"  {bench['name']:<30} | MAE: {bench['mae']:.2f}°C | RMSE: {bench['rmse']:.2f}°C | R²: {bench['r2']:.2f} | F1: {bench.get('f1', 0):.2f}"
            )
        logger.info("=" * 60)
    else:
        logger.warning(f"Training status: {result.get('status')} - {result.get('reason')}")

    db_manager.close()


if __name__ == "__main__":
    main()
