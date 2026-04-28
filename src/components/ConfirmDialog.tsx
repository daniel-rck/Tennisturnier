import { useEffect, useRef } from 'react'
import { useConfirmRequest } from '../hooks/useConfirm'

export function ConfirmDialog() {
  const { request, resolve } = useConfirmRequest()
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const confirmBtnRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    if (request && !el.open) {
      el.showModal()
      // Focus confirm button so Enter triggers the action.
      window.requestAnimationFrame(() => confirmBtnRef.current?.focus())
    } else if (!request && el.open) {
      el.close()
    }
  }, [request])

  // ESC closes natively → trigger cancel
  useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    const onCancel = (e: Event) => {
      e.preventDefault()
      resolve(false)
    }
    el.addEventListener('cancel', onCancel)
    return () => el.removeEventListener('cancel', onCancel)
  }, [resolve])

  return (
    <dialog
      ref={dialogRef}
      className="no-print rounded-lg border border-border bg-surface text-fg p-0 shadow-xl backdrop:bg-black/40 backdrop:backdrop-blur-sm w-[min(28rem,calc(100%-2rem))] open:animate-scale-fade-in"
      onClick={(e) => {
        // Click on backdrop (dialog itself, not children) → cancel
        if (e.target === dialogRef.current) resolve(false)
      }}
    >
      {request && (
        <form
          method="dialog"
          onSubmit={(e) => {
            e.preventDefault()
            resolve(true)
          }}
          className="px-5 py-4"
        >
          <h2 className="text-base font-semibold text-fg">{request.title}</h2>
          {request.description && (
            <p className="text-sm text-fg-muted mt-2">{request.description}</p>
          )}
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => resolve(false)}
              className="rounded-md border border-border-strong px-3 py-1.5 text-sm hover:border-fg-muted"
            >
              {request.cancelLabel ?? 'Abbrechen'}
            </button>
            <button
              ref={confirmBtnRef}
              type="submit"
              className={
                'rounded-md px-3 py-1.5 text-sm font-medium text-white ' +
                (request.destructive
                  ? 'bg-danger-fg hover:opacity-90'
                  : 'bg-brand hover:bg-brand-hover')
              }
            >
              {request.confirmLabel ?? 'Bestätigen'}
            </button>
          </div>
        </form>
      )}
    </dialog>
  )
}
