import React, { useEffect, useRef, useState, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useApp } from '../context/AppContext'
import WeatherIcon from './WeatherIcon'
import {
  reverseGeocode,
  getCurrent,
  getForecast
} from '../api/client'
import {
  MapPin,
  Check,
  ArrowRight,
  Navigation2,
  Search,
  X,
  Radio,
  Loader2,
  Globe,
  Plus,
  Minus,
  Droplets,
  Wind,
  Gauge,
  Compass,
  Sparkles
} from 'lucide-react'

export default function MapScreen() {
  const {
    stations,
    currentStation,
    selectPlace,
    searchPlaces,
    formatTemp,
    formatWind,
    themeMode,
    setActiveTab
  } = useApp()

  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const dynamicMarkerRef = useRef(null)
  const searchContainerRef = useRef(null)
  const zoomControlsRef = useRef(null)

  const [inspectedData, setInspectedData] = useState(null)
  const [isInspecting, setIsInspecting] = useState(false)
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false)
  const [mapSearchQuery, setMapSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const searchTimeout = useRef(null)

  // Prevent Leaflet map clicks/scrolls from leaking through overlay containers
  useEffect(() => {
    if (searchContainerRef.current) {
      L.DomEvent.disableClickPropagation(searchContainerRef.current)
      L.DomEvent.disableScrollPropagation(searchContainerRef.current)
    }
    if (zoomControlsRef.current) {
      L.DomEvent.disableClickPropagation(zoomControlsRef.current)
      L.DomEvent.disableScrollPropagation(zoomControlsRef.current)
    }
  }, [])

  // Update or place dynamic animated marker at coordinates
  const updateMarkerAtCoord = useCallback((map, lat, lon, title, tempStr = '', loading = false) => {
    if (!map) return

    if (dynamicMarkerRef.current) {
      dynamicMarkerRef.current.remove()
    }

    const dynamicIcon = L.divIcon({
      className: 'dynamic-loc-pin',
      html: `
        <div class="relative flex items-center justify-center cursor-pointer group">
          <span class="absolute -top-1 -right-1 flex h-4 w-4">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-4 w-4 bg-cyan-500 shadow-lg"></span>
          </span>
          <div class="px-3 py-1.5 rounded-full shadow-2xl border text-xs font-mono font-bold flex items-center gap-1.5 whitespace-nowrap bg-slate-900 text-white border-cyan-400 shadow-cyan-500/30">
            <span class="font-sans font-bold text-white">${title}</span>
            ${tempStr ? `<span class="text-cyan-400 tabular-nums">${tempStr}</span>` : ''}
            ${loading ? `<span class="inline-block w-2.5 h-2.5 rounded-full bg-cyan-400 animate-spin border border-white"></span>` : ''}
          </div>
        </div>
      `,
      iconSize: [140, 36],
      iconAnchor: [70, 18]
    })

    dynamicMarkerRef.current = L.marker([lat, lon], { icon: dynamicIcon }).addTo(map)
  }, [])

  // Core atmospheric inspection workflow
  const inspectAtmosphereAtCoord = useCallback(async (lat, lon, presetLocation = null) => {
    setIsInspecting(true)
    setIsBottomSheetOpen(true)

    // Immediate placeholder while telemetry resolves
    const initialName = presetLocation?.name || `Location (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`
    if (mapInstanceRef.current) {
      updateMarkerAtCoord(mapInstanceRef.current, lat, lon, initialName, '', true)
    }

    setInspectedData({
      location: presetLocation || {
        id: `coord-${Math.round(lat * 100)}-${Math.round(lon * 100)}`,
        name: initialName,
        subname: presetLocation?.subname || `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`,
        lat,
        lon
      },
      current: null,
      forecast: null
    })

    try {
      // 1. Resolve location name if not already provided
      const loc = presetLocation || await reverseGeocode(lat, lon)

      // 2. Concurrently fetch real meteorological telemetry and forecast
      const [cur, fc] = await Promise.all([
        getCurrent(loc.id, loc),
        getForecast(loc.id, loc)
      ])

      setInspectedData({
        location: loc,
        current: cur,
        forecast: fc
      })

      // Update marker with actual resolved name and real temperature
      if (mapInstanceRef.current) {
        const tempLabel = cur?.temperature !== undefined ? formatTemp(cur.temperature) : ''
        updateMarkerAtCoord(mapInstanceRef.current, lat, lon, loc.name, tempLabel, false)
      }
    } catch (err) {
      console.warn('Atmospheric telemetry inspection error:', err)
    } finally {
      setIsInspecting(false)
    }
  }, [formatTemp, updateMarkerAtCoord])

  // Initialize polished Leaflet Map with smooth physics
  useEffect(() => {
    if (!mapContainerRef.current) return

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove()
    }

    const initialLat = currentStation.lat || 20
    const initialLon = currentStation.lon || 0

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLon],
      zoom: 4,
      minZoom: 2.2,
      maxZoom: 18,
      zoomControl: false, // Replaced with custom glassmorphic control stack
      zoomAnimation: true,
      fadeAnimation: true,
      markerZoomAnimation: true,
      wheelDebounceTime: 40,
      wheelPxPerZoomLevel: 100,
      worldCopyJump: true,
      maxBounds: [[-85, -180], [85, 180]],
      maxBoundsViscosity: 0.85,
      attributionControl: true
    })

    // Official OpenStreetMap worldwide tile servers (clean, zero watermarks, 100% free)
    const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
    L.tileLayer(tileUrl, {
      maxZoom: 19,
      subdomains: ['a', 'b', 'c'],
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map)

    mapInstanceRef.current = map

    // "Tap anywhere on the globe to inspect forecast"
    map.on('click', (e) => {
      const { lat, lng } = e.latlng
      // Wrap coordinates within [-180, 180] range
      const normalizedLon = ((lng + 180) % 360 + 360) % 360 - 180
      const clampedLat = Math.max(-85, Math.min(85, lat))
      inspectAtmosphereAtCoord(clampedLat, normalizedLon)
    })

    // Add flagship monitored stations on the map
    stations.forEach(st => {
      const isCurrent = st.id === currentStation.id
      const customIcon = L.divIcon({
        className: 'custom-station-pin',
        html: `
          <div class="relative flex items-center justify-center cursor-pointer group">
            <span class="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full ${isCurrent ? 'bg-sky-500 dark:bg-cyan-400' : 'bg-amber-500'} opacity-75"></span>
              <span class="relative inline-flex rounded-full h-3.5 w-3.5 ${isCurrent ? 'bg-sky-600 dark:bg-cyan-400' : 'bg-amber-500'}"></span>
            </span>
            <div class="px-2.5 py-1 rounded-full shadow-lg border text-xs font-mono font-bold flex items-center gap-1.5 whitespace-nowrap transition-transform duration-200 group-hover:scale-110 ${
              isCurrent
                ? 'bg-sky-700 text-white border-sky-400 shadow-sky-500/30 dark:bg-sky-navy dark:text-cyan-300 dark:border-cyan-400'
                : 'bg-white text-slate-800 border-slate-200 dark:bg-space-850 dark:text-text-primary dark:border-white/10'
            }">
              <span class="font-sans font-bold">${st.name}</span>
              <span class="text-amber-500 dark:text-amber-400 tabular-nums">${st.currentTemp ?? Math.round(st.baseTemp ?? 20)}°</span>
            </div>
          </div>
        `,
        iconSize: [110, 36],
        iconAnchor: [55, 18]
      })

      const marker = L.marker([st.lat, st.lon], { icon: customIcon }).addTo(map)
      marker.on('click', (ev) => {
        L.DomEvent.stopPropagation(ev)
        inspectAtmosphereAtCoord(st.lat, st.lon, st)
        map.flyTo([st.lat, st.lon], 6, { duration: 1.2 })
      })
    })

    // Inspect current active location initially
    inspectAtmosphereAtCoord(currentStation.lat, currentStation.lon, currentStation)

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [stations, themeMode])

  // Handle Global Search Input with Debounce
  useEffect(() => {
    if (!mapSearchQuery || mapSearchQuery.trim().length < 2) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    setIsSearching(true)

    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await searchPlaces(mapSearchQuery.trim())
        setSearchResults(res || [])
      } catch (e) {
        console.error(e)
      } finally {
        setIsSearching(false)
      }
    }, 240)

    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current)
    }
  }, [mapSearchQuery, searchPlaces])

  // Handle Search Result Selection
  const handleSelectSearchResult = (loc) => {
    setMapSearchQuery('')
    setSearchResults([])
    setIsSearching(false)

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([loc.lat, loc.lon], 7, { duration: 1.2 })
    }
    inspectAtmosphereAtCoord(loc.lat, loc.lon, loc)
  }

  // Zoom control handlers
  const handleZoomIn = (e) => {
    e.stopPropagation()
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn(1, { animate: true })
    }
  }

  const handleZoomOut = (e) => {
    e.stopPropagation()
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut(1, { animate: true })
    }
  }

  const handleResetWorldView = (e) => {
    e.stopPropagation()
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([20, 0], 2.5, { duration: 1.2 })
    }
  }

  const handleRecenterActive = (e) => {
    e.stopPropagation()
    if (mapInstanceRef.current && currentStation?.lat && currentStation?.lon) {
      mapInstanceRef.current.flyTo([currentStation.lat, currentStation.lon], 6, { duration: 1.2 })
      inspectAtmosphereAtCoord(currentStation.lat, currentStation.lon, currentStation)
    }
  }

  // Activate location and switch to Forecast screen
  const handleActivateAndForecast = () => {
    if (inspectedData?.location) {
      selectPlace(inspectedData.location)
      setActiveTab('forecast')
    }
  }

  const activeLoc = inspectedData?.location
  const current = inspectedData?.current
  const hourly = inspectedData?.forecast?.hourly || []
  const isCurrentActive = activeLoc && (activeLoc.id === currentStation.id || activeLoc.name === currentStation.name)

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] max-w-7xl mx-auto overflow-hidden bg-slate-100 dark:bg-space-950">
      {/* Leaflet Map Canvas */}
      <div
        ref={mapContainerRef}
        className="w-full h-full z-0 focus:outline-none"
        aria-label="Interactive Global Weather Radar Network Map"
      />

      {/* Floating Worldwide Place Search Bar */}
      <div
        ref={searchContainerRef}
        className="absolute top-3 inset-x-3 sm:inset-x-6 max-w-md mx-auto z-10 space-y-1.5"
      >
        <div className="relative shadow-xl rounded-2xl bg-white/95 dark:bg-space-900/95 backdrop-blur-xl border border-slate-200 dark:border-white/10 transition-all focus-within:ring-2 focus-within:ring-sky-500 dark:focus-within:ring-cyan-400">
          <Search className="w-4 h-4 text-sky-600 dark:text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search any city, district, state, country..."
            value={mapSearchQuery}
            onChange={(e) => setMapSearchQuery(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
            className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-transparent text-xs text-slate-900 dark:text-text-primary placeholder:text-slate-400 dark:placeholder:text-text-muted focus:outline-none font-medium"
          />
          {mapSearchQuery && (
            <button
              onClick={() => {
                setMapSearchQuery('')
                setSearchResults([])
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 dark:text-text-muted dark:hover:text-text-primary"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          {isSearching && (
            <Loader2 className="w-4 h-4 text-sky-600 dark:text-cyan-400 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
          )}
        </div>

        {/* Real-time Global Search Autocomplete Dropdown */}
        {searchResults.length > 0 && (
          <div className="rounded-2xl bg-white/98 dark:bg-space-900/98 backdrop-blur-2xl border border-slate-200 dark:border-white/10 shadow-2xl max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-white/10 p-1.5 animate-slide-up">
            {searchResults.map((loc) => (
              <button
                key={loc.id || `${loc.lat}-${loc.lon}`}
                type="button"
                onClick={() => handleSelectSearchResult(loc)}
                className="w-full p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-space-850 text-left flex items-center justify-between text-xs transition-colors group"
              >
                <div className="min-w-0 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-sky-600 dark:text-cyan-400 shrink-0 group-hover:scale-110 transition-transform" />
                  <div className="truncate">
                    <span className="font-bold text-slate-900 dark:text-text-primary block truncate">
                      {loc.name}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-text-muted truncate block">
                      {loc.subname || `${loc.admin1 || ''}, ${loc.country || ''}`}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-sky-700 dark:text-cyan-400 font-mono font-semibold shrink-0 ml-2">
                  {loc.lat?.toFixed(1)}°, {loc.lon?.toFixed(1)}°
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Global Tap Hint Pill */}
        <div className="flex justify-center pointer-events-none">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 dark:bg-space-900/90 backdrop-blur-md border border-slate-200 dark:border-white/10 text-[11px] text-slate-700 dark:text-slate-300 shadow-sm">
            <Globe className="w-3.5 h-3.5 text-sky-600 dark:text-cyan-400 animate-spin-slow" />
            <span>Tap anywhere on the globe to inspect real forecast</span>
          </div>
        </div>
      </div>

      {/* Polished Floating Map Zoom & Navigation Controls */}
      <div
        ref={zoomControlsRef}
        className="absolute right-4 top-20 z-10 flex flex-col gap-2"
        role="toolbar"
        aria-label="Map Navigation and Zoom Controls"
      >
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          aria-label="Zoom in"
          className="p-2.5 rounded-xl bg-white/95 dark:bg-space-900/95 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-text-primary backdrop-blur-xl shadow-lg hover:bg-slate-50 dark:hover:bg-space-850 hover:text-sky-600 dark:hover:text-cyan-400 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
        </button>

        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          aria-label="Zoom out"
          className="p-2.5 rounded-xl bg-white/95 dark:bg-space-900/95 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-text-primary backdrop-blur-xl shadow-lg hover:bg-slate-50 dark:hover:bg-space-850 hover:text-sky-600 dark:hover:text-cyan-400 active:scale-95 transition-all"
        >
          <Minus className="w-4 h-4" />
        </button>

        <button
          onClick={handleResetWorldView}
          title="View Entire Globe"
          aria-label="Reset to full world view"
          className="p-2.5 rounded-xl bg-white/95 dark:bg-space-900/95 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-text-primary backdrop-blur-xl shadow-lg hover:bg-slate-50 dark:hover:bg-space-850 hover:text-sky-600 dark:hover:text-cyan-400 active:scale-95 transition-all"
        >
          <Globe className="w-4 h-4" />
        </button>

        <button
          onClick={handleRecenterActive}
          title={`Recenter on ${currentStation.name}`}
          aria-label="Recenter on active location"
          className="p-2.5 rounded-xl bg-white/95 dark:bg-space-900/95 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-text-primary backdrop-blur-xl shadow-lg hover:bg-slate-50 dark:hover:bg-space-850 hover:text-sky-600 dark:hover:text-cyan-400 active:scale-95 transition-all"
        >
          <Navigation2 className="w-4 h-4" />
        </button>
      </div>

      {/* Slide-Up Bottom Sheet: "Tap anywhere on the globe to inspect forecast" */}
      {isBottomSheetOpen && activeLoc && (
        <aside
          role="dialog"
          aria-label={`Atmospheric inspection for ${activeLoc.name}`}
          className="absolute inset-x-3 bottom-16 sm:bottom-4 max-w-xl mx-auto z-20 rounded-3xl bg-white/95 dark:bg-space-900/95 backdrop-blur-2xl border border-slate-200 dark:border-white/10 p-4 shadow-2xl animate-slide-up space-y-3.5 max-h-[75vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-sky-100 dark:bg-cyan-500/10 text-sky-600 dark:text-cyan-400">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900 dark:text-text-primary truncate">
                    {activeLoc.name}
                  </h2>
                  {isCurrentActive && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-400/30 font-bold">
                      Active Station
                    </span>
                  )}
                  {isInspecting && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-100 dark:bg-cyan-500/20 text-sky-800 dark:text-cyan-300 border border-sky-300 dark:border-cyan-400/30 font-bold flex items-center gap-1">
                      <Loader2 className="w-2.5 h-2.5 animate-spin" />
                      Scanning
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-text-secondary truncate">
                  {activeLoc.subname || `${activeLoc.admin1 || ''}, ${activeLoc.country || ''}`}
                  {activeLoc.lat && activeLoc.lon ? ` · ${activeLoc.lat.toFixed(2)}°, ${activeLoc.lon.toFixed(2)}°` : ''}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsBottomSheetOpen(false)}
              aria-label="Dismiss inspection sheet"
              className="p-1.5 text-slate-400 dark:text-text-muted hover:text-slate-800 dark:hover:text-text-primary rounded-xl transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Current Meteorological Conditions Card */}
          {current ? (
            <div className="grid grid-cols-12 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-space-850 border border-slate-200 dark:border-white/10 items-center shadow-sm">
              <div className="col-span-7 space-y-0.5">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-display text-4xl font-light text-slate-900 dark:text-white tabular-nums">
                    {formatTemp(current.temperature)}
                  </span>
                  <span className="text-xs text-slate-600 dark:text-text-secondary font-medium">
                    {current.conditionLabel || 'Partly Cloudy'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-text-muted">
                  Feels like {formatTemp(current.feelsLike)} · UV {current.uvIndex ?? 3}
                </p>
              </div>

              <div className="col-span-5 flex items-center justify-end gap-2 text-right">
                <WeatherIcon condition={current.condition || 'clear'} size={32} className="text-slate-800 dark:text-white" />
                <div className="text-[11px] font-mono text-sky-600 dark:text-cyan-400 font-bold">
                  <span>{Math.round((current.rainProbability || 0) * 100)}%</span>
                  <span className="text-[10px] text-slate-500 dark:text-text-muted block font-normal">rain prob</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-space-850 border border-slate-200 dark:border-white/10 flex items-center justify-center gap-3 text-xs text-slate-600 dark:text-text-secondary">
              <Loader2 className="w-4 h-4 animate-spin text-sky-600 dark:text-cyan-400" />
              <span>Fetching real-time atmospheric columns...</span>
            </div>
          )}

          {/* Environmental Vitals Row */}
          {current && (
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-space-850 border border-slate-200 dark:border-white/10">
                <div className="flex items-center justify-center gap-1 text-slate-500 dark:text-text-muted text-[10px]">
                  <Wind className="w-3 h-3 text-sky-500" />
                  <span>Wind</span>
                </div>
                <span className="font-mono font-bold text-slate-800 dark:text-text-primary text-xs">
                  {formatWind(current.windSpeed)}
                </span>
              </div>

              <div className="p-2 rounded-xl bg-slate-50 dark:bg-space-850 border border-slate-200 dark:border-white/10">
                <div className="flex items-center justify-center gap-1 text-slate-500 dark:text-text-muted text-[10px]">
                  <Droplets className="w-3 h-3 text-blue-500" />
                  <span>Humidity</span>
                </div>
                <span className="font-mono font-bold text-slate-800 dark:text-text-primary text-xs">
                  {current.humidity}%
                </span>
              </div>

              <div className="p-2 rounded-xl bg-slate-50 dark:bg-space-850 border border-slate-200 dark:border-white/10">
                <div className="flex items-center justify-center gap-1 text-slate-500 dark:text-text-muted text-[10px]">
                  <Gauge className="w-3 h-3 text-emerald-500" />
                  <span>Pressure</span>
                </div>
                <span className="font-mono font-bold text-slate-800 dark:text-text-primary text-xs">
                  {current.pressure} hPa
                </span>
              </div>
            </div>
          )}

          {/* 24-Hour Hourly Forecast Preview Strip */}
          {hourly.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-text-secondary px-1">
                <span>24-Hour AI Prediction Sequence</span>
                <span className="text-[10px] text-sky-600 dark:text-cyan-400 font-mono">XGBoost · LSTM</span>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {hourly.slice(0, 16).map((h, i) => (
                  <div
                    key={h.targetTime || i}
                    className="min-w-[4.2rem] p-2 rounded-xl bg-slate-50 dark:bg-space-850 border border-slate-200 dark:border-white/10 flex flex-col items-center justify-between text-center shrink-0 space-y-1"
                  >
                    <span className="text-[10px] font-medium text-slate-500 dark:text-text-muted">
                      {h.hourLabel}
                    </span>
                    <WeatherIcon condition={h.condition || 'clear'} size={20} className="text-slate-800 dark:text-white" />
                    <span className="font-mono font-bold text-xs text-slate-900 dark:text-text-primary">
                      {formatTemp(h.predTemp)}
                    </span>
                    <span className="text-[9px] font-mono text-sky-600 dark:text-cyan-400 font-semibold">
                      {Math.round((h.predRainProb || 0) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Main Action Button */}
          <button
            onClick={handleActivateAndForecast}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 text-white dark:bg-cyan-400 dark:hover:bg-cyan-300 dark:text-sky-950 shadow-md dark:shadow-glow-cyan active:scale-[0.98] transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Select & Inspect Full 7-Day Forecast</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </aside>
      )}
    </div>
  )
}
