import { clsx } from 'clsx'

interface CardProps {
  children: React.ReactNode
  className?: string
  title?: string
  subtitle?: string
  actions?: React.ReactNode
}

export function Card({ children, className, title, subtitle, actions }: CardProps) {
  return (
    <div className={clsx('bg-bg-base border border-border-default rounded-2xl', className)}>
      {(title || actions) && (
        <div className="flex items-start justify-between px-5 pt-5 pb-0">
          <div>
            {title && <h3 className="text-sm font-semibold text-text-primary">{title}</h3>}
            {subtitle && <p className="text-xs text-text-secondary mt-0.5">{subtitle}</p>}
          </div>
          {actions && <div>{actions}</div>}
        </div>
      )}
      <div className={clsx(title || actions ? 'p-5 pt-3' : 'p-5')}>{children}</div>
    </div>
  )
}
