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
