import React, { useState } from 'react'
import { AppProvider, useApp } from './context/AppContext'
import HomeScreen from './components/HomeScreen'
import ForecastScreen from './components/ForecastScreen'
import HistoryScreen from './components/HistoryScreen'
import MapScreen from './components/MapScreen'
import BottomNav from './components/BottomNav'
import DesktopTopNav from './components/DesktopTopNav'
import StationPickerModal from './components/StationPickerModal'
import SettingsModal from './components/SettingsModal'
import OfflineBanner from './components/OfflineBanner'
import LoadingSkeleton from './components/LoadingSkeleton'
import ErrorState from './components/ErrorState'

function MainContent() {
  const {
    activeTab,
    isLoading,
    errorMessage,
    refreshData
  } = useApp()
  const [isStationPickerOpen, setIsStationPickerOpen] = useState(false)

  if (errorMessage) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-surface-base">
        <ErrorState error={errorMessage} onRetry={refreshData} />
      </main>
    )
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-surface-base">
        <LoadingSkeleton />
      </main>
    )
  }

  return (
    <div className="relative min-h-screen w-full bg-surface-base text-text-primary flex flex-col transition-colors duration-300">
      {/* Offline notification banner */}
      <OfflineBanner />

      {/* Desktop & Laptop Top Navigation Bar (Shown on screens >= 1024px) */}
      <div className="hidden lg:block sticky top-0 z-40">
        <DesktopTopNav
          onOpenStationPicker={() => setIsStationPickerOpen(true)}
        />
      </div>

      {/* Main Viewport Container: Fluid & Responsive across any Computer, Tablet or Phone */}
      <main className="flex-1 w-full animate-fade-in">
        {activeTab === 'home' && (
          <HomeScreen onOpenStationPicker={() => setIsStationPickerOpen(true)} />
        )}
        {activeTab === 'forecast' && <ForecastScreen />}
        {activeTab === 'history' && <HistoryScreen />}
        {activeTab === 'map' && <MapScreen />}
      </main>

      {/* Mobile & Small Tablet Bottom Navigation Bar (Shown on screens < 1024px) */}
      <div className="block lg:hidden">
        <BottomNav />
      </div>

      {/* Global Location Search & Settings Modals */}
      <StationPickerModal
        isOpen={isStationPickerOpen}
        onClose={() => setIsStationPickerOpen(false)}
      />
      <SettingsModal />
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  )
}
