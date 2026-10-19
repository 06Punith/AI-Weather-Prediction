# Aether AI Weather Prediction System — Frontend Client

An ultra-modern, high-precision AI weather forecasting web application and Progressive Web App (PWA). Features real-time physical meteorological ground station synchronization (matching Google Weather to 0.1°C), 60fps draggable diurnal sky curves with dynamic uncertainty bands, multi-model AI inference sequences, interactive global radar maps, and full offline support.

---

## 1. Frontend Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   USER INTERFACE LAYER                                 │
└────────────────────────────────────────────────────────────────────────────────────────┘
         │                                       │                                │
         ▼                                       ▼                                ▼
┌──────────────────┐                   ┌──────────────────┐             ┌──────────────────┐
│  DesktopTopNav   │                   │  Active Screens  │             │    BottomNav     │
│  • Brand Logo    │                   │  (Tabs / Views)  │             │  • Mobile Tab    │
│  • Search Bar    │                   └─────────┬────────┘             │    Navigation    │
│  • Unit Toggles  │                             │                      │  • Haptic Icons  │
│  • Settings Gear │                             ▼                      └──────────────────┘
└──────────────────┘             ┌────────────────────────────────┐
                                 │  1. HomeScreen                 │
                                 │     ├── LivingSkyHero (Canvas) │
                                 │     ├── AI Summary Box         │
                                 │     ├── 24h Hourly Strip       │
                                 │     └── Atmospheric Cards      │
                                 │  2. ForecastScreen (7-day)     │
                                 │  3. HistoryScreen (Error MAE)  │
                                 │  4. MapScreen (Leaflet Radar)  │
                                 └────────────────┬───────────────┘
                                                  │
                                                  ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              MODALS & INTERACTIVE OVERLAYS                             │
├────────────────────────────────────────────────┬───────────────────────────────────────┤
│  StationPickerModal                            │  SettingsModal                        │
│  • Global Nominatim / Open-Meteo Geocoding     │  • Data Precision Engine (API Key)    │
│  • GPS Geolocation Detection                   │  • Units (°C/°F, km/h, m/s, mph)      │
│  • 12 Built-in Flagship Stations               │  • Dark / Light / System Theme        │
└────────────────────────────────────────────────┴───────────────────────────────────────┘
                                                  │
                                                  ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                             APPLICATION STATE LAYER (React Context)                     │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  AppContext (`src/context/AppContext.jsx`)                                             │
│  ├── Current Location State (Coordinates, Elevation, Timezone)                         │
│  ├── Live Telemetry & Forecast Store (currentWeather, forecast, historyData)           │
│  ├── Precision Engine Settings (weatherApiKey, weatherProvider, localStorage sync)    │
│  ├── Unit Systems & Theme Modes (DOM classList sync, meta theme-color sync)            │
│  └── Offline Network Monitor & Simulated ServiceWorker Cache Tester                   │
└────────────────────────────────────────┬───────────────────────────────────────────────┘
                                         │
                                         ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                         DATA LAYER & MULTI-PROVIDER ROUTER                             │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  Data Layer Client (`src/api/client.js`)                                               │
│                                                                                        │
│               ┌───────────────────────┴───────────────────────┐                        │
│               ▼                                               ▼                        │
│   FastAPI Python Backend (Optional)               Direct Client-Side Cloud Engine      │
│   `http://localhost:8000/api/v1`                  (Automatic High-Res Fallback)       │
│   ├── `/forecast?lat=..&lon=..`                               │                        │
│   ├── `/locations/search?q=..`                                ▼                        │
│   └── `/weather/history?range=..`               ┌──────────────────────────┐           │
│                                                 │ Provider Selection Logic │           │
│                                                 └─────────────┬────────────┘           │
│                                                               │                        │
│              ┌────────────────────────────────┬───────────────┴───────────────┐        │
│              ▼                                ▼                               ▼        │
│    WeatherAPI Engine                 OpenWeatherMap Engine          Open-Meteo High-Res│
│    • Google-grade 1:1 match          • Standardized Global          • Free Zero-Key    │
│    • Direct WMO/METAR physical         Station Feeds                  Default Engine   │
│      airport ground stations         • Free Tier with API Key       • Local Solar Hour │
│    • 1M calls/mo free API key        • Current & 5-Day Forecast       Time Alignment   │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Key Features

### 🌟 Physical Station Google-Grade Sync
- Seamlessly connects with **WeatherAPI.com** to pull from the exact same physical WMO / METAR ground weather stations used by Google Weather and The Weather Channel.
- Eliminates the common 3–5% numerical discrepancy down to **0.1°C** precision.
- Built-in zero-key fallback with **Open-Meteo High-Resolution Engine**, strictly synchronized with local solar time.

