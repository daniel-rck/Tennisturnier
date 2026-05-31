import { useMemo } from "react";
import { useTranslation } from "../i18n";
import type { BellVariant, Player, Round, Tournament } from "../types";
import { MODE_KEYS } from "../types";
import { EmptyState } from "./EmptyState";
import { MatchCard } from "./MatchCard";
import { RoundTimer } from "./RoundTimer";
import { Spinner } from "./Spinner";
import { Avatar } from "./ui/Avatar";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { Pill } from "./ui/Pill";

interface Props {
  tournament: Tournament;
  onGenerate: () => void;
  onTimerMinutes: (n: number) => void;
  onBellVariant: (v: BellVariant) => void;
  onScore: (
    roundIndex: number,
    court: number,
    a: number | undefined,
    b: number | undefined,
  ) => void;
  warnings: string[];
  isGenerating?: boolean;
}

export function SchedulePanel({
  tournament,
  onGenerate,
  onTimerMinutes,
  onBellVariant,
  onScore,
  warnings,
  isGenerating = false,
}: Props) {
  const { t } = useTranslation();
  const playerById = useMemo(
    () => new Map(tournament.players.map((p) => [p.id, p])),
    [tournament.players],
  );

  const stats = useMemo(
    () => computeStats(tournament.schedule, tournament.players),
    [tournament.schedule, tournament.players],
  );

  return (
    <div className="space-y-4">
      <Card variant="flat" className="p-3">
        <RoundTimer
          minutes={tournament.timerMinutes}
          onMinutesChange={onTimerMinutes}
          bellVariant={tournament.bellVariant}
          onBellVariantChange={onBellVariant}
        />
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={onGenerate}
          disabled={tournament.players.length < 4 || isGenerating}
          variant="primary"
        >
          {isGenerating && <Spinner />}
          {isGenerating ? t("schedule.generating") : t("schedule.generate")}
        </Button>
        <div className="text-sm text-fg-muted tabular">
          {t("schedule.modeSummary", {
            mode: t(MODE_KEYS[tournament.mode]),
            courts: tournament.courts,
            rounds: tournament.rounds,
          })}
        </div>
      </div>

      {tournament.players.length < 4 && (
        <div
          role="status"
          className="rounded-md bg-warn-bg border border-warn-fg/30 px-3 py-2 text-sm text-warn-fg"
        >
          {t("schedule.minPlayersWarning")}
        </div>
      )}

      {warnings.length > 0 && (
        <ul role="status" aria-live="polite" className="space-y-1">
          {warnings.map((w) => (
            <li
              key={w}
              className="rounded-md bg-warn-bg border border-warn-fg/30 px-3 py-2 text-sm text-warn-fg"
            >
              {w}
            </li>
          ))}
        </ul>
      )}

      {tournament.schedule.length === 0 ? (
        <EmptyState
          icon="📋"
          title={t("schedule.empty.title")}
          description={
            tournament.players.length < 4
              ? t("schedule.empty.descriptionMin")
              : t("schedule.empty.descriptionGenerate")
          }
          action={
            tournament.players.length >= 4 && (
              <Button onClick={onGenerate} disabled={isGenerating}>
                {isGenerating && <Spinner />}
                {isGenerating ? t("schedule.generating") : t("schedule.generate")}
              </Button>
            )
          }
        />
      ) : (
        <>
          <div className="space-y-4">
            {tournament.schedule.map((round) => (
              <RoundBlock
                key={round.index}
                round={round}
                byId={playerById}
                expectedCourts={tournament.courts}
                onScore={onScore}
              />
            ))}
          </div>

          <details className="group text-sm rounded-card border border-border bg-surface overflow-hidden">
            <summary className="cursor-pointer list-none flex items-center gap-2 px-3 py-2.5 text-fg-muted hover:text-fg hover:bg-surface-muted">
              <span aria-hidden className="inline-block transition-transform group-open:rotate-90">
                ▸
              </span>
              <span className="font-medium">{t("schedule.statsSummary")}</span>
            </summary>
            <div className="px-3 pb-3 pt-2 border-t border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-fg-muted text-xs uppercase tracking-wider">
                    <th className="py-1.5 font-semibold">{t("schedule.statsCol.name")}</th>
                    <th className="py-1.5 font-semibold tabular">{t("schedule.statsCol.plays")}</th>
                    <th className="py-1.5 font-semibold tabular">{t("schedule.statsCol.rests")}</th>
                    <th className="py-1.5 font-semibold tabular">
                      {t("schedule.statsCol.partners")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((s) => (
                    <tr key={s.id} className="border-t border-border">
                      <td className="py-1.5">{s.name}</td>
                      <td className="py-1.5 tabular">{s.plays}</td>
                      <td className="py-1.5 tabular">{s.rests}</td>
                      <td className="py-1.5 tabular">{s.uniquePartners}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}
    </div>
  );
}

function RoundBlock({
  round,
  byId,
  expectedCourts,
  onScore,
}: {
  round: Round;
  byId: Map<string, Player>;
  expectedCourts: number;
  onScore: Props["onScore"];
}) {
  const { t } = useTranslation();
  const isPartial = round.matches.length < expectedCourts;
  const done = round.matches.filter((m) => m.scoreA != null && m.scoreB != null).length;
  return (
    <Card variant="base" className="p-3">
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <h3 className="serif text-lg font-semibold">{t("schedule.round", { n: round.index })}</h3>
          {isPartial && <Pill tone="warn">{t("schedule.partial")}</Pill>}
          <span className="text-xs text-fg-muted tabular">
            {done}/{round.matches.length}
          </span>
        </div>
        {round.resting.length > 0 && (
          <div className="flex items-center gap-1.5 max-w-full flex-wrap">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-fg-subtle">
              ⏸
            </span>
            {round.resting.map((id) => {
              const p = byId.get(id);
              if (!p) return null;
              return <Avatar key={id} name={p.name} gender={p.gender} size="xs" />;
            })}
          </div>
        )}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {round.matches.map((m) => (
          <MatchCard
            key={m.court}
            court={m.court}
            teamAName={m.teamA.players.map((id) => byId.get(id)?.name).join(" & ")}
            teamBName={m.teamB.players.map((id) => byId.get(id)?.name).join(" & ")}
            scoreA={m.scoreA}
            scoreB={m.scoreB}
            onChange={(a, b) => onScore(round.index, m.court, a, b)}
          />
        ))}
      </div>
    </Card>
  );
}

interface Stat {
  id: string;
  name: string;
  plays: number;
  rests: number;
  uniquePartners: number;
}

function computeStats(schedule: Round[], players: Player[]): Stat[] {
  const map = new Map<string, Stat & { partners: Set<string> }>();
  for (const p of players)
    map.set(p.id, {
      id: p.id,
      name: p.name,
      plays: 0,
      rests: 0,
      uniquePartners: 0,
      partners: new Set(),
    });
  for (const r of schedule) {
    for (const m of r.matches) {
      for (const team of [m.teamA.players, m.teamB.players]) {
        for (const id of team) {
          const s = map.get(id);
          if (!s) continue;
          s.plays++;
          for (const other of team) if (other !== id) s.partners.add(other);
        }
      }
    }
    for (const id of r.resting) {
      const s = map.get(id);
      if (s) s.rests++;
    }
  }
  return Array.from(map.values()).map((s) => ({
    id: s.id,
    name: s.name,
    plays: s.plays,
    rests: s.rests,
    uniquePartners: s.partners.size,
  }));
}
