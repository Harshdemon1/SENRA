'use client'
import { useEffect, useRef, useState } from 'react'
import type { Band } from '@/lib/types'
import { BAND_COLORS } from '@/lib/constants'

interface ScoreBarProps {
  score: number
  band: Band
  showLabel?: boolean
}

export function ScoreBar({ score, band, showLabel = true }: ScoreBarProps) {
  const [width, setWidth] = useState(0)
  const mounted = useRef(false)

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      requestAnimationFrame(() => setWidth(score))
    } else {
      setWidth(score)
    }
  }, [score])

  return (
    <div className="flex items-center gap-2">
      <div className="score-bar-track flex-1">
        <div
          className="score-bar-fill"
          style={{ width: `${width}%`, background: BAND_COLORS[band] }}
        />
      </div>
      {showLabel && (
        <span className="numeric text-xs text-text-secondary w-8 text-right">{score.toFixed(0)}</span>
      )}
    </div>
  )
}
