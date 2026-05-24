export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/Badge'
import { ScoreBar } from '@/components/ui/ScoreBar'
import { MetricRadar } from '@/components/dashboard/MetricRadar'
import { TrendChart } from '@/components/dashboard/TrendChart'
import { AnimatedScore } from '@/components/ui/AnimatedScore'
import { UncertaintyBadge } from '@/components/ui/UncertaintyBadge'
import { DIMENSIONS, BAND_COLORS } from '@/lib/constants'
import type { StateProfile, Band } from '@/lib/types'
import Link from 'next/link'
import { getDb } from '@/lib/db'
import { seedIfEmpty } from '@/lib/seed'

type DbRow = Record<string, unknown>

function getStateProfile(slug: string): StateProfile | null {
  try {
    seedIfEmpty()
    const db = getDb()
    const state = db.prepare('SELECT * FROM states WHERE slug = ?').get(slug) as DbRow | undefined
    if (!state) return null

    const latestRow = db.prepare(`
      SELECT computed_at FROM fragility_scores
      WHERE state_id = ? AND sector_preset = 'default'
      ORDER BY computed_at DESC LIMIT 1
    `).get(state.id) as { computed_at: string } | undefined
    if (!latestRow) return null

    const fs = db.prepare(`
      SELECT * FROM fragility_scores
      WHERE state_id = ? AND sector_preset = 'default' AND computed_at = ?
    `).get(state.id, latestRow.computed_at) as DbRow

    const history = (db.prepare(`
      SELECT computed_at as date, score, band FROM fragility_scores
      WHERE state_id = ? AND sector_preset = 'default'
      ORDER BY computed_at ASC
    `).all(state.id) as DbRow[]).map(r => ({ date: r.date as string, score: r.score as number, band: r.band as Band }))

    const allScores = db.prepare(`
      SELECT fs.score, s.slug, s.name, fs.band, fs.rank, fs.confidence,
             fs.subscore_road, fs.subscore_business, fs.subscore_monsoon,
             fs.subscore_logistics, fs.subscore_power, fs.subscore_cold_chain,
             fs.subscore_concentration, fs.imputed_dimensions, s.iso_code, s.region
      FROM fragility_scores fs
      JOIN states s ON s.id = fs.state_id
      WHERE fs.sector_preset = 'default' AND fs.computed_at = ?
      ORDER BY ABS(fs.score - ?)
      LIMIT 6
    `).all(latestRow.computed_at, fs.score) as DbRow[]

    const similar = allScores
      .filter(r => r.slug !== slug)
      .slice(0, 3)
      .map(r => ({
        state: r.name as string, slug: r.slug as string,
        iso_code: r.iso_code as string, region: r.region as string,
        score: r.score as number, rank: r.rank as number,
        band: r.band as Band, confidence: r.confidence as number,
        subscores: {
          road_quality: r.subscore_road as number,
          business_density: r.subscore_business as number,
          monsoon_disruption: r.subscore_monsoon as number,
          logistics_access: r.subscore_logistics as number,
          power_reliability: r.subscore_power as number,
          cold_chain_infra: r.subscore_cold_chain as number,
          market_concentration: r.subscore_concentration as number,
        },
        imputed_dims: JSON.parse(r.imputed_dimensions as string ?? '[]'),
      }))

    return {
      state: state.name as string, slug: state.slug as string,
      iso_code: state.iso_code as string, region: state.region as string,
      score: fs.score as number, rank: fs.rank as number,
      band: fs.band as Band, confidence: fs.confidence as number,
      scoreUncertainty: (fs.score_uncertainty as number | null) ?? undefined,
      subscores: {
        road_quality: fs.subscore_road as number,
        business_density: fs.subscore_business as number,
        monsoon_disruption: fs.subscore_monsoon as number,
        logistics_access: fs.subscore_logistics as number,
        power_reliability: fs.subscore_power as number,
        cold_chain_infra: fs.subscore_cold_chain as number,
        market_concentration: fs.subscore_concentration as number,
      },
      imputed_dims: JSON.parse(fs.imputed_dimensions as string ?? '[]'),
      history,
      similar,
      raw_values: JSON.parse(state.raw_data as string ?? '{}'),
    }
  } catch {
    return null
  }
}

