/**
 * Shared helpers for the sync API. No I/O — pure utilities + KV access.
 */

export interface SyncEnv {
  TOURNAMENTS: KVNamespace
}

export interface StoredTournament {
  /** The Tournament JSON, opaque to the server. */
  tournament: unknown
  /** Monotonic version, incremented on every successful PUT. */
  version: number
  /** SHA-256(ownerToken) hex — bearer must match to write. */
  ownerTokenHash: string
  /** ISO timestamp of last write. */
  updatedAt: string
}

/** Self-cleaning TTL: tournaments disappear after 7 days idle. */
export const KV_TTL_SECONDS = 7 * 24 * 60 * 60

/** Visually unambiguous alphabet — drops 0/O/1/I/L. */
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

export function generateCode(): string {
  const buf = new Uint8Array(6)
  crypto.getRandomValues(buf)
  let out = ''
  for (const b of buf) out += CODE_ALPHABET[b % CODE_ALPHABET.length]
  return out
}

export function isValidCode(code: string): boolean {
  if (typeof code !== 'string' || code.length !== 6) return false
  for (const ch of code) if (!CODE_ALPHABET.includes(ch)) return false
  return true
}

export function generateToken(): string {
  const buf = new Uint8Array(32)
  crypto.getRandomValues(buf)
  return [...buf].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function hashToken(token: string): Promise<string> {
  const data = new TextEncoder().encode(token)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/** Constant-time string compare to avoid timing leaks on the token check. */
export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export function extractBearer(req: Request): string | null {
  const h = req.headers.get('Authorization')
  if (!h) return null
  const m = /^Bearer\s+(.+)$/i.exec(h)
  return m ? m[1].trim() : null
}

export function jsonResponse(
  body: unknown,
  init: ResponseInit = {},
): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      // Sync API must not be cached by Cloudflare or browsers.
      'Cache-Control': 'no-store',
      ...(init.headers ?? {}),
    },
  })
}

/**
 * Returns a clear 503 if the TOURNAMENTS KV binding isn't wired to the Worker.
 * Without this guard, calling `.get` on `undefined` throws and Cloudflare
 * surfaces an opaque 500 — which is what the user sees today before the
 * namespace is created in the dashboard.
 */
export function kvBindingMissingResponse(): Response {
  return jsonResponse(
    {
      error: 'sync_not_configured',
      message:
        'Live-Sync ist nicht eingerichtet. Bitte im Cloudflare-Dashboard eine KV-Namespace-Bindung mit dem Variablennamen "TOURNAMENTS" anlegen.',
    },
    { status: 503 },
  )
}

/**
 * Parses a stored snapshot, or returns null if the blob is corrupt. Avoids
 * letting an uncaught `JSON.parse` exception bubble up to a generic 500.
 */
export function parseStored(raw: string): StoredTournament | null {
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return null
    const s = parsed as Partial<StoredTournament>
    if (
      typeof s.version !== 'number' ||
      typeof s.ownerTokenHash !== 'string' ||
      !/^[0-9a-f]{64}$/.test(s.ownerTokenHash) ||
      typeof s.updatedAt !== 'string' ||
      !('tournament' in s) ||
      s.tournament == null
    ) {
      return null
    }
    return s as StoredTournament
  } catch {
    return null
  }
}
