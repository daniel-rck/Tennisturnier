import type { ReactNode } from 'react'

interface Props {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
}: Props) {
  return (
    <div
      className={
        'rounded-lg border border-dashed border-border-strong bg-surface-muted px-6 py-10 text-center ' +
        className
      }
    >
      {icon && (
        <div className="text-3xl mb-2" aria-hidden>
          {icon}
        </div>
      )}
      <p className="text-sm font-medium text-fg">{title}</p>
      {description && (
        <p className="text-xs text-fg-muted mt-1 max-w-sm mx-auto">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
