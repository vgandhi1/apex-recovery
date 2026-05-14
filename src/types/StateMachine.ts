export type RecoveryState =
  | 'AUTONOMOUS'
  | 'ALERT_PENDING'
  | 'TELEOPERATION'
  | 'SAFE_STOP'
  | 'DEFERRED_QUEUE'
  | 'TAGGING'
  | 'TRAINING_QUEUE'

export interface TelemetryPoint {
  timestamp: number
  value: number
}

export interface TagSubmission {
  failureType: string
  secondaryTags: string[]
  recoveryQuality: number
  policyNearRecovery: boolean
  hapticUsed: boolean
  notes: string
  classifierSuggestion: string
  classifierConfidence: number
  overriddenSuggestion: boolean
}

export interface VelocitySample {
  vx: number
  vy: number
  timestamp: number
}

export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}
