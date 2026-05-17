'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps'
import { useRouter } from 'next/navigation'
import type { StateScore } from '@/lib/types'
import { STATE_NAME_TO_SLUG } from '@/lib/constants'
import { getRiskColor, getLighterRiskColor } from '@/lib/riskColors'
import { StateTooltip } from './StateTooltip'
import { useMediaQuery } from '@/hooks/useMediaQuery'

const GEO_URL = 'https://raw.githubusercontent.com/geohacker/india/master/state/india_state.geojson'

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
  const isMobile = useMediaQuery('(max-width: 480px)')
  const [tooltip, setTooltip] = useState<{ state: StateScore; x: number; y: number } | null>(null)
  const [geoData, setGeoData] = useState<object | null>(null)
  const [mapLoading, setMapLoading] = useState(true)
  const [mapVisible, setMapVisible] = useState(false)
  const [zoom, setZoom] = useState(1)

  useEffect(() => {
    fetch(GEO_URL)
      .then(r => r.json())
      .then(data => {
        setGeoData(data)
        setMapLoading(false)
        requestAnimationFrame(() => setMapVisible(true))
      })
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
    <div
      className="relative w-full h-full"
      style={{ opacity: mapVisible ? 1 : 0, transition: 'opacity 0.5s ease' }}
    >
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
        <ZoomableGroup
          zoom={isMobile ? zoom * 1.4 : zoom}
          center={[82, 22]}
          minZoom={0.8}
          maxZoom={8}
          onMoveEnd={({ zoom: z }) => setZoom(isMobile ? z / 1.4 : z)}
        >
          <Geographies geography={geoData ?? GEO_URL}>
            {({ geographies }) =>
              geographies.map(geo => {
                const name = geo.properties.ST_NM || geo.properties.NAME_1 || geo.properties.name
                const slug = name ? STATE_NAME_TO_SLUG[name] : undefined
                const stateData = slug ? scoreMap.get(slug) : undefined
                const score = stateData?.score ?? null
                const fill = getRiskColor(score)
                const hoverFill = score !== null ? getLighterRiskColor(score) : '#2a2a2a'
                const isSelected = slug === selectedSlug

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={fill}
                    stroke="#070707"
                    strokeWidth={0.5}
                    style={{
                      default: {
                        outline: 'none',
                        cursor: slug ? 'pointer' : 'default',
                        opacity: isSelected ? 1 : 0.9,
                        transition: 'fill 0.2s ease, opacity 0.2s ease',
                      },
                      hover: {
                        outline: 'none',
                        opacity: 1,
                        fill: hoverFill,
                      },
                      pressed: { outline: 'none', opacity: 0.85 },
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
        </ZoomableGroup>
      </ComposableMap>

      {tooltip && (
        <StateTooltip state={tooltip.state} x={tooltip.x} y={tooltip.y} />
      )}

      {/* Mobile zoom controls */}
      {isMobile && (
        <div className="absolute bottom-28 right-4 flex flex-col gap-1 z-30">
          {['+', '−'].map((label, i) => (
            <button
              key={label}
              onClick={() => setZoom(z => i === 0 ? Math.min(z * 1.4, 8) : Math.max(z / 1.4, 0.8))}
              className="w-10 h-10 bg-bg-elevated border border-border-default rounded-lg text-text-secondary text-xl flex items-center justify-center hover:text-text-primary"
              aria-label={i === 0 ? 'Zoom in' : 'Zoom out'}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
