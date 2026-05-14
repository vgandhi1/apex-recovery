import React, { useState, useRef, useEffect } from 'react'
import { useCockpitStore } from '../store/cockpitStore'

export const ControlBar: React.FC = () => {
  const {
    recoveryState, latencyMs, hapticEnabled, setHapticEnabled,
    acceptHandoff, simulateHighLatency, resolveTask, triggerEStop,
    resetFromSafeStop, triggerAlert
  } = useCockpitStore()

  const [eStopProgress, setEStopProgress] = useState(0)
  const [eStopHolding, setEStopHolding] = useState(false)
  const eStopInterval = useRef<ReturnType<typeof setInterval> | null>(null)
  const [teleOpSeconds, setTeleOpSeconds] = useState(0)
  const teleOpTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (recoveryState === 'TELEOPERATION') {
      setTeleOpSeconds(0)
      teleOpTimer.current = setInterval(() => setTeleOpSeconds(s => s + 1), 1000)
    } else {
      setTeleOpSeconds(0)
      if (teleOpTimer.current) clearInterval(teleOpTimer.current)
    }
    return () => { if (teleOpTimer.current) clearInterval(teleOpTimer.current) }
  }, [recoveryState])

  const startEStop = () => {
    setEStopHolding(true)
    eStopInterval.current = setInterval(() => {
      setEStopProgress(p => {
        if (p >= 100) {
          clearInterval(eStopInterval.current!)
          triggerEStop()
          setEStopHolding(false)
          setEStopProgress(0)
          return 0
        }
        return p + 100 / 15
      })
    }, 100)
  }

  const cancelEStop = () => {
    if (eStopInterval.current) clearInterval(eStopInterval.current)
    setEStopHolding(false)
    setEStopProgress(0)
  }

  const latencyColor =
    latencyMs < 80 ? 'text-green-400' : latencyMs < 150 ? 'text-yellow-400' : 'text-red-400'
  const canAccept = recoveryState === 'ALERT_PENDING' || recoveryState === 'DEFERRED_QUEUE'
  const inTeleopLongEnough = teleOpSeconds >= 5

  return (
    <div className="bg-gray-950 border-t border-gray-800 px-4 py-3">
      <div className="flex flex-wrap gap-3 items-center">
        {/* Simulate failure */}
        {recoveryState === 'AUTONOMOUS' && (
          <button
            onClick={triggerAlert}
            className="px-4 py-2 bg-yellow-700 hover:bg-yellow-600 text-yellow-100 text-sm font-bold rounded border border-yellow-600 font-mono"
          >
            SIMULATE FAILURE
          </button>
        )}

        {/* Accept handoff */}
        {canAccept && (
          <button
            onClick={acceptHandoff}
            disabled={latencyMs > 150}
            className={`px-4 py-2 text-sm font-bold rounded border font-mono ${
              latencyMs > 150
                ? 'bg-gray-800 text-gray-600 border-gray-700 cursor-not-allowed'
                : 'bg-blue-700 hover:bg-blue-600 text-blue-100 border-blue-600'
            }`}
          >
            {latencyMs > 150 ? 'HANDOFF BLOCKED' : 'ACCEPT HANDOFF'}
          </button>
        )}

        {/* Simulate high latency */}
        {recoveryState !== 'AUTONOMOUS' && recoveryState !== 'TRAINING_QUEUE' && (
          <button
            onClick={simulateHighLatency}
            className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded border border-gray-700 font-mono"
          >
            SIMULATE HIGH LATENCY
          </button>
        )}

        {/* Haptic toggle */}
        {recoveryState === 'TELEOPERATION' && (
          <button
            onClick={() => setHapticEnabled(!hapticEnabled)}
            className={`px-3 py-2 text-xs rounded border font-mono ${
              hapticEnabled
                ? 'bg-indigo-900 border-indigo-700 text-indigo-300'
                : 'bg-gray-800 border-gray-700 text-gray-500'
            }`}
          >
            HAPTIC {hapticEnabled ? 'ON' : 'OFF'}
          </button>
        )}

        {/* Task resolved */}
        {recoveryState === 'TELEOPERATION' && (
          <button
            onClick={resolveTask}
            disabled={!inTeleopLongEnough}
            title={!inTeleopLongEnough ? 'Wait at least 5s in TELEOPERATION' : ''}
            className={`px-4 py-2 text-sm font-bold rounded border font-mono ${
              inTeleopLongEnough
                ? 'bg-green-700 hover:bg-green-600 text-green-100 border-green-600'
                : 'bg-gray-800 text-gray-600 border-gray-700 cursor-not-allowed'
            }`}
          >
            TASK RESOLVED {inTeleopLongEnough ? '✓' : `(${5 - teleOpSeconds}s)`}
          </button>
        )}

        {/* E-Stop */}
        {['ALERT_PENDING', 'TELEOPERATION', 'DEFERRED_QUEUE'].includes(recoveryState) && (
          <div className="relative">
            <button
              onMouseDown={startEStop}
              onMouseUp={cancelEStop}
              onMouseLeave={cancelEStop}
              className="px-4 py-2 bg-red-800 hover:bg-red-700 text-red-100 text-sm font-bold rounded border border-red-600 font-mono relative overflow-hidden"
            >
              {eStopHolding && (
                <div
                  className="absolute inset-0 bg-red-500 opacity-40 transition-none"
                  style={{ width: `${eStopProgress}%` }}
                />
              )}
              <span className="relative">E-STOP {eStopHolding ? '(hold)' : '[hold]'}</span>
            </button>
          </div>
        )}

        {/* Reset from safe stop */}
        {recoveryState === 'SAFE_STOP' && (
          <button
            onClick={resetFromSafeStop}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm font-bold rounded border border-gray-600 font-mono"
          >
            FLOOR CLEAR — RESET
          </button>
        )}

        {/* Latency display */}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-gray-500 font-mono">LATENCY</span>
          <span className={`text-sm font-bold font-mono ${latencyColor}`}>{latencyMs}ms</span>
          <div className={`w-2 h-2 rounded-full ${latencyMs < 80 ? 'bg-green-500' : latencyMs < 150 ? 'bg-yellow-500' : 'bg-red-500'}`} />
        </div>
      </div>
    </div>
  )
}
