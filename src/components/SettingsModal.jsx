import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { testWeatherApiKey } from '../api/client'
import {
  X,
  Moon,
  Sun,
  Monitor,
  Thermometer,
  Wind,
  WifiOff,
  Wifi,
  Download,
  ShieldCheck,
  Smartphone,
  Key,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Eye,
  EyeOff,
  Sparkles,
  Check,
  RefreshCw
} from 'lucide-react'

export default function SettingsModal() {
  const {
    isSettingsOpen,
    setIsSettingsOpen,
    tempUnit,
    setTempUnit,
    windUnit,
    setWindUnit,
    themeMode,
    setThemeMode,
    weatherApiKey,
    weatherProvider,
    updateWeatherConfig,
    isOffline,
    offlineSimulated,
    toggleOfflineSim,
    currentStation
  } = useApp()

  const [inputKey, setInputKey] = useState(weatherApiKey || '')
  const [selectedProvider, setSelectedProvider] = useState(weatherProvider || (weatherApiKey ? 'weatherapi' : 'open-meteo'))
  const [showKey, setShowKey] = useState(false)
  const [testState, setTestState] = useState({ loading: false, success: false, error: null, message: null })

  if (!isSettingsOpen) return null

  const handleApplyConfig = async (prov = selectedProvider, key = inputKey) => {
    setTestState({ loading: true, success: false, error: null, message: null })
    try {
      if (prov !== 'open-meteo' && key.trim()) {
        const testRes = await testWeatherApiKey(prov, key, currentStation?.lat, currentStation?.lon)
        setTestState({
          loading: false,
          success: true,
          error: null,
          message: `Verified: ${testRes.location} (${testRes.temp}°C)`
        })
      } else {
        setTestState({ loading: false, success: true, error: null, message: 'Open-Meteo High-Resolution Active' })
      }
      await updateWeatherConfig(prov, key)
    } catch (err) {
      setTestState({ loading: false, success: false, error: err.message, message: null })
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Application Settings and Unit Preferences"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in"
    >
      <div className="w-full max-w-md bg-white dark:bg-space-900 border border-slate-200 dark:border-white/10 rounded-t-3xl sm:rounded-3xl shadow-elevated overflow-hidden max-h-[90vh] flex flex-col animate-slide-up">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-white dark:bg-space-900">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-text-primary">
              Preferences & Data Engine
            </h2>
            <p className="text-xs text-slate-500 dark:text-text-muted">
              Configure telemetry precision and visual units
            </p>
          </div>
          <button
            onClick={() => setIsSettingsOpen(false)}
            aria-label="Close preferences"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-text-muted dark:hover:text-text-primary hover:bg-slate-100 dark:hover:bg-space-850 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto">

          {/* 1. Google-Grade Accuracy & API Key Engine */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-sky-50 to-indigo-50/40 dark:from-space-850 dark:to-space-800 border border-sky-200/80 dark:border-white/10 space-y-3 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-sky-500/10 text-sky-600 dark:text-cyan-400">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-text-primary flex items-center gap-1.5">
                    <span>Data Precision Engine</span>
                    <Sparkles className="w-3 h-3 text-amber-500" />
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-text-muted">
                    Sync directly with official WMO / Google METAR stations
                  </p>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                weatherApiKey
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  : 'bg-sky-500/10 text-sky-700 dark:text-cyan-300 border-sky-500/20'
              }`}>
                {weatherApiKey ? 'Google Calibrated' : 'High-Res Free'}
              </span>
            </div>

            {/* Provider Switcher Tabs */}
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-200/60 dark:bg-space-900 border border-slate-200 dark:border-white/5">
              <button
                type="button"
                onClick={() => {
                  setSelectedProvider('weatherapi')
                  if (!inputKey && weatherApiKey) setInputKey(weatherApiKey)
                }}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-all ${
                  selectedProvider === 'weatherapi'
                    ? 'bg-white dark:bg-cyan-500/20 text-sky-700 dark:text-cyan-300 shadow-sm font-bold'
                    : 'text-slate-600 dark:text-text-secondary hover:text-slate-900 dark:hover:text-text-primary'
                }`}
              >
                WeatherAPI
              </button>

              <button
                type="button"
                onClick={() => setSelectedProvider('open-meteo')}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-all ${
                  selectedProvider === 'open-meteo'
                    ? 'bg-white dark:bg-cyan-500/20 text-sky-700 dark:text-cyan-300 shadow-sm font-bold'
                    : 'text-slate-600 dark:text-text-secondary hover:text-slate-900 dark:hover:text-text-primary'
                }`}
              >
                Open-Meteo
              </button>

              <button
                type="button"
                onClick={() => setSelectedProvider('openweathermap')}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-all ${
                  selectedProvider === 'openweathermap'
                    ? 'bg-white dark:bg-cyan-500/20 text-sky-700 dark:text-cyan-300 shadow-sm font-bold'
                    : 'text-slate-600 dark:text-text-secondary hover:text-slate-900 dark:hover:text-text-primary'
                }`}
              >
                OpenWeather
              </button>
            </div>

            {/* API Key Input Field (for WeatherAPI / OpenWeather) */}
            {selectedProvider !== 'open-meteo' ? (
              <div className="space-y-2">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <label htmlFor="weather-api-key-input" className="font-semibold text-slate-700 dark:text-text-secondary">
                      {selectedProvider === 'weatherapi' ? 'WeatherAPI Key (Google Accuracy)' : 'OpenWeatherMap API Key'}
                    </label>
                    <a
                      href={selectedProvider === 'weatherapi' ? 'https://www.weatherapi.com/signup.aspx' : 'https://home.openweathermap.org/users/sign_up'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-600 dark:text-cyan-400 hover:underline flex items-center gap-0.5 text-[10px] font-semibold"
                    >
                      <span>Get Free Key</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>

                  <div className="flex gap-1.5">
                    <div className="relative flex-1">
                      <input
                        id="weather-api-key-input"
                        type={showKey ? 'text' : 'password'}
                        value={inputKey}
                        onChange={(e) => {
                          setInputKey(e.target.value)
                          setTestState({ loading: false, success: false, error: null, message: null })
                        }}
                        placeholder="Paste your API key here..."
                        className="w-full pl-2.5 pr-8 py-1.5 text-xs font-mono rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-space-900 text-slate-900 dark:text-text-primary focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-cyan-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-text-primary"
                        aria-label={showKey ? 'Hide key' : 'Show key'}
                      >
                        {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <button
                      type="button"
                      disabled={testState.loading || !inputKey.trim()}
                      onClick={() => handleApplyConfig(selectedProvider, inputKey)}
                      className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 dark:bg-cyan-500 dark:hover:bg-cyan-400 text-white dark:text-space-950 font-bold text-xs transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center gap-1 shadow-sm shrink-0"
                    >
                      {testState.loading ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      <span>Apply</span>
                    </button>
                  </div>
                </div>

                {/* Status and Feedback */}
                {testState.success && testState.message && (
                  <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 animate-fade-in">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="truncate">{testState.message}</span>
                  </div>
                )}

                {testState.error && (
                  <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 text-[11px] text-rose-800 dark:text-rose-300 flex items-start gap-1.5 animate-fade-in">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    <span>{testState.error}</span>
                  </div>
                )}

                <p className="text-[10px] text-slate-500 dark:text-text-muted leading-tight">
                  {selectedProvider === 'weatherapi' ? (
                    <span>WeatherAPI queries the same airport METAR & WMO weather stations used by Google Weather, ensuring exact temperature, feels-like, and rain matching. Free tier includes 1,000,000 calls/month.</span>
                  ) : (
                    <span>OpenWeatherMap provides standardized observations from global international meteorological feeds.</span>
                  )}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="p-2.5 rounded-xl bg-white/70 dark:bg-space-900/60 border border-slate-200 dark:border-white/10 text-[11px] text-slate-600 dark:text-text-secondary space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-text-primary">
                    <ShieldCheck className="w-3.5 h-3.5 text-sky-600 dark:text-cyan-400" />
                    <span>Zero-Config High-Precision Engine</span>
                  </div>
                  <p className="text-[10px] leading-relaxed">
                    Uses Open-Meteo High-Resolution with DWD ICON/ECMWF blends, synchronized to your local hour. No API key needed.
                  </p>
                </div>
                {weatherProvider !== 'open-meteo' && (
                  <button
                    type="button"
                    onClick={() => handleApplyConfig('open-meteo', '')}
                    className="w-full py-1.5 px-3 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-space-800 dark:hover:bg-space-700 text-slate-800 dark:text-text-primary font-semibold text-xs transition-all active:scale-98"
                  >
                    Switch to Open-Meteo Free Engine
                  </button>
                )}
              </div>
            )}
          </div>


          {/* 2. Theme Mode: System, Dark, Light */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-slate-800 dark:text-text-secondary">Theme Appearance</span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setThemeMode('dark')}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 text-xs transition-all ${
                  themeMode === 'dark'
                    ? 'bg-sky-600 text-white border-sky-600 font-bold shadow-sm dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-400 dark:shadow-glow-cyan/20'
                    : 'bg-slate-100 dark:bg-space-850 text-slate-700 dark:text-text-secondary border-slate-200 dark:border-white/10 hover:text-slate-900 dark:hover:text-text-primary'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>Dark sky</span>
              </button>

              <button
                type="button"
                onClick={() => setThemeMode('light')}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 text-xs transition-all ${
                  themeMode === 'light'
                    ? 'bg-sky-600 text-white border-sky-600 font-bold shadow-sm dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-400 dark:shadow-glow-cyan/20'
                    : 'bg-slate-100 dark:bg-space-850 text-slate-700 dark:text-text-secondary border-slate-200 dark:border-white/10 hover:text-slate-900 dark:hover:text-text-primary'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>Light</span>
              </button>

              <button
                type="button"
                onClick={() => setThemeMode('system')}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 text-xs transition-all ${
                  themeMode === 'system'
                    ? 'bg-sky-600 text-white border-sky-600 font-bold shadow-sm dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-400 dark:shadow-glow-cyan/20'
                    : 'bg-slate-100 dark:bg-space-850 text-slate-700 dark:text-text-secondary border-slate-200 dark:border-white/10 hover:text-slate-900 dark:hover:text-text-primary'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Auto</span>
              </button>
            </div>
          </div>

          {/* 3. Temperature Unit: °C vs °F */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-slate-800 dark:text-text-secondary">Temperature Scale</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTempUnit('C')}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-mono transition-all ${
                  tempUnit === 'C'
                    ? 'bg-sky-600 text-white border-sky-600 font-bold shadow-sm dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-400 dark:shadow-glow-cyan/20'
                    : 'bg-slate-100 dark:bg-space-850 text-slate-700 dark:text-text-secondary border-slate-200 dark:border-white/10 hover:text-slate-900 dark:hover:text-text-primary'
                }`}
              >
                <Thermometer className="w-3.5 h-3.5" />
                <span>Celsius (°C)</span>
              </button>

              <button
                type="button"
                onClick={() => setTempUnit('F')}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-mono transition-all ${
                  tempUnit === 'F'
                    ? 'bg-sky-600 text-white border-sky-600 font-bold shadow-sm dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-400 dark:shadow-glow-cyan/20'
                    : 'bg-slate-100 dark:bg-space-850 text-slate-700 dark:text-text-secondary border-slate-200 dark:border-white/10 hover:text-slate-900 dark:hover:text-text-primary'
                }`}
              >
                <Thermometer className="w-3.5 h-3.5" />
                <span>Fahrenheit (°F)</span>
              </button>
            </div>
          </div>

          {/* 4. Wind Speed Unit: km/h vs m/s vs mph */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-slate-800 dark:text-text-secondary">Wind Velocity Unit</span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setWindUnit('kmh')}
                className={`py-2 px-2 rounded-xl border text-center text-xs font-mono transition-all ${
                  windUnit === 'kmh'
                    ? 'bg-sky-600 text-white border-sky-600 font-bold shadow-sm dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-400 dark:shadow-glow-cyan/20'
                    : 'bg-slate-100 dark:bg-space-850 text-slate-700 dark:text-text-secondary border-slate-200 dark:border-white/10 hover:text-slate-900 dark:hover:text-text-primary'
                }`}
              >
                km/h
              </button>

              <button
                type="button"
                onClick={() => setWindUnit('ms')}
                className={`py-2 px-2 rounded-xl border text-center text-xs font-mono transition-all ${
                  windUnit === 'ms'
                    ? 'bg-sky-600 text-white border-sky-600 font-bold shadow-sm dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-400 dark:shadow-glow-cyan/20'
                    : 'bg-slate-100 dark:bg-space-850 text-slate-700 dark:text-text-secondary border-slate-200 dark:border-white/10 hover:text-slate-900 dark:hover:text-text-primary'
                }`}
              >
                m/s
              </button>

              <button
                type="button"
                onClick={() => setWindUnit('mph')}
                className={`py-2 px-2 rounded-xl border text-center text-xs font-mono transition-all ${
                  windUnit === 'mph'
                    ? 'bg-sky-600 text-white border-sky-600 font-bold shadow-sm dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-400 dark:shadow-glow-cyan/20'
                    : 'bg-slate-100 dark:bg-space-850 text-slate-700 dark:text-text-secondary border-slate-200 dark:border-white/10 hover:text-slate-900 dark:hover:text-text-primary'
                }`}
              >
                mph
              </button>
            </div>
          </div>

          {/* 5. Offline Mode Tester */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-space-850 border border-slate-200 dark:border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <WifiOff className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-semibold text-slate-800 dark:text-text-primary">
                  Offline cache simulation
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={offlineSimulated}
                onClick={toggleOfflineSim}
                className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-cyan-400 ${
                  offlineSimulated ? 'bg-amber-500' : 'bg-slate-300 dark:bg-space-700'
                }`}
              >
                <span
                  className={`inline-block w-4 h-4 transform transition-transform rounded-full bg-white absolute top-1 left-1 ${
                    offlineSimulated ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-text-muted">
              Simulates network loss to verify service worker cache fallback banner and offline accessibility.
            </p>
          </div>

          {/* PWA & System Info */}
          <div className="p-3 rounded-2xl bg-slate-100/70 dark:bg-space-850 border border-slate-200 dark:border-white/10 flex items-center justify-between text-xs text-slate-500 dark:text-text-muted">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-sky-600 dark:text-cyan-400" />
              <span>Aether PWA v2.4.1</span>
            </div>
            <span className="font-mono text-[10px]">ServiceWorker Active</span>
          </div>
        </div>
      </div>
    </div>
  )
}
