'use client'
import Link from 'next/link'
import { useMediaQuery } from '@/hooks/useMediaQuery'

interface PageShellProps {
  title: string
  subtitle?: string
  breadcrumb?: string
  sidebar?: React.ReactNode
  children: React.ReactNode
}

export function PageShell({ title, subtitle, breadcrumb, sidebar, children }: PageShellProps) {
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  return (
    <div className="px-6 py-8 max-w-screen-2xl mx-auto">
      <div className="mb-6">
        <div className="text-xs text-text-tertiary mb-2">
          <Link href="/" className="hover:text-accent transition-colors">SENRA</Link>
          {breadcrumb && (
            <>
              <span className="mx-1.5 text-text-tertiary/50">/</span>
              <span>{breadcrumb}</span>
            </>
          )}
        </div>
        <h1 className="text-2xl font-semibold text-text-primary">{title}</h1>
        {subtitle && <p className="text-sm text-text-secondary mt-1">{subtitle}</p>}
      </div>

      {sidebar && isDesktop ? (
        <div className="flex gap-10">
          <aside className="w-52 flex-shrink-0">
            <div className="sticky top-20">{sidebar}</div>
          </aside>
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      ) : (
        <main>{children}</main>
      )}
    </div>
  )
}
