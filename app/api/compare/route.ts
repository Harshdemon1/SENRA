export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { seedIfEmpty } from '@/lib/seed'

type DbRow = Record<string, unknown>

export async function GET(req: NextRequest) {
  try {
    seedIfEmpty()
    const slugs = (req.nextUrl.searchParams.get('states') ?? '')
      .split(',').map(s => s.trim()).filter(Boolean).slice(0, 4)

    if (slugs.length < 2) {
      return NextResponse.json({ error: 'Need at least 2 states' }, { status: 400 })
    }

    const sector = req.nextUrl.searchParams.get('sector') ?? 'default'
    const db = getDb()

    const latestRow = db.prepare(`
      SELECT computed_at FROM fragility_scores
      WHERE sector_preset = ? ORDER BY computed_at DESC LIMIT 1
    `).get(sector) as { computed_at: string } | undefined

    if (!latestRow) return NextResponse.json({ error: 'No scores found' }, { status: 404 })

    const placeholders = slugs.map(() => '?').join(',')
    const stateRows = db.prepare(
      `SELECT * FROM states WHERE slug IN (${placeholders})`
    ).all(...slugs) as DbRow[]

    const statesMap = Object.fromEntries(stateRows.map(s => [s.slug as string, s]))
    const missing = slugs.filter(s => !statesMap[s])
    if (missing.length) {
      return NextResponse.json({ error: `States not found: ${missing.join(', ')}` }, { status: 404 })
    }

    const stateIds = slugs.map(s => statesMap[s].id)
    const idPlaceholders = stateIds.map(() => '?').join(',')
    const fsRows = db.prepare(`
      SELECT fs.*, s.slug, s.name, s.iso_code, s.region
      FROM fragility_scores fs
      JOIN states s ON s.id = fs.state_id
      WHERE fs.state_id IN (${idPlaceholders})
        AND fs.sector_preset = ?
        AND fs.computed_at = ?
    `).all(...stateIds, sector, latestRow.computed_at) as DbRow[]

    const fsMap = Object.fromEntries(fsRows.map(r => [r.slug as string, r]))
    const resultStates = slugs.map(slug => {
      const r = fsMap[slug]
      if (!r) throw new Error(`No score for ${slug}`)
      return {
        state: r.name, slug: r.slug, iso_code: r.iso_code, region: r.region,
        score: r.score, rank: r.rank, band: r.band, confidence: r.confidence,
        subscores: {
          road_quality:         r.subscore_road,
          business_density:     r.subscore_business,
          monsoon_disruption:   r.subscore_monsoon,
          logistics_access:     r.subscore_logistics,
          power_reliability:    r.subscore_power,
          cold_chain_infra:     r.subscore_cold_chain,
          market_concentration: r.subscore_concentration,
        },
        imputed_dims: JSON.parse(r.imputed_dimensions as string ?? '[]'),
      }
    })

    const dimKeys = ['road_quality','business_density','monsoon_disruption','logistics_access','power_reliability','cold_chain_infra','market_concentration']
    const dimensionWinners: Record<string, string> = {}
    for (const key of dimKeys) {
      const best = resultStates.reduce((a, b) =>
        (a.subscores[key as keyof typeof a.subscores] as number) < (b.subscores[key as keyof typeof b.subscores] as number) ? a : b
      )
      dimensionWinners[key] = best.slug as string
    }

    return NextResponse.json({ sector, states: resultStates, dimension_winners: dimensionWinners })
  } catch (err) {
    console.error('[api/compare]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
