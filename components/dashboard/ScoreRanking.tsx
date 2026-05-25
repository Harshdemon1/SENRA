'use client'
import { useState, useMemo } from 'react'
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
  const [sortBy, setSortBy] = useState<'alpha' | 'rank'>('alpha')

  const [search, setSearch] = useState('')

  const sorted = useMemo(() => {
    if (!states) return []
    const filtered = search.trim()
      ? states.filter(s => s.state.toLowerCase().includes(search.trim().toLowerCase()))
      : states
    if (sortBy === 'alpha') return [...filtered].sort((a, b) => a.state.localeCompare(b.state))
    return filtered
  }, [states, sortBy, search])

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
      <div className="senra-search-row px-3 py-2 border-b border-border-subtle flex items-center gap-2">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search states…"
          className="senra-search-input flex-1 bg-bg-elevated border border-border-default rounded-md px-2 py-1 text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent"
        />
        <div className="senra-sort-buttons flex items-center gap-2">
        <button
          onClick={() => setSortBy('alpha')}
          className={`text-xs px-2 py-1 rounded transition-colors flex-shrink-0 ${sortBy === 'alpha' ? 'bg-accent text-bg-void' : 'text-text-secondary hover:text-text-primary border border-border-default'}`}
        >
          A–Z
        </button>
        <button
          onClick={() => setSortBy('rank')}
          className={`text-xs px-2 py-1 rounded transition-colors flex-shrink-0 ${sortBy === 'rank' ? 'bg-accent text-bg-void' : 'text-text-secondary hover:text-text-primary border border-border-default'}`}
        >
          Rank
        </button>
        </div>
      </div>
      {sorted.length === 0 && (
        <div className="px-4 py-6 text-center text-xs text-text-tertiary">No states match "{search}"</div>
      )}
      {sorted.map((state, i) => (
        <motion.div
          key={state.slug}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: Math.min(i * 0.015, 0.3), duration: 0.25 }}
          className="senra-state-row flex items-center gap-3 px-4 py-2.5 hover:bg-bg-hover cursor-pointer border-b border-border-subtle transition-colors"
          onClick={() => router.push(`/state/${state.slug}`)}
        >
          <span className="senra-state-rank numeric text-xs text-text-tertiary w-5 text-right flex-shrink-0">
            {state.rank}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="senra-state-name text-sm font-medium text-text-primary truncate">{state.state}</span>
              <Badge band={state.band} className="senra-band-badge" />
            </div>
            <ScoreBar score={state.score} band={state.band} />
          </div>
          <span className="senra-state-score-large numeric text-sm text-text-primary w-8 text-right flex-shrink-0">
            {state.score.toFixed(0)}
          </span>
        </motion.div>
      ))}
    </div>
  )
}
