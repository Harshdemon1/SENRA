import type { Band } from './types'
import { BAND_COLORS } from './constants'

export function getRiskBand(score: number): Band {
  if (score >= 70) return 'CRITICAL'
  if (score >= 50) return 'HIGH'
  if (score >= 30) return 'MODERATE'
  return 'LOW'
}

export function getRiskColor(score: number | null): string {
  if (score === null) return '#1A1A1A'
  return BAND_COLORS[getRiskBand(score)]
}

export function getLighterRiskColor(score: number): string {
  const hex = getRiskColor(score).replace('#', '')
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  const blend = (c: number) => Math.round(c + (255 - c) * 0.2)
  return `rgb(${blend(r)}, ${blend(g)}, ${blend(b)})`
}
