import numpy as np
import pandas as pd
from typing import Dict, Any
from sklearn.linear_model import Ridge, LogisticRegression
from backend.app.ml.features import METEOROLOGICAL_FEATURES


class PersistenceBaseline:
    """Predicts weather at time t using the last known value at t-1 (persistence)."""

    def predict_temperature(self, df: pd.DataFrame) -> np.ndarray:
        return df["temp_lag_1h"].to_numpy()

    def predict_humidity(self, df: pd.DataFrame) -> np.ndarray:
        return df["humidity_lag_1h"].to_numpy()

    def predict_wind(self, df: pd.DataFrame) -> np.ndarray:
        return df["wind_lag_1h"].to_numpy()

    def predict_rain(self, df: pd.DataFrame) -> np.ndarray:
        return (df["precip_lag_1h"] > 0.1).astype(int).to_numpy()


class LinearRegressionBaseline:
    """Linear regression baseline for temperature/humidity and logistic regression for rain."""

    def __init__(self):
        self.reg_temp = Ridge(alpha=1.0)
        self.reg_humidity = Ridge(alpha=1.0)
        self.reg_wind = Ridge(alpha=1.0)
        self.clf_rain = LogisticRegression(max_iter=500, class_weight="balanced")
        self.is_fitted = False

    def fit(self, train_df: pd.DataFrame) -> "LinearRegressionBaseline":
        X = train_df[METEOROLOGICAL_FEATURES].to_numpy()
        y_temp = train_df["temperature"].to_numpy()
        y_humidity = train_df["relative_humidity"].to_numpy()
        y_wind = train_df["wind_speed"].to_numpy()
        y_rain = train_df["rain_binary"].to_numpy()

        self.reg_temp.fit(X, y_temp)
        self.reg_humidity.fit(X, y_humidity)
        self.reg_wind.fit(X, y_wind)

        # Handle edge case where rain is all 0 or 1 in small sample
        if len(np.unique(y_rain)) > 1:
            self.clf_rain.fit(X, y_rain)
        self.is_fitted = True
        return self

    def predict(self, df: pd.DataFrame) -> Dict[str, np.ndarray]:
        X = df[METEOROLOGICAL_FEATURES].to_numpy()
        preds = {
            "pred_temp": self.reg_temp.predict(X),
            "pred_humidity": np.clip(self.reg_humidity.predict(X), 0, 100),
            "pred_wind": np.clip(self.reg_wind.predict(X), 0, 150),
        }
        if hasattr(self.clf_rain, "classes_") and len(self.clf_rain.classes_) > 1:
            preds["pred_rain_prob"] = self.clf_rain.predict_proba(X)[:, 1]
            preds["pred_rain"] = (preds["pred_rain_prob"] > 0.5).astype(int)
        else:
            preds["pred_rain_prob"] = np.zeros(len(df))
            preds["pred_rain"] = np.zeros(len(df), dtype=int)
        return preds
