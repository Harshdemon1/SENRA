export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { seedIfEmpty } from '@/lib/seed'

type DbRow = Record<string, unknown>

function shapeScore(row: DbRow) {
  return {
    state:      row.name,
    slug:       row.slug,
    iso_code:   row.iso_code,
    region:     row.region,
    score:      row.score,
    rank:       row.rank,
    band:       row.band,
    confidence: row.confidence,
    scoreUncertainty: row.score_uncertainty as number | null ?? undefined,
    subscores: {
      road_quality:         row.subscore_road,
      business_density:     row.subscore_business,
      monsoon_disruption:   row.subscore_monsoon,
      logistics_access:     row.subscore_logistics,
      power_reliability:    row.subscore_power,
      cold_chain_infra:     row.subscore_cold_chain,
      market_concentration: row.subscore_concentration,
    },
    imputed_dims: JSON.parse(row.imputed_dimensions as string ?? '[]'),
  }
}

export async function GET(req: NextRequest) {
  try {
    seedIfEmpty()
    const sector = req.nextUrl.searchParams.get('sector') ?? 'default'
    const db = getDb()

    const latestRow = db.prepare(`
      SELECT computed_at FROM fragility_scores
      WHERE sector_preset = ? ORDER BY computed_at DESC LIMIT 1
    `).get(sector) as { computed_at: string } | undefined

    if (!latestRow) return NextResponse.json({ error: 'No scores found' }, { status: 404 })

    const rows = db.prepare(`
      SELECT fs.*, s.name, s.slug, s.iso_code, s.region
      FROM fragility_scores fs
      JOIN states s ON s.id = fs.state_id
      WHERE fs.sector_preset = ? AND fs.computed_at = ?
      ORDER BY fs.rank
    `).all(sector, latestRow.computed_at) as DbRow[]

    return NextResponse.json({
      sector,
      updated_at: latestRow.computed_at,
      states: rows.map(shapeScore),
    })
  } catch (err) {
    console.error('[api/scores]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
