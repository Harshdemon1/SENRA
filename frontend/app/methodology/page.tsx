import { DIMENSIONS, SECTOR_PRESETS, SECTOR_LABELS } from '@/lib/constants'
import type { SectorPresetKey } from '@/lib/types'

export default function MethodologyPage() {
  return (
    <div className="px-6 py-10 max-w-3xl mx-auto">
      <h1 className="text-3xl font-semibold text-text-primary mb-2">Methodology</h1>
      <p className="text-text-secondary mb-10">
        The India Supply Chain Fragility Index is computed from publicly available government data.
        This page documents every decision made in the scoring process.
      </p>

      {/* 1. Dimensions */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-text-primary mb-4">1. The Seven Dimensions</h2>
        <div className="space-y-4">
          {DIMENSIONS.map((dim, i) => (
            <div key={dim.key} className="border-l-2 border-border-default pl-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="numeric text-xs text-text-tertiary w-5">{i + 1}.</span>
                <span className="font-medium text-text-primary text-sm">{dim.label}</span>
                <span className="text-xs text-text-tertiary ml-auto">{dim.unit}</span>
              </div>
              <p className="text-xs text-text-secondary">{dim.description}</p>
              <div className="text-xs text-text-tertiary mt-1">
                Default weight: <span className="numeric text-text-secondary">{(dim.default_weight * 100).toFixed(0)}%</span>
                {' · '}
                Direction: <span className={dim.higher_is_worse ? 'text-critical' : 'text-low'}>
                  {dim.higher_is_worse ? 'Higher raw = more fragile' : 'Higher raw = less fragile'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Normalisation */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-text-primary mb-4">2. Normalisation Method</h2>
        <p className="text-sm text-text-secondary mb-4">
          Raw values are normalised to 0–100 subscores using <strong className="text-text-primary">clipped min-max normalisation</strong>.
          Values are first clipped at the 5th and 95th percentile to prevent outlier states (e.g. Delhi's extreme business density)
          from compressing all other states' scores.
        </p>
        <div className="bg-bg-surface rounded-xl p-4 font-mono text-xs text-text-primary mb-4">
          <div className="text-text-tertiary mb-2"># Pseudocode</div>
          <div>clipped = clip(value, percentile_5, percentile_95)</div>
          <div>normed  = (clipped − p5) / (p95 − p5)   <span className="text-text-tertiary">← 0.0 to 1.0</span></div>
          <div>if higher_is_worse == False:</div>
          <div className="pl-4">normed = 1.0 − normed  <span className="text-text-tertiary">← invert direction</span></div>
          <div>subscore = normed × 100.0               <span className="text-text-tertiary">← 0 to 100</span></div>
        </div>
        <p className="text-xs text-text-tertiary">
          Z-scores were considered but rejected — negative values are harder to communicate to non-technical users.
          Clipped min-max gives intuitive 0–100 subscores while still handling outliers.
        </p>
      </section>

      {/* 3. Missing data */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-text-primary mb-4">3. Missing Data Imputation</h2>
        <p className="text-sm text-text-secondary">
          When a dimension value is unavailable for a state, imputation follows this priority:
        </p>
        <ol className="mt-3 space-y-2 text-sm text-text-secondary list-decimal list-inside">
          <li><strong className="text-text-primary">Regional median</strong> — impute with the median of other states in the same region (North, South, East, West, Central, Northeast).</li>
          <li><strong className="text-text-primary">National median</strong> — fallback if the regional median is unavailable.</li>
        </ol>
        <p className="mt-3 text-xs text-text-tertiary">
          Each imputed dimension reduces the confidence score by 1/7 (≈14.3%).
          States with &lt;60% confidence are shown with hatching on the map.
        </p>
      </section>

      {/* 4. Composite formula */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-text-primary mb-4">4. Composite Score</h2>
        <div className="bg-bg-surface rounded-xl p-4 font-mono text-xs text-text-primary mb-4">
          fragility_score = Σ (subscore_i × weight_i)  for i in 7 dimensions
        </div>
        <p className="text-sm text-text-secondary">Weights must sum to 1.0. Default weights are shown in Section 1.</p>
      </section>

      {/* 5. Bands */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-text-primary mb-4">5. Risk Bands</h2>
        <div className="grid grid-cols-4 gap-3">
          {[
            { band: 'CRITICAL', range: '≥ 70', color: '#C0341D', bg: '#2A0D09' },
            { band: 'HIGH',     range: '50–70', color: '#CC7A0A', bg: '#2C1C04' },
            { band: 'MODERATE', range: '30–50', color: '#AA9700', bg: '#252200' },
            { band: 'LOW',      range: '< 30',  color: '#2A8556', bg: '#0A2018' },
          ].map(b => (
            <div key={b.band} className="rounded-xl p-3" style={{ background: b.bg, border: `1px solid ${b.color}33` }}>
              <div className="numeric text-xs font-medium mb-1" style={{ color: b.color }}>{b.band}</div>
              <div className="numeric text-sm" style={{ color: b.color }}>{b.range}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Sector presets */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-text-primary mb-4">6. Sector Weight Presets</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border-subtle text-text-tertiary">
                <th className="text-left py-2 pr-4">Dimension</th>
                {(Object.keys(SECTOR_PRESETS) as SectorPresetKey[]).map(k => (
                  <th key={k} className="text-right py-2 px-2 numeric">{SECTOR_LABELS[k]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DIMENSIONS.map(dim => (
                <tr key={dim.key} className="border-b border-border-subtle text-text-secondary hover:text-text-primary">
                  <td className="py-2 pr-4">{dim.label}</td>
                  {(Object.keys(SECTOR_PRESETS) as SectorPresetKey[]).map(k => (
                    <td key={k} className="numeric text-right py-2 px-2">
                      {(SECTOR_PRESETS[k][dim.key] * 100).toFixed(0)}%
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 7. Data sources */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-text-primary mb-4">7. Data Sources</h2>
        <div className="space-y-3 text-sm">
          {[
            { name: 'MoRTH / data.gov.in', dim: 'Road Infrastructure', url: 'https://data.gov.in', cadence: 'Annual' },
            { name: 'MCA21 / data.gov.in', dim: 'Distributor Density', url: 'https://data.gov.in', cadence: 'Monthly' },
            { name: 'IMD Rainfall Dataset', dim: 'Monsoon Disruption', url: 'https://imdpune.gov.in', cadence: 'Monthly' },
            { name: 'MoCI LEADS Index',    dim: 'Logistics Access',   url: 'https://commerce.gov.in/publications/', cadence: 'Annual' },
            { name: 'CEA / PFC Reports',  dim: 'Power Reliability',   url: 'https://cea.nic.in', cadence: 'Annual' },
            { name: 'NHB / data.gov.in',  dim: 'Cold Chain Infra',    url: 'https://data.gov.in', cadence: 'Annual' },
          ].map(s => (
            <div key={s.name} className="flex items-start gap-3 p-3 bg-bg-base rounded-lg border border-border-subtle">
              <div className="flex-1">
                <div className="font-medium text-text-primary">{s.name}</div>
                <div className="text-text-tertiary text-xs mt-0.5">{s.dim} · Refreshed {s.cadence}</div>
              </div>
              <a href={s.url} target="_blank" rel="noopener noreferrer"
                className="text-xs text-accent hover:underline flex-shrink-0">
                Source ↗
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* 8. Limitations */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-text-primary mb-4">8. Limitations</h2>
        <ul className="space-y-2 text-sm text-text-secondary list-disc list-inside">
          <li>Government API resource IDs change periodically; fallback data is used when live fetch fails.</li>
          <li>LEADS index is published annually as a PDF; parsing is approximate.</li>
          <li>IMD does not offer a clean REST API; rainfall data is updated from known datasets.</li>
          <li>All data represents state-level averages — intra-state variation can be significant.</li>
          <li>Historical trend data is only available from the date of first deployment.</li>
        </ul>
      </section>

      {/* 9. Citation */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-text-primary mb-4">9. How to Cite</h2>
        <div className="bg-bg-surface rounded-xl p-4 font-mono text-xs text-text-primary whitespace-pre-wrap">
{`@misc{scfi2024,
  title  = {India Supply Chain Fragility Index},
  author = {Harshdemon1},
  year   = {2026},
  url    = {https://github.com/Harshdemon1/Palantir},
  note   = {Open source under MIT License. Data from Government of India.}
}`}
        </div>
      </section>

      <p className="text-xs text-text-tertiary">
        All government data is sourced under India's National Data Sharing and Accessibility Policy (NDSAP).
        Source code MIT licensed.
      </p>
    </div>
  )
}
