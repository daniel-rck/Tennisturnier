import { createBrowserRouter } from "react-router-dom";
import App from "../App.tsx";
import { ROUTES } from "./routes.ts";
import { NotFound } from "./routing/NotFound.tsx";
import { RouteError } from "./routing/RouteError.tsx";
import { RouteFallback } from "./routing/RouteFallback.tsx";

/** Route `handle` of the three phase routes; <App/> reads it via useMatches(). */
export type PhaseHandle = { phase: "prep" | "live" | "results" };

// The root layout route: <App/> owns the AppShell and all tournament state,
// and derives the active phase from the matched child route's handle. The
// phase routes therefore render nothing themselves; only the `*` route renders
// into <App/>'s <Outlet/>, inside the shell.
export const router = createBrowserRouter([
  {
    path: ROUTES.setup,
    Component: App,
    ErrorBoundary: RouteError,
    HydrateFallback: RouteFallback,
    children: [
      { index: true, handle: { phase: "prep" } satisfies PhaseHandle },
      { path: ROUTES.live.slice(1), handle: { phase: "live" } satisfies PhaseHandle },
      { path: ROUTES.results.slice(1), handle: { phase: "results" } satisfies PhaseHandle },
      { path: "*", Component: NotFound },
    ],
  },
]);
