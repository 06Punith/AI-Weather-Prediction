import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { useApp } from '../context/AppContext'
import WeatherIcon from './WeatherIcon'
import { RotateCcw, ShieldCheck, Droplets, Wind, Sparkles } from 'lucide-react'

/**
 * Full-bleed Living Sky Hero
 * 
 * Powered by Outfit display numerals, Plus Jakarta Sans, and radiant celestial gradients.
 * Features 60fps draggable 24h temperature curve with widening uncertainty band.
 */
export default function LivingSkyHero() {
  const { forecast, currentWeather, formatTemp, formatWind } = useApp()
  const [scrubIndex, setScrubIndex] = useState(0)
  const [isScrubbing, setIsScrubbing] = useState(false)
  const svgRef = useRef(null)
  const isPointerDown = useRef(false)

  // Reset scrub to 0 (Now) whenever station changes
  useEffect(() => {
    setScrubIndex(0)
  }, [forecast?.stationId])

  const hourly = forecast?.hourly || []
  const currentPoint = hourly[scrubIndex] || hourly[0] || currentWeather || {}

  // Calculate hour for sky gradient
  const pointDate = useMemo(() => {
    return currentPoint.targetTime ? new Date(currentPoint.targetTime) : new Date()
  }, [currentPoint.targetTime])

  const hourOfDay = pointDate.getHours() + pointDate.getMinutes() / 60

  // Derive atmospheric sky palette with pure, vibrant, luminous color stops
  const skyTheme = useMemo(() => {
    const cond = currentPoint.condition || 'clear'
    const isRain = cond.includes('rain') || cond.includes('thunderstorm')
    const isOvercast = cond === 'overcast' || cond === 'fog'

    let topColor = '#040914'
    let midColor = '#0A152E'
    let bottomColor = '#0F2448'
    let lightGlow = 'rgba(0, 240, 255, 0.22)'
    let sunPosition = { x: 50, y: 70 }
    let phaseName = 'Cosmic Night'

    if (hourOfDay >= 4.5 && hourOfDay < 7.5) {
      // Dawn / Twilight
      topColor = '#081126'
      midColor = '#1B1C38'
      bottomColor = '#3B243E'
      lightGlow = 'rgba(251, 146, 60, 0.35)'
      sunPosition = { x: 25, y: 65 }
      phaseName = 'Dawn Twilight'
    } else if (hourOfDay >= 7.5 && hourOfDay < 11.5) {
      // Morning
      topColor = '#0C2652'
      midColor = '#16437E'
      bottomColor = '#1D64B4'
      lightGlow = 'rgba(251, 191, 36, 0.35)'
      sunPosition = { x: 40, y: 35 }
      phaseName = 'Morning Light'
    } else if (hourOfDay >= 11.5 && hourOfDay < 16.5) {
      // Midday Peak
      topColor = '#0D2F64'
      midColor = '#1D4ED8'
      bottomColor = '#2563EB'
      lightGlow = 'rgba(254, 240, 138, 0.45)'
      sunPosition = { x: 55, y: 20 }
      phaseName = 'Midday Zenith'
    } else if (hourOfDay >= 16.5 && hourOfDay < 18.8) {
      // Golden Hour
      topColor = '#120D24'
      midColor = '#3B1832'
      bottomColor = '#8A3214'
      lightGlow = 'rgba(245, 158, 11, 0.55)'
      sunPosition = { x: 75, y: 55 }
      phaseName = 'Golden Hour'
    } else if (hourOfDay >= 18.8 && hourOfDay < 21.0) {
      // Dusk
      topColor = '#070F22'
      midColor = '#141834'
      bottomColor = '#241E40'
      lightGlow = 'rgba(147, 51, 234, 0.25)'
      sunPosition = { x: 85, y: 75 }
      phaseName = 'Dusk Twilight'
    } else {
      // Deep Cosmic Night
      topColor = '#040711'
      midColor = '#081224'
      bottomColor = '#0C1C38'
      lightGlow = 'rgba(0, 240, 255, 0.18)'
      sunPosition = { x: 50, y: 30 }
      phaseName = 'Deep Night'
    }

    if (isRain) {
      topColor = '#050D18'
      midColor = '#0B1C2E'
      bottomColor = '#102A44'
      lightGlow = 'rgba(0, 240, 255, 0.25)'
      phaseName += ' · Rain'
    } else if (isOvercast) {
      topColor = '#08101E'
      midColor = '#121F36'
      bottomColor = '#1B2C48'
      lightGlow = 'rgba(148, 163, 184, 0.2)'
      phaseName += ' · Overcast'
    }

    return { topColor, midColor, bottomColor, lightGlow, sunPosition, phaseName }
  }, [hourOfDay, currentPoint.condition])

  // Chart Dimensions & Coordinate Geometry
  const svgWidth = 800
  const svgHeight = 210
  const padLeft = 20
  const padRight = 20
  const padTop = 32
  const padBottom = 38
  const chartWidth = svgWidth - padLeft - padRight
  const chartHeight = svgHeight - padTop - padBottom

  // Calculate curve points, uncertainty envelope, and scales
  const chartData = useMemo(() => {
    if (!hourly || hourly.length === 0) return null

    let minT = Infinity
    let maxT = -Infinity

    hourly.forEach(pt => {
      const lower = pt.uncertaintyLower !== undefined ? pt.uncertaintyLower : pt.predTemp - 1.5
      const upper = pt.uncertaintyUpper !== undefined ? pt.uncertaintyUpper : pt.predTemp + 1.5
      if (lower < minT) minT = lower
      if (upper > maxT) maxT = upper
    })

    minT = Math.floor(minT - 1.5)
    maxT = Math.ceil(maxT + 1.5)
    const rangeT = maxT - minT || 1

    const getX = (idx) => padLeft + (idx / (hourly.length - 1)) * chartWidth
    const getY = (val) => padTop + chartHeight - ((val - minT) / rangeT) * chartHeight

    const points = hourly.map((pt, idx) => ({
      x: getX(idx),
      y: getY(pt.predTemp),
      yUpper: getY(pt.uncertaintyUpper !== undefined ? pt.uncertaintyUpper : pt.predTemp + pt.uncertaintyMargin),
      yLower: getY(pt.uncertaintyLower !== undefined ? pt.uncertaintyLower : pt.predTemp - pt.uncertaintyMargin),
      ...pt
    }))

    // Build smooth Catmull-Rom / cubic bezier curve for main prediction line
    let pathD = `M ${points[0].x} ${points[0].y}`
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? 0 : i - 1]
      const p1 = points[i]
      const p2 = points[i + 1]
      const p3 = points[i + 2 >= points.length ? points.length - 1 : i + 2]

      const cp1x = p1.x + (p2.x - p0.x) / 6
      const cp1y = p1.y + (p2.y - p0.y) / 6
      const cp2x = p2.x - (p3.x - p1.x) / 6
      const cp2y = p2.y - (p3.y - p1.y) / 6

      pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`
    }

    // Build upper curve path
    let upperPath = `M ${points[0].x} ${points[0].yUpper}`
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? 0 : i - 1]
      const p1 = points[i]
      const p2 = points[i + 1]
      const p3 = points[i + 2 >= points.length ? points.length - 1 : i + 2]

      const cp1x = p1.x + (p2.x - p0.x) / 6
      const cp1y = p1.yUpper + (p2.yUpper - p0.yUpper) / 6
      const cp2x = p2.x - (p3.x - p1.x) / 6
      const cp2y = p2.yUpper - (p3.yUpper - p1.yUpper) / 6

      upperPath += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.yUpper}`
    }

    // Build lower curve path backwards to form closed envelope
    let envelopeD = upperPath
    for (let i = points.length - 1; i > 0; i--) {
      const p3 = points[i === points.length - 1 ? points.length - 1 : i + 1]
      const p2 = points[i]
      const p1 = points[i - 1]
      const p0 = points[i - 2 < 0 ? 0 : i - 2]

      const cp1x = p2.x - (p3.x - p1.x) / 6
      const cp1y = p2.yLower - (p3.yLower - p1.yLower) / 6
      const cp2x = p1.x + (p2.x - p0.x) / 6
      const cp2y = p1.yLower + (p2.yLower - p0.yLower) / 6

      envelopeD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.yLower}`
    }
    envelopeD += ' Z'

    return { points, pathD, envelopeD, minT, maxT }
  }, [hourly, chartWidth, chartHeight])

  // Scrub interaction handler with 60fps responsiveness
  const handleScrubPointer = useCallback((clientX) => {
    if (!svgRef.current || !chartData) return
    const rect = svgRef.current.getBoundingClientRect()
    const relativeX = clientX - rect.left
    const normalizedRatio = Math.max(0, Math.min(1, (relativeX - (padLeft / svgWidth) * rect.width) / ((chartWidth / svgWidth) * rect.width)))
    const targetIdx = Math.round(normalizedRatio * (hourly.length - 1))
    setScrubIndex(targetIdx)
  }, [chartData, hourly.length, chartWidth, svgWidth, padLeft])

  const onPointerDown = (e) => {
    isPointerDown.current = true
    setIsScrubbing(true)
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch (_) {}
    handleScrubPointer(e.clientX)
  }

  const onPointerMove = (e) => {
    if (!isPointerDown.current) return
    window.requestAnimationFrame(() => {
      handleScrubPointer(e.clientX)
    })
  }

  const onPointerUp = (e) => {
    isPointerDown.current = false
    setIsScrubbing(false)
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch (_) {}
  }

  // Keyboard navigation for accessibility
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault()
      setScrubIndex(prev => Math.max(0, prev - 1))
      setIsScrubbing(true)
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault()
      setScrubIndex(prev => Math.min(hourly.length - 1, prev + 1))
      setIsScrubbing(true)
    } else if (e.key === 'Home') {
      e.preventDefault()
      setScrubIndex(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      setScrubIndex(hourly.length - 1)
    }
  }

  const activePointCoords = chartData?.points?.[scrubIndex] || { x: padLeft, y: svgHeight / 2 }

  // Display labels
  const rainPct = Math.round((currentPoint.predRainProb || 0) * 100)
  const isNow = scrubIndex === 0
  const timeBadge = isNow ? 'Now' : `+${scrubIndex}h · ${currentPoint.hourLabel}`

  return (
    <section
      aria-label="24-hour living forecast hero"
      className="relative w-full overflow-hidden transition-all duration-700 select-none pb-4"
      style={{
        background: `linear-gradient(180deg, ${skyTheme.topColor} 0%, ${skyTheme.midColor} 55%, ${skyTheme.bottomColor} 100%)`
      }}
    >
      {/* Radiant atmospheric light flare */}
      <div
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[700px] h-[480px] rounded-full blur-[110px] transition-all duration-1000 opacity-80"
        style={{
          background: `radial-gradient(circle at ${skyTheme.sunPosition.x}% ${skyTheme.sunPosition.y}%, ${skyTheme.lightGlow} 0%, transparent 70%)`
        }}
      />

      {/* Precipitation shimmer aura */}
      {(currentPoint.condition?.includes('rain') || currentPoint.condition?.includes('thunderstorm')) && (
        <div className="pointer-events-none absolute inset-0 opacity-25 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-400/30 via-transparent to-transparent animate-pulse-subtle" />
      )}

      {/* Container with mobile-first padding */}
      <div className="relative z-10 max-w-xl mx-auto px-5 pt-3">
        {/* Top telemetry status bar */}
        <div className="flex items-center justify-between gap-2 pt-1 pb-3">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-tight transition-colors ${
                isNow
                  ? 'bg-white/10 text-white border border-white/20'
                  : 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-glow-cyan'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isNow ? 'bg-emerald-400 animate-pulse' : 'bg-cyan-400'}`} />
              {timeBadge}
            </span>

            {/* Model Confidence Tag */}
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-slate-300 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>{currentPoint.confidenceText || 'High confidence · next 6h'}</span>
            </span>
          </div>

          {/* Reset button if scrubbed */}
          {!isNow && (
            <button
              onClick={() => setScrubIndex(0)}
              aria-label="Reset scrub to current hour"
              className="inline-flex items-center gap-1 text-xs text-cyan-300 hover:text-white transition-colors bg-white/10 px-2.5 py-1 rounded-full active:scale-95 border border-white/15"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Now</span>
            </button>
          )}
        </div>

        {/* Hero Central Forecast: Monumental Modern Outfit Numerals */}
        <div className="grid grid-cols-12 items-baseline pt-1 pb-2">
          {/* Main Huge Temperature */}
          <div className="col-span-8">
            <div className="flex items-baseline">
              <span
                className="font-display font-light text-white tabular-nums text-[5.5rem] leading-[0.88] drop-shadow-md select-none tracking-tight"
              >
                {formatTemp(currentPoint.predTemp).replace('°', '')}
              </span>
              <span className="font-display font-light text-cyan-400 text-5xl -translate-y-7 ml-1">°</span>
            </div>

            {/* Uncertainty band interval callout */}
            <div className="flex items-center gap-2 mt-2 text-xs text-slate-300 font-medium">
              <span className="text-white">
                {currentPoint.conditionLabel || 'Partly Cloudy'}
              </span>
              <span className="text-white/30">·</span>
              <span className="text-cyan-400 font-mono tracking-tight font-semibold">
                ±{currentPoint.uncertaintyMargin || '0.9'}°C uncertainty
              </span>
            </div>
          </div>

          {/* Right Icon + Rain Probability */}
          <div className="col-span-4 flex flex-col items-end justify-center text-right">
            <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-glass mb-2">
              <WeatherIcon
                condition={currentPoint.condition}
                size={44}
                className="text-white"
                ariaLabel={currentPoint.conditionLabel}
              />
            </div>

            {/* Rain as Probability (%) */}
            <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-300">
              <Droplets className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="tabular-nums font-mono text-sm">{rainPct}%</span>
              <span className="text-[11px] text-slate-300 font-normal">rain</span>
            </div>
          </div>
        </div>

        {/* The Draggable 24-Hour Temperature Curve with Soft Uncertainty Band */}
        <div className="relative mt-2 pt-2">
          <div className="flex items-center justify-between text-xs text-slate-300/90 mb-1 px-1">
            <span className="flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Drag along curve to scrub day</span>
            </span>
            <span className="text-cyan-300 font-mono text-[11px]">
              Shaded: 90% confidence envelope
            </span>
          </div>

          {/* Interactive SVG Chart Container */}
          <div
            tabIndex={0}
            role="slider"
            aria-label="24-hour temperature forecast scrub slider"
            aria-valuemin={0}
            aria-valuemax={hourly.length > 0 ? hourly.length - 1 : 23}
            aria-valuenow={scrubIndex}
            aria-valuetext={`Forecast for ${currentPoint.hourLabel}: ${formatTemp(currentPoint.predTemp)}, ${rainPct}% rain chance`}
            onKeyDown={handleKeyDown}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            className="w-full relative touch-none cursor-ew-resize rounded-2xl bg-black/20 backdrop-blur-md border border-white/15 p-1.5 focus:outline-none focus:ring-2 focus:ring-cyan-400 shadow-glass"
          >
            <svg
              ref={svgRef}
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-44 overflow-visible select-none"
              preserveAspectRatio="none"
            >
              <defs>
                {/* Uncertainty Band Gradient */}
                <linearGradient id="uncertaintyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#00F0FF" stopOpacity="0.30" />
                  <stop offset="60%" stopColor="#00F0FF" stopOpacity="0.20" />
                  <stop offset="100%" stopColor="#00F0FF" stopOpacity="0.10" />
                </linearGradient>

                {/* Main Prediction Temperature Curve Gradient */}
                <linearGradient id="tempCurveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#FBBF24" />
                  <stop offset="50%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#00F0FF" />
                </linearGradient>

                {/* Vertical Laser Scrub Gradient */}
                <linearGradient id="laserGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#00F0FF" stopOpacity="0.9" />
                  <stop offset="50%" stopColor="#00F0FF" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#00F0FF" stopOpacity="0.0" />
                </linearGradient>

                <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Horizontal Reference Hairlines */}
              <line
                x1={padLeft}
                y1={padTop + chartHeight * 0.25}
                x2={svgWidth - padRight}
                y2={padTop + chartHeight * 0.25}
                stroke="rgba(255, 255, 255, 0.08)"
                strokeDasharray="4 4"
              />
              <line
                x1={padLeft}
                y1={padTop + chartHeight * 0.75}
                x2={svgWidth - padRight}
                y2={padTop + chartHeight * 0.75}
                stroke="rgba(255, 255, 255, 0.08)"
                strokeDasharray="4 4"
              />

              {/* Soft Uncertainty Envelope (widens into future) */}
              {chartData?.envelopeD && (
                <path
                  d={chartData.envelopeD}
                  fill="url(#uncertaintyGrad)"
                  stroke="rgba(0, 240, 255, 0.35)"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
              )}

              {/* Main Temperature Prediction Curve */}
              {chartData?.pathD && (
                <path
                  d={chartData.pathD}
                  fill="none"
                  stroke="url(#tempCurveGrad)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  filter="url(#glowFilter)"
                />
              )}

              {/* Scrub Handle: Vertical Laser Guide Line */}
              <line
                x1={activePointCoords.x}
                y1={padTop - 6}
                x2={activePointCoords.x}
                y2={svgHeight - padBottom + 12}
                stroke="url(#laserGrad)"
                strokeWidth="2"
                strokeDasharray="2 2"
              />

              {/* Draggable Knob on Curve */}
              <g transform={`translate(${activePointCoords.x}, ${activePointCoords.y})`}>
                <circle r="16" fill="#00F0FF" fillOpacity="0.25" className="animate-pulse" />
                <circle r="9" fill="#060B16" stroke="#00F0FF" strokeWidth="2.5" />
                <circle r="4" fill="#FFFFFF" />
              </g>

              {/* Time tick labels along X axis */}
              {chartData?.points?.map((pt, i) => {
                if (i % 6 !== 0 && i !== chartData.points.length - 1) return null
                return (
                  <text
                    key={i}
                    x={pt.x}
                    y={svgHeight - 12}
                    textAnchor="middle"
                    fill={i === scrubIndex ? '#00F0FF' : 'rgba(255, 255, 255, 0.65)'}
                    fontSize="11"
                    fontFamily="Plus Jakarta Sans"
                    fontWeight={i === scrubIndex ? '700' : '500'}
                  >
                    {i === 0 ? 'Now' : pt.hourLabel}
                  </text>
                )
              })}
            </svg>
          </div>
        </div>
      </div>
    </section>
  )
}
