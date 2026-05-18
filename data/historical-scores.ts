// Synthetic-but-plausible historical scores for 37 states, 2019–2024.
// Based on real infrastructure trends: PM Gati Shakti (2021+) improved road/logistics
// scores; COVID 2020 caused disruption; flood-prone NE states show worsening monsoon risk.
// These estimates are clearly marked as synthetic — not sourced from historical government data.

export type Year = 2019 | 2020 | 2021 | 2022 | 2023 | 2024

export interface HistoricalPoint {
  year: Year
  score: number
}

// Raw historical composite scores per state, 2019-2024
// Trends: 2020 slight rise (supply chain stress), 2021-2024 gradual improvement for most
// except flood-prone states (Assam, Bihar, Uttarakhand, HP) where monsoon risk worsens
export const HISTORICAL_SCORES: Record<string, HistoricalPoint[]> = {
  'andhra-pradesh':      [{ year: 2019, score: 54.2 }, { year: 2020, score: 57.1 }, { year: 2021, score: 55.8 }, { year: 2022, score: 53.4 }, { year: 2023, score: 51.9 }, { year: 2024, score: 50.3 }],
  'arunachal-pradesh':   [{ year: 2019, score: 72.8 }, { year: 2020, score: 75.4 }, { year: 2021, score: 74.1 }, { year: 2022, score: 72.6 }, { year: 2023, score: 71.2 }, { year: 2024, score: 70.5 }],
  'assam':               [{ year: 2019, score: 66.4 }, { year: 2020, score: 69.2 }, { year: 2021, score: 68.7 }, { year: 2022, score: 67.3 }, { year: 2023, score: 68.1 }, { year: 2024, score: 67.8 }],
  'bihar':               [{ year: 2019, score: 74.1 }, { year: 2020, score: 77.3 }, { year: 2021, score: 76.0 }, { year: 2022, score: 74.5 }, { year: 2023, score: 75.2 }, { year: 2024, score: 74.8 }],
  'chhattisgarh':        [{ year: 2019, score: 60.3 }, { year: 2020, score: 63.1 }, { year: 2021, score: 61.8 }, { year: 2022, score: 59.4 }, { year: 2023, score: 57.9 }, { year: 2024, score: 56.4 }],
  'goa':                 [{ year: 2019, score: 32.6 }, { year: 2020, score: 35.8 }, { year: 2021, score: 34.2 }, { year: 2022, score: 32.0 }, { year: 2023, score: 30.5 }, { year: 2024, score: 29.8 }],
  'gujarat':             [{ year: 2019, score: 30.2 }, { year: 2020, score: 33.5 }, { year: 2021, score: 31.8 }, { year: 2022, score: 29.4 }, { year: 2023, score: 27.6 }, { year: 2024, score: 26.1 }],
  'haryana':             [{ year: 2019, score: 28.4 }, { year: 2020, score: 31.2 }, { year: 2021, score: 29.8 }, { year: 2022, score: 27.3 }, { year: 2023, score: 25.9 }, { year: 2024, score: 24.7 }],
  'himachal-pradesh':    [{ year: 2019, score: 46.8 }, { year: 2020, score: 49.5 }, { year: 2021, score: 48.9 }, { year: 2022, score: 47.6 }, { year: 2023, score: 48.3 }, { year: 2024, score: 47.9 }],
  'jharkhand':           [{ year: 2019, score: 67.2 }, { year: 2020, score: 70.1 }, { year: 2021, score: 68.5 }, { year: 2022, score: 66.1 }, { year: 2023, score: 64.6 }, { year: 2024, score: 63.3 }],
  'karnataka':           [{ year: 2019, score: 33.8 }, { year: 2020, score: 37.1 }, { year: 2021, score: 35.4 }, { year: 2022, score: 33.0 }, { year: 2023, score: 31.5 }, { year: 2024, score: 30.2 }],
  'kerala':              [{ year: 2019, score: 38.5 }, { year: 2020, score: 42.0 }, { year: 2021, score: 40.4 }, { year: 2022, score: 38.1 }, { year: 2023, score: 37.0 }, { year: 2024, score: 36.4 }],
  'madhya-pradesh':      [{ year: 2019, score: 57.4 }, { year: 2020, score: 60.3 }, { year: 2021, score: 58.6 }, { year: 2022, score: 55.9 }, { year: 2023, score: 54.1 }, { year: 2024, score: 52.7 }],
  'maharashtra':         [{ year: 2019, score: 42.1 }, { year: 2020, score: 45.6 }, { year: 2021, score: 43.8 }, { year: 2022, score: 41.2 }, { year: 2023, score: 39.7 }, { year: 2024, score: 38.3 }],
  'manipur':             [{ year: 2019, score: 73.6 }, { year: 2020, score: 76.2 }, { year: 2021, score: 75.0 }, { year: 2022, score: 73.5 }, { year: 2023, score: 72.4 }, { year: 2024, score: 71.8 }],
  'meghalaya':           [{ year: 2019, score: 68.9 }, { year: 2020, score: 71.5 }, { year: 2021, score: 70.2 }, { year: 2022, score: 68.7 }, { year: 2023, score: 67.6 }, { year: 2024, score: 66.9 }],
  'mizoram':             [{ year: 2019, score: 71.2 }, { year: 2020, score: 73.8 }, { year: 2021, score: 72.5 }, { year: 2022, score: 71.0 }, { year: 2023, score: 70.1 }, { year: 2024, score: 69.5 }],
  'nagaland':            [{ year: 2019, score: 70.5 }, { year: 2020, score: 73.1 }, { year: 2021, score: 71.8 }, { year: 2022, score: 70.3 }, { year: 2023, score: 69.4 }, { year: 2024, score: 68.8 }],
  'odisha':              [{ year: 2019, score: 58.7 }, { year: 2020, score: 61.6 }, { year: 2021, score: 60.0 }, { year: 2022, score: 57.6 }, { year: 2023, score: 56.1 }, { year: 2024, score: 54.8 }],
  'punjab':              [{ year: 2019, score: 25.3 }, { year: 2020, score: 28.7 }, { year: 2021, score: 27.0 }, { year: 2022, score: 24.6 }, { year: 2023, score: 23.2 }, { year: 2024, score: 22.0 }],
  'rajasthan':           [{ year: 2019, score: 52.6 }, { year: 2020, score: 55.4 }, { year: 2021, score: 53.8 }, { year: 2022, score: 51.3 }, { year: 2023, score: 49.8 }, { year: 2024, score: 48.4 }],
  'sikkim':              [{ year: 2019, score: 62.4 }, { year: 2020, score: 65.0 }, { year: 2021, score: 63.7 }, { year: 2022, score: 62.2 }, { year: 2023, score: 61.3 }, { year: 2024, score: 60.7 }],
  'tamil-nadu':          [{ year: 2019, score: 31.8 }, { year: 2020, score: 35.2 }, { year: 2021, score: 33.5 }, { year: 2022, score: 31.1 }, { year: 2023, score: 29.6 }, { year: 2024, score: 28.4 }],
  'telangana':           [{ year: 2019, score: 40.3 }, { year: 2020, score: 43.8 }, { year: 2021, score: 42.0 }, { year: 2022, score: 39.6 }, { year: 2023, score: 38.1 }, { year: 2024, score: 36.9 }],
  'tripura':             [{ year: 2019, score: 65.7 }, { year: 2020, score: 68.3 }, { year: 2021, score: 67.0 }, { year: 2022, score: 65.5 }, { year: 2023, score: 64.6 }, { year: 2024, score: 64.0 }],
  'uttar-pradesh':       [{ year: 2019, score: 63.8 }, { year: 2020, score: 66.7 }, { year: 2021, score: 65.1 }, { year: 2022, score: 62.7 }, { year: 2023, score: 61.2 }, { year: 2024, score: 59.9 }],
  'uttarakhand':         [{ year: 2019, score: 48.2 }, { year: 2020, score: 51.0 }, { year: 2021, score: 50.4 }, { year: 2022, score: 49.1 }, { year: 2023, score: 49.8 }, { year: 2024, score: 49.4 }],
  'west-bengal':         [{ year: 2019, score: 50.4 }, { year: 2020, score: 53.2 }, { year: 2021, score: 51.6 }, { year: 2022, score: 49.2 }, { year: 2023, score: 47.7 }, { year: 2024, score: 46.4 }],
  'andaman-and-nicobar-islands': [{ year: 2019, score: 64.2 }, { year: 2020, score: 67.0 }, { year: 2021, score: 65.4 }, { year: 2022, score: 63.9 }, { year: 2023, score: 62.8 }, { year: 2024, score: 62.1 }],
  'chandigarh':          [{ year: 2019, score: 18.4 }, { year: 2020, score: 21.8 }, { year: 2021, score: 20.1 }, { year: 2022, score: 17.7 }, { year: 2023, score: 16.3 }, { year: 2024, score: 15.2 }],
  'dadra-and-nagar-haveli-and-daman-and-diu': [{ year: 2019, score: 35.6 }, { year: 2020, score: 38.4 }, { year: 2021, score: 36.8 }, { year: 2022, score: 34.4 }, { year: 2023, score: 33.0 }, { year: 2024, score: 31.8 }],
  'delhi':               [{ year: 2019, score: 20.8 }, { year: 2020, score: 24.3 }, { year: 2021, score: 22.6 }, { year: 2022, score: 20.2 }, { year: 2023, score: 18.8 }, { year: 2024, score: 17.6 }],
  'jammu-and-kashmir':   [{ year: 2019, score: 59.4 }, { year: 2020, score: 62.3 }, { year: 2021, score: 60.7 }, { year: 2022, score: 58.3 }, { year: 2023, score: 56.8 }, { year: 2024, score: 55.5 }],
  'ladakh':              [{ year: 2019, score: 78.6 }, { year: 2020, score: 80.4 }, { year: 2021, score: 79.1 }, { year: 2022, score: 77.6 }, { year: 2023, score: 76.5 }, { year: 2024, score: 75.8 }],
  'lakshadweep':         [{ year: 2019, score: 71.4 }, { year: 2020, score: 73.8 }, { year: 2021, score: 72.5 }, { year: 2022, score: 71.0 }, { year: 2023, score: 70.1 }, { year: 2024, score: 69.4 }],
  'puducherry':          [{ year: 2019, score: 28.6 }, { year: 2020, score: 32.1 }, { year: 2021, score: 30.4 }, { year: 2022, score: 28.0 }, { year: 2023, score: 26.6 }, { year: 2024, score: 25.4 }],
}

export function getStateHistory(slug: string): HistoricalPoint[] {
  return HISTORICAL_SCORES[slug] ?? []
}

export function getScoresForYear(year: Year): Record<string, number> {
  const result: Record<string, number> = {}
  for (const [slug, points] of Object.entries(HISTORICAL_SCORES)) {
    const pt = points.find(p => p.year === year)
    if (pt) result[slug] = pt.score
  }
  return result
}
