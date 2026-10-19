import React, { useState, useEffect, useRef } from 'react'
import { useApp } from '../context/AppContext'
import WeatherIcon from './WeatherIcon'
import {
  X,
  Search,
  Check,
  MapPin,
  Globe,
  Loader2,
  Navigation,
  Compass,
  Sparkles
} from 'lucide-react'

export default function StationPickerModal({ isOpen, onClose }) {
  const {
    currentStation,
    selectPlace,
    searchPlaces,
    stations,
    locateUser,
    formatTemp
  } = useApp()

  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [activeFilter, setActiveFilter] = useState('all')
  const searchTimeout = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150)
      setQuery('')
      setResults(stations)
    }
  }, [isOpen, stations])

  // Live debounced search across all world places, states, districts, countries
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults(stations)
      setIsSearching(false)
      return
    }

    if (searchTimeout.current) clearTimeout(searchTimeout.current)

    setIsSearching(true)
    searchTimeout.current = setTimeout(async () => {
      try {
        const found = await searchPlaces(query.trim())
        setResults(found)
      } catch (e) {
        console.error('Search error:', e)
      } finally {
        setIsSearching(false)
      }
    }, 280)

    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current)
    }
  }, [query, searchPlaces, stations])

  if (!isOpen) return null

  const handleSelect = (place) => {
    selectPlace(place)
    onClose()
  }

  // Quick continental presets
  const presets = [
    { label: 'Featured', query: '' },
    { label: 'India', query: 'India' },
    { label: 'United States', query: 'United States' },
    { label: 'Europe', query: 'London' },
    { label: 'Japan', query: 'Tokyo' },
    { label: 'Australia', query: 'Sydney' },
  ]

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Global Place and Station Search"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in"
    >
      <div className="w-full max-w-lg bg-white dark:bg-space-900 border border-slate-200 dark:border-white/10 rounded-t-3xl sm:rounded-3xl shadow-elevated overflow-hidden max-h-[88vh] flex flex-col animate-slide-up">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-white dark:bg-space-900">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-100 dark:bg-cyan-500/10 text-sky-600 dark:text-cyan-400">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-text-primary">
                Global place search
              </h2>
              <p className="text-xs text-slate-600 dark:text-text-muted">
                Search any city, district, state, or country on Earth
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close search"
            className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 dark:text-text-muted dark:hover:text-text-primary hover:bg-slate-100 dark:hover:bg-space-850 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input Bar */}
        <div className="p-3.5 border-b border-slate-200 dark:border-white/10 space-y-2.5 bg-slate-50/50 dark:bg-space-900">
          <div className="relative">
            <Search className="w-4 h-4 text-sky-600 dark:text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              placeholder="e.g. Mumbai, California, Thane, London, Texas, Kyoto..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-white dark:bg-space-850 border border-slate-300 dark:border-white/10 text-sm text-slate-900 dark:text-text-primary placeholder:text-slate-500 dark:placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-cyan-400 shadow-inner"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-900 dark:text-text-muted dark:hover:text-text-primary"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            {isSearching && (
              <Loader2 className="w-4 h-4 text-sky-600 dark:text-cyan-400 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
            )}
          </div>

          {/* Quick preset chips */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <button
              onClick={() => {
                locateUser()
                onClose()
              }}
              className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-100 hover:bg-sky-200/80 border border-sky-300 text-sky-800 text-xs font-bold transition-colors dark:bg-cyan-500/15 dark:border-cyan-400/30 dark:text-cyan-300"
            >
              <Navigation className="w-3 h-3" />
              <span>Current GPS location</span>
            </button>

            {presets.map((p, idx) => (
              <button
                key={idx}
                onClick={() => setQuery(p.query)}
                className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-medium text-slate-700 hover:text-slate-900 transition-colors dark:bg-space-850 dark:border-white/10 dark:text-text-secondary dark:hover:bg-space-800"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-3.5 space-y-2 flex-1 divide-y divide-slate-100 dark:divide-white/10">
          {results.length === 0 && !isSearching && (
            <div className="py-12 text-center space-y-2">
              <MapPin className="w-8 h-8 mx-auto text-text-muted opacity-50" />
              <p className="text-sm font-medium text-text-secondary">
                No matching locations found
              </p>
              <p className="text-xs text-text-muted max-w-xs mx-auto">
                Check spelling or search by district, state, or country name.
              </p>
            </div>
          )}

          {results.map((loc) => {
            const isCurrent = loc.id === currentStation.id || loc.name === currentStation.name
            return (
              <button
                key={loc.id || `${loc.lat}-${loc.lon}`}
                type="button"
                onClick={() => handleSelect(loc)}
                className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all ${
                  isCurrent
                    ? 'bg-sky-50 border-2 border-sky-600 shadow-md ring-1 ring-sky-500/20 dark:bg-cyan-500/15 dark:border-cyan-400 dark:shadow-glow-cyan/20'
                    : 'bg-white dark:bg-space-850 hover:bg-slate-50 dark:hover:bg-space-800 border-slate-200 dark:border-white/10'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`p-2 rounded-xl shrink-0 ${
                      isCurrent
                        ? 'bg-sky-600 text-white font-bold dark:bg-cyan-400 dark:text-sky-950'
                        : 'bg-slate-100 dark:bg-space-900 text-sky-600 dark:text-cyan-400'
                    }`}
                  >
                    <MapPin className="w-4 h-4" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-text-primary truncate">
                        {loc.name}
                      </span>
                      {loc.countryCode && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-space-900 border border-slate-200 dark:border-white/10 font-mono text-sky-700 dark:text-cyan-300 font-bold">
                          {loc.countryCode}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 dark:text-text-secondary truncate mt-0.5">
                      {loc.subname || `${loc.admin1 || ''}, ${loc.country || ''}`.trim()}
                    </p>

                    <span className="text-[10px] text-slate-500 dark:text-text-muted font-mono block mt-0.5">
                      {loc.lat?.toFixed(2)}° N, {loc.lon?.toFixed(2)}° E {loc.elevation ? `· ${loc.elevation}m alt` : ''}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  {loc.currentTemp !== undefined && (
                    <span className="font-display text-base font-bold text-slate-900 dark:text-text-primary tabular-nums">
                      {formatTemp(loc.currentTemp)}
                    </span>
                  )}

                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                      isCurrent
                        ? 'bg-sky-600 border-sky-600 text-white dark:bg-cyan-400 dark:border-cyan-400 dark:text-sky-950 font-bold'
                        : 'border-slate-300 dark:border-surface-border text-transparent'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
