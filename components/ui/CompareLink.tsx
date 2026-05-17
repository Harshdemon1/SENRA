'use client'
import Link from 'next/link'
import { useOnce } from '@/hooks/useOnce'

export function CompareLink() {
  const [viewed, markViewed] = useOnce('senra-compare-viewed')

  return (
    <div className="relative inline-flex">
      <Link
        href="/compare"
        onClick={markViewed}
        className="px-3 py-1.5 rounded-full border border-white/20 hover:border-white/50 hover:text-text-primary transition-colors"
      >
        Compare
      </Link>
      {!viewed && (
        <span
          aria-label="New — click to compare states"
          className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-accent text-bg-void text-[10px] font-bold flex items-center justify-center pointer-events-none z-10"
          style={{ animation: 'senra-pulse 2s ease-in-out infinite' }}
        >
          !
        </span>
      )}
    </div>
  )
}
