import type { StateScore } from './types'

export function exportScoresCsv(scores: StateScore[], sector: string): void {
  const headers = [
    'State/UT', 'Slug', 'Region', 'Rank', 'Score', 'Uncertainty (±)', 'Band', 'Confidence (%)',
    'Road Infrastructure', 'Distributor Density', 'Monsoon Risk',
    'Logistics Access', 'Power Grid', 'Cold Chain', 'Distributor Concentration',
  ]

  const rows = scores.map(s => [
    `"${s.state}"`,
    s.slug,
    s.region,
    s.rank,
    s.score.toFixed(1),
    s.scoreUncertainty != null ? s.scoreUncertainty.toFixed(1) : '',
    s.band,
    s.confidence.toFixed(0),
    s.subscores.road_quality.toFixed(1),
    s.subscores.business_density.toFixed(1),
    s.subscores.monsoon_disruption.toFixed(1),
    s.subscores.logistics_access.toFixed(1),
    s.subscores.power_reliability.toFixed(1),
    s.subscores.cold_chain_infra.toFixed(1),
    s.subscores.market_concentration.toFixed(1),
  ])

  const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `SENRA-scores-${sector}-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
