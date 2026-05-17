export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { seedIfEmpty } from '@/lib/seed'

export async function GET() {
  try {
    seedIfEmpty()
    const db = getDb()

    const latestLog = db.prepare(
      `SELECT ran_at, status, states_count FROM data_refresh_log ORDER BY ran_at DESC LIMIT 1`
    ).get() as { ran_at: string; status: string; states_count: number } | undefined

    const avgConf = db.prepare(`
      SELECT AVG(confidence) as avg_conf FROM fragility_scores
      WHERE sector_preset = 'default'
    `).get() as { avg_conf: number }

    const totalScores = (db.prepare('SELECT COUNT(*) as c FROM fragility_scores').get() as { c: number }).c

    return NextResponse.json({
      last_updated:   latestLog?.ran_at ?? null,
      status:         latestLog?.status ?? 'unknown',
      sources_ok:     {},
      states_count:   latestLog?.states_count ?? 36,
      avg_confidence: Math.round(avgConf.avg_conf ?? 100),
      total_scores:   totalScores,
    })
  } catch (err) {
    console.error('[api/meta]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
