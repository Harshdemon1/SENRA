/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'bg-void':     '#070707',
        'bg-base':     '#0F0F0F',
        'bg-surface':  '#171717',
        'bg-elevated': '#202020',
        'bg-hover':    '#282828',
        'critical':    '#C0341D',
        'critical-bg': '#2A0D09',
        'high':        '#CC7A0A',
        'high-bg':     '#2C1C04',
        'moderate':    '#AA9700',
        'moderate-bg': '#252200',
        'low':         '#2A8556',
        'low-bg':      '#0A2018',
        'accent':      '#E0981E',
        'accent-muted':'#725010',
        'accent-bg':   '#1E1708',
        'text-primary':   '#EAE5DB',
        'text-secondary': '#857E74',
        'text-tertiary':  '#4A4540',
        'border-subtle':  '#1A1A1A',
        'border-default': '#282828',
        'border-strong':  '#363636',
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'serif'],
        mono:    ['"Azeret Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
