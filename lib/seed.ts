import { getDb } from './db'
import { computeFragilityScores, SCORER_PRESETS } from './scorer'

const FALLBACK_ROAD: Record<string, number> = {
  'Andhra Pradesh': 38.0, 'Arunachal Pradesh': 10.0, 'Assam': 25.0, 'Bihar': 28.0,
  'Chhattisgarh': 18.0, 'Goa': 85.0, 'Gujarat': 45.0, 'Haryana': 68.0,
  'Himachal Pradesh': 22.0, 'Jharkhand': 20.0, 'Karnataka': 35.0, 'Kerala': 30.0,
  'Madhya Pradesh': 22.0, 'Maharashtra': 38.0, 'Manipur': 18.0, 'Meghalaya': 22.0,
  'Mizoram': 15.0, 'Nagaland': 18.0, 'Odisha': 25.0, 'Punjab': 72.0,
  'Rajasthan': 15.0, 'Sikkim': 15.0, 'Tamil Nadu': 42.0, 'Telangana': 40.0,
  'Tripura': 35.0, 'Uttar Pradesh': 32.0, 'Uttarakhand': 24.0, 'West Bengal': 48.0,
  'Andaman and Nicobar Islands': 12.0, 'Chandigarh': 120.0,
  'Dadra and Nagar Haveli and Daman and Diu': 70.0, 'Delhi': 150.0,
  'Jammu and Kashmir': 18.0, 'Ladakh': 8.0, 'Lakshadweep': 5.0, 'Puducherry': 90.0,
}

const FALLBACK_BUSINESS: Record<string, number> = {
  'Andhra Pradesh': 280.0, 'Arunachal Pradesh': 70.0, 'Assam': 110.0, 'Bihar': 80.0,
  'Chhattisgarh': 140.0, 'Goa': 380.0, 'Gujarat': 490.0, 'Haryana': 320.0,
  'Himachal Pradesh': 180.0, 'Jharkhand': 100.0, 'Karnataka': 450.0, 'Kerala': 310.0,
  'Madhya Pradesh': 180.0, 'Maharashtra': 580.0, 'Manipur': 90.0, 'Meghalaya': 100.0,
  'Mizoram': 85.0, 'Nagaland': 75.0, 'Odisha': 130.0, 'Punjab': 310.0,
  'Rajasthan': 240.0, 'Sikkim': 120.0, 'Tamil Nadu': 420.0, 'Telangana': 350.0,
  'Tripura': 95.0, 'Uttar Pradesh': 160.0, 'Uttarakhand': 200.0, 'West Bengal': 260.0,
  'Andaman and Nicobar Islands': 80.0, 'Chandigarh': 800.0,
  'Dadra and Nagar Haveli and Daman and Diu': 280.0, 'Delhi': 1200.0,
  'Jammu and Kashmir': 150.0, 'Ladakh': 60.0, 'Lakshadweep': 40.0, 'Puducherry': 350.0,
}

const FALLBACK_MONSOON: Record<string, number> = {
  'Andhra Pradesh': 55.0, 'Arunachal Pradesh': 78.0, 'Assam': 88.0, 'Bihar': 82.0,
  'Chhattisgarh': 58.0, 'Goa': 60.0, 'Gujarat': 52.0, 'Haryana': 38.0,
  'Himachal Pradesh': 42.0, 'Jharkhand': 65.0, 'Karnataka': 48.0, 'Kerala': 68.0,
  'Madhya Pradesh': 55.0, 'Maharashtra': 50.0, 'Manipur': 82.0, 'Meghalaya': 90.0,
  'Mizoram': 80.0, 'Nagaland': 76.0, 'Odisha': 72.0, 'Punjab': 38.0,
  'Rajasthan': 45.0, 'Sikkim': 78.0, 'Tamil Nadu': 52.0, 'Telangana': 50.0,
  'Tripura': 80.0, 'Uttar Pradesh': 62.0, 'Uttarakhand': 55.0, 'West Bengal': 75.0,
  'Andaman and Nicobar Islands': 72.0, 'Chandigarh': 30.0,
  'Dadra and Nagar Haveli and Daman and Diu': 55.0, 'Delhi': 32.0,
  'Jammu and Kashmir': 45.0, 'Ladakh': 15.0, 'Lakshadweep': 65.0, 'Puducherry': 50.0,
}

