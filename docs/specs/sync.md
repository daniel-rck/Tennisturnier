# Sync — deviation from the web-base `sync` template

**Status:** intentional deviation. Documented per the web-base convention
(`07-conventions.md`, "Architecture invariants #6": app-specific decisions live
in the app's `docs/specs/`).

## What web-base ships

The web-base `sync` template is an **R2 + KV, end-to-end-encrypted** sync layer
(the Hausverwaltung reference implementation). The server stores only
ciphertext; clients hold the key.

## What Tennisturnier uses instead

Tennisturnier keeps its **simpler, KV-only** share-code sync:

- A 6-character share code identifies a tournament snapshot in Cloudflare KV
  (binding `TOURNAMENTS`).
- An owner token (bearer) authorizes writes/deletes; readers only need the code.
- Endpoints live under `functions/api/sync/*` and are routed by
  `worker/index.ts`. Shared helpers (code/token generation, constant-time
  compare, KV access) live in `functions/_shared/kv.ts`.
- The payload is the tournament JSON, **not** end-to-end encrypted.

## Why (Decision)

Per the migration spec (`web-base/docs/specs/08-app-migrations.md`,
*Tennisturnier* PR 5), this is **option (b): keep the simpler protocol**.

- Tournament data is **opt-in shared** via a code the owner hands out
  deliberately; it is not privacy-sensitive personal data in the way
  Hausverwaltung's is.
- The existing share-code mechanism already fits the product (read-only viewers
  join by code/QR; one owner edits).
- Adopting the full R2 + E2E template would be overkill for this data and would
  add key-management UX the feature doesn't need.

## Alignment that *was* applied

Phase 5 of the migration only aligned tooling, not the protocol:

- `tsconfig.worker.json` (web-base `worker` template shape) now type-checks
  both `worker/` and `functions/` and is part of the root `tsc -b` references,
  so CI's `typecheck` covers the worker.
- `wrangler.toml` `compatibility_date` refreshed; the `TOURNAMENTS` KV binding
  is unchanged.

## Revisit when

If tournament sync ever needs to carry private data, or multi-device editing
with conflict resolution, reconsider adopting the web-base `sync` template
(`bunx github:daniel-rck/web-base add sync`).
