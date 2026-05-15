'use client'
import { Badge } from '@/components/ui/Badge'
import type { StateScore } from '@/lib/types'

interface StateTooltipProps {
  state: StateScore
  x: number
  y: number
}

export function StateTooltip({ state, x, y }: StateTooltipProps) {
  return (
    <div
      className="fixed pointer-events-none z-50 bg-bg-elevated border border-border-default rounded-xl p-3 shadow-2xl w-48"
      style={{ left: x + 12, top: y - 8 }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-text-primary truncate">{state.state}</span>
        <Badge band={state.band} />
      </div>
      <div className="flex items-baseline gap-1 mb-1">
        <span className="numeric text-2xl font-medium text-text-primary">{state.score.toFixed(0)}</span>
        <span className="text-xs text-text-secondary">/100</span>
      </div>
      <div className="flex justify-between text-xs text-text-tertiary">
        <span>Rank #{state.rank}</span>
        <span>{state.confidence.toFixed(0)}% conf.</span>
      </div>
      {state.confidence < 60 && (
        <div className="mt-2 text-[10px] text-high border border-high/30 bg-high-bg rounded px-1.5 py-0.5">
          Low confidence — some data estimated
        </div>
      )}
    </div>
  )
}
