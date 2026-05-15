export type Band = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW'

export interface Subscores {
  road_quality: number
  business_density: number
  monsoon_disruption: number
  logistics_access: number
  power_reliability: number
  cold_chain_infra: number
  market_concentration: number
}

export interface StateScore {
  state: string
  slug: string
  iso_code: string
  region: string
  score: number
  rank: number
  band: Band
  confidence: number
  subscores: Subscores
  imputed_dims: string[]
}

export interface ScorePoint {
  date: string
  score: number
  band: Band
}

export interface StateProfile extends StateScore {
  history: ScorePoint[]
  similar: StateScore[]
  raw_values: Record<string, number | null>
}

export interface ScoresPayload {
  sector: string
  updated_at: string
  states: StateScore[]
}

export interface ComparePayload {
  sector: string
  states: StateScore[]
  dimension_winners: Record<string, string>
}

export interface MetaPayload {
  last_updated: string | null
  status: string
  sources_ok: Record<string, boolean>
  states_count: number
  avg_confidence: number
  total_scores: number
}

export type WeightsMap = Record<string, number>

export interface DimensionDef {
  key: keyof Subscores
  label: string
  description: string
  unit: string
  default_weight: number
  higher_is_worse: boolean
}

export type SectorPresetKey = 'default' | 'fmcg' | 'pharma' | 'cold_chain' | 'ecommerce' | 'agriculture'
