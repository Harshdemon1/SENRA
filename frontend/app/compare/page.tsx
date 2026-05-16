'use client'
import { useSearchParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { useCompare } from '@/lib/api'
import { MetricRadar } from '@/components/dashboard/MetricRadar'
import { Badge } from '@/components/ui/Badge'
import { ScoreBar } from '@/components/ui/ScoreBar'
import { Skeleton } from '@/components/ui/Skeleton'
import { DIMENSIONS, SLUG_TO_STATE_NAME } from '@/lib/constants'
import { Suspense } from 'react'

const ALL_SLUGS = Object.keys(SLUG_TO_STATE_NAME).filter(k => SLUG_TO_STATE_NAME[k])

function CompareContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialSlugs = searchParams.get('states')?.split(',').filter(Boolean) ?? []
  const [selected, setSelected] = useState<string[]>(initialSlugs.slice(0, 4))

  const { data, isLoading } = useCompare(selected)

  function toggle(slug: string) {
    setSelected(prev => {
      const next = prev.includes(slug)
        ? prev.filter(s => s !== slug)
        : [...prev, slug].slice(0, 4)
      const params = new URLSearchParams()
      if (next.length) params.set('states', next.join(','))
      router.replace(`/compare?${params}`)
      return next
    })
  }

  return (
    <div className="px-6 py-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold text-text-primary mb-2">Compare States</h1>
      <p className="text-sm text-text-secondary mb-6">Select up to 4 states to compare side-by-side</p>

      {/* State picker */}
      <div className="flex flex-wrap gap-2 mb-8 max-h-32 overflow-y-auto">
        {ALL_SLUGS.map(slug => {
          const name = SLUG_TO_STATE_NAME[slug]
          const isSelected = selected.includes(slug)
          return (
            <button
              key={slug}
              onClick={() => toggle(slug)}
              disabled={!isSelected && selected.length >= 4}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                isSelected
                  ? 'bg-accent text-bg-void border-accent'
                  : 'border-border-default text-text-secondary hover:text-text-primary disabled:opacity-30'
              }`}
            >
              {name}
            </button>
          )
        })}
      </div>

      {selected.length < 2 && (
        <div className="text-center text-text-tertiary py-12">Select at least 2 states to compare</div>
      )}

      {isLoading && selected.length >= 2 && (
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${selected.length}, 1fr)` }}>
          {selected.map(s => <Skeleton key={s} height={200} />)}
        </div>
      )}

      {data && (
        <>
          {/* State cards */}
          <div className="grid gap-4 mb-8" style={{ gridTemplateColumns: `repeat(${data.states.length}, 1fr)` }}>
            {data.states.map(state => (
              <div key={state.slug} className="bg-bg-base border border-border-default rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-text-primary text-sm">{state.state}</span>
                  <Badge band={state.band} />
                </div>
                <div className="numeric text-2xl font-medium text-text-primary mb-1">{state.score.toFixed(0)}</div>
                <div className="text-xs text-text-tertiary">Rank #{state.rank}</div>
              </div>
            ))}
          </div>

          {/* Radar */}
          <div className="bg-bg-base border border-border-default rounded-2xl p-5 mb-8">
            <h3 className="text-sm font-semibold mb-4">Dimension Comparison</h3>
            <MetricRadar states={data.states} />
          </div>

          {/* Dimension table */}
          <div className="bg-bg-base border border-border-default rounded-2xl overflow-hidden mb-8">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border-subtle text-text-tertiary">
                  <th className="text-left px-4 py-3 font-medium">Dimension</th>
                  {data.states.map(s => (
                    <th key={s.slug} className="text-right px-4 py-3 font-medium">{s.state}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DIMENSIONS.map(dim => (
                  <tr key={dim.key} className="border-b border-border-subtle hover:bg-bg-hover">
                    <td className="px-4 py-3 text-text-secondary">{dim.label}</td>
                    {data.states.map(s => {
                      const isWinner = data.dimension_winners[dim.key] === s.slug
                      const val = s.subscores[dim.key]
                      return (
                        <td key={s.slug} className="px-4 py-3 text-right">
                          <span
                            className={`numeric font-medium ${isWinner ? 'text-low' : 'text-text-primary'}`}
                          >
                            {val.toFixed(1)}
                          </span>
                          {isWinner && <span className="text-low ml-1">✓</span>}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

</>
      )}
    </div>
  )
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="px-6 py-6 text-text-tertiary">Loading…</div>}>
      <CompareContent />
    </Suspense>
  )
}
