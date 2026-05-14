import React, { useEffect, useState } from 'react'
import { useCockpitStore } from '../store/cockpitStore'

const STATE_COLORS: Record<string, string> = {
  AUTONOMOUS: 'bg-green-900 text-green-300 border-green-700',
  ALERT_PENDING: 'bg-yellow-900 text-yellow-300 border-yellow-600 animate-pulse',
  TELEOPERATION: 'bg-blue-900 text-blue-300 border-blue-700',
  SAFE_STOP: 'bg-red-900 text-red-300 border-red-700',
  DEFERRED_QUEUE: 'bg-orange-900 text-orange-300 border-orange-700',
  TAGGING: 'bg-purple-900 text-purple-300 border-purple-700',
  TRAINING_QUEUE: 'bg-teal-900 text-teal-300 border-teal-700',
}

const LATENCY_COLOR = (ms: number) =>
  ms < 80 ? 'text-green-400' : ms < 150 ? 'text-yellow-400' : 'text-red-400'

export const StateBanner: React.FC = () => {
  const { recoveryState, episodeId, robotId, latencyMs, recoveryStartedAt } = useCockpitStore()
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!recoveryStartedAt) { setElapsed(0); return }
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - recoveryStartedAt.getTime()) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [recoveryStartedAt])

  const pad = (n: number) => String(n).padStart(2, '0')
  const elapsedStr = `${pad(Math.floor(elapsed / 60))}:${pad(elapsed % 60)}`

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-gray-950 border-b border-gray-800">
      <div className="flex items-center gap-4">
        <span className="font-mono text-xs text-gray-400">{robotId}</span>
        <span className="font-mono text-xs text-gray-500">{episodeId}</span>
        <span className={`px-2 py-0.5 rounded border text-xs font-bold font-mono ${STATE_COLORS[recoveryState] ?? ''}`}>
          {recoveryState}
        </span>
      </div>
      <div className="flex items-center gap-6">
        {recoveryStartedAt && (
          <span className="font-mono text-sm text-gray-300">&#x23F1; {elapsedStr}</span>
        )}
        <span className={`font-mono text-sm font-semibold ${LATENCY_COLOR(latencyMs)}`}>
          {latencyMs}ms
        </span>
        <span className="text-xs text-gray-600 font-mono">OP_007</span>
      </div>
    </div>
  )
}
