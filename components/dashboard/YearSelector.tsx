'use client'

const YEARS = [2019, 2020, 2021, 2022, 2023, 2024] as const

interface YearSelectorProps {
  value: number
  onChange: (year: number) => void
}

export function YearSelector({ value, onChange }: YearSelectorProps) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-text-tertiary mr-1">Year:</span>
      {YEARS.map(year => (
        <button
          key={year}
          onClick={() => onChange(year)}
          className="numeric text-xs px-2 py-1 rounded-full border transition-colors"
          style={{
            background:   value === year ? '#E0981E' : 'transparent',
            borderColor:  value === year ? '#E0981E' : 'rgba(255,255,255,0.15)',
            color:        value === year ? '#0F0F0F'  : 'rgba(255,255,255,0.5)',
            fontWeight:   value === year ? 700 : 400,
          }}
        >
          {year}
        </button>
      ))}
    </div>
  )
}
