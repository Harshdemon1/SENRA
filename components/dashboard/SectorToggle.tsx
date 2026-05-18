'use client'
import { create } from 'zustand'
import { motion } from 'framer-motion'
import { clsx } from 'clsx'
import type { SectorPresetKey } from '@/lib/types'
import { SECTOR_LABELS } from '@/lib/constants'

interface SectorStore {
  sector: SectorPresetKey
  setSector: (s: SectorPresetKey) => void
}

export const useSectorStore = create<SectorStore>(set => ({
  sector: 'default',
  setSector: sector => set({ sector }),
}))

const SECTORS = Object.keys(SECTOR_LABELS) as SectorPresetKey[]

export function SectorToggle({ onSelect }: { onSelect?: (s: string) => void } = {}) {
  const { sector, setSector } = useSectorStore()

  return (
    <div className="senra-preset-pills">
      {SECTORS.map(key => (
        <button
          key={key}
          onClick={() => { setSector(key); onSelect?.(key) }}
          title={key === 'fmcg' ? 'Fast-Moving Consumer Goods' : undefined}
          className={clsx(
            'relative flex-shrink-0 text-xs px-3 py-1 rounded-full transition-colors font-medium',
            sector === key
              ? 'bg-accent text-bg-void'
              : 'text-text-secondary hover:text-text-primary border border-border-default hover:border-accent/50'
          )}
        >
          {sector === key && (
            <motion.span
              layoutId="sector-pill"
              className="absolute inset-0 rounded-full bg-accent"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10">{SECTOR_LABELS[key]}</span>
        </button>
      ))}
    </div>
  )
}
