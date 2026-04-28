import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

export type ToastVariant = 'success' | 'error' | 'info'

export interface Toast {
  id: string
  title: string
  description?: string
  variant: ToastVariant
  durationMs: number
}

interface ToastContextValue {
  toasts: Toast[]
  toast: (t: { title: string; description?: string; variant?: ToastVariant; durationMs?: number }) => void
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

let counter = 0
function nextId(): string {
  counter += 1
  return `${Date.now()}-${counter}`
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const lastSigRef = useRef<{ sig: string; at: number } | null>(null)

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback<ToastContextValue['toast']>((opts) => {
    const variant = opts.variant ?? 'info'
    const sig = `${variant}::${opts.title}::${opts.description ?? ''}`
    const now = Date.now()
    if (lastSigRef.current && lastSigRef.current.sig === sig && now - lastSigRef.current.at < 3000) {
      return // dedupe identical toasts within 3s
    }
    lastSigRef.current = { sig, at: now }

    const id = nextId()
    const durationMs = opts.durationMs ?? (variant === 'error' ? 6000 : 4000)
    setToasts((prev) => [...prev, { id, title: opts.title, description: opts.description, variant, durationMs }])
    window.setTimeout(() => dismiss(id), durationMs)
  }, [dismiss])

  const value = useMemo(() => ({ toasts, toast, dismiss }), [toasts, toast, dismiss])
  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}

export function useToast(): { toast: ToastContextValue['toast']; dismiss: ToastContextValue['dismiss'] } {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>')
  return { toast: ctx.toast, dismiss: ctx.dismiss }
}

export function useToasts(): Toast[] {
  const ctx = useContext(ToastContext)
  if (!ctx) return []
  return ctx.toasts
}
