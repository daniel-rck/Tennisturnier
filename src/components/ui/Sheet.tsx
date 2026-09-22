import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useId, useRef } from "react";
import { useTranslation } from "../../i18n";

interface Props {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  /** Bottom-sheet on mobile, center-modal on desktop (default). */
  variant?: "bottom" | "center";
  /** Optional max-width for desktop, default 480px. */
  maxWidth?: number;
}

export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  variant = "bottom",
  maxWidth = 480,
}: Props) {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDialogElement>(null);
  // Every MatchCard mounts its own sheet — a fixed id would be duplicated.
  const titleId = useId();

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    // oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions -- backdrop click-to-dismiss on a native <dialog>; Escape is handled by the dialog's native cancel -> close, which fires onClose.
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className={[
        "p-0 bg-transparent backdrop:bg-black/40 backdrop:backdrop-blur-sm",
        "fixed inset-0 m-0 w-full h-full max-w-full max-h-full",
        "overflow-visible",
      ].join(" ")}
      aria-labelledby={title ? titleId : undefined}
    >
      <div
        className={[
          "bg-surface text-fg shadow-elevated animate-slide-up overflow-y-auto",
          variant === "bottom"
            ? "absolute left-0 right-0 bottom-0 max-h-[90vh] rounded-t-card sm:left-1/2 sm:right-auto sm:bottom-auto sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[480px] sm:max-w-[calc(100vw-2rem)] sm:max-h-[85vh] sm:rounded-card"
            : "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100vw-2rem)] max-w-md max-h-[85vh] rounded-card",
        ].join(" ")}
        style={variant === "bottom" ? { paddingBottom: "env(safe-area-inset-bottom)" } : undefined}
      >
        {variant === "bottom" && (
          <div className="flex justify-center pt-2 pb-1 sm:hidden">
            <span className="h-1 w-10 rounded-full bg-border-strong" aria-hidden />
          </div>
        )}
        <div
          className={[
            "flex items-start gap-2 pl-5 pr-2",
            title || description ? "pt-3 pb-3 border-b border-border" : "pt-2",
          ].join(" ")}
        >
          <div className="flex-1 min-w-0 pt-1">
            {title && (
              <h2 id={titleId} className="text-lg font-semibold">
                {title}
              </h2>
            )}
            {description && <p className="text-sm text-fg-muted mt-1">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("common.close")}
            className="shrink-0 inline-flex h-11 w-11 items-center justify-center rounded-md text-fg-muted hover:bg-surface-sunken hover:text-fg"
          >
            <X size={20} aria-hidden />
          </button>
        </div>
        <div
          className={variant === "center" ? "px-5 py-4" : "px-5 py-4"}
          style={variant === "center" ? { maxWidth } : undefined}
        >
          {children}
        </div>
      </div>
    </dialog>
  );
}
