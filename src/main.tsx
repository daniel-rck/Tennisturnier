import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { Toaster } from "./components/Toaster";
import { ConfirmProvider } from "./hooks/useConfirm";
import { ToastProvider } from "./hooks/useToast";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ToastProvider>
      <ConfirmProvider>
        <App />
        <Toaster />
        <ConfirmDialog />
      </ConfirmProvider>
    </ToastProvider>
  </StrictMode>,
);
