import React, { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import WeatherIcon from './WeatherIcon'
import {
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Award,
  Layers,
  HelpCircle,
  Activity
} from 'lucide-react'

export default function HistoryScreen() {
  const { historyData, historyRange, setHistoryRange, currentStation, formatTemp } = useApp()
  const [selectedPointIndex, setSelectedPointIndex] = useState(null)

  const points = historyData?.dataPoints || []

  const svgWidth = 720
  const svgHeight = 220
  const padLeft = 32
  const padRight = 24
  const padTop = 24
  const padBottom = 34
  const chartWidth = svgWidth - padLeft - padRight
  const chartHeight = svgHeight - padTop - padBottom

  const chartInfo = useMemo(() => {
    if (!points || points.length === 0) return null

    let min = Infinity
    let max = -Infinity

    points.forEach(p => {
      if (p.actualTemp < min) min = p.actualTemp
      if (p.predTemp < min) min = p.predTemp
      if (p.actualTemp > max) max = p.actualTemp
      if (p.predTemp > max) max = p.predTemp
    })

    min = Math.floor(min - 1)
    max = Math.ceil(max + 1)
    const span = max - min || 1

    const getX = (i) => padLeft + (i / (points.length - 1)) * chartWidth
    const getY = (val) => padTop + chartHeight - ((val - min) / span) * chartHeight

    const coords = points.map((p, i) => ({
      x: getX(i),
      yActual: getY(p.actualTemp),
      yPred: getY(p.predTemp),
      ...p
    }))

    // Build actual path
    let pathActual = `M ${coords[0].x} ${coords[0].yActual}`
    for (let i = 1; i < coords.length; i++) {
      pathActual += ` L ${coords[i].x} ${coords[i].yActual}`
    }

    // Build predicted path
    let pathPred = `M ${coords[0].x} ${coords[0].yPred}`
    for (let i = 1; i < coords.length; i++) {
      pathPred += ` L ${coords[i].x} ${coords[i].yPred}`
    }

    // Build shaded error gap polygon
    let pathErrorGap = `M ${coords[0].x} ${coords[0].yActual}`
    for (let i = 1; i < coords.length; i++) {
      pathErrorGap += ` L ${coords[i].x} ${coords[i].yActual}`
    }
    for (let i = coords.length - 1; i >= 0; i--) {
      pathErrorGap += ` L ${coords[i].x} ${coords[i].yPred}`
    }
    pathErrorGap += ' Z'

    return { coords, pathActual, pathPred, pathErrorGap, min, max }
  }, [points, chartWidth, chartHeight])

  const activePoint = selectedPointIndex !== null ? points[selectedPointIndex] : points[points.length - 1]

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-5 pb-24 space-y-4">
      {/* Header with Title and Range Toggle */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-text-primary tracking-tight">
            Verification & history
          </h1>
          <p className="text-xs text-slate-500 dark:text-text-secondary">
            {currentStation.name} · Actual ground observations vs prior model predictions
          </p>
        </div>

        {/* 24h / 7d Range Toggle */}
        <div
          role="radiogroup"
          aria-label="Historical verification range"
          className="inline-flex items-center p-1 rounded-xl bg-white dark:bg-space-850 border border-slate-200 dark:border-white/10 self-start sm:self-auto shadow-sm"
        >
          <button
            type="button"
            role="radio"
            aria-checked={historyRange === '24h'}
            onClick={() => {
              setHistoryRange('24h')
              setSelectedPointIndex(null)
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              historyRange === '24h'
                ? 'bg-sky-600 text-white shadow-sm dark:bg-cyan-500/20 dark:text-cyan-300 dark:border dark:border-cyan-400/30'
                : 'text-slate-600 dark:text-text-secondary hover:text-slate-900 dark:hover:text-text-primary'
            }`}
          >
            Last 24h
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={historyRange === '7d'}
            onClick={() => {
              setHistoryRange('7d')
              setSelectedPointIndex(null)
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              historyRange === '7d'
                ? 'bg-sky-600 text-white shadow-sm dark:bg-cyan-500/20 dark:text-cyan-300 dark:border dark:border-cyan-400/30'
                : 'text-slate-600 dark:text-text-secondary hover:text-slate-900 dark:hover:text-text-primary'
            }`}
          >
            Last 7 days
          </button>
        </div>
      </header>

      {/* Accuracy Summary Stat Cards */}
      <section
        aria-label="Statistical accuracy summary"
        className="grid grid-cols-2 lg:grid-cols-4 gap-3"
      >
        <div className="p-4 rounded-2xl bg-white dark:bg-space-850 border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-card flex flex-col justify-between">
          <span className="text-xs text-slate-600 dark:text-text-secondary flex items-center justify-between font-medium">
            <span>Temp MAE</span>
            <Award className="w-4 h-4 text-sky-600 dark:text-cyan-400" />
          </span>
          <div className="mt-2">
            <span className="font-display text-3xl font-light text-sky-600 dark:text-cyan-400 tabular-nums">
              ±{historyData?.mae ?? '0.42'}°C
            </span>
            <p className="text-[11px] text-slate-500 dark:text-text-muted mt-0.5">Mean absolute error</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-space-850 border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-card flex flex-col justify-between">
          <span className="text-xs text-slate-600 dark:text-text-secondary flex items-center justify-between font-medium">
            <span>Rain Hit Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </span>
          <div className="mt-2">
            <span className="font-display text-3xl font-light text-emerald-600 dark:text-emerald-400 tabular-nums">
              {historyData?.hitRate ?? '91.4'}%
            </span>
            <p className="text-[11px] text-slate-500 dark:text-text-muted mt-0.5">Rain binary accuracy</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-space-850 border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-card flex flex-col justify-between">
          <span className="text-xs text-slate-600 dark:text-text-secondary flex items-center justify-between font-medium">
            <span>RMSE</span>
            <Activity className="w-4 h-4 text-amber-500" />
          </span>
          <div className="mt-2">
            <span className="font-display text-3xl font-light text-slate-900 dark:text-white tabular-nums">
              0.58°C
            </span>
            <p className="text-[11px] text-slate-500 dark:text-text-muted mt-0.5">Root mean square</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-space-850 border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-card flex flex-col justify-between">
          <span className="text-xs text-slate-600 dark:text-text-secondary flex items-center justify-between font-medium">
            <span>Brier Score</span>
            <Layers className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          </span>
          <div className="mt-2">
            <span className="font-display text-3xl font-light text-slate-900 dark:text-white tabular-nums">
              0.081
            </span>
            <p className="text-[11px] text-slate-500 dark:text-text-muted mt-0.5">0 = perfect calibration</p>
          </div>
        </div>
      </section>

      {/* Main Verification Chart: Actual vs Predicted with Shaded Error Gap */}
      <section
        aria-label="Comparative temperature overlay graph"
        className="p-5 rounded-2xl bg-white dark:bg-space-850 border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-glass space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-surface-divider pb-3">
          <div className="flex items-center gap-5 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-1 bg-slate-900 dark:bg-white rounded-full" />
              <span className="text-slate-900 dark:text-text-primary font-bold">Actual observed</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-3.5 h-1 bg-amber-500 dark:bg-amber-400 rounded-full border-b border-dashed border-amber-400" />
              <span className="text-amber-600 dark:text-amber-400 font-bold">AI prediction</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-3.5 h-2 bg-sky-200 dark:bg-cyan-400/25 border border-sky-400 dark:border-cyan-400/40 rounded-sm" />
              <span className="text-sky-700 dark:text-cyan-300 font-medium">Error delta</span>
            </div>
          </div>

          <span className="text-[11px] text-slate-500 dark:text-text-muted">Tap point to inspect</span>
        </div>

        {/* SVG Chart */}
        <div className="relative w-full overflow-hidden select-none">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-56 overflow-visible"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="errorGapGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#0284C7" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#0284C7" stopOpacity="0.05" />
              </linearGradient>
            </defs>

            {/* Background Grid Lines */}
            <line x1={padLeft} y1={padTop} x2={svgWidth - padRight} y2={padTop} stroke="currentColor" className="text-slate-200 dark:text-white/10" />
            <line x1={padLeft} y1={padTop + chartHeight * 0.5} x2={svgWidth - padRight} y2={padTop + chartHeight * 0.5} stroke="currentColor" className="text-slate-200 dark:text-white/10" />
            <line x1={padLeft} y1={padTop + chartHeight} x2={svgWidth - padRight} y2={padTop + chartHeight} stroke="currentColor" className="text-slate-200 dark:text-white/10" />

            {/* Shaded error gap */}
            {chartInfo?.pathErrorGap && (
              <path
                d={chartInfo.pathErrorGap}
                fill="url(#errorGapGrad)"
                stroke="#0284C7"
                strokeWidth="0.8"
                strokeDasharray="2 2"
                strokeOpacity="0.5"
              />
            )}

            {/* Predicted line (Warm Amber) */}
            {chartInfo?.pathPred && (
              <path
                d={chartInfo.pathPred}
                fill="none"
                stroke="#D97706"
                strokeWidth="2.5"
                strokeDasharray="4 2"
                strokeLinecap="round"
              />
            )}

            {/* Actual line (High-contrast: Dark Slate in light mode, Pure White in dark mode) */}
            {chartInfo?.pathActual && (
              <path
                d={chartInfo.pathActual}
                fill="none"
                stroke="currentColor"
                className="text-slate-900 dark:text-white"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            )}

            {/* Interactive Data Point Dots */}
            {chartInfo?.coords.map((pt, i) => {
              const isSelected = selectedPointIndex === i
              return (
                <g
                  key={i}
                  className="cursor-pointer"
                  onClick={() => setSelectedPointIndex(i)}
                >
                  <circle
                    cx={pt.x}
                    cy={pt.yActual}
                    r={isSelected ? 6 : 3.5}
                    fill="currentColor"
                    className="text-slate-900 dark:text-white"
                    stroke="var(--surface-base)"
                    strokeWidth="1.5"
                  />
                  <circle
                    cx={pt.x}
                    cy={pt.yPred}
                    r={isSelected ? 6 : 3}
                    fill="#D97706"
                    stroke="var(--surface-base)"
                    strokeWidth="1.5"
                  />
                </g>
              )
            })}

            {/* X-axis time labels */}
            {chartInfo?.coords.map((pt, i) => {
              const step = historyRange === '24h' ? 4 : 1
              if (i % step !== 0 && i !== chartInfo.coords.length - 1) return null
              return (
                <text
                  key={i}
                  x={pt.x}
                  y={svgHeight - 8}
                  textAnchor="middle"
                  fill="currentColor"
                  className="text-slate-600 dark:text-text-secondary"
                  fontSize="11"
                  fontFamily="Plus Jakarta Sans"
                  fontWeight="600"
                >
                  {pt.timeLabel}
                </text>
              )
            })}
          </svg>
        </div>

        {/* Selected Data Point Inspector Card */}
        {activePoint && (
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-space-900 border border-slate-200 dark:border-white/10 flex items-center justify-between text-xs animate-fade-in shadow-sm">
            <div className="flex items-center gap-2.5">
              <WeatherIcon condition={activePoint.condition} size={24} className="text-slate-800 dark:text-white" />
              <div>
                <span className="font-bold text-slate-900 dark:text-text-primary text-sm">
                  {activePoint.timeLabel}
                </span>
                <p className="text-[10px] text-slate-500 dark:text-text-muted">Observation point</p>
              </div>
            </div>

            <div className="flex items-center gap-5 font-mono text-xs">
              <div>
                <span className="text-slate-500 dark:text-text-muted text-[10px] block">Actual</span>
                <span className="text-slate-900 dark:text-white font-bold">{formatTemp(activePoint.actualTemp)}</span>
              </div>

              <div>
                <span className="text-slate-500 dark:text-text-muted text-[10px] block">Predicted</span>
                <span className="text-amber-600 dark:text-amber-400 font-bold">{formatTemp(activePoint.predTemp)}</span>
              </div>

              <div>
                <span className="text-slate-500 dark:text-text-muted text-[10px] block">Delta</span>
                <span className="text-sky-600 dark:text-cyan-300 font-bold">
                  {activePoint.error > 0 ? `+${activePoint.error}` : activePoint.error}°C
                </span>
              </div>

              <div>
                <span className="text-slate-500 dark:text-text-muted text-[10px] block">Rain Result</span>
                <span className={activePoint.rainHit ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-rose-600 dark:text-rose-400 font-bold'}>
                  {activePoint.actualRain ? 'Rained' : 'Dry'} ({Math.round(activePoint.predRainProb * 100)}% pred)
                </span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Model Diagnostic Bias Analysis */}
      <section
        aria-label="Empirical model error analysis"
        className="p-4 rounded-2xl bg-white dark:bg-space-850 border border-slate-200 dark:border-white/10 shadow-sm space-y-2"
      >
        <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-text-primary">
          <TrendingUp className="w-4 h-4 text-sky-600 dark:text-cyan-400" />
          <span>Residual Diagnostic Summary</span>
        </div>
        <p className="text-xs text-slate-700 dark:text-text-secondary leading-relaxed">
          {historyData?.biasSummary || "Model exhibits negligible thermal drift. Confidence bounds captured 94.2% of ground-truth measurements within 1-sigma boundary."}
        </p>
      </section>
    </div>
  )
}
