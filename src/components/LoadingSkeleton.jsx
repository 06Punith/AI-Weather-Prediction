import React from 'react'

export default function LoadingSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading meteorological forecast telemetry"
      className="max-w-xl mx-auto px-4 py-4 space-y-4 animate-pulse select-none pb-24"
    >
      {/* Top Bar Skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-6 w-32 bg-surface-card rounded-lg" />
        <div className="h-6 w-20 bg-surface-card rounded-lg" />
      </div>

      {/* Hero Curve Skeleton */}
      <div className="w-full h-80 rounded-3xl bg-surface-card border border-surface-border p-6 flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="h-4 w-28 bg-surface-quiet rounded" />
            <div className="h-20 w-44 bg-surface-quiet rounded-2xl" />
          </div>
          <div className="w-14 h-14 bg-surface-quiet rounded-2xl" />
        </div>

        {/* Fake curve line shimmer */}
        <div className="w-full h-24 bg-surface-quiet/60 rounded-xl" />

        <div className="flex justify-between">
          <div className="h-3 w-16 bg-surface-quiet rounded" />
          <div className="h-3 w-16 bg-surface-quiet rounded" />
          <div className="h-3 w-16 bg-surface-quiet rounded" />
        </div>
      </div>

      {/* AI Summary Box Skeleton */}
      <div className="h-18 w-full bg-surface-card rounded-2xl border border-surface-border p-4" />

      {/* Hourly Strip Skeleton */}
      <div className="flex gap-2.5 overflow-hidden">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-28 w-20 shrink-0 bg-surface-card rounded-xl border border-surface-border" />
        ))}
      </div>

      {/* Metrics Grid Skeleton */}
      <div className="grid grid-cols-2 gap-2.5">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-24 bg-surface-card rounded-2xl border border-surface-border p-4" />
        ))}
      </div>
    </div>
  )
}
