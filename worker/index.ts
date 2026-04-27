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

    if (url.pathname === '/api/sync') {
      if (request.method === 'POST') {
        return createSync(makeCtx(request, env, ctx, {} as never))
      }
      return methodNotAllowed(['POST'])
    }

    const m = CODE_ROUTE.exec(url.pathname)
    if (m) {
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

    // Everything else: static SPA from the [assets] binding.
    return env.ASSETS.fetch(request)
  },
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
