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

export function SectorToggle() {
  const { sector, setSector } = useSectorStore()

  return (
    <div className="flex flex-wrap gap-1">
      {SECTORS.map(key => (
        <button
          key={key}
          onClick={() => setSector(key)}
          className={clsx(
            'relative text-xs px-3 py-1 rounded-full transition-colors font-medium',
            sector === key
              ? 'text-bg-void'
              : 'text-text-secondary hover:text-text-primary border border-border-default'
          )}
        >
          {sector === key && (
            <motion.span
              layoutId="sector-pill"
              className="absolute inset-0 rounded-full bg-accent"
              style={{ zIndex: -1 }}
            />
          )}
          {SECTOR_LABELS[key]}
        </button>
      ))}
    </div>
  )
}
