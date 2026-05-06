import { useCallback, useEffect, useState } from 'react'

/**
 * Track and control browser fullscreen state.
 *
 * Fullscreen requests must be triggered by a user gesture, so call
 * `request` / `toggle` from a click handler. `exit` can be called
 * programmatically (e.g. when leaving the reveal stage).
 */
export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(
    () => typeof document !== 'undefined' && document.fullscreenElement != null,
  )

  useEffect(() => {
    const handler = () => setIsFullscreen(document.fullscreenElement != null)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  const request = useCallback(async () => {
    if (typeof document === 'undefined') return
    if (document.fullscreenElement) return
    try {
      await document.documentElement.requestFullscreen()
    } catch {
      // User denied or browser doesn't support — silently ignore.
    }
  }, [])

  const exit = useCallback(async () => {
    if (typeof document === 'undefined') return
    if (!document.fullscreenElement) return
    try {
      await document.exitFullscreen()
    } catch {
      // Ignore.
    }
  }, [])

  const toggle = useCallback(() => {
    return isFullscreen ? exit() : request()
  }, [isFullscreen, request, exit])

  const supported =
    typeof document !== 'undefined' &&
    typeof document.documentElement.requestFullscreen === 'function'

  return { isFullscreen, supported, request, exit, toggle }
}
