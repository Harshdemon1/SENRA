'use client'
import { useState, useMemo, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useScores } from '@/lib/api'
import { findCorridorPath, buildCorridorResult } from '@/lib/corridorRouting'
import { BAND_COLORS, SECTOR_LABELS } from '@/lib/constants'
import { useSectorStore } from '@/components/dashboard/SectorToggle'
import type { SectorPresetKey } from '@/lib/types'
import Link from 'next/link'

const STATE_OPTIONS = [
  'andhra-pradesh', 'arunachal-pradesh', 'assam', 'bihar', 'chhattisgarh',
  'goa', 'gujarat', 'haryana', 'himachal-pradesh', 'jharkhand', 'karnataka',
  'kerala', 'madhya-pradesh', 'maharashtra', 'manipur', 'meghalaya', 'mizoram',
  'nagaland', 'odisha', 'punjab', 'rajasthan', 'sikkim', 'tamil-nadu',
  'telangana', 'tripura', 'uttar-pradesh', 'uttarakhand', 'west-bengal',
  'chandigarh', 'dadra-and-nagar-haveli-and-daman-and-diu',
  'delhi', 'jammu-and-kashmir', 'ladakh', 'puducherry',
]

const SLUG_TO_NAME: Record<string, string> = {
  'andhra-pradesh': 'Andhra Pradesh', 'arunachal-pradesh': 'Arunachal Pradesh',
  'assam': 'Assam', 'bihar': 'Bihar', 'chhattisgarh': 'Chhattisgarh',
  'goa': 'Goa', 'gujarat': 'Gujarat', 'haryana': 'Haryana',
  'himachal-pradesh': 'Himachal Pradesh', 'jharkhand': 'Jharkhand',
  'karnataka': 'Karnataka', 'kerala': 'Kerala', 'madhya-pradesh': 'Madhya Pradesh',
  'maharashtra': 'Maharashtra', 'manipur': 'Manipur', 'meghalaya': 'Meghalaya',
  'mizoram': 'Mizoram', 'nagaland': 'Nagaland', 'odisha': 'Odisha',
  'punjab': 'Punjab', 'rajasthan': 'Rajasthan', 'sikkim': 'Sikkim',
  'tamil-nadu': 'Tamil Nadu', 'telangana': 'Telangana', 'tripura': 'Tripura',
  'uttar-pradesh': 'Uttar Pradesh', 'uttarakhand': 'Uttarakhand',
  'west-bengal': 'West Bengal', 'chandigarh': 'Chandigarh',
  'dadra-and-nagar-haveli-and-daman-and-diu': 'Dadra & NH and D&D',
  'delhi': 'Delhi', 'jammu-and-kashmir': 'J&K', 'ladakh': 'Ladakh', 'puducherry': 'Puducherry',
}

