# Aether AI Weather Prediction System — Backend

Production-grade Python backend, asynchronous REST APIs, and Machine Learning sequence forecasting pipeline for the **Aether AI Weather Prediction System**.

---

## 1. Backend Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   EXTERNAL DATA SOURCES & TELEMETRY                                     │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────┘
         │                                       │                                         │
         ▼                                       ▼                                         ▼
┌─────────────────────────┐           ┌─────────────────────────┐               ┌─────────────────────────┐
│     WeatherAPI.com      │           │     OpenWeatherMap      │               │     Open-Meteo API      │
│  • Google 1:1 precision │           │  • Global Station Feed  │               │  • Real-time telemetry  │
│  • Physical WMO/METAR   │           │  • Free Tier with Key   │               │  • Historical archive   │
│    airport stations     │           └────────────┬────────────┘               │  • Worldwide geocoding  │
└────────────┬────────────┘                        │                            └────────────┬────────────┘
             │                                     │                                         │
             └─────────────────────────────────────┼─────────────────────────────────────────┘
                                                   │
                                                   ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                     INGESTION & SERVICE LAYER                                           │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  • `OpenMeteoService`: HTTPX asynchronous client with retries, timeout management & geocoding            │
│  • `WeatherIngestionService`: UTC normalization, sensor sanitization, deduplication & database upsert   │
│  • `ForecastService`: Orchestrates live observations, ML sequence generation & calibrated bounds        │
│  • `EvaluationService`: Computes empirical error tracking (MAE, RMSE, R², F1-Score, Brier score)        │
└────────────────────────────────────────┬────────────────────────────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                      MACHINE LEARNING PIPELINE                                          │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  Feature Engineering (`ml/features.py`)                                                                 │
│  ├── Cyclical time encodings: sin(2π·hour/24), cos(2π·hour/24), sin(2π·doy/365)                         │
│  ├── Atmospheric dynamics: diurnal solar wave, 3h & 6h barometric pressure trends (ΔP/Δt)               │
│  ├── Lag features: t-1h, t-2h, t-3h, t-6h, t-12h, t-24h for temperature, humidity, wind & rain         │
│  └── Rolling statistics: 6h, 12h, 24h rolling mean, std dev, min, and max                               │
│                                                                                                         │
│  Model Zoo (`ml/`)                                                                                      │
│  ├── Baselines (`ml/baselines.py`): Persistence model & L2-regularized Ridge regression                │
│  ├── Gradient Boosted Trees (`ml/xgboost_model.py`): XGBoost multi-output regression & rain classifier  │
│  └── Deep Sequence Network (`ml/lstm_model.py`): PyTorch Bidirectional LSTM (48h history ➔ 24h future)  │
│                                                                                                         │
│  Inference & Calibration (`ml/predict.py`)                                                              │
│  └── Dynamic uncertainty envelope: ±0.4°C at t+1h widening to ±1.2°C at t+24h                           │
└────────────────────────────────────────┬────────────────────────────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                      PERSISTENCE & STORAGE LAYER                                        │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  Primary: MongoDB (Async Motor & PyMongo)                                                               │
│  ├── `locations`: Tracked catalog & coordinate metadata                                                 │
│  ├── `observations`: Time-series meteorological records with compound indexes (`location_id`, `ts`)   │
│  ├── `forecasts`: Generated 24h sequence runs & calibrated 7-day outlooks                               │
│  └── `model_runs`: Model artifact registry, benchmark metrics & training runs                           │
│                                                                                                         │
│  Fallback: Embedded Local Storage Engine (`db/mongodb.py`)                                              │
│  └── Zero-config in-memory document store with automatic disk snapshots to `artifacts/storage/`        │
└────────────────────────────────────────┬────────────────────────────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   AUTOMATED BACKGROUND SCHEDULER                                        │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  APScheduler (`jobs/scheduler.py` & `jobs/tasks.py`)                                                    │
│  ├── Hourly (min=5): Ingest latest ground observations across all tracked locations                     │
│  ├── Daily (00:15 UTC): Generate 24h & 7d forecasts and persist to database                             │
│  ├── Weekly (Sunday 02:00 UTC): Retrain XGBoost & LSTM on accumulated telemetry                         │
│  └── Periodic (every 6h): Verify forecasts vs actual readings to update empirical accuracy curves       │
└────────────────────────────────────────┬────────────────────────────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                     FASTAPI ASYNCHRONOUS REST API                                       │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  Routes:                                                                                                │
│  ├── `/health`, `/health/ready`                ➔ Liveness & MongoDB connectivity health probes         │
│  ├── `/api/v1/locations`, `/search`           ➔ Active station catalog & global geocoding search      │
│  ├── `/api/v1/weather/current`, `/history`     ➔ Real-time observation & actual-vs-predicted points     │
│  ├── `/api/v1/forecast`, `/hourly`, `/daily`   ➔ 24h hourly sequence with confidence & 7d outlook      │
│  ├── `/api/v1/models/metrics`, `/status`       ➔ Benchmark comparisons & feature importances           │
│  └── `/api/v1/admin/*`                         ➔ Protected endpoints to trigger ingest/train/forecast  │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Machine Learning Architecture

