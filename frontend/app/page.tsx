'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { useScores, useMeta } from '@/lib/api'
import { IndiaMap } from '@/components/map/IndiaMap'
import { ScoreRanking } from '@/components/dashboard/ScoreRanking'
import { WeightSliders } from '@/components/dashboard/WeightSliders'
import { SectorToggle, useSectorStore } from '@/components/dashboard/SectorToggle'
import { AnalystChat } from '@/components/ai/AnalystChat'
import type { StateScore } from '@/lib/types'

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
          <h1 className="text-2xl font-semibold text-text-primary">India Supply Chain Fragility Index</h1>
          <p className="text-sm text-text-secondary mt-1">
            Ranking supply chain risk across 36 states and UTs
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

      {/* Main layout */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
        {/* Map */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="bg-bg-base border border-border-default rounded-2xl overflow-hidden"
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
          <div className="absolute bottom-4 left-4 flex flex-col gap-1.5">
            {[['CRITICAL', '#C0341D'], ['HIGH', '#CC7A0A'], ['MODERATE', '#AA9700'], ['LOW', '#2A8556']].map(([label, color]) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm" style={{ background: color }} />
                <span className="text-[10px] text-text-secondary numeric">{label}</span>
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
          <div
            className="bg-bg-base border border-border-default rounded-2xl overflow-hidden flex flex-col"
            style={{ maxHeight: 420 }}
          >
            <div className="px-4 py-3 border-b border-border-subtle text-xs text-text-tertiary font-medium">
              All States — Ranked by Fragility
            </div>
            <ScoreRanking states={displayStates} isLoading={isLoading && !customScores} />
          </div>

          {/* Weight sliders */}
          <WeightSliders onScoresUpdate={setCustomScores} />
        </div>
      </div>

      {/* AI Chat */}
      {displayStates && displayStates.length > 0 && (
        <AnalystChat context={displayStates.slice(0, 10)} sector={sector} />
      )}
    </div>
  )
}
