'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

const LIMITATIONS = [
  { title: 'Data vintage', body: 'Most data is from 2023–24 government publications. Recent infrastructure changes are not reflected until the next refresh.' },
  { title: 'Informal economy blind spot', body: 'MCA registration data excludes informal distributors. States like UP and Bihar may appear more fragile than ground reality for FMCG.' },
  { title: 'Monsoon proxy', body: 'Captures flood frequency and rainfall variability. Drought risk and climate-change-driven timing shifts are not modelled.' },
  { title: 'Concentration proxy', body: 'Distributor Concentration is a geographic proxy derived from registration data, not direct measurement of supply chain topology.' },
  { title: 'Sparse UTs', body: 'Ladakh and Lakshadweep rely on more estimation than other states. Their ±uncertainty ranges are wider accordingly.' },
]

export function AboutDataFooter() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('senra:about-open')
    if (stored === 'true') setOpen(true)
  }, [])

  const toggle = () => {
    setOpen(v => {
      localStorage.setItem('senra:about-open', String(!v))
      return !v
    })
  }

  return (
    <div
      className="mt-6"
      style={{ borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}
    >
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/[0.02] transition-colors"
      >
        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
          ⓘ  Data: 2023–24 govt. estimates · Formal economy only · {LIMITATIONS.length} known limitations
        </span>
        <span
          style={{
            fontSize: '12px', color: 'rgba(255,255,255,0.4)',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            display: 'inline-block',
          }}
        >
          ↓
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: 'hidden' }}
          >
            <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {LIMITATIONS.map(l => (
                <div key={l.title} style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)' }}>
                  <span style={{ color: 'rgba(255,255,255,0.65)', fontWeight: 600 }}>{l.title}: </span>
                  {l.body}
                </div>
              ))}
              <div style={{ fontSize: '11px' }}>
                <Link href="/methodology#limitations" style={{ color: '#E0981E', textDecoration: 'none' }}>
                  Full methodology and limitations →
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
