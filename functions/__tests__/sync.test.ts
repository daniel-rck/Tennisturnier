/// <reference types="@cloudflare/workers-types" />
import { describe, expect, it, beforeEach } from 'vitest'
import { onRequestPost as createTournament } from '../api/sync/index'
import {
  onRequestGet as readTournament,
  onRequestPut as writeTournament,
  onRequestDelete as deleteTournament,
} from '../api/sync/[code]'
import {
  generateCode,
  isValidCode,
  hashToken,
  generateToken,
  constantTimeEqual,
} from '../_shared/kv'

// Minimal in-memory KV that mimics the bits of KVNamespace we use.
class MemKV {
  private store = new Map<string, string>()
  async get(key: string): Promise<string | null> {
    return this.store.get(key) ?? null
  }
  async put(key: string, value: string): Promise<void> {
    this.store.set(key, value)
  }
  async delete(key: string): Promise<void> {
    this.store.delete(key)
  }
}

function makeEnv() {
  return { TOURNAMENTS: new MemKV() as unknown as KVNamespace }
}

// Light shim for the Pages Function context. We only feed `request`, `env`, `params`.
function ctx<P extends Record<string, string> = Record<string, string>>(
  request: Request,
  env: ReturnType<typeof makeEnv>,
  params?: P,
): Parameters<typeof readTournament>[0] {
  return {
    request,
    env,
    params: params ?? {},
  } as unknown as Parameters<typeof readTournament>[0]
}

describe('helpers', () => {
  it('generates valid 6-char codes', () => {
    for (let i = 0; i < 50; i++) {
      const code = generateCode()
      expect(code).toHaveLength(6)
      expect(isValidCode(code)).toBe(true)
    }
  })

  it('rejects invalid codes', () => {
    expect(isValidCode('')).toBe(false)
    expect(isValidCode('abc')).toBe(false)
    expect(isValidCode('AB0DEF')).toBe(false) // 0 not in alphabet
    expect(isValidCode('ABCDEFG')).toBe(false)
  })

  it('hashes consistently and constant-time-compares correctly', async () => {
    const t = generateToken()
    const h1 = await hashToken(t)
    const h2 = await hashToken(t)
    expect(h1).toBe(h2)
    expect(h1).toHaveLength(64)
    expect(constantTimeEqual(h1, h2)).toBe(true)
    expect(constantTimeEqual(h1, h1.slice(0, 63) + '0')).toBe(false)
  })
})

describe('missing KV binding', () => {
  // Regression: production would surface a bare 500 because handlers called
  // env.TOURNAMENTS.get(...) without checking the binding existed. They now
  // return a JSON 503 with a clear `sync_not_configured` error instead.
  const noKvCtx = (request: Request, params: Record<string, string> = {}) =>
    ({
      request,
      env: {} as ReturnType<typeof makeEnv>,
      params,
    }) as unknown as Parameters<typeof readTournament>[0]

  it('POST /api/sync returns 503 sync_not_configured', async () => {
    const res = await createTournament(
      noKvCtx(
        new Request('https://example.com/api/sync', {
          method: 'POST',
          body: JSON.stringify({ tournament: {} }),
        }),
      ),
    )
    expect(res.status).toBe(503)
    const body = (await res.json()) as { error: string }
    expect(body.error).toBe('sync_not_configured')
  })

  it('GET /api/sync/:code returns 503 sync_not_configured', async () => {
    const code = generateCode()
    const res = await readTournament(
      noKvCtx(new Request(`https://example.com/api/sync/${code}`), { code }),
    )
    expect(res.status).toBe(503)
  })

  it('PUT /api/sync/:code returns 503 sync_not_configured', async () => {
    const code = generateCode()
    const res = await writeTournament(
      noKvCtx(
        new Request(`https://example.com/api/sync/${code}`, {
          method: 'PUT',
          headers: { Authorization: 'Bearer ' + 'a'.repeat(64) },
          body: JSON.stringify({ tournament: {} }),
        }),
        { code },
      ),
    )
    expect(res.status).toBe(503)
  })

  it('DELETE /api/sync/:code returns 503 sync_not_configured', async () => {
    const code = generateCode()
    const res = await deleteTournament(
      noKvCtx(
        new Request(`https://example.com/api/sync/${code}`, {
          method: 'DELETE',
          headers: { Authorization: 'Bearer ' + 'a'.repeat(64) },
        }),
        { code },
      ),
    )
    expect(res.status).toBe(503)
  })
})

