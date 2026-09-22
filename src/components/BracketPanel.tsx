import { useCallback, useMemo } from "react";
import { type TranslationKey, useTranslation } from "../i18n";
import { humanMatchLabel, resolveBracket } from "../knockoutScheduler";
import { groupRankLookup } from "../structure";
import type { Tournament } from "../types";
import { EmptyState } from "./EmptyState";
import { ScoreInput } from "./ScoreInput";

interface Props {
  tournament: Tournament;
  onScore: (matchId: string, a: number | undefined, b: number | undefined) => void;
}

export function BracketPanel({ tournament, onScore }: Props) {
  const { t } = useTranslation();
  const groupWinners = useMemo(() => groupRankLookup(tournament), [tournament]);

  const entryName = useCallback(
    (id: string) => tournament.entries.find((e) => e.id === id)?.name ?? "?",
    [tournament.entries],
  );

  const resolved = useMemo(
    () => resolveBracket(tournament.bracket, entryName, groupWinners, t),
    [tournament.bracket, entryName, groupWinners, t],
  );

  if (tournament.format === "knockout" && tournament.entries.length < 2) {
    return (
      <EmptyState
        icon="🏆"
        title={t("bracket.empty.title")}
        description={t("bracket.empty.descriptionKo")}
      />
    );
  }
  if (tournament.format === "groups-ko" && tournament.entries.length < 2) {
    return (
      <EmptyState
        icon="🏆"
        title={t("bracket.empty.title")}
        description={t("bracket.empty.descriptionGroupsKo")}
      />
    );
  }

  // Group resolved matches by round
  const rounds = new Map<number, typeof resolved>();
  for (const m of resolved) {
    if (!rounds.has(m.round)) rounds.set(m.round, []);
    rounds.get(m.round)?.push(m);
  }
  const roundNumbers = Array.from(rounds.keys()).sort((a, b) => a - b);
  // Empty when there are no resolved matches yet.
  const lastRound = roundNumbers[roundNumbers.length - 1] ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span>
          {(() => {
            const byes = resolved.filter((m) => m.isByeMatch).length;
            if (byes === 0) return t("bracket.summary", { count: resolved.length });
            const key: TranslationKey =
              byes === 1 ? "bracket.summaryByes" : "bracket.summaryByesPlural";
            return t(key, { count: resolved.length, byes });
          })()}
        </span>
      </div>

      <div className="overflow-x-auto">
        <div className="flex gap-4 2xl:gap-8 min-w-fit pb-2">
          {roundNumbers.map((rn) => {
            // roundNumbers is derived from `rounds`, so the key always exists.
            const matches = rounds.get(rn) ?? [];
            return (
              <div key={rn} className="min-w-[16rem] 2xl:min-w-[24rem]">
                <h3 className="text-sm 2xl:text-lg font-semibold mb-2 text-fg-muted">
                  {roundLabel(t, rn, lastRound, matches.length)}
                </h3>
                <div className="space-y-2">
                  {matches.map((m) => (
                    <BracketCard key={m.matchId} m={m} onScore={onScore} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function roundLabel(
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string,
  round: number,
  last: number,
  matchCount: number,
) {
  if (round === last)
    return matchCount === 2 ? t("bracket.roundFinalThird") : t("bracket.roundFinal");
  if (round === last - 1) return t("bracket.roundSemi");
  if (round === last - 2) return t("bracket.roundQuarter");
  if (round === last - 3) return t("bracket.roundEighth");
  return t("bracket.roundOther", { n: round, count: matchCount });
}

function BracketCard({
  m,
  onScore,
}: {
  m: ReturnType<typeof resolveBracket>[number];
  onScore: Props["onScore"];
}) {
  const { t } = useTranslation();
  const aWinning = m.winner != null && m.winner === m.entryA;
  const bWinning = m.winner != null && m.winner === m.entryB;
  const isTie = !m.isByeMatch && m.scoreA != null && m.scoreB != null && m.scoreA === m.scoreB;
  const hasA = m.scoreA != null;
  const hasB = m.scoreB != null;
  const status: "pending" | "partial" | "complete" = m.isByeMatch
    ? "complete"
    : hasA && hasB
      ? "complete"
      : hasA || hasB
        ? "partial"
        : "pending";
  const editable = !m.isByeMatch && m.entryA != null && m.entryB != null;
  const accent =
    !m.isByeMatch && status === "complete"
      ? "border-l-4 border-l-brand"
      : status === "partial"
        ? "border-l-4 border-l-warn-fg"
        : "";

  return (
    <div className={`rounded-md border border-border bg-surface p-2 text-sm ${accent}`}>
      <div className="flex items-center justify-between gap-2 mb-1 text-xs">
        <span className="text-fg-muted">
          {m.matchId === "3P" ? t("bracket.thirdPlace") : humanMatchLabel(m.matchId, t)}
        </span>
        {m.isByeMatch && (
          <span className="rounded bg-fg-subtle/20 text-fg-muted px-2 py-0.5 text-[10px] uppercase tracking-wide font-medium">
            {t("bracket.bye")}
          </span>
        )}
        {!m.isByeMatch && status === "complete" && (
          <span className="rounded-full bg-brand-soft text-brand-soft-fg px-2 py-0.5 text-[10px] uppercase tracking-wide">
            {t("schedule.statusComplete")}
          </span>
        )}
        {!m.isByeMatch && status === "partial" && (
          <span className="rounded-full bg-warn-bg text-warn-fg px-2 py-0.5 text-[10px] uppercase tracking-wide">
            {t("schedule.statusPartial")}
          </span>
        )}
      </div>
      <SlotRow
        label={m.pendingA}
        score={m.scoreA}
        editable={editable}
        winning={aWinning}
        ariaLabel={t("schedule.scoreAria", { team: m.pendingA })}
        onChange={(a) => onScore(m.matchId, a, m.scoreB)}
      />
      <SlotRow
        label={m.pendingB}
        score={m.scoreB}
        editable={editable}
        winning={bWinning}
        ariaLabel={t("schedule.scoreAria", { team: m.pendingB })}
        onChange={(b) => onScore(m.matchId, m.scoreA, b)}
      />
      {!m.isByeMatch && !editable && (
        <p className="mt-1 text-xs text-fg-subtle">{t("bracket.waiting")}</p>
      )}
      {isTie && (
        <p
          role="alert"
          className="mt-1 text-xs text-danger-fg bg-danger-bg border border-danger-fg/30 rounded px-2 py-1"
        >
          {t("bracket.tieWarning")}
        </p>
      )}
    </div>
  );
}

function SlotRow({
  label,
  score,
  editable,
  winning,
  ariaLabel,
  onChange,
}: {
  label: string;
  score?: number;
  editable: boolean;
  winning: boolean;
  ariaLabel: string;
  onChange: (next: number | undefined) => void;
}) {
  return (
    <div
      className={
        "flex items-center justify-between gap-2 px-2 py-1 rounded " +
        (winning ? "bg-brand-soft font-semibold" : "")
      }
    >
      <span className="truncate" title={label}>
        {label}
      </span>
      <ScoreInput value={score} onChange={onChange} disabled={!editable} ariaLabel={ariaLabel} />
    </div>
  );
}
