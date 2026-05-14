import React, { useState } from 'react'
import { useCockpitStore } from '../store/cockpitStore'
import { TagSubmission } from '../types/StateMachine'

const FAILURE_TYPES = [
  { code: 'GRASP_FAIL', label: 'Grasp Failure' },
  { code: 'SCENE_OCCL', label: 'Scene Occlusion' },
  { code: 'OBJ_NOVEL', label: 'Novel Object' },
  { code: 'LIGHTING', label: 'Lighting Change' },
  { code: 'POSE_LIMIT', label: 'Kinematic Limit' },
  { code: 'COLLAB_CONFLICT', label: 'Collaborative Conflict' },
  { code: 'ESTOP', label: 'Emergency Stop' },
  { code: 'UNKNOWN', label: 'Unknown / Unclassified' },
]

const SECONDARY_TAGS = [
  'regrasp_required',
  'trajectory_modified',
  'environment_altered',
  'policy_near_recovery',
  'high_latency_compensated',
  'haptic_feedback_critical',
]

export const TaggingModal: React.FC = () => {
  const { recoveryState, episodeId, submitTags, hapticEnabled } = useCockpitStore()
  const [failureType, setFailureType] = useState('GRASP_FAIL')
  const [secondaryTags, setSecondaryTags] = useState<string[]>([])
  const [quality, setQuality] = useState(4)
  const [policyNearRecovery, setPolicyNearRecovery] = useState(false)
  const [notes, setNotes] = useState('')

  if (recoveryState !== 'TAGGING') return null

  const toggleTag = (tag: string) => {
    setSecondaryTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const handleSubmit = () => {
    const submission: TagSubmission = {
      failureType,
      secondaryTags,
      recoveryQuality: quality,
      policyNearRecovery,
      hapticUsed: hapticEnabled,
      notes,
      classifierSuggestion: 'GRASP_FAIL',
      classifierConfidence: 0.72,
      overriddenSuggestion: failureType !== 'GRASP_FAIL',
    }
    submitTags(submission)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg shadow-2xl">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-white font-bold text-lg font-mono">TAG THIS RECOVERY EPISODE</h2>
          <p className="text-gray-400 text-xs font-mono mt-0.5">
            {episodeId} · Assembly · Recovery complete
          </p>
        </div>

        <div className="px-6 py-4 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Primary failure type */}
          <div>
            <label className="block text-xs text-gray-400 font-mono mb-2 uppercase tracking-wider">
              Primary Failure Type
            </label>
            <div className="space-y-1.5">
              {FAILURE_TYPES.map(ft => (
                <label key={ft.code} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="failureType"
                    value={ft.code}
                    checked={failureType === ft.code}
                    onChange={() => setFailureType(ft.code)}
                    className="text-blue-500"
                  />
                  <span className={`text-sm font-mono ${failureType === ft.code ? 'text-white' : 'text-gray-400'}`}>
                    {ft.code}
                  </span>
                  <span className="text-xs text-gray-600">{ft.label}</span>
                  {ft.code === 'GRASP_FAIL' && (
                    <span className="ml-auto text-xs text-blue-400 font-mono">(suggested 72%)</span>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Secondary tags */}
          <div>
            <label className="block text-xs text-gray-400 font-mono mb-2 uppercase tracking-wider">
              Secondary Tags (optional)
            </label>
            <div className="flex flex-wrap gap-2">
              {SECONDARY_TAGS.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-2 py-1 text-xs rounded border font-mono transition-colors ${
                    secondaryTags.includes(tag)
                      ? 'bg-blue-900 border-blue-600 text-blue-200'
                      : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Recovery quality */}
          <div>
            <label className="block text-xs text-gray-400 font-mono mb-2 uppercase tracking-wider">
              Recovery Quality (self-assessed)
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => setQuality(star)}
                  className={`text-xl transition-colors ${star <= quality ? 'text-yellow-400' : 'text-gray-700'}`}
                >
                  &#9733;
                </button>
              ))}
              <span className="text-xs text-gray-500 font-mono ml-2 self-center">({quality}/5)</span>
            </div>
          </div>

          {/* Policy near recovery toggle */}
          <div className="flex items-center justify-between">
            <label className="text-xs text-gray-400 font-mono uppercase tracking-wider">
              Policy was almost recovering on its own?
            </label>
            <button
              onClick={() => setPolicyNearRecovery(!policyNearRecovery)}
              className={`px-3 py-1 text-xs rounded border font-mono ${
                policyNearRecovery
                  ? 'bg-green-900 border-green-700 text-green-300'
                  : 'bg-gray-800 border-gray-700 text-gray-400'
              }`}
            >
              {policyNearRecovery ? 'Yes' : 'No'}
            </button>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs text-gray-400 font-mono mb-1 uppercase tracking-wider">
              Notes (optional)
            </label>
            <div className="relative">
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value.slice(0, 280))}
                rows={2}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 font-mono resize-none focus:outline-none focus:border-blue-600"
                placeholder="Optional observation..."
              />
              <span className="absolute bottom-2 right-2 text-xs text-gray-600">{notes.length}/280</span>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-800">
          <button
            onClick={handleSubmit}
            className="w-full py-3 bg-blue-700 hover:bg-blue-600 text-white font-bold rounded-lg font-mono text-sm transition-colors"
          >
            SUBMIT EPISODE &rarr;
          </button>
        </div>
      </div>
    </div>
  )
}
