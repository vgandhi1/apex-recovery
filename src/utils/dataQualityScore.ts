// Failure types that represent real-world conditions the simulator cannot model.
// Each tagged episode of these types is a labeled counterexample to a specific
// simulator assumption — the highest-value input for sim-to-real fine-tuning.
export const SIM_GAP_FAILURE_TYPES = new Set(['LIGHTING', 'OBJ_NOVEL', 'COLLAB_CONFLICT'])

export function computeDataQualityScore(
  recoveryQuality: number,
  latencyMs: number,
  failureType: string,
  taggingComplete: boolean
): number {
  const qualityComponent = (recoveryQuality / 5) * 50
  const latencyComponent = Math.max(0, 30 - ((latencyMs - 50) / 5))
  const taggingComponent = taggingComplete ? 10 : 0
  const simGapBonus = SIM_GAP_FAILURE_TYPES.has(failureType) || failureType === 'UNKNOWN' ? 10 : 0
  return Math.min(100, Math.round(qualityComponent + latencyComponent + taggingComponent + simGapBonus))
}
