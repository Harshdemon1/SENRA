'use client'
import { useCallback, useMemo, useState } from 'react'
import { ComposableMap, Geographies, Geography } from 'react-simple-maps'
import { useRouter } from 'next/navigation'
import type { StateScore } from '@/lib/types'
import { BAND_COLORS, STATE_NAME_TO_SLUG } from '@/lib/constants'
import { StateTooltip } from './StateTooltip'

const GEO_URL = '/india-states.json'

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

export function IndiaMap({ scores, selectedSlug, onSelect }: IndiaMapProps) {
  const router = useRouter()
  const [tooltip, setTooltip] = useState<{ state: StateScore; x: number; y: number } | null>(null)

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
        <Geographies geography={GEO_URL}>
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
