import { Component, type ErrorInfo, type ReactNode } from "react";
import { useTranslation } from "../i18n";
import { Button } from "../lib/ui";

/**
 * Last-resort boundary around the whole app: without it, any render error
 * leaves a blank page — fatal with persisted state, since every reload would
 * crash the same way without offering a way out.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Uncaught render error:", error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.hasError) return <ErrorFallback />;
    return this.props.children;
  }
}

// Function component so the fallback can use the translation hook (useLocale
// is a module-level store, no provider required).
function ErrorFallback() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-muted text-court p-6">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-xl font-semibold">{t("errorBoundary.title")}</h1>
        <p className="text-sm text-fg-muted">{t("errorBoundary.description")}</p>
        <Button onClick={() => window.location.reload()}>{t("errorBoundary.reload")}</Button>
      </div>
    </div>
  );
}
