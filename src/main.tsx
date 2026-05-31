import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import "./index.css";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { Toaster } from "./components/Toaster";
import { ConfirmProvider } from "./hooks/useConfirm";
import { ToastProvider } from "./hooks/useToast";
import { router } from "./lib/router.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ToastProvider>
      <ConfirmProvider>
        <RouterProvider router={router} />
        <Toaster />
        <ConfirmDialog />
      </ConfirmProvider>
    </ToastProvider>
  </StrictMode>,
);
