export interface DimensionDef {
  key: string
  label: string
  defaultWeight: number
  higherIsWorse: boolean
  unit: string
  description: string
}

export const SCORER_DIMENSIONS: DimensionDef[] = [
  { key: 'road_quality',         label: 'Road Infrastructure',       defaultWeight: 0.22, higherIsWorse: false, unit: 'NH km per 1000 sq km',      description: 'National highway density as proxy for road quality' },
  { key: 'business_density',     label: 'Distributor Density',       defaultWeight: 0.18, higherIsWorse: false, unit: 'companies per 100,000',      description: 'Registered distributor/wholesale businesses per capita' },
  { key: 'monsoon_disruption',   label: 'Monsoon Disruption Risk',   defaultWeight: 0.18, higherIsWorse: true,  unit: '',                           description: 'Rainfall volume, variability, and flood frequency' },
  { key: 'logistics_access',     label: 'Logistics Access (LEADS)',  defaultWeight: 0.16, higherIsWorse: false, unit: 'LEADS score 0–100',          description: 'Government LEADS index: port, warehouse, service quality' },
  { key: 'power_reliability',    label: 'Power Grid Reliability',    defaultWeight: 0.12, higherIsWorse: true,  unit: 'Annual outage hours',        description: 'Average annual power outage duration per consumer' },
  { key: 'cold_chain_infra',     label: 'Cold Chain Infrastructure', defaultWeight: 0.08, higherIsWorse: false, unit: 'MT capacity per lakh',       description: 'Cold storage capacity relative to population' },
  { key: 'market_concentration', label: 'Distributor Concentration', defaultWeight: 0.06, higherIsWorse: true,  unit: 'Concentration score',        description: 'Distributor market spread — fewer dominant players means higher disruption risk' },
]

export const SCORER_PRESETS: Record<string, Record<string, number>> = {
  default:     { road_quality: 0.22, business_density: 0.18, monsoon_disruption: 0.18, logistics_access: 0.16, power_reliability: 0.12, cold_chain_infra: 0.08, market_concentration: 0.06 },
  fmcg:        { road_quality: 0.28, business_density: 0.26, monsoon_disruption: 0.15, logistics_access: 0.13, power_reliability: 0.07, cold_chain_infra: 0.05, market_concentration: 0.06 },
  pharma:      { road_quality: 0.14, business_density: 0.10, monsoon_disruption: 0.12, logistics_access: 0.20, power_reliability: 0.20, cold_chain_infra: 0.20, market_concentration: 0.04 },
  cold_chain:  { road_quality: 0.13, business_density: 0.08, monsoon_disruption: 0.13, logistics_access: 0.16, power_reliability: 0.24, cold_chain_infra: 0.22, market_concentration: 0.04 },
  ecommerce:   { road_quality: 0.22, business_density: 0.30, monsoon_disruption: 0.16, logistics_access: 0.14, power_reliability: 0.09, cold_chain_infra: 0.03, market_concentration: 0.06 },
  agriculture: { road_quality: 0.18, business_density: 0.10, monsoon_disruption: 0.30, logistics_access: 0.14, power_reliability: 0.10, cold_chain_infra: 0.14, market_concentration: 0.04 },
}

export const SCORER_REGION_MAP: Record<string, string> = {
  'Andhra Pradesh': 'South', 'Arunachal Pradesh': 'Northeast', 'Assam': 'Northeast',
  'Bihar': 'East', 'Chhattisgarh': 'Central', 'Goa': 'West', 'Gujarat': 'West',
  'Haryana': 'North', 'Himachal Pradesh': 'North', 'Jharkhand': 'East',
  'Karnataka': 'South', 'Kerala': 'South', 'Madhya Pradesh': 'Central',
  'Maharashtra': 'West', 'Manipur': 'Northeast', 'Meghalaya': 'Northeast',
  'Mizoram': 'Northeast', 'Nagaland': 'Northeast', 'Odisha': 'East',
  'Punjab': 'North', 'Rajasthan': 'North', 'Sikkim': 'Northeast',
  'Tamil Nadu': 'South', 'Telangana': 'South', 'Tripura': 'Northeast',
  'Uttar Pradesh': 'North', 'Uttarakhand': 'North', 'West Bengal': 'East',
  'Andaman and Nicobar Islands': 'Northeast', 'Chandigarh': 'North',
  'Dadra and Nagar Haveli and Daman and Diu': 'West', 'Delhi': 'North',
  'Jammu and Kashmir': 'North', 'Ladakh': 'North', 'Lakshadweep': 'South',
  'Puducherry': 'South',
}

