import React from 'react'
import { useApp } from '../context/AppContext'
import {
  Sun,
  CalendarDays,
  LineChart,
  Map,
  Settings,
  Search,
  MapPin,
  Thermometer,
  Moon,
  Sparkles
} from 'lucide-react'

export default function DesktopTopNav({ onOpenStationPicker }) {
  const {
    activeTab,
    setActiveTab,
    currentStation,
    tempUnit,
    setTempUnit,
    themeMode,
    setThemeMode,
    setIsSettingsOpen
  } = useApp()

  const tabs = [
    { id: 'home', label: 'Home', icon: Sun },
    { id: 'forecast', label: 'Forecast', icon: CalendarDays },
    { id: 'history', label: 'History', icon: LineChart },
    { id: 'map', label: 'Map', icon: Map },
  ]

  const toggleTheme = () => {
    setThemeMode(prev => (prev === 'dark' ? 'light' : 'dark'))
  }

  return (
    <header className="w-full px-6 py-3 border-b border-slate-200 dark:border-white/10 bg-white/95 dark:bg-space-900/95 backdrop-blur-xl flex items-center justify-between gap-4 z-40 select-none shadow-sm transition-colors duration-300">
      {/* Brand with User's Company Logo */}
      <div className="flex items-center gap-4 min-w-0">
        <div className="flex items-center gap-3 shrink-0">
          <img
            src="/logo.png"
            alt="Company Logo"
            className="w-9 h-9 object-contain shrink-0 filter drop-shadow-sm hover:scale-105 transition-transform"
          />
          <div>
            <span className="font-display text-base font-bold text-slate-900 dark:text-white tracking-tight leading-none block">
              Aether
            </span>
            <span className="text-[10px] text-sky-600 dark:text-cyan-400 font-mono font-semibold block mt-0.5 leading-none">
              AI Meteorology
            </span>
          </div>
        </div>

        {/* Global Location Search & Selector */}
        <button
          onClick={onOpenStationPicker}
          aria-label={`Current location: ${currentStation.name}. Search any city, district, state or country.`}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-space-850 dark:hover:bg-space-800 border border-slate-200 dark:border-white/10 text-xs text-slate-800 dark:text-text-primary hover:border-sky-400 dark:hover:border-cyan-400/40 transition-all truncate shadow-sm"
        >
          <MapPin className="w-3.5 h-3.5 text-sky-600 dark:text-cyan-400 shrink-0" />
          <span className="font-semibold truncate">{currentStation.name}</span>
          <span className="text-slate-500 dark:text-text-muted text-[11px] truncate hidden md:inline">
            ({currentStation.subname || currentStation.country})
          </span>
          <Search className="w-3 h-3 text-slate-400 dark:text-text-muted ml-1 shrink-0" />
        </button>
      </div>

      {/* Center Nav Tabs with Crisp Light/Dark Contrast */}
      <nav aria-label="Desktop screen navigation" className="flex items-center gap-1 bg-slate-100 dark:bg-space-850 p-1 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
        {tabs.map(item => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-sky-600 text-white shadow-md dark:bg-cyan-400 dark:text-sky-950 dark:shadow-glow-cyan'
                  : 'text-slate-600 dark:text-text-secondary hover:text-slate-900 dark:hover:text-text-primary hover:bg-white dark:hover:bg-space-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Right Controls: Theme Switch + Unit + Settings */}
      <div className="flex items-center gap-2 shrink-0">

        {/* Quick Light/Dark Mode Switcher */}
        <button
          onClick={toggleTheme}
          title={`Switch to ${themeMode === 'dark' ? 'Light' : 'Dark'} mode`}
          aria-label="Toggle theme appearance"
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-space-850 dark:hover:bg-space-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-text-primary transition-colors shadow-sm"
        >
          {themeMode === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-sky-700" />
          )}
        </button>

        {/* Quick °C / °F toggle */}
        <button
          onClick={() => setTempUnit(prev => (prev === 'C' ? 'F' : 'C'))}
          aria-label="Toggle temperature unit"
          className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-space-850 dark:hover:bg-space-800 border border-slate-200 dark:border-white/10 text-xs font-mono font-bold text-sky-700 dark:text-cyan-400 transition-colors shadow-sm"
        >
          °{tempUnit}
        </button>

        {/* Settings Button */}
        <button
          onClick={() => setIsSettingsOpen(true)}
          aria-label="Preferences and settings"
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-space-850 dark:hover:bg-space-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-text-secondary hover:text-slate-900 dark:hover:text-cyan-400 transition-colors shadow-sm"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}
