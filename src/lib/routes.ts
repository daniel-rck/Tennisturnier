export const ROUTES = {
  setup: "/",
  live: "/live",
  results: "/ergebnis",
} as const;

export type RouteKey = keyof typeof ROUTES;
