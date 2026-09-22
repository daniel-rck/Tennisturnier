import { useAutoAnimate } from "@formkit/auto-animate/react";
import { useMemo } from "react";
import { assignGroups, groupStandings } from "../groupScheduler";
import { useConfirm } from "../hooks/useConfirm";
import { useTranslation } from "../i18n";
import { groupLetter } from "../knockoutScheduler";
import { groupsOf } from "../structure";
import type { Entry, GroupMatch, Tournament } from "../types";
import { EmptyState } from "./EmptyState";
import { ScoreInput } from "./ScoreInput";
import { NumberInput } from "./ui/NumberInput";

interface Props {
  tournament: Tournament;
  onScore: (
    group: number,
    matchIndex: number,
    a: number | undefined,
    b: number | undefined,
  ) => void;
  onSetGroupCount: (n: number) => void;
  onReshuffle: () => void;
}

export function GroupsPanel({ tournament, onScore, onSetGroupCount, onReshuffle }: Props) {
  const confirm = useConfirm();
  const { t } = useTranslation();
  const groups = useMemo(() => groupsOf(tournament), [tournament]);

  const { warnings } = useMemo(
    () => assignGroups(tournament.entries, tournament.groupCount, t),
    [tournament.entries, tournament.groupCount, t],
  );

  if (tournament.entries.length < 2) {
    return (
      <EmptyState
        icon="👥"
        title={t("groups.empty.title")}
        description={t("groups.empty.description")}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="groups-group-count" className="text-sm flex items-center gap-2">
          {t("setup.groupCount")}
          <NumberInput
            id="groups-group-count"
            value={tournament.groupCount}
            min={1}
            max={8}
            onChange={onSetGroupCount}
            className="w-16 rounded-md border border-border-strong px-2 py-1"
          />
        </label>
        <span className="text-sm text-fg-muted">
          {t("groups.summary", {
            count: tournament.entries.length,
            groups: tournament.groupCount,
          })}
        </span>
        <button
          type="button"
          onClick={async () => {
            const hasScores = tournament.groupSchedule.some(
              (m) => m.scoreA != null || m.scoreB != null,
            );
            if (hasScores) {
              const ok = await confirm({
                title: t("groups.reshuffleConfirm.title"),
                description: t("groups.reshuffleConfirm.description"),
                confirmLabel: t("groups.reshuffleConfirm.button"),
                destructive: true,
              });
              if (!ok) return;
            }
            onReshuffle();
          }}
          className="rounded border border-border-strong px-2 py-1 text-sm hover:border-brand-hover"
        >
          {t("groups.reshuffle")}
        </button>
      </div>

      {warnings.map((w) => (
        <div
          key={w}
          role="status"
          aria-live="polite"
          className="rounded-md bg-warn-bg border border-warn-bg px-3 py-2 text-sm text-warn-fg"
        >
          {w}
        </div>
      ))}

      {groups.map((group, gi) => {
        const groupNum = gi + 1;
        const matches = tournament.groupSchedule.filter((m) => m.group === groupNum);
        const standings = groupStandings(group, matches);
        return (
          <div key={groupNum} className="rounded-md border border-border bg-surface p-3">
            <h3 className="font-semibold mb-2">
              {t("groups.groupHeading", {
                letter: groupLetter(groupNum),
                count: group.length,
              })}
            </h3>

            <StandingsTable standings={standings} />

            <details className="group">
              <summary className="cursor-pointer list-none inline-flex items-center gap-2 text-sm text-fg-muted hover:text-fg">
                <span
                  aria-hidden
                  className="inline-block transition-transform group-open:rotate-90"
                >
                  ▸
                </span>
                {t("groups.matches", { count: matches.length })}
              </summary>
              <div className="mt-2 space-y-1">
                {matches.map((m) => (
                  <GroupMatchRow
                    key={`${m.group}-${m.matchIndex}`}
                    match={m}
                    entries={tournament.entries}
                    onScore={onScore}
                  />
                ))}
              </div>
            </details>
          </div>
        );
      })}
    </div>
  );
}

function GroupMatchRow({
  match,
  entries,
  onScore,
}: {
  match: GroupMatch;
  entries: Entry[];
  onScore: Props["onScore"];
}) {
  const { t } = useTranslation();
  const byId = new Map(entries.map((e) => [e.id, e]));
  const a = byId.get(match.entryA)?.name ?? "?";
  const b = byId.get(match.entryB)?.name ?? "?";
  const hasA = match.scoreA != null;
  const hasB = match.scoreB != null;
  const status: "pending" | "partial" | "complete" =
    hasA && hasB ? "complete" : hasA || hasB ? "partial" : "pending";
  const accent =
    status === "complete"
      ? "border-l-4 border-l-brand"
      : status === "partial"
        ? "border-l-4 border-l-warn-fg"
        : "border-l-4 border-l-transparent";
  return (
    <div
      className={
        "grid grid-cols-[1fr_auto_auto_auto_1fr] items-center gap-2 text-sm bg-surface-muted px-2 py-1 rounded " +
        accent
      }
    >
      <span className="truncate" title={a}>
        {a}
      </span>
      <ScoreInput
        value={match.scoreA}
        onChange={(scoreA) => onScore(match.group, match.matchIndex, scoreA, match.scoreB)}
        ariaLabel={t("schedule.scoreAria", { team: a })}
      />
      <span className="text-fg-subtle text-xs">:</span>
      <ScoreInput
        value={match.scoreB}
        onChange={(scoreB) => onScore(match.group, match.matchIndex, match.scoreA, scoreB)}
        ariaLabel={t("schedule.scoreAria", { team: b })}
      />
      <span className="truncate text-right" title={b}>
        {b}
      </span>
    </div>
  );
}

interface Standing {
  entryId: string;
  name: string;
  rank: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  gamesFor: number;
  gamesAgainst: number;
  diff: number;
}

function StandingsTable({ standings }: { standings: Standing[] }) {
  const { t } = useTranslation();
  const [bodyRef] = useAutoAnimate<HTMLTableSectionElement>();
  return (
    <div className="overflow-x-auto mb-3">
      <table className="w-full text-sm 2xl:text-base">
        <thead>
          <tr className="text-left text-fg-muted text-xs 2xl:text-sm">
            <th className="px-1 py-1 w-10">#</th>
            <th className="px-1 py-1">{t("ranking.col.name")}</th>
            <th className="px-1 py-1 text-right" title={t("ranking.col.played")}>
              <abbr title={t("ranking.col.played")} className="no-underline">
                {t("ranking.col.playedShort")}
              </abbr>
            </th>
            <th className="px-1 py-1 text-right" title={t("ranking.col.wins")}>
              <abbr title={t("ranking.col.wins")} className="no-underline">
                {t("ranking.col.winsShort")}
              </abbr>
            </th>
            <th className="px-1 py-1 text-right" title={t("ranking.col.draws")}>
              <abbr title={t("ranking.col.draws")} className="no-underline">
                {t("ranking.col.drawsShort")}
              </abbr>
            </th>
            <th className="px-1 py-1 text-right" title={t("ranking.col.losses")}>
              <abbr title={t("ranking.col.losses")} className="no-underline">
                {t("ranking.col.lossesShort")}
              </abbr>
            </th>
            <th className="px-1 py-1 text-right" title={t("ranking.col.gamesTitle")}>
              {t("ranking.col.gamesShort")}
            </th>
            <th className="px-1 py-1 text-right" title={t("ranking.col.diffTitle")}>
              {t("ranking.col.diff")}
            </th>
          </tr>
        </thead>
        <tbody ref={bodyRef}>
          {standings.map((s) => (
            <tr key={s.entryId} className="border-t border-border">
              <td className="px-1 py-1 font-semibold">{s.rank}.</td>
              <td className="px-1 py-1">{s.name}</td>
              <td className="px-1 py-1 text-right">{s.played}</td>
              <td className="px-1 py-1 text-right text-brand">{s.wins}</td>
              <td className="px-1 py-1 text-right text-fg-muted">{s.draws}</td>
              <td className="px-1 py-1 text-right text-danger-fg">{s.losses}</td>
              <td className="px-1 py-1 text-right tabular-nums">
                {s.gamesFor}:{s.gamesAgainst}
              </td>
              <td className="px-1 py-1 text-right tabular-nums font-medium">
                {s.diff > 0 ? "+" : ""}
                {s.diff}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
