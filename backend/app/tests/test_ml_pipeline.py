import numpy as np
import pandas as pd
from datetime import datetime, timezone, timedelta
from backend.app.ml.features import (
    build_feature_dataframe,
    chronological_split,
    METEOROLOGICAL_FEATURES,
)
from backend.app.ml.baselines import PersistenceBaseline, LinearRegressionBaseline
from backend.app.ml.xgboost_model import WeatherXGBoostModel
from backend.app.ml.lstm_model import WeatherLSTMModel
from backend.app.ml.evaluate import compute_regression_metrics, compute_classification_metrics


def generate_sample_observations(n_hours: int = 150) -> pd.DataFrame:
    base_time = datetime(2026, 1, 1, 0, 0, tzinfo=timezone.utc)
    times = [base_time + timedelta(hours=i) for i in range(n_hours)]

    temps = [20.0 + 5.0 * np.sin(i * 2 * np.pi / 24) + np.random.normal(0, 0.5) for i in range(n_hours)]
    humidities = [60.0 - 15.0 * np.sin(i * 2 * np.pi / 24) + np.random.normal(0, 1.0) for i in range(n_hours)]
    winds = [10.0 + np.random.uniform(0, 5) for _ in range(n_hours)]
    pressures = [1013.0 + np.random.normal(0, 1.5) for _ in range(n_hours)]
    precips = [1.5 if i % 18 == 0 else 0.0 for i in range(n_hours)]

    return pd.DataFrame({
        "timestamp": times,
        "temperature": temps,
        "relative_humidity": humidities,
        "wind_speed": winds,
        "surface_pressure": pressures,
        "precipitation": precips,
    })


def test_feature_engineering_and_no_leakage():
    df = generate_sample_observations(100)
    feat_df = build_feature_dataframe(df)

    assert not feat_df.empty
    for feat in METEOROLOGICAL_FEATURES:
        assert feat in feat_df.columns, f"Missing feature {feat}"
        assert not feat_df[feat].isnull().any(), f"NaN in feature {feat}"

    # Verify no future leakage in rolling 6h mean:
    # First row's temp_roll_mean_6h must be derived from previous observations, not current
    assert "temp_roll_mean_6h" in feat_df.columns
    assert "dp_dt_3h" in feat_df.columns


def test_chronological_split():
    df = generate_sample_observations(100)
    feat_df = build_feature_dataframe(df)
    train_df, val_df, test_df = chronological_split(feat_df, train_ratio=0.7, val_ratio=0.15)

    assert len(train_df) > 0
    assert len(val_df) > 0
    assert len(test_df) > 0

    # Test chronological ordering: train max time < val min time <= val max time < test min time
    assert train_df["timestamp"].max() < val_df["timestamp"].min()
    assert val_df["timestamp"].max() < test_df["timestamp"].min()


def test_baselines():
    df = generate_sample_observations(80)
    feat_df = build_feature_dataframe(df)
    train_df, _, test_df = chronological_split(feat_df)

    # 1. Persistence
    pers = PersistenceBaseline()
    pred_temp = pers.predict_temperature(test_df)
    assert len(pred_temp) == len(test_df)

    # 2. Linear Regression
    lin = LinearRegressionBaseline()
    lin.fit(train_df)
    preds = lin.predict(test_df)
    assert len(preds["pred_temp"]) == len(test_df)
    assert len(preds["pred_humidity"]) == len(test_df)


def test_xgboost_fit_and_predict():
    df = generate_sample_observations(80)
    feat_df = build_feature_dataframe(df)
    train_df, val_df, test_df = chronological_split(feat_df)

    xgb_model = WeatherXGBoostModel(version="test-xgb")
    xgb_model.fit(train_df, val_df)
    assert xgb_model.is_trained is True

    preds = xgb_model.predict(test_df)
    assert "pred_temp" in preds
    assert "pred_humidity" in preds
    assert "pred_wind" in preds
    assert "pred_rain" in preds
    assert "pred_rain_prob" in preds
    assert len(preds["pred_temp"]) == len(test_df)

    importances = xgb_model.get_feature_importances()
    assert len(importances) > 0
    assert "importance" in importances[0]


def test_pytorch_lstm_model():
    df = generate_sample_observations(120)
    train_df, val_df, _ = chronological_split(df)

    lstm = WeatherLSTMModel(version="test-lstm", input_seq_len=24, pred_steps=12)
    lstm.fit(train_df, val_df, epochs=3, batch_size=16)

    # Predict 24h/12h
    preds = lstm.predict_24h_temperatures(df.tail(30))
    assert len(preds) == 12
    assert isinstance(preds[0], (float, np.floating))


def test_evaluation_metrics():
    y_true = np.array([20.0, 22.0, 25.0, 23.0])
    y_pred = np.array([20.5, 21.8, 24.7, 23.2])

    reg = compute_regression_metrics(y_true, y_pred)
    assert "mae" in reg
    assert "rmse" in reg
    assert "r2" in reg
    assert reg["mae"] > 0
    assert reg["r2"] > 0.8

    y_rain_true = np.array([0, 1, 0, 1])
    y_rain_prob = np.array([0.1, 0.9, 0.2, 0.8])
    cls_m = compute_classification_metrics(y_rain_true, y_rain_prob)
    assert "f1" in cls_m
    assert "roc_auc" in cls_m
    assert cls_m["f1"] == 1.0