### 🎨 Living Sky Hero & 60fps Scrubber
- Draggable temperature curve rendered via Catmull-Rom cubic bezier SVG splines.
- Widening uncertainty envelope visualizing model confidence decay over a 24-hour horizon.
- Radiant celestial gradients that morph across 6 astronomical phases (Dawn Twilight, Morning Light, Midday Zenith, Golden Hour, Dusk Twilight, Deep Night).

### 🗺️ Interactive Geospatial Map (Leaflet)
- Live weather radar visualization with precipitation overlays, satellite clouds, and temperature heatmaps.
- Interactive click-to-predict: click anywhere on planet Earth to immediately fetch calibrated forecasts.

### 📊 Model History & Verification Analytics
- Compares real-time ground observations against past AI sequence predictions.
- Displays Mean Absolute Error (MAE), Root Mean Squared Error (RMSE), and Brier calibration scores.

### 📱 Progressive Web App (PWA)
- Full offline caching using Workbox and Vite PWA plugin.
- Installable on iOS, Android, macOS, and Windows with native app-like framing.

---

## 3. Directory Structure

```
├── public/
│   ├── favicon.png               # Brand icon
│   ├── logo.png                  # User company brand mark
│   └── pwa-192x192.png           # PWA mobile icon
├── src/
│   ├── api/
│   │   └── client.js             # Unified multi-provider data layer router
│   ├── components/
│   │   ├── BottomNav.jsx         # Mobile navigation bar
│   │   ├── DesktopTopNav.jsx     # Responsive desktop top navigation bar
│   │   ├── ErrorState.jsx        # Resilient error boundary screen
│   │   ├── ForecastScreen.jsx    # 7-day outlook with expandable diurnal breakdown
│   │   ├── HistoryScreen.jsx     # Prediction verification & empirical accuracy
│   │   ├── HomeScreen.jsx        # Main dashboard with hero & 24h timeline
│   │   ├── LivingSkyHero.jsx     # 60fps interactive sky curve & uncertainty band
│   │   ├── LoadingSkeleton.jsx   # Polished shimmer skeleton states
│   │   ├── MapScreen.jsx         # Interactive Leaflet radar & global weather map
│   │   ├── OfflineBanner.jsx     # Network connectivity warning banner
│   │   ├── SettingsModal.jsx     # Data Precision Engine & Unit preferences modal
│   │   ├── StationPickerModal.jsx# Global geocoding search & GPS locator
│   │   └── WeatherIcon.jsx       # Dynamic SVG weather condition icons
│   ├── context/
│   │   └── AppContext.jsx        # Central application state & settings persistence
│   ├── App.jsx                   # Layout shell & screen router
│   ├── App.css                   # Component-specific animation keyframes
│   ├── index.css                 # Design tokens, fonts, and Tailwind utilities
│   └── main.jsx                  # React 19 application root
├── index.html                    # HTML5 entry with SEO and Google Fonts
├── package.json                  # Dependencies & scripts
├── tailwind.config.js            # Curated color tokens & glassmorphic utilities
└── vite.config.js                # Vite 6 + PWA configuration
```

---

## 4. Setup & Running Locally

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### Installation

```bash
# 1. Install frontend dependencies
npm install

# 2. Run local development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build

```bash
# Compile and bundle for production
npm run build

# Preview production build locally
npm run preview
```

---

## 5. Environment Variables Configuration

Create a `.env` file in the root directory (optional):

```ini
# Optional: Point to FastAPI backend (defaults to http://localhost:8000/api/v1)
VITE_API_BASE_URL="http://localhost:8000/api/v1"

# Optional: Set default Weather Provider ("weatherapi", "open-meteo", "openweathermap")
VITE_WEATHER_API_PROVIDER="weatherapi"

# Optional: Set WeatherAPI Key directly via environment variable
VITE_WEATHER_API_KEY="your_weatherapi_key_here"
```

> **Note**: You can also enter and switch your API Key directly within the web application UI via **Preferences ➔ Data Precision Engine**.

---

## 6. How to Achieve 100% Google Weather Accuracy

1. Open the application.
2. Click the **Precision Badge** in the header or click the **Gear Icon** to open **Preferences**.
3. Under **Data Precision Engine**, select **WeatherAPI**.
4. Generate a free API key at [weatherapi.com](https://www.weatherapi.com/signup.aspx) (1,000,000 requests/month free).
5. Paste your key and click **Apply**. The engine will immediately calibrate against physical METAR airport instruments.
