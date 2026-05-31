import type { ReactNode } from "react";

export interface PodiumEntry {
  name: string;
  subtitle?: string;
  hidden?: boolean;
}

interface Props {
  /** Position-ordered: [0] = first, [1] = second, [2] = third. */
  entries: PodiumEntry[];
  /** Bigger for reveal stage */
  size?: "compact" | "stage";
}

type Place = 1 | 2 | 3;

const ICONS: Record<Place, string> = {
  1: "🥇",
  2: "🥈",
  3: "🥉",
};

const TONES: Record<Place, string> = {
  // gold-soft is a fixed light medal tone in both themes, so pin dark text on it
  // (otherwise the rank number inherits the light fg token in dark mode).
  1: "bg-gold-soft border-gold text-[#1a1a1a]",
  2: "bg-surface-sunken border-silver",
  3: "bg-clay-soft border-bronze",
};

const HEIGHTS_COMPACT: Record<Place, string> = {
  1: "h-24",
  2: "h-18",
  3: "h-14",
};

const HEIGHTS_STAGE: Record<Place, string> = {
  1: "h-48",
  2: "h-36",
  3: "h-28",
};

export function Podium({ entries, size = "compact" }: Props) {
  // Visual layout: 2nd left, 1st center, 3rd right.
  const heights = size === "stage" ? HEIGHTS_STAGE : HEIGHTS_COMPACT;
  return (
    <div className="grid grid-cols-3 gap-2 items-end">
      <PodiumColumn place={2} entry={entries[1]} heightClass={heights[2]} size={size} />
      <PodiumColumn place={1} entry={entries[0]} heightClass={heights[1]} size={size} />
      <PodiumColumn place={3} entry={entries[2]} heightClass={heights[3]} size={size} />
    </div>
  );
}

function PodiumColumn({
  place,
  entry,
  heightClass,
  size,
}: {
  place: Place;
  entry: PodiumEntry | undefined;
  heightClass: string;
  size: "compact" | "stage";
}) {
  const showHidden = !entry || entry.hidden === true;
  const isGold = place === 1;

  const nameClass =
    size === "stage"
      ? "serif text-2xl sm:text-4xl font-semibold"
      : "serif text-base sm:text-lg font-semibold";

  return (
    <div className="flex flex-col items-center gap-2 text-center min-w-0">
      <div
        className={[
          "text-3xl sm:text-5xl",
          showHidden ? "opacity-30 grayscale" : "",
          isGold && !showHidden && size === "stage" ? "animate-gold-glow rounded-full" : "",
        ].join(" ")}
        aria-hidden
      >
        {ICONS[place]}
      </div>
      <Field hidden={showHidden}>
        <div className={`${nameClass} truncate max-w-full`} title={entry?.name}>
          {entry?.name ?? "—"}
        </div>
        {entry?.subtitle && !showHidden && (
          <div className="text-xs sm:text-sm text-fg-muted tabular mt-0.5">{entry.subtitle}</div>
        )}
      </Field>
      <div
        className={[
          "w-full rounded-t-card border-t-4 flex items-center justify-center serif font-bold",
          TONES[place],
          heightClass,
          size === "stage" ? "text-4xl sm:text-6xl" : "text-2xl sm:text-3xl",
        ].join(" ")}
      >
        {place}
      </div>
    </div>
  );
}

function Field({ hidden, children }: { hidden: boolean; children: ReactNode }) {
  if (hidden) {
    return (
      <div className="space-y-1">
        <div className="h-6 w-16 sm:w-24 rounded bg-surface-sunken mx-auto" />
      </div>
    );
  }
  return <div className="space-y-0.5 min-w-0">{children}</div>;
}
