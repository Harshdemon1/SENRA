'use client'
import { useState } from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { useScores, useMeta } from '@/lib/api'
import { ScoreRanking } from '@/components/dashboard/ScoreRanking'
import { WeightSliders } from '@/components/dashboard/WeightSliders'
import { SectorToggle, useSectorStore } from '@/components/dashboard/SectorToggle'
import { Skeleton } from '@/components/ui/Skeleton'
import type { StateScore } from '@/lib/types'

// Lazy-load the map — react-simple-maps + d3 is heavy (~200 KB)
const IndiaMap = dynamic(
  () => import('@/components/map/IndiaMap').then(m => m.IndiaMap),
  { ssr: false, loading: () => <Skeleton className="w-full h-full" /> }
)

export default function DashboardPage() {
  const { sector } = useSectorStore()
  const { data, isLoading } = useScores(sector)
  const { data: meta } = useMeta()
  const [customScores, setCustomScores] = useState<StateScore[] | null>(null)

  const displayStates = customScores ?? data?.states

  return (
    <div className="px-6 py-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-start justify-between mb-6 flex-wrap gap-4"
      >
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">SENRA</h1>
          <p className="text-sm text-text-secondary mt-1">
            Ranking supply chain risk across 36 states and UTs{' '}
            <a href="/methodology" className="text-accent hover:underline">→ Methodology</a>
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <SectorToggle />
          {meta && (
            <div className="flex gap-4 text-xs text-text-tertiary">
              <span>Updated {meta.last_updated ? new Date(meta.last_updated).toLocaleDateString() : '—'}</span>
              <span>Avg confidence: {meta.avg_confidence.toFixed(0)}%</span>
              <span className={meta.status === 'success' ? 'text-low' : 'text-high'}>{meta.status}</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Data notice */}
      <div className="mb-4 px-3 py-2 bg-bg-base border border-border-default rounded-lg text-xs text-text-secondary flex items-center gap-2">
        <span className="text-accent">ℹ</span>
        All scores are computed from 2023–24 government estimates. Live data requires{' '}
        <code className="numeric text-text-primary">USE_LIVE_DATA=true</code> and a{' '}
        <code className="numeric text-text-primary">DATA_GOV_IN_API_KEY</code>.
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
        {/* Map */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="relative bg-bg-base border border-border-default rounded-2xl overflow-hidden"
          style={{ minHeight: 520 }}
        >
          {displayStates && (
            <IndiaMap scores={displayStates} />
          )}
          {!displayStates && (
            <div className="w-full h-full flex items-center justify-center text-text-tertiary text-sm">
              Loading map…
            </div>
          )}

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-bg-void/80 backdrop-blur-sm rounded-lg px-3 py-2 flex flex-col gap-1.5">
            {[['CRITICAL', '#C0341D'], ['HIGH', '#CC7A0A'], ['MODERATE', '#AA9700'], ['LOW', '#2A8556']].map(([label, color]) => (
              <div key={label} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: color }} />
                <span className="text-[10px] text-text-secondary font-medium">{label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right panel */}
        <div className="flex flex-col gap-4">
          {/* Summary stats */}
          {displayStates && (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Most Fragile', value: displayStates[0]?.state, sub: `Score ${displayStates[0]?.score.toFixed(0)}` },
                { label: 'Least Fragile', value: displayStates[displayStates.length - 1]?.state, sub: `Score ${displayStates[displayStates.length - 1]?.score.toFixed(0)}` },
                { label: 'States Ranked', value: displayStates.length, sub: 'incl. UTs' },
              ].map(({ label, value, sub }) => (
                <div key={label} className="bg-bg-base border border-border-default rounded-xl px-3 py-3">
                  <div className="text-xs text-text-tertiary mb-1">{label}</div>
                  <div className="text-sm font-semibold text-text-primary truncate">{value}</div>
                  <div className="numeric text-xs text-text-secondary">{sub}</div>
                </div>
              ))}
            </div>
          )}

          {/* Rankings */}
          <div className="bg-bg-base border border-border-default rounded-2xl overflow-hidden flex flex-col max-h-[420px]">
            <div className="px-4 py-3 border-b border-border-subtle text-xs text-text-tertiary font-medium">
              All States — Ranked by Fragility
            </div>
            <ScoreRanking states={displayStates} isLoading={isLoading && !customScores} />
          </div>

          {/* Weight sliders */}
          <WeightSliders onScoresUpdate={setCustomScores} />
        </div>
      </div>

    </div>
  )
}
