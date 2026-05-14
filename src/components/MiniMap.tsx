import React from 'react'
import { useCockpitStore } from '../store/cockpitStore'

export const MiniMap: React.FC = () => {
  const { robotPosition } = useCockpitStore()
  const W = 200
  const H = 160
  const rx = robotPosition.x * W
  const ry = robotPosition.y * H

  return (
    <div className="bg-gray-900 rounded-lg p-3 border border-gray-800">
      <div className="text-xs text-gray-400 font-mono mb-2">MINI-MAP (workspace overhead)</div>
      <svg width={W} height={H} className="w-full rounded border border-gray-800 bg-gray-950">
        {/* Workspace boundary */}
        <rect x={10} y={10} width={W - 20} height={H - 20} fill="none" stroke="#374151" strokeWidth={1} strokeDasharray="4 3" />
        {/* No-go zones */}
        <rect x={10} y={10} width={30} height={30} fill="rgba(239,68,68,0.1)" stroke="rgba(239,68,68,0.3)" strokeWidth={1} />
        <text x={14} y={30} fill="rgba(239,68,68,0.5)" fontSize={8} fontFamily="monospace">NO-GO</text>
        {/* Robot base */}
        <circle cx={W / 2} cy={H - 20} r={8} fill="#374151" stroke="#6b7280" strokeWidth={1.5} />
        <text x={W / 2 - 10} y={H - 6} fill="#6b7280" fontSize={7} fontFamily="monospace">BASE</text>
        {/* End-effector */}
        <circle cx={rx} cy={ry} r={5} fill="#3b82f6" stroke="#93c5fd" strokeWidth={1.5} />
        {/* Target object */}
        <rect x={120} y={60} width={16} height={14} fill="rgba(251,191,36,0.2)" stroke="rgba(251,191,36,0.6)" strokeWidth={1} />
        <text x={112} y={56} fill="rgba(251,191,36,0.7)" fontSize={7} fontFamily="monospace">TARGET</text>
        {/* Line from base to EEF */}
        <line x1={W / 2} y1={H - 20} x2={rx} y2={ry} stroke="rgba(59,130,246,0.3)" strokeWidth={1} strokeDasharray="2 2" />
      </svg>
    </div>
  )
}
