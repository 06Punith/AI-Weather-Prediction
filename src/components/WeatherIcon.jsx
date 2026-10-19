import React from 'react'

/**
 * Consistent inline SVG weather icons with refined 1.8px stroke styling,
 * harmonious dual-tone sky accents, and no emojis.
 */
export default function WeatherIcon({
  condition = 'clear',
  size = 24,
  className = '',
  ariaLabel
}) {
  const norm = (condition || 'clear').toLowerCase()

  const commonProps = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.8',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    role: 'img',
    'aria-label': ariaLabel || `${condition} weather icon`,
    className: `inline-block shrink-0 ${className}`
  }

  // Clear Day / Sun
  if (norm === 'clear' || norm === 'sun' || norm === 'sunny') {
    return (
      <svg {...commonProps}>
        <circle cx="12" cy="12" r="4.2" stroke="#F59E0B" fill="#F59E0B" fillOpacity="0.2" />
        <line x1="12" y1="2" x2="12" y2="4.2" stroke="#F59E0B" />
        <line x1="12" y1="19.8" x2="12" y2="22" stroke="#F59E0B" />
        <line x1="4.93" y1="4.93" x2="6.48" y2="6.48" stroke="#F59E0B" />
        <line x1="17.52" y1="17.52" x2="19.07" y2="19.07" stroke="#F59E0B" />
        <line x1="2" y1="12" x2="4.2" y2="12" stroke="#F59E0B" />
        <line x1="19.8" y1="12" x2="22" y2="12" stroke="#F59E0B" />
        <line x1="4.93" y1="19.07" x2="6.48" y2="17.52" stroke="#F59E0B" />
        <line x1="17.52" y1="6.48" x2="19.07" y2="4.93" stroke="#F59E0B" />
      </svg>
    )
  }

  // Clear Night / Moon
  if (norm === 'clear_night' || norm === 'night' || norm === 'moon') {
    return (
      <svg {...commonProps}>
        <path
          d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
          stroke="#38BDF8"
          fill="#38BDF8"
          fillOpacity="0.15"
        />
        <circle cx="17.5" cy="6.5" r="0.75" fill="#38BDF8" />
        <circle cx="19" cy="10" r="0.5" fill="#38BDF8" />
      </svg>
    )
  }

  // Partly Cloudy Day
  if (norm === 'partly_cloudy' || norm === 'partly-cloudy') {
    return (
      <svg {...commonProps}>
        {/* Sun peeking */}
        <circle cx="15.5" cy="8.5" r="3.2" stroke="#F59E0B" fill="#F59E0B" fillOpacity="0.25" />
        <line x1="15.5" y1="3" x2="15.5" y2="4.3" stroke="#F59E0B" />
        <line x1="19.4" y1="4.6" x2="18.5" y2="5.5" stroke="#F59E0B" />
        <line x1="21" y1="8.5" x2="19.7" y2="8.5" stroke="#F59E0B" />
        {/* Cloud in front */}
        <path
          d="M7 19h10a4 4 0 0 0 1.2-7.8A4.8 4.8 0 0 0 9 8.5a4 4 0 0 0-4.8 4.7A3.6 3.6 0 0 0 7 19z"
          stroke="currentColor"
          fill="currentColor"
          fillOpacity="0.1"
        />
      </svg>
    )
  }

  // Partly Cloudy Night
  if (norm === 'partly_cloudy_night') {
    return (
      <svg {...commonProps}>
        {/* Moon peeking */}
        <path
          d="M16 6a4 4 0 0 0 3.8 3.8 4.8 4.8 0 0 1-4.8-4.8c0-.3 0-.6.1-.9A3.8 3.8 0 0 0 16 6z"
          stroke="#38BDF8"
          fill="#38BDF8"
          fillOpacity="0.3"
        />
        {/* Cloud in front */}
        <path
          d="M7 19h10a4 4 0 0 0 1.2-7.8A4.8 4.8 0 0 0 9 8.5a4 4 0 0 0-4.8 4.7A3.6 3.6 0 0 0 7 19z"
          stroke="currentColor"
          fill="currentColor"
          fillOpacity="0.1"
        />
      </svg>
    )
  }

  // Overcast / Cloudy
  if (norm === 'overcast' || norm === 'cloud' || norm === 'cloudy') {
    return (
      <svg {...commonProps}>
        <path
          d="M17.5 18H6.5a4.5 4.5 0 0 1-.8-8.9 5.8 5.8 0 0 1 11.2-1.6A4.5 4.5 0 0 1 17.5 18z"
          stroke="currentColor"
          fill="currentColor"
          fillOpacity="0.14"
        />
      </svg>
    )
  }

  // Rain
  if (norm === 'rain' || norm === 'showers' || norm === 'drizzle') {
    return (
      <svg {...commonProps}>
        <path
          d="M17 14.5a3.8 3.8 0 0 0 0-7.6 4.9 4.9 0 0 0-9.4-1.2A3.8 3.8 0 0 0 5 13"
          stroke="currentColor"
          fill="currentColor"
          fillOpacity="0.12"
        />
        {/* Electric cyan drops */}
        <line x1="8.5" y1="16.5" x2="7.5" y2="19.5" stroke="#00E5FF" strokeWidth="2" />
        <line x1="12.5" y1="16.5" x2="11.5" y2="20.5" stroke="#00E5FF" strokeWidth="2" />
        <line x1="16.5" y1="16.5" x2="15.5" y2="19.5" stroke="#00E5FF" strokeWidth="2" />
      </svg>
    )
  }

  // Heavy Rain
  if (norm === 'heavy_rain') {
    return (
      <svg {...commonProps}>
        <path
          d="M17.5 14H6.5a4.2 4.2 0 0 1-.7-8.3 5.5 5.5 0 0 1 10.6-1.5A4.2 4.2 0 0 1 17.5 14z"
          stroke="currentColor"
          fill="currentColor"
          fillOpacity="0.15"
        />
        <line x1="8" y1="16" x2="6.5" y2="20.5" stroke="#00E5FF" strokeWidth="2" />
        <line x1="12" y1="16" x2="10.5" y2="21" stroke="#00E5FF" strokeWidth="2" />
        <line x1="16" y1="16" x2="14.5" y2="20.5" stroke="#00E5FF" strokeWidth="2" />
      </svg>
    )
  }

  // Thunderstorm
  if (norm === 'thunderstorm' || norm === 'storm') {
    return (
      <svg {...commonProps}>
        <path
          d="M17.5 13H6.5a4.2 4.2 0 0 1-.7-8.3 5.5 5.5 0 0 1 10.6-1.5A4.2 4.2 0 0 1 17.5 13z"
          stroke="currentColor"
          fill="currentColor"
          fillOpacity="0.12"
        />
        <path
          d="M13 13l-2.5 4.5h2.5L11 22"
          stroke="#F59E0B"
          strokeWidth="2"
          strokeLinejoin="miter"
          fill="#F59E0B"
          fillOpacity="0.2"
        />
      </svg>
    )
  }

  // Fog / Mist
  if (norm === 'fog' || norm === 'mist' || norm === 'haze') {
    return (
      <svg {...commonProps}>
        <path d="M4 8h16" stroke="#94A3B8" />
        <path d="M2.5 12h19" stroke="#94A3B8" strokeWidth="2" />
        <path d="M5 16h14" stroke="#94A3B8" />
        <path d="M7 20h10" stroke="#94A3B8" />
      </svg>
    )
  }

  // Wind
  if (norm === 'wind') {
    return (
      <svg {...commonProps}>
        <path d="M17.7 7.7a2.5 2.5 0 1 1-1.8 4.3H3" stroke="currentColor" />
        <path d="M19.7 12.3a2 2 0 1 1-1.4 3.4H3" stroke="currentColor" />
        <path d="M14.7 17a1.5 1.5 0 1 1-1.1 2.5H3" stroke="currentColor" />
      </svg>
    )
  }

  // Default fallback
  return (
    <svg {...commonProps}>
      <circle cx="12" cy="12" r="5" stroke="#F59E0B" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="#F59E0B" />
    </svg>
  )
}
