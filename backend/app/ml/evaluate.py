import numpy as np
from typing import Dict, Any, Optional
from sklearn.metrics import (
    mean_absolute_error,
    root_mean_squared_error,
    r2_score,
    f1_score,
    roc_auc_score,
    brier_score_loss,
)


def compute_regression_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, float]:
    """Computes MAE, RMSE, and R² for continuous weather variables."""
    mask = ~np.isnan(y_true) & ~np.isnan(y_pred)
    y_t = y_true[mask]
    y_p = y_pred[mask]

    if len(y_t) == 0:
        return {"mae": 0.0, "rmse": 0.0, "r2": 0.0}

    mae = float(mean_absolute_error(y_t, y_p))
    rmse = float(root_mean_squared_error(y_t, y_p))
    r2 = float(r2_score(y_t, y_p)) if len(y_t) > 1 and np.var(y_t) > 1e-6 else 0.0

    return {
        "mae": round(mae, 3),
        "rmse": round(rmse, 3),
        "r2": round(max(-1.0, min(1.0, r2)), 3),
    }


def compute_classification_metrics(
    y_true: np.ndarray, y_pred_prob: np.ndarray, threshold: float = 0.5
) -> Dict[str, Optional[float]]:
    """Computes F1-score, ROC-AUC, and Brier Score for rain occurrence."""
    mask = ~np.isnan(y_true) & ~np.isnan(y_pred_prob)
    y_t = y_true[mask].astype(int)
    y_p_prob = np.clip(y_pred_prob[mask], 0.0, 1.0)
    y_p_class = (y_p_prob >= threshold).astype(int)

    if len(y_t) == 0:
        return {"f1": 0.0, "roc_auc": 0.5, "brier_score": 0.0}

    f1 = float(f1_score(y_t, y_p_class, zero_division=0))
    brier = float(brier_score_loss(y_t, y_p_prob))

    # ROC-AUC requires both 0 and 1 classes present
    if len(np.unique(y_t)) > 1:
        roc_auc = float(roc_auc_score(y_t, y_p_prob))
    else:
        roc_auc = 0.5

    return {
        "f1": round(f1, 3),
        "roc_auc": round(roc_auc, 3),
        "brier_score": round(brier, 4),
    }
