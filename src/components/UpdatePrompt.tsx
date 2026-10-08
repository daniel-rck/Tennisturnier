import { useTranslation } from "../i18n";
import { useAppUpdate } from "../lib/pwa/useAppUpdate.ts";

/**
 * The app's translated update toast over web-base's `useAppUpdate()` (prompt
 * registration plus an hourly update check). A new service worker waits until
 * the user taps reload — see src/sw/base.ts. The status region stays mounted
 * so screen readers announce the message when it appears; it sits above the
 * mobile bottom nav.
 */
export function UpdatePrompt() {
  const { t } = useTranslation();
  const { needRefresh, reload, dismiss } = useAppUpdate();

  return (
    <div
      role="status"
      aria-live="polite"
      className="no-print pointer-events-none fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 flex justify-center px-4 md:inset-x-auto md:right-4 md:bottom-4"
    >
      {needRefresh ? (
        <div className="pointer-events-auto max-w-sm w-full rounded-md border border-border bg-surface text-fg shadow-lg px-4 py-3 animate-slide-in-right">
          <p className="text-sm font-medium">{t("update.title")}</p>
          <p className="text-xs text-fg-muted mt-0.5">{t("update.description")}</p>
          <div className="mt-3 flex gap-2 justify-end">
            <button
              type="button"
              onClick={dismiss}
              className="rounded-md border border-border-strong px-3 py-1 text-xs hover:border-fg-muted"
            >
              {t("update.later")}
            </button>
            <button
              type="button"
              onClick={reload}
              className="rounded-md bg-brand text-fg-on-accent px-3 py-1 text-xs font-medium hover:bg-brand-hover"
            >
              {t("update.reload")}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
