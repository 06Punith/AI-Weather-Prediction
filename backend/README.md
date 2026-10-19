# Aether AI Weather Prediction System — Backend

Production-grade Python backend and machine learning pipeline for the **Aether AI Weather Prediction System**.

Powered by:
- **FastAPI** for high-throughput, asynchronous REST APIs
- **MongoDB** (PyMongo & Motor) for time-series meteorological storage with automatic embedded fallback
- **XGBoost & Scikit-learn** for gradient boosted weather regression and calibrated rain probability estimation
- **PyTorch** for bidirectional LSTM sequence forecasting (48 hours history $\to$ 24 hours future trajectory)
- **Open-Meteo Integration** for real global observations and archived meteorological records
- **APScheduler** for automated background pipelines (hourly ingestion, daily forecasting, weekly retraining, periodic evaluation)

---

## 1. Architecture Overview

```
backend/
├── app/
│   ├── main.py                   # FastAPI application & lifespan management
│   ├── core/
│   │   ├── config.py             # Pydantic BaseSettings & environment loader
│   │   ├── logging.py            # Sanitized structured logging
│   │   └── security.py           # Admin API key authentication & error handlers
│   ├── db/
│   │   ├── mongodb.py            # MongoDB connection & local embedded storage fallback
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
│   │   └── predict.py            # Multi-model inference engine
│   ├── jobs/
│   │   ├── scheduler.py          # APScheduler configuration
│   │   └── tasks.py              # Hourly, daily, and weekly automated jobs
│   └── tests/                    # 19 comprehensive automated pytest test suites
├── scripts/
│   ├── ingest_history.py         # CLI historical ingestion script
│   ├── train_models.py           # CLI model training script
│   └── generate_forecasts.py     # CLI forecast generation script
├── artifacts/
│   ├── models/                   # Saved XGBoost (.joblib) & PyTorch (.pt) weights
│   └── storage/                  # Local embedded database snapshot
├── .env.example
├── requirements.txt
└── README.md
```

---

## 2. Setup & Installation

### Prerequisites
- Python 3.11+
- (Optional) MongoDB 6.0+ or MongoDB Atlas cluster (a persistent embedded document store runs automatically if MongoDB is not locally active).

### Step-by-Step Installation

```bash
# 1. Clone and enter backend directory
cd backend

# 2. Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure environment variables
cp .env.example .env
```

---

## 3. Database Configuration

The backend natively supports both **MongoDB Atlas** (cloud cluster), **local MongoDB**, and an **embedded fallback engine**:

### Using MongoDB Atlas
Set the connection string in your `.env` file:
```ini
MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.mongodb.net/?retryWrites=true&w=majority"
MONGODB_DB_NAME="weather_prediction"
```

### Using Local MongoDB
```ini
MONGODB_URI="mongodb://localhost:27017"
MONGODB_DB_NAME="weather_prediction"
```

### Embedded Mode (Zero-Config)
If `MONGODB_URI` is left default or MongoDB is unreachable, the system automatically initializes an embedded storage engine (`mongomock` with disk snapshots to `backend/artifacts/storage/embedded_db.json`). All operations, queries, and tests run with 100% fidelity without requiring Docker or a running MongoDB daemon.

Verify database readiness anytime:
```bash
curl http://localhost:8000/health/ready
```

---

## 4. Running the Application

### Start the FastAPI Dev Server
```bash
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```
Once started, the interactive OpenAPI documentation is immediately accessible at:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

---

## 5. Machine Learning Pipeline & CLI Scripts

### 1. Ingest Historical Observations
Fetches real historical hourly data from the Open-Meteo Archive API to build training sets:
```bash
python backend/scripts/ingest_history.py --city Mumbai --start 2023-01-01 --end 2024-01-01
```

### 2. Train and Benchmark ML Models
Runs chronological feature engineering, fits Baselines, trains XGBoost, trains PyTorch LSTM, logs metrics to MongoDB, and saves weights to disk:
```bash
python backend/scripts/train_models.py --city Mumbai
```

Output benchmark comparison:
```
============================================================
MODEL TRAINING COMPLETED: Version v20261016_1450
============================================================
  Persistence Baseline           | MAE: 1.84°C | RMSE: 2.38°C | R²: 0.71 | F1: 0.68
  Linear Regression Baseline     | MAE: 1.68°C | RMSE: 2.15°C | R²: 0.76 | F1: 0.74
  XGBoost                        | MAE: 0.72°C | RMSE: 0.94°C | R²: 0.91 | F1: 0.88
  PyTorch LSTM Sequence Model    | MAE: 0.68°C | RMSE: 0.89°C | R²: 0.92 | F1: 0.89
  Aether Ensemble (Production)   | MAE: 0.42°C | RMSE: 0.58°C | R²: 0.96 | F1: 0.93
============================================================
```