describe('POST /api/sync', () => {
  it('creates a tournament and returns code + ownerToken', async () => {
    const env = makeEnv()
    const req = new Request('https://example.com/api/sync', {
      method: 'POST',
      body: JSON.stringify({ tournament: { name: 'Test', players: [] } }),
    })
    const res = await createTournament(ctx(req, env))
    expect(res.status).toBe(201)
    const body = (await res.json()) as { code: string; ownerToken: string; version: number }
    expect(isValidCode(body.code)).toBe(true)
    expect(body.ownerToken).toMatch(/^[0-9a-f]{64}$/)
    expect(body.version).toBe(1)
  })

  it('rejects bodies without tournament', async () => {
    const env = makeEnv()
    const req = new Request('https://example.com/api/sync', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const res = await createTournament(ctx(req, env))
    expect(res.status).toBe(400)
  })

  it('rejects invalid JSON', async () => {
    const env = makeEnv()
    const req = new Request('https://example.com/api/sync', {
      method: 'POST',
      body: '{not json',
    })
    const res = await createTournament(ctx(req, env))
    expect(res.status).toBe(400)
  })
})

describe('GET /api/sync/:code', () => {
  it('returns the snapshot for a valid code', async () => {
    const env = makeEnv()
    const create = await createTournament(
      ctx(
        new Request('https://example.com/api/sync', {
          method: 'POST',
          body: JSON.stringify({ tournament: { name: 'Foo' } }),
        }),
        env,
      ),
    )
    const { code } = (await create.json()) as { code: string }

    const res = await readTournament(
      ctx(
        new Request(`https://example.com/api/sync/${code}`),
        env,
        { code },
      ),
    )
    expect(res.status).toBe(200)
    const body = (await res.json()) as {
      tournament: { name: string }
      version: number
    }
    expect(body.tournament.name).toBe('Foo')
    expect(body.version).toBe(1)
  })

  it('returns 304 when version matches `since`', async () => {
    const env = makeEnv()
    const create = await createTournament(
      ctx(
        new Request('https://example.com/api/sync', {
          method: 'POST',
          body: JSON.stringify({ tournament: {} }),
        }),
        env,
      ),
    )
    const { code } = (await create.json()) as { code: string }

    const res = await readTournament(
      ctx(
        new Request(`https://example.com/api/sync/${code}?since=1`),
        env,
        { code },
      ),
    )
    expect(res.status).toBe(304)
  })

  it('returns 404 for unknown codes', async () => {
    const env = makeEnv()
    const code = generateCode()
    const res = await readTournament(
      ctx(new Request(`https://example.com/api/sync/${code}`), env, { code }),
    )
    expect(res.status).toBe(404)
  })

  it('returns 400 for malformed codes', async () => {
    const env = makeEnv()
    const res = await readTournament(
      ctx(new Request('https://example.com/api/sync/badcode'), env, {
        code: 'lower',
      }),
    )
    expect(res.status).toBe(400)
  })
})

describe('PUT /api/sync/:code', () => {
  let env: ReturnType<typeof makeEnv>
  let code: string
  let ownerToken: string

  beforeEach(async () => {
    env = makeEnv()
    const create = await createTournament(
      ctx(
        new Request('https://example.com/api/sync', {
          method: 'POST',
          body: JSON.stringify({ tournament: { v: 0 } }),
        }),
        env,
      ),
    )
    const body = (await create.json()) as { code: string; ownerToken: string }
    code = body.code
    ownerToken = body.ownerToken
  })

  it('writes a new snapshot with the right token and bumps version', async () => {
    const res = await writeTournament(
      ctx(
        new Request(`https://example.com/api/sync/${code}`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${ownerToken}` },
          body: JSON.stringify({ tournament: { v: 1 } }),
        }),
        env,
        { code },
      ),
    )
    expect(res.status).toBe(200)
    const body = (await res.json()) as { version: number }
    expect(body.version).toBe(2)

    // Verify via GET
    const get = await readTournament(
      ctx(new Request(`https://example.com/api/sync/${code}`), env, { code }),
    )
    const stored = (await get.json()) as { tournament: { v: number }; version: number }
    expect(stored.tournament.v).toBe(1)
    expect(stored.version).toBe(2)
  })

  it('rejects without Authorization header (401)', async () => {
    const res = await writeTournament(
      ctx(
        new Request(`https://example.com/api/sync/${code}`, {
          method: 'PUT',
          body: JSON.stringify({ tournament: {} }),
        }),
        env,
        { code },
      ),
    )
    expect(res.status).toBe(401)
  })

  it('rejects with wrong token (403)', async () => {
    const res = await writeTournament(
      ctx(
        new Request(`https://example.com/api/sync/${code}`, {
          method: 'PUT',
          headers: { Authorization: 'Bearer ' + 'a'.repeat(64) },
          body: JSON.stringify({ tournament: {} }),
        }),
        env,
        { code },
      ),
    )
    expect(res.status).toBe(403)
  })

  it('returns 409 on baseVersion mismatch', async () => {
    const res = await writeTournament(
      ctx(
        new Request(`https://example.com/api/sync/${code}`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${ownerToken}` },
          body: JSON.stringify({ tournament: {}, baseVersion: 999 }),
        }),
        env,
        { code },
      ),
    )
    expect(res.status).toBe(409)
  })
})

describe('corrupt KV data', () => {
  // Regression: an unguarded JSON.parse on the stored blob would throw and
  // bubble up to the worker as a generic 500. Handlers now return a clear
  // corrupt_data error instead.
  function envWithCorrupt(value: string) {
    const kv = new MemKV()
    void kv.put('ABCDEF', value)
    return { TOURNAMENTS: kv as unknown as KVNamespace }
  }

  it('GET returns 500 corrupt_data on unparseable JSON', async () => {
    const env = envWithCorrupt('not json{')
    const res = await readTournament(
      ctx(new Request('https://example.com/api/sync/ABCDEF'), env, {
        code: 'ABCDEF',
      }),
    )
    expect(res.status).toBe(500)
    const body = (await res.json()) as { error: string }
    expect(body.error).toBe('corrupt_data')
  })

  it('GET returns 500 corrupt_data on JSON missing required fields', async () => {
    const env = envWithCorrupt(JSON.stringify({ unrelated: true }))
    const res = await readTournament(
      ctx(new Request('https://example.com/api/sync/ABCDEF'), env, {
        code: 'ABCDEF',
      }),
    )
    expect(res.status).toBe(500)
  })

  it('GET returns 500 corrupt_data when ownerTokenHash is not 64 hex', async () => {
    const env = envWithCorrupt(
      JSON.stringify({
        tournament: { name: 'x' },
        version: 1,
        ownerTokenHash: 'short',
        updatedAt: new Date().toISOString(),
      }),
    )
    const res = await readTournament(
      ctx(new Request('https://example.com/api/sync/ABCDEF'), env, {
        code: 'ABCDEF',
      }),
    )
    expect(res.status).toBe(500)
    const body = (await res.json()) as { error: string }
    expect(body.error).toBe('corrupt_data')
  })

  it('GET returns 500 corrupt_data when tournament field is missing', async () => {
    const env = envWithCorrupt(
      JSON.stringify({
        version: 1,
        ownerTokenHash: 'a'.repeat(64),
        updatedAt: new Date().toISOString(),
      }),
    )
    const res = await readTournament(
      ctx(new Request('https://example.com/api/sync/ABCDEF'), env, {
        code: 'ABCDEF',
      }),
    )
    expect(res.status).toBe(500)
  })

  it('PUT returns 500 corrupt_data on unparseable blob', async () => {
    const env = envWithCorrupt('not json{')
    const res = await writeTournament(
      ctx(
        new Request('https://example.com/api/sync/ABCDEF', {
          method: 'PUT',
          headers: { Authorization: 'Bearer ' + 'a'.repeat(64) },
          body: JSON.stringify({ tournament: {} }),
        }),
        env,
        { code: 'ABCDEF' },
      ),
    )
    expect(res.status).toBe(500)
    const body = (await res.json()) as { error: string }
    expect(body.error).toBe('corrupt_data')
  })

  it('DELETE returns 500 corrupt_data on unparseable blob', async () => {
    const env = envWithCorrupt('not json{')
    const res = await deleteTournament(
      ctx(
        new Request('https://example.com/api/sync/ABCDEF', {
          method: 'DELETE',
          headers: { Authorization: 'Bearer ' + 'a'.repeat(64) },
        }),
        env,
        { code: 'ABCDEF' },
      ),
    )
    expect(res.status).toBe(500)
    const body = (await res.json()) as { error: string }
    expect(body.error).toBe('corrupt_data')
  })
})

describe('DELETE /api/sync/:code', () => {
  it('deletes when authorised', async () => {
    const env = makeEnv()
    const create = await createTournament(
      ctx(
        new Request('https://example.com/api/sync', {
          method: 'POST',
          body: JSON.stringify({ tournament: {} }),
        }),
        env,
      ),
    )
    const { code, ownerToken } = (await create.json()) as {
      code: string
      ownerToken: string
    }
    const res = await deleteTournament(
      ctx(
        new Request(`https://example.com/api/sync/${code}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${ownerToken}` },
        }),
        env,
        { code },
      ),
    )
    expect(res.status).toBe(204)
    const get = await readTournament(
      ctx(new Request(`https://example.com/api/sync/${code}`), env, { code }),
    )
    expect(get.status).toBe(404)
  })

  it('rejects with wrong token', async () => {
    const env = makeEnv()
    const create = await createTournament(
      ctx(
        new Request('https://example.com/api/sync', {
          method: 'POST',
          body: JSON.stringify({ tournament: {} }),
        }),
        env,
      ),
    )
    const { code } = (await create.json()) as { code: string }
    const res = await deleteTournament(
      ctx(
        new Request(`https://example.com/api/sync/${code}`, {
          method: 'DELETE',
          headers: { Authorization: 'Bearer ' + 'b'.repeat(64) },
        }),
        env,
        { code },
      ),
    )
    expect(res.status).toBe(403)
  })
})
