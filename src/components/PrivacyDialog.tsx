import { useEffect, useRef } from "react";
import { useTranslation } from "../i18n";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function PrivacyDialog({ open, onClose }: Props) {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) {
      el.showModal();
      window.requestAnimationFrame(() => closeBtnRef.current?.focus());
    } else if (!open && el.open) {
      el.close();
    }
  }, [open]);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    const onCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    el.addEventListener("cancel", onCancel);
    return () => el.removeEventListener("cancel", onCancel);
  }, [onClose]);

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: backdrop click-to-dismiss on a native <dialog>; keyboard dismissal is handled by the browser's built-in Escape -> cancel event (see onCancel listener above).
    <dialog
      ref={dialogRef}
      aria-labelledby="privacy-title"
      className="no-print fixed inset-0 m-auto h-fit max-h-[calc(100%-2rem)] rounded-lg border border-border bg-surface text-fg p-0 shadow-xl backdrop:bg-black/40 backdrop:backdrop-blur-sm w-[min(36rem,calc(100%-2rem))] open:animate-scale-fade-in"
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
    >
      <div className="px-5 py-4 max-h-[80vh] overflow-y-auto">
        <h2 id="privacy-title" className="text-base font-semibold text-fg">
          {t("privacy.title")}
        </h2>
        <div className="text-sm text-fg-muted mt-3 space-y-3 leading-relaxed">
          <p>{t("privacy.intro")}</p>

          <h3 className="font-semibold text-fg mt-4">{t("privacy.h.local")}</h3>
          <p>{t("privacy.p.local")}</p>

          <h3 className="font-semibold text-fg mt-4">{t("privacy.h.sync")}</h3>
          <p>{t("privacy.p.sync")}</p>
          <ul className="list-disc list-inside space-y-1">
            <li>{t("privacy.li.sync1")}</li>
            <li>{t("privacy.li.sync2")}</li>
            <li>{t("privacy.li.sync3")}</li>
            <li>{t("privacy.li.sync4")}</li>
          </ul>

          <h3 className="font-semibold text-fg mt-4">{t("privacy.h.hosting")}</h3>
          <p>{t("privacy.p.hosting")}</p>

          <h3 className="font-semibold text-fg mt-4">{t("privacy.h.external")}</h3>
          <p>{t("privacy.p.external")}</p>

          <h3 className="font-semibold text-fg mt-4">{t("privacy.h.pwa")}</h3>
          <p>{t("privacy.p.pwa")}</p>

          <h3 className="font-semibold text-fg mt-4">{t("privacy.h.rights")}</h3>
          <p>{t("privacy.p.rights")}</p>

          <h3 className="font-semibold text-fg mt-4">{t("privacy.h.contact")}</h3>
          <p>
            {(() => {
              const tpl = t("privacy.p.contact");
              const [before, after = ""] = tpl.split("{email}");
              return (
                <>
                  {before}
                  <a href="mailto:daniel-rck@proton.me" className="underline hover:text-fg">
                    daniel-rck@proton.me
                  </a>
                  {after}
                </>
              );
            })()}
          </p>
        </div>
        <div className="mt-5 flex justify-end">
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            className="rounded-md bg-brand text-white px-3 py-1.5 text-sm font-medium hover:bg-brand-hover"
          >
            {t("common.close")}
          </button>
        </div>
      </div>
    </dialog>
  );
}
