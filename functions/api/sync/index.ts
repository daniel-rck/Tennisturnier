import {
  KV_TTL_SECONDS,
  generateCode,
  generateToken,
  hashToken,
  jsonResponse,
} from '../../_shared/kv'
import type { StoredTournament, SyncEnv } from '../../_shared/kv'

interface CreateBody {
  tournament: unknown
}

/**
 * POST /api/sync
 *   body: { tournament: <Tournament JSON> }
 *   → 201 { code, ownerToken }
 *
 * Generates a new share code, owner token, stores the initial snapshot.
 */
export const onRequestPost: PagesFunction<SyncEnv> = async ({ request, env }) => {
  let body: CreateBody
  try {
    body = (await request.json()) as CreateBody
  } catch {
    return jsonResponse({ error: 'invalid_json' }, { status: 400 })
  }
  if (!body || typeof body !== 'object' || body.tournament == null) {
    return jsonResponse({ error: 'tournament_required' }, { status: 400 })
  }

  const ownerToken = generateToken()
  const ownerTokenHash = await hashToken(ownerToken)

  // Retry up to 5 times on collision (extremely unlikely with 30^6 keyspace).
  let code = ''
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = generateCode()
    const existing = await env.TOURNAMENTS.get(candidate, { type: 'text' })
    if (existing == null) {
      code = candidate
      break
    }
  }
  if (!code) {
    return jsonResponse({ error: 'code_collision' }, { status: 503 })
  }

  const stored: StoredTournament = {
    tournament: body.tournament,
    version: 1,
    ownerTokenHash,
    updatedAt: new Date().toISOString(),
  }
  await env.TOURNAMENTS.put(code, JSON.stringify(stored), {
    expirationTtl: KV_TTL_SECONDS,
  })

  return jsonResponse({ code, ownerToken, version: 1 }, { status: 201 })
}
