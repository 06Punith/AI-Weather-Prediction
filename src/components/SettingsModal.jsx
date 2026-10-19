import React from 'react'
import { useApp } from '../context/AppContext'
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
  Smartphone
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
    isOffline,
    offlineSimulated,
    toggleOfflineSim
  } = useApp()

  if (!isSettingsOpen) return null

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
              Preferences & telemetry
            </h2>
            <p className="text-xs text-slate-500 dark:text-text-muted">
              Configure units and visual aesthetics
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
