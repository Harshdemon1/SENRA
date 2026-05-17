export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { seedIfEmpty } from '@/lib/seed'
import { computeFragilityScores, SCORER_PRESETS } from '@/lib/scorer'
import { STATES_SEED } from '@/lib/seed'

const FALLBACK_RAW_DATA = (() => {
  const db = (() => { try { return getDb() } catch { return null } })()
  return db
})

export async function POST(req: NextRequest) {
  try {
    seedIfEmpty()
    const { weights, sector = 'default' } = await req.json()

    const total = Object.values(weights as Record<string, number>).reduce((s, v) => s + v, 0)
    if (Math.abs(total - 1) > 0.02) {
      return NextResponse.json({ error: `Weights must sum to 1.0, got ${total.toFixed(3)}` }, { status: 400 })
    }

    const db = getDb()
    const states = db.prepare('SELECT name, slug, raw_data FROM states').all() as { name: string; slug: string; raw_data: string }[]
    const slugMap = Object.fromEntries(states.map(s => [s.name, s.slug]))
    const rawData: Record<string, Record<string, number | null>> = {}
    for (const s of states) {
      rawData[s.name] = JSON.parse(s.raw_data ?? '{}')
    }

    const mergedWeights = { ...(SCORER_PRESETS[sector] ?? SCORER_PRESETS.default), ...weights }
    const scores = computeFragilityScores(rawData, mergedWeights, slugMap)

    return NextResponse.json({
      sector,
      updated_at: new Date().toISOString(),
      states: scores.map(s => ({
        state: s.state, slug: s.slug, score: s.score, rank: s.rank,
        band: s.band, confidence: s.confidence, subscores: s.subscores,
        imputed_dims: s.imputedDims,
      })),
    })
  } catch (err) {
    console.error('[api/compute]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
