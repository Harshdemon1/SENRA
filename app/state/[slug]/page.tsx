import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/Badge'
import { ScoreBar } from '@/components/ui/ScoreBar'
import { MetricRadar } from '@/components/dashboard/MetricRadar'
import { TrendChart } from '@/components/dashboard/TrendChart'
import { DIMENSIONS } from '@/lib/constants'
import type { StateProfile } from '@/lib/types'
import Link from 'next/link'

async function getStateProfile(slug: string): Promise<StateProfile | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
  try {
    const r = await fetch(`${apiUrl}/api/scores/${slug}`, { next: { revalidate: 60 } })
    if (!r.ok) return null
    return r.json()
  } catch {
    return null
  }
}

export default async function StatePage({ params }: { params: { slug: string } }) {
  const profile = await getStateProfile(params.slug)
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
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-semibold text-text-primary">{profile.state}</h1>
            <Badge band={profile.band} />
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-text-secondary">
            <span className="numeric">Score: <strong className="text-text-primary">{profile.score.toFixed(1)}</strong>/100</span>
            <span className="numeric">Rank: <strong className="text-text-primary">#{profile.rank}</strong> of 36</span>
            <span>Region: {profile.region}</span>
            <span className="numeric">Confidence: {profile.confidence.toFixed(0)}%</span>
          </div>
        </div>
        <div className="flex gap-3 ml-auto">
          <Link
            href={`/compare?states=${params.slug}`}
            className="text-xs px-3 py-1.5 rounded-lg border border-border-default text-text-secondary hover:text-text-primary hover:border-accent transition-colors"
          >
            Compare
          </Link>
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
              <div className="text-[10px] text-text-tertiary mb-2 leading-tight">{dim.label}</div>
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
