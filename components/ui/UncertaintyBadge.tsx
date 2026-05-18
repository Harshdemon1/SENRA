interface UncertaintyBadgeProps {
  value: number
  className?: string
}

export function UncertaintyBadge({ value, className = '' }: UncertaintyBadgeProps) {
  return (
    <span
      className={`numeric ${className}`}
      title="Score uncertainty reflects data proxy quality, not sampling error"
      style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '13px', color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}
    >
      ±{value.toFixed(1)}
    </span>
  )
}