### Feature Engineering (`app/ml/features.py`)
From each raw meteorological observation stream $(T, RH, P, W, R)$, the system computes **28+ predictive features**:
1. **Solar & Cyclical Time**:
   $$\sin\left(\frac{2\pi \cdot \text{hour}}{24}\right), \quad \cos\left(\frac{2\pi \cdot \text{hour}}{24}\right), \quad \sin\left(\frac{2\pi \cdot \text{day\_of\_year}}{365}\right)$$
2. **Barometric Pressure Trend**:
   $$\Delta P_{3h} = P_t - P_{t-3}, \quad \Delta P_{6h} = P_t - P_{t-6}$$
   Classifies barometric tendencies into `rising`, `steady`, or `falling`.
3. **Temporal Lag Vectors**:
   $$X_{\text{lags}} \in \{t-1, t-2, t-3, t-6, t-12, t-24\}$$
4. **Rolling Statistics**:
   Moving averages and standard deviations over 6h, 12h, and 24h windows to capture air mass transitions.

### Model Hierarchy
| Model | Target Variables | Loss Function | Role |
| :--- | :--- | :--- | :--- |
| **Persistence Baseline** | $T, RH, W, R$ | MAE | Strict benchmark representing $X_{t+h} = X_t$ |
| **Ridge Regression** | $T, RH, W, R$ | MSE with L2 regularization | Linear benchmark capturing baseline diurnal trend |
| **XGBoost Regressor** | $T, RH, W, \text{RainProb}$ | Squared Error & Log-Loss | Multi-output gradient boosted trees with early stopping |
| **PyTorch Bi-LSTM** | 24-step sequence | Sequence MSE Loss | Recurrent neural net capturing 48h temporal dependencies |
| **Ensemble (Prod)** | Blended Output | Calibrated Ensemble | Weighted prediction anchored to live station readings |

---

## 3. Directory Layout

```
backend/
├── app/
│   ├── main.py                   # FastAPI application & lifespan management
│   ├── core/
│   │   ├── config.py             # Pydantic BaseSettings & environment variables
│   │   ├── logging.py            # Sanitized structured logging
│   │   └── security.py           # Admin API key authentication & exception handlers
│   ├── db/
│   │   ├── mongodb.py            # MongoDB Motor connection & embedded JSON fallback
│   │   └── indexes.py            # Compound unique & lookup indexes
│   ├── models/
│   │   └── schemas.py            # Pydantic v2 schemas for all payloads
│   ├── api/routes/
│   │   ├── health.py             # Root, liveness (/health), readiness (/health/ready)
│   │   ├── locations.py          # Locations catalog & global geocoding search
│   │   ├── weather.py            # Ground-truth telemetry & observation history
│   │   ├── forecasts.py          # 24h hourly AI predictions & 7d outlook
│   │   ├── model_metrics.py      # Benchmark comparison & feature importances
│   │   └── admin.py              # Manual triggers for ingestion, forecast, retrain
│   ├── services/
│   │   ├── open_meteo.py         # HTTPX client for Open-Meteo live, archive & geocoding
│   │   ├── weather_ingestion.py  # UTC normalization, deduplication & database upsert
│   │   ├── forecast_service.py   # AI forecast orchestration & calibrated bounds
│   │   └── evaluation_service.py # Empirical verification of predictions vs. observations
│   ├── ml/
│   │   ├── features.py           # Lagging, rolling stats, pressure change & cyclical time
│   │   ├── baselines.py          # Persistence & Ridge linear regression baselines
│   │   ├── xgboost_model.py      # XGBoost multi-target regression & classification
│   │   ├── lstm_model.py         # PyTorch LSTM 48h sequence network
│   │   ├── evaluate.py           # MAE, RMSE, R², F1, ROC-AUC, Brier score
│   │   ├── train.py              # Reproducible chronological training pipeline
│   │   └── predict.py            # Multi-model sequence inference engine
│   ├── jobs/
│   │   ├── scheduler.py          # APScheduler configuration
│   │   └── tasks.py              # Hourly, daily, and weekly automated jobs
│   └── tests/                    # Comprehensive automated pytest test suites
├── scripts/
│   ├── ingest_history.py         # CLI historical ingestion script
│   ├── train_models.py           # CLI model training script
│   └── generate_forecasts.py     # CLI forecast generation script
├── artifacts/
│   ├── models/                   # Saved XGBoost (.joblib) & PyTorch (.pt) weights
│   └── storage/                  # Local embedded database snapshot
├── .env.example                  # Environment configuration template
├── requirements.txt              # Production Python dependencies
└── README.md                     # Backend documentation
```

