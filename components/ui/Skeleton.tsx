import { clsx } from 'clsx'

interface SkeletonProps {
  className?: string
  height?: string | number
}

export function Skeleton({ className, height }: SkeletonProps) {
  return (
    <div
      className={clsx('skeleton', className)}
      style={height ? { height } : undefined}
    />
  )
}