function ScoreBar({ score, max = 100 }: { score: number; max?: number }) {
  const band = score >= 70 ? 'CRITICAL' : score >= 50 ? 'HIGH' : score >= 30 ? 'MODERATE' : 'LOW'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${(score / max) * 100}%`, background: BAND_COLORS[band] }} />
      </div>
      <span className="numeric text-xs w-8 text-right" style={{ color: BAND_COLORS[band] }}>{score.toFixed(0)}</span>
    </div>
  )
}

function CorridorContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { sector } = useSectorStore()
  const activeSector = (searchParams.get('sector') ?? sector) as SectorPresetKey

  const [origin, setOrigin] = useState(searchParams.get('from') ?? 'maharashtra')
  const [destination, setDestination] = useState(searchParams.get('to') ?? 'delhi')

  const { data } = useScores('default')

  const scoresBySlug = useMemo(() => {
    const m = new Map<string, { name: string; score: number; band: string }>()
    if (data?.states) {
      for (const s of data.states) m.set(s.slug, { name: s.state, score: s.score, band: s.band })
    }
    return m
  }, [data])

  const corridor = useMemo(() => {
    if (!data || origin === destination) return null
    const path = findCorridorPath(origin, destination)
    if (!path) return null
    return buildCorridorResult(path, scoresBySlug)
  }, [origin, destination, data, scoresBySlug])

  function update(from: string, to: string) {
    router.replace(`/corridor?from=${from}&to=${to}&sector=${activeSector}`)
  }

  const overallBand = corridor
    ? (corridor.avgScore >= 70 ? 'CRITICAL' : corridor.avgScore >= 50 ? 'HIGH' : corridor.avgScore >= 30 ? 'MODERATE' : 'LOW')
    : null

  return (
    <div className="px-6 py-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/" className="text-xs text-text-tertiary hover:text-accent transition-colors">← Dashboard</Link>
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Corridor Risk</h1>
          <p className="text-sm text-text-secondary">Aggregate supply chain risk for a state-to-state route</p>
        </div>
      </div>

      {/* Origin / Destination */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-end mb-6">
        <div>
          <div className="text-xs text-text-tertiary mb-1.5">Origin</div>
          <select
            value={origin}
            onChange={e => { setOrigin(e.target.value); update(e.target.value, destination) }}
            className="w-full text-sm py-2 px-3 rounded-xl outline-none"
            style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.15)', color: '#EAE5DB' }}
          >
            {STATE_OPTIONS.filter(s => s !== destination).map(s => (
              <option key={s} value={s}>{SLUG_TO_NAME[s] ?? s}</option>
            ))}
          </select>
        </div>
        <div className="text-text-tertiary pb-2">→</div>
        <div>
          <div className="text-xs text-text-tertiary mb-1.5">Destination</div>
          <select
            value={destination}
            onChange={e => { setDestination(e.target.value); update(origin, e.target.value) }}
            className="w-full text-sm py-2 px-3 rounded-xl outline-none"
            style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.15)', color: '#EAE5DB' }}
          >
            {STATE_OPTIONS.filter(s => s !== origin).map(s => (
              <option key={s} value={s}>{SLUG_TO_NAME[s] ?? s}</option>
            ))}
          </select>
        </div>
      </div>

      {origin === destination && (
        <div className="text-center text-text-tertiary py-8 text-sm">Select different states for origin and destination.</div>
      )}

      {!corridor && origin !== destination && data && (
        <div className="text-center text-text-tertiary py-8 text-sm">No land route found between these states.</div>
      )}

      {corridor && overallBand && (
        <>
          {/* Summary card */}
          <div className="bg-bg-base border border-border-default rounded-2xl p-5 mb-6">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-xs text-text-tertiary mb-1">Corridor Risk Score</div>
                <div className="numeric text-3xl font-medium" style={{ color: BAND_COLORS[overallBand] }}>
                  {corridor.avgScore.toFixed(1)}
                </div>
                <div className="text-xs mt-1" style={{ color: BAND_COLORS[overallBand] }}>{overallBand}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-text-tertiary mb-1">Route length</div>
                <div className="numeric text-xl text-text-primary">{corridor.path.length}</div>
                <div className="text-xs text-text-tertiary">states</div>
              </div>
            </div>
            <div className="text-sm text-text-secondary">
              {SLUG_TO_NAME[origin] ?? origin} → {corridor.stateScores.slice(1, -1).map(s => s.name).join(' → ')}{corridor.path.length > 2 ? ' → ' : ' → '}{SLUG_TO_NAME[destination] ?? destination}
            </div>
          </div>

          {/* Weakest link */}
          <div className="rounded-xl p-4 mb-6 border" style={{ background: `${BAND_COLORS.CRITICAL}10`, borderColor: `${BAND_COLORS.CRITICAL}40` }}>
            <div className="text-xs font-semibold mb-1" style={{ color: BAND_COLORS.CRITICAL }}>⚠ Weakest Link</div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-text-primary">{corridor.weakestLink.name}</span>
              <span className="numeric text-sm font-bold" style={{ color: BAND_COLORS[corridor.weakestLink.band as keyof typeof BAND_COLORS] }}>
                {corridor.weakestLink.score.toFixed(1)}
              </span>
            </div>
            <p className="text-xs text-text-secondary mt-1">
              {corridor.weakestLink.name} is the highest-risk state on this corridor.
              Distribution strategies should plan additional buffer stock or alternative routing around this node.
            </p>
          </div>

          {/* State-by-state breakdown */}
          <div className="bg-bg-base border border-border-default rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border-subtle text-xs text-text-tertiary font-medium">
              State-by-State Breakdown
            </div>
            <div className="divide-y divide-border-subtle">
              {corridor.stateScores.map((s, i) => (
                <div key={s.slug} className="px-4 py-3 flex items-center gap-3">
                  <span className="numeric text-xs text-text-tertiary w-5">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <Link href={`/state/${s.slug}`} className="text-sm text-text-primary hover:text-accent transition-colors">{s.name}</Link>
                      <span className="numeric text-xs font-medium" style={{ color: BAND_COLORS[s.band as keyof typeof BAND_COLORS] }}>{s.band}</span>
                    </div>
                    <ScoreBar score={s.score} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-text-tertiary mt-4">
            Route uses shortest state-hop path (BFS). SENRA does not model road network topology or real-time events.{' '}
            <Link href="/methodology#limitations" className="text-accent hover:underline">Limitations →</Link>
          </p>
        </>
      )}
    </div>
  )
}

export default function CorridorPage() {
  return (
    <Suspense fallback={<div className="px-6 py-6 text-text-tertiary text-sm">Loading…</div>}>
      <CorridorContent />
    </Suspense>
  )
}
