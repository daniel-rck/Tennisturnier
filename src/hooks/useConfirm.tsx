import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

export interface ConfirmOptions {
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
}

interface ConfirmRequest extends ConfirmOptions {
  id: string
  resolve: (ok: boolean) => void
}

interface ConfirmContextValue {
  request: ConfirmRequest | null
  confirm: (opts: ConfirmOptions) => Promise<boolean>
  resolve: (ok: boolean) => void
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null)

let counter = 0
const nextId = () => `confirm-${Date.now()}-${++counter}`

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<ConfirmRequest | null>(null)
  const pendingRef = useRef<ConfirmRequest | null>(null)

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      const req: ConfirmRequest = { ...opts, id: nextId(), resolve }
      pendingRef.current = req
      setRequest(req)
    })
  }, [])

  const resolve = useCallback((ok: boolean) => {
    const req = pendingRef.current
    if (req) {
      req.resolve(ok)
      pendingRef.current = null
    }
    setRequest(null)
  }, [])

  const value = useMemo(() => ({ request, confirm, resolve }), [request, confirm, resolve])
  return <ConfirmContext.Provider value={value}>{children}</ConfirmContext.Provider>
}

export function useConfirm(): (opts: ConfirmOptions) => Promise<boolean> {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used within <ConfirmProvider>')
  return ctx.confirm
}

export function useConfirmRequest(): {
  request: ConfirmRequest | null
  resolve: (ok: boolean) => void
} {
  const ctx = useContext(ConfirmContext)
  if (!ctx) return { request: null, resolve: () => {} }
  return { request: ctx.request, resolve: ctx.resolve }
}
