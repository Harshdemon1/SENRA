export const SECTOR_WEIGHTS: Record<string, Record<string, number>> = {
  default: {
    road_quality: 0.22, business_density: 0.18, monsoon_disruption: 0.18,
    logistics_access: 0.16, power_reliability: 0.12, cold_chain_infra: 0.08, market_concentration: 0.06,
  },
  fmcg: {
    road_quality: 0.20, business_density: 0.22, monsoon_disruption: 0.15,
    logistics_access: 0.18, power_reliability: 0.10, cold_chain_infra: 0.08, market_concentration: 0.07,
  },
  pharma: {
    road_quality: 0.18, business_density: 0.20, monsoon_disruption: 0.15,
    logistics_access: 0.20, power_reliability: 0.15, cold_chain_infra: 0.08, market_concentration: 0.04,
  },
  cold_chain: {
    road_quality: 0.15, business_density: 0.12, monsoon_disruption: 0.20,
    logistics_access: 0.18, power_reliability: 0.20, cold_chain_infra: 0.12, market_concentration: 0.03,
  },
  ecommerce: {
    road_quality: 0.25, business_density: 0.20, monsoon_disruption: 0.12,
    logistics_access: 0.22, power_reliability: 0.10, cold_chain_infra: 0.06, market_concentration: 0.05,
  },
  agriculture: {
    road_quality: 0.20, business_density: 0.15, monsoon_disruption: 0.25,
    logistics_access: 0.12, power_reliability: 0.10, cold_chain_infra: 0.13, market_concentration: 0.05,
  },
}
