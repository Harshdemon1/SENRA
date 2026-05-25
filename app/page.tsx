'use client'
import { useState, useMemo, useCallback, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { useScores, useMeta } from '@/lib/api'
import { ScoreRanking } from '@/components/dashboard/ScoreRanking'
import { WeightSliders } from '@/components/dashboard/WeightSliders'
import { SectorToggle } from '@/components/dashboard/SectorToggle'
import { Skeleton } from '@/components/ui/Skeleton'
import SenraAppSkeleton from '@/components/ui/SenraAppSkeleton'
import { MobileBottomSheet } from '@/components/ui/MobileBottomSheet'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import type { StateScore, Band } from '@/lib/types'
import { BAND_COLORS } from '@/lib/constants'
import { SECTOR_WEIGHTS } from '@/lib/sectorWeights'
import { AboutDataFooter } from '@/components/ui/AboutDataFooter'
import { exportScoresCsv } from '@/lib/exportCsv'

const IndiaMap = dynamic(
  () => import('@/components/map/IndiaMap').then(m => m.IndiaMap),
  { ssr: false, loading: () => <Skeleton className="w-full h-full" /> }
)

export default function DashboardPage() {
  const [activeSector, setActiveSector] = useState<string>('default')
  const { data: baseData, isLoading, error } = useScores('default')
  const { data: meta } = useMeta()
  const [customScores, setCustomScores] = useState<StateScore[] | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)
  const isMobile = useMediaQuery('(max-width: 480px)')

  // Clear custom slider scores when sector button is clicked so sector weights take effect
  useEffect(() => { setCustomScores(null) }, [activeSector])

  // Recompute scores client-side when sector changes: Σ(subscore_i × weight_i)
  const sectorStates = useMemo<StateScore[] | undefined>(() => {
    if (!baseData?.states) return undefined
    const weights = SECTOR_WEIGHTS[activeSector] ?? SECTOR_WEIGHTS.default
    const recomputed = baseData.states.map(state => {
      const score =
        (state.subscores.road_quality         ?? 0) * weights.road_quality +
        (state.subscores.business_density      ?? 0) * weights.business_density +
        (state.subscores.monsoon_disruption    ?? 0) * weights.monsoon_disruption +
        (state.subscores.logistics_access      ?? 0) * weights.logistics_access +
        (state.subscores.power_reliability     ?? 0) * weights.power_reliability +
        (state.subscores.cold_chain_infra      ?? 0) * weights.cold_chain_infra +
        (state.subscores.market_concentration  ?? 0) * weights.market_concentration
      const band: Band =
        score >= 70 ? 'CRITICAL' :
        score >= 50 ? 'HIGH' :
        score >= 30 ? 'MODERATE' : 'LOW'
      return { ...state, score, band }
    })
    return [...recomputed]
      .sort((a, b) => b.score - a.score)
      .map((s, i) => ({ ...s, rank: i + 1 }))
  }, [baseData, activeSector])

  const displayStates = customScores ?? sectorStates

  const handleMapSelect = useCallback((slug: string) => {
    setSelectedSlug(slug)
    setSheetOpen(true)
  }, [])

  const selectedState = selectedSlug ? displayStates?.find(s => s.slug === selectedSlug) : null

  if (isLoading && !baseData) return <SenraAppSkeleton />

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="senra-page px-6 py-6"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="senra-page-title text-2xl font-semibold text-text-primary">SENRA</h1>
          <p className="senra-page-subtitle text-sm text-text-secondary mt-1">
            Ranking supply chain risk across 36 states and UTs
          </p>
        </div>
        <div className="senra-header-meta flex flex-col items-end gap-2 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <SectorToggle onSelect={setActiveSector} />
            {displayStates && (
              <button
                onClick={() => exportScoresCsv(displayStates, activeSector)}
                className="text-xs px-3 py-1.5 rounded-full border border-white/20 hover:border-white/50 hover:text-text-primary text-text-secondary transition-colors hidden sm:block"
                title="Export all states as CSV"
              >
                Export CSV
              </button>
            )}
          </div>
          {meta && (
            <div className="senra-header-meta-line flex gap-4 text-xs text-text-tertiary flex-wrap justify-end">
              <span>Updated {meta.last_updated ? new Date(meta.last_updated).toLocaleDateString() : '—'}</span>
              <span>Avg confidence: {meta.avg_confidence.toFixed(0)}%</span>
              <span className={meta.status === 'success' ? 'text-low' : 'text-high'}>{meta.status}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main layout */}
      <div className="senra-main-grid grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        {/* Map column: map shell + (mobile-only) legend below */}
        <div className="flex flex-col">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="senra-map-shell relative bg-bg-base border border-border-default rounded-2xl overflow-hidden"
        >
          {displayStates && (
            <IndiaMap
              scores={displayStates}
              selectedSlug={selectedSlug ?? undefined}
              onSelect={isMobile ? handleMapSelect : undefined}
            />
          )}
          {!displayStates && !error && (
            <div className="w-full h-full flex items-center justify-center text-text-tertiary text-sm">
              Loading map…
            </div>
          )}
          {error && (
            <div className="w-full h-full flex items-center justify-center flex-col gap-2 text-sm">
              <span className="text-high">Failed to load scores</span>
              <span className="text-xs text-text-tertiary">{String(error)}</span>
            </div>
          )}

          {/* Legend — desktop/tablet overlay (hidden on mobile) */}
          <div className="senra-map-legend-overlay absolute bottom-4 left-4 bg-bg-void/80 backdrop-blur-sm rounded-lg px-3 py-2 flex flex-col gap-1.5">
            {[['CRITICAL', '#C0341D'], ['HIGH', '#CC7A0A'], ['MODERATE', '#AA9700'], ['LOW', '#2A8556']].map(([label, color]) => (
              <div key={label} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: color }} />
                <span className="text-[10px] text-text-secondary font-medium">{label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Legend — mobile-only row below map */}
        <div className="senra-map-legend-mobile">
          {[['CRITICAL', '#C0341D'], ['HIGH', '#CC7A0A'], ['MODERATE', '#AA9700'], ['LOW', '#2A8556']].map(([label, color]) => (
            <div key={label} className="senra-map-legend-mobile-item">
              <div className="senra-map-legend-mobile-dot" style={{ background: color }} />
              <span>{label}</span>
            </div>
          ))}
        </div>
        </div>

        {/* Right panel — desktop + tablet */}
        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="hidden lg:flex flex-col gap-4"
        >
          {displayStates && (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Most Fragile',  value: displayStates[0]?.state,                             sub: `Score ${displayStates[0]?.score.toFixed(0)}` },
                { label: 'Least Fragile', value: displayStates[displayStates.length - 1]?.state,      sub: `Score ${displayStates[displayStates.length - 1]?.score.toFixed(0)}` },
                { label: 'States Ranked', value: displayStates.length,                                sub: 'incl. UTs' },
              ].map(({ label, value, sub }) => (
                <div key={label} className="bg-bg-base border border-border-default rounded-xl px-3 py-3">
                  <div className="text-xs text-text-tertiary mb-1">{label}</div>
                  <div className="text-sm font-semibold text-text-primary truncate">{value}</div>
                  <div className="numeric text-xs text-text-secondary">{sub}</div>
                </div>
              ))}
            </div>
          )}
          <div className="bg-bg-base border border-border-default rounded-2xl overflow-hidden flex flex-col max-h-[420px]">
            <div className="px-4 py-3 border-b border-border-subtle text-xs text-text-tertiary font-medium">
              All States — Ranked by Fragility
            </div>
            <ScoreRanking states={displayStates} isLoading={isLoading && !baseData && !customScores} />
          </div>
          <WeightSliders onScoresUpdate={setCustomScores} />
        </motion.div>

        {/* Rankings + sliders stacked on tablet (visible below map, hidden on desktop) */}
        <div className="lg:hidden flex flex-col gap-4">
          <div className="bg-bg-base border border-border-default rounded-2xl overflow-hidden flex flex-col max-h-[420px]">
            <div className="px-4 py-3 border-b border-border-subtle text-xs text-text-tertiary font-medium">
              All States — Ranked by Fragility
            </div>
            <ScoreRanking states={displayStates} isLoading={isLoading && !baseData && !customScores} />
          </div>
          <WeightSliders onScoresUpdate={setCustomScores} />
        </div>
      </div>

      <AboutDataFooter />

      {/* Mobile bottom sheet */}
      <AnimatePresence>
        {isMobile && (
          <MobileBottomSheet isOpen={sheetOpen} onClose={() => { setSheetOpen(false); setSelectedSlug(null) }}>
            {selectedState && (
              <div
                className="flex items-center justify-between pb-3 mb-3"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div>
                  <div className="text-base font-semibold text-text-primary">{selectedState.state}</div>
                  <div
                    className="text-xs font-semibold tracking-wider mt-0.5"
                    style={{ color: BAND_COLORS[selectedState.band] }}
                  >
                    {selectedState.band}
                  </div>
                </div>
                <span
                  className="numeric text-2xl font-bold"
                  style={{ color: BAND_COLORS[selectedState.band] }}
                >
                  {selectedState.score.toFixed(0)}
                </span>
              </div>
            )}
            <ScoreRanking states={displayStates} isLoading={isLoading && !baseData && !customScores} />
          </MobileBottomSheet>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
