import React from 'react'
import { useApp } from '../context/AppContext'
import { WifiOff, AlertTriangle } from 'lucide-react'

export default function OfflineBanner() {
  const { isOffline, lastRefreshedAt } = useApp()

  if (!isOffline) return null

  // Format cached time (e.g., 3:00 PM)
  const cachedTimeStr = new Date(lastRefreshedAt).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit'
  })

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-amber-500/20 border-b border-amber-500/40 text-amber-200 px-4 py-2 text-xs flex items-center justify-between sticky top-0 z-40 backdrop-blur-md animate-fade-in"
    >
      <div className="flex items-center gap-2 max-w-xl mx-auto w-full">
        <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span className="font-medium">
          Offline · showing data from {cachedTimeStr}
        </span>
      </div>
    </div>
  )
}
