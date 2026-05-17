declare module 'react-simple-maps' {
  import type { ReactNode, CSSProperties, MouseEvent } from 'react'

  interface ProjectionConfig {
    center?: [number, number]
    scale?: number
    rotate?: [number, number, number]
  }

  interface ComposableMapProps {
    projection?: string
    projectionConfig?: ProjectionConfig
    className?: string
    style?: CSSProperties
    children?: ReactNode
  }

  interface GeoFeature {
    rsmKey: string
    properties: Record<string, string | number | undefined>
    geometry: unknown
    type: string
  }

  interface GeographiesChildrenProps {
    geographies: GeoFeature[]
  }

  interface GeographiesProps {
    geography: string | object
    children: (props: GeographiesChildrenProps) => ReactNode
  }

  interface GeographyStyleState {
    outline?: string
    cursor?: string
    opacity?: number
    filter?: string
  }

  interface GeographyProps {
    geography: GeoFeature
    fill?: string
    stroke?: string
    strokeWidth?: number
    style?: {
      default?: GeographyStyleState
      hover?: GeographyStyleState
      pressed?: GeographyStyleState
    }
    onMouseEnter?: (event: MouseEvent) => void
    onMouseMove?: (event: MouseEvent) => void
    onMouseLeave?: (event: MouseEvent) => void
    onClick?: (event: MouseEvent) => void
    key?: string
  }

  export function ComposableMap(props: ComposableMapProps): JSX.Element
  export function Geographies(props: GeographiesProps): JSX.Element
  export function Geography(props: GeographyProps): JSX.Element
}