---

## 4. Setup & Installation

### Prerequisites
- Python 3.11 or higher
- Optional: MongoDB 6.0+ or MongoDB Atlas (embedded persistence runs automatically if MongoDB is not present).

### Installation Steps

```bash
# 1. Navigate to backend directory
cd backend

# 2. Create and activate a Python virtual environment
python -m venv .venv
source .venv/bin/activate    # On Windows: .venv\Scripts\activate

# 3. Install required packages
pip install -r requirements.txt

# 4. Copy environment configuration
cp .env.example .env
```

---

## 5. Environment Variables Configuration

In `backend/.env`:

```ini
PROJECT_NAME="Aether AI Weather Prediction System"
VERSION="1.0.0"
ENV="development"
DEBUG=True

# Network and Server
HOST="0.0.0.0"
PORT=8000
API_V1_PREFIX="/api/v1"
ALLOWED_ORIGINS="http://localhost:5173,http://localhost:3000"

# Database Configuration (Leave default for embedded zero-config mode)
MONGODB_URI="mongodb://localhost:27017"
MONGODB_DB_NAME="weather_prediction"

# Data Precision Engine (Optional: "weatherapi", "open-meteo", "openweathermap")
WEATHER_API_PROVIDER="open-meteo"
WEATHER_API_KEY="" # Enter your key from weatherapi.com for 100% exact Google METAR sync

# Security
ADMIN_API_KEY="aether-admin-secret-key-change-in-prod"
SCHEDULER_ENABLED=True
```

---

## 6. Running the Server

Start the asynchronous FastAPI server:

```bash
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

Interactive documentation is automatically generated:
- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 7. Machine Learning CLI Commands

### Ingest Deep Historical Weather Records
```bash
python backend/scripts/ingest_history.py --city Mumbai --start 2023-01-01 --end 2024-01-01
```

### Train and Benchmark Models
```bash
python backend/scripts/train_models.py --city Mumbai
```

### Batch Generate Forecasts
```bash
python backend/scripts/generate_forecasts.py
```

---

## 8. REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Liveness health probe |
| `GET` | `/health/ready` | Database readiness check |
| `GET` | `/api/v1/locations` | Catalog of monitored locations |
| `GET` | `/api/v1/locations/search?q={query}` | Global geocoding search across any city or district |
| `GET` | `/api/v1/weather/current?city={city}` | Real-time meteorological observation |
| `GET` | `/api/v1/weather/history?city={city}&range=24h` | Actual vs. predicted sequence points |
| `GET` | `/api/v1/forecast?city={city}&lat={lat}&lon={lon}` | Unified forecast: current + 24h sequence + 7d outlook |
| `GET` | `/api/v1/forecast/hourly?city={city}&hours=24` | 24-hour predictions with uncertainty intervals |
| `GET` | `/api/v1/forecast/daily?city={city}&days=7` | Calibrated multi-day outlook |
| `GET` | `/api/v1/models/metrics` | Accuracy benchmarks across models (MAE, RMSE, R²) |
| `POST` | `/api/v1/admin/trigger-ingest` | *(Protected)* Manually trigger observation ingestion |
| `POST` | `/api/v1/admin/trigger-train` | *(Protected)* Manually trigger model training |
| `POST` | `/api/v1/admin/trigger-forecast` | *(Protected)* Manually trigger forecast generation |

---

## 9. Automated Testing

Run the test suite covering schemas, Open-Meteo integration, MongoDB operations, feature engineering, baselines, XGBoost, and PyTorch LSTM:

```bash
pytest backend/app/tests/ -v
```
