'use client'
import { useSearchParams, useRouter } from 'next/navigation'
import { useState, Suspense } from 'react'
import { useCompare } from '@/lib/api'
import { MetricRadar } from '@/components/dashboard/MetricRadar'
import { Badge } from '@/components/ui/Badge'
import { UncertaintyBadge } from '@/components/ui/UncertaintyBadge'
import { Skeleton } from '@/components/ui/Skeleton'
import { DIMENSIONS, SECTOR_LABELS, BAND_COLORS } from '@/lib/constants'
import { useSectorStore } from '@/components/dashboard/SectorToggle'
import type { StateScore, SectorPresetKey } from '@/lib/types'
import Link from 'next/link'

const STATE_OPTIONS = [
  'andhra-pradesh', 'arunachal-pradesh', 'assam', 'bihar', 'chhattisgarh',
  'goa', 'gujarat', 'haryana', 'himachal-pradesh', 'jharkhand', 'karnataka',
  'kerala', 'madhya-pradesh', 'maharashtra', 'manipur', 'meghalaya', 'mizoram',
  'nagaland', 'odisha', 'punjab', 'rajasthan', 'sikkim', 'tamil-nadu',
  'telangana', 'tripura', 'uttar-pradesh', 'uttarakhand', 'west-bengal',
  'andaman-and-nicobar-islands', 'chandigarh', 'dadra-and-nagar-haveli-and-daman-and-diu',
  'delhi', 'jammu-and-kashmir', 'ladakh', 'lakshadweep', 'puducherry',
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
  'west-bengal': 'West Bengal', 'andaman-and-nicobar-islands': 'Andaman & Nicobar Islands',
  'chandigarh': 'Chandigarh', 'dadra-and-nagar-haveli-and-daman-and-diu': 'Dadra & NH and D&D',
  'delhi': 'Delhi', 'jammu-and-kashmir': 'Jammu & Kashmir', 'ladakh': 'Ladakh',
  'lakshadweep': 'Lakshadweep', 'puducherry': 'Puducherry',
}

function generateInsight(a: StateScore, b: StateScore): string {
  const delta = Math.abs(a.score - b.score).toFixed(1)
  const worse = a.score > b.score ? a : b
  const better = a.score > b.score ? b : a

  let maxGap = -1
  let maxGapDim = DIMENSIONS[0]
  for (const dim of DIMENSIONS) {
    const gap = Math.abs((worse.subscores[dim.key] ?? 0) - (better.subscores[dim.key] ?? 0))
    if (gap > maxGap) { maxGap = gap; maxGapDim = dim }
  }

  return `${worse.state} scores ${delta} points higher risk than ${better.state} overall. The largest gap is in ${maxGapDim.label}, where ${worse.state} scores ${(worse.subscores[maxGapDim.key] ?? 0).toFixed(1)} vs ${better.state}'s ${(better.subscores[maxGapDim.key] ?? 0).toFixed(1)}. ${better.state} presents lower supply chain disruption risk for most distribution strategies.`
}

function StateDropdown({ value, onChange, exclude }: { value: string; onChange: (v: string) => void; exclude: string }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full text-sm py-2 px-3 rounded-xl outline-none"
      style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.15)', color: '#EAE5DB' }}
    >
      {STATE_OPTIONS.filter(s => s !== exclude).map(slug => (
        <option key={slug} value={slug}>{SLUG_TO_NAME[slug] ?? slug}</option>
      ))}
    </select>
  )
}

function CompareContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { sector } = useSectorStore()

  const [stateA, setStateA] = useState(searchParams.get('a') ?? 'maharashtra')
  const [stateB, setStateB] = useState(searchParams.get('b') ?? 'gujarat')
  const activeSector = (searchParams.get('sector') ?? sector) as SectorPresetKey

  function updateUrl(a: string, b: string) {
    router.replace(`/compare?a=${a}&b=${b}&sector=${activeSector}`)
  }

  function handleChangeA(v: string) { setStateA(v); updateUrl(v, stateB) }
  function handleChangeB(v: string) { setStateB(v); updateUrl(stateA, v) }

  const { data, isLoading } = useCompare([stateA, stateB], activeSector)

  const sA = data?.states[0]
  const sB = data?.states[1]

  return (
    <div className="px-6 py-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/" className="text-xs text-text-tertiary hover:text-accent transition-colors">← Dashboard</Link>
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Compare States</h1>
          <p className="text-sm text-text-secondary">Side-by-side supply chain risk comparison</p>
        </div>
        <div className="ml-auto text-xs text-text-tertiary">
          Sector: <span className="text-accent">{SECTOR_LABELS[activeSector] ?? activeSector}</span>
        </div>
      </div>

      {/* Dropdowns */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <div className="text-xs text-text-tertiary mb-1.5">State A</div>
          <StateDropdown value={stateA} onChange={handleChangeA} exclude={stateB} />
        </div>
        <div>
          <div className="text-xs text-text-tertiary mb-1.5">State B</div>
          <StateDropdown value={stateB} onChange={handleChangeB} exclude={stateA} />
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-2 gap-4">
          <Skeleton height={120} /><Skeleton height={120} />
        </div>
      )}

      {data && sA && sB && (
        <>
          {/* Score cards */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {[sA, sB].map((s, i) => (
              <div key={s.slug} className="bg-bg-base border border-border-default rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-text-primary">{s.state}</span>
                  <Badge band={s.band} />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="numeric text-3xl font-medium" style={{ color: BAND_COLORS[s.band] }}>
                    {s.score.toFixed(1)}
                  </span>
                  {s.scoreUncertainty != null && <UncertaintyBadge value={s.scoreUncertainty} />}
                  <span className="text-xs text-text-tertiary">/100</span>
                </div>
                <div className="text-xs text-text-tertiary mt-1">
                  Rank #{s.rank} · {s.confidence.toFixed(0)}% confidence
                </div>
                {/* Delta badge */}
                {i === 1 && (
                  <div className="mt-2 text-xs font-medium" style={{ color: sA.score > sB.score ? '#2A8556' : '#C0341D' }}>
                    {sA.score > sB.score ? '▲ Less fragile' : '▼ More fragile'} by {Math.abs(sA.score - sB.score).toFixed(1)} pts
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Radar */}
          <div className="bg-bg-base border border-border-default rounded-2xl p-5 mb-6">
            <h3 className="text-sm font-semibold mb-1">Dimension Profile</h3>
            <p className="text-xs text-text-tertiary mb-4">Higher score = higher fragility on each axis</p>
            <MetricRadar states={[sA, sB]} />
          </div>

          {/* Dimension table */}
          <div className="bg-bg-base border border-border-default rounded-2xl overflow-hidden mb-6">
            <div className="px-4 py-3 border-b border-border-subtle text-xs text-text-tertiary font-medium">
              Dimension Breakdown
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border-subtle text-text-tertiary">
                  <th className="text-left px-4 py-2 font-medium">Dimension</th>
                  <th className="text-right px-4 py-2 font-medium">{sA.state}</th>
                  <th className="text-right px-4 py-2 font-medium">{sB.state}</th>
                  <th className="text-right px-4 py-2 font-medium">Delta</th>
                </tr>
              </thead>
              <tbody>
                {DIMENSIONS.map(dim => {
                  const vA = sA.subscores[dim.key] ?? 0
                  const vB = sB.subscores[dim.key] ?? 0
                  const delta = vA - vB
                  const aWins = vA < vB
                  return (
                    <tr key={dim.key} className="border-b border-border-subtle hover:bg-white/[0.02]">
                      <td className="px-4 py-2.5 text-text-secondary">{dim.label}</td>
                      <td className="px-4 py-2.5 text-right">
                        <span className={`numeric font-medium ${aWins ? 'text-low' : 'text-text-primary'}`}>
                          {vA.toFixed(1)}{aWins && ' ✓'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <span className={`numeric font-medium ${!aWins ? 'text-low' : 'text-text-primary'}`}>
                          {vB.toFixed(1)}{!aWins && ' ✓'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right numeric text-text-tertiary">
                        {delta > 0 ? '+' : ''}{delta.toFixed(1)}
                      </td>
                    </tr>
                  )
                })}
                {/* Composite row */}
                <tr className="bg-white/[0.03] font-semibold">
                  <td className="px-4 py-3 text-text-primary">Composite Score</td>
                  <td className="px-4 py-3 text-right">
                    <span className="numeric" style={{ color: BAND_COLORS[sA.band] }}>{sA.score.toFixed(1)}</span>
                    <span className="ml-1 text-[10px] font-normal" style={{ color: BAND_COLORS[sA.band] }}>{sA.band}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="numeric" style={{ color: BAND_COLORS[sB.band] }}>{sB.score.toFixed(1)}</span>
                    <span className="ml-1 text-[10px] font-normal" style={{ color: BAND_COLORS[sB.band] }}>{sB.band}</span>
                  </td>
                  <td className="px-4 py-3 text-right numeric text-text-tertiary">
                    {(sA.score - sB.score) > 0 ? '+' : ''}{(sA.score - sB.score).toFixed(1)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Delta insight */}
          <div className="bg-bg-elevated border border-border-default rounded-xl p-4">
            <div className="text-xs text-text-tertiary mb-1 font-medium">Analysis</div>
            <p className="text-sm text-text-secondary leading-relaxed">{generateInsight(sA, sB)}</p>
          </div>
        </>
      )}
    </div>
  )
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="px-6 py-6 text-text-tertiary text-sm">Loading…</div>}>
      <CompareContent />
    </Suspense>
  )
}
