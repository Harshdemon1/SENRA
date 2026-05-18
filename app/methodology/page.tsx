'use client'
import Link from 'next/link'
import { DIMENSIONS, SECTOR_PRESETS, SECTOR_LABELS } from '@/lib/constants'
import { useActiveSection } from '@/hooks/useActiveSection'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import type { SectorPresetKey } from '@/lib/types'

const SECTION_IDS = [
  'why-this-exists',
  'seven-dimensions',
  'sector-weight-profiles',
  'normalisation',
  'risk-bands',
  'limitations',
  'citations',
]

const SECTION_LABELS: Record<string, string> = {
  'why-this-exists':        '1. Why This Exists',
  'seven-dimensions':       '2. The Seven Dimensions',
  'sector-weight-profiles': '3. Sector Weight Profiles',
  'normalisation':          '4. Normalisation Method',
  'risk-bands':             '5. Risk Bands',
  'limitations':            '6. Limitations',
  'citations':              '7. Citations',
}

const DIM_SOURCES: Record<string, { source: string; unit: string }> = {
  road_quality:         { source: 'Ministry of Road Transport & Highways (MoRTH) — Annual Report 2023–24', unit: 'NH km per 1,000 sq km' },
  business_density:     { source: 'Ministry of Corporate Affairs (MCA) — active MSME/wholesale registrations by state', unit: 'Companies per 1,00,000 people' },
  monsoon_disruption:   { source: 'India Meteorological Department (IMD) — district-level rainfall variability and flood frequency index', unit: 'Composite index (rainfall CV + flood days)' },
  logistics_access:     { source: 'Ministry of Commerce & Industry — Logistics Ease Across Different States (LEADS) report', unit: 'LEADS score 0–100' },
  power_reliability:    { source: 'Central Electricity Authority (CEA) — Annual Report 2023–24, consumer-hours interrupted per state', unit: 'Annual outage hours per consumer' },
  cold_chain_infra:     { source: 'National Centre for Cold-chain Development (NCCD) — state-wise cold storage capacity', unit: 'MT capacity per lakh population' },
  market_concentration: { source: 'Derived from MCA registration data — Herfindahl-style concentration of wholesale businesses by district', unit: 'Concentration score 0–100' },
}

const SECTOR_NARRATIVES: Record<string, string> = {
  fmcg:        'FMCG operates on high-frequency, thin-margin replenishment cycles that depend on last-mile distributor reach more than any other sector. Distribution density is the dominant factor; road infrastructure matters for inter-city trunking.',
  pharma:      'Pharma supply chains require cold chain integrity and regulatory-grade storage, both of which need reliable power and certified logistics nodes. Logistics access and power reliability are elevated accordingly.',
  cold_chain:  'A cold chain break caused by grid outage is irreversible product loss. Power grid reliability becomes the most sensitive factor, followed by cold storage capacity. Road quality matters less than the reliability of the facilities at the end of the route.',
  ecommerce:   'E-commerce fulfilment velocity is directly bottlenecked by NH connectivity and warehouse quality. Road infrastructure and logistics access are paramount; distributor density proxies for last-mile delivery agent availability.',
  agriculture: 'Crop-linked supply chains are fundamentally seasonal and weather-sensitive. Monsoon disruption risk dominates — both flood damage to roads and excess moisture damaging produce in transit. Cold chain matters for perishables.',
}

function SectionNav() {
  const active = useActiveSection(SECTION_IDS)

  return (
    <nav className="space-y-1">
      {SECTION_IDS.map(id => {
        const isActive = active === id
        return (
          <a
            key={id}
            href={`#${id}`}
            onClick={e => {
              e.preventDefault()
              document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
            }}
            className="block text-xs py-1.5 px-2 rounded transition-colors"
            style={{
              color:       isActive ? '#E0981E' : 'rgba(255,255,255,0.45)',
              borderLeft:  isActive ? '2px solid #E0981E' : '2px solid transparent',
              background:  isActive ? 'rgba(224,152,30,0.06)' : 'transparent',
              paddingLeft: '10px',
            }}
          >
            {SECTION_LABELS[id]}
          </a>
        )
      })}
    </nav>
  )
}

