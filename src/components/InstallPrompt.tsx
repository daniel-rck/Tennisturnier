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
      className="inline-flex items-center gap-1 min-h-[44px] px-2 rounded-md text-emerald-100 hover:text-white hover:bg-emerald-600 leading-none"
      aria-label="App installieren"
    >
      <span aria-hidden className="text-base">⤓</span>
      <span className="hidden sm:inline text-xs">Installieren</span>
    </button>
  )
}