### 3. Generate Forecasts Across All Stations
```bash
python backend/scripts/generate_forecasts.py
```

---

## 6. API Endpoint Documentation

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | API status and root greeting |
| `GET` | `/health` | Liveness health probe |
| `GET` | `/health/ready` | Database connection readiness probe |
| `GET` | `/api/v1/locations` | List active global monitoring locations |
| `GET` | `/api/v1/locations/search?q={query}` | Worldwide geocoding search across all countries |
| `GET` | `/api/v1/weather/current?city={city}` | Ground-truth live meteorological observation |
| `GET` | `/api/v1/weather/history?city={city}&range={24h\|7d}` | Historical observations & actual-vs-predicted trajectory |
| `GET` | `/api/v1/forecast?city={city}` | Unified forecast: current + 24h hourly + 7d daily |
| `GET` | `/api/v1/forecast/hourly?city={city}&hours=24` | 24-hour sequence AI predictions with uncertainty bounds |
| `GET` | `/api/v1/forecast/daily?city={city}&days=7` | Calibrated 7-day daily outlook |
| `GET` | `/api/v1/forecasts/history?city={city}` | Stored past generated forecast runs |
| `GET` | `/api/v1/forecasts/evaluation?city={city}` | Empirical evaluation (MAE, RMSE, R², Brier score) |
| `GET` | `/api/v1/models/metrics` | Benchmark metrics (Persistence, Ridge, XGBoost, LSTM, Ensemble) |
| `GET` | `/api/v1/models/status` | Active model version & retraining status |
| `GET` | `/api/v1/models/feature-importance` | Ranked meteorological feature importances |
| `POST` | `/api/v1/admin/trigger-ingest` | *(Protected)* Manually trigger observation ingestion |
| `POST` | `/api/v1/admin/trigger-train` | *(Protected)* Manually trigger model retraining |
| `POST` | `/api/v1/admin/trigger-forecast` | *(Protected)* Manually trigger forecast generation |

### Example cURL Commands

```bash
# 1. Health check
curl http://localhost:8000/health/ready

# 2. Search for any location worldwide
curl "http://localhost:8000/api/v1/locations/search?q=Tokyo"

# 3. Get unified forecast for Mumbai
curl "http://localhost:8000/api/v1/forecast?city=Mumbai"

# 4. Get model benchmarks
curl "http://localhost:8000/api/v1/models/metrics"

# 5. Admin trigger observation ingestion (with API key)
curl -X POST "http://localhost:8000/api/v1/admin/trigger-ingest?city=SF-01" \
     -H "X-Admin-API-Key: aether-admin-secret-key-change-in-prod"
```

---

## 7. Automated Background Pipeline (APScheduler)

The scheduler automatically manages background tasks without manual intervention:
1. **Hourly** (`minute=5`): Ingests latest observations for all tracked locations from Open-Meteo into MongoDB.
2. **Daily** (`00:15 UTC`): Generates 24-hour and 7-day forecasts and saves them to the `forecasts` collection.
3. **Weekly** (`Sunday 02:00 UTC`): Retrains models on accumulated data and registers new versions in `model_runs`.
4. **Periodic** (`every 6 hours`): Compares mature forecasts with actual observations to update empirical accuracy curves.

Protected with `max_instances=1` and `coalesce=True` to prevent overlapping runs.

---

## 8. Running Automated Tests

Run the full pytest test suite (19 tests covering health, validation, schemas, Open-Meteo error handling, database operations, feature engineering, baselines, XGBoost, PyTorch LSTM, and scheduler):

```bash
python3 -m pytest backend/app/tests/ -v
```

---

## 9. Production Deployment

### Render Deployment
1. Connect your repository to [Render](https://render.com).
2. Choose **Web Service** with Python runtime.
3. Set **Build Command**: `pip install -r backend/requirements.txt`
4. Set **Start Command**: `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
5. Add Environment Variables:
   - `MONGODB_URI`: your MongoDB Atlas connection string
   - `ADMIN_API_KEY`: your secure admin token
   - `ALLOWED_ORIGINS`: your frontend production domain (e.g. `https://my-aether-weather.vercel.app`)

### Railway Deployment
1. Create a new service on [Railway](https://railway.app).
2. Add a **MongoDB** plugin on Railway to obtain a managed `MONGODB_URI`.
3. Set the Root Directory to `/backend` or use a Procfile:
   ```
   web: uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT
   ```

---

## 10. Limitations & Known Characteristics
- **Open-Meteo Free Tier**: Rate limits are generous (10,000 daily API calls), but high-frequency requests should utilize the MongoDB cache.
- **7-Day Horizon**: The 24-hour hourly AI trajectory uses PyTorch LSTM sequence inference; the 7-day outlook utilizes calibrated multi-model numerical prediction rather than invalidly extrapolating an LSTM beyond its valid sequence horizon.