const FALLBACK_LEADS: Record<string, number> = {
  'Andhra Pradesh': 76.0, 'Arunachal Pradesh': 32.0, 'Assam': 46.0, 'Bihar': 42.0,
  'Chhattisgarh': 48.0, 'Goa': 62.0, 'Gujarat': 74.0, 'Haryana': 65.0,
  'Himachal Pradesh': 52.0, 'Jharkhand': 44.0, 'Karnataka': 70.0, 'Kerala': 66.0,
  'Madhya Pradesh': 52.0, 'Maharashtra': 72.0, 'Manipur': 38.0, 'Meghalaya': 40.0,
  'Mizoram': 36.0, 'Nagaland': 35.0, 'Odisha': 55.0, 'Punjab': 68.0,
  'Rajasthan': 60.0, 'Sikkim': 38.0, 'Tamil Nadu': 74.0, 'Telangana': 72.0,
  'Tripura': 42.0, 'Uttar Pradesh': 54.0, 'Uttarakhand': 50.0, 'West Bengal': 58.0,
  'Andaman and Nicobar Islands': 35.0, 'Chandigarh': 65.0,
  'Dadra and Nagar Haveli and Daman and Diu': 55.0, 'Delhi': 70.0,
  'Jammu and Kashmir': 45.0, 'Ladakh': 28.0, 'Lakshadweep': 25.0, 'Puducherry': 60.0,
}

const FALLBACK_POWER: Record<string, number> = {
  'Andhra Pradesh': 110.0, 'Arunachal Pradesh': 700.0, 'Assam': 500.0, 'Bihar': 900.0,
  'Chhattisgarh': 350.0, 'Goa': 120.0, 'Gujarat': 80.0, 'Haryana': 150.0,
  'Himachal Pradesh': 180.0, 'Jharkhand': 750.0, 'Karnataka': 95.0, 'Kerala': 85.0,
  'Madhya Pradesh': 380.0, 'Maharashtra': 100.0, 'Manipur': 650.0, 'Meghalaya': 550.0,
  'Mizoram': 580.0, 'Nagaland': 600.0, 'Odisha': 450.0, 'Punjab': 120.0,
  'Rajasthan': 350.0, 'Sikkim': 400.0, 'Tamil Nadu': 90.0, 'Telangana': 105.0,
  'Tripura': 480.0, 'Uttar Pradesh': 600.0, 'Uttarakhand': 200.0, 'West Bengal': 300.0,
  'Andaman and Nicobar Islands': 350.0, 'Chandigarh': 30.0,
  'Dadra and Nagar Haveli and Daman and Diu': 150.0, 'Delhi': 50.0,
  'Jammu and Kashmir': 400.0, 'Ladakh': 500.0, 'Lakshadweep': 300.0, 'Puducherry': 100.0,
}

