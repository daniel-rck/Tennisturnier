import { useCallback, useEffect, useRef, useState } from 'react'
import type { SyncConfig, Tournament } from '../types'

export type SyncStatus = 'disabled' | 'connecting' | 'live' | 'offline' | 'error'
export type SyncRole = 'none' | 'owner' | 'viewer'

interface CreateResponse {
  code: string
  ownerToken: string
  version: number
}

interface ReadResponse {
  tournament: Tournament
  version: number
  updatedAt: string
}

interface UseSyncArgs {
  tournament: Tournament
  setSync: (config: SyncConfig | undefined) => void
  /** Replace the entire tournament (used when applying a remote snapshot). */
  applyRemote: (next: Tournament) => void
}

interface UseSyncResult {
  status: SyncStatus
  role: SyncRole
  error: string | null
  /** Owner side — opens a new session, returns the code for sharing. */
  createSession: () => Promise<string>
  /** Viewer side — connects to an existing code (no write access). */
  joinSession: (code: string) => Promise<void>
  /**
   * Drops the local session info. If the user was the owner, this also
   * fires a best-effort DELETE to invalidate the share code immediately;
   * viewers just disconnect locally and the snapshot self-cleans on TTL.
   */
  leaveSession: () => void
}

const POLL_INTERVAL_MS = 3000
const PUSH_DEBOUNCE_MS = 1000
const BACKOFF_MAX_MS = 30_000

