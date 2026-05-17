'use client'
import { useEffect, useState } from 'react'

export function useOnce(key: string): [boolean, () => void] {
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    setDismissed(localStorage.getItem(key) === 'true')
  }, [key])

  const dismiss = () => {
    localStorage.setItem(key, 'true')
    setDismissed(true)
  }

  return [dismissed, dismiss]
}