const FALLBACK_COLD: Record<string, number> = {
  'Andhra Pradesh': 250.0, 'Arunachal Pradesh': 25.0, 'Assam': 55.0, 'Bihar': 80.0,
  'Chhattisgarh': 70.0, 'Goa': 90.0, 'Gujarat': 290.0, 'Haryana': 320.0,
  'Himachal Pradesh': 180.0, 'Jharkhand': 60.0, 'Karnataka': 180.0, 'Kerala': 120.0,
  'Madhya Pradesh': 220.0, 'Maharashtra': 280.0, 'Manipur': 35.0, 'Meghalaya': 40.0,
  'Mizoram': 30.0, 'Nagaland': 28.0, 'Odisha': 100.0, 'Punjab': 480.0,
  'Rajasthan': 200.0, 'Sikkim': 20.0, 'Tamil Nadu': 200.0, 'Telangana': 210.0,
  'Tripura': 50.0, 'Uttar Pradesh': 850.0, 'Uttarakhand': 150.0, 'West Bengal': 450.0,
  'Andaman and Nicobar Islands': 45.0, 'Chandigarh': 200.0,
  'Dadra and Nagar Haveli and Daman and Diu': 100.0, 'Delhi': 230.0,
  'Jammu and Kashmir': 80.0, 'Ladakh': 30.0, 'Lakshadweep': 15.0, 'Puducherry': 80.0,
}

const FALLBACK_HHI: Record<string, number> = {
  'Andhra Pradesh': 0.22, 'Arunachal Pradesh': 0.70, 'Assam': 0.60, 'Bihar': 0.50,
  'Chhattisgarh': 0.45, 'Goa': 0.42, 'Gujarat': 0.20, 'Haryana': 0.28,
  'Himachal Pradesh': 0.52, 'Jharkhand': 0.55, 'Karnataka': 0.18, 'Kerala': 0.28,
  'Madhya Pradesh': 0.38, 'Maharashtra': 0.15, 'Manipur': 0.68, 'Meghalaya': 0.65,
  'Mizoram': 0.75, 'Nagaland': 0.72, 'Odisha': 0.42, 'Punjab': 0.25,
  'Rajasthan': 0.35, 'Sikkim': 0.78, 'Tamil Nadu': 0.18, 'Telangana': 0.24,
  'Tripura': 0.62, 'Uttar Pradesh': 0.40, 'Uttarakhand': 0.48, 'West Bengal': 0.30,
  'Andaman and Nicobar Islands': 0.88, 'Chandigarh': 0.30,
  'Dadra and Nagar Haveli and Daman and Diu': 0.75, 'Delhi': 0.12,
  'Jammu and Kashmir': 0.55, 'Ladakh': 0.85, 'Lakshadweep': 0.92, 'Puducherry': 0.35,
}

