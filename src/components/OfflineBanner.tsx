import { useEffect, useState } from 'react'
import { useTranslation } from '../i18n'

export function OfflineBanner() {
  const { t } = useTranslation()
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
      {t('offline.message')}
    </div>
  )
}
