export function computeDataQualityScore(
  recoveryQuality: number,
  latencyMs: number,
  failureType: string,
  taggingComplete: boolean
): number {
  const qualityComponent = (recoveryQuality / 5) * 50
  const latencyComponent = Math.max(0, 30 - ((latencyMs - 50) / 5))
  const taggingComponent = taggingComplete ? 10 : 0
  const noveltyBonus = failureType === 'OBJ_NOVEL' || failureType === 'UNKNOWN' ? 10 : 0
  return Math.min(100, Math.round(qualityComponent + latencyComponent + taggingComponent + noveltyBonus))
}
