'use client'
import { useEffect, useRef, useState } from 'react'

interface MobileBottomSheetProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  snapPoints?: [number, number]
}

export function MobileBottomSheet({
  isOpen,
  onClose,
  children,
  snapPoints = [80, 0.75],
}: MobileBottomSheetProps) {
  const [expanded, setExpanded] = useState(false)
  const sheetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) setExpanded(false)
  }, [isOpen])

  const expandedHeight = `${Math.round(snapPoints[1] * 100)}dvh`
  const collapsedHeight = `${snapPoints[0]}px`

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/40 z-40"
          style={{ animation: 'senra-fade-in 0.2s ease forwards' }}
        />
      )}
      <div
        ref={sheetRef}
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          background: '#111111',
          borderTop: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '16px 16px 0 0',
          height: isOpen ? (expanded ? expandedHeight : collapsedHeight) : '0px',
          overflow: 'hidden',
          transition: 'height 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          onClick={() => setExpanded(e => !e)}
          className="flex justify-center items-center py-3 cursor-pointer flex-shrink-0"
        >
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.2)' }} />
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-8" style={{ WebkitOverflowScrolling: 'touch' as never }}>
          {children}
        </div>
      </div>
    </>
  )
}
