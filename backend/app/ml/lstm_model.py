import os
import json
import joblib
import numpy as np
import pandas as pd
from typing import Tuple, Dict, Any, Optional
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset
from sklearn.preprocessing import StandardScaler
from backend.app.core.config import settings
from backend.app.core.logging import logger

SEQUENCE_INPUT_VARS = [
    "temperature",
    "relative_humidity",
    "wind_speed",
    "surface_pressure",
    "precipitation",
    "sin_hour",
]


class WeatherLSTMNet(nn.Module):
    """PyTorch LSTM sequence network: 48 hours historical input -> 24 hours multi-step output."""

    def __init__(self, input_size: int = 6, hidden_size: int = 64, num_layers: int = 2, output_steps: int = 24):
        super().__init__()
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        self.output_steps = output_steps

        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=0.2 if num_layers > 1 else 0.0,
        )
        self.fc = nn.Sequential(
            nn.Linear(hidden_size, 64),
            nn.ReLU(),
            nn.Dropout(0.15),
            nn.Linear(64, output_steps),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x shape: (batch_size, seq_len=48, input_size=6)
        out, (hn, cn) = self.lstm(x)
        # Use last hidden state
        last_hidden = out[:, -1, :]
        preds = self.fc(last_hidden)  # (batch_size, output_steps=24)
        return preds


class WeatherLSTMModel:
    """Wrapper managing preprocessing, training, inference, and persistence for the PyTorch LSTM."""

    def __init__(self, version: str = "v1.0-lstm", input_seq_len: int = 48, pred_steps: int = 24):
        self.version = version
        self.input_seq_len = input_seq_len
        self.pred_steps = pred_steps
        self.input_vars = SEQUENCE_INPUT_VARS

        self.scaler_x = StandardScaler()
        self.scaler_y = StandardScaler()
        self.net = WeatherLSTMNet(
            input_size=len(self.input_vars),
            hidden_size=64,
            num_layers=2,
            output_steps=pred_steps,
        )
        self.device = torch.device("cuda" if torch.cuda.is_available() else ("mps" if torch.backends.mps.is_available() else "cpu"))
        self.net.to(self.device)
        self.is_trained = False

    def _prepare_sequence_tensors(
        self, df: pd.DataFrame
    ) -> Tuple[np.ndarray, np.ndarray]:
        """Prepares sliding-window chronologically aligned (X: 48h, y: 24h) arrays."""
        df_sorted = df.sort_values("timestamp").reset_index(drop=True)

        if "sin_hour" not in df_sorted.columns:
            hours = pd.to_datetime(df_sorted["timestamp"]).dt.hour
            df_sorted["sin_hour"] = np.sin(2 * np.pi * hours / 24.0)

        data_x = df_sorted[self.input_vars].to_numpy()
        data_y = df_sorted["temperature"].to_numpy()

        X_list, y_list = [], []
        total_len = len(df_sorted)
        for i in range(total_len - self.input_seq_len - self.pred_steps + 1):
            X_list.append(data_x[i : i + self.input_seq_len])
            y_list.append(data_y[i + self.input_seq_len : i + self.input_seq_len + self.pred_steps])

        return np.array(X_list), np.array(y_list)

    def fit(
        self,
        train_df: pd.DataFrame,
        val_df: Optional[pd.DataFrame] = None,
        epochs: int = 15,
        batch_size: int = 32,
        lr: float = 0.003,
    ) -> "WeatherLSTMModel":
        logger.info("Preparing PyTorch LSTM sequence dataset (48h past -> 24h future)...")
        X_train_raw, y_train_raw = self._prepare_sequence_tensors(train_df)

        if len(X_train_raw) < 5:
            logger.warning("Insufficient sequence windows for LSTM training.")
            return self

        # Fit scalers
        n_samples, seq_len, n_features = X_train_raw.shape
        X_flat = X_train_raw.reshape(-1, n_features)
        self.scaler_x.fit(X_flat)
        X_scaled = self.scaler_x.transform(X_flat).reshape(n_samples, seq_len, n_features)

        self.scaler_y.fit(y_train_raw)
        y_scaled = self.scaler_y.transform(y_train_raw)

        dataset = TensorDataset(
            torch.tensor(X_scaled, dtype=torch.float32),
            torch.tensor(y_scaled, dtype=torch.float32),
        )
        loader = DataLoader(dataset, batch_size=batch_size, shuffle=True)

        criterion = nn.MSELoss()
        optimizer = torch.optim.Adam(self.net.parameters(), lr=lr, weight_decay=1e-5)

        logger.info(f"Training PyTorch LSTM model on {self.device} for {epochs} epochs...")
        self.net.train()
        for epoch in range(epochs):
            total_loss = 0.0
            for batch_x, batch_y in loader:
                batch_x = batch_x.to(self.device)
                batch_y = batch_y.to(self.device)

                optimizer.zero_grad()
                preds = self.net(batch_x)
                loss = criterion(preds, batch_y)
                loss.backward()
                nn.utils.clip_grad_norm_(self.net.parameters(), max_norm=1.0)
                optimizer.step()

                total_loss += loss.item() * len(batch_x)

            epoch_loss = total_loss / len(dataset)
            if (epoch + 1) % 5 == 0 or epoch == 0:
                logger.info(f"LSTM Epoch [{epoch+1}/{epochs}] Loss: {epoch_loss:.4f}")

        self.is_trained = True
        self.net.eval()
        return self

    def predict_24h_temperatures(self, past_48h_df: pd.DataFrame) -> np.ndarray:
        """Takes the last 48 hours of observations and predicts the next 24 hours of temperatures."""
        if not self.is_trained:
            # Fallback to linear extrapolation if model weights uninitialized
            last_temp = past_48h_df["temperature"].iloc[-1] if not past_48h_df.empty else 20.0
            return np.full(self.pred_steps, last_temp)

        df_sorted = past_48h_df.sort_values("timestamp").tail(self.input_seq_len)
        if "sin_hour" not in df_sorted.columns:
            hours = pd.to_datetime(df_sorted["timestamp"]).dt.hour
            df_sorted["sin_hour"] = np.sin(2 * np.pi * hours / 24.0)

        data_x = df_sorted[self.input_vars].to_numpy()
        if len(data_x) < self.input_seq_len:
            pad = np.tile(data_x[0], (self.input_seq_len - len(data_x), 1))
            data_x = np.vstack([pad, data_x])

        x_scaled = self.scaler_x.transform(data_x).reshape(1, self.input_seq_len, -1)
        x_tensor = torch.tensor(x_scaled, dtype=torch.float32).to(self.device)

        self.net.eval()
        with torch.no_grad():
            preds_scaled = self.net(x_tensor).cpu().numpy()
            pred_temps = self.scaler_y.inverse_transform(preds_scaled)[0]

        return np.round(pred_temps, 2)

    def save(self, directory: str = None) -> str:
        dir_path = directory or str(settings.MODELS_DIR)
        os.makedirs(dir_path, exist_ok=True)
        weights_path = os.path.join(dir_path, f"lstm_{self.version}.pt")
        meta_path = os.path.join(dir_path, f"lstm_{self.version}_meta.joblib")

        torch.save(self.net.state_dict(), weights_path)
        joblib.dump({
            "scaler_x": self.scaler_x,
            "scaler_y": self.scaler_y,
            "input_seq_len": self.input_seq_len,
            "pred_steps": self.pred_steps,
            "version": self.version,
        }, meta_path)

        logger.info(f"Saved PyTorch LSTM artifacts to {weights_path}")
        return weights_path

    @classmethod
    def load(cls, weights_path: str, meta_path: str) -> "WeatherLSTMModel":
        if not os.path.exists(weights_path) or not os.path.exists(meta_path):
            raise FileNotFoundError("LSTM model files not found")

        meta = joblib.load(meta_path)
        model = cls(
            version=meta["version"],
            input_seq_len=meta["input_seq_len"],
            pred_steps=meta["pred_steps"],
        )
        model.scaler_x = meta["scaler_x"]
        model.scaler_y = meta["scaler_y"]
        model.net.load_state_dict(torch.load(weights_path, map_location=model.device))
        model.net.eval()
        model.is_trained = True
        return model
