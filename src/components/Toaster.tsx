import { createPortal } from 'react-dom'
import { useToast, useToasts, type Toast } from '../hooks/useToast'
import { useTranslation } from '../i18n'

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
  const { t: tr } = useTranslation()
  if (typeof document === 'undefined') return null
  return createPortal(
    <div
      role="region"
      aria-label={tr('common.notifications')}
      className="no-print fixed top-2 left-2 right-2 sm:top-4 sm:right-4 sm:left-auto z-50 flex flex-col gap-2 sm:max-w-sm"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role={toast.variant === 'error' ? 'alert' : 'status'}
          className={
            'rounded-md shadow-md px-4 py-3 text-sm flex gap-3 items-start animate-slide-in-right ' +
            VARIANT_CLASSES[toast.variant]
          }
        >
          <span aria-hidden className="text-base leading-none mt-0.5">
            {ICONS[toast.variant]}
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-medium leading-tight">{toast.title}</p>
            {toast.description && (
              <p className="text-xs text-fg-muted mt-0.5">{toast.description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => dismiss(toast.id)}
            aria-label={tr('common.close')}
            className="icon-btn shrink-0 text-fg-subtle hover:text-fg"
          >
            ×
          </button>
        </div>
      ))}
    </div>,
    document.body,
  )
}
