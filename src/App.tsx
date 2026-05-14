import { useEffect } from 'react'
import { useCockpitStore } from './store/cockpitStore'
import { StateBanner } from './components/StateBanner'
import { CameraFeed } from './components/CameraFeed'
import { ConfidenceChart } from './components/ConfidenceChart'
import { ForceChart } from './components/ForceChart'
import { MiniMap } from './components/MiniMap'
import { ControlBar } from './components/ControlBar'
import { PreFailureContext } from './components/PreFailureContext'
import { TaggingModal } from './components/TaggingModal'
import { ConfidenceModel } from './simulation/ConfidenceModel'
import { LatencySimulator } from './simulation/LatencySimulator'
import { RobotSimulator } from './simulation/RobotSimulator'

const confidenceModel = new ConfidenceModel()
const latencySimulator = new LatencySimulator()
const robotSimulator = new RobotSimulator()

export default function App() {
  const {
    recoveryState,
    updateConfidenceTelemetry,
    updateForceTelemetry,
    updateLatency,
    updateBoundingBox,
    confidenceHistory,
  } = useCockpitStore()

  // Reset/start failure simulation when state changes
  useEffect(() => {
    if (recoveryState === 'AUTONOMOUS') {
      confidenceModel.reset()
    }
    if (recoveryState === 'ALERT_PENDING') {
      confidenceModel.startFailure()
    }
  }, [recoveryState])

  // Main simulation loop at 10Hz
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()

      // Confidence telemetry
      const conf = confidenceModel.next()
      updateConfidenceTelemetry({ timestamp: now, value: conf })

      // Force telemetry (simulated)
      const baseForce = recoveryState === 'TELEOPERATION' ? 8 : 3
      const force = Math.max(0, baseForce + (Math.random() - 0.5) * 4)
      updateForceTelemetry({ timestamp: now, value: force })

      // Latency
      const latency = latencySimulator.next()
      updateLatency(latency)

      // Bounding box
      const box = robotSimulator.getBoundingBox()
      const velocity = robotSimulator.getVelocitySample()
      updateBoundingBox(box, velocity)
    }, 100) // 10Hz

    return () => clearInterval(interval)
  }, [recoveryState, confidenceHistory, updateConfidenceTelemetry, updateForceTelemetry, updateLatency, updateBoundingBox])

  const isTrainingQueue = recoveryState === 'TRAINING_QUEUE'
  const isSafeStop = recoveryState === 'SAFE_STOP'

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <StateBanner />

      {/* Training queue flash */}
      {isTrainingQueue && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="text-4xl font-mono text-teal-400 font-bold">TRAINING_QUEUE</div>
            <div className="text-gray-400 font-mono text-sm">Episode packaged and submitted</div>
            <div className="text-gray-600 font-mono text-xs">Returning to AUTONOMOUS...</div>
          </div>
        </div>
      )}

      {/* Safe stop overlay */}
      {isSafeStop && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="text-5xl font-mono text-red-400 font-bold animate-pulse">SAFE STOP</div>
            <div className="text-gray-300 font-mono text-sm">Robot halted in safe configuration</div>
            <div className="text-gray-500 font-mono text-xs">Awaiting floor personnel acknowledgment</div>
          </div>
        </div>
      )}

      {/* Main cockpit layout */}
      {!isTrainingQueue && !isSafeStop && (
        <div className="flex-1 grid grid-cols-2 gap-0 overflow-hidden" style={{ gridTemplateRows: '1fr auto' }}>
          {/* Left column */}
          <div className="flex flex-col p-3 gap-3 border-r border-gray-800">
            <CameraFeed />

            {/* AUTONOMOUS state hint */}
            {recoveryState === 'AUTONOMOUS' && (
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-center">
                <p className="text-gray-400 font-mono text-sm">Robot operating autonomously</p>
                <p className="text-gray-600 font-mono text-xs mt-1">
                  Confidence monitoring active at 10Hz
                </p>
                <p className="text-yellow-600 font-mono text-xs mt-2">
                  Click SIMULATE FAILURE below to begin demo
                </p>
              </div>
            )}

            {/* Deferred queue info */}
            {recoveryState === 'DEFERRED_QUEUE' && (
              <div className="bg-orange-950 border border-orange-800 rounded-lg p-3">
                <p className="text-orange-300 font-mono text-sm font-bold">DEFERRED QUEUE</p>
                <p className="text-orange-400 font-mono text-xs mt-1">
                  Latency too high for immediate handoff. Robot holding safe position.
                </p>
                <p className="text-orange-500 font-mono text-xs mt-1">
                  SLA timer: 5:00 remaining · Scene preserved · Buffer: 60s
                </p>
                <p className="text-orange-600 font-mono text-xs mt-1">
                  Click SIMULATE HIGH LATENCY → restore → ACCEPT HANDOFF to demo path
                </p>
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="flex flex-col p-3 gap-3">
            <ConfidenceChart />
            <ForceChart />
            <MiniMap />
            <PreFailureContext />
          </div>
        </div>
      )}

      <ControlBar />
      <TaggingModal />
    </div>
  )
}
