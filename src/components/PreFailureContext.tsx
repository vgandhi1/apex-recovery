import React from 'react'
import { useCockpitStore } from '../store/cockpitStore'

export const PreFailureContext: React.FC = () => {
  const { alertFiredAt, confidenceAtAlert, confidenceTrend, recoveryState } = useCockpitStore()
  const secondsAgo = alertFiredAt
    ? Math.floor((Date.now() - alertFiredAt.getTime()) / 1000)
    : null

  const trendStr = confidenceTrend.length > 0
    ? confidenceTrend.map(v => v.toFixed(2)).join(' → ')
    : '—'

  const isActive = ['ALERT_PENDING', 'TELEOPERATION', 'DEFERRED_QUEUE', 'TAGGING'].includes(recoveryState)

  return (
    <div className="bg-gray-900 rounded-lg p-3 border border-gray-800">
      <div className="text-xs text-gray-400 font-mono mb-2">PRE-FAILURE CONTEXT</div>
      {!isActive ? (
        <p className="text-xs text-gray-600 font-mono italic">No active failure event</p>
      ) : (
        <div className="space-y-1.5">
          {secondsAgo !== null && (
            <p className="text-xs font-mono text-amber-400">
              Failure detected {secondsAgo}s ago
            </p>
          )}
          <p className="text-xs font-mono text-gray-300">
            Confidence: {trendStr}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-gray-400">Suggested:</span>
            <span className="text-xs font-mono text-blue-300 font-bold">GRASP_FAIL</span>
            <span className="text-xs text-gray-500">(72%)</span>
          </div>
          <p className="text-xs font-mono text-gray-500">
            60s pre-failure buffer available
          </p>
          <div className="mt-1 pt-1 border-t border-gray-800">
            <p className="text-xs font-mono text-gray-500">
              Alert @ {confidenceAtAlert.toFixed(2)} confidence
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
