export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { seedIfEmpty } from '@/lib/seed'

type DbRow = Record<string, unknown>

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    seedIfEmpty()
    const db = getDb()
    const { slug } = params

    const state = db.prepare('SELECT * FROM states WHERE slug = ?').get(slug) as DbRow | undefined
    if (!state) return NextResponse.json({ error: 'State not found' }, { status: 404 })

    const latestRow = db.prepare(`
      SELECT computed_at FROM fragility_scores
      WHERE state_id = ? AND sector_preset = 'default'
      ORDER BY computed_at DESC LIMIT 1
    `).get(state.id) as { computed_at: string } | undefined

    if (!latestRow) return NextResponse.json({ error: 'No scores found' }, { status: 404 })

    const fs = db.prepare(`
      SELECT * FROM fragility_scores
      WHERE state_id = ? AND sector_preset = 'default' AND computed_at = ?
    `).get(state.id, latestRow.computed_at) as DbRow

    const history = (db.prepare(`
      SELECT computed_at as date, score, band FROM fragility_scores
      WHERE state_id = ? AND sector_preset = 'default'
      ORDER BY computed_at ASC
    `).all(state.id) as DbRow[]).map(r => ({ date: r.date, score: r.score, band: r.band }))

    const allScores = db.prepare(`
      SELECT fs.score, s.slug, s.name, fs.band, fs.rank, fs.confidence,
             fs.subscore_road, fs.subscore_business, fs.subscore_monsoon,
             fs.subscore_logistics, fs.subscore_power, fs.subscore_cold_chain,
             fs.subscore_concentration, fs.imputed_dimensions, s.iso_code, s.region
      FROM fragility_scores fs
      JOIN states s ON s.id = fs.state_id
      WHERE fs.sector_preset = 'default' AND fs.computed_at = ?
      ORDER BY ABS(fs.score - ?)
      LIMIT 6
    `).all(latestRow.computed_at, fs.score) as DbRow[]

    const similar = allScores
      .filter(r => r.slug !== slug)
      .slice(0, 3)
      .map(r => ({
        state: r.name, slug: r.slug, iso_code: r.iso_code, region: r.region,
        score: r.score, rank: r.rank, band: r.band, confidence: r.confidence,
        subscores: {
          road_quality: r.subscore_road, business_density: r.subscore_business,
          monsoon_disruption: r.subscore_monsoon, logistics_access: r.subscore_logistics,
          power_reliability: r.subscore_power, cold_chain_infra: r.subscore_cold_chain,
          market_concentration: r.subscore_concentration,
        },
        imputed_dims: JSON.parse(r.imputed_dimensions as string ?? '[]'),
      }))

    const rawValues = JSON.parse(state.raw_data as string ?? '{}')

    return NextResponse.json({
      state: state.name, slug: state.slug, iso_code: state.iso_code, region: state.region,
      score: fs.score, rank: fs.rank, band: fs.band, confidence: fs.confidence,
      subscores: {
        road_quality:         fs.subscore_road,
        business_density:     fs.subscore_business,
        monsoon_disruption:   fs.subscore_monsoon,
        logistics_access:     fs.subscore_logistics,
        power_reliability:    fs.subscore_power,
        cold_chain_infra:     fs.subscore_cold_chain,
        market_concentration: fs.subscore_concentration,
      },
      imputed_dims: JSON.parse(fs.imputed_dimensions as string ?? '[]'),
      history,
      similar,
      raw_values: rawValues,
    })
  } catch (err) {
    console.error('[api/scores/slug]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
