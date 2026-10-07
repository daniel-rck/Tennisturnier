import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import "./index.css";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Toaster } from "./components/Toaster";
import { UpdatePrompt } from "./components/UpdatePrompt";
import { ConfirmProvider } from "./hooks/useConfirm";
import { ToastProvider } from "./hooks/useToast";
import { router } from "./lib/router.tsx";

const root = document.getElementById("root");
if (!root) throw new Error("index.html has no #root element");

// The shell is the router's root layout route (src/App.tsx), so nothing wraps
// <RouterProvider> in an AppShell. UpdatePrompt is the app's translated UI over
// web-base's useAppUpdate() — the base's German <UpdatePrompt /> isn't mounted.
createRoot(root).render(
  <StrictMode>
    <ToastProvider>
      <ConfirmProvider>
        <ErrorBoundary>
          <RouterProvider router={router} />
        </ErrorBoundary>
        <UpdatePrompt />
        <Toaster />
        <ConfirmDialog />
      </ConfirmProvider>
    </ToastProvider>
  </StrictMode>,
);
