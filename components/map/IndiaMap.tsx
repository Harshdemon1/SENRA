'use client'
import { useCallback, useEffect, memo, useMemo, useRef, useState } from 'react'
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps'
import { useRouter } from 'next/navigation'
import type { StateScore } from '@/lib/types'
import { STATE_NAME_TO_SLUG, BAND_COLORS } from '@/lib/constants'
import { getRiskColor, getLighterRiskColor } from '@/lib/riskColors'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import type { GeoFeature } from 'react-simple-maps'

const GEO_URL = 'https://raw.githubusercontent.com/datta07/INDIAN-SHAPEFILES/master/INDIA/INDIA_STATES.geojson'

interface IndiaMapProps {
  scores: StateScore[]
  selectedSlug?: string
  onSelect?: (slug: string) => void
}

// ─── per-polygon props ────────────────────────────────────────────────────────
interface StateGeoProps {
  geo: GeoFeature
  stateData: StateScore | undefined
  slug: string | undefined
  isSelected: boolean
  // x/y captured at mouse-enter; no onMouseMove → eliminates 60fps re-renders
  onEnter: (stateData: StateScore, x: number, y: number) => void
  onLeave: () => void
  onClickSlug: (slug: string) => void
}

const StateGeography = memo(function StateGeography({
  geo, stateData, slug, isSelected, onEnter, onLeave, onClickSlug,
}: StateGeoProps) {
  const score = stateData?.score ?? null
  const fill = getRiskColor(score)
  const hoverFill = score !== null ? getLighterRiskColor(score) : '#2a2a2a'

  const handleEnter = useCallback((e: React.MouseEvent) => {
    if (stateData) onEnter(stateData, e.clientX, e.clientY)
  }, [stateData, onEnter])

  const handleClick = useCallback(() => {
    if (slug) onClickSlug(slug)
  }, [slug, onClickSlug])

  return (
    <Geography
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
        hover:   { outline: 'none', opacity: 1, fill: hoverFill },
        pressed: { outline: 'none', opacity: 0.85 },
      }}
      onMouseEnter={handleEnter}
      // No onMouseMove — position updates happen via window listener without triggering React
      onMouseLeave={onLeave}
      onClick={handleClick}
    />
  )
})

// ─── memoised geography list ──────────────────────────────────────────────────
// Lives in its own component so that tooltip/zoom state changes inside IndiaMap
// don't cause this subtree to re-render.
interface GeoListProps {
  geographies: GeoFeature[]
  scoreMap: Map<string, StateScore>
  selectedSlug: string | undefined
  onEnter: (stateData: StateScore, x: number, y: number) => void
  onLeave: () => void
  onClickSlug: (slug: string) => void
}

const GeoList = memo(function GeoList({
  geographies, scoreMap, selectedSlug, onEnter, onLeave, onClickSlug,
}: GeoListProps) {
  return (
    <>
      {geographies.map(geo => {
        const name = geo.properties.STNAME_SH || geo.properties.ST_NM || geo.properties.NAME_1 || geo.properties.name
        const slug = name ? STATE_NAME_TO_SLUG[name as string] : undefined
        const stateData = slug ? scoreMap.get(slug) : undefined
        return (
          <StateGeography
            key={geo.rsmKey}
            geo={geo}
            stateData={stateData}
            slug={slug}
            isSelected={slug === selectedSlug}
            onEnter={onEnter}
            onLeave={onLeave}
            onClickSlug={onClickSlug}
          />
        )
      })}
    </>
  )
})

// ─── skeleton ────────────────────────────────────────────────────────────────
function MapSkeleton() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-bg-base rounded-xl overflow-hidden">
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

