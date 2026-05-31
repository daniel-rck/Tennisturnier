interface Props {
  /** 0..max */
  value: number;
  max: number;
  label?: string;
  /** Color tone of the filled portion */
  tone?: "brand" | "gold" | "clay" | "silver";
  /** Show numeric value at the end */
  showValue?: boolean;
}

const TONES = {
  brand: "bg-brand",
  gold: "bg-gold",
  clay: "bg-clay",
  silver: "bg-silver",
};

export function StatBar({ value, max, label, tone = "brand", showValue = true }: Props) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div className="space-y-0.5">
      {label && (
        <div className="flex items-baseline justify-between text-xs">
          <span className="text-fg-muted">{label}</span>
          {showValue && <span className="font-medium tabular text-fg">{value}</span>}
        </div>
      )}
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemax={max}
        aria-valuemin={0}
      >
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${TONES[tone]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
