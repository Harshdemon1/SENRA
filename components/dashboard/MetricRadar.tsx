'use client'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts'
import type { StateScore } from '@/lib/types'
import { DIMENSIONS, BAND_COLORS } from '@/lib/constants'

interface MetricRadarProps {
  states: StateScore[]
}

export function MetricRadar({ states }: MetricRadarProps) {
  const data = DIMENSIONS.map(dim => {
    const entry: Record<string, string | number> = { dim: dim.label }
    states.forEach(s => {
      entry[s.slug] = s.subscores[dim.key]
    })
    return entry
  })

  const colors = [BAND_COLORS.HIGH, BAND_COLORS.MODERATE, BAND_COLORS.LOW, BAND_COLORS.CRITICAL]

  return (
    <ResponsiveContainer width="100%" height={320}>
      <RadarChart data={data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
        <PolarGrid stroke="#282828" />
        <PolarAngleAxis
          dataKey="dim"
          tick={{ fill: '#857E74', fontSize: 11, fontFamily: 'Bricolage Grotesque' }}
        />
        <Tooltip
          contentStyle={{ background: '#171717', border: '1px solid #282828', borderRadius: 8 }}
          labelStyle={{ color: '#EAE5DB' }}
        />
        {states.map((state, i) => (
          <Radar
            key={state.slug}
            name={state.state}
            dataKey={state.slug}
            stroke={colors[i % colors.length]}
            fill={colors[i % colors.length]}
            fillOpacity={0.1}
            strokeWidth={2}
          />
        ))}
      </RadarChart>
    </ResponsiveContainer>
  )
}