// ─── main component ───────────────────────────────────────────────────────────
// Wrapped in memo so that parent state changes (selectedSlug sidebar, sheet open,
// customScores) don't cascade into the map unless scores/selectedSlug/onSelect
// actually changed.
export const IndiaMap = memo(function IndiaMap({ scores, selectedSlug, onSelect }: IndiaMapProps) {
  const router = useRouter()
  const isMobile = useMediaQuery('(max-width: 480px)')

  // Tooltip: content in state (fires only on polygon boundary cross ≈ rare),
  // position in ref (direct DOM mutation — zero React renders per mousemove frame).
  const [tooltipData, setTooltipData] = useState<StateScore | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const [geoData, setGeoData] = useState<object | null>(null)
  // Cache the parsed geographies array so GeoList's memo stays effective
  // even when Geographies re-calls its children due to IndiaMap re-renders.
  const cachedGeosRef = useRef<GeoFeature[] | null>(null)
  const [mapLoading, setMapLoading] = useState(true)
  const [mapVisible, setMapVisible] = useState(false)
  const [zoom, setZoom] = useState(1)

  useEffect(() => {
    fetch(GEO_URL)
      .then(r => r.json())
      .then(data => {
        // Source GeoJSON uses ESRI-style clockwise outer rings; d3-geo's
        // spherical Mercator requires CCW per RFC 7946, otherwise each
        // polygon is interpreted as world-minus-state and fills the viewport.
        data.features?.forEach((f: { geometry: { type: string; coordinates: number[][][] | number[][][][] } }) => {
          const g = f.geometry
          if (g.type === 'Polygon') {
            (g.coordinates as number[][][])[0]?.reverse()
          } else if (g.type === 'MultiPolygon') {
            (g.coordinates as number[][][][]).forEach(poly => poly[0]?.reverse())
          }
        })
        setGeoData(data)
        setMapLoading(false)
        requestAnimationFrame(() => setMapVisible(true))
      })
      .catch(() => setMapLoading(false))
  }, [])

  // Tooltip position: one passive window listener, direct style mutation.
  // This replaces the previous onMouseMove → setTooltip({x,y}) pattern that
  // was firing setTooltip at 60fps and causing a full IndiaMap re-render each frame.
  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!tooltipRef.current) return
      tooltipRef.current.style.left = `${e.clientX + 14}px`
      tooltipRef.current.style.top  = `${e.clientY - 10}px`
    }
    window.addEventListener('mousemove', move, { passive: true })
    return () => window.removeEventListener('mousemove', move)
  }, []) // stable — registered once, never re-registered

  const scoreMap = useMemo(
    () => new Map(scores.map(s => [s.slug, s])),
    [scores]
  )

  const handleClickSlug = useCallback(
    (slug: string) => {
      if (onSelect) onSelect(slug)
      else router.push(`/state/${slug}`)
    },
    [onSelect, router]
  )

  // Capture initial position at enter so tooltip doesn't flash at 0,0
  const handleEnter = useCallback((stateData: StateScore, x: number, y: number) => {
    if (tooltipRef.current) {
      tooltipRef.current.style.left = `${x + 14}px`
      tooltipRef.current.style.top  = `${y - 10}px`
    }
    setTooltipData(stateData)
  }, [])

  const handleLeave = useCallback(() => setTooltipData(null), [])

  if (mapLoading) return <MapSkeleton />

  return (
    <div
      className="absolute inset-0 w-full"
      style={{ height: '100%', opacity: mapVisible ? 1 : 0, transition: 'opacity 0.5s ease' }}
    >
      <svg width="0" height="0">
        <defs>
          <pattern id="hatch" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.15" />
          </pattern>
        </defs>
      </svg>

      {/* will-change on the SVG (not outer div) so the GPU layer covers the element being transformed */}
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 1000,
          center: [82, 22],
          rotate: [0, 0, 0],
        }}
        {...({ width: 800, height: 600 } as any)}
        className="w-full h-full"
        style={{ willChange: 'transform', outline: 'none', background: 'transparent' }}
      >
        <ZoomableGroup
          zoom={isMobile ? zoom * 1.4 : zoom}
          center={[82, 22]}
          minZoom={0.8}
          maxZoom={8}
          onMoveEnd={({ zoom: z }) => setZoom(isMobile ? z / 1.4 : z)}
        >
          <Geographies geography={geoData ?? GEO_URL}>
            {({ geographies }) => {
              // Cache on first delivery — keeps GeoList's memo reference stable
              // across IndiaMap re-renders triggered by tooltip/zoom state.
              if (!cachedGeosRef.current && geographies.length > 0) {
                cachedGeosRef.current = geographies
              }
              return (
                <GeoList
                  geographies={cachedGeosRef.current ?? geographies}
                  scoreMap={scoreMap}
                  selectedSlug={selectedSlug}
                  onEnter={handleEnter}
                  onLeave={handleLeave}
                  onClickSlug={handleClickSlug}
                />
              )
            }}
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      {/* Tooltip: React controls visibility + content; DOM controls position */}
      <div
        ref={tooltipRef}
        className="fixed pointer-events-none z-50"
        style={{ display: tooltipData ? 'block' : 'none' }}
      >
        {tooltipData && (
          <div className="bg-bg-elevated border border-border-default rounded-xl p-3 shadow-2xl w-48">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-text-primary truncate pr-2">
                {tooltipData.state}
              </span>
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded border flex-shrink-0"
                style={{
                  color: BAND_COLORS[tooltipData.band],
                  borderColor: `${BAND_COLORS[tooltipData.band]}55`,
                }}
              >
                {tooltipData.band}
              </span>
            </div>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="numeric text-2xl font-medium text-text-primary">
                {tooltipData.score.toFixed(0)}
              </span>
              <span className="text-xs text-text-secondary">/100</span>
            </div>
            <div className="flex justify-between text-xs text-text-tertiary">
              <span>Rank #{tooltipData.rank}</span>
              <span>{tooltipData.confidence.toFixed(0)}% conf.</span>
            </div>
            {tooltipData.confidence < 60 && (
              <div className="mt-2 text-[10px] text-high border border-high/30 rounded px-1.5 py-0.5">
                Low confidence — some data estimated
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  )
})
