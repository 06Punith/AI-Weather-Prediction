import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import WeatherIcon from './WeatherIcon'
import { ChevronDown, Droplets, Wind, ShieldCheck, Sparkles } from 'lucide-react'

export default function ForecastScreen() {
  const { forecast, currentStation, formatTemp, formatWind } = useApp()
  const [expandedDayIndex, setExpandedDayIndex] = useState(0)

  const daily = forecast?.daily || []

  let globalMin = Infinity
  let globalMax = -Infinity
  daily.forEach(d => {
    if (d.tempMin < globalMin) globalMin = d.tempMin
    if (d.tempMax > globalMax) globalMax = d.tempMax
  })
  if (!isFinite(globalMin)) globalMin = 10
  if (!isFinite(globalMax)) globalMax = 25
  const totalSpan = Math.max(1, globalMax - globalMin)

  const toggleDay = (idx) => {
    setExpandedDayIndex(prev => (prev === idx ? -1 : idx))
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-5 pb-24 space-y-4">
      {/* Screen Header */}
      <header className="flex items-center justify-between px-1">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-text-primary tracking-tight">
            7-day outlook
          </h1>
          <p className="text-xs text-slate-500 dark:text-text-secondary">
            {currentStation.name} · Multi-model ensemble calibrated forecast
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-space-850 border border-slate-200 dark:border-white/10 text-xs text-slate-700 dark:text-text-secondary shadow-sm">
          <ShieldCheck className="w-3.5 h-3.5 text-sky-600 dark:text-cyan-400" />
          <span className="font-mono text-[11px] text-sky-700 dark:text-cyan-300 font-semibold">Calibrated confidence</span>
        </div>
      </header>

      {/* 7-day outlook list */}
      <div className="space-y-2.5 max-w-3xl mx-auto lg:max-w-none" role="list" aria-label="7-day weather outlook list">
        {daily.map((day, idx) => {
          const isExpanded = expandedDayIndex === idx
          const rainPct = Math.round((day.rainProb || 0) * 100)

          const leftPct = Math.max(0, Math.min(100, ((day.tempMin - globalMin) / totalSpan) * 100))
          const rightPct = Math.max(0, Math.min(100, ((day.tempMax - globalMin) / totalSpan) * 100))
          const widthPct = Math.max(6, rightPct - leftPct)

          return (
            <div
              key={day.date || idx}
              className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                isExpanded
                  ? 'bg-sky-50/80 border-2 border-sky-600 shadow-lg ring-1 ring-sky-500/30 dark:bg-space-850 dark:border-cyan-400/60 dark:shadow-glow-cyan/20'
                  : 'bg-white hover:bg-slate-50 dark:bg-space-850 dark:hover:bg-space-800 border-slate-200 dark:border-white/10 shadow-sm'
              }`}
            >
              {/* Main Day Row Button */}
              <button
                type="button"
                onClick={() => toggleDay(idx)}
                aria-expanded={isExpanded}
                aria-controls={`day-detail-${idx}`}
                className="w-full text-left p-3.5 flex items-center justify-between gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:focus-visible:ring-cyan-400 rounded-2xl"
              >
                {/* Day name & icon */}
                <div className="flex items-center gap-3 w-32 shrink-0">
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-space-900 border border-slate-200 dark:border-white/10 shrink-0">
                    <WeatherIcon
                      condition={day.condition}
                      size={20}
                      className="text-slate-800 dark:text-white"
                      ariaLabel={day.conditionLabel}
                    />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-text-primary leading-tight">
                      {day.dayName}
                    </h2>
                    <span className="text-[11px] text-slate-500 dark:text-text-muted">{day.fullDateLabel}</span>
                  </div>
                </div>

                {/* Rain probability bar */}
                <div className="w-16 shrink-0 flex flex-col items-center">
                  <div className="flex items-center gap-1 text-[11px] font-mono text-sky-600 dark:text-cyan-400 mb-1 font-bold">
                    <Droplets className="w-3 h-3 text-sky-600 dark:text-cyan-400 shrink-0" />
                    <span className="tabular-nums">{rainPct}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-space-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sky-500 dark:bg-cyan-400 rounded-full transition-all duration-500"
                      style={{ width: `${rainPct}%` }}
                    />
                  </div>
                </div>

                {/* High/Low Temperature Range Bar */}
                <div className="flex-1 flex items-center gap-2 min-w-0">
                  <span className="font-display text-sm text-slate-500 dark:text-text-secondary tabular-nums text-right w-8 shrink-0 font-normal">
                    {formatTemp(day.tempMin)}
                  </span>

                  <div className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-space-900 relative overflow-hidden">
                    <div
                      className="absolute top-0 bottom-0 rounded-full transition-all duration-500"
                      style={{
                        left: `${leftPct}%`,
                        width: `${widthPct}%`,
                        background: 'linear-gradient(90deg, #0284C7 0%, #D97706 100%)'
                      }}
                    />
                  </div>

                  <span className="font-display text-sm font-semibold text-slate-900 dark:text-white tabular-nums text-left w-8 shrink-0">
                    {formatTemp(day.tempMax)}
                  </span>
                </div>

                {/* Expand Indicator Chevron */}
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 dark:text-text-muted transition-transform duration-300 shrink-0 ${
                    isExpanded ? 'rotate-180 text-sky-600 dark:text-cyan-400' : ''
                  }`}
                />
              </button>

              {/* Inline Expansion Area */}
              {isExpanded && (
                <div
                  id={`day-detail-${idx}`}
                  className="px-4 pb-4 pt-1 border-t border-slate-100 dark:border-white/10 space-y-3 animate-fade-in"
                >
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white dark:bg-space-900 border border-slate-200 dark:border-white/10 shadow-sm">
                    <Sparkles className="w-4 h-4 text-sky-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-800 dark:text-text-primary leading-relaxed font-normal">
                        {day.summary}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-600 dark:text-text-secondary">
                        <span className="flex items-center gap-1">
                          <Wind className="w-3 h-3 text-sky-600 dark:text-cyan-400" />
                          <span>Avg wind: {formatWind(day.windSpeedAvg)}</span>
                        </span>
                        <span>·</span>
                        <span className="text-sky-700 dark:text-cyan-400 font-mono text-[10px] font-bold">
                          Model confidence: {day.modelConfidence}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Inline 3-Hour Breakdown Strip */}
                  <div>
                    <h3 className="text-[11px] font-bold text-slate-600 dark:text-text-muted mb-1.5 px-0.5">
                      Hourly forecast breakdown
                    </h3>
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                      {day.hourlySubset?.slice(0, 8).map((h, hIdx) => (
                        <div
                          key={hIdx}
                          className="p-2.5 rounded-xl bg-white dark:bg-space-900 border border-slate-200 dark:border-white/10 text-center flex flex-col items-center justify-between gap-1 shadow-sm"
                        >
                          <span className="text-[10px] text-slate-500 dark:text-text-secondary font-medium">{h.time}</span>
                          <WeatherIcon condition={h.condition} size={18} className="my-0.5 text-slate-800 dark:text-white" />
                          <span className="font-display text-sm font-semibold text-slate-900 dark:text-white tabular-nums">
                            {formatTemp(h.temp)}
                          </span>
                          <span className="text-[10px] font-mono text-sky-600 dark:text-cyan-400 font-bold">
                            {Math.round(h.rainProb * 100)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
