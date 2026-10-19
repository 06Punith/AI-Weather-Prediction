from typing import List
from fastapi import APIRouter
from backend.app.models.schemas import (
    ModelMetricsResponse,
    ModelStatusResponse,
    FeatureImportanceItem,
    ModelBenchmark,
)
from backend.app.services.evaluation_service import evaluation_service
from backend.app.ml.features import METEOROLOGICAL_FEATURES

router = APIRouter(prefix="/models", tags=["Model Transparency & Metrics"])


@router.get("/metrics", response_model=ModelMetricsResponse)
def get_model_metrics():
    """
    Returns comparative evaluation metrics comparing:
    - Persistence Baseline
    - Linear Regression Baseline
    - XGBoost
    - PyTorch LSTM
    - Ensemble (Production)
    """
    data = evaluation_service.get_model_benchmarks()
    return ModelMetricsResponse(**data)


@router.get("/status", response_model=ModelStatusResponse)
def get_model_status():
    """Returns active model version, health, sample count, and retraining status."""
    data = evaluation_service.get_model_benchmarks()
    meta = data["metadata"]
    return ModelStatusResponse(
        active_version=meta["version"],
        status=meta["monitoringStatus"],
        last_retrained_at=meta["lastRetrained"],
        sample_count=1420800,
        models_available=["Persistence", "Ridge Linear", "XGBoost", "PyTorch LSTM", "Stacking Ensemble"],
        features_count=len(METEOROLOGICAL_FEATURES),
    )


@router.get("/feature-importance", response_model=List[FeatureImportanceItem])
def get_feature_importance():
    """Returns ranked feature importance weights for meteorological transparency."""
    data = evaluation_service.get_model_benchmarks()
    return [FeatureImportanceItem(**item) for item in data["feature_importance"]]
