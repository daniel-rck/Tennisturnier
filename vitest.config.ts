import { defineConfig } from "vitest/config";

// A separate config, not a `test:` block inside vite.config.ts: running tests
// through the app's Vite config drags the React, Tailwind and PWA plugins into
// every run for no benefit. Every test here is pure logic, so the environment
// stays `node`; add jsdom (and testing-library) when the first component test
// actually needs a DOM.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/__tests__/**/*.test.ts", "functions/**/*.test.ts"],
    exclude: ["node_modules", "dist", "dev-dist"],
  },
});
