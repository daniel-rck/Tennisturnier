import { defineConfig } from "vitest/config";

// A separate config, not a `test:` block inside vite.config.ts: running tests
// through the app's Vite config drags the React, Tailwind and PWA plugins into
// every run for no benefit — the app's tests are pure logic. jsdom plus the
// owned web-base setup (fake-indexeddb, jest-dom, matchMedia stub) is the
// shared test environment; the worker's handler tests run in it too, since
// Node's own fetch globals (Request, Response) stay available.
export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}", "functions/**/*.test.ts"],
    exclude: ["node_modules", "dist", "dev-dist"],
    restoreMocks: true,
  },
});
