import { TagSubmission } from '../types/StateMachine'

interface StoreSnapshot {
  episodeId: string
  robotId: string
  alertFiredAt: Date | null
  recoveryStartedAt: Date | null
  recoveryEndedAt: Date | null
  sessionStartedAt: Date
  latencyMs: number
  operatorId: string
  cameraMode: string
  hapticEnabled: boolean
  confidenceTrend: number[]
  confidenceAtAlert: number
}

export function buildEpisodePayload(state: StoreSnapshot, tags: TagSubmission) {
  const recoveryDuration =
    state.recoveryEndedAt && state.recoveryStartedAt
      ? (state.recoveryEndedAt.getTime() - state.recoveryStartedAt.getTime()) / 1000
      : 0

  const alertToAccept =
    state.recoveryStartedAt && state.alertFiredAt
      ? (state.recoveryStartedAt.getTime() - state.alertFiredAt.getTime()) / 1000
      : 0

  const latencyScore = Math.max(0, 100 - (state.latencyMs - 50) * 1.0)
  const qualityScore = Math.round(
    (tags.recoveryQuality / 5) * 60 +
    latencyScore * 0.3 +
    (tags.failureType !== 'UNKNOWN' ? 10 : 0)
  )

  const now = new Date().toISOString()

  return {
    $schema: 'https://schema.robotics.internal/recovery-episode/v1.0.json',
    schema_version: '1.0',
    episode: {
      episode_id: state.episodeId,
      robot_id: state.robotId,
      collection_site: 'normal-il-factory-01',
      task_type: 'assembly',
      nominal_policy_id: 'vla-v2.3-assembly',
      episode_start_utc: state.sessionStartedAt.toISOString(),
      failure_detected_utc: state.alertFiredAt?.toISOString() ?? now,
      recovery_start_utc: state.recoveryStartedAt?.toISOString() ?? now,
      recovery_end_utc: state.recoveryEndedAt?.toISOString() ?? now,
      episode_end_utc: now,
    },
    failure: {
      failure_type: tags.failureType,
      failure_type_source: tags.overriddenSuggestion ? 'operator' : 'classifier_confirmed',
      classifier_suggestion: tags.classifierSuggestion,
      classifier_confidence: tags.classifierConfidence,
      confidence_at_alert: state.confidenceAtAlert,
      confidence_trend_5s: state.confidenceTrend,
      secondary_tags: tags.secondaryTags,
      pre_failure_buffer_seconds: 60,
    },
    recovery: {
      operator_id: state.operatorId,
      operator_latency_ms: state.latencyMs,
      recovery_duration_seconds: Math.round(recoveryDuration * 10) / 10,
      haptic_feedback_used: tags.hapticUsed,
      camera_mode_used: state.cameraMode,
      estop_triggered: false,
      recovery_quality_self_assessed: tags.recoveryQuality,
      policy_was_near_recovery: tags.policyNearRecovery,
      notes: tags.notes || null,
    },
    data_quality: {
      data_quality_score: qualityScore,
      training_priority: qualityScore >= 80 ? 'high' : qualityScore >= 60 ? 'medium' : 'low',
      usable_for_training: qualityScore >= 50 && tags.failureType !== 'ESTOP',
      exclusion_reason: null,
    },
    routing: {
      alert_to_accept_seconds: Math.round(alertToAccept * 10) / 10,
      deferred_queue_time_seconds: 0,
      operators_alerted_before_accept: 1,
    },
    artifacts: {
      video_wrist_uri: `s3://training-data/recovery/${state.episodeId}/wrist.mp4`,
      video_external_uri: `s3://training-data/recovery/${state.episodeId}/external.mp4`,
      trajectory_uri: `s3://training-data/recovery/${state.episodeId}/trajectory.npy`,
      force_log_uri: `s3://training-data/recovery/${state.episodeId}/force.csv`,
    },
  }
}

export function downloadEpisodeJSON(episode: object) {
  const blob = new Blob([JSON.stringify(episode, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${(episode as Record<string, Record<string, string>>).episode?.episode_id ?? 'episode'}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