export default function StatePage({ params }: { params: { slug: string } }) {
  const profile = getStateProfile(params.slug)
  if (!profile) notFound()

  const worstDims = [...DIMENSIONS]
    .sort((a, b) => profile.subscores[b.key] - profile.subscores[a.key])
    .slice(0, 2)
    .map(d => d.key)

  return (
    <div className="px-6 py-6 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <div className="text-xs text-text-tertiary mb-6">
        <Link href="/" className="hover:text-text-primary">Dashboard</Link>
        <span className="mx-2">›</span>
        <span>{profile.state}</span>
      </div>

      {/* Hero */}
      <div className="flex flex-wrap items-start gap-6 mb-8">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-5">
            <h1 className="text-text-primary senra-state-name">{profile.state}</h1>
            <Badge band={profile.band} />
          </div>
          <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
            <div className="flex flex-col">
              <span className="text-[11px] uppercase tracking-wider text-text-tertiary mb-1">Score</span>
              <div className="flex items-baseline gap-2">
                <strong className="text-text-primary senra-score-display leading-none">
                  <AnimatedScore value={profile.score} decimals={1} />
                </strong>
                <span className="numeric text-xs text-text-tertiary">
                  {profile.scoreUncertainty != null && <UncertaintyBadge value={profile.scoreUncertainty} />}
                  <span className="ml-1">/100</span>
                </span>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] uppercase tracking-wider text-text-tertiary mb-1">Rank</span>
              <span className="numeric text-text-primary text-lg">#{profile.rank}<span className="text-text-tertiary text-sm font-normal"> / 36</span></span>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] uppercase tracking-wider text-text-tertiary mb-1">Region</span>
              <span className="text-text-primary text-lg">{profile.region}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] uppercase tracking-wider text-text-tertiary mb-1">Confidence</span>
              <span className="numeric text-text-primary text-lg">{profile.confidence.toFixed(0)}%</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-3">
          <Link
            href={`/compare?states=${params.slug}`}
            className="text-xs px-3 py-1.5 rounded-lg border border-border-default text-text-secondary hover:text-text-primary hover:border-accent transition-colors"
          >
            Compare
          </Link>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-mono,monospace)' }}>
            Data: 2023–24 govt. estimates ·{' '}
            <Link href="/methodology#citations" style={{ color: '#E0981E', textDecoration: 'none' }}>Sources</Link>
          </div>
        </div>
      </div>

      {/* Subscore strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
        {DIMENSIONS.map(dim => {
          const val = profile.subscores[dim.key]
          const isWorst = worstDims.includes(dim.key)
          const isImputed = profile.imputed_dims?.includes(dim.key)
          return (
            <div
              key={dim.key}
              className="bg-bg-base border rounded-xl px-3 py-3"
              style={{ borderColor: isWorst ? '#C0341D44' : '#282828' }}
            >
              <div className="text-[10px] text-text-tertiary mb-2 leading-tight senra-dimension-label">{dim.label}</div>
              <div className="numeric text-lg font-medium text-text-primary">{val.toFixed(0)}</div>
              <div className="mt-1.5">
                <ScoreBar score={val} band={val >= 70 ? 'CRITICAL' : val >= 50 ? 'HIGH' : val >= 30 ? 'MODERATE' : 'LOW'} showLabel={false} />
              </div>
              {isImputed && <div className="text-[9px] text-text-tertiary mt-1">estimated</div>}
            </div>
          )
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-bg-base border border-border-default rounded-2xl p-5">
          <h3 className="text-sm font-semibold mb-4">Dimension Profile</h3>
          <MetricRadar states={[profile]} />
        </div>
        {profile.history && profile.history.length > 1 && (
          <div className="bg-bg-base border border-border-default rounded-2xl p-5">
            <h3 className="text-sm font-semibold mb-4">Score History</h3>
            <TrendChart data={profile.history} />
          </div>
        )}
      </div>

      {/* Raw data table */}
      {profile.raw_values && Object.keys(profile.raw_values).length > 0 && (
        <div className="bg-bg-base border border-border-default rounded-2xl p-5 mb-8">
          <h3 className="text-sm font-semibold mb-4">Raw Data</h3>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-text-tertiary border-b border-border-subtle">
                <th className="text-left py-2 font-medium">Dimension</th>
                <th className="text-right py-2 font-medium numeric">Raw Value</th>
                <th className="text-right py-2 font-medium">Unit</th>
                <th className="text-right py-2 font-medium">Imputed?</th>
              </tr>
            </thead>
            <tbody>
              {DIMENSIONS.map(dim => (
                <tr key={dim.key} className="border-b border-border-subtle text-text-secondary hover:text-text-primary">
                  <td className="py-2">{dim.label}</td>
                  <td className="numeric text-right py-2 text-text-primary">
                    {profile.raw_values[dim.key] != null ? profile.raw_values[dim.key]!.toFixed(2) : '—'}
                  </td>
                  <td className="text-right py-2 text-text-tertiary">{dim.unit}</td>
                  <td className="text-right py-2">
                    {profile.imputed_dims?.includes(dim.key) ? (
                      <span className="text-high">Yes</span>
                    ) : (
                      <span className="text-low">No</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Similar states */}
      {profile.similar && profile.similar.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-text-secondary mb-3">Similar Risk Profiles</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {profile.similar.map(s => (
              <Link
                key={s.slug}
                href={`/state/${s.slug}`}
                className="bg-bg-base border border-border-default rounded-xl px-4 py-3 hover:border-accent/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-text-primary">{s.state}</span>
                  <Badge band={s.band} />
                </div>
                <ScoreBar score={s.score} band={s.band} />
              </Link>
            ))}
          </div>
        </div>
      )}

</div>
  )
}
