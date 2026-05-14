import { create } from 'zustand'
import { RecoveryState, TelemetryPoint, TagSubmission, BoundingBox, VelocitySample } from '../types/StateMachine'
import { buildEpisodePayload, downloadEpisodeJSON } from '../utils/episodePackager'

interface CockpitStore {
  recoveryState: RecoveryState
  episodeId: string
  robotId: string
  confidenceHistory: TelemetryPoint[]
  forceHistory: TelemetryPoint[]
  latencyMs: number
  robotPosition: { x: number; y: number; z: number }
  alertFiredAt: Date | null
  recoveryStartedAt: Date | null
  recoveryEndedAt: Date | null
  sessionStartedAt: Date
  operatorId: string
  cameraMode: 'wrist' | 'external'
  hapticEnabled: boolean
  currentBox: BoundingBox
  velocityHistory: VelocitySample[]
  confidenceAtAlert: number
  confidenceTrend: number[]

  triggerAlert: () => void
  acceptHandoff: () => void
  simulateHighLatency: () => void
  resolveTask: () => void
  submitTags: (tags: TagSubmission) => void
  triggerEStop: () => void
  resetFromSafeStop: () => void
  setCameraMode: (mode: 'wrist' | 'external') => void
  setHapticEnabled: (enabled: boolean) => void
  updateConfidenceTelemetry: (point: TelemetryPoint) => void
  updateForceTelemetry: (point: TelemetryPoint) => void
  updateLatency: (ms: number) => void
  updateBoundingBox: (box: BoundingBox, velocity: VelocitySample) => void
}

export const useCockpitStore = create<CockpitStore>((set, get) => ({
  recoveryState: 'AUTONOMOUS',
  episodeId: `REC_${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`,
  robotId: 'ROBOT_03',
  confidenceHistory: [],
  forceHistory: [],
  latencyMs: 82,
  robotPosition: { x: 0.45, y: 0.12, z: 0.08 },
  alertFiredAt: null,
  recoveryStartedAt: null,
  recoveryEndedAt: null,
  sessionStartedAt: new Date(),
  operatorId: 'OP_007',
  cameraMode: 'wrist',
  hapticEnabled: true,
  currentBox: { x: 250, y: 135, width: 60, height: 50 },
  velocityHistory: [],
  confidenceAtAlert: 0,
  confidenceTrend: [],

  triggerAlert: () => {
    const { confidenceHistory } = get()
    const recent5 = confidenceHistory.slice(-5).map(p => Math.round(p.value * 100) / 100)
    const current = confidenceHistory[confidenceHistory.length - 1]?.value ?? 0.58
    set({
      recoveryState: 'ALERT_PENDING',
      alertFiredAt: new Date(),
      confidenceAtAlert: current,
      confidenceTrend: recent5,
    })
  },

  acceptHandoff: () => {
    const { latencyMs } = get()
    if (latencyMs > 150) {
      set({ recoveryState: 'DEFERRED_QUEUE' })
    } else {
      set({ recoveryState: 'TELEOPERATION', recoveryStartedAt: new Date() })
    }
  },

  simulateHighLatency: () => {
    set({ latencyMs: 210 })
    setTimeout(() => set({ latencyMs: 82 }), 10000)
  },

  resolveTask: () => {
    set({ recoveryState: 'TAGGING', recoveryEndedAt: new Date() })
  },

  submitTags: (tags) => {
    const state = get()
    const episode = buildEpisodePayload(state, tags)
    downloadEpisodeJSON(episode)
    set({ recoveryState: 'TRAINING_QUEUE' })
    setTimeout(() => {
      set({
        recoveryState: 'AUTONOMOUS',
        episodeId: `REC_${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`,
        alertFiredAt: null,
        recoveryStartedAt: null,
        recoveryEndedAt: null,
        confidenceAtAlert: 0,
        confidenceTrend: [],
      })
    }, 3000)
  },

  triggerEStop: () => {
    set({ recoveryState: 'SAFE_STOP' })
  },

  resetFromSafeStop: () => {
    set({
      recoveryState: 'AUTONOMOUS',
      alertFiredAt: null,
      recoveryStartedAt: null,
      recoveryEndedAt: null,
      episodeId: `REC_${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`,
    })
  },

  setCameraMode: (mode) => set({ cameraMode: mode }),
  setHapticEnabled: (enabled) => set({ hapticEnabled: enabled }),

  updateConfidenceTelemetry: (point) => {
    set((state) => ({
      confidenceHistory: [...state.confidenceHistory.slice(-300), point],
    }))
  },

  updateForceTelemetry: (point) => {
    set((state) => ({
      forceHistory: [...state.forceHistory.slice(-200), point],
    }))
  },

  updateLatency: (ms) => set({ latencyMs: ms }),

  updateBoundingBox: (box, velocity) => {
    set((state) => ({
      currentBox: box,
      velocityHistory: [...state.velocityHistory.slice(-10), velocity],
    }))
  },
}))
