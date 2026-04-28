import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

export function InstallPrompt() {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    if (isStandalone()) return
    const handler = (e: Event) => {
      e.preventDefault()
      setEvent(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    const onInstalled = () => setEvent(null)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (!event || hidden) return null

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await event.prompt()
          await event.userChoice
        } finally {
          setEvent(null)
        }
      }}
      onContextMenu={(e) => {
        e.preventDefault()
        setHidden(true)
      }}
      title="Als App installieren (Rechtsklick zum Ausblenden)"
      className="text-emerald-100 hover:text-white text-xs px-2 py-1 leading-none"
      aria-label="App installieren"
    >
      ⤓ Installieren
    </button>
  )
}
