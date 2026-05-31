import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "../App.tsx";
import { ROUTES } from "./routes.ts";

// All three phase routes render the same stateful <App/>, which derives the
// active phase from the URL. Keeps the app's adaptive phase/sub-tab logic in
// one place while making the phase navigation route-driven (for <AppShell>).
export const router = createBrowserRouter([
  { path: ROUTES.setup, element: <App /> },
  { path: ROUTES.live, element: <App /> },
  { path: ROUTES.results, element: <App /> },
  { path: "*", element: <Navigate to={ROUTES.setup} replace /> },
]);
