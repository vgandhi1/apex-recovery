import React from 'react'
import {
  LineChart, Line, XAxis, YAxis, ReferenceLine, Tooltip, ResponsiveContainer
} from 'recharts'
import { useCockpitStore } from '../store/cockpitStore'

const THRESHOLD = 0.65

export const ConfidenceChart: React.FC = () => {
  const { confidenceHistory, alertFiredAt } = useCockpitStore()
  const now = Date.now()
  const windowMs = 30_000
  const data = confidenceHistory
    .filter(p => p.timestamp > now - windowMs)
    .map(p => ({
      t: ((p.timestamp - now + windowMs) / 1000).toFixed(1),
      value: Math.round(p.value * 1000) / 1000,
    }))

  const alertRelative = alertFiredAt
    ? ((alertFiredAt.getTime() - now + windowMs) / 1000).toFixed(1)
    : null

  return (
    <div className="bg-gray-900 rounded-lg p-3 border border-gray-800">
      <div className="text-xs text-gray-400 font-mono mb-2">CONFIDENCE SCORE — last 30s</div>
      <ResponsiveContainer width="100%" height={100}>
        <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <XAxis dataKey="t" tick={{ fontSize: 8, fill: '#6b7280' }} interval={9} />
          <YAxis domain={[0, 1]} tick={{ fontSize: 8, fill: '#6b7280' }} tickCount={3} />
          <ReferenceLine y={THRESHOLD} stroke="rgba(239,68,68,0.6)" strokeDasharray="4 3" />
          {alertRelative && (
            <ReferenceLine x={alertRelative} stroke="rgba(251,191,36,0.8)" strokeDasharray="3 3"
              label={{ value: 'ALERT', position: 'top', fill: '#fbbf24', fontSize: 8 }} />
          )}
          <Tooltip
            contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 4 }}
            labelStyle={{ color: '#9ca3af', fontSize: 10 }}
            itemStyle={{ color: '#60a5fa', fontSize: 10 }}
          />
          <Line
            type="monotone"
            dataKey="value"
            dot={false}
            strokeWidth={2}
            stroke="#22c55e"
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
