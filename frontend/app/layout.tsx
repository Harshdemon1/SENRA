import type { Metadata } from 'next'
import './globals.css'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'India Supply Chain Fragility Index',
  description: 'Algorithmically derived ranking of retail supply chain fragility across 36 Indian states and UTs.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-bg-void text-text-primary">
        <nav className="border-b border-border-subtle bg-bg-base sticky top-0 z-50">
          <div className="max-w-screen-2xl mx-auto px-6 h-12 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <span className="text-accent font-display font-semibold tracking-tight">SCFI</span>
              <span className="text-text-tertiary text-xs hidden sm:block">India Supply Chain Fragility Index</span>
            </Link>
            <div className="flex items-center gap-6 text-sm text-text-secondary">
              <Link href="/" className="hover:text-text-primary transition-colors">Dashboard</Link>
              <Link href="/methodology" className="hover:text-text-primary transition-colors">Methodology</Link>
              <Link href="/compare" className="hover:text-text-primary transition-colors">Compare</Link>
              <a
                href="https://github.com/Harshdemon1/Palantir"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-text-primary transition-colors"
              >
                GitHub
              </a>
            </div>
          </div>
        </nav>
        <main className="max-w-screen-2xl mx-auto">
          {children}
        </main>
      </body>
    </html>
  )
}
