'use client'
import useSWR from 'swr'
import type { ScoresPayload, StateProfile, ComparePayload, MetaPayload, WeightsMap } from './types'

// All calls go through Next.js proxy → no CORS
const fetcher = (url: string) =>
  fetch(url).then(r => {
    if (!r.ok) throw new Error(`${r.status} ${r.statusText}`)
    return r.json()
  })

export function useScores(sector = 'default') {
  return useSWR<ScoresPayload>(`/backend/api/scores?sector=${sector}`, fetcher, {
    keepPreviousData: true,
    revalidateOnFocus: false,
    dedupingInterval: 30_000,
  })
}

export function useStateProfile(slug: string | null) {
  return useSWR<StateProfile>(slug ? `/backend/api/scores/${slug}` : null, fetcher, {
    keepPreviousData: true,
    revalidateOnFocus: false,
  })
}

export function useCompare(slugs: string[], sector = 'default') {
  const key = slugs.length >= 2
    ? `/backend/api/compare?states=${slugs.join(',')}&sector=${sector}`
    : null
  return useSWR<ComparePayload>(key, fetcher, {
    keepPreviousData: true,
    revalidateOnFocus: false,
  })
}

export function useMeta() {
  return useSWR<MetaPayload>('/backend/api/meta', fetcher, {
    refreshInterval: 300_000,
    revalidateOnFocus: false,
  })
}

export async function postCompute(weights: WeightsMap, sector = 'default') {
  const r = await fetch('/backend/api/compute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ weights, sector }),
  })
  if (!r.ok) throw new Error(`Compute failed: ${r.statusText}`)
  return r.json()
}
