import { useRegisterSW } from "virtual:pwa-register/react";
import { useTranslation } from "../i18n";

export function UpdatePrompt() {
  const { t } = useTranslation();
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(err) {
      console.error("SW register error", err);
    },
  });

  if (!needRefresh) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="no-print fixed bottom-4 right-4 z-40 max-w-sm w-[calc(100%-2rem)] rounded-md border border-border bg-surface text-fg shadow-lg px-4 py-3 animate-slide-in-right"
    >
      <p className="text-sm font-medium">{t("update.title")}</p>
      <p className="text-xs text-fg-muted mt-0.5">{t("update.description")}</p>
      <div className="mt-3 flex gap-2 justify-end">
        <button
          type="button"
          onClick={() => setNeedRefresh(false)}
          className="rounded-md border border-border-strong px-3 py-1 text-xs hover:border-fg-muted"
        >
          {t("update.later")}
        </button>
        <button
          type="button"
          onClick={() => updateServiceWorker(true)}
          className="rounded-md bg-brand text-white px-3 py-1 text-xs font-medium hover:bg-brand-hover"
        >
          {t("update.reload")}
        </button>
      </div>
    </div>
  );
}
