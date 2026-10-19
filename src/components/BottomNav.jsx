import React from 'react'
import { useApp } from '../context/AppContext'
import {
  Sun,
  CalendarDays,
  LineChart,
  Map,
  Settings
} from 'lucide-react'

export default function BottomNav() {
  const { activeTab, setActiveTab, setIsSettingsOpen } = useApp()

  const navItems = [
    { id: 'home', label: 'Home', icon: Sun },
    { id: 'forecast', label: 'Forecast', icon: CalendarDays },
    { id: 'history', label: 'History', icon: LineChart },
    { id: 'map', label: 'Map', icon: Map },
  ]

  return (
    <nav
      aria-label="Primary mobile navigation"
      className="fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-space-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-white/10 safe-bottom select-none shadow-lg transition-colors duration-300"
    >
      <div className="max-w-xl mx-auto flex items-stretch justify-around px-2 py-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex-1 flex flex-col items-center justify-center min-h-[48px] py-1.5 px-1 rounded-2xl transition-all duration-200 relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:focus-visible:ring-cyan-400 active:scale-95 ${
                isActive
                  ? 'bg-sky-600 text-white font-bold shadow-md dark:bg-cyan-400 dark:text-sky-950 dark:font-extrabold dark:shadow-glow-cyan'
                  : 'text-slate-600 dark:text-text-secondary hover:text-slate-900 dark:hover:text-text-primary'
              }`}
            >
              {/* Top indicator bar on active item */}
              {isActive && (
                <span className="absolute -top-1 w-8 h-1 rounded-full bg-sky-700 dark:bg-cyan-400 shadow-sm dark:shadow-glow-cyan" />
              )}

              <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
              <span className="text-[11px] mt-0.5 tracking-tight font-medium">{item.label}</span>
            </button>
          )
        })}

        {/* Settings Trigger */}
        <button
          onClick={() => setIsSettingsOpen(true)}
          aria-label="Open settings and unit options"
          className="flex-none flex flex-col items-center justify-center min-h-[48px] px-3 rounded-2xl text-slate-500 dark:text-text-muted hover:text-slate-900 dark:hover:text-text-primary transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:focus-visible:ring-cyan-400"
        >
          <Settings className="w-5 h-5" />
          <span className="text-[11px] mt-0.5 tracking-tight font-medium">Units</span>
        </button>
      </div>
    </nav>
  )
}
