'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useEffect, useRef, useState } from 'react'
import { DIMENSIONS, DEFAULT_WEIGHTS } from '@/lib/constants'
import type { WeightsMap } from '@/lib/types'
import { postCompute } from '@/lib/api'
import type { StateScore } from '@/lib/types'

interface WeightsStore {
  weights: WeightsMap
  setWeight: (key: string, val: number) => void
  resetTo: (preset: WeightsMap) => void
}

export const useWeightsStore = create<WeightsStore>()(
  persist(
    set => ({
      weights: { ...DEFAULT_WEIGHTS },
      setWeight: (key, val) =>
        set(state => {
          const old = state.weights[key]
          const delta = val - old
          const others = DIMENSIONS.map(d => d.key).filter(k => k !== key)
          const otherTotal = others.reduce((s, k) => s + state.weights[k], 0)
          const newW = { ...state.weights, [key]: val }
          if (otherTotal > 0) {
            others.forEach(k => {
              newW[k] = Math.max(0, state.weights[k] - delta * (state.weights[k] / otherTotal))
            })
          } else {
            const each = (1 - val) / others.length
            others.forEach(k => { newW[k] = Math.max(0, each) })
          }
          // Fix floating point drift
          const total = Object.values(newW).reduce((s, v) => s + v, 0)
          if (Math.abs(total - 1) > 0.001) {
            const largest = others.reduce((a, k) => newW[k] > newW[a] ? k : a, others[0])
            newW[largest] += 1 - total
            newW[largest] = Math.max(0, newW[largest])
          }
          return { weights: newW }
        }),
      resetTo: weights => set({ weights }),
    }),
    { name: 'senra-weights' }
  )
)

interface WeightSlidersProps {
  onScoresUpdate?: (states: StateScore[]) => void
}

export function WeightSliders({ onScoresUpdate }: WeightSlidersProps) {
  const { weights, setWeight, resetTo } = useWeightsStore()
  const [open, setOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const total = Object.values(weights).reduce((s, v) => s + v, 0)

  useEffect(() => {
    if (Math.abs(total - 1) > 0.01) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const result = await postCompute(weights)
        onScoresUpdate?.(result.states)
      } catch { /* ignore */ }
    }, 500)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [weights, total, onScoresUpdate])

  return (
    <div className="border border-border-default rounded-xl bg-bg-base">
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-text-primary"
        onClick={() => setOpen(o => !o)}
      >
        <span>Customise Weights</span>
        <span className="text-text-tertiary">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-4 pb-4">
          {Math.abs(total - 1) > 0.01 && (
            <div className="text-xs text-high mb-3">
              Total: {(total * 100).toFixed(0)}% — needs {((1 - total) * 100).toFixed(0)}% more
            </div>
          )}

          {DIMENSIONS.map(dim => (
            <div key={dim.key} className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-text-secondary">{dim.label}</span>
                <span className="numeric text-text-primary">{(weights[dim.key] * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={weights[dim.key]}
                onChange={e => setWeight(dim.key, parseFloat(e.target.value))}
                className="w-full accent-accent h-1"
              />
            </div>
          ))}

          <button
            className="text-xs text-text-secondary hover:text-text-primary mt-2"
            onClick={() => resetTo(DEFAULT_WEIGHTS)}
          >
            Reset to Default
          </button>
        </div>
      )}
    </div>
  )
}
