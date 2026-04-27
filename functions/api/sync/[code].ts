import {
  KV_TTL_SECONDS,
  constantTimeEqual,
  extractBearer,
  hashToken,
  isValidCode,
  jsonResponse,
} from '../../_shared/kv'
import type { StoredTournament, SyncEnv } from '../../_shared/kv'

interface PutBody {
  tournament: unknown
  /** Optional client-known version for optimistic concurrency. Server still authoritative. */
  baseVersion?: number
}

interface PathParams {
  code: string
}

/**
 * GET /api/sync/:code?since=<n>
 *   → 200 { tournament, version, updatedAt } if newer than `since`
 *   → 304 if version === since
 *   → 404 if code unknown
 */
export const onRequestGet: PagesFunction<SyncEnv, 'code'> = async ({
  request,
  env,
  params,
}) => {
  const { code } = params as unknown as PathParams
  if (!isValidCode(code)) return jsonResponse({ error: 'invalid_code' }, { status: 400 })

  const raw = await env.TOURNAMENTS.get(code, { type: 'text' })
  if (raw == null) return jsonResponse({ error: 'not_found' }, { status: 404 })
  const stored = JSON.parse(raw as string) as StoredTournament

  const url = new URL(request.url)
  const sinceRaw = url.searchParams.get('since')
  const since = sinceRaw == null ? null : Number.parseInt(sinceRaw, 10)
  if (since != null && Number.isFinite(since) && since === stored.version) {
    return new Response(null, {
      status: 304,
      headers: { 'Cache-Control': 'no-store' },
    })
  }

  return jsonResponse({
    tournament: stored.tournament,
    version: stored.version,
    updatedAt: stored.updatedAt,
  })
}

/**
 * PUT /api/sync/:code  (Authorization: Bearer <ownerToken>)
 *   body: { tournament, baseVersion? }
 *   → 200 { version }
 *   → 401 if token missing/wrong
 *   → 404 if code unknown
 *   → 409 if baseVersion present and != server version (caller should re-fetch)
 */
export const onRequestPut: PagesFunction<SyncEnv, 'code'> = async ({
  request,
  env,
  params,
}) => {
  const { code } = params as unknown as PathParams
  if (!isValidCode(code)) return jsonResponse({ error: 'invalid_code' }, { status: 400 })

  const token = extractBearer(request)
  if (!token) return jsonResponse({ error: 'unauthorized' }, { status: 401 })

  const raw = await env.TOURNAMENTS.get(code, { type: 'text' })
  if (raw == null) return jsonResponse({ error: 'not_found' }, { status: 404 })
  const stored = JSON.parse(raw as string) as StoredTournament

  const tokenHash = await hashToken(token)
  if (!constantTimeEqual(tokenHash, stored.ownerTokenHash)) {
    return jsonResponse({ error: 'forbidden' }, { status: 403 })
  }

  let body: PutBody
  try {
    body = (await request.json()) as PutBody
  } catch {
    return jsonResponse({ error: 'invalid_json' }, { status: 400 })
  }
  if (!body || body.tournament == null) {
    return jsonResponse({ error: 'tournament_required' }, { status: 400 })
  }
  if (
    body.baseVersion != null &&
    Number.isFinite(body.baseVersion) &&
    body.baseVersion !== stored.version
  ) {
    return jsonResponse(
      { error: 'version_conflict', currentVersion: stored.version },
      { status: 409 },
    )
  }

  const next: StoredTournament = {
    tournament: body.tournament,
    version: stored.version + 1,
    ownerTokenHash: stored.ownerTokenHash,
    updatedAt: new Date().toISOString(),
  }
  await env.TOURNAMENTS.put(code, JSON.stringify(next), {
    expirationTtl: KV_TTL_SECONDS,
  })
  return jsonResponse({ version: next.version })
}

/**
 * DELETE /api/sync/:code  (Authorization: Bearer <ownerToken>)
 *   → 204
 */
export const onRequestDelete: PagesFunction<SyncEnv, 'code'> = async ({
  request,
  env,
  params,
}) => {
  const { code } = params as unknown as PathParams
  if (!isValidCode(code)) return jsonResponse({ error: 'invalid_code' }, { status: 400 })
  const token = extractBearer(request)
  if (!token) return jsonResponse({ error: 'unauthorized' }, { status: 401 })

  const raw = await env.TOURNAMENTS.get(code, { type: 'text' })
  if (raw == null) return new Response(null, { status: 204 })
  const stored = JSON.parse(raw as string) as StoredTournament
  const tokenHash = await hashToken(token)
  if (!constantTimeEqual(tokenHash, stored.ownerTokenHash)) {
    return jsonResponse({ error: 'forbidden' }, { status: 403 })
  }
  await env.TOURNAMENTS.delete(code)
  return new Response(null, { status: 204 })
}
