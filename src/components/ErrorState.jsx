import React from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'

export default function ErrorState({ error, onRetry }) {
  return (
    <div
      role="alert"
      className="max-w-md mx-auto px-6 py-16 text-center space-y-4"
    >
      <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
        <AlertCircle className="w-7 h-7" />
      </div>

      <div className="space-y-1.5">
        <h2 className="text-lg font-semibold text-text-primary">
          {error?.title || 'Telemetry connection failed'}
        </h2>
        <p className="text-xs text-text-secondary leading-relaxed max-w-sm mx-auto">
          {error?.message || 'Unable to establish secure telemetry stream with the target meteorological station. Verify network connection and retry synchronization.'}
        </p>
      </div>

      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-sky-deep font-semibold text-xs transition-all shadow-glow-cyan active:scale-95"
      >
        <RefreshCw className="w-4 h-4" />
        <span>Retry synchronization</span>
      </button>
    </div>
  )
}
