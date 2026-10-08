/// <reference lib="webworker" />
import { registerRoute } from "workbox-routing";
import { NetworkOnly } from "workbox-strategies";
import { registerAppShell } from "./base.ts";

// Precache, offline navigation (never for /api) and prompt-based updates
// (owned: base.ts). The page posts SKIP_WAITING when the user accepts the
// update in src/components/UpdatePrompt.tsx.
registerAppShell();

// Live-sync API: network only, never cached — a viewer must never be shown a
// stale tournament snapshot from the cache.
registerRoute(({ url }) => url.pathname.startsWith("/api/"), new NetworkOnly());
