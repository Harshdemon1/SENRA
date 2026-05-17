import type { DimensionDef, SectorPresetKey, WeightsMap } from './types'

export const DIMENSIONS: DimensionDef[] = [
  { key: 'road_quality',         label: 'Road Infrastructure',       description: 'National highway density as proxy for road quality',                  unit: 'NH km per 1000 sq km',   default_weight: 0.22, higher_is_worse: false },
  { key: 'business_density',     label: 'Distributor Density',       description: 'Registered distributor/wholesale businesses per capita',               unit: 'companies per 100,000 people', default_weight: 0.18, higher_is_worse: false },
  { key: 'monsoon_disruption',   label: 'Monsoon Disruption Risk',   description: 'Rainfall volume, variability, and flood frequency',                   unit: 'Composite index',        default_weight: 0.18, higher_is_worse: true  },
  { key: 'logistics_access',     label: 'Logistics Access (LEADS)',  description: 'Government LEADS index: port, warehouse, service quality',             unit: 'LEADS score 0–100',      default_weight: 0.16, higher_is_worse: false },
  { key: 'power_reliability',    label: 'Power Grid Reliability',    description: 'Average annual power outage duration per consumer',                   unit: 'Annual outage hours',    default_weight: 0.12, higher_is_worse: true  },
  { key: 'cold_chain_infra',     label: 'Cold Chain Infrastructure', description: 'Cold storage capacity relative to population',                        unit: 'MT capacity per lakh',   default_weight: 0.08, higher_is_worse: false },
  { key: 'market_concentration', label: 'Distributor Concentration', description: 'Market concentration of distributors (higher = riskier)',             unit: 'HHI proxy',              default_weight: 0.06, higher_is_worse: true  },
]

export const DEFAULT_WEIGHTS: WeightsMap = Object.fromEntries(
  DIMENSIONS.map(d => [d.key, d.default_weight])
)

export const SECTOR_PRESETS: Record<SectorPresetKey, WeightsMap> = {
  default: {    road_quality: 0.22, business_density: 0.18, monsoon_disruption: 0.18, logistics_access: 0.16, power_reliability: 0.12, cold_chain_infra: 0.08, market_concentration: 0.06 },
  fmcg: {       road_quality: 0.28, business_density: 0.26, monsoon_disruption: 0.15, logistics_access: 0.13, power_reliability: 0.07, cold_chain_infra: 0.05, market_concentration: 0.06 },
  pharma: {     road_quality: 0.14, business_density: 0.10, monsoon_disruption: 0.12, logistics_access: 0.20, power_reliability: 0.20, cold_chain_infra: 0.20, market_concentration: 0.04 },
  cold_chain: { road_quality: 0.13, business_density: 0.08, monsoon_disruption: 0.13, logistics_access: 0.16, power_reliability: 0.24, cold_chain_infra: 0.22, market_concentration: 0.04 },
  ecommerce: {  road_quality: 0.22, business_density: 0.30, monsoon_disruption: 0.16, logistics_access: 0.14, power_reliability: 0.09, cold_chain_infra: 0.03, market_concentration: 0.06 },
  agriculture: { road_quality: 0.18, business_density: 0.10, monsoon_disruption: 0.30, logistics_access: 0.14, power_reliability: 0.10, cold_chain_infra: 0.14, market_concentration: 0.04 },
}

export const SECTOR_LABELS: Record<SectorPresetKey, string> = {
  default: 'Default', fmcg: 'FMCG', pharma: 'Pharma',
  cold_chain: 'Cold Chain', ecommerce: 'E-Commerce', agriculture: 'Agriculture',
}

export const BAND_COLORS = {
  CRITICAL: '#C0341D',
  HIGH:     '#CC7A0A',
  MODERATE: '#AA9700',
  LOW:      '#2A8556',
} as const

export const BAND_BG_COLORS = {
  CRITICAL: '#2A0D09',
  HIGH:     '#2C1C04',
  MODERATE: '#252200',
  LOW:      '#0A2018',
} as const

export const STATE_NAME_TO_SLUG: Record<string, string> = {
  'Andhra Pradesh': 'andhra-pradesh',
  'Arunachal Pradesh': 'arunachal-pradesh',
  'Assam': 'assam',
  'Bihar': 'bihar',
  'Chhattisgarh': 'chhattisgarh',
  'Goa': 'goa',
  'Gujarat': 'gujarat',
  'Haryana': 'haryana',
  'Himachal Pradesh': 'himachal-pradesh',
  'Jharkhand': 'jharkhand',
  'Karnataka': 'karnataka',
  'Kerala': 'kerala',
  'Madhya Pradesh': 'madhya-pradesh',
  'Maharashtra': 'maharashtra',
  'Manipur': 'manipur',
  'Meghalaya': 'meghalaya',
  'Mizoram': 'mizoram',
  'Nagaland': 'nagaland',
  'Odisha': 'odisha',
  'Punjab': 'punjab',
  'Rajasthan': 'rajasthan',
  'Sikkim': 'sikkim',
  'Tamil Nadu': 'tamil-nadu',
  'Telangana': 'telangana',
  'Tripura': 'tripura',
  'Uttar Pradesh': 'uttar-pradesh',
  'Uttarakhand': 'uttarakhand',
  'West Bengal': 'west-bengal',
  'Andaman & Nicobar Island': 'andaman-and-nicobar-islands',
  'Andaman and Nicobar Islands': 'andaman-and-nicobar-islands',
  'Andaman and Nicobar': 'andaman-and-nicobar-islands',
  'Chandigarh': 'chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu': 'dadra-and-nagar-haveli-and-daman-and-diu',
  'Dadra and Nagar Haveli': 'dadra-and-nagar-haveli-and-daman-and-diu',
  'Daman and Diu': 'dadra-and-nagar-haveli-and-daman-and-diu',
  'Orissa': 'odisha',
  'Uttaranchal': 'uttarakhand',
  'Delhi': 'delhi',
  'Jammu & Kashmir': 'jammu-and-kashmir',
  'Jammu and Kashmir': 'jammu-and-kashmir',
  'Ladakh': 'ladakh',
  'Lakshadweep': 'lakshadweep',
  'Puducherry': 'puducherry',
}

export const SLUG_TO_STATE_NAME: Record<string, string> = Object.fromEntries(
  Object.entries(STATE_NAME_TO_SLUG).map(([k, v]) => [v, k])
)
