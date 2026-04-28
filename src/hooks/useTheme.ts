import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'tennisturnier:theme'

function readStored(): Theme {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === 'dark' || raw === 'light') return raw
  } catch {
    /* localStorage unavailable (private mode, quota) — fall back to defaults */
  }
  return 'system'
}

function applyTheme(theme: Theme): void {
  const root = document.documentElement
  if (theme === 'system') {
    delete root.dataset.theme
  } else {
    root.dataset.theme = theme
  }
}

function effectiveScheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  }
  return theme
}

function syncThemeColorMeta(theme: Theme): void {
  const scheme = effectiveScheme(theme)
  const color = scheme === 'dark' ? '#0f172a' : '#15803d'
  document
    .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
    .forEach((m) => {
      const media = m.getAttribute('media')
      if (!media) m.setAttribute('content', color)
    })
}

export function useTheme(): {
  theme: Theme
  setTheme: (next: Theme) => void
  cycle: () => void
} {
  const [theme, setThemeState] = useState<Theme>(() => readStored())

  useEffect(() => {
    applyTheme(theme)
    syncThemeColorMeta(theme)
    try {
      if (theme === 'system') localStorage.removeItem(STORAGE_KEY)
      else localStorage.setItem(STORAGE_KEY, theme)
    } catch {
    /* localStorage unavailable (private mode, quota) — fall back to defaults */
  }
  }, [theme])

  // Re-sync meta when system preference changes (only relevant in 'system' mode).
  useEffect(() => {
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => syncThemeColorMeta('system')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [theme])

  const setTheme = (next: Theme) => setThemeState(next)
  const cycle = () =>
    setThemeState((t) => (t === 'light' ? 'dark' : t === 'dark' ? 'system' : 'light'))

  return { theme, setTheme, cycle }
}
