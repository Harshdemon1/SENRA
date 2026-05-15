'use client'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer,
} from 'recharts'
import type { ScorePoint } from '@/lib/types'
import { BAND_COLORS } from '@/lib/constants'

interface TrendChartProps {
  data: ScorePoint[]
}

export function TrendChart({ data }: TrendChartProps) {
  const formatted = [...data]
    .reverse()
    .map(p => ({ ...p, date: new Date(p.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={formatted} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" />
        <XAxis dataKey="date" tick={{ fill: '#4A4540', fontSize: 10 }} />
        <YAxis domain={[0, 100]} tick={{ fill: '#4A4540', fontSize: 10 }} width={28} />
        <Tooltip
          contentStyle={{ background: '#171717', border: '1px solid #282828', borderRadius: 8 }}
          labelStyle={{ color: '#EAE5DB' }}
        />
        <ReferenceLine y={70} stroke={BAND_COLORS.CRITICAL} strokeDasharray="4 4" strokeOpacity={0.5} />
        <ReferenceLine y={50} stroke={BAND_COLORS.HIGH}     strokeDasharray="4 4" strokeOpacity={0.5} />
        <ReferenceLine y={30} stroke={BAND_COLORS.MODERATE} strokeDasharray="4 4" strokeOpacity={0.5} />
        <Line
          type="monotone"
          dataKey="score"
          stroke="#E0981E"
          strokeWidth={2}
          dot={{ fill: '#E0981E', r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
