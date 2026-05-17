import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  title?: ReactNode
  description?: ReactNode
  children: ReactNode
  /** Bottom-sheet on mobile, center-modal on desktop (default). */
  variant?: 'bottom' | 'center'
  /** Optional max-width for desktop, default 480px. */
  maxWidth?: number
}

export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  variant = 'bottom',
  maxWidth = 480,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    if (open && !el.open) el.showModal()
    if (!open && el.open) el.close()
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      className={[
        'p-0 bg-transparent backdrop:bg-black/40 backdrop:backdrop-blur-sm',
        variant === 'bottom'
          ? 'fixed left-0 right-0 bottom-0 top-auto m-0 w-full max-w-full sm:left-1/2 sm:-translate-x-1/2 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2'
          : 'fixed inset-0 m-auto',
        'overflow-visible',
      ].join(' ')}
      aria-labelledby={title ? 'sheet-title' : undefined}
    >
      <div
        className={[
          'bg-surface text-fg shadow-elevated animate-slide-up max-h-[90vh] overflow-y-auto',
          variant === 'bottom'
            ? 'rounded-t-card sm:rounded-card sm:max-w-full'
            : 'rounded-card',
        ].join(' ')}
        style={variant === 'bottom' ? { paddingBottom: 'env(safe-area-inset-bottom)' } : undefined}
      >
        {variant === 'bottom' && (
          <div className="flex justify-center pt-2 pb-1 sm:hidden">
            <span className="h-1 w-10 rounded-full bg-border-strong" aria-hidden />
          </div>
        )}
        {(title || description) && (
          <div className="px-5 pt-4 pb-3 border-b border-border">
            {title && (
              <h2 id="sheet-title" className="text-lg font-semibold">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-sm text-fg-muted mt-1">{description}</p>
            )}
          </div>
        )}
        <div
          className={variant === 'center' ? 'px-5 py-4' : 'px-5 py-4'}
          style={variant === 'center' ? { maxWidth } : undefined}
        >
          {children}
        </div>
      </div>
    </dialog>
  )
}
