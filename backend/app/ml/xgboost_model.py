import os
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, List
import xgboost as xgb
from backend.app.core.config import settings
from backend.app.core.logging import logger
from backend.app.ml.features import METEOROLOGICAL_FEATURES


class WeatherXGBoostModel:
    """Multi-target gradient boosted decision tree suite for meteorological forecasting."""

    def __init__(self, version: str = "v1.0-xgb"):
        self.version = version
        self.features = METEOROLOGICAL_FEATURES

        self.reg_temp = xgb.XGBRegressor(
            n_estimators=150,
            max_depth=5,
            learning_rate=0.08,
            subsample=0.85,
            colsample_bytree=0.85,
            objective="reg:squarederror",
            random_state=42,
        )
        self.reg_humidity = xgb.XGBRegressor(
            n_estimators=120,
            max_depth=5,
            learning_rate=0.08,
            objective="reg:squarederror",
            random_state=42,
        )
        self.reg_wind = xgb.XGBRegressor(
            n_estimators=100,
            max_depth=4,
            learning_rate=0.08,
            objective="reg:squarederror",
            random_state=42,
        )
        self.clf_rain = xgb.XGBClassifier(
            n_estimators=120,
            max_depth=4,
            learning_rate=0.08,
            scale_pos_weight=2.5,
            objective="binary:logistic",
            eval_metric="logloss",
            random_state=42,
        )
        self.is_trained = False

    def fit(self, train_df: pd.DataFrame, val_df: pd.DataFrame = None) -> "WeatherXGBoostModel":
        X_train = train_df[self.features].to_numpy()
        y_temp = train_df["temperature"].to_numpy()
        y_humidity = train_df["relative_humidity"].to_numpy()
        y_wind = train_df["wind_speed"].to_numpy()
        y_rain = train_df["rain_binary"].to_numpy()

        eval_set_temp = [(val_df[self.features].to_numpy(), val_df["temperature"].to_numpy())] if val_df is not None else None

        logger.info("Training XGBoost Temperature Regressor...")
        self.reg_temp.fit(X_train, y_temp, eval_set=eval_set_temp, verbose=False)

        logger.info("Training XGBoost Humidity Regressor...")
        self.reg_humidity.fit(X_train, y_humidity, verbose=False)

        logger.info("Training XGBoost Wind Speed Regressor...")
        self.reg_wind.fit(X_train, y_wind, verbose=False)

        logger.info("Training XGBoost Rain Occurrence Classifier...")
        if len(np.unique(y_rain)) > 1:
            self.clf_rain.fit(X_train, y_rain, verbose=False)
        else:
            logger.warning("Single rain class in training data; skipped classifier fit.")

        self.is_trained = True
        return self

    def predict(self, df: pd.DataFrame) -> Dict[str, np.ndarray]:
        X = df[self.features].to_numpy()

        pred_temp = self.reg_temp.predict(X)
        pred_humidity = np.clip(self.reg_humidity.predict(X), 0.0, 100.0)
        pred_wind = np.clip(self.reg_wind.predict(X), 0.0, 160.0)

        if hasattr(self.clf_rain, "classes_") and len(self.clf_rain.classes_) > 1:
            rain_probs = self.clf_rain.predict_proba(X)[:, 1]
            rain_preds = (rain_probs > 0.45).astype(float)
        else:
            rain_probs = np.zeros(len(df))
            rain_preds = np.zeros(len(df))

        return {
            "pred_temp": pred_temp,
            "pred_humidity": pred_humidity,
            "pred_wind": pred_wind,
            "pred_rain": rain_preds,
            "pred_rain_prob": rain_probs,
        }

    def get_feature_importances(self) -> List[Dict[str, Any]]:
        if not self.is_trained:
            return []

        importances = self.reg_temp.feature_importances_
        items = []
        for name, score in zip(self.features, importances):
            # Categorize
            category = "Autoregressive" if "lag" in name else ("Temporal" if "sin" in name or "cos" in name else ("Volatility" if "roll" in name else "Barometric"))
            items.append({
                "feature": name.replace("_", " ").title(),
                "category": category,
                "importance": round(float(score) * 100, 2),
            })
        items.sort(key=lambda x: x["importance"], reverse=True)
        return items

    def save(self, directory: str = None) -> str:
        dir_path = directory or str(settings.MODELS_DIR)
        os.makedirs(dir_path, exist_ok=True)
        save_path = os.path.join(dir_path, f"xgboost_{self.version}.joblib")
        joblib.dump(self, save_path)
        logger.info(f"Saved XGBoost model artifacts to {save_path}")
        return save_path

    @staticmethod
    def load(path: str) -> "WeatherXGBoostModel":
        if not os.path.exists(path):
            raise FileNotFoundError(f"XGBoost model file not found at {path}")
        return joblib.load(path)
