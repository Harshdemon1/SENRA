import { STATE_ADJACENCY } from '@/data/stateAdjacency'

export interface CorridorResult {
  path: string[]
  stateScores: { slug: string; name: string; score: number; band: string }[]
  avgScore: number
  weakestLink: { slug: string; name: string; score: number; band: string }
}

export function findCorridorPath(origin: string, destination: string): string[] | null {
  if (origin === destination) return [origin]
  const queue: string[][] = [[origin]]
  const visited = new Set<string>([origin])

  while (queue.length > 0) {
    const path = queue.shift()!
    const current = path[path.length - 1]
    for (const neighbour of STATE_ADJACENCY[current] ?? []) {
      if (neighbour === destination) return [...path, neighbour]
      if (!visited.has(neighbour)) {
        visited.add(neighbour)
        queue.push([...path, neighbour])
      }
    }
  }
  return null
}

export function buildCorridorResult(
  path: string[],
  scoresBySlug: Map<string, { name: string; score: number; band: string }>,
): CorridorResult {
  const stateScores = path.map(slug => {
    const s = scoresBySlug.get(slug)
    return { slug, name: s?.name ?? slug, score: s?.score ?? 50, band: s?.band ?? 'MODERATE' }
  })
  const avgScore = stateScores.reduce((a, b) => a + b.score, 0) / stateScores.length
  const weakest = [...stateScores].sort((a, b) => b.score - a.score)[0]!
  return { path, stateScores, avgScore, weakestLink: { slug: weakest.slug, name: weakest.name, score: weakest.score, band: weakest.band } }
}
