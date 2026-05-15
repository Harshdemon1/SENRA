import { clsx } from 'clsx'
import type { Band } from '@/lib/types'
import { BAND_COLORS, BAND_BG_COLORS } from '@/lib/constants'

interface BadgeProps {
  band: Band | 'neutral'
  className?: string
}

export function Badge({ band, className }: BadgeProps) {
  const color  = band === 'neutral' ? '#857E74' : BAND_COLORS[band]
  const bgColor = band === 'neutral' ? '#1A1A1A' : BAND_BG_COLORS[band]

  return (
    <span
      className={clsx('numeric text-[10px] tracking-widest px-2 py-0.5 rounded uppercase font-medium', className)}
      style={{ color, background: bgColor, border: `1px solid ${color}22` }}
    >
      {band}
    </span>
  )
}