export default function MethodologyPage() {
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  const content = (
    <div className="space-y-16 max-w-3xl">

      {/* 1 */}
      <section id="why-this-exists" className="scroll-mt-24">
        <h2 className="text-xl font-semibold text-text-primary mb-4">1. Why This Exists</h2>
        <div className="space-y-4 text-sm text-text-secondary leading-relaxed">
          <p>
            India&apos;s logistics landscape is not one market — it is 37 overlapping markets with
            vastly different road quality, monsoon exposure, cold storage capacity, power
            reliability, and distributor density. A company making a single national distribution
            decision is implicitly making 37 different risk decisions. A pharmaceutical company
            routing temperature-sensitive vaccines behaves very differently from an FMCG brand
            moving ambient packaged goods, but both face the same structural variation across
            states and UTs.
          </p>
          <p>
            SENRA scores each state and UT on seven supply chain risk dimensions, normalises them
            to a common 0–100 scale, and combines them into a composite fragility score. Six
            sector presets reweight the dimensions to reflect the operational priorities of FMCG,
            pharma, cold chain, e-commerce, and agriculture supply chains. The result is a
            decision-support layer that lets planners identify fragile nodes, compare states
            directly, and stress-test distribution strategies against different risk profiles.
          </p>
          <p>
            SENRA is designed for logistics planners, FMCG and pharma distribution managers,
            investors assessing regional exposure, and policy researchers studying infrastructure
            investment gaps. All underlying data is sourced from Indian government publications
            and is freely available under India&apos;s National Data Sharing and Accessibility Policy.
          </p>
        </div>
      </section>

      {/* 2 */}
      <section id="seven-dimensions" className="scroll-mt-24">
        <h2 className="text-xl font-semibold text-text-primary mb-4">2. The Seven Dimensions</h2>
        <div className="space-y-4">
          {DIMENSIONS.map((dim, i) => {
            const src = DIM_SOURCES[dim.key]
            return (
              <div key={dim.key} className="border border-border-default rounded-xl p-4">
                <div className="flex items-start gap-3 mb-2">
                  <span className="numeric text-xs text-text-tertiary w-5 pt-0.5 flex-shrink-0">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-text-primary text-sm">{dim.label}</span>
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                        style={{
                          background: dim.higher_is_worse ? 'rgba(192,52,29,0.15)' : 'rgba(42,133,86,0.15)',
                          color: dim.higher_is_worse ? '#C0341D' : '#2A8556',
                        }}
                      >
                        {dim.higher_is_worse ? 'Higher = higher risk' : 'Higher = lower risk'}
                      </span>
                      <span className="numeric text-[10px] text-text-tertiary ml-auto">
                        Default weight: {(dim.default_weight * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary mb-2">{dim.description}</p>
                    <div className="text-[11px] text-text-tertiary">
                      <span className="text-text-secondary">Source:</span> {src?.source}
                    </div>
                    <div className="text-[11px] text-text-tertiary mt-0.5">
                      <span className="text-text-secondary">Unit:</span> {src?.unit ?? dim.unit}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* 3 */}
      <section id="sector-weight-profiles" className="scroll-mt-24">
        <h2 className="text-xl font-semibold text-text-primary mb-4">3. Sector Weight Profiles</h2>
        <p className="text-sm text-text-secondary mb-6">
          Six sector presets reweight the seven dimensions to reflect the operational priorities
          of each industry. All columns sum to 100%.
        </p>
        <div className="overflow-x-auto mb-8">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border-subtle text-text-tertiary">
                <th className="text-left py-2 pr-4 font-medium">Dimension</th>
                {(Object.keys(SECTOR_PRESETS) as SectorPresetKey[]).map(k => (
                  <th key={k} className="text-right py-2 px-2 numeric font-medium">{SECTOR_LABELS[k]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DIMENSIONS.map(dim => (
                <tr key={dim.key} className="border-b border-border-subtle hover:bg-white/[0.02]">
                  <td className="py-2 pr-4 text-text-secondary">{dim.label}</td>
                  {(Object.keys(SECTOR_PRESETS) as SectorPresetKey[]).map(k => (
                    <td key={k} className="numeric text-right py-2 px-2 text-text-primary">
                      {(SECTOR_PRESETS[k][dim.key] * 100).toFixed(0)}%
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="border-t-2 border-border-default font-semibold">
                <td className="py-2 pr-4 text-text-tertiary text-[11px]">Sum</td>
                {(Object.keys(SECTOR_PRESETS) as SectorPresetKey[]).map(k => (
                  <td key={k} className="numeric text-right py-2 px-2 text-text-tertiary text-[11px]">
                    {Object.values(SECTOR_PRESETS[k]).reduce((a, b) => a + b, 0) === 1 ? '100%' : `${(Object.values(SECTOR_PRESETS[k]).reduce((a, b) => a + b, 0) * 100).toFixed(0)}%`}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        <div className="space-y-4 text-sm text-text-secondary">
          {(Object.keys(SECTOR_NARRATIVES) as SectorPresetKey[]).map(k => (
            <div key={k}>
              <span className="font-semibold text-text-primary">{SECTOR_LABELS[k]}: </span>
              {SECTOR_NARRATIVES[k]}
            </div>
          ))}
        </div>
      </section>

      {/* 4 */}
      <section id="normalisation" className="scroll-mt-24">
        <h2 className="text-xl font-semibold text-text-primary mb-4">4. Normalisation Method</h2>
        <p className="text-sm text-text-secondary mb-4">
          Raw dimension values vary in unit and scale — NH km/1000 sq km cannot be directly
          compared to outage hours per consumer. Each dimension is normalised to a 0–100 subscore
          using clipped min-max normalisation. Values are first clipped at the 5th and 95th
          percentile to prevent extreme outliers (e.g. Delhi&apos;s business density, Ladakh&apos;s road
          isolation) from compressing all other states into a narrow band. The direction is then
          inverted for dimensions where a higher raw value means lower risk, so that a high
          subscore always means high fragility. The final composite score is a weighted sum of
          all 7 subscores.
        </p>
        <div className="bg-bg-elevated rounded-xl p-4 font-mono text-xs text-text-primary mb-4">
          <div className="text-text-tertiary mb-2"># Pseudocode</div>
          <div>clipped  = clip(value, percentile_5, percentile_95)</div>
          <div>normed   = (clipped − p5) / (p95 − p5)   <span className="text-text-tertiary">← 0.0 to 1.0</span></div>
          <div>if higher_is_worse == False:</div>
          <div className="pl-4">normed = 1.0 − normed  <span className="text-text-tertiary">← invert direction</span></div>
          <div>subscore = normed × 100.0               <span className="text-text-tertiary">← 0 to 100</span></div>
          <div className="mt-3">composite = Σ (subscore_i × weight_i)  for i in 7 dimensions</div>
        </div>
        <p className="text-sm text-text-secondary mb-4">
          The ± uncertainty range shown next to each score reflects the varying proxy quality of
          each dimension, not statistical sampling error. It is computed as the root-sum-of-squares
          of each dimension&apos;s individual data quality uncertainty, weighted by its contribution to
          the composite. States with limited published data (Ladakh, Lakshadweep, and most
          northeastern states) carry a 1.4× penalty on their uncertainty range.
        </p>
        <p className="text-xs text-text-tertiary">
          Z-scores were considered but rejected — negative values are harder to communicate to
          non-technical users. Clipped min-max gives intuitive 0–100 subscores while still
          handling outliers.
        </p>
      </section>

      {/* 5 */}
      <section id="risk-bands" className="scroll-mt-24">
        <h2 className="text-xl font-semibold text-text-primary mb-4">5. Risk Bands</h2>
        <p className="text-sm text-text-secondary mb-4">
          Risk bands are applied to the weighted composite score, not to individual dimension
          subscores. A state can score CRITICAL on one dimension and LOW overall if other
          dimensions compensate.
        </p>
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-text-tertiary text-xs">
                <th className="text-left py-2 font-medium">Band</th>
                <th className="text-left py-2 font-medium numeric">Score range</th>
                <th className="text-left py-2 font-medium">Interpretation</th>
              </tr>
            </thead>
            <tbody>
              {[
                { band: 'CRITICAL', range: '70–100', color: '#C0341D', interp: 'Severe supply chain fragility — multiple structural vulnerabilities compound risk' },
                { band: 'HIGH',     range: '50–69',  color: '#CC7A0A', interp: 'Significant risk — one or two major vulnerabilities require active mitigation' },
                { band: 'MODERATE', range: '30–49',  color: '#AA9700', interp: 'Manageable risk — below-average infrastructure in some dimensions' },
                { band: 'LOW',      range: '0–29',   color: '#2A8556', interp: 'Relatively resilient — strong infrastructure across most dimensions' },
              ].map(b => (
                <tr key={b.band} className="border-b border-border-subtle">
                  <td className="py-3">
                    <span className="numeric text-xs font-bold px-2 py-0.5 rounded" style={{ color: b.color, background: `${b.color}20` }}>{b.band}</span>
                  </td>
                  <td className="py-3 numeric text-text-primary text-sm">{b.range}</td>
                  <td className="py-3 text-text-secondary text-xs">{b.interp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 6 */}
      <section id="limitations" className="scroll-mt-24">
        <h2 className="text-xl font-semibold text-text-primary mb-4">6. Limitations</h2>
        <div className="space-y-5 text-sm text-text-secondary leading-relaxed">
          <p>
            <strong className="text-text-primary">Data vintage.</strong> Most underlying data is
            from 2023–24 government publications. Infrastructure changes — a new NH corridor, a
            grid upgrade, or an expansion of cold storage capacity — will not be reflected until
            the next data refresh. SENRA scores represent a snapshot, not a live feed.
          </p>
          <p>
            <strong className="text-text-primary">Informal economy blind spot.</strong> Registered
            wholesale and distributor businesses (the MCA dataset) do not capture India&apos;s
            substantial informal distribution networks. States with large informal economies —
            Uttar Pradesh, Bihar — may have their distributor density underestimated, making their
            scores appear more fragile than ground reality for FMCG distribution specifically.
          </p>
          <p>
            <strong className="text-text-primary">Monsoon proxy limitations.</strong> The IMD
            composite uses district-level rainfall variability and historical flood frequency. It
            does not capture drought risk, which is relevant for agriculture supply chains, nor
            the growing unpredictability of monsoon timing driven by climate change. States
            vulnerable to dry spells (parts of Maharashtra, Karnataka) may be underscored on
            monsoon risk.
          </p>
          <p>
            <strong className="text-text-primary">Concentration proxy.</strong> The Distributor
            Concentration dimension uses a Herfindahl-style concentration score derived from
            district-level business registrations. It is a proxy for geographic market structure,
            not a direct measure of supply chain single-point-of-failure risk. A state with one
            dominant logistics hub (e.g. a major port city) may score high on concentration
            without that being operationally fragile — the hub may be highly efficient.
          </p>
          <p>
            <strong className="text-text-primary">Ladakh and Lakshadweep data sparsity.</strong>{' '}
            These two UTs have very limited published data. Their scores rely on more estimation
            than other states and carry higher uncertainty (reflected in the ± range). This will
            improve as government statistical coverage of new UTs matures.
          </p>
          <p>
            <strong className="text-text-primary">No dynamic routing.</strong> SENRA scores
            states, not routes. The corridor feature aggregates state-level scores along a
            geographic path but does not model actual road network topology, live traffic
            conditions, or real-time disruption events such as strikes, floods, or road closures.
          </p>
        </div>
      </section>

      {/* 7 */}
      <section id="citations" className="scroll-mt-24">
        <h2 className="text-xl font-semibold text-text-primary mb-4">7. Citations</h2>
        <div className="space-y-3 mb-8">
          {[
            { name: 'Ministry of Road Transport & Highways', detail: '(2023). Annual Report 2023–24. Government of India.', url: 'https://morth.nic.in' },
            { name: 'Ministry of Corporate Affairs', detail: '(2023). MSME Annual Report 2023–24. Government of India.', url: 'https://msme.gov.in' },
            { name: 'India Meteorological Department', detail: '(2023). Rainfall Statistics of India. Ministry of Earth Sciences.', url: 'https://imd.gov.in' },
            { name: 'Ministry of Commerce & Industry', detail: '(2023). LEADS 2023: Logistics Ease Across Different States. Government of India.', url: 'https://commerce.gov.in' },
            { name: 'Central Electricity Authority', detail: '(2023). Annual Report 2023–24. Ministry of Power.', url: 'https://cea.nic.in' },
            { name: 'National Centre for Cold-chain Development', detail: '(2023). Cold Chain Infrastructure Report. Ministry of Agriculture.', url: 'https://nccd.gov.in' },
          ].map((c, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-bg-elevated rounded-lg border border-border-subtle">
              <span className="numeric text-xs text-text-tertiary w-5 pt-0.5 flex-shrink-0">{i + 1}.</span>
              <div className="flex-1">
                <span className="text-sm text-text-primary font-medium">{c.name}. </span>
                <span className="text-sm text-text-secondary">{c.detail}</span>
              </div>
              <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline flex-shrink-0">↗</a>
            </div>
          ))}
        </div>

        <div className="border border-border-default rounded-xl p-4">
          <div className="text-xs text-text-tertiary mb-2 font-medium">How to cite SENRA</div>
          <div className="font-mono text-xs text-text-secondary whitespace-pre-wrap leading-relaxed">{`Menon, H. (2024). SENRA: Supply and Economic Network Risk Analysis [Data tool].
Retrieved from https://senra.vercel.app`}</div>
        </div>
      </section>

      <div className="pb-16 text-xs text-text-tertiary">
        All government data sourced under India&apos;s National Data Sharing and Accessibility Policy (NDSAP). Source code MIT licensed.{' '}
        <Link href="/" className="text-accent hover:underline">← Back to dashboard</Link>
      </div>
    </div>
  )

  return (
    <div className="px-6 py-8 max-w-screen-xl mx-auto">
      <div className="mb-6">
        <div className="text-xs text-text-tertiary mb-2">
          <Link href="/" className="hover:text-accent transition-colors">SENRA</Link>
          <span className="mx-1.5">/</span>
          <span>Methodology</span>
        </div>
        <h1 className="text-2xl font-semibold text-text-primary">Methodology</h1>
        <p className="text-sm text-text-secondary mt-1">
          How SENRA scores 37 states and UTs on supply chain fragility
        </p>
      </div>

      {isDesktop ? (
        <div className="flex gap-10">
          <aside className="w-52 flex-shrink-0">
            <div className="sticky top-20">
              <SectionNav />
            </div>
          </aside>
          <main className="flex-1 min-w-0">{content}</main>
        </div>
      ) : (
        <main>{content}</main>
      )}
    </div>
  )
}
