import React from 'react'
import { AreaChart, Area, XAxis, YAxis, ReferenceLine, ResponsiveContainer, Tooltip } from 'recharts'
import { useCockpitStore } from '../store/cockpitStore'

export const ForceChart: React.FC = () => {
  const { forceHistory } = useCockpitStore()
  const now = Date.now()
  const windowMs = 10_000
  const data = forceHistory
    .filter(p => p.timestamp > now - windowMs)
    .map(p => ({
      t: ((p.timestamp - now + windowMs) / 1000).toFixed(1),
      value: Math.round(p.value * 100) / 100,
    }))

  return (
    <div className="bg-gray-900 rounded-lg p-3 border border-gray-800">
      <div className="text-xs text-gray-400 font-mono mb-2">FORCE READING (500ms avg) — N</div>
      <ResponsiveContainer width="100%" height={80}>
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <XAxis dataKey="t" tick={{ fontSize: 8, fill: '#6b7280' }} interval={4} />
          <YAxis domain={[0, 20]} tick={{ fontSize: 8, fill: '#6b7280' }} tickCount={3} />
          <ReferenceLine y={15} stroke="rgba(239,68,68,0.5)" strokeDasharray="4 3" />
          <Tooltip
            contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 4 }}
            labelStyle={{ color: '#9ca3af', fontSize: 10 }}
            itemStyle={{ color: '#818cf8', fontSize: 10 }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#818cf8"
            fill="rgba(129,140,248,0.15)"
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