export function useSync({
  tournament,
  setSync,
  applyRemote,
}: UseSyncArgs): UseSyncResult {
  const sync = tournament.sync
  const role: SyncRole = !sync?.enabled
    ? 'none'
    : sync.ownerToken
      ? 'owner'
      : 'viewer'

  const [status, setStatus] = useState<SyncStatus>('disabled')
  const [error, setError] = useState<string | null>(null)
  const versionRef = useRef<number>(0)

  // ---- Owner push ---------------------------------------------------------

  const lastPushedRef = useRef<string>('')
  const pushTimerRef = useRef<number | null>(null)
  const pushInFlightRef = useRef<boolean>(false)
  // Holds the latest tournament so window-level event listeners (e.g. `online`)
  // can read it without being re-registered on every render.
  const tournamentRef = useRef<Tournament>(tournament)
  useEffect(() => {
    tournamentRef.current = tournament
  }, [tournament])

  useEffect(() => {
    if (role !== 'owner' || !sync) return
    const payload = stripSync(tournament)
    const json = JSON.stringify(payload)
    if (json === lastPushedRef.current) return

    if (pushTimerRef.current != null) window.clearTimeout(pushTimerRef.current)
    pushTimerRef.current = window.setTimeout(() => {
      pushTimerRef.current = null
      void doPush(json, payload)
    }, PUSH_DEBOUNCE_MS)

    return () => {
      if (pushTimerRef.current != null) window.clearTimeout(pushTimerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournament, role, sync?.shareCode, sync?.ownerToken])

  // Retry push as soon as the browser reports the connection is back, so that
  // edits made while offline don't sit in localStorage forever waiting for the
  // next change to trigger a sync.
  useEffect(() => {
    if (role !== 'owner' || !sync) return
    const flushPending = () => {
      const payload = stripSync(tournamentRef.current)
      const json = JSON.stringify(payload)
      if (json === lastPushedRef.current) return
      if (pushInFlightRef.current) return
      if (pushTimerRef.current != null) {
        window.clearTimeout(pushTimerRef.current)
        pushTimerRef.current = null
      }
      void doPush(json, payload)
    }
    window.addEventListener('online', flushPending)
    return () => {
      window.removeEventListener('online', flushPending)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, sync?.shareCode, sync?.ownerToken])

  const doPush = async (
    json: string,
    payload: Tournament,
  ): Promise<void> => {
    if (!sync || !sync.ownerToken) return
    if (pushInFlightRef.current) return
    pushInFlightRef.current = true
    setStatus('connecting')
    try {
      const res = await fetch(`/api/sync/${sync.shareCode}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sync.ownerToken}`,
        },
        body: JSON.stringify({ tournament: payload }),
      })
      if (!res.ok) {
        setStatus('error')
        setError(await readErrorMessage(res))
        return
      }
      const body = (await res.json()) as { version: number }
      versionRef.current = body.version
      lastPushedRef.current = json
      setStatus('live')
      setError(null)
    } catch {
      setStatus('offline')
      setError('Netzwerkfehler')
    } finally {
      pushInFlightRef.current = false
    }
  }

  // ---- Viewer poll --------------------------------------------------------

  useEffect(() => {
    if (role !== 'viewer' || !sync) return
    let cancelled = false
    let timeoutId: number | null = null
    let backoff = POLL_INTERVAL_MS

    const poll = async (): Promise<void> => {
      if (cancelled) return
      // Pause polling when tab is hidden — picks up again on visibilitychange.
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        timeoutId = window.setTimeout(poll, POLL_INTERVAL_MS)
        return
      }
      setStatus((s) => (s === 'live' ? s : 'connecting'))
      try {
        const url =
          versionRef.current > 0
            ? `/api/sync/${sync.shareCode}?since=${versionRef.current}`
            : `/api/sync/${sync.shareCode}`
        const res = await fetch(url, { method: 'GET' })
        if (cancelled) return
        if (res.status === 304) {
          backoff = POLL_INTERVAL_MS
          setStatus('live')
        } else if (res.status === 200) {
          const body = (await res.json()) as ReadResponse
          versionRef.current = body.version
          // Re-attach our local sync config so we stay in viewer mode.
          applyRemote({ ...body.tournament, sync })
          backoff = POLL_INTERVAL_MS
          setStatus('live')
          setError(null)
        } else if (res.status === 404) {
          setStatus('error')
          setError('Code nicht gefunden')
          return // stop polling
        } else {
          setStatus('error')
          setError(`HTTP ${res.status}`)
          backoff = Math.min(backoff * 2, BACKOFF_MAX_MS)
        }
      } catch {
        if (cancelled) return
        setStatus('offline')
        setError('Netzwerkfehler')
        backoff = Math.min(backoff * 2, BACKOFF_MAX_MS)
      }
      if (!cancelled) timeoutId = window.setTimeout(poll, backoff)
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible' && !cancelled) {
        if (timeoutId != null) window.clearTimeout(timeoutId)
        void poll()
      }
    }
    const onOnline = () => {
      if (cancelled) return
      backoff = POLL_INTERVAL_MS
      if (timeoutId != null) window.clearTimeout(timeoutId)
      void poll()
    }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('online', onOnline)
    void poll()
    return () => {
      cancelled = true
      if (timeoutId != null) window.clearTimeout(timeoutId)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('online', onOnline)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, sync?.shareCode])

  // ---- Idle when disabled -------------------------------------------------

  useEffect(() => {
    if (role === 'none') {
      setStatus('disabled')
      setError(null)
      versionRef.current = 0
      lastPushedRef.current = ''
    }
  }, [role])

  // ---- Public API ---------------------------------------------------------

  const createSession = useCallback(async (): Promise<string> => {
    setStatus('connecting')
    setError(null)
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tournament: stripSync(tournament) }),
    })
    if (!res.ok) {
      setStatus('error')
      setError(await readErrorMessage(res))
      throw new Error(`create_failed_${res.status}`)
    }
    const body = (await res.json()) as CreateResponse
    versionRef.current = body.version
    lastPushedRef.current = JSON.stringify(stripSync(tournament))
    setSync({ shareCode: body.code, ownerToken: body.ownerToken, enabled: true })
    setStatus('live')
    return body.code
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournament])

  const joinSession = useCallback(
    async (code: string): Promise<void> => {
      const trimmed = code.trim().toUpperCase()
      setStatus('connecting')
      setError(null)
      const res = await fetch(`/api/sync/${trimmed}`, { method: 'GET' })
      if (res.status === 404) {
        setStatus('error')
        setError('Code nicht gefunden')
        throw new Error('not_found')
      }
      if (!res.ok) {
        setStatus('error')
        setError(await readErrorMessage(res))
        throw new Error(`join_failed_${res.status}`)
      }
      const body = (await res.json()) as ReadResponse
      versionRef.current = body.version
      const newSync: SyncConfig = { shareCode: trimmed, enabled: true }
      applyRemote({ ...body.tournament, sync: newSync })
      setStatus('live')
    },
    [applyRemote],
  )

  const leaveSession = useCallback(() => {
    // Best-effort: if we're the owner, ask the server to drop the snapshot so
    // the share code stops working immediately (matches the button's "Code
    // wird ungültig" promise). Failure is non-fatal — the entry self-cleans
    // after the KV TTL anyway.
    if (sync?.shareCode && sync.ownerToken) {
      void fetch(`/api/sync/${sync.shareCode}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${sync.ownerToken}` },
        keepalive: true,
      }).catch(() => {
        /* swallow — local cleanup still proceeds */
      })
    }
    setSync(undefined)
    setStatus('disabled')
    setError(null)
    versionRef.current = 0
    lastPushedRef.current = ''
  }, [setSync, sync?.shareCode, sync?.ownerToken])

  return {
    status,
    role,
    error,
    createSession,
    joinSession,
    leaveSession,
  }
}

/** Reads `{message}` or `{error}` from a JSON error body, falling back to HTTP status. */
async function readErrorMessage(res: Response): Promise<string> {
  try {
    const body = (await res.clone().json()) as { message?: string; error?: string }
    if (body?.message) return body.message
    if (body?.error) return body.error
  } catch {
    // Non-JSON body — fall through.
  }
  return `HTTP ${res.status}`
}

/** Returns a tournament copy with `sync` stripped — never sent to server. */
function stripSync(t: Tournament): Tournament {
  if (!t.sync) return t
  const { sync: _omit, ...rest } = t
  void _omit
  return rest as Tournament
}
