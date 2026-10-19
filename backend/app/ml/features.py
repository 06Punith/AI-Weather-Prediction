import numpy as np
import pandas as pd
from typing import Tuple, List, Dict, Any


METEOROLOGICAL_FEATURES = [
    # Core temporal cyclical
    "sin_hour", "cos_hour", "sin_month", "cos_month",
    # Lags
    "temp_lag_1h", "temp_lag_3h", "temp_lag_6h", "temp_lag_12h", "temp_lag_24h",
    "humidity_lag_1h", "humidity_lag_3h", "humidity_lag_6h",
    "wind_lag_1h", "wind_lag_3h",
    "pressure_lag_1h", "pressure_lag_3h",
    "precip_lag_1h", "precip_lag_3h",
    # Rolling statistics
    "temp_roll_mean_6h", "temp_roll_std_6h", "temp_roll_min_6h", "temp_roll_max_6h",
    "temp_roll_mean_24h", "temp_roll_std_24h",
    "humidity_roll_mean_6h",
    # Physical/barometric dynamic
    "dp_dt_3h",
]


def build_feature_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """
    Transforms raw chronological weather observations into machine learning features.
    Guarantees zero future data leakage by strictly using past observations (closed='left' or shift).
    """
    if df.empty or len(df) < 25:
        return pd.DataFrame()

    df = df.copy()

    # Ensure timestamp is datetime and sorted chronologically
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df = df.sort_values("timestamp").reset_index(drop=True)

    # 1. Cyclical time encoding
    hours = df["timestamp"].dt.hour
    months = df["timestamp"].dt.month
    df["sin_hour"] = np.sin(2 * np.pi * hours / 24.0)
    df["cos_hour"] = np.cos(2 * np.pi * hours / 24.0)
    df["sin_month"] = np.sin(2 * np.pi * (months - 1) / 12.0)
    df["cos_month"] = np.cos(2 * np.pi * (months - 1) / 12.0)

    # 2. Lag features (1, 3, 6, 12, 24 hours)
    for lag in [1, 3, 6, 12, 24]:
        df[f"temp_lag_{lag}h"] = df["temperature"].shift(lag)
        if lag in [1, 3, 6]:
            df[f"humidity_lag_{lag}h"] = df["relative_humidity"].shift(lag)
        if lag in [1, 3]:
            df[f"wind_lag_{lag}h"] = df["wind_speed"].shift(lag)
            df[f"pressure_lag_{lag}h"] = df["surface_pressure"].shift(lag)
            df[f"precip_lag_{lag}h"] = df["precipitation"].shift(lag)

    # 3. Barometric pressure 3-hour change
    df["dp_dt_3h"] = df["surface_pressure"] - df["pressure_lag_3h"]

    # 4. Rolling statistics (shifted by 1 to strictly prevent leakage of current observation)
    temp_shifted = df["temperature"].shift(1)
    hum_shifted = df["relative_humidity"].shift(1)

    df["temp_roll_mean_6h"] = temp_shifted.rolling(window=6, min_periods=3).mean()
    df["temp_roll_std_6h"] = temp_shifted.rolling(window=6, min_periods=3).std().fillna(0.0)
    df["temp_roll_min_6h"] = temp_shifted.rolling(window=6, min_periods=3).min()
    df["temp_roll_max_6h"] = temp_shifted.rolling(window=6, min_periods=3).max()

    df["temp_roll_mean_24h"] = temp_shifted.rolling(window=24, min_periods=12).mean()
    df["temp_roll_std_24h"] = temp_shifted.rolling(window=24, min_periods=12).std().fillna(0.0)

    df["humidity_roll_mean_6h"] = hum_shifted.rolling(window=6, min_periods=3).mean()

    # 5. Rain binary target (1 if rain > 0.1 mm, else 0)
    df["rain_binary"] = (df["precipitation"] > 0.1).astype(int)

    # Drop rows with NaN from lags
    df_clean = df.dropna(subset=METEOROLOGICAL_FEATURES).reset_index(drop=True)
    return df_clean


def chronological_split(
    df: pd.DataFrame, train_ratio: float = 0.70, val_ratio: float = 0.15
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """
    Splits dataset chronologically into Train, Validation, and Test sets.
    Never shuffles data to strictly prevent data leakage across time boundaries.
    """
    n = len(df)
    train_end = int(n * train_ratio)
    val_end = int(n * (train_ratio + val_ratio))

    train_df = df.iloc[:train_end].copy()
    val_df = df.iloc[train_end:val_end].copy()
    test_df = df.iloc[val_end:].copy()

    return train_df, val_df, test_df
