'use client'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import type { StateScore } from '@/lib/types'
import { Badge } from '@/components/ui/Badge'
import { ScoreBar } from '@/components/ui/ScoreBar'
import { Skeleton } from '@/components/ui/Skeleton'

interface ScoreRankingProps {
  states?: StateScore[]
  isLoading?: boolean
}

export function ScoreRanking({ states, isLoading }: ScoreRankingProps) {
  const router = useRouter()

  if (isLoading || !states) {
    return (
      <div className="flex flex-col gap-2 p-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} height={44} className="w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="overflow-y-auto flex-1">
      {states.map((state, i) => (
        <motion.div
          key={state.slug}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.025, duration: 0.3 }}
          className="flex items-center gap-3 px-4 py-2.5 hover:bg-bg-hover cursor-pointer border-b border-border-subtle transition-colors"
          onClick={() => router.push(`/state/${state.slug}`)}
        >
          <span className="numeric text-xs text-text-tertiary w-5 text-right flex-shrink-0">
            {state.rank}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-text-primary truncate">{state.state}</span>
              <Badge band={state.band} />
            </div>
            <ScoreBar score={state.score} band={state.band} />
          </div>
          <span className="numeric text-sm text-text-primary w-8 text-right flex-shrink-0">
            {state.score.toFixed(0)}
          </span>
        </motion.div>
      ))}
    </div>
  )
}
