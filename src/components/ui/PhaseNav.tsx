import type { ReactNode } from "react";

export type PhaseId = "prep" | "live" | "results";

interface Phase {
  id: PhaseId;
  label: string;
  icon: ReactNode;
}

interface Props {
  current: PhaseId;
  onChange: (p: PhaseId) => void;
  phases: Phase[];
  /** Show as top tabs (desktop) or bottom nav (mobile) */
  variant: "top" | "bottom";
}

export function PhaseNav({ current, onChange, phases, variant }: Props) {
  if (variant === "bottom") {
    return (
      <nav
        className="no-print fixed bottom-0 left-0 right-0 z-20 border-t border-border bg-surface/95 backdrop-blur-md sm:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Turnierphasen"
      >
        <div className="grid grid-cols-3">
          {phases.map((p) => {
            const active = p.id === current;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onChange(p.id)}
                aria-current={active ? "page" : undefined}
                className={[
                  "flex flex-col items-center justify-center gap-0.5 py-2 min-h-[60px] transition-colors",
                  active ? "text-brand" : "text-fg-muted active:bg-surface-sunken",
                ].join(" ")}
              >
                <span className={`text-xl ${active ? "" : "opacity-70"}`} aria-hidden>
                  {p.icon}
                </span>
                <span className={`text-[11px] font-medium ${active ? "text-fg" : ""}`}>
                  {p.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    );
  }
  return (
    <nav
      className="no-print hidden sm:flex items-center gap-1 rounded-full bg-court-deep/40 p-1 border border-white/10"
      aria-label="Turnierphasen"
    >
      {phases.map((p) => {
        const active = p.id === current;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onChange(p.id)}
            aria-current={active ? "page" : undefined}
            className={[
              "inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-cream text-court shadow-sm"
                : "text-cream/80 hover:text-cream hover:bg-white/5",
            ].join(" ")}
          >
            <span aria-hidden>{p.icon}</span>
            {p.label}
          </button>
        );
      })}
    </nav>
  );
}

interface SubNavProps {
  current: string;
  onChange: (id: string) => void;
  tabs: { id: string; label: string }[];
}

export function SubNav({ current, onChange, tabs }: SubNavProps) {
  if (tabs.length <= 1) return null;
  return (
    <div
      role="tablist"
      className="no-print flex gap-1 overflow-x-auto -mx-4 px-4 py-2 scrollbar-hide"
    >
      {tabs.map((t) => {
        const active = t.id === current;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.id)}
            className={[
              "whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors min-h-[36px]",
              active
                ? "bg-brand text-white"
                : "bg-surface-sunken text-fg-muted hover:bg-surface-muted hover:text-fg",
            ].join(" ")}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
