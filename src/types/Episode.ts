export interface EpisodeMetadata {
  schema_version: string
  episode: {
    episode_id: string
    robot_id: string
    collection_site: string
    task_type: string
    nominal_policy_id: string
    episode_start_utc: string | undefined
    failure_detected_utc: string | undefined
    recovery_start_utc: string | undefined
    recovery_end_utc: string | undefined
    episode_end_utc: string | undefined
  }
  failure: {
    failure_type: string
    failure_type_source: string
    classifier_suggestion: string
    classifier_confidence: number
    confidence_at_alert: number
    confidence_trend_5s: number[]
    secondary_tags: string[]
    pre_failure_buffer_seconds: number
  }
  recovery: {
    operator_id: string
    operator_latency_ms: number
    recovery_duration_seconds: number
    haptic_feedback_used: boolean
    camera_mode_used: string
    estop_triggered: boolean
    recovery_quality_self_assessed: number
    policy_was_near_recovery: boolean
    notes: string | null
  }
  data_quality: {
    data_quality_score: number
    training_priority: string
    usable_for_training: boolean
    exclusion_reason: string | null
  }
  routing: {
    alert_to_accept_seconds: number
    deferred_queue_time_seconds: number
    operators_alerted_before_accept: number
  }
  artifacts: {
    video_wrist_uri: string
    video_external_uri: string
    trajectory_uri: string
    force_log_uri: string
  }
}
