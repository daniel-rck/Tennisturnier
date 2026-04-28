import { createPortal } from 'react-dom'
import { useToast, useToasts, type Toast } from '../hooks/useToast'

const VARIANT_CLASSES: Record<Toast['variant'], string> = {
  success: 'border-l-4 border-brand bg-surface text-fg',
  error: 'border-l-4 border-danger-fg bg-danger-bg text-danger-fg',
  info: 'border-l-4 border-border-strong bg-surface text-fg',
}

const ICONS: Record<Toast['variant'], string> = {
  success: '✓',
  error: '⚠',
  info: 'ℹ',
}

export function Toaster() {
  const toasts = useToasts()
  const { dismiss } = useToast()
  if (typeof document === 'undefined') return null
  return createPortal(
    <div
      role="region"
      aria-label="Benachrichtigungen"
      className="no-print fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-[calc(100%-2rem)]"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role={t.variant === 'error' ? 'alert' : 'status'}
          className={
            'rounded-md shadow-md px-4 py-3 text-sm flex gap-3 items-start animate-slide-in-right ' +
            VARIANT_CLASSES[t.variant]
          }
        >
          <span aria-hidden className="text-base leading-none mt-0.5">
            {ICONS[t.variant]}
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-medium leading-tight">{t.title}</p>
            {t.description && (
              <p className="text-xs text-fg-muted mt-0.5">{t.description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => dismiss(t.id)}
            aria-label="Schließen"
            className="text-fg-subtle hover:text-fg text-base leading-none"
          >
            ×
          </button>
        </div>
      ))}
    </div>,
    document.body,
  )
}
