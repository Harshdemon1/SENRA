'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ComposableMap, Geographies, Geography } from 'react-simple-maps'
import { useRouter } from 'next/navigation'
import type { StateScore } from '@/lib/types'
import { BAND_COLORS, STATE_NAME_TO_SLUG } from '@/lib/constants'
import { StateTooltip } from './StateTooltip'

const GEO_URL = 'https://raw.githubusercontent.com/geohacker/india/master/state/india_state.geojson'

function getStateColor(score: number | null): string {
  if (score === null) return '#1A1A1A'
  if (score >= 70) return BAND_COLORS.CRITICAL
  if (score >= 50) return BAND_COLORS.HIGH
  if (score >= 30) return BAND_COLORS.MODERATE
  return BAND_COLORS.LOW
}

interface IndiaMapProps {
  scores: StateScore[]
  selectedSlug?: string
  onSelect?: (slug: string) => void
}

function MapSkeleton() {
  return (
    <div className="relative w-full h-full flex items-center justify-center bg-bg-base rounded-xl overflow-hidden">
      <div className="absolute inset-0 animate-pulse">
        <div className="w-full h-full bg-gradient-to-br from-bg-elevated/60 to-bg-base/40 rounded-xl" />
      </div>
      <div className="relative flex flex-col items-center gap-3 z-10">
        <svg className="animate-spin w-8 h-8 text-accent/60" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
        <span className="text-xs text-text-tertiary tracking-wide">Loading map…</span>
      </div>
    </div>
  )
}

export function IndiaMap({ scores, selectedSlug, onSelect }: IndiaMapProps) {
  const router = useRouter()
  const [tooltip, setTooltip] = useState<{ state: StateScore; x: number; y: number } | null>(null)
  const [geoData, setGeoData] = useState<object | null>(null)
  const [mapLoading, setMapLoading] = useState(true)

  useEffect(() => {
    fetch(GEO_URL)
      .then(r => r.json())
      .then(data => { setGeoData(data); setMapLoading(false) })
      .catch(() => setMapLoading(false))
  }, [])

  const scoreMap = useMemo(
    () => new Map(scores.map(s => [s.slug, s])),
    [scores]
  )

  const handleClick = useCallback(
    (slug: string) => {
      if (onSelect) onSelect(slug)
      else router.push(`/state/${slug}`)
    },
    [onSelect, router]
  )

  if (mapLoading) return <MapSkeleton />

  return (
    <div className="relative w-full h-full">
      <svg width="0" height="0">
        <defs>
          <pattern id="hatch" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.15" />
          </pattern>
        </defs>
      </svg>

      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ center: [82, 22], scale: 1000 }}
        className="w-full h-full"
      >
        <Geographies geography={geoData ?? GEO_URL}>
          {({ geographies }) =>
            geographies.map(geo => {
              const name = geo.properties.ST_NM || geo.properties.NAME_1 || geo.properties.name
              const slug = name ? STATE_NAME_TO_SLUG[name] : undefined
              const stateData = slug ? scoreMap.get(slug) : undefined
              const fill = getStateColor(stateData?.score ?? null)
              const isSelected = slug === selectedSlug
              const isLowConf = stateData && stateData.confidence < 60

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={fill}
                  stroke="#070707"
                  strokeWidth={0.5}
                  style={{
                    default:  { outline: 'none', cursor: slug ? 'pointer' : 'default', opacity: isSelected ? 1 : 0.9 },
                    hover:    { outline: 'none', opacity: 1, filter: 'brightness(1.15)' },
                    pressed:  { outline: 'none' },
                  }}
                  onMouseEnter={(e: React.MouseEvent) => {
                    if (stateData) setTooltip({ state: stateData, x: e.clientX, y: e.clientY })
                  }}
                  onMouseMove={(e: React.MouseEvent) => {
                    if (stateData) setTooltip({ state: stateData, x: e.clientX, y: e.clientY })
                  }}
                  onMouseLeave={() => setTooltip(null)}
                  onClick={() => slug && handleClick(slug)}
                />
              )
            })
          }
        </Geographies>
      </ComposableMap>

      {tooltip && (
        <StateTooltip state={tooltip.state} x={tooltip.x} y={tooltip.y} />
      )}
    </div>
  )
}