export const STATES_SEED = [
  { name: 'Andhra Pradesh',   slug: 'andhra-pradesh',   iso_code: 'IN-AP', region: 'South',     is_ut: 0 },
  { name: 'Arunachal Pradesh',slug: 'arunachal-pradesh',iso_code: 'IN-AR', region: 'Northeast', is_ut: 0 },
  { name: 'Assam',            slug: 'assam',             iso_code: 'IN-AS', region: 'Northeast', is_ut: 0 },
  { name: 'Bihar',            slug: 'bihar',             iso_code: 'IN-BR', region: 'East',      is_ut: 0 },
  { name: 'Chhattisgarh',     slug: 'chhattisgarh',     iso_code: 'IN-CT', region: 'Central',   is_ut: 0 },
  { name: 'Goa',              slug: 'goa',               iso_code: 'IN-GA', region: 'West',      is_ut: 0 },
  { name: 'Gujarat',          slug: 'gujarat',           iso_code: 'IN-GJ', region: 'West',      is_ut: 0 },
  { name: 'Haryana',          slug: 'haryana',           iso_code: 'IN-HR', region: 'North',     is_ut: 0 },
  { name: 'Himachal Pradesh', slug: 'himachal-pradesh',  iso_code: 'IN-HP', region: 'North',     is_ut: 0 },
  { name: 'Jharkhand',        slug: 'jharkhand',         iso_code: 'IN-JH', region: 'East',      is_ut: 0 },
  { name: 'Karnataka',        slug: 'karnataka',         iso_code: 'IN-KA', region: 'South',     is_ut: 0 },
  { name: 'Kerala',           slug: 'kerala',            iso_code: 'IN-KL', region: 'South',     is_ut: 0 },
  { name: 'Madhya Pradesh',   slug: 'madhya-pradesh',    iso_code: 'IN-MP', region: 'Central',   is_ut: 0 },
  { name: 'Maharashtra',      slug: 'maharashtra',       iso_code: 'IN-MH', region: 'West',      is_ut: 0 },
  { name: 'Manipur',          slug: 'manipur',           iso_code: 'IN-MN', region: 'Northeast', is_ut: 0 },
  { name: 'Meghalaya',        slug: 'meghalaya',         iso_code: 'IN-ML', region: 'Northeast', is_ut: 0 },
  { name: 'Mizoram',          slug: 'mizoram',           iso_code: 'IN-MZ', region: 'Northeast', is_ut: 0 },
  { name: 'Nagaland',         slug: 'nagaland',          iso_code: 'IN-NL', region: 'Northeast', is_ut: 0 },
  { name: 'Odisha',           slug: 'odisha',            iso_code: 'IN-OD', region: 'East',      is_ut: 0 },
  { name: 'Punjab',           slug: 'punjab',            iso_code: 'IN-PB', region: 'North',     is_ut: 0 },
  { name: 'Rajasthan',        slug: 'rajasthan',         iso_code: 'IN-RJ', region: 'North',     is_ut: 0 },
  { name: 'Sikkim',           slug: 'sikkim',            iso_code: 'IN-SK', region: 'Northeast', is_ut: 0 },
  { name: 'Tamil Nadu',       slug: 'tamil-nadu',        iso_code: 'IN-TN', region: 'South',     is_ut: 0 },
  { name: 'Telangana',        slug: 'telangana',         iso_code: 'IN-TS', region: 'South',     is_ut: 0 },
  { name: 'Tripura',          slug: 'tripura',           iso_code: 'IN-TR', region: 'Northeast', is_ut: 0 },
  { name: 'Uttar Pradesh',    slug: 'uttar-pradesh',     iso_code: 'IN-UP', region: 'North',     is_ut: 0 },
  { name: 'Uttarakhand',      slug: 'uttarakhand',       iso_code: 'IN-UT', region: 'North',     is_ut: 0 },
  { name: 'West Bengal',      slug: 'west-bengal',       iso_code: 'IN-WB', region: 'East',      is_ut: 0 },
  { name: 'Andaman and Nicobar Islands',            slug: 'andaman-and-nicobar-islands',            iso_code: 'IN-AN', region: 'Northeast', is_ut: 1 },
  { name: 'Chandigarh',       slug: 'chandigarh',        iso_code: 'IN-CH', region: 'North',     is_ut: 1 },
  { name: 'Dadra and Nagar Haveli and Daman and Diu',slug: 'dadra-and-nagar-haveli-and-daman-and-diu', iso_code: 'IN-DH', region: 'West', is_ut: 1 },
  { name: 'Delhi',            slug: 'delhi',             iso_code: 'IN-DL', region: 'North',     is_ut: 1 },
  { name: 'Jammu and Kashmir',slug: 'jammu-and-kashmir', iso_code: 'IN-JK', region: 'North',     is_ut: 1 },
  { name: 'Ladakh',           slug: 'ladakh',            iso_code: 'IN-LA', region: 'North',     is_ut: 1 },
  { name: 'Lakshadweep',      slug: 'lakshadweep',       iso_code: 'IN-LD', region: 'South',     is_ut: 1 },
  { name: 'Puducherry',       slug: 'puducherry',        iso_code: 'IN-PY', region: 'South',     is_ut: 1 },
]

const SLUG_MAP: Record<string, string> = Object.fromEntries(STATES_SEED.map(s => [s.name, s.slug]))

