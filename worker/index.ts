/// <reference types="@cloudflare/workers-types" />

import type { SyncEnv } from "../functions/_shared/kv.ts";
import {
  onRequestDelete as deleteSync,
  onRequestGet as readSync,
  onRequestPut as writeSync,
} from "../functions/api/sync/[code].ts";
import { onRequestPost as createSync } from "../functions/api/sync/index.ts";
import { json, routeRequest } from "./base.ts";

// `TOURNAMENTS` (KV) comes from SyncEnv — the binding name is hard-wired in
// functions/_shared/kv.ts and wrangler.toml; never rename it.
export interface Env extends SyncEnv {
  ASSETS: Fetcher;
}

const CODE_ROUTE = /^\/api\/sync\/([^/]+)$/;

// /healthz, the /api error boundary (a throw becomes a logged 500
// `{ error: "internal" }`), stale-asset 404s and the SPA fallback live in the
// owned worker/base.ts.
export default {
  fetch: (request, env, ctx) => routeRequest(request, env, ctx, handleApi),
} satisfies ExportedHandler<Env>;

/** Everything under `/api`: the KV share-code sync (docs/specs/sync.md). */
async function handleApi(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const { pathname } = new URL(request.url);

  if (pathname === "/api/sync") {
    if (request.method === "POST") {
      return createSync(makeCtx(request, env, ctx, {} as never));
    }
    return methodNotAllowed(["POST"]);
  }

  const m = CODE_ROUTE.exec(pathname);
  if (!m) return json({ error: "not_found" }, 404);

  const params = { code: m[1] } as { code: string };
  const fnCtx = makeCtx(request, env, ctx, params);
  switch (request.method) {
    case "GET":
      return readSync(fnCtx);
    case "PUT":
      return writeSync(fnCtx);
    case "DELETE":
      return deleteSync(fnCtx);
    default:
      return methodNotAllowed(["GET", "PUT", "DELETE"]);
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
    next: async () => new Response("Not Found", { status: 404 }),
    data: {},
    functionPath: new URL(request.url).pathname,
  } as unknown as EventContext<Env, keyof P & string, Record<string, unknown>>;
}

function methodNotAllowed(allow: string[]): Response {
  return new Response("Method Not Allowed", {
    status: 405,
    headers: { Allow: allow.join(", ") },
  });
}
