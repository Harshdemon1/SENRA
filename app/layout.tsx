import type { Metadata } from 'next'
import './globals.css'
import Link from 'next/link'
import Image from 'next/image'
import { MethodologyLink } from '@/components/ui/MethodologyLink'

export const metadata: Metadata = {
  title: 'SENRA',
  description: 'Algorithmically derived ranking of retail supply chain fragility across 36 Indian states and UTs.',
  icons: { icon: '/favicon.png' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-bg-void text-text-primary">
        <nav className="border-b border-border-subtle bg-bg-base sticky top-0 z-50">
          <div className="max-w-screen-2xl mx-auto px-6 h-12 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <Image src="/logo.png" alt="SENRA" height={32} width={32} className="rounded-sm" priority />
              <span className="senra-wordmark">SENRA</span>
              <span className="text-text-tertiary text-xs hidden sm:block">Supply Chain Risk Intelligence</span>
            </Link>
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <Link href="/" className="px-3 py-1.5 rounded-full border border-white/20 hover:border-white/50 hover:text-text-primary transition-colors">Dashboard</Link>
              <MethodologyLink />
              <Link href="/compare" className="px-3 py-1.5 rounded-full border border-white/20 hover:border-white/50 hover:text-text-primary transition-colors">Compare</Link>
              <a
                href="https://github.com/Harshdemon1/SENRA"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-full border border-white/20 hover:border-white/50 hover:text-text-primary transition-colors"
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
