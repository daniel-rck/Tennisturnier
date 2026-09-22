import { useState } from "react";
import { useTranslation } from "../i18n";
import { Button, Sheet } from "./ui";

interface Props {
  open: boolean;
  onClose: () => void;
  teamAName: string;
  teamBName: string;
  scoreA: number | undefined;
  scoreB: number | undefined;
  onChange: (a: number | undefined, b: number | undefined) => void;
}

type Side = "A" | "B";

const MAX_SCORE = 99;

export function ScoreSheet({
  open,
  onClose,
  teamAName,
  teamBName,
  scoreA,
  scoreB,
  onChange,
}: Props) {
  const { t } = useTranslation();
  const [draftA, setDraftA] = useState<number | undefined>(scoreA);
  const [draftB, setDraftB] = useState<number | undefined>(scoreB);
  // Keypad target. Right after opening, a digit fills A and hands over to B
  // (fast "6", "3" entry). Once a side is picked explicitly, digits append to
  // it, so two-digit scores like a 10:8 match tiebreak are possible.
  const [active, setActive] = useState<Side>("A");
  const [autoAdvance, setAutoAdvance] = useState(true);
  // The next digit replaces the value instead of appending to it.
  const [fresh, setFresh] = useState(true);

  // Re-seed from the stored score each time the sheet opens.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setDraftA(scoreA);
      setDraftB(scoreB);
      setActive("A");
      setAutoAdvance(true);
      setFresh(true);
    }
  }

  const commit = (a: number | undefined, b: number | undefined) => {
    setDraftA(a);
    setDraftB(b);
    onChange(a, b);
  };

  const setSide = (side: Side, n: number | undefined) =>
    side === "A" ? commit(n, draftB) : commit(draftA, n);

  const select = (side: Side) => {
    setActive(side);
    setAutoAdvance(false);
    setFresh(true);
  };

  const onDigit = (d: number) => {
    const cur = active === "A" ? draftA : draftB;
    const next = fresh || cur === undefined || cur === 0 || cur >= 10 ? d : cur * 10 + d;
    setSide(active, Math.min(MAX_SCORE, next));
    if (autoAdvance && active === "A") {
      setActive("B");
      setFresh(true);
    } else {
      setFresh(false);
    }
  };

  const onBackspace = () => {
    setFresh(false);
    const cur = active === "A" ? draftA : draftB;
    if (cur !== undefined) {
      setSide(active, cur >= 10 ? Math.floor(cur / 10) : undefined);
      return;
    }
    if (active === "B") {
      setActive("A");
      if (draftA !== undefined) commit(draftA >= 10 ? Math.floor(draftA / 10) : undefined, draftB);
    }
  };

  const clear = () => {
    commit(undefined, undefined);
    setActive("A");
    setAutoAdvance(true);
    setFresh(true);
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t("scoreSheet.title", { teamA: teamAName, teamB: teamBName })}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <ScoreColumn
            label={teamAName}
            value={draftA}
            active={active === "A"}
            onSelect={() => select("A")}
            onChange={(n) => commit(n, draftB)}
          />
          <ScoreColumn
            label={teamBName}
            value={draftB}
            active={active === "B"}
            onSelect={() => select("B")}
            onChange={(n) => commit(draftA, n)}
          />
        </div>
        <p className="text-xs text-fg-muted text-center">{t("scoreSheet.hint")}</p>
        <Keypad onDigit={onDigit} onBackspace={onBackspace} />
        <div className="flex items-center justify-between gap-2 pt-2">
          <Button variant="ghost" size="md" onClick={clear}>
            {t("scoreSheet.clear")}
          </Button>
          <Button onClick={onClose} size="md">
            {t("scoreSheet.done")}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}

function ScoreColumn({
  label,
  value,
  active,
  onSelect,
  onChange,
}: {
  label: string;
  value: number | undefined;
  active: boolean;
  onSelect: () => void;
  onChange: (n: number | undefined) => void;
}) {
  const { t } = useTranslation();
  const display = value ?? "–";
  return (
    <div
      className={[
        "rounded-card border-2 p-2 text-center transition-colors",
        active ? "border-brand bg-brand-soft" : "border-border bg-surface-muted",
      ].join(" ")}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={active}
        aria-label={`${t("scoreSheet.select", { team: label })}: ${t("scoreSheet.teamScore", { team: label })} ${display}`}
        className="w-full rounded-md px-1 py-1"
      >
        <span className="block text-xs text-fg-muted truncate mb-1" title={label}>
          {label}
        </span>
        <span
          className="block serif text-5xl font-semibold tabular text-fg leading-none my-2 animate-score-pop"
          key={String(value)}
        >
          {display}
        </span>
      </button>
      <div className="flex items-center justify-center gap-2 mt-1">
        <button
          type="button"
          aria-label={t("scoreSheet.decrease", { team: label })}
          onClick={() => onChange(value === undefined ? 0 : Math.max(0, value - 1))}
          className="h-11 w-11 rounded-md border border-border-strong bg-surface text-fg-muted hover:bg-surface-sunken text-xl leading-none"
        >
          −
        </button>
        <button
          type="button"
          aria-label={t("scoreSheet.increase", { team: label })}
          onClick={() => onChange(Math.min(MAX_SCORE, (value ?? -1) + 1))}
          className="h-11 w-11 rounded-md border border-border-strong bg-surface text-fg-muted hover:bg-surface-sunken text-xl leading-none"
        >
          +
        </button>
      </div>
    </div>
  );
}

function Keypad({
  onDigit,
  onBackspace,
}: {
  onDigit: (d: number) => void;
  onBackspace: () => void;
}) {
  const { t } = useTranslation();
  const buttons = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const digitCls =
    "rounded-md bg-surface-sunken hover:bg-surface-muted active:bg-brand-soft active:text-brand-soft-fg text-2xl font-semibold tabular py-3 transition-colors min-h-[56px]";
  return (
    <div className="grid grid-cols-3 gap-2">
      {buttons.map((d) => (
        <button key={d} type="button" onClick={() => onDigit(d)} className={digitCls}>
          {d}
        </button>
      ))}
      <button
        type="button"
        onClick={onBackspace}
        className="rounded-md bg-surface-sunken hover:bg-surface-muted text-base text-fg-muted py-3 transition-colors min-h-[56px]"
        aria-label={t("scoreSheet.backspace")}
      >
        ⌫
      </button>
      <button type="button" onClick={() => onDigit(0)} className={digitCls}>
        0
      </button>
      <span aria-hidden />
    </div>
  );
}
