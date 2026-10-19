# Quick Start Guide for Teammates

Welcome to the **AI Weather Prediction System**! Follow these instructions to run the project on your machine (works on Windows, Mac, and Linux).

---

## Prerequisites
1. **Python 3.11 or higher** (`python --version` or `python3 --version`)
2. **Node.js 18 or higher** (`node -v`)

---

## 1. Run the Backend (Terminal 1)

Open a terminal inside the project folder:

### On Mac / Linux:
```bash
# 1. Create and activate Python virtual environment
python3 -m venv .venv
source .venv/bin/activate

# 2. Install backend dependencies
pip install -r backend/requirements.txt

# 3. Create .env configuration file
cp backend/.env.example backend/.env

# 4. Start the FastAPI backend
python3 -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

### On Windows (Command Prompt / PowerShell):
```cmd
:: 1. Create and activate Python virtual environment
python -m venv .venv
.venv\Scripts\activate

:: 2. Install backend dependencies
pip install -r backend\requirements.txt

:: 3. Create .env configuration file
copy backend\.env.example backend\.env

:: 4. Start the FastAPI backend
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

> **Note on MongoDB**: You do **not** need to install MongoDB! If you don't have MongoDB running, the backend automatically detects it and uses its built-in local persistence engine.

---

## 2. Run the Frontend (Terminal 2)

Open a **second terminal window** inside the project folder:

```bash
# 1. Install frontend packages
npm install

# 2. Start the Vite dev server
npm run dev -- --port 5173
```

---

## 3. Open in Browser

- **Web Application**: [http://localhost:5173](http://localhost:5173)
- **Interactive Backend API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
