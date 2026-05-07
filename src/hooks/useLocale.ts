import { useEffect, useSyncExternalStore } from 'react'

export type Locale = 'de' | 'en'

const STORAGE_KEY = 'tennisturnier:locale'

type Listener = () => void
const listeners = new Set<Listener>()
let cached: Locale | null = null

function detectDefault(): Locale {
  if (typeof navigator === 'undefined') return 'de'
  const lang = (navigator.language ?? '').toLowerCase()
  return lang.startsWith('en') ? 'en' : 'de'
}

function readStored(): Locale {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === 'de' || raw === 'en') return raw
  } catch {
    /* localStorage unavailable */
  }
  return detectDefault()
}

function getSnapshot(): Locale {
  if (cached == null) cached = readStored()
  return cached
}

function getServerSnapshot(): Locale {
  return 'de'
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function notify(): void {
  for (const l of listeners) l()
}

export function setLocale(next: Locale): void {
  cached = next
  try {
    localStorage.setItem(STORAGE_KEY, next)
  } catch {
    /* localStorage unavailable */
  }
  notify()
}

export function useLocale(): { locale: Locale; setLocale: (next: Locale) => void } {
  const locale = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale
    }
  }, [locale])

  return { locale, setLocale }
}