export function seedIfEmpty(): void {
  const db = getDb()
  const { c } = db.prepare('SELECT COUNT(*) as c FROM fragility_scores').get() as { c: number }
  if (c > 0) return

  console.log('[senra] Seeding database...')

  const insertState = db.prepare(`
    INSERT OR IGNORE INTO states (name, slug, iso_code, region, is_ut, raw_data)
    VALUES (@name, @slug, @iso_code, @region, @is_ut, @raw_data)
  `)

  for (const s of STATES_SEED) {
    const rawData = {
      road_quality:         FALLBACK_ROAD[s.name]     ?? null,
      business_density:     FALLBACK_BUSINESS[s.name] ?? null,
      monsoon_disruption:   FALLBACK_MONSOON[s.name]  ?? null,
      logistics_access:     FALLBACK_LEADS[s.name]    ?? null,
      power_reliability:    FALLBACK_POWER[s.name]    ?? null,
      cold_chain_infra:     FALLBACK_COLD[s.name]     ?? null,
      market_concentration: FALLBACK_HHI[s.name]      ?? null,
    }
    insertState.run({ ...s, raw_data: JSON.stringify(rawData) })
  }

  const rawData: Record<string, Record<string, number | null>> = {}
  for (const s of STATES_SEED) {
    rawData[s.name] = {
      road_quality:         FALLBACK_ROAD[s.name]     ?? null,
      business_density:     FALLBACK_BUSINESS[s.name] ?? null,
      monsoon_disruption:   FALLBACK_MONSOON[s.name]  ?? null,
      logistics_access:     FALLBACK_LEADS[s.name]    ?? null,
      power_reliability:    FALLBACK_POWER[s.name]    ?? null,
      cold_chain_infra:     FALLBACK_COLD[s.name]     ?? null,
      market_concentration: FALLBACK_HHI[s.name]      ?? null,
    }
  }

  const now = new Date().toISOString()
  const stateIdMap = Object.fromEntries(
    (db.prepare('SELECT id, name FROM states').all() as { id: number; name: string }[])
      .map(r => [r.name, r.id])
  )

  const insertScore = db.prepare(`
    INSERT INTO fragility_scores
    (state_id, computed_at, score, rank, band, confidence,
     subscore_road, subscore_business, subscore_monsoon, subscore_logistics,
     subscore_power, subscore_cold_chain, subscore_concentration,
     score_uncertainty, imputed_dimensions, sector_preset)
    VALUES
    (@state_id, @computed_at, @score, @rank, @band, @confidence,
     @subscore_road, @subscore_business, @subscore_monsoon, @subscore_logistics,
     @subscore_power, @subscore_cold_chain, @subscore_concentration,
     @score_uncertainty, @imputed_dimensions, @sector_preset)
  `)

  const seedAll = db.transaction(() => {
    for (const [preset, weights] of Object.entries(SCORER_PRESETS)) {
      const scores = computeFragilityScores(rawData, weights, SLUG_MAP)
      for (const s of scores) {
        const stateId = stateIdMap[s.state]
        if (!stateId) continue
        insertScore.run({
          state_id:           stateId,
          computed_at:        now,
          score:              s.score,
          rank:               s.rank,
          band:               s.band,
          confidence:         s.confidence,
          subscore_road:      s.subscores.road_quality,
          subscore_business:  s.subscores.business_density,
          subscore_monsoon:   s.subscores.monsoon_disruption,
          subscore_logistics: s.subscores.logistics_access,
          subscore_power:     s.subscores.power_reliability,
          subscore_cold_chain:s.subscores.cold_chain_infra,
          subscore_concentration: s.subscores.market_concentration,
          score_uncertainty:  s.scoreUncertainty,
          imputed_dimensions: JSON.stringify(s.imputedDims),
          sector_preset:      preset,
        })
      }
    }
    db.prepare(`INSERT INTO data_refresh_log (status, states_count) VALUES ('success', ?)`).run(STATES_SEED.length)
  })

  seedAll()
  console.log('[senra] Seed complete — 36 states, 6 presets')
}
