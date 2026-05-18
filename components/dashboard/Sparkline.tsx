interface SparklineProps {
  data: { year: number; score: number }[]
  width?: number
  height?: number
  color?: string
}

export function Sparkline({ data, width = 120, height = 32, color = '#E0981E' }: SparklineProps) {
  if (data.length < 2) return null

  const scores = data.map(d => d.score)
  const min = Math.min(...scores)
  const max = Math.max(...scores)
  const range = max - min || 1

  const pad = 4
  const w = width - pad * 2
  const h = height - pad * 2

  const points = data.map((d, i) => {
    const x = pad + (i / (data.length - 1)) * w
    const y = pad + (1 - (d.score - min) / range) * h
    return `${x},${y}`
  })

  const lastScore = scores[scores.length - 1]
  const lastY = pad + (1 - (lastScore - min) / range) * h
  const lastX = pad + w

  return (
    <svg width={width} height={height} aria-hidden>
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={lastX} cy={lastY} r="2.5" fill={color} />
    </svg>
  )
}
