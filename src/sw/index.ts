/// <reference lib="webworker" />
import { ExpirationPlugin } from "workbox-expiration";
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from "workbox-precaching";
import { NavigationRoute, registerRoute } from "workbox-routing";
import { CacheFirst, NetworkOnly } from "workbox-strategies";

declare const self: ServiceWorkerGlobalScope;

// Precache the build assets injected at build time by vite-plugin-pwa
// (injectManifest strategy).
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// SPA navigation fallback to index.html — but never for the live-sync API,
// which must always reach the network (no cached snapshots).
registerRoute(
  new NavigationRoute(createHandlerBoundToURL("index.html"), {
    denylist: [/^\/api\//],
  }),
);

// Live-sync API: network only, never cached.
registerRoute(({ url }) => url.pathname.startsWith("/api/"), new NetworkOnly());

// Google Fonts: cache-first, long-lived.
registerRoute(
  /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/,
  new CacheFirst({
    cacheName: "google-fonts",
    plugins: [new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 })],
  }),
);

// Update flow is prompt-based (registerType: "prompt"): the page asks the user
// and posts SKIP_WAITING on accept. So we deliberately do NOT skipWaiting on
// install — the new worker waits until the user confirms.
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
