import { useEffect, useState } from 'react'

export function OfflineBanner() {
  const [online, setOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine,
  )

  useEffect(() => {
    const onOnline = () => setOnline(true)
    const onOffline = () => setOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  if (online) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="no-print bg-warn-bg text-warn-fg text-xs text-center py-1 animate-fade-in"
    >
      Offline — Änderungen werden lokal gespeichert und synchronisieren, sobald
      die Verbindung zurück ist.
    </div>
  )
}
