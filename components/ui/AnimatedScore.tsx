'use client'
import { useEffect, useRef, useState } from 'react'

interface AnimatedScoreProps {
  value: number
  duration?: number
  decimals?: number
  className?: string
  style?: React.CSSProperties
}

export function AnimatedScore({ value, duration = 600, decimals = 1, className, style }: AnimatedScoreProps) {
  const [displayed, setDisplayed] = useState(value)
  const rafRef = useRef<number | null>(null)
  const startRef = useRef<number | null>(null)
  const startValueRef = useRef(value)

  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    startValueRef.current = displayed
    startRef.current = null

    const animate = (timestamp: number) => {
      if (!startRef.current) startRef.current = timestamp
      const elapsed = timestamp - startRef.current
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayed(startValueRef.current + (value - startValueRef.current) * eased)
      if (progress < 1) rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return <span className={className} style={style}>{displayed.toFixed(decimals)}</span>
}
