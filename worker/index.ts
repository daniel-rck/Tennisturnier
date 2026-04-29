/// <reference types="@cloudflare/workers-types" />
import { onRequestPost as createSync } from '../functions/api/sync/index'
import {
  onRequestGet as readSync,
  onRequestPut as writeSync,
  onRequestDelete as deleteSync,
} from '../functions/api/sync/[code]'
import type { SyncEnv } from '../functions/_shared/kv'

interface Env extends SyncEnv {
  ASSETS: Fetcher
}

const CODE_ROUTE = /^\/api\/sync\/([^/]+)$/

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname === '/api/sync' || CODE_ROUTE.test(url.pathname)) {
      try {
        return await routeSync(request, env, ctx, url)
      } catch (err) {
        // Last-resort guard: anything thrown by a sync handler becomes a JSON
        // 500 instead of an opaque Cloudflare error page, so the client can
        // surface a useful message.
        const message = err instanceof Error ? err.message : String(err)
        return new Response(
          JSON.stringify({ error: 'sync_internal_error', message }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-store',
            },
          },
        )
      }
    }

    // Everything else: static SPA from the [assets] binding.
    return env.ASSETS.fetch(request)
  },
}

async function routeSync(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  url: URL,
): Promise<Response> {
  if (url.pathname === '/api/sync') {
    if (request.method === 'POST') {
      return createSync(makeCtx(request, env, ctx, {} as never))
    }
    return methodNotAllowed(['POST'])
  }

  // The outer fetch guard guarantees the path matches CODE_ROUTE here; if it
  // ever doesn't, surface that as a diagnostic 500 via the catch in fetch()
  // rather than silently 404'ing.
  const m = CODE_ROUTE.exec(url.pathname)
  if (!m) throw new Error(`routeSync: unexpected path ${url.pathname}`)

  const params = { code: m[1] } as { code: string }
  const fnCtx = makeCtx(request, env, ctx, params)
  switch (request.method) {
    case 'GET':
      return readSync(fnCtx)
    case 'PUT':
      return writeSync(fnCtx)
    case 'DELETE':
      return deleteSync(fnCtx)
    default:
      return methodNotAllowed(['GET', 'PUT', 'DELETE'])
  }
}

// Bridges the Pages-Functions context shape (used by handlers under functions/)
// to the Workers fetch handler arguments.
function makeCtx<P extends Record<string, string>>(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  params: P,
): EventContext<Env, keyof P & string, Record<string, unknown>> {
  return {
    request,
    env,
    params,
    waitUntil: ctx.waitUntil.bind(ctx),
    passThroughOnException: ctx.passThroughOnException.bind(ctx),
    next: async () =>
      new Response('Not Found', { status: 404 }),
    data: {},
    functionPath: new URL(request.url).pathname,
  } as unknown as EventContext<Env, keyof P & string, Record<string, unknown>>
}

function methodNotAllowed(allow: string[]): Response {
  return new Response('Method Not Allowed', {
    status: 405,
    headers: { Allow: allow.join(', ') },
  })
}