function pct(arr: number[], p: number): number {
  const sorted = [...arr].sort((a, b) => a - b)
  const idx = (p / 100) * (sorted.length - 1)
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo)
}

function normalizeDimension(values: number[], higherIsWorse: boolean): number[] {
  const valid = values.filter(v => !isNaN(v))
  if (valid.length === 0) return values.map(() => 50)
  const p5  = pct(valid, 5)
  const p95 = pct(valid, 95)
  if (p95 === p5) return values.map(() => 50)
  return values.map(v => {
    const clipped = Math.min(Math.max(v, p5), p95)
    let normed = (clipped - p5) / (p95 - p5)
    if (!higherIsWorse) normed = 1 - normed
    return Math.round(normed * 1000) / 10
  })
}

function imputeMissing(
  values: number[],
  stateNames: string[],
  regionMap: Record<string, string>
): { imputed: number[]; isImputed: boolean[] } {
  const imputed = [...values]
  const isImputed = values.map(v => isNaN(v))
  const validValues = values.filter(v => !isNaN(v)).sort((a, b) => a - b)
  const nationalMedian = validValues[Math.floor(validValues.length / 2)] ?? 50

  imputed.forEach((v, i) => {
    if (!isNaN(v)) return
    const region = regionMap[stateNames[i]]
    const regionalVals = values
      .filter((rv, ri) => !isNaN(rv) && regionMap[stateNames[ri]] === region)
      .sort((a, b) => a - b)
    imputed[i] = regionalVals.length > 0
      ? regionalVals[Math.floor(regionalVals.length / 2)]
      : nationalMedian
  })

  return { imputed, isImputed }
}

export interface ComputedScore {
  state: string
  slug: string
  score: number
  rank: number
  band: string
  confidence: number
  subscores: Record<string, number>
  imputedDims: string[]
}

export function computeFragilityScores(
  rawData: Record<string, Record<string, number | null>>,
  weights: Record<string, number>,
  slugMap: Record<string, string>
): ComputedScore[] {
  const states = Object.keys(rawData)
  const dimNormed: Record<string, number[]> = {}
  const dimImputed: Record<string, boolean[]> = {}

  for (const dim of SCORER_DIMENSIONS) {
    const raw = states.map(s => rawData[s][dim.key] ?? NaN)
    const { imputed, isImputed } = imputeMissing(raw, states, SCORER_REGION_MAP)
    dimNormed[dim.key] = normalizeDimension(imputed, dim.higherIsWorse)
    dimImputed[dim.key] = isImputed
  }

  const results: ComputedScore[] = states.map((state, i) => {
    const subscores: Record<string, number> = {}
    let composite = 0
    let imputedCount = 0

    for (const dim of SCORER_DIMENSIONS) {
      subscores[dim.key] = dimNormed[dim.key][i]
      composite += subscores[dim.key] * (weights[dim.key] ?? dim.defaultWeight)
      if (dimImputed[dim.key][i]) imputedCount++
    }

    return {
      state,
      slug: slugMap[state] ?? state.toLowerCase().replace(/\s+/g, '-'),
      score: Math.round(composite * 10) / 10,
      rank: 0,
      band: '',
      confidence: Math.round((1 - imputedCount / SCORER_DIMENSIONS.length) * 100),
      subscores,
      imputedDims: SCORER_DIMENSIONS.filter(d => dimImputed[d.key][i]).map(d => d.key),
    }
  })

  results.sort((a, b) => b.score - a.score)

  const n = results.length
  const criticalN = Math.max(1, Math.round(n * 0.20))
  const highN     = Math.max(1, Math.round(n * 0.30))
  const moderateN = Math.max(1, Math.round(n * 0.30))

  results.forEach((r, i) => {
    r.rank = i + 1
    if (i < criticalN) r.band = 'CRITICAL'
    else if (i < criticalN + highN) r.band = 'HIGH'
    else if (i < criticalN + highN + moderateN) r.band = 'MODERATE'
    else r.band = 'LOW'
  })

  return results
}
