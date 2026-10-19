import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  getCurrent,
  getForecast,
  getHistory,
  getModelMetrics,
  getStations,
  getForecastByLocation,
  searchPlaces,
  reverseGeocode,
  INITIAL_STATIONS
} from '../api/client'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  // Navigation active tab: 'home' | 'forecast' | 'history' | 'map'
  const [activeTab, setActiveTab] = useState('home')

  // Station and data state
  const [stations, setStations] = useState(INITIAL_STATIONS)
  const [currentLocation, setCurrentLocation] = useState(() => {
    const saved = localStorage.getItem('aether_saved_location')
    if (saved) {
      try { return JSON.parse(saved) } catch (_) {}
    }
    return INITIAL_STATIONS[0]
  })

  const [currentWeather, setCurrentWeather] = useState(null)
  const [forecast, setForecast] = useState(null)
  const [historyRange, setHistoryRange] = useState('24h')
  const [historyData, setHistoryData] = useState(null)
  const [modelMetrics, setModelMetrics] = useState(null)

  // Status indicators
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [offlineSimulated, setOfflineSimulated] = useState(false)
  const [lastRefreshedAt, setLastRefreshedAt] = useState(Date.now() - 12 * 60 * 1000)

  // Settings
  const [tempUnit, setTempUnit] = useState(() => localStorage.getItem('aether_temp_unit') || 'C')
  const [windUnit, setWindUnit] = useState(() => localStorage.getItem('aether_wind_unit') || 'kmh')
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem('aether_theme') || 'dark')
  const [weatherApiKey, setWeatherApiKey] = useState(() => localStorage.getItem('aether_weather_api_key') || '')
  const [weatherProvider, setWeatherProvider] = useState(() => localStorage.getItem('aether_weather_provider') || (localStorage.getItem('aether_weather_api_key') ? 'weatherapi' : 'open-meteo'))
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  // Sync theme to DOM
  useEffect(() => {
    localStorage.setItem('aether_theme', themeMode)
    const root = document.documentElement
    const isDark = themeMode === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : themeMode === 'dark'
    
    root.classList.toggle('dark', isDark)
    
    const metaTheme = document.querySelector('meta[name="theme-color"]')
    if (metaTheme) {
      metaTheme.setAttribute('content', isDark ? '#060B16' : '#F1F5F9')
    }
  }, [themeMode])

  // Monitor network online/offline
  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Persist unit settings
  useEffect(() => {
    localStorage.setItem('aether_temp_unit', tempUnit)
  }, [tempUnit])

  useEffect(() => {
    localStorage.setItem('aether_wind_unit', windUnit)
  }, [windUnit])

  // Load telemetry for active location
  const loadLocationData = useCallback(async (loc = currentLocation, isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }
      setErrorMessage(null)

      const [cur, fc, hist, metrics, stationList] = await Promise.all([
        getCurrent(loc.id, loc),
        getForecast(loc.id, loc),
        getHistory(loc.id, historyRange, loc),
        getModelMetrics(),
        getStations()
      ])

      setCurrentWeather(cur)
      setForecast(fc)
      setHistoryData(hist)
      setModelMetrics(metrics)
      setStations(stationList)
      setLastRefreshedAt(Date.now())
      localStorage.setItem('aether_saved_location', JSON.stringify(loc))
    } catch (err) {
      console.error('Failed to load meteorological data:', err)
      setErrorMessage({
        title: 'Connection Synchronization Interrupted',
        message: 'Could not fetch meteorological telemetry for this location. Check your internet connection or select a different place.',
        action: 'Retry'
      })
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [currentLocation, historyRange])

  // Load when location changes
  useEffect(() => {
    loadLocationData(currentLocation)
  }, [currentLocation, loadLocationData])

  // Switch to any place across the globe
  const selectPlace = useCallback((place) => {
    setCurrentLocation(place)
  }, [])

  // Switch by station ID
  const switchStation = useCallback((stationId) => {
    const found = stations.find(s => s.id === stationId) || INITIAL_STATIONS.find(s => s.id === stationId)
    if (found) {
      setCurrentLocation(found)
    }
  }, [stations])

  // Click on map to select arbitrary coordinate anywhere on Earth
  const selectCoordinate = useCallback(async (lat, lon) => {
    setIsRefreshing(true)
    try {
      const loc = await reverseGeocode(lat, lon)
      setCurrentLocation(loc)
    } catch (e) {
      console.error(e)
    } finally {
      setIsRefreshing(false)
    }
  }, [])

  // Browser Geolocation trigger
  const locateUser = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser')
      return
    }

    setIsRefreshing(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords
          const result = await getForecastByLocation(latitude, longitude)
          setCurrentLocation(result.station)
          setCurrentWeather(result.current)
          setForecast(result.forecast)
          setLastRefreshedAt(Date.now())
        } catch (e) {
          console.error(e)
        } finally {
          setIsRefreshing(false)
        }
      },
      (error) => {
        console.warn('Geolocation denied or timed out:', error)
        setIsRefreshing(false)
      },
      { timeout: 8000 }
    )
  }, [])

  // Conversion helpers
  const formatTemp = useCallback((celsius) => {
    if (celsius === undefined || celsius === null || isNaN(celsius)) return '--'
    if (tempUnit === 'F') {
      const f = Math.round((celsius * 9) / 5 + 32)
      return `${f}°`
    }
    return `${Math.round(celsius * 10) / 10}°`
  }, [tempUnit])

  const formatWind = useCallback((kmh) => {
    if (kmh === undefined || kmh === null || isNaN(kmh)) return '--'
    if (windUnit === 'ms') {
      const ms = Math.round((kmh / 3.6) * 10) / 10
      return `${ms} m/s`
    }
    if (windUnit === 'mph') {
      const mph = Math.round(kmh * 0.621371)
      return `${mph} mph`
    }
    return `${kmh} km/h`
  }, [windUnit])

  // Freshness calculation
  const getFreshnessLabel = useCallback(() => {
    const elapsedMinutes = Math.max(1, Math.floor((Date.now() - lastRefreshedAt) / 60000))
    if (elapsedMinutes === 1) return 'Updated just now'
    return `Updated ${elapsedMinutes}m ago`
  }, [lastRefreshedAt])

  // Update and persist weather API key & provider
  const updateWeatherConfig = useCallback(async (newProvider, newKey) => {
    const cleanKey = (newKey || '').trim()
    const prov = newProvider || (cleanKey ? 'weatherapi' : 'open-meteo')
    
    setWeatherApiKey(cleanKey)
    setWeatherProvider(prov)
    
    localStorage.setItem('aether_weather_api_key', cleanKey)
    localStorage.setItem('aether_weather_provider', prov)
    
    // Immediately reload telemetry with new provider
    await loadLocationData(currentLocation, true)
  }, [currentLocation, loadLocationData])

  const value = {
    activeTab,
    setActiveTab,
    stations,
    currentStationId: currentLocation.id,
    currentStation: currentLocation,
    selectPlace,
    switchStation,
    selectCoordinate,
    searchPlaces,
    currentWeather,
    forecast,
    historyData,
    historyRange,
    setHistoryRange,
    modelMetrics,
    isLoading,
    isRefreshing,
    errorMessage,
    refreshData: () => loadLocationData(currentLocation, true),
    locateUser,
    isOffline: isOffline || offlineSimulated,
    offlineSimulated,
    toggleOfflineSim: () => setOfflineSimulated(prev => !prev),
    getFreshnessLabel,
    lastRefreshedAt,
    tempUnit,
    setTempUnit,
    windUnit,
    setWindUnit,
    themeMode,
    setThemeMode,
    weatherApiKey,
    weatherProvider,
    updateWeatherConfig,
    isSettingsOpen,
    setIsSettingsOpen,
    formatTemp,
    formatWind
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
